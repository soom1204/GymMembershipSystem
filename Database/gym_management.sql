-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Apr 18, 2025 at 05:14 AM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `gym_management`
--

-- --------------------------------------------------------

--
-- Table structure for table `admin`
--

CREATE TABLE `admin` (
  `adminID` int(11) NOT NULL,
  `username` varchar(50) NOT NULL,
  `email` varchar(100) NOT NULL,
  `password` varchar(255) NOT NULL,
  `name` varchar(100) NOT NULL,
  `createdAt` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `admin`
--

INSERT INTO `admin` (`adminID`, `username`, `email`, `password`, `name`, `createdAt`) VALUES
(2, 'admin2', 'admin2@gmail.com', '$2a$10$N9qo8uLOickgx2ZMRZoMy.Mrq4H6FZJZ.lmH/.B5XzJQ7Q0bYzQbW', 'Second Admin', '2025-04-17 23:51:12');

-- --------------------------------------------------------

--
-- Table structure for table `announcements`
--

CREATE TABLE `announcements` (
  `id` varchar(255) NOT NULL,
  `title` varchar(255) NOT NULL,
  `message` text NOT NULL,
  `adminId` int(11) NOT NULL,
  `date` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `class`
--

CREATE TABLE `class` (
  `classID` int(11) NOT NULL,
  `className` varchar(100) DEFAULT NULL,
  `time` time DEFAULT NULL,
  `date` date DEFAULT NULL,
  `trainerID` int(11) DEFAULT NULL,
  `capacity` int(11) DEFAULT 15,
  `isVIPOnly` tinyint(1) DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `class`
--

INSERT INTO `class` (`classID`, `className`, `time`, `date`, `trainerID`, `capacity`, `isVIPOnly`) VALUES
(1, 'Morning Yoga', '07:00:00', '2023-12-01', 2, 10, 0),
(2, 'Power Lifting', '18:00:00', '2023-12-01', 1, 10, 0),
(3, 'HIIT Blast', '12:00:00', '2023-12-02', 3, 10, 0),
(4, 'VIP Yoga', '08:00:00', '2025-05-20', 2, 5, 1),
(5, 'VIP Strength Training', '18:00:00', '2025-05-21', 1, 5, 1),
(6, 'Morning Yoga', '07:00:00', '2025-06-01', 1, 15, 0),
(7, 'Evening Zumba', '18:00:00', '2025-06-01', 2, 15, 0);

-- --------------------------------------------------------

--
-- Table structure for table `locker`
--

CREATE TABLE `locker` (
  `lockerID` int(11) NOT NULL,
  `lockerNumber` varchar(10) DEFAULT NULL,
  `memberID` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `locker`
--

INSERT INTO `locker` (`lockerID`, `lockerNumber`, `memberID`) VALUES
(1, 'A101', 2),
(2, 'B201', 1),
(3, 'VIP-01', 3);

-- --------------------------------------------------------

--
-- Table structure for table `member`
--

CREATE TABLE `member` (
  `memberID` int(11) NOT NULL,
  `name` varchar(100) DEFAULT NULL,
  `email` varchar(100) DEFAULT NULL,
  `password` varchar(255) DEFAULT NULL,
  `gender` varchar(10) DEFAULT NULL,
  `age` int(11) DEFAULT NULL,
  `ethnicity` varchar(50) DEFAULT NULL,
  `mobileNumber` varchar(20) DEFAULT NULL,
  `weight` float DEFAULT NULL,
  `height` float DEFAULT NULL,
  `packageID` int(11) DEFAULT NULL,
  `workoutPlanID` int(11) DEFAULT NULL,
  `username` varchar(50) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `member`
--

INSERT INTO `member` (`memberID`, `name`, `email`, `password`, `gender`, `age`, `ethnicity`, `mobileNumber`, `weight`, `height`, `packageID`, `workoutPlanID`, `username`) VALUES
(1, 'Abid Hasan', 'abidhasan@gmail.com', '$2b$10$z67Qr/qg/ipaxUQ8z9vsA.1Wc6Ae2Z9iIJaQgjQCkStvTOdgxxfXW', 'male', 25, 'Bangladeshi', '01234567890', 65, 160, 1, 5, 'abid'),
(2, 'Hasan', 'hasan@gmail.com', '$2b$10$hBp6s.8gr7xqmnnt/EmYGe6.VJ1N7.HgtUB0T.yMluMOsWNvv5JhS', 'male', 25, 'Bangladeshi', '01234567899', 66, 161, 1, 1, 'hasan'),
(3, 'sakib', 'sakib@gmail.com', '$2b$10$2A5/HqgN/zLBVy77gh9GNeP8iQoNB0yAuwtCp9Wrc0.doQepElIjG', 'male', 25, 'Bangladeshi', '01234567892', 70, 160, 2, 1, 'sakib'),
(10, 'soomaiya', 'soom@gmail.com', '$2b$10$qtyTp.75fN4qLz758JdlNuJMfzCsZ4QxHF09cRcte888DzdVEoD5S', 'female', 23, 'asian', '01922337893', 60, 160, 3, 3, 'soom'),
(11, 'shakela priya', 'priya22@gmail.com', '$2b$10$Kn6002G7STVWfFltzHGjY.b4j5QD97JkLe1QAc7pmh.W0D3qAJWvm', 'other', 25, 'bangladeshi', '01111111111', 35, 160, 1, 1, 'priya'),
(12, 'sara', 'sara@gmail.com', '$2b$10$mVX6QuxDJrSkk7dobd.nVevfhQlhSHA0ft/EDXsd88PQoBnwldK3G', 'female', 25, 'Bangladeshi', '01234567844', 50, 150, 2, 2, 'sara'),
(13, 'opi', 'opi@gmail.com', '$2b$10$uzrGfJCnEhv8BYYwAjbz/erOfz/9YbKV9ku9zq25TQ8uWd/yDA98O', 'male', 20, 'Bangladeshi', '01234567866', 30, 160, 2, 2, 'opi'),
(15, 'labib', 'labib@gmail.com', '$2b$10$2LgNoG.2SIyXe4bQ1XibHOMfEHZivsUOq.phyANb.X.tWvJKhz/e6', 'male', 25, 'Bangladeshi', '01633950501', 55, 165, 3, 4, 'labib');

-- --------------------------------------------------------

--
-- Table structure for table `member_backup`
--

CREATE TABLE `member_backup` (
  `memberID` int(11) NOT NULL DEFAULT 0,
  `name` varchar(100) DEFAULT NULL,
  `email` varchar(100) DEFAULT NULL,
  `password` varchar(255) DEFAULT NULL,
  `gender` varchar(10) DEFAULT NULL,
  `age` int(11) DEFAULT NULL,
  `ethnicity` varchar(50) DEFAULT NULL,
  `mobileNumber` varchar(20) DEFAULT NULL,
  `weight` float DEFAULT NULL,
  `height` float DEFAULT NULL,
  `packageID` int(11) DEFAULT NULL,
  `workoutPlanID` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `member_backup`
--

INSERT INTO `member_backup` (`memberID`, `name`, `email`, `password`, `gender`, `age`, `ethnicity`, `mobileNumber`, `weight`, `height`, `packageID`, `workoutPlanID`) VALUES
(1, 'Sadman Sakib', 'sakib@email.com', 'e54fe785cb24522b20a4356845edbffa278818bf9ddbf8eaf9bd86451ae422e5', 'Male', 27, 'Bengali', '01711-111111', 72.5, 175, 1, 1),
(2, 'Tasnima chowdhury', 'tasnima@email.com', '8d653159054e795ecf45d86bc1830d922ca3f3134bcea876cfb0b5cb15009268', 'Female', 25, 'Bengali', '01812-222222', 58.2, 162.5, 2, 2),
(3, 'Riyad Hossain', 'riad@email.com', '19beeb30b255be4c28155953b5e8b72ed6cde9956fece5124a1e479a5d574e08', 'Male', 30, 'Bengali', '01913-333333', 68.9, 170.3, 3, 3);

-- --------------------------------------------------------

--
-- Table structure for table `member_class`
--

CREATE TABLE `member_class` (
  `bookingID` int(11) NOT NULL,
  `memberID` int(11) NOT NULL,
  `classID` int(11) NOT NULL,
  `bookingDate` datetime NOT NULL,
  `status` enum('booked','attended','cancelled') DEFAULT 'booked'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `package`
--

CREATE TABLE `package` (
  `packageID` int(11) NOT NULL,
  `packageName` varchar(100) DEFAULT NULL,
  `monthlyfee` decimal(10,2) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `package`
--

INSERT INTO `package` (`packageID`, `packageName`, `monthlyfee`) VALUES
(1, 'Standard', 5000.00),
(2, 'Premium', 8500.00),
(3, 'VIP', 12000.00),
(4, 'Standard', 49.99),
(5, 'Premium', 89.99),
(6, 'VIP', 129.99);

-- --------------------------------------------------------

--
-- Table structure for table `payment`
--

CREATE TABLE `payment` (
  `paymentID` int(11) NOT NULL,
  `memberID` int(11) DEFAULT NULL,
  `amount` decimal(10,2) DEFAULT NULL,
  `paymentDate` date DEFAULT NULL,
  `status` varchar(20) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `payment`
--

INSERT INTO `payment` (`paymentID`, `memberID`, `amount`, `paymentDate`, `status`) VALUES
(1, 1, 49.99, '2023-11-01', 'Paid'),
(2, 2, 89.99, '2023-11-05', 'Paid'),
(3, 3, 129.99, '2023-11-10', 'Pending');

-- --------------------------------------------------------

--
-- Table structure for table `trainer`
--

CREATE TABLE `trainer` (
  `trainerID` int(11) NOT NULL,
  `username` varchar(50) NOT NULL,
  `name` varchar(100) DEFAULT NULL,
  `email` varchar(100) DEFAULT NULL,
  `password` varchar(255) DEFAULT NULL,
  `gender` varchar(10) DEFAULT NULL,
  `age` int(11) DEFAULT NULL,
  `ethnicity` varchar(50) DEFAULT NULL,
  `mobileNumber` varchar(20) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `workoutplan`
--

CREATE TABLE `workoutplan` (
  `workoutPlanID` int(11) NOT NULL,
  `planName` varchar(100) DEFAULT NULL,
  `equipmentList` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `workoutplan`
--

INSERT INTO `workoutplan` (`workoutPlanID`, `planName`, `equipmentList`) VALUES
(1, 'Weight Gain', 'Dumbbels, Protein Shakes, weight Bench'),
(2, 'Weight Loss', 'Treadmill, Resistance Bands, Kettlebells'),
(3, 'Weight Building', 'Barbell, Squat Rack, Pull-up Bar'),
(4, 'Weight Gain', 'Dumbbels, Protein Shakes, weight Bench'),
(5, 'Weight Loss', 'Treadmill, Resistance Bands, Kettlebells'),
(6, 'Weight Building', 'Barbell, Squat Rack, Pull-up Bar');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `admin`
--
ALTER TABLE `admin`
  ADD PRIMARY KEY (`adminID`),
  ADD UNIQUE KEY `username` (`username`),
  ADD UNIQUE KEY `email` (`email`);

--
-- Indexes for table `announcements`
--
ALTER TABLE `announcements`
  ADD PRIMARY KEY (`id`),
  ADD KEY `adminId` (`adminId`);

--
-- Indexes for table `class`
--
ALTER TABLE `class`
  ADD PRIMARY KEY (`classID`),
  ADD KEY `trainerID` (`trainerID`);

--
-- Indexes for table `locker`
--
ALTER TABLE `locker`
  ADD PRIMARY KEY (`lockerID`),
  ADD KEY `memberID` (`memberID`);

--
-- Indexes for table `member`
--
ALTER TABLE `member`
  ADD PRIMARY KEY (`memberID`),
  ADD UNIQUE KEY `username` (`username`),
  ADD UNIQUE KEY `email` (`email`),
  ADD KEY `packageID` (`packageID`),
  ADD KEY `workoutPlanID` (`workoutPlanID`);

--
-- Indexes for table `member_class`
--
ALTER TABLE `member_class`
  ADD PRIMARY KEY (`bookingID`),
  ADD KEY `memberID` (`memberID`),
  ADD KEY `classID` (`classID`);

--
-- Indexes for table `package`
--
ALTER TABLE `package`
  ADD PRIMARY KEY (`packageID`);

--
-- Indexes for table `payment`
--
ALTER TABLE `payment`
  ADD PRIMARY KEY (`paymentID`),
  ADD KEY `memberID` (`memberID`);

--
-- Indexes for table `trainer`
--
ALTER TABLE `trainer`
  ADD PRIMARY KEY (`trainerID`),
  ADD UNIQUE KEY `username` (`username`),
  ADD UNIQUE KEY `email` (`email`);

--
-- Indexes for table `workoutplan`
--
ALTER TABLE `workoutplan`
  ADD PRIMARY KEY (`workoutPlanID`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `admin`
--
ALTER TABLE `admin`
  MODIFY `adminID` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `class`
--
ALTER TABLE `class`
  MODIFY `classID` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT for table `locker`
--
ALTER TABLE `locker`
  MODIFY `lockerID` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `member`
--
ALTER TABLE `member`
  MODIFY `memberID` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=16;

--
-- AUTO_INCREMENT for table `member_class`
--
ALTER TABLE `member_class`
  MODIFY `bookingID` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `package`
--
ALTER TABLE `package`
  MODIFY `packageID` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT for table `payment`
--
ALTER TABLE `payment`
  MODIFY `paymentID` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `trainer`
--
ALTER TABLE `trainer`
  MODIFY `trainerID` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `workoutplan`
--
ALTER TABLE `workoutplan`
  MODIFY `workoutPlanID` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `announcements`
--
ALTER TABLE `announcements`
  ADD CONSTRAINT `announcements_ibfk_1` FOREIGN KEY (`adminId`) REFERENCES `admin` (`adminID`);

--
-- Constraints for table `member_class`
--
ALTER TABLE `member_class`
  ADD CONSTRAINT `member_class_ibfk_1` FOREIGN KEY (`memberID`) REFERENCES `member` (`memberID`),
  ADD CONSTRAINT `member_class_ibfk_2` FOREIGN KEY (`classID`) REFERENCES `class` (`classID`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
