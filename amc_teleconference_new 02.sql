-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Aug 06, 2026 at 08:13 PM
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
-- Database: `amc_teleconference_new`
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
-- Table structure for table `ahp_professions`
--

CREATE TABLE `ahp_professions` (
  `id` int(11) NOT NULL,
  `name` varchar(150) NOT NULL,
  `is_active` tinyint(1) DEFAULT 1,
  `created_by` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `ahp_professions`
--

INSERT INTO `ahp_professions` (`id`, `name`, `is_active`, `created_by`, `created_at`) VALUES
(1, 'Physiotherapist', 1, NULL, '2026-08-05 17:50:03'),
(2, 'Occupational Therapist', 1, NULL, '2026-08-05 17:50:03'),
(3, 'Speech Therapist', 0, NULL, '2026-08-05 17:50:03'),
(4, 'Dietitian', 1, NULL, '2026-08-05 17:50:03'),
(5, 'Psychologist', 1, NULL, '2026-08-05 17:50:03'),
(6, 'Social Worker', 1, NULL, '2026-08-05 17:50:03'),
(7, 'nb', 0, NULL, '2026-08-05 17:56:50'),
(8, 'nv', 0, NULL, '2026-08-05 17:57:02'),
(15, 'eye', 1, 14, '2026-08-06 16:21:50');

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
(1, 5, 'AHP-DEMO001', 'Physiotherapist', 'AHP-67890', NULL, NULL, '2026-08-02 16:42:57', '2026-08-02 16:42:57'),
(2, 13, 'AHP-01', 'ghdf', 'amc', 's, m, Thursday, Sunday, Tuesday', NULL, '2026-08-05 17:40:38', '2026-08-06 07:37:50');

-- --------------------------------------------------------

--
-- Table structure for table `appointments`
--

CREATE TABLE `appointments` (
  `id` int(11) NOT NULL,
  `appointment_code` varchar(50) DEFAULT NULL,
  `patient_id` int(11) NOT NULL,
  `gp_id` int(11) DEFAULT NULL,
  `ahp_id` int(11) DEFAULT NULL,
  `title` varchar(255) DEFAULT NULL,
  `important_note` text DEFAULT NULL,
  `comments` text DEFAULT NULL,
  `patient_previous_records` text DEFAULT NULL,
  `appointment_date` date NOT NULL,
  `appointment_time` time NOT NULL,
  `status` enum('scheduled','confirmed','completed','cancelled','no_show') DEFAULT 'scheduled',
  `cancelled_reason` varchar(255) DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `created_by` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `appointments`
--

INSERT INTO `appointments` (`id`, `appointment_code`, `patient_id`, `gp_id`, `ahp_id`, `title`, `important_note`, `comments`, `patient_previous_records`, `appointment_date`, `appointment_time`, `status`, `cancelled_reason`, `notes`, `created_by`, `created_at`, `updated_at`) VALUES
(1, NULL, 1, 1, NULL, NULL, NULL, NULL, NULL, '2026-08-02', '14:30:00', 'cancelled', 'time out', NULL, NULL, '2026-08-02 16:42:57', '2026-08-06 10:06:13'),
(5, NULL, 6, NULL, NULL, NULL, NULL, NULL, NULL, '2026-08-10', '10:00:00', 'scheduled', NULL, 'E2E test', NULL, '2026-08-03 14:33:36', '2026-08-03 14:33:36'),
(6, NULL, 7, NULL, NULL, NULL, NULL, NULL, NULL, '2026-08-10', '10:00:00', 'scheduled', NULL, 'E2E test', NULL, '2026-08-03 15:04:04', '2026-08-03 15:04:04'),
(8, 'APT-MSHAJKAB-SKU3', 1, 1, 1, 'Test Conference', NULL, NULL, NULL, '2026-08-06', '10:30:00', 'cancelled', 'time out', NULL, 2, '2026-08-06 09:05:49', '2026-08-06 10:06:13'),
(9, 'APT-MSHALFYJ-UWJE', 1, 1, 1, 'JSON Test Conference', NULL, NULL, NULL, '2026-08-06', '14:00:00', 'cancelled', 'time out', NULL, 2, '2026-08-06 09:07:17', '2026-08-06 10:06:13'),
(10, 'APT-DEMO-TODAY', 1, 1, 1, 'Demo Teleconference — Today', NULL, NULL, NULL, '2026-08-06', '22:00:00', 'scheduled', 'time out', 'Sample meeting for GP accept / AHP join workflow', 14, '2026-08-06 09:38:07', '2026-08-06 16:27:08'),
(11, 'APT-DEMO-TODAY-2', 6, 1, 1, 'Follow-up Teleconference', NULL, NULL, NULL, '2026-08-06', '23:33:00', 'scheduled', NULL, 'Second sample meeting today', 14, '2026-08-06 09:39:20', '2026-08-06 16:26:04');

-- --------------------------------------------------------

--
-- Table structure for table `appointment_ahps`
--

CREATE TABLE `appointment_ahps` (
  `id` int(11) NOT NULL,
  `appointment_id` int(11) NOT NULL,
  `profession` varchar(100) NOT NULL,
  `ahp_id` int(11) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `appointment_ahps`
--

INSERT INTO `appointment_ahps` (`id`, `appointment_id`, `profession`, `ahp_id`, `created_at`) VALUES
(1, 8, 'Physiotherapist', 1, '2026-08-06 09:05:49'),
(2, 9, 'Physiotherapist', 1, '2026-08-06 09:07:17'),
(6, 11, 'Physiotherapist', 1, '2026-08-06 16:26:04'),
(7, 10, 'Physiotherapist', 1, '2026-08-06 16:27:08');

-- --------------------------------------------------------

--
-- Table structure for table `appointment_files`
--

CREATE TABLE `appointment_files` (
  `id` int(11) NOT NULL,
  `appointment_id` int(11) NOT NULL,
  `original_name` varchar(255) NOT NULL,
  `stored_name` varchar(255) NOT NULL,
  `file_path` varchar(500) NOT NULL,
  `file_size` int(11) DEFAULT NULL,
  `mime_type` varchar(100) DEFAULT NULL,
  `uploaded_by` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

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
(8, NULL, 'login', NULL, NULL, NULL, '::1', '2026-08-02 16:44:07'),
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
(22, NULL, 'login', NULL, NULL, NULL, '::1', '2026-08-02 17:02:26'),
(23, 2, '', 'receptionist', 3, '{\"status\":\"inactive\"}', '::1', '2026-08-02 17:02:27'),
(24, 2, '', 'receptionist', 3, '{\"status\":\"active\"}', '::1', '2026-08-02 17:02:27'),
(25, NULL, 'login', NULL, NULL, NULL, '::1', '2026-08-02 17:02:47'),
(26, 8, '', 'receptionist', 3, NULL, '::1', '2026-08-02 17:04:15'),
(27, 8, 'logout', NULL, NULL, NULL, '::1', '2026-08-02 17:04:24'),
(28, NULL, 'login', NULL, NULL, NULL, '::1', '2026-08-02 17:04:34'),
(29, NULL, 'logout', NULL, NULL, NULL, '::1', '2026-08-02 17:56:23'),
(30, 8, 'login', NULL, NULL, NULL, '::1', '2026-08-02 18:01:28'),
(31, 1, 'login', NULL, NULL, NULL, '::1', '2026-08-02 18:01:48'),
(32, NULL, 'login', 'auth', NULL, '{\"status\":\"failed\",\"reason\":\"unknown_email\",\"email\":\"nonexistent@test.com\"}', '::1', '2026-08-03 04:59:40'),
(33, 1, 'login', NULL, NULL, NULL, '::1', '2026-08-03 04:59:41'),
(34, 1, 'export', 'audit_logs', NULL, NULL, '::1', '2026-08-03 04:59:41'),
(35, 2, 'login', NULL, NULL, NULL, '::1', '2026-08-03 04:59:42'),
(36, NULL, 'login', NULL, NULL, NULL, '::1', '2026-08-03 04:59:43'),
(37, 4, 'login', NULL, NULL, NULL, '::1', '2026-08-03 04:59:44'),
(38, 5, 'login', NULL, NULL, NULL, '::1', '2026-08-03 04:59:45'),
(39, NULL, 'login', 'auth', NULL, '{\"status\":\"failed\",\"reason\":\"unknown_email\",\"email\":\"nonexistent@test.com\"}', '::1', '2026-08-03 05:01:12'),
(40, 1, 'login', NULL, NULL, NULL, '::1', '2026-08-03 05:01:13'),
(41, 1, 'export', 'audit_logs', NULL, NULL, '::1', '2026-08-03 05:01:13'),
(42, 2, 'login', NULL, NULL, NULL, '::1', '2026-08-03 05:01:14'),
(43, NULL, 'login', NULL, NULL, NULL, '::1', '2026-08-03 05:01:15'),
(44, 4, 'login', NULL, NULL, NULL, '::1', '2026-08-03 05:01:16'),
(45, 5, 'login', NULL, NULL, NULL, '::1', '2026-08-03 05:01:17'),
(46, 4, 'login', NULL, NULL, NULL, '::1', '2026-08-03 05:01:18'),
(47, 5, 'login', NULL, NULL, NULL, '::1', '2026-08-03 05:01:18'),
(48, 1, 'login', NULL, NULL, NULL, '::1', '2026-08-03 05:06:18'),
(49, 8, 'login', NULL, NULL, NULL, '::1', '2026-08-03 05:06:42'),
(50, NULL, 'login', NULL, NULL, NULL, '::1', '2026-08-03 05:07:23'),
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
(61, NULL, 'login', NULL, NULL, NULL, '::1', '2026-08-03 13:59:48'),
(62, 4, 'login', NULL, NULL, NULL, '::1', '2026-08-03 13:59:48'),
(63, 5, 'login', NULL, NULL, NULL, '::1', '2026-08-03 13:59:49'),
(64, NULL, 'login', 'auth', NULL, '{\"status\":\"failed\",\"reason\":\"unknown_email\",\"email\":\"nonexistent@test.com\"}', '::1', '2026-08-03 14:00:19'),
(65, 1, 'login', NULL, NULL, NULL, '::1', '2026-08-03 14:00:20'),
(66, 1, 'export', 'audit_logs', NULL, NULL, '::1', '2026-08-03 14:00:20'),
(67, 2, 'login', NULL, NULL, NULL, '::1', '2026-08-03 14:00:20'),
(68, NULL, 'login', NULL, NULL, NULL, '::1', '2026-08-03 14:00:21'),
(69, 4, 'login', NULL, NULL, NULL, '::1', '2026-08-03 14:00:22'),
(70, 5, 'login', NULL, NULL, NULL, '::1', '2026-08-03 14:00:22'),
(71, NULL, 'login', 'auth', NULL, '{\"status\":\"failed\",\"reason\":\"unknown_email\",\"email\":\"nonexistent@test.com\"}', '::1', '2026-08-03 14:00:50'),
(72, 1, 'login', NULL, NULL, NULL, '::1', '2026-08-03 14:00:50'),
(73, 1, 'export', 'audit_logs', NULL, NULL, '::1', '2026-08-03 14:00:50'),
(74, 2, 'login', NULL, NULL, NULL, '::1', '2026-08-03 14:00:51'),
(75, NULL, 'login', NULL, NULL, NULL, '::1', '2026-08-03 14:00:52'),
(76, 4, 'login', NULL, NULL, NULL, '::1', '2026-08-03 14:00:52'),
(77, 5, 'login', NULL, NULL, NULL, '::1', '2026-08-03 14:00:53'),
(78, NULL, 'login', 'auth', NULL, '{\"status\":\"failed\",\"reason\":\"unknown_email\",\"email\":\"nonexistent@test.com\"}', '::1', '2026-08-03 14:01:23'),
(79, 1, 'login', NULL, NULL, NULL, '::1', '2026-08-03 14:01:24'),
(80, 1, 'export', 'audit_logs', NULL, NULL, '::1', '2026-08-03 14:01:24'),
(81, 2, 'login', NULL, NULL, NULL, '::1', '2026-08-03 14:01:24'),
(82, NULL, 'login', NULL, NULL, NULL, '::1', '2026-08-03 14:01:25'),
(83, 4, 'login', NULL, NULL, NULL, '::1', '2026-08-03 14:01:26'),
(84, 5, 'login', NULL, NULL, NULL, '::1', '2026-08-03 14:01:27'),
(85, 1, 'login', NULL, NULL, NULL, '::1', '2026-08-03 14:33:30'),
(86, 2, 'login', NULL, NULL, NULL, '::1', '2026-08-03 14:33:30'),
(87, NULL, 'login', NULL, NULL, NULL, '::1', '2026-08-03 14:33:31'),
(88, 4, 'login', NULL, NULL, NULL, '::1', '2026-08-03 14:33:32'),
(89, 5, 'login', NULL, NULL, NULL, '::1', '2026-08-03 14:33:33'),
(90, NULL, 'login', 'auth', NULL, '{\"status\":\"failed\",\"reason\":\"unknown_email\",\"email\":\"nonexistent@test.com\"}', '::1', '2026-08-03 14:33:33'),
(91, 1, 'login', NULL, NULL, NULL, '::1', '2026-08-03 14:33:34'),
(92, 1, 'export', 'audit_logs', NULL, NULL, '::1', '2026-08-03 14:33:34'),
(93, 2, 'login', NULL, NULL, NULL, '::1', '2026-08-03 14:33:34'),
(94, NULL, 'login', NULL, NULL, NULL, '::1', '2026-08-03 14:33:35'),
(95, 4, 'login', NULL, NULL, NULL, '::1', '2026-08-03 14:33:36'),
(96, 5, 'login', NULL, NULL, NULL, '::1', '2026-08-03 14:33:36'),
(97, 1, 'login', NULL, NULL, NULL, '::1', '2026-08-03 14:34:13'),
(98, 2, 'login', NULL, NULL, NULL, '::1', '2026-08-03 14:34:14'),
(99, 2, '', 'receptionist', 4, '{\"email\":\"runtest.rec.1785767652870@amc.com\",\"receptionist_code\":\"REC-MSDBYD2Z-JBSS\"}', '::1', '2026-08-03 14:34:15'),
(100, NULL, 'login', NULL, NULL, NULL, '::1', '2026-08-03 14:34:15'),
(101, NULL, 'login', 'auth', NULL, '{\"status\":\"failed\",\"reason\":\"unknown_email\",\"email\":\"nonexistent@test.com\"}', '::1', '2026-08-03 15:04:00'),
(102, 1, 'login', NULL, NULL, NULL, '::1', '2026-08-03 15:04:01'),
(103, 1, 'export', 'audit_logs', NULL, NULL, '::1', '2026-08-03 15:04:01'),
(104, 2, 'login', NULL, NULL, NULL, '::1', '2026-08-03 15:04:01'),
(105, NULL, 'login', NULL, NULL, NULL, '::1', '2026-08-03 15:04:03'),
(106, 4, 'login', NULL, NULL, NULL, '::1', '2026-08-03 15:04:03'),
(107, 5, 'login', NULL, NULL, NULL, '::1', '2026-08-03 15:04:04'),
(108, NULL, 'logout', NULL, NULL, NULL, '::1', '2026-08-03 15:16:55'),
(109, 1, 'login', NULL, NULL, NULL, '::1', '2026-08-03 15:17:27'),
(110, 1, 'logout', NULL, NULL, NULL, '::1', '2026-08-03 15:17:44'),
(111, 2, 'login', NULL, NULL, NULL, '::1', '2026-08-03 15:18:12'),
(112, 2, 'logout', NULL, NULL, NULL, '::1', '2026-08-03 15:18:29'),
(113, NULL, 'login', NULL, NULL, NULL, '::1', '2026-08-03 15:18:57'),
(114, 4, 'login', NULL, NULL, NULL, '::1', '2026-08-03 15:19:28'),
(115, 4, 'logout', NULL, NULL, NULL, '::1', '2026-08-03 15:19:50'),
(116, 5, 'login', NULL, NULL, NULL, '::1', '2026-08-03 15:20:04'),
(117, NULL, 'login', 'auth', NULL, '{\"status\":\"failed\",\"reason\":\"unknown_email\",\"email\":\"nonexistent@test.com\"}', '::1', '2026-08-03 15:36:25'),
(118, 1, 'login', NULL, NULL, NULL, '::1', '2026-08-03 15:36:25'),
(119, 1, 'export', 'audit_logs', NULL, NULL, '::1', '2026-08-03 15:36:25'),
(120, 2, 'login', NULL, NULL, NULL, '::1', '2026-08-03 15:36:26'),
(121, NULL, 'login', NULL, NULL, NULL, '::1', '2026-08-03 15:36:27'),
(122, 4, 'login', NULL, NULL, NULL, '::1', '2026-08-03 15:36:28'),
(123, 5, 'login', NULL, NULL, NULL, '::1', '2026-08-03 15:36:28'),
(124, 1, 'login', NULL, NULL, NULL, '::1', '2026-08-04 07:39:24'),
(125, 1, 'logout', NULL, NULL, NULL, '::1', '2026-08-04 07:39:50'),
(126, 2, 'login', NULL, NULL, NULL, '::1', '2026-08-04 07:40:00'),
(127, 2, 'logout', NULL, NULL, NULL, '::1', '2026-08-04 07:40:21'),
(128, NULL, 'login', NULL, NULL, NULL, '::1', '2026-08-04 07:40:33'),
(129, NULL, 'logout', NULL, NULL, NULL, '::1', '2026-08-04 07:44:37'),
(130, 5, 'login', NULL, NULL, NULL, '::1', '2026-08-04 07:45:10'),
(131, 1, 'login', NULL, NULL, NULL, '::1', '2026-08-05 06:29:32'),
(132, NULL, 'login', NULL, NULL, NULL, '::1', '2026-08-05 08:20:54'),
(133, NULL, 'login', NULL, NULL, NULL, '::1', '2026-08-05 09:00:38'),
(134, NULL, 'login', NULL, NULL, NULL, '::1', '2026-08-05 09:00:59'),
(135, NULL, 'login', NULL, NULL, NULL, '::1', '2026-08-05 09:02:03'),
(136, NULL, 'login', NULL, NULL, NULL, '::1', '2026-08-05 09:03:06'),
(137, NULL, 'login', NULL, NULL, NULL, '::1', '2026-08-05 10:31:53'),
(138, NULL, 'logout', NULL, NULL, NULL, '::1', '2026-08-05 11:00:00'),
(139, 2, 'login', NULL, NULL, NULL, '::1', '2026-08-05 11:00:50'),
(140, 2, 'logout', NULL, NULL, NULL, '::1', '2026-08-05 11:01:00'),
(141, NULL, 'login', NULL, NULL, NULL, '::1', '2026-08-05 11:01:33'),
(142, NULL, 'logout', NULL, NULL, NULL, '::1', '2026-08-05 11:01:38'),
(143, NULL, 'login', NULL, NULL, NULL, '::1', '2026-08-05 11:04:54'),
(144, NULL, 'login', NULL, NULL, NULL, '::1', '2026-08-05 11:08:42'),
(145, NULL, 'login', NULL, NULL, NULL, '::1', '2026-08-05 11:38:38'),
(146, 2, 'login', NULL, NULL, NULL, '::1', '2026-08-05 15:27:13'),
(147, 2, 'logout', NULL, NULL, NULL, '::1', '2026-08-05 15:29:24'),
(148, 4, 'login', NULL, NULL, NULL, '::1', '2026-08-05 15:29:37'),
(149, 4, 'logout', NULL, NULL, NULL, '::1', '2026-08-05 17:52:36'),
(150, 2, 'login', NULL, NULL, NULL, '::1', '2026-08-05 17:52:52'),
(151, 5, 'login', NULL, NULL, NULL, '::1', '2026-08-05 17:57:50'),
(152, 5, 'logout', NULL, NULL, NULL, '::1', '2026-08-05 17:58:03'),
(153, 13, 'login', NULL, NULL, NULL, '::1', '2026-08-05 17:58:15'),
(154, 2, '', 'receptionist', 1, '{\"email\":\"receptionist@amc.com\",\"status\":\"active\"}', '::1', '2026-08-05 18:03:25'),
(155, 2, '', 'receptionist', 1, '{\"email\":\"receptionist@amc.com\",\"status\":\"active\"}', '::1', '2026-08-05 18:03:38'),
(156, 2, '', 'receptionist', 5, '{\"email\":\"Sangeetha@info.com\",\"receptionist_code\":\"REC-MSGEC5AC-27PC\"}', '::1', '2026-08-05 18:04:16'),
(157, NULL, 'logout', NULL, NULL, NULL, '::1', '2026-08-05 18:04:21'),
(158, 14, 'login', NULL, NULL, NULL, '::1', '2026-08-05 18:04:29'),
(159, 2, '', 'receptionist', 5, '{\"email\":\"Sangeetha@info.com\",\"status\":\"active\"}', '::1', '2026-08-05 18:04:55'),
(160, 2, 'login', NULL, NULL, NULL, '::1', '2026-08-05 18:06:04'),
(161, 2, '', 'receptionist', 6, '{\"email\":\"Sutha@123.com\",\"receptionist_code\":\"REC-001\"}', '::1', '2026-08-05 18:07:00'),
(162, 2, '', 'receptionist', 4, '{\"status\":\"inactive\"}', '::1', '2026-08-05 18:07:12'),
(163, 2, '', 'receptionist', 4, '{\"status\":\"inactive\"}', '::1', '2026-08-05 18:07:16'),
(164, 2, '', 'receptionist', 3, '{\"status\":\"inactive\"}', '::1', '2026-08-05 18:07:35'),
(165, 2, '', 'receptionist', 1, '{\"status\":\"inactive\"}', '::1', '2026-08-05 18:07:40'),
(166, 2, '', 'receptionist', 1, '{\"status\":\"inactive\"}', '::1', '2026-08-05 18:07:43'),
(167, 2, '', 'receptionist', 3, '{\"status\":\"inactive\"}', '::1', '2026-08-05 18:07:51'),
(168, 2, '', 'receptionist', 1, '{\"email\":\"receptionist@amc.com\",\"receptionist_code\":\"REC-DEMO001\"}', '::1', '2026-08-05 18:10:10'),
(169, 2, '', 'receptionist', 2, '{\"email\":\"testrec_295440476@amc.com\",\"receptionist_code\":\"REC-MSC15I7K-XQCS\"}', '::1', '2026-08-05 18:10:13'),
(170, 2, '', 'receptionist', 3, '{\"email\":\"testreceptionist@amc.com\",\"receptionist_code\":\"REC-MSC1T2E3-9ES1\"}', '::1', '2026-08-05 18:10:19'),
(171, 2, '', 'receptionist', 4, '{\"email\":\"runtest.rec.1785767652870@amc.com\",\"receptionist_code\":\"REC-MSDBYD2Z-JBSS\"}', '::1', '2026-08-05 18:10:31'),
(172, 2, '', 'receptionist', 6, '{\"email\":\"Sutha@123.com\",\"status\":\"inactive\"}', '::1', '2026-08-05 18:10:37'),
(173, 2, 'login', NULL, NULL, NULL, '::1', '2026-08-05 18:13:15'),
(174, 14, 'login', NULL, NULL, NULL, '::1', '2026-08-05 18:13:44'),
(175, 2, 'login', NULL, NULL, NULL, '::1', '2026-08-05 18:15:35'),
(176, 14, 'login', NULL, NULL, NULL, '::1', '2026-08-05 18:15:45'),
(177, 2, '', 'receptionist', 5, '{\"email\":\"Sangeetha@info.com\",\"status\":\"inactive\"}', '::1', '2026-08-05 18:15:59'),
(178, 2, '', 'receptionist', 5, '{\"email\":\"Sangeetha@info.com\",\"status\":\"active\"}', '::1', '2026-08-05 18:16:34'),
(179, 14, 'login', NULL, NULL, NULL, '::1', '2026-08-05 18:16:37'),
(180, 2, 'settings_change', NULL, NULL, NULL, '::1', '2026-08-05 18:21:04'),
(181, 2, 'settings_change', NULL, NULL, NULL, '::1', '2026-08-05 18:21:09'),
(182, 2, 'settings_change', NULL, NULL, NULL, '::1', '2026-08-05 18:21:11'),
(183, 2, 'login', NULL, NULL, NULL, '::1', '2026-08-05 18:29:36'),
(184, 2, 'settings_change', NULL, NULL, NULL, '::1', '2026-08-05 18:30:18'),
(185, 2, 'settings_change', NULL, NULL, NULL, '::1', '2026-08-05 18:30:32'),
(186, 2, 'settings_change', NULL, NULL, NULL, '::1', '2026-08-06 03:25:54'),
(187, 2, 'settings_change', NULL, NULL, NULL, '::1', '2026-08-06 03:25:56'),
(188, 2, '', 'receptionist', 6, '{\"email\":\"Sutha@123.com\",\"status\":\"inactive\"}', '::1', '2026-08-06 03:26:23'),
(189, 2, '', 'receptionist', 6, '{\"email\":\"Suthan@123.com\",\"status\":\"inactive\"}', '::1', '2026-08-06 03:26:37'),
(190, 2, '', 'receptionist', 6, '{\"email\":\"Suthan@123.com\",\"status\":\"active\"}', '::1', '2026-08-06 03:26:49'),
(191, 2, 'settings_change', NULL, NULL, NULL, '::1', '2026-08-06 03:27:15'),
(192, 2, 'login', NULL, NULL, NULL, '::1', '2026-08-06 05:25:42'),
(193, 2, 'login', NULL, NULL, NULL, '::1', '2026-08-06 05:48:03'),
(194, 15, 'login', NULL, NULL, NULL, '::1', '2026-08-06 05:50:49'),
(195, 15, 'logout', NULL, NULL, NULL, '::1', '2026-08-06 05:56:13'),
(196, 15, 'login', NULL, NULL, NULL, '::1', '2026-08-06 05:56:26'),
(197, 15, 'logout', NULL, NULL, NULL, '::1', '2026-08-06 05:57:11'),
(198, 15, 'login', NULL, NULL, NULL, '::1', '2026-08-06 05:57:21'),
(199, 2, '', 'receptionist', 6, '{\"email\":\"Suthan@123.com\",\"status\":\"disabled\"}', '::1', '2026-08-06 07:50:50'),
(200, 2, '', 'receptionist', 6, '{\"email\":\"Suthan@123.com\",\"status\":\"active\"}', '::1', '2026-08-06 07:51:26'),
(201, 15, 'login', NULL, NULL, NULL, '::1', '2026-08-06 07:51:28'),
(202, 2, 'login', NULL, NULL, NULL, '::1', '2026-08-06 09:02:38'),
(203, 14, 'login', NULL, NULL, NULL, '::1', '2026-08-06 09:02:56'),
(204, NULL, 'login', 'auth', NULL, '{\"status\":\"failed\",\"reason\":\"unknown_email\",\"email\":\"receptionist@amc.com\"}', '::1', '2026-08-06 09:05:01'),
(205, NULL, 'login', 'auth', NULL, '{\"status\":\"failed\",\"reason\":\"unknown_email\",\"email\":\"receptionist@amc.com\"}', '::1', '2026-08-06 09:05:35'),
(206, 2, 'login', NULL, NULL, NULL, '::1', '2026-08-06 09:05:49'),
(207, NULL, 'login', 'auth', NULL, '{\"status\":\"failed\",\"reason\":\"unknown_email\",\"email\":\"receptionist@amc.com\"}', '::1', '2026-08-06 09:05:49'),
(208, 2, 'login', NULL, NULL, NULL, '::1', '2026-08-06 09:07:17'),
(209, 14, 'login', NULL, NULL, NULL, '::1', '2026-08-06 09:42:56'),
(210, 2, 'logout', NULL, NULL, NULL, '::1', '2026-08-06 09:43:11'),
(211, 4, 'login', NULL, NULL, NULL, '::1', '2026-08-06 09:43:24'),
(212, 5, 'login', NULL, NULL, NULL, '::1', '2026-08-06 09:44:25'),
(213, 4, 'logout', NULL, NULL, NULL, '::1', '2026-08-06 09:53:22'),
(214, 2, 'login', NULL, NULL, NULL, '::1', '2026-08-06 09:53:37'),
(215, 2, 'settings_change', NULL, NULL, NULL, '::1', '2026-08-06 09:53:50'),
(216, 2, 'logout', NULL, NULL, NULL, '::1', '2026-08-06 09:53:55'),
(217, 4, 'login', NULL, NULL, NULL, '::1', '2026-08-06 09:54:05'),
(218, 14, 'login', NULL, NULL, NULL, '::1', '2026-08-06 10:05:57'),
(219, 4, 'login', NULL, NULL, NULL, '::1', '2026-08-06 10:06:10'),
(220, 5, 'login', NULL, NULL, NULL, '::1', '2026-08-06 10:06:43'),
(221, 14, 'login', NULL, NULL, NULL, '::1', '2026-08-06 16:13:25'),
(222, 4, 'login', NULL, NULL, NULL, '::1', '2026-08-06 16:13:53'),
(223, 5, 'login', NULL, NULL, NULL, '::1', '2026-08-06 16:14:28'),
(224, 2, 'login', NULL, NULL, NULL, '::1', '2026-08-06 16:15:39'),
(225, 2, '', 'receptionist', 6, '{\"email\":\"Suthan@123.com\",\"status\":\"inactive\"}', '::1', '2026-08-06 16:16:22'),
(226, 2, '', 'receptionist', 6, '{\"email\":\"Suthan@123.com\",\"status\":\"disabled\"}', '::1', '2026-08-06 16:17:00'),
(227, 2, '', 'receptionist', 6, '{\"email\":\"Suthan@123.com\",\"status\":\"active\"}', '::1', '2026-08-06 16:17:26'),
(228, 2, 'export', 'report', NULL, NULL, '::1', '2026-08-06 16:37:04');

-- --------------------------------------------------------

--
-- Table structure for table `conferences`
--

CREATE TABLE `conferences` (
  `id` int(11) NOT NULL,
  `conference_code` varchar(50) DEFAULT NULL,
  `appointment_id` int(11) DEFAULT NULL,
  `patient_id` int(11) NOT NULL,
  `gp_id` int(11) DEFAULT NULL,
  `ahp_id` int(11) DEFAULT NULL,
  `scheduled_date` date NOT NULL,
  `scheduled_time` time NOT NULL,
  `status` enum('scheduled','waiting','live','completed','cancelled') DEFAULT 'scheduled',
  `cancelled_reason` varchar(255) DEFAULT NULL,
  `cancelled_at` timestamp NULL DEFAULT NULL,
  `meeting_link` varchar(500) DEFAULT NULL,
  `room_id` varchar(255) DEFAULT NULL,
  `accepted_at` timestamp NULL DEFAULT NULL,
  `accepted_by` int(11) DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `created_by` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `conferences`
--

INSERT INTO `conferences` (`id`, `conference_code`, `appointment_id`, `patient_id`, `gp_id`, `ahp_id`, `scheduled_date`, `scheduled_time`, `status`, `cancelled_reason`, `cancelled_at`, `meeting_link`, `room_id`, `accepted_at`, `accepted_by`, `notes`, `created_by`, `created_at`, `updated_at`) VALUES
(1, 'CONF-DEMO001', NULL, 1, 1, 1, '2026-08-06', '11:00:00', 'cancelled', 'time out', '2026-08-06 10:06:13', NULL, NULL, NULL, NULL, NULL, NULL, '2026-08-02 16:42:57', '2026-08-06 10:06:13'),
(5, 'CONF-MSDBXJN6-8ALF', NULL, 6, NULL, NULL, '2026-08-12', '14:00:00', 'scheduled', NULL, NULL, 'https://meet.example.com/e2e', NULL, NULL, NULL, 'E2E conference', NULL, '2026-08-03 14:33:36', '2026-08-03 14:33:36'),
(6, 'CONF-MSDD0Q6D-FKTK', NULL, 7, NULL, NULL, '2026-08-12', '14:00:00', 'scheduled', NULL, NULL, 'https://meet.example.com/e2e', NULL, NULL, NULL, 'E2E conference', NULL, '2026-08-03 15:04:04', '2026-08-03 15:04:04'),
(8, 'CONF-MSHBP3B2-A5UQ', 1, 1, 1, NULL, '2026-08-02', '14:30:00', 'cancelled', 'time out', '2026-08-06 10:06:13', 'https://meet.amc.com/conf-mshbp3b2-a5uq', NULL, NULL, NULL, NULL, 14, '2026-08-06 09:38:06', '2026-08-06 10:06:13'),
(9, 'CONF-MSHBP3BR-WHAO', 8, 1, 1, 1, '2026-08-06', '10:30:00', 'cancelled', 'time out', '2026-08-06 10:06:13', 'https://meet.amc.com/conf-mshbp3br-whao', NULL, NULL, NULL, 'Title: Test Conference', 14, '2026-08-06 09:38:07', '2026-08-06 10:06:13'),
(10, 'CONF-MSHBP3CT-JM9W', 9, 1, 1, 1, '2026-08-06', '14:00:00', 'cancelled', 'time out', '2026-08-06 10:06:13', 'https://meet.amc.com/conf-mshbp3ct-jm9w', NULL, NULL, NULL, 'Title: JSON Test Conference', 14, '2026-08-06 09:38:07', '2026-08-06 10:06:13'),
(11, 'CONF-MSHBP3E2-BGRF', 10, 1, 1, 1, '2026-08-06', '22:00:00', 'completed', 'time out', '2026-08-06 10:06:13', 'https://meet.amc.com/conf-mshbp3e2-bgrf', 'conf-mshbp3e2-bgrf', '2026-08-06 16:31:16', 4, 'Title: Demo Teleconference — Today\nSample meeting for GP accept / AHP join workflow', 14, '2026-08-06 09:38:07', '2026-08-06 16:33:30'),
(12, 'CONF-MSHBQNTT-MGCF', 11, 6, 1, 1, '2026-08-06', '23:33:00', 'cancelled', NULL, NULL, 'https://meet.amc.com/conf-mshbqntt-mgcf', 'conf-mshbqntt-mgcf', '2026-08-06 10:07:30', 4, 'Title: Follow-up Teleconference\nSecond sample meeting today', 14, '2026-08-06 09:39:20', '2026-08-06 16:41:58');

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
(3, 8, 4, 'gp', NULL, NULL),
(10, 1, 4, 'gp', NULL, NULL),
(11, 1, 5, 'ahp', NULL, NULL),
(16, 9, 4, 'gp', NULL, NULL),
(17, 9, 5, 'ahp', NULL, NULL),
(18, 10, 4, 'gp', NULL, NULL),
(19, 10, 5, 'ahp', NULL, NULL),
(26, 12, 4, 'gp', NULL, NULL),
(27, 12, 5, 'ahp', NULL, NULL),
(28, 11, 4, 'gp', NULL, NULL),
(29, 11, 5, 'ahp', '2026-08-06 16:32:02', NULL);

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
(1, 4, 'GP-DEMO001', 'General Medicine', 'SLMC-12345', 'AMC Healthcare', NULL, NULL, '2026-08-02 16:42:57', '2026-08-02 16:42:57'),
(2, 12, 'GP-01', 'Complex', 'amc', 'Cnr Ranford Road & Campbell Road, Canning Vale, 6155', 's, Tuesday, Friday, Saturday, Sunday', NULL, '2026-08-05 17:37:58', '2026-08-06 07:22:13'),
(3, 16, 'GP-02', 'hghgh', 'ghghgh', 'ghgd', 'Wednesday, Monday, Sunday, Friday', 15, '2026-08-06 07:23:23', '2026-08-06 07:23:38');

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
(24, 8, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36', '2026-08-02 18:01:28', NULL, 'success'),
(25, 1, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36', '2026-08-02 18:01:48', NULL, 'success'),
(26, 1, '::1', 'node', '2026-08-03 04:59:41', NULL, 'success'),
(27, 2, '::1', 'node', '2026-08-03 04:59:42', NULL, 'success'),
(30, 4, '::1', 'node', '2026-08-03 04:59:44', NULL, 'success'),
(31, 5, '::1', 'node', '2026-08-03 04:59:45', NULL, 'success'),
(32, 1, '::1', 'node', '2026-08-03 05:01:13', NULL, 'success'),
(33, 2, '::1', 'node', '2026-08-03 05:01:14', NULL, 'success'),
(36, 4, '::1', 'node', '2026-08-03 05:01:16', NULL, 'success'),
(37, 5, '::1', 'node', '2026-08-03 05:01:17', NULL, 'success'),
(38, 4, '::1', 'node', '2026-08-03 05:01:18', NULL, 'success'),
(39, 5, '::1', 'node', '2026-08-03 05:01:18', NULL, 'success'),
(40, 1, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36', '2026-08-03 05:06:18', NULL, 'success'),
(41, 8, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36', '2026-08-03 05:06:42', NULL, 'success'),
(43, 1, '::1', 'node', '2026-08-03 13:59:00', NULL, 'success'),
(44, 2, '::1', 'node', '2026-08-03 13:59:00', NULL, 'success'),
(46, 4, '::1', 'node', '2026-08-03 13:59:01', NULL, 'success'),
(47, 5, '::1', 'node', '2026-08-03 13:59:02', NULL, 'success'),
(48, 1, '::1', 'node', '2026-08-03 13:59:46', NULL, 'success'),
(49, 2, '::1', 'node', '2026-08-03 13:59:47', NULL, 'success'),
(51, 4, '::1', 'node', '2026-08-03 13:59:48', NULL, 'success'),
(52, 5, '::1', 'node', '2026-08-03 13:59:49', NULL, 'success'),
(53, 1, '::1', 'node', '2026-08-03 14:00:20', NULL, 'success'),
(54, 2, '::1', 'node', '2026-08-03 14:00:20', NULL, 'success'),
(56, 4, '::1', 'node', '2026-08-03 14:00:22', NULL, 'success'),
(57, 5, '::1', 'node', '2026-08-03 14:00:22', NULL, 'success'),
(58, 1, '::1', 'node', '2026-08-03 14:00:50', NULL, 'success'),
(59, 2, '::1', 'node', '2026-08-03 14:00:51', NULL, 'success'),
(61, 4, '::1', 'node', '2026-08-03 14:00:52', NULL, 'success'),
(62, 5, '::1', 'node', '2026-08-03 14:00:53', NULL, 'success'),
(63, 1, '::1', 'node', '2026-08-03 14:01:24', NULL, 'success'),
(64, 2, '::1', 'node', '2026-08-03 14:01:24', NULL, 'success'),
(66, 4, '::1', 'node', '2026-08-03 14:01:26', NULL, 'success'),
(67, 5, '::1', 'node', '2026-08-03 14:01:27', NULL, 'success'),
(68, 1, '::1', 'node', '2026-08-03 14:33:30', NULL, 'success'),
(69, 2, '::1', 'node', '2026-08-03 14:33:30', NULL, 'success'),
(71, 4, '::1', 'node', '2026-08-03 14:33:32', NULL, 'success'),
(72, 5, '::1', 'node', '2026-08-03 14:33:33', NULL, 'success'),
(73, 1, '::1', 'node', '2026-08-03 14:33:34', NULL, 'success'),
(74, 2, '::1', 'node', '2026-08-03 14:33:34', NULL, 'success'),
(76, 4, '::1', 'node', '2026-08-03 14:33:36', NULL, 'success'),
(77, 5, '::1', 'node', '2026-08-03 14:33:36', NULL, 'success'),
(78, 1, '::1', 'Mozilla/5.0 (Windows NT; Windows NT 10.0; en-GB) WindowsPowerShell/5.1.26100.8972', '2026-08-03 14:34:13', NULL, 'success'),
(79, 2, '::1', 'Mozilla/5.0 (Windows NT; Windows NT 10.0; en-GB) WindowsPowerShell/5.1.26100.8972', '2026-08-03 14:34:14', NULL, 'success'),
(81, 1, '::1', 'node', '2026-08-03 15:04:01', NULL, 'success'),
(82, 2, '::1', 'node', '2026-08-03 15:04:01', NULL, 'success'),
(84, 4, '::1', 'node', '2026-08-03 15:04:03', NULL, 'success'),
(85, 5, '::1', 'node', '2026-08-03 15:04:04', NULL, 'success'),
(86, 1, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36', '2026-08-03 15:17:27', '2026-08-03 15:17:44', 'success'),
(87, 2, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36', '2026-08-03 15:18:12', '2026-08-03 15:18:29', 'success'),
(89, 4, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36', '2026-08-03 15:19:28', '2026-08-03 15:19:50', 'success'),
(90, 5, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36', '2026-08-03 15:20:04', NULL, 'success'),
(91, 1, '::1', 'node', '2026-08-03 15:36:25', NULL, 'success'),
(92, 2, '::1', 'node', '2026-08-03 15:36:26', NULL, 'success'),
(94, 4, '::1', 'node', '2026-08-03 15:36:28', NULL, 'success'),
(95, 5, '::1', 'node', '2026-08-03 15:36:28', NULL, 'success'),
(96, 1, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36', '2026-08-04 07:39:24', '2026-08-04 07:39:50', 'success'),
(97, 2, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36', '2026-08-04 07:40:00', '2026-08-04 07:40:21', 'success'),
(99, 4, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36', '2026-08-04 07:44:54', NULL, 'failed'),
(100, 5, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36', '2026-08-04 07:45:10', NULL, 'success'),
(101, 1, '::1', 'Mozilla/5.0 (Windows NT; Windows NT 10.0; en-US) WindowsPowerShell/5.1.19041.6456', '2026-08-05 06:29:32', NULL, 'success'),
(108, 2, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36', '2026-08-05 11:00:50', '2026-08-05 11:01:00', 'success'),
(113, 2, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36 Edg/151.0.0.0', '2026-08-05 15:27:13', '2026-08-05 15:29:24', 'success'),
(114, 4, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36 Edg/151.0.0.0', '2026-08-05 15:29:37', '2026-08-05 17:52:36', 'success'),
(115, 2, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36 Edg/151.0.0.0', '2026-08-05 17:52:52', NULL, 'success'),
(116, 5, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36', '2026-08-05 17:57:50', '2026-08-05 17:58:03', 'success'),
(117, 13, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36', '2026-08-05 17:58:15', NULL, 'success'),
(118, 14, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36', '2026-08-05 18:04:29', NULL, 'success'),
(119, 2, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36 Edg/151.0.0.0', '2026-08-05 18:06:04', NULL, 'success'),
(120, 2, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36 Edg/151.0.0.0', '2026-08-05 18:13:15', NULL, 'success'),
(121, 14, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36', '2026-08-05 18:13:44', NULL, 'success'),
(122, 2, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36 Edg/151.0.0.0', '2026-08-05 18:15:35', NULL, 'success'),
(123, 14, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36', '2026-08-05 18:15:45', NULL, 'success'),
(124, 14, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36', '2026-08-05 18:16:37', NULL, 'success'),
(125, 2, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36 Edg/151.0.0.0', '2026-08-05 18:29:36', NULL, 'success'),
(126, 2, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36', '2026-08-06 05:25:42', NULL, 'success'),
(127, 2, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36 Edg/151.0.0.0', '2026-08-06 05:48:00', NULL, 'failed'),
(128, 2, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36 Edg/151.0.0.0', '2026-08-06 05:48:03', NULL, 'success'),
(129, 15, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36', '2026-08-06 05:50:45', NULL, 'failed'),
(130, 15, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36', '2026-08-06 05:50:49', '2026-08-06 05:56:13', 'success'),
(131, 15, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36', '2026-08-06 05:56:26', '2026-08-06 05:57:11', 'success'),
(132, 15, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36', '2026-08-06 05:57:17', NULL, 'failed'),
(133, 15, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36', '2026-08-06 05:57:21', NULL, 'success'),
(134, 15, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36', '2026-08-06 07:51:28', NULL, 'success'),
(135, 2, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36 Edg/151.0.0.0', '2026-08-06 09:02:38', NULL, 'success'),
(136, 14, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36', '2026-08-06 09:02:56', NULL, 'success'),
(137, 2, '::1', 'axios/1.19.0', '2026-08-06 09:05:49', NULL, 'success'),
(138, 2, '::1', 'axios/1.19.0', '2026-08-06 09:07:17', '2026-08-06 09:43:11', 'success'),
(139, 14, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36', '2026-08-06 09:42:56', NULL, 'success'),
(140, 4, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36 Edg/151.0.0.0', '2026-08-06 09:43:24', '2026-08-06 09:53:22', 'success'),
(141, 5, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:153.0) Gecko/20100101 Firefox/153.0', '2026-08-06 09:44:25', NULL, 'success'),
(142, 2, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36 Edg/151.0.0.0', '2026-08-06 09:53:33', NULL, 'failed'),
(143, 2, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36 Edg/151.0.0.0', '2026-08-06 09:53:37', '2026-08-06 09:53:55', 'success'),
(144, 4, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36 Edg/151.0.0.0', '2026-08-06 09:54:05', NULL, 'success'),
(145, 14, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36', '2026-08-06 10:05:57', NULL, 'success'),
(146, 4, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36 Edg/151.0.0.0', '2026-08-06 10:06:10', NULL, 'success'),
(147, 5, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:153.0) Gecko/20100101 Firefox/153.0', '2026-08-06 10:06:43', NULL, 'success'),
(148, 14, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36 Edg/151.0.0.0', '2026-08-06 16:13:24', NULL, 'success'),
(149, 4, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36', '2026-08-06 16:13:53', NULL, 'success'),
(150, 5, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36', '2026-08-06 16:14:28', NULL, 'success'),
(151, 2, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:153.0) Gecko/20100101 Firefox/153.0', '2026-08-06 16:15:39', NULL, 'success');

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
(8, 4, 'Conference Created', 'You are invited to conference CONF-MSCRHJ9O-A303', 'conference', 0, '2026-08-03 05:01:17'),
(9, 5, 'Conference Created', 'You are invited to conference CONF-MSCRHJ9O-A303', 'conference', 0, '2026-08-03 05:01:17'),
(10, 2, 'Task Assigned', 'New task: E2E Task', 'task', 0, '2026-08-03 05:01:17'),
(11, 2, 'New Patient', 'Patient E2E Test1785765653369 registered', 'patient', 0, '2026-08-03 14:00:53'),
(12, 6, 'New Patient', 'Patient E2E Test1785765653369 registered', 'patient', 0, '2026-08-03 14:00:53'),
(13, 8, 'New Patient', 'Patient E2E Test1785765653369 registered', 'patient', 0, '2026-08-03 14:00:53'),
(18, 2, 'New Patient', 'Patient E2E Test1785765687030 registered', 'patient', 0, '2026-08-03 14:01:27'),
(19, 6, 'New Patient', 'Patient E2E Test1785765687030 registered', 'patient', 0, '2026-08-03 14:01:27'),
(20, 8, 'New Patient', 'Patient E2E Test1785765687030 registered', 'patient', 0, '2026-08-03 14:01:27'),
(25, 2, 'Task Assigned', 'New task: E2E Task 1785765687030', 'task', 0, '2026-08-03 14:01:27'),
(26, 2, 'New Patient', 'Patient E2E Test1785767616664 registered', 'patient', 0, '2026-08-03 14:33:36'),
(27, 6, 'New Patient', 'Patient E2E Test1785767616664 registered', 'patient', 0, '2026-08-03 14:33:36'),
(28, 8, 'New Patient', 'Patient E2E Test1785767616664 registered', 'patient', 0, '2026-08-03 14:33:36'),
(33, 2, 'Task Assigned', 'New task: E2E Task 1785767616664', 'task', 0, '2026-08-03 14:33:36'),
(34, 2, 'New Patient', 'Patient E2E Test1785769444685 registered', 'patient', 0, '2026-08-03 15:04:04'),
(35, 6, 'New Patient', 'Patient E2E Test1785769444685 registered', 'patient', 0, '2026-08-03 15:04:04'),
(36, 8, 'New Patient', 'Patient E2E Test1785769444685 registered', 'patient', 0, '2026-08-03 15:04:04'),
(37, 10, 'New Patient', 'Patient E2E Test1785769444685 registered', 'patient', 0, '2026-08-03 15:04:04'),
(49, 2, 'Task Assigned', 'New task: E2E Task 1785769444685', 'task', 0, '2026-08-03 15:04:04'),
(50, 2, 'New Patient', 'Patient E2E Test1785771388804 registered', 'patient', 0, '2026-08-03 15:36:28'),
(51, 6, 'New Patient', 'Patient E2E Test1785771388804 registered', 'patient', 0, '2026-08-03 15:36:28'),
(52, 8, 'New Patient', 'Patient E2E Test1785771388804 registered', 'patient', 0, '2026-08-03 15:36:28'),
(53, 10, 'New Patient', 'Patient E2E Test1785771388804 registered', 'patient', 0, '2026-08-03 15:36:28'),
(65, 2, 'Task Assigned', 'New task: E2E Task 1785771388804', 'task', 0, '2026-08-03 15:36:28'),
(66, 2, 'New Patient', 'Patient ra rajesh registered', 'patient', 0, '2026-08-05 11:18:35'),
(67, 6, 'New Patient', 'Patient ra rajesh registered', 'patient', 0, '2026-08-05 11:18:35'),
(68, 8, 'New Patient', 'Patient ra rajesh registered', 'patient', 0, '2026-08-05 11:18:35'),
(69, 10, 'New Patient', 'Patient ra rajesh registered', 'patient', 0, '2026-08-05 11:18:35'),
(81, 2, 'New Patient', 'Patient sithran Nilujan registered', 'patient', 0, '2026-08-05 15:31:06'),
(82, 6, 'New Patient', 'Patient sithran Nilujan registered', 'patient', 0, '2026-08-05 15:31:06'),
(83, 8, 'New Patient', 'Patient sithran Nilujan registered', 'patient', 0, '2026-08-05 15:31:06'),
(84, 10, 'New Patient', 'Patient sithran Nilujan registered', 'patient', 0, '2026-08-05 15:31:06'),
(96, 15, 'Password Changed', 'Your password was changed successfully.', 'security', 0, '2026-08-06 05:56:45'),
(97, 4, 'Conference Scheduled', 'You have been assigned to a teleconference meeting', 'conference', 0, '2026-08-06 09:38:06'),
(98, 4, 'Conference Scheduled', 'You have been assigned to a teleconference meeting', 'conference', 0, '2026-08-06 09:38:07'),
(99, 5, 'Conference Scheduled', 'You have been assigned to a teleconference meeting', 'conference', 0, '2026-08-06 09:38:07'),
(100, 4, 'Conference Scheduled', 'You have been assigned to a teleconference meeting', 'conference', 0, '2026-08-06 09:38:07'),
(101, 5, 'Conference Scheduled', 'You have been assigned to a teleconference meeting', 'conference', 0, '2026-08-06 09:38:07'),
(102, 4, 'Conference Scheduled', 'You have been assigned to a teleconference meeting', 'conference', 0, '2026-08-06 09:38:07'),
(103, 5, 'Conference Scheduled', 'You have been assigned to a teleconference meeting', 'conference', 0, '2026-08-06 09:38:07'),
(104, 4, 'Conference Scheduled', 'You have been assigned to a teleconference meeting', 'conference', 0, '2026-08-06 09:39:20'),
(105, 5, 'Conference Scheduled', 'You have been assigned to a teleconference meeting', 'conference', 0, '2026-08-06 09:39:20'),
(106, 5, 'Meeting Accepted', 'GP has accepted conference CONF-MSHBQNTT-MGCF. You can now join.', 'conference', 0, '2026-08-06 10:07:30'),
(107, 5, 'Meeting Accepted', 'GP has accepted conference CONF-MSHBP3E2-BGRF. You can now join.', 'conference', 0, '2026-08-06 16:31:16'),
(108, 12, 'Task Assigned', 'New task: fghgfh', 'task', 0, '2026-08-06 16:39:21');

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
  `land_phone` varchar(20) DEFAULT NULL,
  `email` varchar(255) DEFAULT NULL,
  `address` text DEFAULT NULL,
  `address_2` text DEFAULT NULL,
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

INSERT INTO `patients` (`id`, `patient_code`, `first_name`, `last_name`, `dob`, `gender`, `nic`, `phone`, `land_phone`, `email`, `address`, `address_2`, `medical_history`, `emergency_contact`, `insurance`, `status`, `created_by`, `assigned_gp_id`, `assigned_ahp_id`, `created_at`, `updated_at`) VALUES
(1, 'AMC-0001', 'Alice', 'Perera', '1985-03-15', 'female', NULL, '+94772222001', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'active', NULL, 1, 1, '2026-08-02 16:42:57', '2026-08-05 11:34:14'),
(6, 'AMC-0006', 'E2E', 'Test1785767616664', '1990-01-01', 'male', 'NIC1785767616664', '0771234567', NULL, 'e2e1785767616664@test.com', NULL, NULL, NULL, NULL, NULL, 'active', NULL, NULL, NULL, '2026-08-03 14:33:36', '2026-08-05 11:34:14'),
(7, 'AMC-0007', 'E2E', 'Test1785769444685', '1990-01-01', 'male', 'NIC1785769444685', '0771234567', NULL, 'e2e1785769444685@test.com', NULL, NULL, NULL, NULL, NULL, 'active', NULL, NULL, NULL, '2026-08-03 15:04:04', '2026-08-05 11:34:14'),
(9, 'AMC-0009', 'ra', 'rajesh', '1988-06-23', 'male', '200613548', '768594613123', '1554645465', NULL, 'gfgdfgfd', NULL, NULL, NULL, NULL, 'active', NULL, NULL, NULL, '2026-08-05 11:18:35', '2026-08-05 11:34:14'),
(10, 'AMC-0010', 'sithrasenan', 'Nilujan', '1997-09-30', 'male', '20061574', '7762534687', NULL, NULL, 'Jaffna, Srilanka.', NULL, NULL, NULL, NULL, 'active', NULL, NULL, NULL, '2026-08-05 15:31:06', '2026-08-05 15:31:58');

-- --------------------------------------------------------

--
-- Table structure for table `patient_id_sequence`
--

CREATE TABLE `patient_id_sequence` (
  `id` int(11) NOT NULL DEFAULT 1,
  `last_number` bigint(20) NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `patient_id_sequence`
--

INSERT INTO `patient_id_sequence` (`id`, `last_number`) VALUES
(1, 10);

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
(3, 6, 1, 'E2E medical note from GP', '2026-08-03 14:33:36', '2026-08-03 14:33:36'),
(4, 7, 1, 'E2E medical note from GP', '2026-08-03 15:04:04', '2026-08-03 15:04:04'),
(6, 1, 1, ' vbnfgjy', '2026-08-06 16:35:53', '2026-08-06 16:35:53');

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
(3, 6, 1, 'E2E AHP patient report', '2026-08-03 14:33:36', '2026-08-03 14:33:36'),
(4, 7, 1, 'E2E AHP patient report', '2026-08-03 15:04:04', '2026-08-03 15:04:04'),
(6, 1, 1, 'jgk gk', '2026-08-06 16:36:23', '2026-08-06 16:36:23');

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
(5, 14, 'REC-MSGEC5AC-27PC', 2, '2026-08-05 18:04:15', '2026-08-05 18:04:15'),
(6, 15, 'REC-001', 2, '2026-08-05 18:07:00', '2026-08-05 18:07:00');

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

--
-- Dumping data for table `reports`
--

INSERT INTO `reports` (`id`, `report_type`, `title`, `generated_by`, `file_path`, `parameters`, `created_at`) VALUES
(1, 'conference', 'Conference Report', 2, NULL, '{\"start_date\":\"2026-08-06\",\"end_date\":\"2026-08-06\"}', '2026-08-06 16:37:04');

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
(1, 'hospital_name', 'AMC Healthcare', 2, '2026-08-05 18:21:04'),
(2, 'timezone', 'Asia/Colombo', 2, '2026-08-06 09:53:50'),
(3, 'language', 'en', 2, '2026-08-05 18:21:04'),
(4, 'theme', 'light', 2, '2026-08-06 03:25:56');

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
(2, 'E2E Task', 'Verify task workflow', 2, NULL, '2026-08-03', 'medium', 'pending', NULL, '2026-08-03 05:01:17', '2026-08-03 05:01:17'),
(3, 'E2E Task 1785765687030', 'Verification task', 2, NULL, '2026-08-25', 'medium', 'pending', NULL, '2026-08-03 14:01:27', '2026-08-05 15:43:45'),
(4, 'E2E Task 1785767616664', 'Verification task', 2, NULL, '2026-08-26', 'medium', 'pending', NULL, '2026-08-03 14:33:36', '2026-08-05 15:44:02'),
(5, 'E2E Task 1785769444685', 'Verification task', 2, NULL, '2026-08-31', 'medium', 'pending', NULL, '2026-08-03 15:04:04', '2026-08-05 15:44:29'),
(6, 'E2E Task 1785771388804', 'Verification task', 2, NULL, NULL, 'medium', 'pending', NULL, '2026-08-03 15:36:28', '2026-08-03 15:36:28'),
(7, 'fghgfh', 'fghg', 12, 14, '2026-08-08', 'medium', 'pending', NULL, '2026-08-06 16:39:21', '2026-08-06 16:39:21');

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
(1, 1, 'superadmin@amc.com', 'superadmin', '$2b$12$xAX6ohPZHeG6Q77Rt/nli.LpE7szfqdlrovSia/7rIUMY1w4WLXrm', 'active', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiZW1haWwiOiJzdXBlcmFkbWluQGFtYy5jb20iLCJyb2xlIjoic3VwZXJfYWRtaW4iLCJpYXQiOjE3ODU5MTEzNzIsImV4cCI6MTc4NjUxNjE3Mn0.9s4ZCceR4H8OR8k4BGg7owofXWpaWLcCtE5ftZhtlvc', '2026-08-05 06:29:32', '2026-07-30 11:37:35', '2026-08-05 06:29:32'),
(2, 2, 'admin@amc.com', 'admin_demo', '$2b$12$UiDSbc.h4g0No7xkj4V8vO8HK8I7C5npT2jX6Kb/eWf4jdeOu5d16', 'active', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MiwiZW1haWwiOiJhZG1pbkBhbWMuY29tIiwicm9sZSI6ImFkbWluIiwiaWF0IjoxNzg2MDMyOTM5LCJleHAiOjE3ODY2Mzc3Mzl9.k4a5Wr0ygh1SR96_JxO-Wnu55wGoNTb5-xztS0djntI', '2026-08-06 16:15:39', '2026-08-02 16:42:57', '2026-08-06 16:15:39'),
(4, 4, 'gp@amc.com', 'gp_demo', '$2b$12$UiDSbc.h4g0No7xkj4V8vO8HK8I7C5npT2jX6Kb/eWf4jdeOu5d16', 'active', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6NCwiZW1haWwiOiJncEBhbWMuY29tIiwicm9sZSI6ImdwIiwiaWF0IjoxNzg2MDMyODMzLCJleHAiOjE3ODY2Mzc2MzN9.ZJIVhP1L7J_csleR-RNT02Dz5X6GwA8g43-VjDnv0L4', '2026-08-06 16:13:53', '2026-08-02 16:42:57', '2026-08-06 16:13:53'),
(5, 5, 'ahp@amc.com', 'ahp_demo', '$2b$12$UiDSbc.h4g0No7xkj4V8vO8HK8I7C5npT2jX6Kb/eWf4jdeOu5d16', 'active', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6NSwiZW1haWwiOiJhaHBAYW1jLmNvbSIsInJvbGUiOiJhaHAiLCJpYXQiOjE3ODYwMzI4NjgsImV4cCI6MTc4NjYzNzY2OH0.yfs03Dfjh7LzfRr2Yv8I7fF8JfWx1q_rwAZw3KqsYIs', '2026-08-06 16:14:28', '2026-08-02 16:42:57', '2026-08-06 16:14:28'),
(6, 2, 'testadmin_1165453774@amc.com', 'testadmin_1165453774', '$2b$12$hQT1ixRc21zytBzpWYRtJOr16DoP0wTJiVuBskfYLFkxnJfks.v/u', 'active', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6NiwiZW1haWwiOiJ0ZXN0YWRtaW5fMTE2NTQ1Mzc3NEBhbWMuY29tIiwicm9sZSI6ImFkbWluIiwiaWF0IjoxNzg1Njg5MDQ1LCJleHAiOjE3ODYyOTM4NDV9.Op-JOJhmiUhGvu5MJ7DV81fzWhQYK5pkQZY70Y2xrcU', '2026-08-02 16:44:05', '2026-08-02 16:44:05', '2026-08-02 16:44:05'),
(8, 2, 'testadmin@amc.com', 'testadmin', '$2b$12$ay8TXg1rsTGmvbyR.uArseQCRqtc2CrOEw94jMUj1qzePDkAsbhqO', 'active', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6OCwiZW1haWwiOiJ0ZXN0YWRtaW5AYW1jLmNvbSIsInJvbGUiOiJhZG1pbiIsImlhdCI6MTc4NTczMzYwMiwiZXhwIjoxNzg2MzM4NDAyfQ.yxWe6m_v5-ZzIWwFN7uQ5FPh1pSklAYuZHoWQK3sQVg', '2026-08-03 05:06:42', '2026-08-02 16:51:49', '2026-08-03 05:06:42'),
(10, 2, 'runtest.admin.1785767652870@amc.com', 'runtest_admin_1785767652870', '$2b$12$w2MlHrxxn4fQz/K5iqixDuyjHlgwSWF5HGat/9V9pqXFN1I0RNUIK', 'active', NULL, NULL, '2026-08-03 14:34:14', '2026-08-03 14:34:14'),
(12, 4, 'gp1@amc.com', 'gp1', '$2b$12$fXT9wOA6maIPwSyakurOleZ.veNt.Ncze.vzsQ9rZdQ9GGu9GbX.a', 'active', NULL, NULL, '2026-08-05 17:37:58', '2026-08-05 17:37:58'),
(13, 5, 'receptionistk@amc.com', 'receptionistk', '$2b$12$WUvfZbYSMWkvDk1Kp5BCWuj.HIevCP7P4MRW2coBxIH2cxSlwhq6C', 'active', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MTMsImVtYWlsIjoicmVjZXB0aW9uaXN0a0BhbWMuY29tIiwicm9sZSI6ImFocCIsImlhdCI6MTc4NTk1MjY5NSwiZXhwIjoxNzg2NTU3NDk1fQ.IZnRyAWlPUOn-8PvfC-1x_w6-bFOvynaFBbmPILHV8Q', '2026-08-05 17:58:15', '2026-08-05 17:40:38', '2026-08-05 17:58:15'),
(14, 3, 'Sangeetha@info.com', 'Sangeetha', '$2b$12$PE4xpQrforxF3FnlVouaMuCk1E1U0a63vINbeabPyknqCz30qhjzS', 'active', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MTQsImVtYWlsIjoiU2FuZ2VldGhhQGluZm8uY29tIiwicm9sZSI6InJlY2VwdGlvbmlzdCIsImlhdCI6MTc4NjAzMjgwNCwiZXhwIjoxNzg2NjM3NjA0fQ.qit1VLVh8Cai8vVU1cqL7095k2XyzC_ZIP6kRmOhqak', '2026-08-06 16:13:24', '2026-08-05 18:04:15', '2026-08-06 16:13:24'),
(15, 3, 'Suthan@123.com', 'Sutha', '$2b$12$B4vPzkOEqtNlkmapoEdevust7zy5eWP1ZPhX0I7WSyjy6UwBsRj6C', 'active', NULL, '2026-08-06 07:51:28', '2026-08-05 18:07:00', '2026-08-06 16:17:26'),
(16, 4, 'nilu@info.com', 'nilu', '$2b$12$uUf78vssmwtHKaBJ.40K9.c9sPmLo0fJf6EKGzG/57dj1cOBArT8O', 'active', NULL, NULL, '2026-08-06 07:23:23', '2026-08-06 07:23:23'),
(17, 3, 'receptionist@amc.com', 'receptionist_demo', '$2b$12$Kmbyp9K9bB1rqsiUJqhwp.Pu842cqtngYv2trvvkE4x8uEz/uz6Rm', 'active', NULL, NULL, '2026-08-06 09:38:56', '2026-08-06 09:38:56');

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
  `date_of_birth` date DEFAULT NULL,
  `gender` enum('male','female','other') DEFAULT NULL,
  `nic` varchar(50) DEFAULT NULL,
  `profile_picture` varchar(500) DEFAULT NULL,
  `address` text DEFAULT NULL,
  `emergency_contact` varchar(100) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `user_profiles`
--

INSERT INTO `user_profiles` (`id`, `user_id`, `first_name`, `last_name`, `phone`, `date_of_birth`, `gender`, `nic`, `profile_picture`, `address`, `emergency_contact`, `created_at`, `updated_at`) VALUES
(1, 1, 'Super', 'Admin', '+94770000001', NULL, NULL, NULL, NULL, NULL, NULL, '2026-07-30 11:37:35', '2026-07-30 11:37:35'),
(2, 2, 'Hospital', 'Admin', '+94771111001', NULL, NULL, NULL, NULL, NULL, NULL, '2026-08-02 16:42:57', '2026-08-02 16:42:57'),
(4, 4, 'John', 'Smith', '+94771111003', NULL, NULL, NULL, NULL, NULL, NULL, '2026-08-02 16:42:57', '2026-08-02 16:42:57'),
(5, 5, 'Jane', 'Doe', '+94771111004', NULL, NULL, NULL, NULL, NULL, NULL, '2026-08-02 16:42:57', '2026-08-02 16:42:57'),
(6, 6, 'Test', 'Hospital Admin', '+94771234567', NULL, NULL, NULL, NULL, NULL, NULL, '2026-08-02 16:44:05', '2026-08-02 16:44:05'),
(8, 8, 'Test', 'Admin', '+94771234567', NULL, NULL, NULL, NULL, NULL, NULL, '2026-08-02 16:51:49', '2026-08-02 16:51:49'),
(10, 10, 'Run', 'Test Admin', '+94770000002', NULL, NULL, NULL, NULL, NULL, NULL, '2026-08-03 14:34:14', '2026-08-03 14:34:14'),
(12, 12, 'gytgh', '', '7762534686', NULL, NULL, NULL, NULL, NULL, NULL, '2026-08-05 17:37:58', '2026-08-05 17:37:58'),
(13, 13, 'Dr', 'Sonu Thaker', '7762534686', NULL, NULL, NULL, NULL, NULL, NULL, '2026-08-05 17:40:38', '2026-08-05 17:40:38'),
(14, 14, 'Sangeetha', 'GK', '+94771111002', NULL, NULL, NULL, NULL, NULL, NULL, '2026-08-05 18:04:15', '2026-08-05 18:04:55'),
(15, 15, 'Suthan', '', '0768594626', NULL, NULL, NULL, '/uploads/1785995762194-99157761.png', NULL, NULL, '2026-08-05 18:07:00', '2026-08-06 05:56:02'),
(16, 16, 'nilujan', '', '768594613123', NULL, NULL, NULL, NULL, NULL, NULL, '2026-08-06 07:23:23', '2026-08-06 07:23:23'),
(17, 17, 'Front', 'Desk', '+94771111002', NULL, NULL, NULL, NULL, NULL, NULL, '2026-08-06 09:38:56', '2026-08-06 09:38:56');

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
-- Indexes for table `ahp_professions`
--
ALTER TABLE `ahp_professions`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `name` (`name`),
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
  ADD UNIQUE KEY `appointment_code` (`appointment_code`),
  ADD KEY `patient_id` (`patient_id`),
  ADD KEY `gp_id` (`gp_id`),
  ADD KEY `ahp_id` (`ahp_id`),
  ADD KEY `created_by` (`created_by`);

--
-- Indexes for table `appointment_ahps`
--
ALTER TABLE `appointment_ahps`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_appointment_profession_ahp` (`appointment_id`,`profession`,`ahp_id`),
  ADD KEY `ahp_id` (`ahp_id`),
  ADD KEY `idx_appointment_ahps_appointment` (`appointment_id`);

--
-- Indexes for table `appointment_files`
--
ALTER TABLE `appointment_files`
  ADD PRIMARY KEY (`id`),
  ADD KEY `uploaded_by` (`uploaded_by`),
  ADD KEY `idx_appointment_files_appointment` (`appointment_id`);

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
  ADD KEY `idx_conferences_status` (`status`),
  ADD KEY `fk_conferences_accepted_by` (`accepted_by`),
  ADD KEY `idx_conferences_appointment` (`appointment_id`);

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
-- Indexes for table `patient_id_sequence`
--
ALTER TABLE `patient_id_sequence`
  ADD PRIMARY KEY (`id`);

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
-- AUTO_INCREMENT for table `ahp_professions`
--
ALTER TABLE `ahp_professions`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=16;

--
-- AUTO_INCREMENT for table `allied_health_professionals`
--
ALTER TABLE `allied_health_professionals`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `appointments`
--
ALTER TABLE `appointments`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=12;

--
-- AUTO_INCREMENT for table `appointment_ahps`
--
ALTER TABLE `appointment_ahps`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT for table `appointment_files`
--
ALTER TABLE `appointment_files`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `audit_logs`
--
ALTER TABLE `audit_logs`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=229;

--
-- AUTO_INCREMENT for table `conferences`
--
ALTER TABLE `conferences`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=13;

--
-- AUTO_INCREMENT for table `conference_participants`
--
ALTER TABLE `conference_participants`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=30;

--
-- AUTO_INCREMENT for table `gps`
--
ALTER TABLE `gps`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `login_history`
--
ALTER TABLE `login_history`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=152;

--
-- AUTO_INCREMENT for table `notifications`
--
ALTER TABLE `notifications`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=109;

--
-- AUTO_INCREMENT for table `patients`
--
ALTER TABLE `patients`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11;

--
-- AUTO_INCREMENT for table `patient_notes`
--
ALTER TABLE `patient_notes`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT for table `patient_reports`
--
ALTER TABLE `patient_reports`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT for table `receptionists`
--
ALTER TABLE `receptionists`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT for table `reports`
--
ALTER TABLE `reports`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `roles`
--
ALTER TABLE `roles`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `settings`
--
ALTER TABLE `settings`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=46;

--
-- AUTO_INCREMENT for table `tasks`
--
ALTER TABLE `tasks`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=18;

--
-- AUTO_INCREMENT for table `user_profiles`
--
ALTER TABLE `user_profiles`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=18;

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
-- Constraints for table `ahp_professions`
--
ALTER TABLE `ahp_professions`
  ADD CONSTRAINT `ahp_professions_ibfk_1` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL;

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
-- Constraints for table `appointment_ahps`
--
ALTER TABLE `appointment_ahps`
  ADD CONSTRAINT `appointment_ahps_ibfk_1` FOREIGN KEY (`appointment_id`) REFERENCES `appointments` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `appointment_ahps_ibfk_2` FOREIGN KEY (`ahp_id`) REFERENCES `allied_health_professionals` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `appointment_files`
--
ALTER TABLE `appointment_files`
  ADD CONSTRAINT `appointment_files_ibfk_1` FOREIGN KEY (`appointment_id`) REFERENCES `appointments` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `appointment_files_ibfk_2` FOREIGN KEY (`uploaded_by`) REFERENCES `users` (`id`) ON DELETE SET NULL;

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
  ADD CONSTRAINT `conferences_ibfk_4` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `fk_conferences_accepted_by` FOREIGN KEY (`accepted_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `fk_conferences_appointment` FOREIGN KEY (`appointment_id`) REFERENCES `appointments` (`id`) ON DELETE SET NULL;

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
