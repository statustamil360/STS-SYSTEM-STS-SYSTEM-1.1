-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Aug 04, 2026 at 03:11 AM
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
-- Database: `amc_teleconference`
--

-- --------------------------------------------------------

--
-- Table structure for table `admins`
--

CREATE TABLE `admins` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `admin_code` varchar(50) DEFAULT NULL,
  `created_by` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `admins`
--

INSERT INTO `admins` (`id`, `user_id`, `admin_code`, `created_by`, `created_at`, `updated_at`) VALUES
(1, 2, 'ADM-DEMO001', 1, '2026-08-02 16:42:57', '2026-08-02 16:42:57'),
(2, 6, 'ADM-MSC15HI5-NN27', 1, '2026-08-02 16:44:05', '2026-08-02 16:44:05'),
(3, 8, 'ADM-MSC1FG0N-JQWL', 1, '2026-08-02 16:51:49', '2026-08-02 16:51:49'),
(4, 10, 'ADM-MSDBYD0Y-KRZJ', 1, '2026-08-03 14:34:14', '2026-08-03 14:34:14');

-- --------------------------------------------------------

--
-- Table structure for table `allied_health_professionals`
--

CREATE TABLE `allied_health_professionals` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `ahp_code` varchar(50) DEFAULT NULL,
  `profession` varchar(150) DEFAULT NULL,
  `registration_number` varchar(100) DEFAULT NULL,
  `availability` text DEFAULT NULL,
  `created_by` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `allied_health_professionals`
--

INSERT INTO `allied_health_professionals` (`id`, `user_id`, `ahp_code`, `profession`, `registration_number`, `availability`, `created_by`, `created_at`, `updated_at`) VALUES
(1, 5, 'AHP-DEMO001', 'Physiotherapist', 'AHP-67890', NULL, 3, '2026-08-02 16:42:57', '2026-08-02 16:42:57');

-- --------------------------------------------------------

--
-- Table structure for table `appointments`
--

CREATE TABLE `appointments` (
  `id` int(11) NOT NULL,
  `patient_id` int(11) NOT NULL,
  `gp_id` int(11) DEFAULT NULL,
  `ahp_id` int(11) DEFAULT NULL,
  `appointment_date` date NOT NULL,
  `appointment_time` time NOT NULL,
  `status` enum('scheduled','confirmed','completed','cancelled','no_show') DEFAULT 'scheduled',
  `notes` text DEFAULT NULL,
  `created_by` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `appointments`
--

INSERT INTO `appointments` (`id`, `patient_id`, `gp_id`, `ahp_id`, `appointment_date`, `appointment_time`, `status`, `notes`, `created_by`, `created_at`, `updated_at`) VALUES
(1, 1, 1, NULL, '2026-08-02', '14:30:00', 'scheduled', NULL, 3, '2026-08-02 16:42:57', '2026-08-02 16:42:57'),
(2, 3, NULL, NULL, '2026-08-03', '10:00:00', 'scheduled', 'E2E test appointment', 3, '2026-08-03 05:01:17', '2026-08-03 05:01:17'),
(3, 4, NULL, NULL, '2026-08-10', '10:00:00', 'scheduled', 'E2E test', 3, '2026-08-03 14:00:53', '2026-08-03 14:00:53'),
(4, 5, NULL, NULL, '2026-08-10', '10:00:00', 'scheduled', 'E2E test', 3, '2026-08-03 14:01:27', '2026-08-03 14:01:27'),
(5, 6, NULL, NULL, '2026-08-10', '10:00:00', 'scheduled', 'E2E test', 3, '2026-08-03 14:33:36', '2026-08-03 14:33:36'),
(6, 7, NULL, NULL, '2026-08-10', '10:00:00', 'scheduled', 'E2E test', 3, '2026-08-03 15:04:04', '2026-08-03 15:04:04'),
(7, 8, NULL, NULL, '2026-08-10', '10:00:00', 'scheduled', 'E2E test', 3, '2026-08-03 15:36:28', '2026-08-03 15:36:28');

-- --------------------------------------------------------

--
-- Table structure for table `audit_logs`
--

CREATE TABLE `audit_logs` (
  `id` int(11) NOT NULL,
  `user_id` int(11) DEFAULT NULL,
  `action` enum('login','logout','create','update','delete','export','settings_change') NOT NULL,
  `entity_type` varchar(100) DEFAULT NULL,
  `entity_id` int(11) DEFAULT NULL,
  `details` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`details`)),
  `ip_address` varchar(45) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `audit_logs`
--

