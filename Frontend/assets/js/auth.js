
const API_BASE_URL = 'http://localhost:3000';

class AuthManager {
  constructor() {
    if (AuthManager.instance) {
      return AuthManager.instance;
    }
    AuthManager.instance = this;

    
    const token = localStorage.getItem('authToken');
    if (token) {
      this.setAuthHeader(token);
    }

    this.initActivityTracker();
    return this;
  }

  async loginUser(username, password) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username, password }),
        credentials: 'include'
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Login failed');
      }

      this.storeAuthData(data.token, data.user);
      return data;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  }

  storeAuthData(token, user) {
    localStorage.setItem('authToken', token);
    localStorage.setItem('user', JSON.stringify(user));
    localStorage.setItem('lastActivity', new Date().getTime());
    this.setAuthHeader(token);
  }

  setAuthHeader(token) {
    
    this.token = token;
  }

  clearAuthData() {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    localStorage.removeItem('lastActivity');
    this.token = null;
  }

  redirectBasedOnRole(user) {
    const routes = {
      admin: '/admin',
      trainer: '/trainer-dashboard',
      member: user.packageName === 'standard' ? '/standard' : '/premium'
    };
    const targetRoute = routes[user.role] || '/';
    window.location.href = targetRoute;
  }

  isAuthenticated() {
    const token = localStorage.getItem('authToken');
    if (!token) return false;

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const now = Date.now() / 1000;
      
      if (payload.exp < now) {
        console.log('Token expired');
        this.clearAuthData();
        return false;
      }
      
      return true;
    } catch (e) {
      console.error('Token parsing error:', e);
      this.clearAuthData();
      return false;
    }
  }

  getCurrentUser() {
    if (!this.isAuthenticated()) return null;
    
    try {
      const user = localStorage.getItem('user');
      return user ? JSON.parse(user) : null;
    } catch (e) {
      console.error('Error parsing user data:', e);
      this.clearAuthData();
      return null;
    }
  }

  async logout() {
    try {
      await fetch(`${API_BASE_URL}/api/logout`, {
        method: 'POST',
        credentials: 'include'
      });
      this.clearAuthData();
      window.location.href = '/';
    } catch (error) {
      console.error('Logout error:', error);
      window.location.href = '/';
    }
  }

  getAuthHeader() {
    const token = localStorage.getItem('authToken');
    return token ? { 'Authorization': `Bearer ${token}` } : {};
  }

  async authFetch(url, options = {}) {
    const token = this.token || localStorage.getItem('authToken');
    if (!token) {
      throw new Error('No authentication token found');
    }

    const headers = {
      ...options.headers,
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };

    const response = await fetch(`${API_BASE_URL}${url}`, {
      ...options,
      headers,
      credentials: 'include'
    });

    if (response.status === 401) {
      this.clearAuthData();
      window.location.href = '/login';
      throw new Error('Session expired. Please login again.');
    }

    return response;
  }

  async refreshToken() {
    try {
      const response = await fetch(`${API_BASE_URL}/api/refresh-token`, {
        method: 'POST',
        credentials: 'include'
      });

      const data = await response.json();
      if (data.token) {
        this.storeAuthData(data.token, data.user);
      }
    } catch (error) {
      console.error('Token refresh failed:', error);
      throw error;
    }
  }

  initActivityTracker(timeoutMinutes = 30) {
    const events = ['mousedown', 'keypress', 'scroll', 'touchstart'];
    
    const updateActivity = () => {
      localStorage.setItem('lastActivity', new Date().getTime());
    };

    events.forEach(event => {
      window.addEventListener(event, updateActivity);
    });

    setInterval(() => {
      const lastActivity = localStorage.getItem('lastActivity');
      if (lastActivity && (new Date().getTime() - lastActivity > timeoutMinutes * 60 * 1000)) {
        console.log('Session timeout due to inactivity');
        this.logout();
      }
    }, 60000);
  }

  
async connectToAnnouncements() {
  if (!this.isAuthenticated() || this.getCurrentUser().role !== 'member') return;
  
  const memberId = this.getCurrentUser().id;
  const observer = {
    update: (announcement) => {
      
      if (typeof this.onAnnouncement === 'function') {
        this.onAnnouncement(announcement);
      }
    }
  };
  
  try {
    
    const response = await fetch(`${API_BASE_URL}/api/announcements/connect`, {
      method: 'POST',
      headers: this.getAuthHeader(),
      body: JSON.stringify({ memberId })
    });
    
    if (!response.ok) throw new Error('Connection failed');
  } catch (error) {
    console.error('Announcement connection error:', error);
  }
}

async getAnnouncements() {
  try {
    const response = await this.authFetch('/api/announcements');
    return await response.json();
  } catch (error) {
    console.error('Error fetching announcements:', error);
    return [];
  }
}

async markAsRead(announcementId) {
  await this.authFetch(`/api/announcements/${announcementId}/read`, {
    method: 'PATCH'
  });
}

async setupAnnouncementListener() {
  if (!this.isAuthenticated()) return;

  const userId = this.getCurrentUser().id;
  const eventSource = new EventSource(`${API_BASE_URL}/api/announcements/stream`, {
    withCredentials: true
  });

  eventSource.onmessage = (event) => {
    if (event.data === ':heartbeat') return;
    
    try {
      const announcement = JSON.parse(event.data);
      this.handleNewAnnouncement(announcement);
    } catch (e) {
      console.error('Error parsing announcement:', e);
    }
  };

  eventSource.onerror = (error) => {
    console.error('EventSource error:', error);
    eventSource.close();
    
    setTimeout(() => this.setupAnnouncementListener(), 5000);
  };

  this.announcementEventSource = eventSource;
}

handleNewAnnouncement(announcement) {

  const event = new CustomEvent('newAnnouncement', { detail: announcement });
  window.dispatchEvent(event);
  
  
  if (Notification.permission === 'granted') {
    new Notification(`New Announcement: ${announcement.title}`, {
      body: announcement.message
    });
  }
}

}

const authManager = new AuthManager();

export default authManager;