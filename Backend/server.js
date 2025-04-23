const express = require('express');
const mysql = require('mysql2/promise');
const bodyParser = require('body-parser');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const path = require('path');
const cookieParser = require('cookie-parser');
const crypto = require('crypto');
const app = express();



class AnnouncementSubject {
  constructor() {
    this.observers = new Map();
  }

  subscribe(userId, res) {
    this.observers.set(userId, res);
    console.log(`User ${userId} subscribed to announcements`);
  }

  
  unsubscribe(userId) {
    this.observers.delete(userId);
    console.log(`User ${userId} unsubscribed from announcements`);
  }

  
  notify(announcement) {
    this.observers.forEach((res, userId) => {
      try {
        res.write(`data: ${JSON.stringify(announcement)}\n\n`);
      } catch (e) {
        console.error(`Error sending announcement to user ${userId}:`, e);
        this.unsubscribe(userId);
      }
    });
  }
}


const announcementSubject = new AnnouncementSubject();


app.get('/api/announcements/stream', authenticate, (req, res) => {
  const userId = req.user.id;
  
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  
  announcementSubject.subscribe(userId, res);


  const heartbeat = setInterval(() => {
    res.write(':heartbeat\n\n');
  }, 30000);


  req.on('close', () => {
    clearInterval(heartbeat);
    announcementSubject.unsubscribe(userId);
  });
});


app.post('/api/announcements', authenticate, authorize(['admin']), async (req, res) => {
  try {
    const { title, message } = req.body;
    
    if (!title || !message) {
      return res.status(400).json({ error: 'Title and message are required' });
    }

    const announcement = {
      id: Date.now().toString(),
      title,
      message,
      date: new Date().toISOString(),
      adminId: req.user.id,
      adminName: req.user.name
    };

    
    await pool.execute(
      'INSERT INTO announcements (id, title, message, adminId, date) VALUES (?, ?, ?, ?, ?)',
      [announcement.id, announcement.title, announcement.message, announcement.adminId, announcement.date]
    );

    
    announcementSubject.notify(announcement);

    res.status(201).json(announcement);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


app.get('/api/announcements', authenticate, async (req, res) => {
  try {
    const [announcements] = await pool.execute(
      'SELECT a.*, ad.name AS adminName FROM announcements a JOIN admin ad ON a.adminId = ad.adminID ORDER BY a.date DESC LIMIT 20'
    );
    res.json(announcements);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});



class UserFactory {
  static async createUser(type, userData) {
    const hashedPassword = await bcrypt.hash(userData.password, 10);
    const baseUser = {
      name: userData.name,
      email: userData.email,
      password: hashedPassword,
      gender: userData.gender || null,
      age: userData.age ? parseInt(userData.age) : null,
      ethnicity: userData.ethnicity || null,
      mobileNumber: userData.mobileNumber
    };

    switch(type) {
      case 'member':
        const packageMap = { standard: 1, premium: 2, vip: 3 };
        const workoutMap = {
          weight_gain: 1, weight_loss: 2, muscle_building: 3,
          stamina_building: 4, strength_building: 5
        };
        
        return {
          ...baseUser,
          username: userData.username,
          packageID: packageMap[userData.package] || 1,
          workoutPlanID: workoutMap[userData.workout] || 1,
          role: 'member'
        };

      case 'trainer':
        return {
          ...baseUser,
          username: userData.username,
          role: 'trainer',
          specialization: userData.specialization || 'General Fitness'
        };

      case 'admin':
        return {
          ...baseUser,
          username: userData.username,
          role: 'admin'
        };

      default:
        throw new Error('Invalid user type');
    }
  }
}



app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));
app.use(bodyParser.json());
app.use(cookieParser());
app.use(express.static(path.join(__dirname, '../frontend')));


const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'gym_management',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});


async function testDatabaseConnection() {
  try {
    const [rows] = await pool.execute('SELECT 1 + 1 AS solution');
    console.log('Database connected successfully. Test query result:', rows[0].solution);
  } catch (error) {
    console.error('Database connection failed:', error);
    process.exit(1); 
  }
}