INSERT INTO `audit_logs` (`id`, `user_id`, `action`, `entity_type`, `entity_id`, `details`, `ip_address`, `created_at`) VALUES
(1, 1, 'login', NULL, NULL, NULL, '::1', '2026-07-30 11:45:44'),
(2, 1, 'login', NULL, NULL, NULL, '::1', '2026-07-30 11:46:24'),
(3, 1, 'login', NULL, NULL, NULL, '::1', '2026-07-30 11:47:35'),
(4, 1, 'logout', NULL, NULL, NULL, '::1', '2026-07-30 11:49:46'),
(5, 1, 'login', NULL, NULL, NULL, '::1', '2026-07-30 11:50:02'),
(6, 1, 'login', NULL, NULL, NULL, '::1', '2026-08-02 16:44:04'),
(7, 6, 'login', NULL, NULL, NULL, '::1', '2026-08-02 16:44:05'),
(8, 7, 'login', NULL, NULL, NULL, '::1', '2026-08-02 16:44:07'),
(9, 1, 'login', NULL, NULL, NULL, '::1', '2026-08-02 16:45:20'),
(10, 1, 'login', NULL, NULL, NULL, '::1', '2026-08-02 16:51:48'),
(11, 8, 'login', NULL, NULL, NULL, '::1', '2026-08-02 16:51:50'),
(12, 8, 'login', NULL, NULL, NULL, '::1', '2026-08-02 16:52:07'),
(13, 8, 'login', NULL, NULL, NULL, '::1', '2026-08-02 16:52:35'),
(14, 1, 'login', NULL, NULL, NULL, '::1', '2026-08-02 16:52:59'),
(15, 1, 'login', NULL, NULL, NULL, '::1', '2026-08-02 16:53:24'),
(16, 1, 'logout', NULL, NULL, NULL, '::1', '2026-08-02 16:56:45'),
(17, 1, 'login', NULL, NULL, NULL, '::1', '2026-08-02 16:57:10'),
(18, 1, 'logout', NULL, NULL, NULL, '::1', '2026-08-02 16:57:22'),
(19, 8, 'login', NULL, NULL, NULL, '::1', '2026-08-02 16:57:38'),
(20, 2, 'login', NULL, NULL, NULL, '::1', '2026-08-02 17:02:25'),
(21, 2, '', 'receptionist', 3, '{\"email\":\"testreceptionist@amc.com\",\"receptionist_code\":\"REC-MSC1T2E3-9ES1\"}', '::1', '2026-08-02 17:02:26'),
(22, 9, 'login', NULL, NULL, NULL, '::1', '2026-08-02 17:02:26'),
(23, 2, '', 'receptionist', 3, '{\"status\":\"inactive\"}', '::1', '2026-08-02 17:02:27'),
(24, 2, '', 'receptionist', 3, '{\"status\":\"active\"}', '::1', '2026-08-02 17:02:27'),
(25, 9, 'login', NULL, NULL, NULL, '::1', '2026-08-02 17:02:47'),
(26, 8, '', 'receptionist', 3, NULL, '::1', '2026-08-02 17:04:15'),
(27, 8, 'logout', NULL, NULL, NULL, '::1', '2026-08-02 17:04:24'),
(28, 9, 'login', NULL, NULL, NULL, '::1', '2026-08-02 17:04:34'),
(29, 9, 'logout', NULL, NULL, NULL, '::1', '2026-08-02 17:56:23'),
(30, 8, 'login', NULL, NULL, NULL, '::1', '2026-08-02 18:01:28'),
(31, 1, 'login', NULL, NULL, NULL, '::1', '2026-08-02 18:01:48'),
(32, NULL, 'login', 'auth', NULL, '{\"status\":\"failed\",\"reason\":\"unknown_email\",\"email\":\"nonexistent@test.com\"}', '::1', '2026-08-03 04:59:40'),
(33, 1, 'login', NULL, NULL, NULL, '::1', '2026-08-03 04:59:41'),
(34, 1, 'export', 'audit_logs', NULL, NULL, '::1', '2026-08-03 04:59:41'),
(35, 2, 'login', NULL, NULL, NULL, '::1', '2026-08-03 04:59:42'),
(36, 3, 'login', NULL, NULL, NULL, '::1', '2026-08-03 04:59:43'),
(37, 4, 'login', NULL, NULL, NULL, '::1', '2026-08-03 04:59:44'),
(38, 5, 'login', NULL, NULL, NULL, '::1', '2026-08-03 04:59:45'),
(39, NULL, 'login', 'auth', NULL, '{\"status\":\"failed\",\"reason\":\"unknown_email\",\"email\":\"nonexistent@test.com\"}', '::1', '2026-08-03 05:01:12'),
(40, 1, 'login', NULL, NULL, NULL, '::1', '2026-08-03 05:01:13'),
(41, 1, 'export', 'audit_logs', NULL, NULL, '::1', '2026-08-03 05:01:13'),
(42, 2, 'login', NULL, NULL, NULL, '::1', '2026-08-03 05:01:14'),
(43, 3, 'login', NULL, NULL, NULL, '::1', '2026-08-03 05:01:15'),
(44, 4, 'login', NULL, NULL, NULL, '::1', '2026-08-03 05:01:16'),
(45, 5, 'login', NULL, NULL, NULL, '::1', '2026-08-03 05:01:17'),
(46, 4, 'login', NULL, NULL, NULL, '::1', '2026-08-03 05:01:18'),
(47, 5, 'login', NULL, NULL, NULL, '::1', '2026-08-03 05:01:18'),
(48, 1, 'login', NULL, NULL, NULL, '::1', '2026-08-03 05:06:18'),
(49, 8, 'login', NULL, NULL, NULL, '::1', '2026-08-03 05:06:42'),
(50, 9, 'login', NULL, NULL, NULL, '::1', '2026-08-03 05:07:23'),
(51, NULL, 'login', 'auth', NULL, '{\"status\":\"failed\",\"reason\":\"unknown_email\",\"email\":\"nonexistent@test.com\"}', '::1', '2026-08-03 13:58:59'),
(52, 1, 'login', NULL, NULL, NULL, '::1', '2026-08-03 13:59:00'),
(53, 1, 'export', 'audit_logs', NULL, NULL, '::1', '2026-08-03 13:59:00'),
(54, 2, 'login', NULL, NULL, NULL, '::1', '2026-08-03 13:59:00'),
(55, 4, 'login', NULL, NULL, NULL, '::1', '2026-08-03 13:59:01'),
(56, 5, 'login', NULL, NULL, NULL, '::1', '2026-08-03 13:59:02'),
(57, NULL, 'login', 'auth', NULL, '{\"status\":\"failed\",\"reason\":\"unknown_email\",\"email\":\"nonexistent@test.com\"}', '::1', '2026-08-03 13:59:46'),
(58, 1, 'login', NULL, NULL, NULL, '::1', '2026-08-03 13:59:46'),
(59, 1, 'export', 'audit_logs', NULL, NULL, '::1', '2026-08-03 13:59:46'),
(60, 2, 'login', NULL, NULL, NULL, '::1', '2026-08-03 13:59:47'),
(61, 3, 'login', NULL, NULL, NULL, '::1', '2026-08-03 13:59:48'),
(62, 4, 'login', NULL, NULL, NULL, '::1', '2026-08-03 13:59:48'),
(63, 5, 'login', NULL, NULL, NULL, '::1', '2026-08-03 13:59:49'),
(64, NULL, 'login', 'auth', NULL, '{\"status\":\"failed\",\"reason\":\"unknown_email\",\"email\":\"nonexistent@test.com\"}', '::1', '2026-08-03 14:00:19'),
(65, 1, 'login', NULL, NULL, NULL, '::1', '2026-08-03 14:00:20'),
(66, 1, 'export', 'audit_logs', NULL, NULL, '::1', '2026-08-03 14:00:20'),
(67, 2, 'login', NULL, NULL, NULL, '::1', '2026-08-03 14:00:20'),
(68, 3, 'login', NULL, NULL, NULL, '::1', '2026-08-03 14:00:21'),
(69, 4, 'login', NULL, NULL, NULL, '::1', '2026-08-03 14:00:22'),
(70, 5, 'login', NULL, NULL, NULL, '::1', '2026-08-03 14:00:22'),
(71, NULL, 'login', 'auth', NULL, '{\"status\":\"failed\",\"reason\":\"unknown_email\",\"email\":\"nonexistent@test.com\"}', '::1', '2026-08-03 14:00:50'),
(72, 1, 'login', NULL, NULL, NULL, '::1', '2026-08-03 14:00:50'),
(73, 1, 'export', 'audit_logs', NULL, NULL, '::1', '2026-08-03 14:00:50'),
(74, 2, 'login', NULL, NULL, NULL, '::1', '2026-08-03 14:00:51'),
(75, 3, 'login', NULL, NULL, NULL, '::1', '2026-08-03 14:00:52'),
(76, 4, 'login', NULL, NULL, NULL, '::1', '2026-08-03 14:00:52'),
(77, 5, 'login', NULL, NULL, NULL, '::1', '2026-08-03 14:00:53'),
(78, NULL, 'login', 'auth', NULL, '{\"status\":\"failed\",\"reason\":\"unknown_email\",\"email\":\"nonexistent@test.com\"}', '::1', '2026-08-03 14:01:23'),
(79, 1, 'login', NULL, NULL, NULL, '::1', '2026-08-03 14:01:24'),
(80, 1, 'export', 'audit_logs', NULL, NULL, '::1', '2026-08-03 14:01:24'),
(81, 2, 'login', NULL, NULL, NULL, '::1', '2026-08-03 14:01:24'),
(82, 3, 'login', NULL, NULL, NULL, '::1', '2026-08-03 14:01:25'),
(83, 4, 'login', NULL, NULL, NULL, '::1', '2026-08-03 14:01:26'),
(84, 5, 'login', NULL, NULL, NULL, '::1', '2026-08-03 14:01:27'),
(85, 1, 'login', NULL, NULL, NULL, '::1', '2026-08-03 14:33:30'),
(86, 2, 'login', NULL, NULL, NULL, '::1', '2026-08-03 14:33:30'),
(87, 3, 'login', NULL, NULL, NULL, '::1', '2026-08-03 14:33:31'),
(88, 4, 'login', NULL, NULL, NULL, '::1', '2026-08-03 14:33:32'),
(89, 5, 'login', NULL, NULL, NULL, '::1', '2026-08-03 14:33:33'),
(90, NULL, 'login', 'auth', NULL, '{\"status\":\"failed\",\"reason\":\"unknown_email\",\"email\":\"nonexistent@test.com\"}', '::1', '2026-08-03 14:33:33'),
(91, 1, 'login', NULL, NULL, NULL, '::1', '2026-08-03 14:33:34'),
(92, 1, 'export', 'audit_logs', NULL, NULL, '::1', '2026-08-03 14:33:34'),
(93, 2, 'login', NULL, NULL, NULL, '::1', '2026-08-03 14:33:34'),
(94, 3, 'login', NULL, NULL, NULL, '::1', '2026-08-03 14:33:35'),
(95, 4, 'login', NULL, NULL, NULL, '::1', '2026-08-03 14:33:36'),
(96, 5, 'login', NULL, NULL, NULL, '::1', '2026-08-03 14:33:36'),
(97, 1, 'login', NULL, NULL, NULL, '::1', '2026-08-03 14:34:13'),
(98, 2, 'login', NULL, NULL, NULL, '::1', '2026-08-03 14:34:14'),
(99, 2, '', 'receptionist', 4, '{\"email\":\"runtest.rec.1785767652870@amc.com\",\"receptionist_code\":\"REC-MSDBYD2Z-JBSS\"}', '::1', '2026-08-03 14:34:15'),
(100, 3, 'login', NULL, NULL, NULL, '::1', '2026-08-03 14:34:15'),
(101, NULL, 'login', 'auth', NULL, '{\"status\":\"failed\",\"reason\":\"unknown_email\",\"email\":\"nonexistent@test.com\"}', '::1', '2026-08-03 15:04:00'),
(102, 1, 'login', NULL, NULL, NULL, '::1', '2026-08-03 15:04:01'),
(103, 1, 'export', 'audit_logs', NULL, NULL, '::1', '2026-08-03 15:04:01'),
(104, 2, 'login', NULL, NULL, NULL, '::1', '2026-08-03 15:04:01'),
(105, 3, 'login', NULL, NULL, NULL, '::1', '2026-08-03 15:04:03'),
(106, 4, 'login', NULL, NULL, NULL, '::1', '2026-08-03 15:04:03'),
(107, 5, 'login', NULL, NULL, NULL, '::1', '2026-08-03 15:04:04'),
(108, 9, 'logout', NULL, NULL, NULL, '::1', '2026-08-03 15:16:55'),
(109, 1, 'login', NULL, NULL, NULL, '::1', '2026-08-03 15:17:27'),
(110, 1, 'logout', NULL, NULL, NULL, '::1', '2026-08-03 15:17:44'),
(111, 2, 'login', NULL, NULL, NULL, '::1', '2026-08-03 15:18:12'),
(112, 2, 'logout', NULL, NULL, NULL, '::1', '2026-08-03 15:18:29'),
(113, 3, 'login', NULL, NULL, NULL, '::1', '2026-08-03 15:18:57'),
(114, 4, 'login', NULL, NULL, NULL, '::1', '2026-08-03 15:19:28'),
(115, 4, 'logout', NULL, NULL, NULL, '::1', '2026-08-03 15:19:50'),
(116, 5, 'login', NULL, NULL, NULL, '::1', '2026-08-03 15:20:04'),
(117, NULL, 'login', 'auth', NULL, '{\"status\":\"failed\",\"reason\":\"unknown_email\",\"email\":\"nonexistent@test.com\"}', '::1', '2026-08-03 15:36:25'),
(118, 1, 'login', NULL, NULL, NULL, '::1', '2026-08-03 15:36:25'),
(119, 1, 'export', 'audit_logs', NULL, NULL, '::1', '2026-08-03 15:36:25'),
(120, 2, 'login', NULL, NULL, NULL, '::1', '2026-08-03 15:36:26'),
(121, 3, 'login', NULL, NULL, NULL, '::1', '2026-08-03 15:36:27'),
(122, 4, 'login', NULL, NULL, NULL, '::1', '2026-08-03 15:36:28'),
(123, 5, 'login', NULL, NULL, NULL, '::1', '2026-08-03 15:36:28');