testDatabaseConnection();


const JWT_SECRET = process.env.JWT_SECRET || 'your_secure_secret_key_here';
const JWT_EXPIRES_IN = '1h';


function authenticate(req, res, next) {
  let token;
  
  
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  }
  
  else if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
  }
  
  if (!token) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    
    req.user = user;
    next();
  });
}

function authorize(roles = []) {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Unauthorized access' });
    }
    next();
  };
}


app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/Homepage.html'));
});

app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/login.html'));
});

app.get('/classes', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/Classes.html'));
});

app.get('/signup', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/MemberSignUp.html'));
});

app.get('/payment', authenticate, (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/Payment.html'));
});

app.get('/premium', authenticate, (req, res) => {
  if (req.user.role === 'member' && (req.user.packageName === 'premium' || req.user.packageName === 'vip')) {
    res.sendFile(path.join(__dirname, '../frontend/PreViPDash.html'));
  } else {
    res.status(403).json({ error: 'Unauthorized access' });
  }
});

app.get('/standard', authenticate, (req, res) => {
  if (req.user.role === 'member' && req.user.packageName === 'standard') {
    res.sendFile(path.join(__dirname, '../frontend/StandardDash.html'));
  } else {
    res.status(403).json({ error: 'Unauthorized access' });
  }
});


app.post('/api/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    let user = null;
    let userType = '';
    
   
    const [admin] = await pool.execute(
      'SELECT * FROM admin WHERE username = ?', 
      [username]
    );
    
    if (admin.length > 0) {
      user = admin[0];
      userType = 'admin';
      
     
      const passwordMatch = await bcrypt.compare(password, user.password);
      if (!passwordMatch) {
        return res.status(401).json({ error: 'Invalid username or password' });
      }
    } else {
     
      const [member] = await pool.execute(
        `SELECT m.*, p.packageName 
         FROM member m
         LEFT JOIN package p ON m.packageID = p.packageID
         WHERE m.username = ? OR m.email = ?`,
        [username, username]
      );
      
      if (member.length > 0) {
        user = member[0];
        userType = 'member';
        
      
        let passwordMatch = false;
        if (user.password.startsWith('$2a$') || user.password.startsWith('$2b$')) {
          passwordMatch = await bcrypt.compare(password, user.password);
        } else {
          const hash = crypto.createHash('sha256').update(password).digest('hex');
          passwordMatch = (hash === user.password);
        }
        
        if (!passwordMatch) {
          return res.status(401).json({ error: 'Invalid username or password' });
        }
      } else {
       
        const [trainer] = await pool.execute(
          'SELECT * FROM trainer WHERE username = ? OR email = ?',
          [username, username]
        );
        
        if (trainer.length > 0) {
          user = trainer[0];
          userType = 'trainer';
          

          let passwordMatch = false;
          if (user.password.startsWith('$2a$') || user.password.startsWith('$2b$')) {
            passwordMatch = await bcrypt.compare(password, user.password);
          } else {
            const hash = crypto.createHash('sha256').update(password).digest('hex');
            passwordMatch = (hash === user.password);
          }
          
          if (!passwordMatch) {
            return res.status(401).json({ error: 'Invalid username or password' });
          }
        }
      }
    }

    if (!user) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    
    const tokenPayload = {
      id: user.memberID || user.trainerID || user.adminID,
      email: user.email,
      name: user.name,
      role: userType,
      packageName: user.packageName ? user.packageName.toLowerCase() : 'standard'
    };

    const token = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
    
    
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 3600000
    }).json({
      token,
      user: {
        id: tokenPayload.id,
        name: user.name,
        email: user.email,
        role: userType,
        packageID: user.packageID,
        packageName: tokenPayload.packageName
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ 
      error: 'Server error during login',
      details: error.message 
    });
  }
});

app.post('/api/logout', (req, res) => {

  res.clearCookie('token', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/' 
  });
  
 
  res.json({ message: 'Logged out successfully' });
});


app.post('/api/register-trainer', authenticate, authorize(['admin']), async (req, res) => {
  try {
    const formData = req.body;
    
    
    if (!formData.name || !formData.username || !formData.email || !formData.password) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    
    const trainerData = await UserFactory.createUser('trainer', formData);
    
    const [result] = await pool.execute(
      `INSERT INTO trainer SET ?`,
      trainerData
    );

    res.status(201).json({
      message: 'Trainer registered successfully',
      user: {
        id: result.insertId,
        name: trainerData.name,
        email: trainerData.email,
        role: 'trainer'
      }
    });
  } catch (error) {
    res.status(500).json({ 
      error: 'Trainer registration failed',
      details: error.message 
    });
  }
});





app.post('/api/register-admin', authenticate, authorize(['admin']), async (req, res) => {
  try {
    const { name, username, email, password } = req.body;

    if (!name || !username || !email || !password) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    
    const adminData = await UserFactory.createUser('admin', req.body);
    
    const [result] = await pool.execute(
      `INSERT INTO admin SET ?`,
      adminData
    );

    res.status(201).json({
      message: 'Admin registered successfully',
      user: {
        id: result.insertId,
        name: adminData.name,
        email: adminData.email,
        role: 'admin'
      }
    });
  } catch (error) {
    res.status(500).json({ 
      error: 'Admin registration failed',
      details: error.message 
    });
  }
});