-- --------------------------------------------------------

--
-- Table structure for table `conferences`
--

CREATE TABLE `conferences` (
  `id` int(11) NOT NULL,
  `conference_code` varchar(50) DEFAULT NULL,
  `patient_id` int(11) NOT NULL,
  `gp_id` int(11) DEFAULT NULL,
  `ahp_id` int(11) DEFAULT NULL,
  `scheduled_date` date NOT NULL,
  `scheduled_time` time NOT NULL,
  `status` enum('scheduled','waiting','live','completed','cancelled') DEFAULT 'scheduled',
  `meeting_link` varchar(500) DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `created_by` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `conferences`
--

INSERT INTO `conferences` (`id`, `conference_code`, `patient_id`, `gp_id`, `ahp_id`, `scheduled_date`, `scheduled_time`, `status`, `meeting_link`, `notes`, `created_by`, `created_at`, `updated_at`) VALUES
(1, 'CONF-DEMO001', 1, 1, 1, '2026-08-03', '10:00:00', 'scheduled', NULL, NULL, 3, '2026-08-02 16:42:57', '2026-08-02 16:42:57'),
(2, 'CONF-MSCRHJ9O-A303', 3, 1, 1, '2026-08-03', '14:00:00', 'scheduled', 'https://meet.amc.com/conf-mscrhj9o-a303', 'E2E conference', 3, '2026-08-03 05:01:17', '2026-08-03 05:01:17'),
(3, 'CONF-MSDARGRD-2P08', 4, NULL, NULL, '2026-08-12', '14:00:00', 'scheduled', 'https://meet.example.com/e2e', 'E2E conference', 3, '2026-08-03 14:00:53', '2026-08-03 14:00:53'),
(4, 'CONF-MSDAS6QP-9LDU', 5, NULL, NULL, '2026-08-12', '14:00:00', 'scheduled', 'https://meet.example.com/e2e', 'E2E conference', 3, '2026-08-03 14:01:27', '2026-08-03 14:01:27'),
(5, 'CONF-MSDBXJN6-8ALF', 6, NULL, NULL, '2026-08-12', '14:00:00', 'scheduled', 'https://meet.example.com/e2e', 'E2E conference', 3, '2026-08-03 14:33:36', '2026-08-03 14:33:36'),
(6, 'CONF-MSDD0Q6D-FKTK', 7, NULL, NULL, '2026-08-12', '14:00:00', 'scheduled', 'https://meet.example.com/e2e', 'E2E conference', 3, '2026-08-03 15:04:04', '2026-08-03 15:04:04'),
(7, 'CONF-MSDE6E9A-DC4J', 8, NULL, NULL, '2026-08-12', '14:00:00', 'scheduled', 'https://meet.example.com/e2e', 'E2E conference', 3, '2026-08-03 15:36:28', '2026-08-03 15:36:28');

-- --------------------------------------------------------

--
-- Table structure for table `conference_participants`
--

CREATE TABLE `conference_participants` (
  `id` int(11) NOT NULL,
  `conference_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `role_in_conference` enum('patient','gp','ahp','receptionist','other') NOT NULL,
  `joined_at` timestamp NULL DEFAULT NULL,
  `left_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `conference_participants`
--

INSERT INTO `conference_participants` (`id`, `conference_id`, `user_id`, `role_in_conference`, `joined_at`, `left_at`) VALUES
(1, 2, 4, 'gp', NULL, NULL),
(2, 2, 5, 'ahp', NULL, NULL);

-- --------------------------------------------------------

--
-- Table structure for table `gps`
--

CREATE TABLE `gps` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `gp_code` varchar(50) DEFAULT NULL,
  `specialization` varchar(150) DEFAULT NULL,
  `registration_number` varchar(100) DEFAULT NULL,
  `hospital` varchar(255) DEFAULT NULL,
  `availability` text DEFAULT NULL,
  `created_by` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `gps`
--

INSERT INTO `gps` (`id`, `user_id`, `gp_code`, `specialization`, `registration_number`, `hospital`, `availability`, `created_by`, `created_at`, `updated_at`) VALUES
(1, 4, 'GP-DEMO001', 'General Medicine', 'SLMC-12345', 'AMC Healthcare', NULL, 3, '2026-08-02 16:42:57', '2026-08-02 16:42:57');

-- --------------------------------------------------------

--
-- Table structure for table `login_history`
--

CREATE TABLE `login_history` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `ip_address` varchar(45) DEFAULT NULL,
  `user_agent` text DEFAULT NULL,
  `login_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `logout_at` timestamp NULL DEFAULT NULL,
  `status` enum('success','failed') DEFAULT 'success'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `login_history`
--

INSERT INTO `login_history` (`id`, `user_id`, `ip_address`, `user_agent`, `login_at`, `logout_at`, `status`) VALUES
(1, 1, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36', '2026-07-30 11:45:44', NULL, 'success'),
(2, 1, '::1', 'Mozilla/5.0 (Windows NT; Windows NT 10.0; en-US) WindowsPowerShell/5.1.19041.6456', '2026-07-30 11:46:24', NULL, 'success'),
(3, 1, '::1', 'Mozilla/5.0 (Windows NT; Windows NT 10.0; en-US) WindowsPowerShell/5.1.19041.6456', '2026-07-30 11:47:35', '2026-07-30 11:49:46', 'success'),
(4, 1, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36', '2026-07-30 11:50:02', NULL, 'success'),
(5, 1, '::1', 'Mozilla/5.0 (Windows NT; Windows NT 10.0; en-GB) WindowsPowerShell/5.1.26100.8972', '2026-08-02 16:44:04', NULL, 'success'),
(6, 6, '::1', 'Mozilla/5.0 (Windows NT; Windows NT 10.0; en-GB) WindowsPowerShell/5.1.26100.8972', '2026-08-02 16:44:05', NULL, 'success'),
(7, 7, '::1', 'Mozilla/5.0 (Windows NT; Windows NT 10.0; en-GB) WindowsPowerShell/5.1.26100.8972', '2026-08-02 16:44:07', NULL, 'success'),
(8, 1, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36', '2026-08-02 16:45:20', NULL, 'success'),
(9, 1, '::1', 'Mozilla/5.0 (Windows NT; Windows NT 10.0; en-GB) WindowsPowerShell/5.1.26100.8972', '2026-08-02 16:51:48', NULL, 'success'),
(10, 8, '::1', 'Mozilla/5.0 (Windows NT; Windows NT 10.0; en-GB) WindowsPowerShell/5.1.26100.8972', '2026-08-02 16:51:50', NULL, 'success'),
(11, 8, '::1', 'Mozilla/5.0 (Windows NT; Windows NT 10.0; en-GB) WindowsPowerShell/5.1.26100.8972', '2026-08-02 16:51:51', NULL, 'failed'),
(12, 8, '::1', 'Mozilla/5.0 (Windows NT; Windows NT 10.0; en-GB) WindowsPowerShell/5.1.26100.8972', '2026-08-02 16:52:07', NULL, 'success'),
(13, 8, '::1', 'Mozilla/5.0 (Windows NT; Windows NT 10.0; en-GB) WindowsPowerShell/5.1.26100.8972', '2026-08-02 16:52:34', NULL, 'failed'),
(14, 8, '::1', 'Mozilla/5.0 (Windows NT; Windows NT 10.0; en-GB) WindowsPowerShell/5.1.26100.8972', '2026-08-02 16:52:35', NULL, 'success'),
(15, 1, '::1', 'Mozilla/5.0 (Windows NT; Windows NT 10.0; en-GB) WindowsPowerShell/5.1.26100.8972', '2026-08-02 16:52:59', NULL, 'success'),
(16, 1, '::1', 'Mozilla/5.0 (Windows NT; Windows NT 10.0; en-GB) WindowsPowerShell/5.1.26100.8972', '2026-08-02 16:53:24', '2026-08-02 16:56:45', 'success'),
(17, 1, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36', '2026-08-02 16:57:10', '2026-08-02 16:57:22', 'success'),
(18, 8, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36', '2026-08-02 16:57:38', '2026-08-02 17:04:24', 'success'),
(19, 2, '::1', 'Mozilla/5.0 (Windows NT; Windows NT 10.0; en-GB) WindowsPowerShell/5.1.26100.8972', '2026-08-02 17:02:25', NULL, 'success'),
(20, 9, '::1', 'Mozilla/5.0 (Windows NT; Windows NT 10.0; en-GB) WindowsPowerShell/5.1.26100.8972', '2026-08-02 17:02:26', NULL, 'success'),
(21, 9, '::1', 'Mozilla/5.0 (Windows NT; Windows NT 10.0; en-GB) WindowsPowerShell/5.1.26100.8972', '2026-08-02 17:02:27', NULL, 'failed'),
(22, 9, '::1', 'Mozilla/5.0 (Windows NT; Windows NT 10.0; en-GB) WindowsPowerShell/5.1.26100.8972', '2026-08-02 17:02:47', NULL, 'success'),
(23, 9, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36', '2026-08-02 17:04:34', '2026-08-02 17:56:23', 'success'),
(24, 8, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36', '2026-08-02 18:01:28', NULL, 'success'),
(25, 1, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36', '2026-08-02 18:01:48', NULL, 'success'),
(26, 1, '::1', 'node', '2026-08-03 04:59:41', NULL, 'success'),
(27, 2, '::1', 'node', '2026-08-03 04:59:42', NULL, 'success'),
(28, 9, '::1', 'node', '2026-08-03 04:59:43', NULL, 'failed'),
(29, 3, '::1', 'node', '2026-08-03 04:59:43', NULL, 'success'),
(30, 4, '::1', 'node', '2026-08-03 04:59:44', NULL, 'success'),
(31, 5, '::1', 'node', '2026-08-03 04:59:45', NULL, 'success'),
(32, 1, '::1', 'node', '2026-08-03 05:01:13', NULL, 'success'),
(33, 2, '::1', 'node', '2026-08-03 05:01:14', NULL, 'success'),
(34, 9, '::1', 'node', '2026-08-03 05:01:15', NULL, 'failed'),
(35, 3, '::1', 'node', '2026-08-03 05:01:15', NULL, 'success'),
(36, 4, '::1', 'node', '2026-08-03 05:01:16', NULL, 'success'),
(37, 5, '::1', 'node', '2026-08-03 05:01:17', NULL, 'success'),
(38, 4, '::1', 'node', '2026-08-03 05:01:18', NULL, 'success'),
(39, 5, '::1', 'node', '2026-08-03 05:01:18', NULL, 'success'),
(40, 1, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36', '2026-08-03 05:06:18', NULL, 'success'),
(41, 8, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36', '2026-08-03 05:06:42', NULL, 'success'),
(42, 9, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36', '2026-08-03 05:07:23', NULL, 'success'),
(43, 1, '::1', 'node', '2026-08-03 13:59:00', NULL, 'success'),
(44, 2, '::1', 'node', '2026-08-03 13:59:00', NULL, 'success'),
(45, 9, '::1', 'node', '2026-08-03 13:59:01', '2026-08-03 15:16:55', 'failed'),
(46, 4, '::1', 'node', '2026-08-03 13:59:01', NULL, 'success'),
(47, 5, '::1', 'node', '2026-08-03 13:59:02', NULL, 'success'),
(48, 1, '::1', 'node', '2026-08-03 13:59:46', NULL, 'success'),
(49, 2, '::1', 'node', '2026-08-03 13:59:47', NULL, 'success'),
(50, 3, '::1', 'node', '2026-08-03 13:59:48', NULL, 'success'),
(51, 4, '::1', 'node', '2026-08-03 13:59:48', NULL, 'success'),
(52, 5, '::1', 'node', '2026-08-03 13:59:49', NULL, 'success'),
(53, 1, '::1', 'node', '2026-08-03 14:00:20', NULL, 'success'),
(54, 2, '::1', 'node', '2026-08-03 14:00:20', NULL, 'success'),
(55, 3, '::1', 'node', '2026-08-03 14:00:21', NULL, 'success'),
(56, 4, '::1', 'node', '2026-08-03 14:00:22', NULL, 'success'),
(57, 5, '::1', 'node', '2026-08-03 14:00:22', NULL, 'success'),
(58, 1, '::1', 'node', '2026-08-03 14:00:50', NULL, 'success'),
(59, 2, '::1', 'node', '2026-08-03 14:00:51', NULL, 'success'),
(60, 3, '::1', 'node', '2026-08-03 14:00:52', NULL, 'success'),
(61, 4, '::1', 'node', '2026-08-03 14:00:52', NULL, 'success'),
(62, 5, '::1', 'node', '2026-08-03 14:00:53', NULL, 'success'),
(63, 1, '::1', 'node', '2026-08-03 14:01:24', NULL, 'success'),
(64, 2, '::1', 'node', '2026-08-03 14:01:24', NULL, 'success'),
(65, 3, '::1', 'node', '2026-08-03 14:01:25', NULL, 'success'),
(66, 4, '::1', 'node', '2026-08-03 14:01:26', NULL, 'success'),
(67, 5, '::1', 'node', '2026-08-03 14:01:27', NULL, 'success'),
(68, 1, '::1', 'node', '2026-08-03 14:33:30', NULL, 'success'),
(69, 2, '::1', 'node', '2026-08-03 14:33:30', NULL, 'success'),
(70, 3, '::1', 'node', '2026-08-03 14:33:31', NULL, 'success'),
(71, 4, '::1', 'node', '2026-08-03 14:33:32', NULL, 'success'),
(72, 5, '::1', 'node', '2026-08-03 14:33:33', NULL, 'success'),
(73, 1, '::1', 'node', '2026-08-03 14:33:34', NULL, 'success'),
(74, 2, '::1', 'node', '2026-08-03 14:33:34', NULL, 'success'),
(75, 3, '::1', 'node', '2026-08-03 14:33:35', NULL, 'success'),
(76, 4, '::1', 'node', '2026-08-03 14:33:36', NULL, 'success'),
(77, 5, '::1', 'node', '2026-08-03 14:33:36', NULL, 'success'),
(78, 1, '::1', 'Mozilla/5.0 (Windows NT; Windows NT 10.0; en-GB) WindowsPowerShell/5.1.26100.8972', '2026-08-03 14:34:13', NULL, 'success'),
(79, 2, '::1', 'Mozilla/5.0 (Windows NT; Windows NT 10.0; en-GB) WindowsPowerShell/5.1.26100.8972', '2026-08-03 14:34:14', NULL, 'success'),
(80, 3, '::1', 'Mozilla/5.0 (Windows NT; Windows NT 10.0; en-GB) WindowsPowerShell/5.1.26100.8972', '2026-08-03 14:34:15', NULL, 'success'),
(81, 1, '::1', 'node', '2026-08-03 15:04:01', NULL, 'success'),
(82, 2, '::1', 'node', '2026-08-03 15:04:01', NULL, 'success'),
(83, 3, '::1', 'node', '2026-08-03 15:04:02', NULL, 'success'),
(84, 4, '::1', 'node', '2026-08-03 15:04:03', NULL, 'success'),
(85, 5, '::1', 'node', '2026-08-03 15:04:04', NULL, 'success'),
(86, 1, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36', '2026-08-03 15:17:27', '2026-08-03 15:17:44', 'success'),
(87, 2, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36', '2026-08-03 15:18:12', '2026-08-03 15:18:29', 'success'),
(88, 3, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36', '2026-08-03 15:18:57', NULL, 'success'),
(89, 4, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36', '2026-08-03 15:19:28', '2026-08-03 15:19:50', 'success'),
(90, 5, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36', '2026-08-03 15:20:04', NULL, 'success'),
(91, 1, '::1', 'node', '2026-08-03 15:36:25', NULL, 'success'),
(92, 2, '::1', 'node', '2026-08-03 15:36:26', NULL, 'success'),
(93, 3, '::1', 'node', '2026-08-03 15:36:27', NULL, 'success'),
(94, 4, '::1', 'node', '2026-08-03 15:36:28', NULL, 'success'),
(95, 5, '::1', 'node', '2026-08-03 15:36:28', NULL, 'success');

-- --------------------------------------------------------

--
-- Table structure for table `notifications`
--

CREATE TABLE `notifications` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `title` varchar(255) NOT NULL,
  `message` text DEFAULT NULL,
  `type` varchar(50) DEFAULT NULL,
  `is_read` tinyint(1) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `notifications`
--

INSERT INTO `notifications` (`id`, `user_id`, `title`, `message`, `type`, `is_read`, `created_at`) VALUES
(1, 2, 'New Patient', 'Patient E2E Test1785733277288 registered', 'patient', 0, '2026-08-03 05:01:17'),
(2, 6, 'New Patient', 'Patient E2E Test1785733277288 registered', 'patient', 0, '2026-08-03 05:01:17'),
(3, 8, 'New Patient', 'Patient E2E Test1785733277288 registered', 'patient', 0, '2026-08-03 05:01:17'),
(4, 3, 'New Patient', 'Patient E2E Test1785733277288 registered', 'patient', 0, '2026-08-03 05:01:17'),
(5, 7, 'New Patient', 'Patient E2E Test1785733277288 registered', 'patient', 0, '2026-08-03 05:01:17'),
(6, 9, 'New Patient', 'Patient E2E Test1785733277288 registered', 'patient', 0, '2026-08-03 05:01:17'),
(8, 4, 'Conference Created', 'You are invited to conference CONF-MSCRHJ9O-A303', 'conference', 0, '2026-08-03 05:01:17'),
(9, 5, 'Conference Created', 'You are invited to conference CONF-MSCRHJ9O-A303', 'conference', 0, '2026-08-03 05:01:17'),
(10, 2, 'Task Assigned', 'New task: E2E Task', 'task', 0, '2026-08-03 05:01:17'),
(11, 2, 'New Patient', 'Patient E2E Test1785765653369 registered', 'patient', 0, '2026-08-03 14:00:53'),
(12, 6, 'New Patient', 'Patient E2E Test1785765653369 registered', 'patient', 0, '2026-08-03 14:00:53'),
(13, 8, 'New Patient', 'Patient E2E Test1785765653369 registered', 'patient', 0, '2026-08-03 14:00:53'),
(14, 3, 'New Patient', 'Patient E2E Test1785765653369 registered', 'patient', 0, '2026-08-03 14:00:53'),
(15, 7, 'New Patient', 'Patient E2E Test1785765653369 registered', 'patient', 0, '2026-08-03 14:00:53'),
(16, 9, 'New Patient', 'Patient E2E Test1785765653369 registered', 'patient', 0, '2026-08-03 14:00:53'),
(18, 2, 'New Patient', 'Patient E2E Test1785765687030 registered', 'patient', 0, '2026-08-03 14:01:27'),
(19, 6, 'New Patient', 'Patient E2E Test1785765687030 registered', 'patient', 0, '2026-08-03 14:01:27'),
(20, 8, 'New Patient', 'Patient E2E Test1785765687030 registered', 'patient', 0, '2026-08-03 14:01:27'),
(21, 3, 'New Patient', 'Patient E2E Test1785765687030 registered', 'patient', 0, '2026-08-03 14:01:27'),
(22, 7, 'New Patient', 'Patient E2E Test1785765687030 registered', 'patient', 0, '2026-08-03 14:01:27'),
(23, 9, 'New Patient', 'Patient E2E Test1785765687030 registered', 'patient', 0, '2026-08-03 14:01:27'),
(25, 2, 'Task Assigned', 'New task: E2E Task 1785765687030', 'task', 0, '2026-08-03 14:01:27'),
(26, 2, 'New Patient', 'Patient E2E Test1785767616664 registered', 'patient', 0, '2026-08-03 14:33:36'),
(27, 6, 'New Patient', 'Patient E2E Test1785767616664 registered', 'patient', 0, '2026-08-03 14:33:36'),
(28, 8, 'New Patient', 'Patient E2E Test1785767616664 registered', 'patient', 0, '2026-08-03 14:33:36'),
(29, 3, 'New Patient', 'Patient E2E Test1785767616664 registered', 'patient', 0, '2026-08-03 14:33:36'),
(30, 7, 'New Patient', 'Patient E2E Test1785767616664 registered', 'patient', 0, '2026-08-03 14:33:36'),
(31, 9, 'New Patient', 'Patient E2E Test1785767616664 registered', 'patient', 0, '2026-08-03 14:33:36'),
(33, 2, 'Task Assigned', 'New task: E2E Task 1785767616664', 'task', 0, '2026-08-03 14:33:36'),
(34, 2, 'New Patient', 'Patient E2E Test1785769444685 registered', 'patient', 0, '2026-08-03 15:04:04'),
(35, 6, 'New Patient', 'Patient E2E Test1785769444685 registered', 'patient', 0, '2026-08-03 15:04:04'),
(36, 8, 'New Patient', 'Patient E2E Test1785769444685 registered', 'patient', 0, '2026-08-03 15:04:04'),
(37, 10, 'New Patient', 'Patient E2E Test1785769444685 registered', 'patient', 0, '2026-08-03 15:04:04'),
(38, 3, 'New Patient', 'Patient E2E Test1785769444685 registered', 'patient', 0, '2026-08-03 15:04:04'),
(39, 7, 'New Patient', 'Patient E2E Test1785769444685 registered', 'patient', 0, '2026-08-03 15:04:04'),
(40, 9, 'New Patient', 'Patient E2E Test1785769444685 registered', 'patient', 0, '2026-08-03 15:04:04'),
(41, 11, 'New Patient', 'Patient E2E Test1785769444685 registered', 'patient', 0, '2026-08-03 15:04:04'),
(49, 2, 'Task Assigned', 'New task: E2E Task 1785769444685', 'task', 0, '2026-08-03 15:04:04'),
(50, 2, 'New Patient', 'Patient E2E Test1785771388804 registered', 'patient', 0, '2026-08-03 15:36:28'),
(51, 6, 'New Patient', 'Patient E2E Test1785771388804 registered', 'patient', 0, '2026-08-03 15:36:28'),
(52, 8, 'New Patient', 'Patient E2E Test1785771388804 registered', 'patient', 0, '2026-08-03 15:36:28'),
(53, 10, 'New Patient', 'Patient E2E Test1785771388804 registered', 'patient', 0, '2026-08-03 15:36:28'),
(54, 3, 'New Patient', 'Patient E2E Test1785771388804 registered', 'patient', 0, '2026-08-03 15:36:28'),
(55, 7, 'New Patient', 'Patient E2E Test1785771388804 registered', 'patient', 0, '2026-08-03 15:36:28'),
(56, 9, 'New Patient', 'Patient E2E Test1785771388804 registered', 'patient', 0, '2026-08-03 15:36:28'),
(57, 11, 'New Patient', 'Patient E2E Test1785771388804 registered', 'patient', 0, '2026-08-03 15:36:28'),
(65, 2, 'Task Assigned', 'New task: E2E Task 1785771388804', 'task', 0, '2026-08-03 15:36:28');

-- --------------------------------------------------------

--
-- Table structure for table `patients`
--

CREATE TABLE `patients` (
  `id` int(11) NOT NULL,
  `patient_code` varchar(50) DEFAULT NULL,
  `first_name` varchar(100) NOT NULL,
  `last_name` varchar(100) NOT NULL,
  `dob` date DEFAULT NULL,
  `gender` enum('male','female','other') DEFAULT NULL,
  `nic` varchar(50) DEFAULT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `email` varchar(255) DEFAULT NULL,
  `address` text DEFAULT NULL,
  `medical_history` text DEFAULT NULL,
  `emergency_contact` varchar(255) DEFAULT NULL,
  `insurance` varchar(255) DEFAULT NULL,
  `status` enum('active','inactive') DEFAULT 'active',
  `created_by` int(11) DEFAULT NULL,
  `assigned_gp_id` int(11) DEFAULT NULL,
  `assigned_ahp_id` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `patients`
--

INSERT INTO `patients` (`id`, `patient_code`, `first_name`, `last_name`, `dob`, `gender`, `nic`, `phone`, `email`, `address`, `medical_history`, `emergency_contact`, `insurance`, `status`, `created_by`, `assigned_gp_id`, `assigned_ahp_id`, `created_at`, `updated_at`) VALUES
(1, 'PAT-DEMO001', 'Alice', 'Perera', '1985-03-15', 'female', NULL, '+94772222001', NULL, NULL, NULL, NULL, NULL, 'active', 3, 1, 1, '2026-08-02 16:42:57', '2026-08-02 16:42:57'),
(2, 'PAT-DEMO002', 'Bob', 'Fernando', '1978-07-22', 'male', NULL, '+94772222002', NULL, NULL, NULL, NULL, NULL, 'active', 3, 1, 1, '2026-08-02 16:42:57', '2026-08-02 16:42:57'),
(3, 'PAT-MSCRHJ73-QTL9', 'E2E', 'Test1785733277288', '1990-01-15', 'male', 'NIC1785733277288', '+94770000001', 'e2e1785733277288@test.com', NULL, NULL, NULL, NULL, 'active', 3, 1, 1, '2026-08-03 05:01:17', '2026-08-03 05:01:17'),
(4, 'PAT-MSDARGQM-LFL5', 'E2E', 'Test1785765653369', '1990-01-01', 'male', 'NIC1785765653369', '0771234567', 'e2e1785765653369@test.com', NULL, NULL, NULL, NULL, 'active', 3, NULL, NULL, '2026-08-03 14:00:53', '2026-08-03 14:00:53'),
(5, 'PAT-MSDAS6PL-VSK6', 'E2E', 'Test1785765687030', '1990-01-01', 'male', 'NIC1785765687030', '0771234567', 'e2e1785765687030@test.com', NULL, NULL, NULL, NULL, 'active', 3, NULL, NULL, '2026-08-03 14:01:27', '2026-08-03 14:01:27'),
(6, 'PAT-MSDBXJMJ-X6ZK', 'E2E', 'Test1785767616664', '1990-01-01', 'male', 'NIC1785767616664', '0771234567', 'e2e1785767616664@test.com', NULL, NULL, NULL, NULL, 'active', 3, NULL, NULL, '2026-08-03 14:33:36', '2026-08-03 14:33:36'),
(7, 'PAT-MSDD0Q51-5EU0', 'E2E', 'Test1785769444685', '1990-01-01', 'male', 'NIC1785769444685', '0771234567', 'e2e1785769444685@test.com', NULL, NULL, NULL, NULL, 'active', 3, NULL, NULL, '2026-08-03 15:04:04', '2026-08-03 15:04:04'),
(8, 'PAT-MSDE6E8A-UJIA', 'E2E', 'Test1785771388804', '1990-01-01', 'male', 'NIC1785771388804', '0771234567', 'e2e1785771388804@test.com', NULL, NULL, NULL, NULL, 'active', 3, NULL, NULL, '2026-08-03 15:36:28', '2026-08-03 15:36:28');

-- --------------------------------------------------------

--
-- Table structure for table `patient_notes`
--

CREATE TABLE `patient_notes` (
  `id` int(11) NOT NULL,
  `patient_id` int(11) NOT NULL,
  `gp_id` int(11) DEFAULT NULL,
  `note` text NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `patient_notes`
--

INSERT INTO `patient_notes` (`id`, `patient_id`, `gp_id`, `note`, `created_at`, `updated_at`) VALUES
(1, 3, 1, 'E2E medical note from GP', '2026-08-03 05:01:18', '2026-08-03 05:01:18'),
(2, 5, 1, 'E2E medical note from GP', '2026-08-03 14:01:27', '2026-08-03 14:01:27'),
(3, 6, 1, 'E2E medical note from GP', '2026-08-03 14:33:36', '2026-08-03 14:33:36'),
(4, 7, 1, 'E2E medical note from GP', '2026-08-03 15:04:04', '2026-08-03 15:04:04'),
(5, 8, 1, 'E2E medical note from GP', '2026-08-03 15:36:28', '2026-08-03 15:36:28');

-- --------------------------------------------------------

--
-- Table structure for table `patient_reports`
--

CREATE TABLE `patient_reports` (
  `id` int(11) NOT NULL,
  `patient_id` int(11) NOT NULL,
  `ahp_id` int(11) DEFAULT NULL,
  `report_content` text NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `patient_reports`
--

INSERT INTO `patient_reports` (`id`, `patient_id`, `ahp_id`, `report_content`, `created_at`, `updated_at`) VALUES
(1, 3, 1, 'E2E allied health report', '2026-08-03 05:01:18', '2026-08-03 05:01:18'),
(2, 5, 1, 'E2E AHP patient report', '2026-08-03 14:01:27', '2026-08-03 14:01:27'),
(3, 6, 1, 'E2E AHP patient report', '2026-08-03 14:33:36', '2026-08-03 14:33:36'),
(4, 7, 1, 'E2E AHP patient report', '2026-08-03 15:04:04', '2026-08-03 15:04:04'),
(5, 8, 1, 'E2E AHP patient report', '2026-08-03 15:36:28', '2026-08-03 15:36:28');

-- --------------------------------------------------------

--
-- Table structure for table `receptionists`
--

CREATE TABLE `receptionists` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `receptionist_code` varchar(50) DEFAULT NULL,
  `created_by` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `receptionists`
--

INSERT INTO `receptionists` (`id`, `user_id`, `receptionist_code`, `created_by`, `created_at`, `updated_at`) VALUES
(1, 3, 'REC-DEMO001', 2, '2026-08-02 16:42:57', '2026-08-02 16:42:57'),
(2, 7, 'REC-MSC15I7K-XQCS', 6, '2026-08-02 16:44:06', '2026-08-02 16:44:06'),
(3, 9, 'REC-MSC1T2E3-9ES1', 2, '2026-08-02 17:02:25', '2026-08-02 17:02:25'),
(4, 11, 'REC-MSDBYD2Z-JBSS', 2, '2026-08-03 14:34:15', '2026-08-03 14:34:15');

-- --------------------------------------------------------

--
-- Table structure for table `reports`
--

CREATE TABLE `reports` (
  `id` int(11) NOT NULL,
  `report_type` enum('conference','patient','gp','ahp','activity','login') NOT NULL,
  `title` varchar(255) DEFAULT NULL,
  `generated_by` int(11) DEFAULT NULL,
  `file_path` varchar(500) DEFAULT NULL,
  `parameters` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`parameters`)),
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `roles`
--

CREATE TABLE `roles` (
  `id` int(11) NOT NULL,
  `name` varchar(50) NOT NULL,
  `description` varchar(255) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `roles`
--

INSERT INTO `roles` (`id`, `name`, `description`, `created_at`) VALUES
(1, 'super_admin', 'Highest authority', '2026-07-30 11:37:34'),
(2, 'admin', 'Hospital administrator', '2026-07-30 11:37:34'),
(3, 'receptionist', 'Front desk manager', '2026-07-30 11:37:34'),
(4, 'gp', 'General Practitioner', '2026-07-30 11:37:34'),
(5, 'ahp', 'Allied Health Professional', '2026-07-30 11:37:34');

-- --------------------------------------------------------

--
-- Table structure for table `settings`
--

CREATE TABLE `settings` (
  `id` int(11) NOT NULL,
  `setting_key` varchar(100) NOT NULL,
  `setting_value` text DEFAULT NULL,
  `updated_by` int(11) DEFAULT NULL,
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `settings`
--

INSERT INTO `settings` (`id`, `setting_key`, `setting_value`, `updated_by`, `updated_at`) VALUES
(1, 'hospital_name', 'AMC Healthcare', NULL, '2026-07-30 11:37:35'),
(2, 'timezone', 'Asia/Colombo', NULL, '2026-07-30 11:37:35'),
(3, 'language', 'en', NULL, '2026-07-30 11:37:35'),
(4, 'theme', 'light', NULL, '2026-07-30 11:37:35');

-- --------------------------------------------------------

--
-- Table structure for table `tasks`
--

CREATE TABLE `tasks` (
  `id` int(11) NOT NULL,
  `title` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `assigned_to` int(11) NOT NULL,
  `assigned_by` int(11) DEFAULT NULL,
  `due_date` date DEFAULT NULL,
  `priority` enum('low','medium','high','critical') DEFAULT 'medium',
  `status` enum('pending','in_progress','completed') DEFAULT 'pending',
  `reminder_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `tasks`
--

INSERT INTO `tasks` (`id`, `title`, `description`, `assigned_to`, `assigned_by`, `due_date`, `priority`, `status`, `reminder_at`, `created_at`, `updated_at`) VALUES
(1, 'Review patient file', 'Prepare notes before teleconference', 3, 2, '2026-08-02', 'medium', 'pending', NULL, '2026-08-02 16:42:57', '2026-08-02 16:42:57'),
(2, 'E2E Task', 'Verify task workflow', 2, 3, '2026-08-03', 'medium', 'pending', NULL, '2026-08-03 05:01:17', '2026-08-03 05:01:17'),
(3, 'E2E Task 1785765687030', 'Verification task', 2, 3, NULL, 'medium', 'pending', NULL, '2026-08-03 14:01:27', '2026-08-03 14:01:27'),
(4, 'E2E Task 1785767616664', 'Verification task', 2, 3, NULL, 'medium', 'pending', NULL, '2026-08-03 14:33:36', '2026-08-03 14:33:36'),
(5, 'E2E Task 1785769444685', 'Verification task', 2, 3, NULL, 'medium', 'pending', NULL, '2026-08-03 15:04:04', '2026-08-03 15:04:04'),
(6, 'E2E Task 1785771388804', 'Verification task', 2, 3, NULL, 'medium', 'pending', NULL, '2026-08-03 15:36:28', '2026-08-03 15:36:28');

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` int(11) NOT NULL,
  `role_id` int(11) NOT NULL,
  `email` varchar(255) NOT NULL,
  `username` varchar(100) DEFAULT NULL,
  `password_hash` varchar(255) NOT NULL,
  `status` enum('active','inactive','disabled') DEFAULT 'active',
  `refresh_token` text DEFAULT NULL,
  `last_login` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `role_id`, `email`, `username`, `password_hash`, `status`, `refresh_token`, `last_login`, `created_at`, `updated_at`) VALUES
(1, 1, 'superadmin@amc.com', 'superadmin', '$2b$12$xAX6ohPZHeG6Q77Rt/nli.LpE7szfqdlrovSia/7rIUMY1w4WLXrm', 'active', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiZW1haWwiOiJzdXBlcmFkbWluQGFtYy5jb20iLCJyb2xlIjoic3VwZXJfYWRtaW4iLCJpYXQiOjE3ODU3NzEzODUsImV4cCI6MTc4NjM3NjE4NX0.dUUkZCycAmSVA_cuNdZNy7W7HCkRY5Sc40FcxTVMnfo', '2026-08-03 15:36:25', '2026-07-30 11:37:35', '2026-08-03 15:36:25'),
(2, 2, 'admin@amc.com', 'admin_demo', '$2b$12$UiDSbc.h4g0No7xkj4V8vO8HK8I7C5npT2jX6Kb/eWf4jdeOu5d16', 'active', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MiwiZW1haWwiOiJhZG1pbkBhbWMuY29tIiwicm9sZSI6ImFkbWluIiwiaWF0IjoxNzg1NzcxMzg2LCJleHAiOjE3ODYzNzYxODZ9.dlC-9ZriVcf8VEvmmSK0Shp8ATs3ajInrKCpMIKKfWg', '2026-08-03 15:36:26', '2026-08-02 16:42:57', '2026-08-03 15:36:26'),
(3, 3, 'receptionist@amc.com', 'receptionist_demo', '$2b$12$UiDSbc.h4g0No7xkj4V8vO8HK8I7C5npT2jX6Kb/eWf4jdeOu5d16', 'active', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MywiZW1haWwiOiJyZWNlcHRpb25pc3RAYW1jLmNvbSIsInJvbGUiOiJyZWNlcHRpb25pc3QiLCJpYXQiOjE3ODU3NzEzODcsImV4cCI6MTc4NjM3NjE4N30.jRfR6BELIsBKCKYOXUgJlKTBApAXdIcAtnno04auIrU', '2026-08-03 15:36:27', '2026-08-02 16:42:57', '2026-08-03 15:36:27'),
(4, 4, 'gp@amc.com', 'gp_demo', '$2b$12$UiDSbc.h4g0No7xkj4V8vO8HK8I7C5npT2jX6Kb/eWf4jdeOu5d16', 'active', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6NCwiZW1haWwiOiJncEBhbWMuY29tIiwicm9sZSI6ImdwIiwiaWF0IjoxNzg1NzcxMzg4LCJleHAiOjE3ODYzNzYxODh9.bN3we1DWsm7oQr0pAuan9InMNDLQVv9iCRvU-MyHKnY', '2026-08-03 15:36:28', '2026-08-02 16:42:57', '2026-08-03 15:36:28'),
(5, 5, 'ahp@amc.com', 'ahp_demo', '$2b$12$UiDSbc.h4g0No7xkj4V8vO8HK8I7C5npT2jX6Kb/eWf4jdeOu5d16', 'active', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6NSwiZW1haWwiOiJhaHBAYW1jLmNvbSIsInJvbGUiOiJhaHAiLCJpYXQiOjE3ODU3NzEzODgsImV4cCI6MTc4NjM3NjE4OH0.IsKcCGnxebyBSz5i3QeVtbFHOm_jjIi8UyVXg6WFYns', '2026-08-03 15:36:28', '2026-08-02 16:42:57', '2026-08-03 15:36:28'),
(6, 2, 'testadmin_1165453774@amc.com', 'testadmin_1165453774', '$2b$12$hQT1ixRc21zytBzpWYRtJOr16DoP0wTJiVuBskfYLFkxnJfks.v/u', 'active', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6NiwiZW1haWwiOiJ0ZXN0YWRtaW5fMTE2NTQ1Mzc3NEBhbWMuY29tIiwicm9sZSI6ImFkbWluIiwiaWF0IjoxNzg1Njg5MDQ1LCJleHAiOjE3ODYyOTM4NDV9.Op-JOJhmiUhGvu5MJ7DV81fzWhQYK5pkQZY70Y2xrcU', '2026-08-02 16:44:05', '2026-08-02 16:44:05', '2026-08-02 16:44:05'),
(7, 3, 'testrec_295440476@amc.com', 'testrec_295440476', '$2b$12$Ee2HzTqUXeA5TIq.5Rfnqejrnq2oPeSZH44PSrdI2x/rMPYHzsTQK', 'active', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6NywiZW1haWwiOiJ0ZXN0cmVjXzI5NTQ0MDQ3NkBhbWMuY29tIiwicm9sZSI6InJlY2VwdGlvbmlzdCIsImlhdCI6MTc4NTY4OTA0NywiZXhwIjoxNzg2MjkzODQ3fQ.Hwp_r_85XA--qbPpzBiDAL3T50cOxWFPK_9WkBCh3vU', '2026-08-02 16:44:07', '2026-08-02 16:44:06', '2026-08-02 16:44:07'),
(8, 2, 'testadmin@amc.com', 'testadmin', '$2b$12$ay8TXg1rsTGmvbyR.uArseQCRqtc2CrOEw94jMUj1qzePDkAsbhqO', 'active', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6OCwiZW1haWwiOiJ0ZXN0YWRtaW5AYW1jLmNvbSIsInJvbGUiOiJhZG1pbiIsImlhdCI6MTc4NTczMzYwMiwiZXhwIjoxNzg2MzM4NDAyfQ.yxWe6m_v5-ZzIWwFN7uQ5FPh1pSklAYuZHoWQK3sQVg', '2026-08-03 05:06:42', '2026-08-02 16:51:49', '2026-08-03 05:06:42'),
(9, 3, 'testreceptionist@amc.com', 'testreceptionist', '$2b$12$YgHGwPFmIFB4nxr.TwpUJuPYK3X5HkyKHWRA3c1E5c1fjrHdkF0Zu', 'active', NULL, '2026-08-03 05:07:23', '2026-08-02 17:02:25', '2026-08-03 15:16:55'),
(10, 2, 'runtest.admin.1785767652870@amc.com', 'runtest_admin_1785767652870', '$2b$12$w2MlHrxxn4fQz/K5iqixDuyjHlgwSWF5HGat/9V9pqXFN1I0RNUIK', 'active', NULL, NULL, '2026-08-03 14:34:14', '2026-08-03 14:34:14'),
(11, 3, 'runtest.rec.1785767652870@amc.com', 'runtest_rec_1785767652870', '$2b$12$nVsm8/iZLYiAgMsOAOcryeMAezHo8jNgeDGWXS.Nf7WQgfHMgIALK', 'active', NULL, NULL, '2026-08-03 14:34:15', '2026-08-03 14:34:15');

-- --------------------------------------------------------

--
-- Table structure for table `user_profiles`
--

CREATE TABLE `user_profiles` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `first_name` varchar(100) DEFAULT NULL,
  `last_name` varchar(100) DEFAULT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `profile_picture` varchar(500) DEFAULT NULL,
  `address` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `user_profiles`
--

INSERT INTO `user_profiles` (`id`, `user_id`, `first_name`, `last_name`, `phone`, `profile_picture`, `address`, `created_at`, `updated_at`) VALUES
(1, 1, 'Super', 'Admin', '+94770000001', NULL, NULL, '2026-07-30 11:37:35', '2026-07-30 11:37:35'),
(2, 2, 'Hospital', 'Admin', '+94771111001', NULL, NULL, '2026-08-02 16:42:57', '2026-08-02 16:42:57'),
(3, 3, 'Front', 'Desk', '+94771111002', NULL, NULL, '2026-08-02 16:42:57', '2026-08-02 16:42:57'),
(4, 4, 'John', 'Smith', '+94771111003', NULL, NULL, '2026-08-02 16:42:57', '2026-08-02 16:42:57'),
(5, 5, 'Jane', 'Doe', '+94771111004', NULL, NULL, '2026-08-02 16:42:57', '2026-08-02 16:42:57'),
(6, 6, 'Test', 'Hospital Admin', '+94771234567', NULL, NULL, '2026-08-02 16:44:05', '2026-08-02 16:44:05'),
(7, 7, 'Test', 'Receptionist', '+94779876543', NULL, NULL, '2026-08-02 16:44:06', '2026-08-02 16:44:06'),
(8, 8, 'Test', 'Admin', '+94771234567', NULL, NULL, '2026-08-02 16:51:49', '2026-08-02 16:51:49'),
(9, 9, 'Test', 'Receptionist', '+94770000001', NULL, NULL, '2026-08-02 17:02:25', '2026-08-02 17:02:25'),
(10, 10, 'Run', 'Test Admin', '+94770000002', NULL, NULL, '2026-08-03 14:34:14', '2026-08-03 14:34:14'),
(11, 11, 'Run', 'Test Rec', '+94770000001', NULL, NULL, '2026-08-03 14:34:15', '2026-08-03 14:34:15');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `admins`
--
ALTER TABLE `admins`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `user_id` (`user_id`),
  ADD UNIQUE KEY `admin_code` (`admin_code`),
  ADD KEY `created_by` (`created_by`);

--
-- Indexes for table `allied_health_professionals`
--
ALTER TABLE `allied_health_professionals`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `user_id` (`user_id`),
  ADD UNIQUE KEY `ahp_code` (`ahp_code`),
  ADD KEY `created_by` (`created_by`);

--
-- Indexes for table `appointments`
--
ALTER TABLE `appointments`
  ADD PRIMARY KEY (`id`),
  ADD KEY `patient_id` (`patient_id`),
  ADD KEY `gp_id` (`gp_id`),
  ADD KEY `ahp_id` (`ahp_id`),
  ADD KEY `created_by` (`created_by`);

--
-- Indexes for table `audit_logs`
--
ALTER TABLE `audit_logs`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_audit_logs_user` (`user_id`),
  ADD KEY `idx_audit_logs_action` (`action`);

--
-- Indexes for table `conferences`
--
ALTER TABLE `conferences`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `conference_code` (`conference_code`),
  ADD KEY `patient_id` (`patient_id`),
  ADD KEY `gp_id` (`gp_id`),
  ADD KEY `ahp_id` (`ahp_id`),
  ADD KEY `created_by` (`created_by`),
  ADD KEY `idx_conferences_date` (`scheduled_date`),
  ADD KEY `idx_conferences_status` (`status`);

--
-- Indexes for table `conference_participants`
--
ALTER TABLE `conference_participants`
  ADD PRIMARY KEY (`id`),
  ADD KEY `conference_id` (`conference_id`),
  ADD KEY `user_id` (`user_id`);

--
-- Indexes for table `gps`
--
ALTER TABLE `gps`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `user_id` (`user_id`),
  ADD UNIQUE KEY `gp_code` (`gp_code`),
  ADD KEY `created_by` (`created_by`);

--
-- Indexes for table `login_history`
--
ALTER TABLE `login_history`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`);

--
-- Indexes for table `notifications`
--
ALTER TABLE `notifications`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_notifications_user` (`user_id`,`is_read`);

--
-- Indexes for table `patients`
--
ALTER TABLE `patients`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `patient_code` (`patient_code`),
  ADD KEY `created_by` (`created_by`),
  ADD KEY `assigned_gp_id` (`assigned_gp_id`),
  ADD KEY `assigned_ahp_id` (`assigned_ahp_id`),
  ADD KEY `idx_patients_status` (`status`);

--
-- Indexes for table `patient_notes`
--
ALTER TABLE `patient_notes`
  ADD PRIMARY KEY (`id`),
  ADD KEY `patient_id` (`patient_id`),
  ADD KEY `gp_id` (`gp_id`);

--
-- Indexes for table `patient_reports`
--
ALTER TABLE `patient_reports`
  ADD PRIMARY KEY (`id`),
  ADD KEY `patient_id` (`patient_id`),
  ADD KEY `ahp_id` (`ahp_id`);

--
-- Indexes for table `receptionists`
--
ALTER TABLE `receptionists`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `user_id` (`user_id`),
  ADD UNIQUE KEY `receptionist_code` (`receptionist_code`),
  ADD KEY `created_by` (`created_by`);

--
-- Indexes for table `reports`
--
ALTER TABLE `reports`
  ADD PRIMARY KEY (`id`),
  ADD KEY `generated_by` (`generated_by`);

--
-- Indexes for table `roles`
--
ALTER TABLE `roles`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `name` (`name`);

--
-- Indexes for table `settings`
--
ALTER TABLE `settings`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `setting_key` (`setting_key`),
  ADD KEY `updated_by` (`updated_by`);

--
-- Indexes for table `tasks`
--
ALTER TABLE `tasks`
  ADD PRIMARY KEY (`id`),
  ADD KEY `assigned_by` (`assigned_by`),
  ADD KEY `idx_tasks_assigned` (`assigned_to`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`),
  ADD UNIQUE KEY `username` (`username`),
  ADD KEY `idx_users_role` (`role_id`),
  ADD KEY `idx_users_status` (`status`);

--
-- Indexes for table `user_profiles`
--
ALTER TABLE `user_profiles`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `user_id` (`user_id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `admins`
--
ALTER TABLE `admins`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `allied_health_professionals`
--
ALTER TABLE `allied_health_professionals`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `appointments`
--
ALTER TABLE `appointments`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT for table `audit_logs`
--
ALTER TABLE `audit_logs`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=124;

--
-- AUTO_INCREMENT for table `conferences`
--
ALTER TABLE `conferences`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT for table `conference_participants`
--
ALTER TABLE `conference_participants`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `gps`
--
ALTER TABLE `gps`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `login_history`
--
ALTER TABLE `login_history`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=96;

--
-- AUTO_INCREMENT for table `notifications`
--
ALTER TABLE `notifications`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=66;

--
-- AUTO_INCREMENT for table `patients`
--
ALTER TABLE `patients`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT for table `patient_notes`
--
ALTER TABLE `patient_notes`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `patient_reports`
--
ALTER TABLE `patient_reports`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `receptionists`
--
ALTER TABLE `receptionists`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `reports`
--
ALTER TABLE `reports`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `roles`
--
ALTER TABLE `roles`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `settings`
--
ALTER TABLE `settings`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `tasks`
--
ALTER TABLE `tasks`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=12;

--
-- AUTO_INCREMENT for table `user_profiles`
--
ALTER TABLE `user_profiles`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=12;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `admins`
--
ALTER TABLE `admins`
  ADD CONSTRAINT `admins_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `admins_ibfk_2` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `allied_health_professionals`
--
ALTER TABLE `allied_health_professionals`
  ADD CONSTRAINT `allied_health_professionals_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `allied_health_professionals_ibfk_2` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `appointments`
--
ALTER TABLE `appointments`
  ADD CONSTRAINT `appointments_ibfk_1` FOREIGN KEY (`patient_id`) REFERENCES `patients` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `appointments_ibfk_2` FOREIGN KEY (`gp_id`) REFERENCES `gps` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `appointments_ibfk_3` FOREIGN KEY (`ahp_id`) REFERENCES `allied_health_professionals` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `appointments_ibfk_4` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `audit_logs`
--
ALTER TABLE `audit_logs`
  ADD CONSTRAINT `audit_logs_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `conferences`
--
ALTER TABLE `conferences`
  ADD CONSTRAINT `conferences_ibfk_1` FOREIGN KEY (`patient_id`) REFERENCES `patients` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `conferences_ibfk_2` FOREIGN KEY (`gp_id`) REFERENCES `gps` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `conferences_ibfk_3` FOREIGN KEY (`ahp_id`) REFERENCES `allied_health_professionals` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `conferences_ibfk_4` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `conference_participants`
--
ALTER TABLE `conference_participants`
  ADD CONSTRAINT `conference_participants_ibfk_1` FOREIGN KEY (`conference_id`) REFERENCES `conferences` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `conference_participants_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `gps`
--
ALTER TABLE `gps`
  ADD CONSTRAINT `gps_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `gps_ibfk_2` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `login_history`
--
ALTER TABLE `login_history`
  ADD CONSTRAINT `login_history_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `notifications`
--
ALTER TABLE `notifications`
  ADD CONSTRAINT `notifications_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `patients`
--
ALTER TABLE `patients`
  ADD CONSTRAINT `patients_ibfk_1` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `patients_ibfk_2` FOREIGN KEY (`assigned_gp_id`) REFERENCES `gps` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `patients_ibfk_3` FOREIGN KEY (`assigned_ahp_id`) REFERENCES `allied_health_professionals` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `patient_notes`
--
ALTER TABLE `patient_notes`
  ADD CONSTRAINT `patient_notes_ibfk_1` FOREIGN KEY (`patient_id`) REFERENCES `patients` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `patient_notes_ibfk_2` FOREIGN KEY (`gp_id`) REFERENCES `gps` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `patient_reports`
--
ALTER TABLE `patient_reports`
  ADD CONSTRAINT `patient_reports_ibfk_1` FOREIGN KEY (`patient_id`) REFERENCES `patients` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `patient_reports_ibfk_2` FOREIGN KEY (`ahp_id`) REFERENCES `allied_health_professionals` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `receptionists`
--
ALTER TABLE `receptionists`
  ADD CONSTRAINT `receptionists_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `receptionists_ibfk_2` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `reports`
--
ALTER TABLE `reports`
  ADD CONSTRAINT `reports_ibfk_1` FOREIGN KEY (`generated_by`) REFERENCES `users` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `settings`
--
ALTER TABLE `settings`
  ADD CONSTRAINT `settings_ibfk_1` FOREIGN KEY (`updated_by`) REFERENCES `users` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `tasks`
--
ALTER TABLE `tasks`
  ADD CONSTRAINT `tasks_ibfk_1` FOREIGN KEY (`assigned_to`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `tasks_ibfk_2` FOREIGN KEY (`assigned_by`) REFERENCES `users` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `users`
--
ALTER TABLE `users`
  ADD CONSTRAINT `users_ibfk_1` FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`);

--
-- Constraints for table `user_profiles`
--
ALTER TABLE `user_profiles`
  ADD CONSTRAINT `user_profiles_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