app.post('/api/register', async (req, res) => {
  try {
    const { name, username, email, password, gender, age, ethnicity, mobileNumber,weight, height, package: pkg, workout } = req.body;

   
    const requiredFields = ['name', 'username', 'email', 'password', 'mobileNumber', 'weight', 'height', 'package', 'workout'];
    const missingFields = requiredFields.filter(field => !req.body[field]);
    
    if (missingFields.length > 0) {
      return res.status(400).json({ 
        error: 'Missing required fields',
        missingFields 
      });
    }

    
    const [existingEmail] = await pool.execute('SELECT email FROM member WHERE email = ?', [email]);
    const [existingUsername] = await pool.execute('SELECT username FROM member WHERE username = ?', [username]);

    if (existingEmail.length > 0) return res.status(409).json({ error: 'Email already registered' });
    if (existingUsername.length > 0) return res.status(409).json({ error: 'Username already taken' });

    
    const memberData = await UserFactory.createUser('member', req.body);
    
    
    const [result] = await pool.execute(
      `INSERT INTO member 
       (name, username, email, password, gender, age, ethnicity, mobileNumber, packageID, workoutPlanID, weight, height) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        memberData.name,
        memberData.username,
        memberData.email,
        memberData.password,
        memberData.gender,
        memberData.age,
        memberData.ethnicity,
        memberData.mobileNumber,
        memberData.packageID,
        memberData.workoutPlanID,
        weight, 
        height   
      ]
    );

    
    const tokenPayload = {
      id: result.insertId,
      email: memberData.email,
      name: memberData.name,
      role: 'member',
      packageName: pkg
    };

    const token = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

    res.status(201).json({
      message: 'Member registered successfully',
      token,
      user: tokenPayload
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ 
      error: 'Registration failed', 
      details: error.message 
    });
  }
});



app.get('/api/check-username', async (req, res) => {
  try {
    const { username } = req.query;
    
    if (!username) {
      return res.status(400).json({ error: 'Username is required' });
    }

    const [existing] = await pool.execute(
      'SELECT username FROM member WHERE username = ?',
      [username]
    );

    res.json({ available: existing.length === 0 });
    
  } catch (error) {
    console.error('Username check error:', error);
    res.status(500).json({ error: 'Error checking username availability' });
  }
});


app.get('/admin', authenticate, authorize(['admin']), (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/AdminDash.html'));
});


app.get('/standard', authenticate, (req, res) => {
  
  if (req.user.role === 'member' && req.user.packageName === 'standard') {
    res.sendFile(path.join(__dirname, '../frontend/StandardDash.html'));
  } else {
    res.status(403).json({ error: 'Unauthorized access' });
  }
});


app.get('/premium', authenticate, (req, res) => {

  if (req.user.role === 'member' && (req.user.packageName === 'premium' || req.user.package === 'vip')) {
    res.sendFile(path.join(__dirname, '../frontend/PreViPDash.html'));
  } else {
    res.status(403).json({ error: 'Unauthorized access' });
  }
});


app.get('/trainer-dashboard', authenticate, authorize(['trainer']), (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/TrainerDash.html'));
});

// Member Routes
app.get('/api/members', authenticate, authorize(['admin']), async (req, res) => {
  try {
    const [members] = await pool.execute(`
      SELECT m.*, p.packageName 
      FROM member m
      LEFT JOIN package p ON m.packageID = p.packageID
    `);
    res.json(members);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/members/:id', authenticate, async (req, res) => {
  try {
    
    if (req.user.role !== 'admin' && req.user.id !== parseInt(req.params.id)) {
      return res.status(403).json({ error: 'Unauthorized access' });
    }

    const [member] = await pool.execute(
      `SELECT m.*, p.packageName, w.planName 
       FROM member m
       LEFT JOIN package p ON m.packageID = p.packageID
       LEFT JOIN workoutplan w ON m.workoutPlanID = w.workoutPlanID
       WHERE m.memberID = ?`,
      [req.params.id]
    );

    if (member.length === 0) {
      return res.status(404).json({ error: 'Member not found' });
    }

    res.json(member[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


app.post('/api/member/update-profile', authenticate, async (req, res) => {
  try {
      const memberId = req.user.id;
      const { name, email, mobileNumber, dob, gender, package, workout } = req.body;

      
      const packageMap = { standard: 1, premium: 2, vip: 3 };
      const workoutMap = {
          weight_gain: 1, weight_loss: 2, muscle_building: 3,
          stamina_building: 4, strength_building: 5
      };

      const packageID = packageMap[package] || 1;
      const workoutPlanID = workoutMap[workout] || 1;

      await pool.execute(
          `UPDATE member SET 
              name = ?, 
              email = ?, 
              mobileNumber = ?, 
              dob = ?, 
              gender = ?, 
              packageID = ?, 
              workoutPlanID = ? 
          WHERE memberID = ?`,
          [name, email, mobileNumber, dob, gender, packageID, workoutPlanID, memberId]
      );

      res.json({ message: 'Profile updated successfully' });
  } catch (error) {
      console.error('Profile update error:', error);
      res.status(500).json({ error: 'Failed to update profile' });
  }
});


app.post('/api/classes/book', authenticate, async (req, res) => {
  try {
      const memberId = req.user.id;
      const { classType, classDate, classTime, classTrainer } = req.body;

      
      const [classes] = await pool.execute(
          `SELECT classID FROM class 
           WHERE className LIKE ? AND date = ? AND time BETWEEN ? AND ?`,
          [`%${classType}%`, classDate, `${classTime.split(' ')[0]}:00:00`, `${classTime.split(' ')[0]}:59:59`]
      );

      if (classes.length === 0) {
          return res.status(404).json({ error: 'No matching class found' });
      }

      const classId = classes[0].classID;

      
      await pool.execute(
          `INSERT INTO member_class (memberID, classID, bookingDate) 
           VALUES (?, ?, NOW())`,
          [memberId, classId]
      );

      res.json({ message: 'Class booked successfully' });
  } catch (error) {
      console.error('Class booking error:', error);
      res.status(500).json({ error: 'Failed to book class' });
  }
});


app.post('/api/trainer-sessions/book', authenticate, async (req, res) => {
  try {
      const memberId = req.user.id;
      const { trainer, sessionDate, sessionTime, sessionGoal, sessionNotes } = req.body;

      
      await pool.execute(
          `INSERT INTO trainer_sessions 
           (memberID, trainerID, sessionDate, sessionTime, goal, notes, status) 
           VALUES (?, ?, ?, ?, ?, ?, 'booked')`,
          [memberId, trainer.split('trainer')[1], sessionDate, sessionTime, sessionGoal, sessionNotes]
      );

      res.json({ message: 'Trainer session booked successfully' });
  } catch (error) {
      console.error('Trainer session booking error:', error);
      res.status(500).json({ error: 'Failed to book trainer session' });
  }
});


app.post('/api/payments/process', authenticate, async (req, res) => {
  try {
      const memberId = req.user.id;
      const { amount, paymentMethod, cardNumber, expiryDate, cvv } = req.body;

     

      await pool.execute(
          `INSERT INTO payment 
           (memberID, amount, paymentDate, status, paymentMethod) 
           VALUES (?, ?, NOW(), 'completed', ?)`,
          [memberId, amount, paymentMethod]
      );

      res.json({ message: 'Payment processed successfully' });
  } catch (error) {
      console.error('Payment processing error:', error);
      res.status(500).json({ error: 'Payment failed' });
  }
});


app.get('/api/member/upcoming-classes', authenticate, async (req, res) => {
  try {
      console.log(`Fetching classes for member ${req.user.id}`);
      
      const [classes] = await pool.execute(
          `SELECT c.className, c.date, c.time, t.name AS trainerName, mc.bookingID 
           FROM member_class mc
           JOIN class c ON mc.classID = c.classID
           JOIN trainer t ON c.trainerID = t.trainerID
           WHERE mc.memberID = ? AND c.date >= CURDATE() AND mc.status = 'booked'
           ORDER BY c.date, c.time`,
          [req.user.id]
      );
      
      console.log(`Found ${classes.length} classes`);
      res.json(classes);
      
  } catch (error) {
      console.error('Database error:', error);
      res.status(500).json({ 
          error: 'Failed to load classes',
          details: error.message,
          sql: error.sql 
      });
  }
});


app.get('/api/member/upcoming-sessions', authenticate, async (req, res) => {
  try {
      const [sessions] = await pool.execute(
          `SELECT ts.sessionID, ts.sessionDate, ts.sessionTime, ts.goal, 
                  t.name AS trainerName
           FROM trainer_sessions ts
           JOIN trainer t ON ts.trainerID = t.trainerID
           WHERE ts.memberID = ? AND ts.status = 'booked'
           ORDER BY ts.sessionDate, ts.sessionTime`,
          [req.user.id]
      );
      res.json(sessions);
  } catch (error) {
      res.status(500).json({ error: error.message });
  }
});


app.get('/api/member/payment-history', authenticate, async (req, res) => {
  try {
      const [payments] = await pool.execute(
          `SELECT * FROM payment 
           WHERE memberID = ?
           ORDER BY paymentDate DESC`,
          [req.user.id]
      );
      res.json(payments);
  } catch (error) {
      res.status(500).json({ error: error.message });
  }
});


app.get('/api/member/profile', authenticate, async (req, res) => {
  try {
      const [member] = await pool.execute(
          `SELECT m.*, w.planName, w.equipmentList 
           FROM member m
           LEFT JOIN workoutplan w ON m.workoutPlanID = w.workoutPlanID
           WHERE m.memberID = ?`,
          [req.user.id]
      );
      
      if (member.length === 0) {
          return res.status(404).json({ error: 'Member not found' });
      }
      
      
      const memberData = member[0];
      if (memberData.equipmentList && typeof memberData.equipmentList === 'string') {
          memberData.equipmentList = memberData.equipmentList.replace(/,/g, ', ');
      }
      
      res.json(memberData);
  } catch (error) {
      console.error('Profile error:', error);
      res.status(500).json({ 
          error: 'Failed to load profile',
          details: error.message 
      });
  }
});
      


app.delete('/api/classes/cancel/:bookingId', authenticate, async (req, res) => {
  try {
      
      const [booking] = await pool.execute(
          'SELECT memberID FROM member_class WHERE bookingID = ?',
          [req.params.bookingId]
      );
      
      if (booking.length === 0 || booking[0].memberID !== req.user.id) {
          return res.status(403).json({ error: 'Unauthorized' });
      }

      await pool.execute(
          'UPDATE member_class SET status = "cancelled" WHERE bookingID = ?',
          [req.params.bookingId]
      );

      res.json({ message: 'Class cancelled successfully' });
  } catch (error) {
      res.status(500).json({ error: error.message });
  }
});


app.delete('/api/trainer-sessions/cancel/:sessionId', authenticate, async (req, res) => {
  try {
     
      const [session] = await pool.execute(
          'SELECT memberID FROM trainer_sessions WHERE sessionID = ?',
          [req.params.sessionId]
      );
      
      if (session.length === 0 || session[0].memberID !== req.user.id) {
          return res.status(403).json({ error: 'Unauthorized' });
      }

      await pool.execute(
          'UPDATE trainer_sessions SET status = "cancelled" WHERE sessionID = ?',
          [req.params.sessionId]
      );

      res.json({ message: 'Session cancelled successfully' });
  } catch (error) {
      res.status(500).json({ error: error.message });
  }
});


app.get('/api/classes', async (req, res) => {
  try {
    const [classes] = await pool.execute(`
      SELECT c.*, t.name AS trainerName 
      FROM class c
      JOIN trainer t ON c.trainerID = t.trainerID
      WHERE c.date >= CURDATE()
      ORDER BY c.date, c.time
    `);
    res.json(classes);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/classes', authenticate, authorize(['admin']), async (req, res) => {
  try {
    const { className, time, date, trainerID } = req.body;
    
    const [result] = await pool.execute(
      `INSERT INTO class (className, time, date, trainerID) 
       VALUES (?, ?, ?, ?)`,
      [className, time, date, trainerID]
    );

    res.status(201).json({
      message: 'Class created successfully',
      classID: result.insertId
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


app.get('/api/trainers', async (req, res) => {
  try {
    const [trainers] = await pool.execute('SELECT * FROM trainer');
    res.json(trainers);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


app.get('/api/payments/:memberId', authenticate, async (req, res) => {
  try {
    
    if (req.user.role !== 'admin' && req.user.id !== parseInt(req.params.memberId)) {
      return res.status(403).json({ error: 'Unauthorized access' });
    }

    const [payments] = await pool.execute(
      `SELECT p.*, m.name AS memberName 
       FROM payment p
       JOIN member m ON p.memberID = m.memberID
       WHERE p.memberID = ?`,
      [req.params.memberId]
    );

    res.json(payments);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


app.get('/api/workout-plans', async (req, res) => {
  try {
    const [plans] = await pool.execute('SELECT * FROM workoutplan');
    res.json(plans);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


app.get('/api/packages', async (req, res) => {
  try {
    const [packages] = await pool.execute('SELECT * FROM package');
    res.json(packages);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


app.get('/api/protected', authenticate, (req, res) => {
  res.json({ 
    message: 'This is protected data', 
    user: req.user 
  });
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error' });
});


app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});


const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log('\nAvailable Frontend Routes:');
  console.log(`- Homepage:        http://localhost:${PORT}/`);
  console.log(`- Login:           http://localhost:${PORT}/login`);
  console.log(`- Admin Dashboard: http://localhost:${PORT}/admin`);
  console.log(`- Classes:         http://localhost:${PORT}/classes`);
  console.log(`- Member Signup:   http://localhost:${PORT}/signup`);
  console.log(`- Payment:         http://localhost:${PORT}/payment`);
  console.log(`- Premium Dashboard: http://localhost:${PORT}/premium`);
  console.log(`- Standard Dashboard: http://localhost:${PORT}/standard`);
});