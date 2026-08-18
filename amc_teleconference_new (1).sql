-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Aug 13, 2026 at 12:22 AM
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
(15, 'eye', 0, 14, '2026-08-06 16:21:50');

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
(8, 'APT-0002', 1, 1, 1, 'Test Conference', NULL, NULL, NULL, '2026-08-06', '10:30:00', 'cancelled', 'time out', NULL, 2, '2026-08-06 09:05:49', '2026-08-07 19:07:09'),
(9, 'APT-0003', 1, 1, 1, 'JSON Test Conference', NULL, NULL, NULL, '2026-08-06', '14:00:00', 'cancelled', 'time out', NULL, 2, '2026-08-06 09:07:17', '2026-08-07 19:07:09'),
(10, 'APT-0004', 1, 1, 1, 'Demo Teleconference — Today', NULL, NULL, NULL, '2026-08-06', '22:00:00', 'scheduled', 'time out', 'Sample meeting for GP accept / AHP join workflow', 14, '2026-08-06 09:38:07', '2026-08-07 19:07:09'),
(12, 'APT-0006', 10, 2, 1, 'Hartattack consumable', 'Food Consuptions', '2026', '2022 Minor Injuries', '2026-08-08', '02:29:00', 'scheduled', NULL, NULL, 14, '2026-08-07 18:18:42', '2026-08-07 19:45:28'),
(14, 'APT-0007', 10, 1, 1, 'Test case', NULL, NULL, NULL, '2026-08-10', '19:40:00', 'cancelled', 'time out', NULL, 14, '2026-08-10 05:31:42', '2026-08-10 16:41:17'),
(15, 'APT-0008', 9, 1, 1, 'Test 2 case', NULL, NULL, NULL, '2026-08-10', '21:00:00', 'cancelled', 'time out', NULL, 14, '2026-08-10 05:32:29', '2026-08-10 16:41:17'),
(16, 'APT-0009', 10, 1, 1, 'gdfhfgdh', 'hdgh', 'ghd', NULL, '2026-08-12', '14:29:00', 'cancelled', 'time out', NULL, 14, '2026-08-12 07:51:20', '2026-08-12 09:19:58'),
(17, 'APT-0010', 1, 1, 1, 'rrrrrrrrr', 'fgggggggg', 'fdgfgfgfg', NULL, '2026-08-12', '15:12:00', 'scheduled', NULL, NULL, 14, '2026-08-12 08:30:44', '2026-08-12 08:46:04');

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
(7, 10, 'Physiotherapist', 1, '2026-08-06 16:27:08'),
(21, 12, 'Physiotherapist', 1, '2026-08-07 19:45:28'),
(22, 12, 'ghdf', 2, '2026-08-07 19:45:28'),
(23, 14, 'Physiotherapist', 1, '2026-08-10 05:31:42'),
(24, 15, 'Physiotherapist', 1, '2026-08-10 05:32:29'),
(40, 17, 'Physiotherapist', 1, '2026-08-12 08:46:04'),
(42, 16, 'Physiotherapist', 1, '2026-08-12 08:46:27');

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

--
-- Dumping data for table `appointment_files`
--

INSERT INTO `appointment_files` (`id`, `appointment_id`, `original_name`, `stored_name`, `file_path`, `file_size`, `mime_type`, `uploaded_by`, `created_at`) VALUES
(1, 12, 'Dr Sonu CC1.docx', '1786126722575-554688616.docx', 'uploads/1786126722575-554688616.docx', 59136, 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 14, '2026-08-07 18:18:42');

-- --------------------------------------------------------

--
-- Table structure for table `appointment_id_sequence`
--

CREATE TABLE `appointment_id_sequence` (
  `id` int(11) NOT NULL DEFAULT 1,
  `last_number` bigint(20) NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `appointment_id_sequence`
--

INSERT INTO `appointment_id_sequence` (`id`, `last_number`) VALUES
(1, 10);

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
(228, 2, 'export', 'report', NULL, NULL, '::1', '2026-08-06 16:37:04'),
(229, 14, 'login', NULL, NULL, NULL, '::1', '2026-08-06 18:33:49'),
(230, 14, 'login', NULL, NULL, NULL, '::1', '2026-08-07 16:47:12'),
(231, 2, 'login', NULL, NULL, NULL, '::1', '2026-08-07 17:44:07'),
(232, 2, 'logout', NULL, NULL, NULL, '::1', '2026-08-07 17:44:11'),
(233, 14, 'login', NULL, NULL, NULL, '::1', '2026-08-07 17:44:25'),
(234, 14, 'login', NULL, NULL, NULL, '::1', '2026-08-07 18:15:51'),
(235, 1, 'login', NULL, NULL, NULL, '::1', '2026-08-07 18:15:52'),
(236, 1, 'login', NULL, NULL, NULL, '::1', '2026-08-07 18:25:37'),
(237, 1, 'login', NULL, NULL, NULL, '::1', '2026-08-07 19:05:43'),
(238, 17, 'login', NULL, NULL, NULL, '::1', '2026-08-07 19:10:39'),
(239, 17, 'login', NULL, NULL, NULL, '::1', '2026-08-07 19:10:59'),
(240, 1, 'login', NULL, NULL, NULL, '::1', '2026-08-07 19:12:21'),
(241, 17, 'login', NULL, NULL, NULL, '::1', '2026-08-07 19:23:31'),
(242, 1, 'login', NULL, NULL, NULL, '::1', '2026-08-07 19:26:50'),
(243, 1, 'login', NULL, NULL, NULL, '::1', '2026-08-07 19:32:39'),
(244, 4, 'login', NULL, NULL, NULL, '::1', '2026-08-07 19:35:00'),
(245, 2, 'login', NULL, NULL, NULL, '::1', '2026-08-07 19:36:53'),
(246, 2, '', 'receptionist', 5, NULL, '::1', '2026-08-07 19:37:59'),
(247, 14, 'logout', NULL, NULL, NULL, '::1', '2026-08-07 19:38:17'),
(248, 14, 'login', NULL, NULL, NULL, '::1', '2026-08-07 19:38:43'),
(249, 2, '', 'receptionist', 5, '{\"email\":\"Sangeetha@info.com\",\"status\":\"inactive\"}', '::1', '2026-08-07 19:39:19'),
(250, 2, '', 'receptionist', 5, '{\"email\":\"Sangeetha@info.com\",\"status\":\"active\"}', '::1', '2026-08-07 19:40:14'),
(251, 14, 'login', NULL, NULL, NULL, '::1', '2026-08-07 19:40:16'),
(252, 2, 'logout', NULL, NULL, NULL, '::1', '2026-08-07 19:40:29'),
(253, 12, 'login', NULL, NULL, NULL, '::1', '2026-08-07 19:40:55'),
(254, 17, 'login', NULL, NULL, NULL, '::1', '2026-08-08 06:17:51'),
(255, 14, 'login', NULL, NULL, NULL, '::1', '2026-08-08 06:18:26'),
(256, 14, 'login', NULL, NULL, NULL, '::1', '2026-08-08 06:19:12'),
(257, 2, 'login', NULL, NULL, NULL, '::1', '2026-08-08 06:19:24'),
(258, 2, 'login', NULL, NULL, NULL, '::1', '2026-08-08 10:18:03'),
(259, 14, 'login', NULL, NULL, NULL, '::1', '2026-08-08 10:18:44'),
(260, 17, 'login', NULL, NULL, NULL, '::1', '2026-08-08 10:21:57'),
(261, 2, 'login', NULL, NULL, NULL, '::1', '2026-08-08 10:39:45'),
(262, 2, 'settings_change', NULL, NULL, NULL, '::1', '2026-08-08 10:39:45'),
(263, 17, 'login', NULL, NULL, NULL, '::1', '2026-08-08 10:40:03'),
(264, 2, 'login', NULL, NULL, NULL, '::1', '2026-08-08 10:40:22'),
(265, 2, 'settings_change', NULL, NULL, NULL, '::1', '2026-08-08 10:40:22'),
(266, 17, 'login', NULL, NULL, NULL, '::1', '2026-08-08 10:40:40'),
(267, 2, 'login', NULL, NULL, NULL, '::1', '2026-08-08 11:04:13'),
(268, 5, 'login', NULL, NULL, NULL, '::1', '2026-08-08 11:04:54'),
(269, 14, 'login', NULL, NULL, NULL, '::1', '2026-08-08 11:05:21'),
(270, 5, 'logout', NULL, NULL, NULL, '::1', '2026-08-08 11:15:22'),
(271, 2, 'logout', NULL, NULL, NULL, '::1', '2026-08-08 11:15:32'),
(272, 14, 'logout', NULL, NULL, NULL, '::1', '2026-08-08 11:15:40'),
(273, 17, 'login', NULL, NULL, NULL, '::1', '2026-08-08 11:21:19'),
(274, 17, 'export', 'conference', NULL, '{\"format\":\"csv\",\"status\":\"all\",\"count\":10}', '::1', '2026-08-08 11:21:19'),
(275, 17, 'export', 'conference', NULL, '{\"format\":\"excel\",\"status\":\"all\",\"count\":10}', '::1', '2026-08-08 11:21:19'),
(276, 17, 'export', 'conference', NULL, '{\"format\":\"pdf\",\"status\":\"all\",\"count\":10}', '::1', '2026-08-08 11:21:19'),
(277, 17, 'export', 'conference', NULL, '{\"format\":\"word\",\"status\":\"all\",\"count\":10}', '::1', '2026-08-08 11:21:19'),
(278, 17, 'login', NULL, NULL, NULL, '::1', '2026-08-08 11:24:35'),
(279, 17, 'export', 'conference', NULL, '{\"format\":\"csv\",\"status\":\"completed\",\"start_date\":\"2026-01-01\",\"end_date\":\"2026-12-31\",\"count\":2}', '::1', '2026-08-08 11:24:35'),
(280, 4, 'login', NULL, NULL, NULL, '::1', '2026-08-08 11:24:51'),
(281, 4, 'export', 'conference', NULL, '{\"format\":\"pdf\",\"status\":\"all\",\"count\":6}', '::1', '2026-08-08 11:24:51'),
(282, 5, 'login', NULL, NULL, NULL, '::1', '2026-08-08 11:24:51'),
(283, 5, 'export', 'conference', NULL, '{\"format\":\"pdf\",\"status\":\"all\",\"count\":6}', '::1', '2026-08-08 11:24:51'),
(284, 2, 'login', NULL, NULL, NULL, '::1', '2026-08-08 11:29:17'),
(285, 5, 'login', NULL, NULL, NULL, '::1', '2026-08-08 11:29:36'),
(286, 14, 'login', NULL, NULL, NULL, '::1', '2026-08-08 11:29:48'),
(287, 17, 'login', NULL, NULL, NULL, '::1', '2026-08-08 11:36:22'),
(288, 17, 'login', NULL, NULL, NULL, '::1', '2026-08-08 11:36:35'),
(289, 17, 'login', NULL, NULL, NULL, '::1', '2026-08-08 11:37:35'),
(290, 2, 'login', NULL, NULL, NULL, '::1', '2026-08-08 11:38:00'),
(291, 17, 'login', NULL, NULL, NULL, '::1', '2026-08-08 11:38:16'),
(292, 17, 'export', 'conference', NULL, '{\"format\":\"csv\",\"status\":\"all\",\"count\":10}', '::1', '2026-08-08 11:38:16'),
(293, 17, 'export', 'conference', NULL, '{\"format\":\"excel\",\"status\":\"all\",\"count\":10}', '::1', '2026-08-08 11:38:16'),
(294, 17, 'export', 'conference', NULL, '{\"format\":\"pdf\",\"status\":\"all\",\"count\":10}', '::1', '2026-08-08 11:38:16'),
(295, 17, 'export', 'conference', NULL, '{\"format\":\"word\",\"status\":\"all\",\"count\":10}', '::1', '2026-08-08 11:38:16'),
(296, 14, 'export', 'conference', NULL, '{\"format\":\"word\",\"status\":\"all\",\"count\":10}', '::1', '2026-08-08 11:51:16'),
(297, 4, 'login', NULL, NULL, NULL, '::1', '2026-08-08 12:45:21'),
(298, 17, 'login', NULL, NULL, NULL, '::1', '2026-08-08 12:45:33'),
(299, 4, 'login', NULL, NULL, NULL, '::1', '2026-08-08 12:45:33'),
(300, 4, 'login', NULL, NULL, NULL, '::1', '2026-08-08 12:45:41'),
(301, 4, 'login', NULL, NULL, NULL, '::1', '2026-08-08 12:45:48'),
(302, 17, 'login', NULL, NULL, NULL, '::1', '2026-08-08 12:45:48'),
(303, 17, 'login', NULL, NULL, NULL, '::1', '2026-08-08 12:46:26'),
(304, 14, 'login', NULL, NULL, NULL, '::1', '2026-08-08 12:48:07'),
(305, 2, 'login', NULL, NULL, NULL, '::1', '2026-08-08 12:48:36'),
(306, 17, 'login', NULL, NULL, NULL, '::1', '2026-08-08 12:52:41'),
(307, 17, 'login', NULL, NULL, NULL, '::1', '2026-08-08 12:53:13'),
(308, 14, 'export', 'conference', NULL, '{\"format\":\"pdf\",\"status\":\"completed\",\"start_date\":\"2026-08-06\",\"end_date\":\"2026-08-08\",\"count\":2}', '::1', '2026-08-08 13:04:39'),
(309, 14, 'export', 'conference', NULL, '{\"format\":\"pdf\",\"status\":\"cancelled\",\"start_date\":\"2026-08-06\",\"end_date\":\"2026-08-08\",\"count\":4}', '::1', '2026-08-08 13:04:52'),
(310, 2, 'logout', NULL, NULL, NULL, '::1', '2026-08-08 13:13:03'),
(311, 5, 'logout', NULL, NULL, NULL, '::1', '2026-08-08 13:13:15'),
(312, 14, 'login', NULL, NULL, NULL, '::1', '2026-08-08 13:26:09'),
(313, 2, 'login', NULL, NULL, NULL, '::1', '2026-08-08 13:31:21'),
(314, 2, 'settings_change', NULL, NULL, NULL, '::1', '2026-08-08 13:31:41'),
(315, 2, 'settings_change', NULL, NULL, NULL, '::1', '2026-08-08 13:31:53'),
(316, 2, 'login', NULL, NULL, NULL, '::1', '2026-08-08 13:42:20'),
(317, 14, 'login', NULL, NULL, NULL, '::1', '2026-08-08 13:43:55'),
(318, 4, 'login', NULL, NULL, NULL, '::1', '2026-08-08 13:44:33'),
(319, 14, 'logout', NULL, NULL, NULL, '::1', '2026-08-08 13:50:30'),
(320, 4, 'logout', NULL, NULL, NULL, '::1', '2026-08-08 13:50:36'),
(321, 2, 'logout', NULL, NULL, NULL, '::1', '2026-08-08 13:50:46'),
(322, 2, 'login', NULL, NULL, NULL, '127.0.0.1', '2026-08-10 05:00:49'),
(323, 2, 'logout', NULL, NULL, NULL, '127.0.0.1', '2026-08-10 05:03:54'),
(324, 1, 'login', NULL, NULL, NULL, '127.0.0.1', '2026-08-10 05:04:02'),
(325, 14, 'login', NULL, NULL, NULL, '127.0.0.1', '2026-08-10 05:25:56'),
(326, 2, 'login', NULL, NULL, NULL, '127.0.0.1', '2026-08-10 05:26:02'),
(327, 1, 'login', NULL, NULL, NULL, '127.0.0.1', '2026-08-10 05:26:14'),
(328, 2, '', 'receptionist', 6, '{\"email\":\"Suthan@123.com\",\"status\":\"active\"}', '127.0.0.1', '2026-08-10 05:26:52'),
(329, 1, 'logout', NULL, NULL, NULL, '127.0.0.1', '2026-08-10 05:30:32'),
(330, 4, 'login', NULL, NULL, NULL, '127.0.0.1', '2026-08-10 05:30:41'),
(331, 4, 'logout', NULL, NULL, NULL, '127.0.0.1', '2026-08-10 05:30:54'),
(332, 4, 'login', NULL, NULL, NULL, '127.0.0.1', '2026-08-10 05:31:53'),
(333, 4, 'logout', NULL, NULL, NULL, '127.0.0.1', '2026-08-10 05:32:50'),
(334, 4, 'login', NULL, NULL, NULL, '127.0.0.1', '2026-08-10 05:32:56'),
(335, 2, 'login', NULL, NULL, NULL, '127.0.0.1', '2026-08-10 08:07:15'),
(336, 4, 'login', NULL, NULL, NULL, '127.0.0.1', '2026-08-10 08:07:56'),
(337, 5, 'login', NULL, NULL, NULL, '127.0.0.1', '2026-08-10 08:08:57'),
(338, 1, 'login', NULL, NULL, NULL, '127.0.0.1', '2026-08-10 08:09:47'),
(339, 14, 'login', NULL, NULL, NULL, '127.0.0.1', '2026-08-10 08:10:15'),
(340, 2, 'settings_change', NULL, NULL, NULL, '127.0.0.1', '2026-08-10 08:10:27'),
(341, 2, 'settings_change', NULL, NULL, NULL, '127.0.0.1', '2026-08-10 08:10:42'),
(342, 2, 'settings_change', NULL, NULL, NULL, '127.0.0.1', '2026-08-10 08:10:48'),
(343, 2, 'settings_change', NULL, NULL, NULL, '127.0.0.1', '2026-08-10 08:10:53'),
(344, 2, 'settings_change', NULL, NULL, NULL, '127.0.0.1', '2026-08-10 08:10:54'),
(345, 2, 'settings_change', NULL, NULL, NULL, '127.0.0.1', '2026-08-10 08:12:28'),
(346, 2, 'settings_change', NULL, NULL, NULL, '127.0.0.1', '2026-08-10 08:12:28'),
(347, 2, 'settings_change', NULL, NULL, NULL, '127.0.0.1', '2026-08-10 08:12:29'),
(348, 2, 'settings_change', NULL, NULL, NULL, '127.0.0.1', '2026-08-10 08:12:33'),
(349, 2, 'settings_change', NULL, NULL, NULL, '127.0.0.1', '2026-08-10 08:12:40'),
(350, 2, 'settings_change', NULL, NULL, NULL, '127.0.0.1', '2026-08-10 08:12:41'),
(351, 4, 'logout', NULL, NULL, NULL, '127.0.0.1', '2026-08-10 08:16:31'),
(352, 4, 'login', NULL, NULL, NULL, '127.0.0.1', '2026-08-10 08:16:43'),
(353, 14, 'login', NULL, NULL, NULL, '127.0.0.1', '2026-08-10 08:29:18'),
(354, 4, 'login', NULL, NULL, NULL, '127.0.0.1', '2026-08-10 08:30:03'),
(355, 5, 'login', NULL, NULL, NULL, '127.0.0.1', '2026-08-10 08:30:18'),
(356, 1, 'login', NULL, NULL, NULL, '127.0.0.1', '2026-08-10 08:30:49'),
(357, 2, 'login', NULL, NULL, NULL, '127.0.0.1', '2026-08-10 08:31:03'),
(358, 14, 'login', NULL, NULL, NULL, '127.0.0.1', '2026-08-10 09:10:47'),
(359, 2, 'login', NULL, NULL, NULL, '127.0.0.1', '2026-08-10 09:12:18'),
(360, 1, 'login', NULL, NULL, NULL, '127.0.0.1', '2026-08-10 09:13:13'),
(361, 1, 'export', 'audit_logs', NULL, NULL, '127.0.0.1', '2026-08-10 09:15:55'),
(362, 4, 'login', NULL, NULL, NULL, '127.0.0.1', '2026-08-10 09:19:50'),
(363, 5, 'login', NULL, NULL, NULL, '127.0.0.1', '2026-08-10 09:20:15'),
(364, 14, 'login', NULL, NULL, NULL, '127.0.0.1', '2026-08-12 07:33:31'),
(365, 4, 'login', NULL, NULL, NULL, '127.0.0.1', '2026-08-12 07:34:33'),
(366, 1, 'login', NULL, NULL, NULL, '127.0.0.1', '2026-08-12 07:44:13'),
(367, 1, 'export', 'audit_logs', NULL, NULL, '127.0.0.1', '2026-08-12 07:44:46'),
(368, 4, 'login', NULL, NULL, NULL, '127.0.0.1', '2026-08-12 07:50:03'),
(369, 14, 'login', NULL, NULL, NULL, '127.0.0.1', '2026-08-12 07:50:22'),
(370, 4, 'logout', NULL, NULL, NULL, '127.0.0.1', '2026-08-12 07:51:26'),
(371, 4, 'login', NULL, NULL, NULL, '127.0.0.1', '2026-08-12 07:51:33'),
(372, 4, 'logout', NULL, NULL, NULL, '127.0.0.1', '2026-08-12 07:52:15'),
(373, 4, 'login', NULL, NULL, NULL, '127.0.0.1', '2026-08-12 07:52:22'),
(374, 2, 'login', NULL, NULL, NULL, '127.0.0.1', '2026-08-12 07:55:08'),
(375, 5, 'login', NULL, NULL, NULL, '127.0.0.1', '2026-08-12 08:00:20'),
(376, 4, 'logout', NULL, NULL, NULL, '127.0.0.1', '2026-08-12 08:25:11'),
(377, 4, 'login', NULL, NULL, NULL, '127.0.0.1', '2026-08-12 08:25:25'),
(378, 5, 'logout', NULL, NULL, NULL, '127.0.0.1', '2026-08-12 08:25:33'),
(379, 5, 'login', NULL, NULL, NULL, '127.0.0.1', '2026-08-12 08:25:42'),
(380, 4, 'logout', NULL, NULL, NULL, '127.0.0.1', '2026-08-12 08:29:12'),
(381, 5, 'logout', NULL, NULL, NULL, '127.0.0.1', '2026-08-12 08:29:14'),
(382, 4, 'login', NULL, NULL, NULL, '127.0.0.1', '2026-08-12 08:29:44'),
(383, 5, 'login', NULL, NULL, NULL, '127.0.0.1', '2026-08-12 08:29:53'),
(384, 4, 'logout', NULL, NULL, NULL, '127.0.0.1', '2026-08-12 08:31:56'),
(385, 5, 'logout', NULL, NULL, NULL, '127.0.0.1', '2026-08-12 08:31:59'),
(386, 5, 'login', NULL, NULL, NULL, '127.0.0.1', '2026-08-12 08:32:07'),
(387, 4, 'login', NULL, NULL, NULL, '127.0.0.1', '2026-08-12 08:32:21'),
(388, 4, 'logout', NULL, NULL, NULL, '127.0.0.1', '2026-08-12 08:38:54'),
(389, 4, 'login', NULL, NULL, NULL, '127.0.0.1', '2026-08-12 08:39:01'),
(390, 5, 'logout', NULL, NULL, NULL, '127.0.0.1', '2026-08-12 08:39:08'),
(391, 4, 'logout', NULL, NULL, NULL, '127.0.0.1', '2026-08-12 08:47:00'),
(392, 4, 'login', NULL, NULL, NULL, '127.0.0.1', '2026-08-12 08:47:11'),
(393, 5, 'login', NULL, NULL, NULL, '127.0.0.1', '2026-08-12 08:47:33'),
(394, 2, 'settings_change', NULL, NULL, NULL, '127.0.0.1', '2026-08-12 09:06:28'),
(395, 2, 'settings_change', NULL, NULL, NULL, '127.0.0.1', '2026-08-12 09:06:36'),
(396, 4, 'export', 'conference', NULL, '{\"format\":\"pdf\",\"status\":\"completed\",\"start_date\":\"2026-08-01\",\"end_date\":\"2026-08-12\",\"count\":1}', '127.0.0.1', '2026-08-12 09:06:57'),
(397, 17, 'login', NULL, NULL, NULL, '127.0.0.1', '2026-08-12 09:18:41'),
(398, 17, 'login', NULL, NULL, NULL, '127.0.0.1', '2026-08-12 09:19:43'),
(399, 17, 'export', 'conference_join_time', NULL, '{\"format\":\"csv\",\"date\":\"2026-08-12\",\"patient_id\":null,\"role\":null,\"gp_id\":null,\"ahp_id\":null,\"count\":0}', '127.0.0.1', '2026-08-12 09:19:43'),
(400, 17, 'login', NULL, NULL, NULL, '127.0.0.1', '2026-08-12 09:19:58'),
(401, 14, 'login', NULL, NULL, NULL, '127.0.0.1', '2026-08-12 09:23:22');

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
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `ended_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `conferences`
--

INSERT INTO `conferences` (`id`, `conference_code`, `appointment_id`, `patient_id`, `gp_id`, `ahp_id`, `scheduled_date`, `scheduled_time`, `status`, `cancelled_reason`, `cancelled_at`, `meeting_link`, `room_id`, `accepted_at`, `accepted_by`, `notes`, `created_by`, `created_at`, `updated_at`, `ended_at`) VALUES
(1, 'CON-0001', NULL, 1, 1, 1, '2026-08-06', '11:00:00', 'cancelled', 'time out', '2026-08-06 10:06:13', NULL, NULL, NULL, NULL, NULL, NULL, '2026-08-02 16:42:57', '2026-08-07 19:26:32', NULL),
(5, 'CON-0002', NULL, 6, NULL, NULL, '2026-08-12', '14:00:00', 'cancelled', 'time out', '2026-08-12 08:40:01', 'https://meet.example.com/e2e', NULL, NULL, NULL, 'E2E conference', NULL, '2026-08-03 14:33:36', '2026-08-12 08:40:01', NULL),
(6, 'CON-0003', NULL, 7, NULL, NULL, '2026-08-12', '14:00:00', 'cancelled', 'time out', '2026-08-12 08:40:01', 'https://meet.example.com/e2e', NULL, NULL, NULL, 'E2E conference', NULL, '2026-08-03 15:04:04', '2026-08-12 08:40:01', NULL),
(9, 'CON-0005', 8, 1, 1, 1, '2026-08-06', '10:30:00', 'cancelled', 'time out', '2026-08-06 10:06:13', 'https://meet.amc.com/conf-mshbp3br-whao', NULL, NULL, NULL, 'Title: Test Conference', 14, '2026-08-06 09:38:07', '2026-08-07 19:26:32', NULL),
(10, 'CON-0006', 9, 1, 1, 1, '2026-08-06', '14:00:00', 'cancelled', 'time out', '2026-08-06 10:06:13', 'https://meet.amc.com/conf-mshbp3ct-jm9w', NULL, NULL, NULL, 'Title: JSON Test Conference', 14, '2026-08-06 09:38:07', '2026-08-07 19:26:32', NULL),
(11, 'CON-0007', 10, 1, 1, 1, '2026-08-06', '22:00:00', 'completed', 'time out', '2026-08-06 10:06:13', 'https://meet.amc.com/conf-mshbp3e2-bgrf', 'conf-mshbp3e2-bgrf', '2026-08-06 16:31:16', 4, 'Title: Demo Teleconference — Today\nSample meeting for GP accept / AHP join workflow', 14, '2026-08-06 09:38:07', '2026-08-07 19:26:32', NULL),
(12, 'CON-0008', NULL, 6, 1, 1, '2026-08-07', '00:39:00', 'cancelled', 'time out', '2026-08-07 17:22:09', 'https://meet.amc.com/conf-mshbqntt-mgcf', 'conf-mshbqntt-mgcf', '2026-08-06 10:07:30', 4, 'Title: Follow-up Teleconference\nSecond sample meeting today', 14, '2026-08-06 09:39:20', '2026-08-07 19:26:32', NULL),
(13, 'CON-0009', 12, 10, 2, 1, '2026-08-08', '02:29:00', 'completed', NULL, NULL, 'https://meet.amc.com/conf-msj9qfjc-7i85', 'con-0009', '2026-08-07 19:46:09', 12, 'Title: Hartattack consumable\nImportant: Food Consuptions', 14, '2026-08-07 18:18:42', '2026-08-07 19:46:28', NULL),
(14, 'CON-0010', NULL, 10, 3, 2, '2026-08-20', '14:30:00', 'cancelled', NULL, '2026-08-07 19:10:59', 'https://meet.amc.com/conf-msjbl8vz-106q', NULL, NULL, NULL, 'Title: TEMP verification appointment', 17, '2026-08-07 19:10:39', '2026-08-07 19:26:32', NULL),
(15, 'CON-0011', 14, 10, 1, 1, '2026-08-10', '19:40:00', 'cancelled', 'time out', '2026-08-10 16:41:17', 'https://meet.amc.com/con-0011', NULL, NULL, NULL, 'Title: Test case', 14, '2026-08-10 05:31:42', '2026-08-10 16:41:17', NULL),
(16, 'CON-0012', 15, 9, 1, 1, '2026-08-10', '21:00:00', 'cancelled', 'time out', '2026-08-10 16:41:17', 'https://meet.amc.com/con-0012', NULL, NULL, NULL, 'Title: Test 2 case', 14, '2026-08-10 05:32:29', '2026-08-10 16:41:17', NULL),
(17, 'CON-0013', 16, 10, 1, 1, '2026-08-12', '14:29:00', 'cancelled', 'time out', '2026-08-12 09:19:58', 'https://meet.amc.com/con-0013', NULL, NULL, NULL, 'Title: gdfhfgdh\nImportant: hdgh', 14, '2026-08-12 07:51:20', '2026-08-12 09:19:58', NULL),
(18, 'CON-0014', 17, 1, 1, 1, '2026-08-12', '15:12:00', 'scheduled', NULL, NULL, 'https://meet.amc.com/con-0014', NULL, NULL, NULL, 'Title: rrrrrrrrr\nImportant: fgggggggg', 14, '2026-08-12 08:30:44', '2026-08-12 08:46:04', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `conference_clinical_reports`
--

CREATE TABLE `conference_clinical_reports` (
  `id` int(11) NOT NULL,
  `conference_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `participant_role` enum('gp','ahp','guest_gp','guest_ahp') NOT NULL,
  `display_name` varchar(255) NOT NULL,
  `assessment` longtext DEFAULT NULL,
  `recommendations` longtext DEFAULT NULL,
  `conclusion` longtext DEFAULT NULL,
  `edit_locked_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `conference_clinical_reports`
--

INSERT INTO `conference_clinical_reports` (`id`, `conference_id`, `user_id`, `participant_role`, `display_name`, `assessment`, `recommendations`, `conclusion`, `edit_locked_at`, `created_at`, `updated_at`) VALUES
(1, 11, 4, 'gp', 'John Smith', NULL, '<p><strong>Rich</strong> text</p>', NULL, NULL, '2026-08-08 12:45:48', '2026-08-08 12:45:48'),
(2, 11, 5, 'ahp', 'Jane Doe', NULL, NULL, NULL, NULL, '2026-08-08 12:45:48', '2026-08-08 12:45:48'),
(5, 11, 18, 'guest_gp', 'Dr External', NULL, NULL, NULL, NULL, '2026-08-08 12:45:49', '2026-08-08 12:45:49'),
(14, 5, 19, 'guest_gp', 'Nilu', NULL, NULL, NULL, NULL, '2026-08-08 13:09:01', '2026-08-08 13:09:01'),
(15, 5, 20, 'guest_ahp', 'rajesh', NULL, NULL, NULL, NULL, '2026-08-08 13:15:13', '2026-08-08 13:15:13'),
(16, 5, 21, 'guest_ahp', 'fgfdg', NULL, NULL, NULL, NULL, '2026-08-08 13:16:22', '2026-08-08 13:16:22'),
(17, 6, 22, 'guest_gp', 'dfdsf', NULL, NULL, NULL, NULL, '2026-08-08 13:46:24', '2026-08-08 13:46:24');

-- --------------------------------------------------------

--
-- Table structure for table `conference_generated_documents`
--

CREATE TABLE `conference_generated_documents` (
  `id` int(11) NOT NULL,
  `conference_id` int(11) NOT NULL,
  `participant_user_id` int(11) NOT NULL,
  `participant_name` varchar(255) NOT NULL,
  `file_type` enum('pdf','docx') NOT NULL,
  `original_name` varchar(255) NOT NULL,
  `stored_name` varchar(255) NOT NULL,
  `file_path` varchar(500) NOT NULL,
  `file_size` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `conference_generated_documents`
--

INSERT INTO `conference_generated_documents` (`id`, `conference_id`, `participant_user_id`, `participant_name`, `file_type`, `original_name`, `stored_name`, `file_path`, `file_size`, `created_at`) VALUES
(1, 11, 4, 'John Smith', 'pdf', 'CON-0007 - John Smith.pdf', 'CON-0007-John-Smith-1786193178607.pdf', 'uploads\\conference-reports\\CON-0007-John-Smith-1786193178607.pdf', 2047, '2026-08-08 12:46:18'),
(2, 11, 4, 'John Smith', 'docx', 'CON-0007 - John Smith.docx', 'CON-0007-John-Smith-1786193178611.docx', 'uploads\\conference-reports\\CON-0007-John-Smith-1786193178611.docx', 32263, '2026-08-08 12:46:18'),
(3, 11, 18, 'Dr External', 'pdf', 'CON-0007 - Dr External.pdf', 'CON-0007-Dr-External-1786193178642.pdf', 'uploads\\conference-reports\\CON-0007-Dr-External-1786193178642.pdf', 2047, '2026-08-08 12:46:18'),
(4, 11, 18, 'Dr External', 'docx', 'CON-0007 - Dr External.docx', 'CON-0007-Dr-External-1786193178645.docx', 'uploads\\conference-reports\\CON-0007-Dr-External-1786193178645.docx', 32263, '2026-08-08 12:46:18'),
(5, 11, 5, 'Jane Doe', 'pdf', 'CON-0007 - Jane Doe.pdf', 'CON-0007-Jane-Doe-1786193178669.pdf', 'uploads\\conference-reports\\CON-0007-Jane-Doe-1786193178669.pdf', 2047, '2026-08-08 12:46:18'),
(6, 11, 5, 'Jane Doe', 'docx', 'CON-0007 - Jane Doe.docx', 'CON-0007-Jane-Doe-1786193178672.docx', 'uploads\\conference-reports\\CON-0007-Jane-Doe-1786193178672.docx', 32263, '2026-08-08 12:46:18');

-- --------------------------------------------------------

--
-- Table structure for table `conference_guest_access`
--

CREATE TABLE `conference_guest_access` (
  `id` int(11) NOT NULL,
  `conference_id` int(11) NOT NULL,
  `guest_name` varchar(255) NOT NULL,
  `guest_email` varchar(255) NOT NULL,
  `guest_role` enum('guest_gp','guest_ahp') NOT NULL,
  `access_code` varchar(32) NOT NULL,
  `temp_password_hash` varchar(255) NOT NULL,
  `temp_password` varchar(64) DEFAULT NULL,
  `user_id` int(11) DEFAULT NULL,
  `join_url` varchar(500) DEFAULT NULL,
  `created_by` int(11) NOT NULL,
  `expires_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `revoked_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `conference_guest_access`
--

INSERT INTO `conference_guest_access` (`id`, `conference_id`, `guest_name`, `guest_email`, `guest_role`, `access_code`, `temp_password_hash`, `temp_password`, `user_id`, `join_url`, `created_by`, `expires_at`, `revoked_at`, `created_at`) VALUES
(1, 11, 'Dr External', 'external.gp@test.com', 'guest_gp', '1EC5666FAE3D', '$2b$12$nQ7Mg8pY83jqbhFaZbrmS.uFUT3DAXUGBcY68V/055uy9tbZ6VX6e', NULL, 18, 'http://localhost:5173/guest-conference?code=1EC5666FAE3D', 17, '2026-08-09 07:15:49', NULL, '2026-08-08 12:45:49'),
(2, 5, 'Nilu', '123@info.com', 'guest_gp', 'D083F8636CBE', '$2b$12$LUfaLv/Rf0P/VkgcSSBas.sATggCqGj9Cvzj3G.P.8DWu7BN.AFZe', NULL, 19, 'http://localhost:5173/guest-conference?code=D083F8636CBE', 14, '2026-08-09 07:39:01', NULL, '2026-08-08 13:09:01'),
(3, 5, 'rajesh', 'rajesh2026@gmail.com', 'guest_ahp', '02823DF252E2', '$2b$12$Icd4ZMG3TBb1EKdNLIWey.Z8ulkUT5pcFph1qbmq9ZLulu6ZYSDMu', NULL, 20, 'http://localhost:5173/guest-conference?code=02823DF252E2', 14, '2026-08-09 07:45:13', NULL, '2026-08-08 13:15:13'),
(4, 5, 'fgfdg', 'dsgsg@fa.vom', 'guest_ahp', '8BCF0D8C9A3F', '$2b$12$5tpYby1uVAyj0BxeNLQafOl2tZSK2VLBJ9sOG3iBE.D8B.M3yGqsa', NULL, 21, 'http://localhost:5173/guest-conference?code=8BCF0D8C9A3F', 14, '2026-08-09 07:46:22', NULL, '2026-08-08 13:16:22'),
(5, 6, 'dfdsf', 'dsfdsf@gfdg.com', 'guest_gp', '994894', '$2b$12$JVHtz17wD6OF1cStR2ZR/e63FQ/GaAN/OAJOVsxaBT/ej5m3cjvMK', 'b8c4e061', 22, 'http://localhost:5173/guest-conference?code=994894', 14, '2026-08-09 08:16:24', NULL, '2026-08-08 13:46:24');

-- --------------------------------------------------------

--
-- Table structure for table `conference_id_sequence`
--

CREATE TABLE `conference_id_sequence` (
  `id` int(11) NOT NULL DEFAULT 1,
  `last_number` bigint(20) NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `conference_id_sequence`
--

INSERT INTO `conference_id_sequence` (`id`, `last_number`) VALUES
(1, 14);

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
(10, 1, 4, 'gp', NULL, NULL),
(11, 1, 5, 'ahp', NULL, NULL),
(16, 9, 4, 'gp', NULL, NULL),
(17, 9, 5, 'ahp', NULL, NULL),
(18, 10, 4, 'gp', NULL, NULL),
(19, 10, 5, 'ahp', NULL, NULL),
(28, 11, 4, 'gp', NULL, NULL),
(29, 11, 5, 'ahp', '2026-08-06 16:32:02', NULL),
(32, 12, 4, 'gp', NULL, NULL),
(33, 12, 5, 'ahp', NULL, NULL),
(46, 14, 16, 'gp', NULL, NULL),
(47, 14, 13, 'ahp', NULL, NULL),
(51, 13, 12, 'gp', NULL, NULL),
(52, 13, 5, 'ahp', NULL, NULL),
(53, 13, 13, 'ahp', NULL, NULL),
(54, 11, 18, 'gp', NULL, NULL),
(55, 5, 19, 'gp', NULL, NULL),
(56, 5, 20, 'ahp', NULL, NULL),
(57, 5, 21, 'ahp', NULL, NULL),
(58, 6, 22, 'gp', NULL, NULL),
(59, 15, 4, 'gp', NULL, NULL),
(60, 15, 5, 'ahp', NULL, NULL),
(61, 16, 4, 'gp', NULL, NULL),
(62, 16, 5, 'ahp', NULL, NULL),
(93, 18, 4, 'gp', NULL, NULL),
(94, 18, 5, 'ahp', NULL, NULL),
(97, 17, 4, 'gp', NULL, NULL),
(98, 17, 5, 'ahp', NULL, NULL);

-- --------------------------------------------------------

--
-- Table structure for table `conference_participant_sessions`
--

CREATE TABLE `conference_participant_sessions` (
  `id` int(11) NOT NULL,
  `conference_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `joined_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `left_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `conference_participant_sessions`
--

INSERT INTO `conference_participant_sessions` (`id`, `conference_id`, `user_id`, `joined_at`, `left_at`) VALUES
(1, 11, 5, '2026-08-06 16:32:02', '2026-08-06 18:02:02');

-- --------------------------------------------------------

--
-- Table structure for table `conference_report_edit_requests`
--

CREATE TABLE `conference_report_edit_requests` (
  `id` int(11) NOT NULL,
  `conference_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `reason` text NOT NULL,
  `status` enum('pending','approved','rejected') DEFAULT 'pending',
  `reviewed_by` int(11) DEFAULT NULL,
  `reviewed_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

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
(151, 2, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:153.0) Gecko/20100101 Firefox/153.0', '2026-08-06 16:15:39', NULL, 'success'),
(152, 14, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36', '2026-08-06 18:33:49', NULL, 'success'),
(153, 14, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36', '2026-08-07 16:47:12', NULL, 'success'),
(154, 2, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36', '2026-08-07 17:44:07', '2026-08-07 17:44:11', 'success'),
(155, 14, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36', '2026-08-07 17:44:25', NULL, 'success'),
(156, 14, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36 Edg/151.0.0.0', '2026-08-07 18:15:51', '2026-08-07 19:38:17', 'success'),
(157, 1, '::1', 'Mozilla/5.0 (Windows NT; Windows NT 10.0; en-US) WindowsPowerShell/5.1.19041.6456', '2026-08-07 18:15:52', NULL, 'success'),
(158, 1, '::1', 'Mozilla/5.0 (Windows NT; Windows NT 10.0; en-US) WindowsPowerShell/5.1.19041.6456', '2026-08-07 18:25:37', NULL, 'success'),
(159, 1, '::1', 'Mozilla/5.0 (Windows NT; Windows NT 10.0; en-US) WindowsPowerShell/5.1.19041.6456', '2026-08-07 19:05:43', NULL, 'success'),
(160, 17, '::1', 'Mozilla/5.0 (Windows NT; Windows NT 10.0; en-US) WindowsPowerShell/5.1.19041.6456', '2026-08-07 19:10:39', NULL, 'success'),
(161, 17, '::1', 'Mozilla/5.0 (Windows NT; Windows NT 10.0; en-US) WindowsPowerShell/5.1.19041.6456', '2026-08-07 19:10:59', NULL, 'success'),
(162, 1, '::1', 'Mozilla/5.0 (Windows NT; Windows NT 10.0; en-US) WindowsPowerShell/5.1.19041.6456', '2026-08-07 19:12:21', NULL, 'success'),
(163, 17, '::1', 'Mozilla/5.0 (Windows NT; Windows NT 10.0; en-US) WindowsPowerShell/5.1.19041.6456', '2026-08-07 19:23:31', NULL, 'success'),
(164, 1, '::1', 'Mozilla/5.0 (Windows NT; Windows NT 10.0; en-US) WindowsPowerShell/5.1.19041.6456', '2026-08-07 19:26:50', NULL, 'success'),
(165, 1, '::1', 'Mozilla/5.0 (Windows NT; Windows NT 10.0; en-US) WindowsPowerShell/5.1.19041.6456', '2026-08-07 19:32:39', NULL, 'success'),
(166, 4, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36', '2026-08-07 19:35:00', NULL, 'success'),
(167, 2, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36', '2026-08-07 19:36:53', '2026-08-07 19:40:29', 'success'),
(168, 14, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36 Edg/151.0.0.0', '2026-08-07 19:38:23', NULL, 'failed'),
(169, 14, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36 Edg/151.0.0.0', '2026-08-07 19:38:31', NULL, 'failed'),
(170, 14, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36 Edg/151.0.0.0', '2026-08-07 19:38:37', NULL, 'failed'),
(171, 14, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36 Edg/151.0.0.0', '2026-08-07 19:38:43', NULL, 'success'),
(172, 14, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36 Edg/151.0.0.0', '2026-08-07 19:40:16', NULL, 'success'),
(173, 12, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36', '2026-08-07 19:40:50', NULL, 'failed'),
(174, 12, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36', '2026-08-07 19:40:55', NULL, 'success'),
(175, 2, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36 Edg/151.0.0.0', '2026-08-08 06:15:07', NULL, 'failed'),
(176, 2, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36 Edg/151.0.0.0', '2026-08-08 06:15:10', NULL, 'failed'),
(177, 2, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36 Edg/151.0.0.0', '2026-08-08 06:15:11', NULL, 'failed'),
(178, 14, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36', '2026-08-08 06:15:37', NULL, 'failed'),
(179, 14, '::1', 'node', '2026-08-08 06:16:59', NULL, 'failed'),
(180, 14, '::1', 'node', '2026-08-08 06:17:20', NULL, 'failed'),
(181, 14, '::1', 'Mozilla/5.0 (Windows NT; Windows NT 10.0; en-US) WindowsPowerShell/5.1.19041.6456', '2026-08-08 06:17:44', NULL, 'failed'),
(182, 17, '::1', 'Mozilla/5.0 (Windows NT; Windows NT 10.0; en-US) WindowsPowerShell/5.1.19041.6456', '2026-08-08 06:17:51', NULL, 'success'),
(183, 14, '::1', 'Mozilla/5.0 (Windows NT; Windows NT 10.0; en-US) WindowsPowerShell/5.1.19041.6456', '2026-08-08 06:18:26', NULL, 'success'),
(184, 14, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36', '2026-08-08 06:19:12', NULL, 'success'),
(185, 2, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36 Edg/151.0.0.0', '2026-08-08 06:19:18', NULL, 'failed'),
(186, 2, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36 Edg/151.0.0.0', '2026-08-08 06:19:19', NULL, 'failed'),
(187, 2, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36 Edg/151.0.0.0', '2026-08-08 06:19:20', NULL, 'failed'),
(188, 2, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36 Edg/151.0.0.0', '2026-08-08 06:19:24', NULL, 'success'),
(189, 2, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36 Edg/151.0.0.0', '2026-08-08 10:18:03', NULL, 'success'),
(190, 14, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36', '2026-08-08 10:18:44', NULL, 'success'),
(191, 17, '::1', 'Mozilla/5.0 (Windows NT; Windows NT 10.0; en-US) WindowsPowerShell/5.1.19041.6456', '2026-08-08 10:21:57', NULL, 'success'),
(192, 2, '::1', 'Mozilla/5.0 (Windows NT; Windows NT 10.0; en-US) WindowsPowerShell/5.1.19041.6456', '2026-08-08 10:39:45', NULL, 'success'),
(193, 17, '::1', 'Mozilla/5.0 (Windows NT; Windows NT 10.0; en-US) WindowsPowerShell/5.1.19041.6456', '2026-08-08 10:40:03', NULL, 'success'),
(194, 2, '::1', 'Mozilla/5.0 (Windows NT; Windows NT 10.0; en-US) WindowsPowerShell/5.1.19041.6456', '2026-08-08 10:40:22', NULL, 'success'),
(195, 17, '::1', 'Mozilla/5.0 (Windows NT; Windows NT 10.0; en-US) WindowsPowerShell/5.1.19041.6456', '2026-08-08 10:40:40', NULL, 'success'),
(196, 2, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36 Edg/151.0.0.0', '2026-08-08 11:04:13', '2026-08-08 11:15:32', 'success'),
(197, 5, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36', '2026-08-08 11:04:54', '2026-08-08 11:15:22', 'success'),
(198, 14, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36', '2026-08-08 11:05:21', '2026-08-08 11:15:40', 'success'),
(199, 17, '::1', 'Mozilla/5.0 (Windows NT; Windows NT 10.0; en-US) WindowsPowerShell/5.1.19041.6456', '2026-08-08 11:21:19', NULL, 'success'),
(200, 17, '::1', 'Mozilla/5.0 (Windows NT; Windows NT 10.0; en-US) WindowsPowerShell/5.1.19041.6456', '2026-08-08 11:24:35', NULL, 'success'),
(201, 4, '::1', 'Mozilla/5.0 (Windows NT; Windows NT 10.0; en-US) WindowsPowerShell/5.1.19041.6456', '2026-08-08 11:24:51', NULL, 'success'),
(202, 5, '::1', 'Mozilla/5.0 (Windows NT; Windows NT 10.0; en-US) WindowsPowerShell/5.1.19041.6456', '2026-08-08 11:24:51', NULL, 'success'),
(203, 2, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36 Edg/151.0.0.0', '2026-08-08 11:29:17', NULL, 'success'),
(204, 5, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36', '2026-08-08 11:29:36', '2026-08-08 13:13:15', 'success'),
(205, 14, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36', '2026-08-08 11:29:48', NULL, 'success'),
(206, 17, '::1', 'Mozilla/5.0 (Windows NT; Windows NT 10.0; en-US) WindowsPowerShell/5.1.19041.6456', '2026-08-08 11:36:22', NULL, 'success'),
(207, 17, '::1', 'Mozilla/5.0 (Windows NT; Windows NT 10.0; en-US) WindowsPowerShell/5.1.19041.6456', '2026-08-08 11:36:35', NULL, 'success'),
(208, 17, '::1', 'Mozilla/5.0 (Windows NT; Windows NT 10.0; en-US) WindowsPowerShell/5.1.19041.6456', '2026-08-08 11:37:35', NULL, 'success'),
(209, 2, '::1', 'Mozilla/5.0 (Windows NT; Windows NT 10.0; en-US) WindowsPowerShell/5.1.19041.6456', '2026-08-08 11:38:00', NULL, 'success'),
(210, 17, '::1', 'Mozilla/5.0 (Windows NT; Windows NT 10.0; en-US) WindowsPowerShell/5.1.19041.6456', '2026-08-08 11:38:16', NULL, 'success'),
(211, 4, '::1', 'Mozilla/5.0 (Windows NT; Windows NT 10.0; en-US) WindowsPowerShell/5.1.19041.6456', '2026-08-08 12:45:21', NULL, 'success'),
(212, 17, '::1', 'Mozilla/5.0 (Windows NT; Windows NT 10.0; en-US) WindowsPowerShell/5.1.19041.6456', '2026-08-08 12:45:33', NULL, 'success'),
(213, 4, '::1', 'Mozilla/5.0 (Windows NT; Windows NT 10.0; en-US) WindowsPowerShell/5.1.19041.6456', '2026-08-08 12:45:33', NULL, 'success'),
(214, 4, '::1', 'Mozilla/5.0 (Windows NT; Windows NT 10.0; en-US) WindowsPowerShell/5.1.19041.6456', '2026-08-08 12:45:41', NULL, 'success'),
(215, 4, '::1', 'Mozilla/5.0 (Windows NT; Windows NT 10.0; en-US) WindowsPowerShell/5.1.19041.6456', '2026-08-08 12:45:48', NULL, 'success'),
(216, 17, '::1', 'Mozilla/5.0 (Windows NT; Windows NT 10.0; en-US) WindowsPowerShell/5.1.19041.6456', '2026-08-08 12:45:48', NULL, 'success'),
(217, 17, '::1', 'Mozilla/5.0 (Windows NT; Windows NT 10.0; en-US) WindowsPowerShell/5.1.19041.6456', '2026-08-08 12:46:26', NULL, 'success'),
(218, 14, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36', '2026-08-08 12:48:07', NULL, 'success'),
(219, 2, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36 Edg/151.0.0.0', '2026-08-08 12:48:36', '2026-08-08 13:13:03', 'success'),
(220, 17, '::1', 'Mozilla/5.0 (Windows NT; Windows NT 10.0; en-US) WindowsPowerShell/5.1.19041.6456', '2026-08-08 12:52:41', NULL, 'success'),
(221, 17, '::1', 'Mozilla/5.0 (Windows NT; Windows NT 10.0; en-US) WindowsPowerShell/5.1.19041.6456', '2026-08-08 12:53:13', NULL, 'success'),
(222, 14, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36', '2026-08-08 13:26:09', NULL, 'success'),
(223, 2, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36 Edg/151.0.0.0', '2026-08-08 13:31:21', NULL, 'success'),
(224, 2, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36 Edg/151.0.0.0', '2026-08-08 13:42:20', '2026-08-08 13:50:46', 'success'),
(225, 14, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36', '2026-08-08 13:43:55', '2026-08-08 13:50:30', 'success'),
(226, 4, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36', '2026-08-08 13:44:33', '2026-08-08 13:50:36', 'success'),
(227, 2, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36 Edg/151.0.0.0', '2026-08-10 05:00:49', '2026-08-10 05:03:54', 'success'),
(228, 1, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36 Edg/151.0.0.0', '2026-08-10 05:04:02', NULL, 'success'),
(229, 14, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36', '2026-08-10 05:25:56', NULL, 'success'),
(230, 2, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36 Edg/151.0.0.0', '2026-08-10 05:26:02', NULL, 'success'),
(231, 1, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36', '2026-08-10 05:26:14', '2026-08-10 05:30:32', 'success'),
(232, 4, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36', '2026-08-10 05:30:41', '2026-08-10 05:30:54', 'success'),
(233, 4, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36', '2026-08-10 05:31:53', '2026-08-10 05:32:50', 'success'),
(234, 4, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36', '2026-08-10 05:32:56', NULL, 'success'),
(235, 2, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36 Edg/151.0.0.0', '2026-08-10 08:07:15', NULL, 'success'),
(236, 4, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36', '2026-08-10 08:07:56', '2026-08-10 08:16:31', 'success'),
(237, 5, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36', '2026-08-10 08:08:57', NULL, 'success'),
(238, 1, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36', '2026-08-10 08:09:47', NULL, 'success'),
(239, 14, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36', '2026-08-10 08:10:15', NULL, 'success'),
(240, 4, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36', '2026-08-10 08:16:43', NULL, 'success'),
(241, 14, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36', '2026-08-10 08:29:18', NULL, 'success'),
(242, 4, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36', '2026-08-10 08:30:03', NULL, 'success'),
(243, 5, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36', '2026-08-10 08:30:18', NULL, 'success'),
(244, 1, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36 Edg/151.0.0.0', '2026-08-10 08:30:49', NULL, 'success'),
(245, 2, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36 Edg/151.0.0.0', '2026-08-10 08:31:03', NULL, 'success'),
(246, 14, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36', '2026-08-10 09:10:47', NULL, 'success'),
(247, 2, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36 Edg/151.0.0.0', '2026-08-10 09:12:04', NULL, 'failed'),
(248, 2, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36 Edg/151.0.0.0', '2026-08-10 09:12:12', NULL, 'failed'),
(249, 2, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36 Edg/151.0.0.0', '2026-08-10 09:12:18', NULL, 'success'),
(250, 1, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36 Edg/151.0.0.0', '2026-08-10 09:13:13', NULL, 'success'),
(251, 4, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36', '2026-08-10 09:19:50', NULL, 'success'),
(252, 5, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36', '2026-08-10 09:20:15', NULL, 'success'),
(253, 14, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36', '2026-08-12 07:33:31', NULL, 'success'),
(254, 4, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36', '2026-08-12 07:34:33', NULL, 'success'),
(255, 1, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36 Edg/151.0.0.0', '2026-08-12 07:44:13', NULL, 'success'),
(256, 4, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36', '2026-08-12 07:50:03', '2026-08-12 07:51:26', 'success'),
(257, 14, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36', '2026-08-12 07:50:22', NULL, 'success'),
(258, 4, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36', '2026-08-12 07:51:33', '2026-08-12 07:52:15', 'success'),
(259, 4, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36', '2026-08-12 07:52:22', '2026-08-12 08:25:11', 'success'),
(260, 2, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36 Edg/151.0.0.0', '2026-08-12 07:55:08', NULL, 'success'),
(261, 5, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36', '2026-08-12 08:00:20', '2026-08-12 08:25:33', 'success'),
(262, 4, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36', '2026-08-12 08:25:25', '2026-08-12 08:29:12', 'success'),
(263, 5, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36', '2026-08-12 08:25:42', '2026-08-12 08:29:14', 'success'),
(264, 4, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36', '2026-08-12 08:29:44', '2026-08-12 08:31:56', 'success'),
(265, 5, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36', '2026-08-12 08:29:53', '2026-08-12 08:31:59', 'success'),
(266, 5, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36', '2026-08-12 08:32:07', '2026-08-12 08:39:08', 'success'),
(267, 4, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36', '2026-08-12 08:32:21', '2026-08-12 08:38:54', 'success'),
(268, 4, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36', '2026-08-12 08:39:01', '2026-08-12 08:47:00', 'success'),
(269, 4, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36', '2026-08-12 08:47:11', NULL, 'success'),
(270, 5, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36', '2026-08-12 08:47:33', NULL, 'success'),
(271, 17, '127.0.0.1', 'Mozilla/5.0 (Windows NT; Windows NT 10.0; en-US) WindowsPowerShell/5.1.19041.6456', '2026-08-12 09:18:41', NULL, 'success'),
(272, 17, '127.0.0.1', 'Mozilla/5.0 (Windows NT; Windows NT 10.0; en-US) WindowsPowerShell/5.1.19041.6456', '2026-08-12 09:19:43', NULL, 'success'),
(273, 17, '127.0.0.1', 'Mozilla/5.0 (Windows NT; Windows NT 10.0; en-US) WindowsPowerShell/5.1.19041.6456', '2026-08-12 09:19:58', NULL, 'success'),
(274, 14, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36', '2026-08-12 09:23:22', NULL, 'success');

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
(108, 12, 'Task Assigned', 'New task: fghgfh', 'task', 0, '2026-08-06 16:39:21'),
(109, 12, 'Conference Scheduled', 'You have been assigned to a teleconference meeting', 'conference', 0, '2026-08-07 18:18:42'),
(110, 13, 'Conference Scheduled', 'You have been assigned to a teleconference meeting', 'conference', 0, '2026-08-07 18:18:42'),
(111, 5, 'Conference Scheduled', 'You have been assigned to a teleconference meeting', 'conference', 0, '2026-08-07 18:18:42'),
(112, 16, 'Conference Scheduled', 'You have been assigned to a teleconference meeting', 'conference', 0, '2026-08-07 19:10:39'),
(113, 13, 'Conference Scheduled', 'You have been assigned to a teleconference meeting', 'conference', 0, '2026-08-07 19:10:39'),
(114, 14, 'Account Deactivated', 'Your account was set to inactive by an administrator. You have been signed out.', 'security', 1, '2026-08-07 19:39:18'),
(115, 5, 'Meeting Accepted', 'GP has accepted conference CON-0009. You can now join.', 'conference', 0, '2026-08-07 19:46:09'),
(116, 13, 'Meeting Accepted', 'GP has accepted conference CON-0009. You can now join.', 'conference', 0, '2026-08-07 19:46:09'),
(118, 5, 'Task Assigned', 'New task: 2025 Medical reports', 'task', 0, '2026-08-08 10:19:35'),
(119, 14, 'Task Status Updated', 'Task \"2025 Medical reports\" is now in progress', 'task', 1, '2026-08-08 10:21:34'),
(120, 5, 'Task Assigned', 'New task: fgfgfg', 'task', 0, '2026-08-08 10:22:41'),
(121, 5, 'Task Assigned', 'New task: tytytytg', 'task', 0, '2026-08-08 10:29:08'),
(122, 4, 'Conference Scheduled', 'You have been assigned to a teleconference meeting', 'conference', 0, '2026-08-10 05:31:42'),
(123, 5, 'Conference Scheduled', 'You have been assigned to a teleconference meeting', 'conference', 0, '2026-08-10 05:31:42'),
(124, 4, 'Conference Scheduled', 'You have been assigned to a teleconference meeting', 'conference', 0, '2026-08-10 05:32:29'),
(125, 5, 'Conference Scheduled', 'You have been assigned to a teleconference meeting', 'conference', 0, '2026-08-10 05:32:29'),
(126, 1, 'Audit Log Export', 'Audit log CSV export completed (366 records).', 'export', 0, '2026-08-12 07:44:46'),
(127, 4, 'Conference Scheduled', 'You have been assigned to a teleconference meeting', 'conference', 0, '2026-08-12 07:51:20'),
(128, 5, 'Conference Scheduled', 'You have been assigned to a teleconference meeting', 'conference', 0, '2026-08-12 07:51:20'),
(129, 4, 'Conference Scheduled', 'You have been assigned to a teleconference meeting', 'conference', 0, '2026-08-12 08:30:44'),
(130, 5, 'Conference Scheduled', 'You have been assigned to a teleconference meeting', 'conference', 0, '2026-08-12 08:30:44');

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
(5, 'ahp', 'Allied Health Professional', '2026-07-30 11:37:34'),
(6, 'conference_guest', 'Temporary guest access for external conference participants', '2026-08-08 12:43:43');

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
(4, 'theme', 'light', 2, '2026-08-06 03:25:56'),
(46, 'receptionist_can_edit', 'true', 2, '2026-08-08 10:40:22'),
(47, 'receptionist_can_delete', 'true', 2, '2026-08-08 13:31:53'),
(52, 'receptionist_dark_mode_allowed', 'true', 2, '2026-08-10 08:12:28'),
(53, 'gp_dark_mode_allowed', 'true', 2, '2026-08-10 08:12:28'),
(56, 'ahp_dark_mode_allowed', 'true', 2, '2026-08-10 08:12:29'),
(60, 'dark_mode_allowed', 'false', 2, '2026-08-10 08:12:41'),
(63, 'gp_can_download_documents', 'false', 2, '2026-08-12 09:06:36');

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
(7, 'fghgfh', 'fghg', 12, 14, '2026-08-10', 'medium', 'pending', NULL, '2026-08-06 16:39:21', '2026-08-06 19:00:20'),
(8, '2025 Medical reports', 'Fully Insurance Report only', 5, 14, '2026-08-10', 'medium', 'in_progress', NULL, '2026-08-08 10:19:35', '2026-08-08 10:21:34'),
(9, 'fgfgfg', 'gfgfdg', 5, 14, '2026-08-31', 'low', 'pending', NULL, '2026-08-08 10:22:41', '2026-08-08 10:22:41'),
(10, 'tytytytg', 'ghfghfgh', 5, 14, '2026-08-12', 'medium', 'pending', NULL, '2026-08-08 10:29:08', '2026-08-08 10:29:08');

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
(1, 1, 'superadmin@amc.com', 'superadmin', '$2b$12$xAX6ohPZHeG6Q77Rt/nli.LpE7szfqdlrovSia/7rIUMY1w4WLXrm', 'active', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiZW1haWwiOiJzdXBlcmFkbWluQGFtYy5jb20iLCJyb2xlIjoic3VwZXJfYWRtaW4iLCJpYXQiOjE3ODY1MjA2NTMsImV4cCI6MTc4NzEyNTQ1M30.toDoM4GiMQBypgVxWJoT2mDXEl0h-DB3xjD-fSlMGeI', '2026-08-12 07:44:13', '2026-07-30 11:37:35', '2026-08-12 07:44:13'),
(2, 2, 'admin@amc.com', 'admin_demo', '$2b$12$UiDSbc.h4g0No7xkj4V8vO8HK8I7C5npT2jX6Kb/eWf4jdeOu5d16', 'active', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MiwiZW1haWwiOiJhZG1pbkBhbWMuY29tIiwicm9sZSI6ImFkbWluIiwiaWF0IjoxNzg2NTIxMzA4LCJleHAiOjE3ODcxMjYxMDh9.yd-9VNvDbIEamS1grryQ8OvWIffOLynTwsDqtNk2tO4', '2026-08-12 07:55:08', '2026-08-02 16:42:57', '2026-08-12 07:55:08'),
(4, 4, 'gp@amc.com', 'gp_demo', '$2b$12$UiDSbc.h4g0No7xkj4V8vO8HK8I7C5npT2jX6Kb/eWf4jdeOu5d16', 'active', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6NCwiZW1haWwiOiJncEBhbWMuY29tIiwicm9sZSI6ImdwIiwiaWF0IjoxNzg2NTI0NDMxLCJleHAiOjE3ODcxMjkyMzF9.V-dLwq0DKEblOh0BqHqS_wRZtd_RnlVfOVBeEUQqMiM', '2026-08-12 08:47:11', '2026-08-02 16:42:57', '2026-08-12 08:47:11'),
(5, 5, 'ahp@amc.com', 'ahp_demo', '$2b$12$UiDSbc.h4g0No7xkj4V8vO8HK8I7C5npT2jX6Kb/eWf4jdeOu5d16', 'active', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6NSwiZW1haWwiOiJhaHBAYW1jLmNvbSIsInJvbGUiOiJhaHAiLCJpYXQiOjE3ODY1MjQ0NTMsImV4cCI6MTc4NzEyOTI1M30.XHpFCo81f0LKSkAuG7Xy7Qtm0mbYvjPi9j_Jqbma-8w', '2026-08-12 08:47:33', '2026-08-02 16:42:57', '2026-08-12 08:47:33'),
(6, 2, 'testadmin_1165453774@amc.com', 'testadmin_1165453774', '$2b$12$hQT1ixRc21zytBzpWYRtJOr16DoP0wTJiVuBskfYLFkxnJfks.v/u', 'active', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6NiwiZW1haWwiOiJ0ZXN0YWRtaW5fMTE2NTQ1Mzc3NEBhbWMuY29tIiwicm9sZSI6ImFkbWluIiwiaWF0IjoxNzg1Njg5MDQ1LCJleHAiOjE3ODYyOTM4NDV9.Op-JOJhmiUhGvu5MJ7DV81fzWhQYK5pkQZY70Y2xrcU', '2026-08-02 16:44:05', '2026-08-02 16:44:05', '2026-08-02 16:44:05'),
(8, 2, 'testadmin@amc.com', 'testadmin', '$2b$12$ay8TXg1rsTGmvbyR.uArseQCRqtc2CrOEw94jMUj1qzePDkAsbhqO', 'active', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6OCwiZW1haWwiOiJ0ZXN0YWRtaW5AYW1jLmNvbSIsInJvbGUiOiJhZG1pbiIsImlhdCI6MTc4NTczMzYwMiwiZXhwIjoxNzg2MzM4NDAyfQ.yxWe6m_v5-ZzIWwFN7uQ5FPh1pSklAYuZHoWQK3sQVg', '2026-08-03 05:06:42', '2026-08-02 16:51:49', '2026-08-03 05:06:42'),
(10, 2, 'runtest.admin.1785767652870@amc.com', 'runtest_admin_1785767652870', '$2b$12$w2MlHrxxn4fQz/K5iqixDuyjHlgwSWF5HGat/9V9pqXFN1I0RNUIK', 'active', NULL, NULL, '2026-08-03 14:34:14', '2026-08-03 14:34:14'),
(12, 4, 'gp1@amc.com', 'gp1', '$2b$12$fXT9wOA6maIPwSyakurOleZ.veNt.Ncze.vzsQ9rZdQ9GGu9GbX.a', 'active', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MTIsImVtYWlsIjoiZ3AxQGFtYy5jb20iLCJyb2xlIjoiZ3AiLCJpYXQiOjE3ODYxMzE2NTUsImV4cCI6MTc4NjczNjQ1NX0.DGvIVAxXYevSzFmkZBcrj9FqFVicKVa1ksWyYFiaq9U', '2026-08-07 19:40:55', '2026-08-05 17:37:58', '2026-08-07 19:40:55'),
(13, 5, 'receptionistk@amc.com', 'receptionistk', '$2b$12$WUvfZbYSMWkvDk1Kp5BCWuj.HIevCP7P4MRW2coBxIH2cxSlwhq6C', 'active', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MTMsImVtYWlsIjoicmVjZXB0aW9uaXN0a0BhbWMuY29tIiwicm9sZSI6ImFocCIsImlhdCI6MTc4NTk1MjY5NSwiZXhwIjoxNzg2NTU3NDk1fQ.IZnRyAWlPUOn-8PvfC-1x_w6-bFOvynaFBbmPILHV8Q', '2026-08-05 17:58:15', '2026-08-05 17:40:38', '2026-08-05 17:58:15'),
(14, 3, 'Sangeetha@info.com', 'Sangeetha', '$2b$12$HCo3g/QTwxECstMMf2L6f.0gKHiNUNza9m8ZZobFL7S6WifKWuS/W', 'active', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MTQsImVtYWlsIjoiU2FuZ2VldGhhQGluZm8uY29tIiwicm9sZSI6InJlY2VwdGlvbmlzdCIsImlhdCI6MTc4NjUyNjYwMiwiZXhwIjoxNzg3MTMxNDAyfQ.8TDysEaJL_v101sECb0QCRg6y2Mt9_MKCJeaTtZhiWY', '2026-08-12 09:23:22', '2026-08-05 18:04:15', '2026-08-12 09:23:22'),
(15, 3, 'Suthan@123.com', 'Sutha', '$2b$12$B4vPzkOEqtNlkmapoEdevust7zy5eWP1ZPhX0I7WSyjy6UwBsRj6C', 'active', NULL, '2026-08-06 07:51:28', '2026-08-05 18:07:00', '2026-08-06 16:17:26'),
(16, 4, 'nilu@info.com', 'nilu', '$2b$12$uUf78vssmwtHKaBJ.40K9.c9sPmLo0fJf6EKGzG/57dj1cOBArT8O', 'active', NULL, NULL, '2026-08-06 07:23:23', '2026-08-06 07:23:23'),
(17, 3, 'receptionist@amc.com', 'receptionist_demo', '$2b$12$Kmbyp9K9bB1rqsiUJqhwp.Pu842cqtngYv2trvvkE4x8uEz/uz6Rm', 'active', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MTcsImVtYWlsIjoicmVjZXB0aW9uaXN0QGFtYy5jb20iLCJyb2xlIjoicmVjZXB0aW9uaXN0IiwiaWF0IjoxNzg2NTI2Mzk4LCJleHAiOjE3ODcxMzExOTh9.udBiupgbWG0ShA0eToXUwNUz-1-hLUxOz5EyRekTihw', '2026-08-12 09:19:58', '2026-08-06 09:38:56', '2026-08-12 09:19:58'),
(18, 6, 'external.gp@test.com', 'guest_1ec5666fae3d', '$2b$12$nQ7Mg8pY83jqbhFaZbrmS.uFUT3DAXUGBcY68V/055uy9tbZ6VX6e', 'active', NULL, NULL, '2026-08-08 12:45:49', '2026-08-08 12:45:49'),
(19, 6, '123@info.com', 'guest_d083f8636cbe', '$2b$12$LUfaLv/Rf0P/VkgcSSBas.sATggCqGj9Cvzj3G.P.8DWu7BN.AFZe', 'active', NULL, NULL, '2026-08-08 13:09:01', '2026-08-08 13:09:01'),
(20, 6, 'rajesh2026@gmail.com', 'guest_02823df252e2', '$2b$12$Icd4ZMG3TBb1EKdNLIWey.Z8ulkUT5pcFph1qbmq9ZLulu6ZYSDMu', 'active', NULL, NULL, '2026-08-08 13:15:13', '2026-08-08 13:15:13'),
(21, 6, 'dsgsg@fa.vom', 'guest_8bcf0d8c9a3f', '$2b$12$5tpYby1uVAyj0BxeNLQafOl2tZSK2VLBJ9sOG3iBE.D8B.M3yGqsa', 'active', NULL, NULL, '2026-08-08 13:16:22', '2026-08-08 13:16:22'),
(22, 6, 'dsfdsf@gfdg.com', 'guest_994894', '$2b$12$JVHtz17wD6OF1cStR2ZR/e63FQ/GaAN/OAJOVsxaBT/ej5m3cjvMK', 'active', NULL, NULL, '2026-08-08 13:46:24', '2026-08-08 13:46:24');

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
(12, 12, 'Gayathiri', '', '7762534686', NULL, NULL, NULL, NULL, NULL, NULL, '2026-08-05 17:37:58', '2026-08-07 19:36:13'),
(13, 13, 'Dr', 'Sonu Thaker', '7762534686', NULL, NULL, NULL, NULL, NULL, NULL, '2026-08-05 17:40:38', '2026-08-05 17:40:38'),
(14, 14, 'Sangeetha', 'GK', '+94771111002', NULL, NULL, NULL, NULL, NULL, NULL, '2026-08-05 18:04:15', '2026-08-05 18:04:55'),
(15, 15, 'Suthan', '', '0758594626', NULL, NULL, NULL, '/uploads/1785995762194-99157761.png', NULL, NULL, '2026-08-05 18:07:00', '2026-08-10 05:26:52'),
(16, 16, 'nilujan', '', '768594613123', NULL, NULL, NULL, NULL, NULL, NULL, '2026-08-06 07:23:23', '2026-08-06 07:23:23'),
(17, 17, 'Front', 'Desk', '+94771111002', NULL, NULL, NULL, NULL, NULL, NULL, '2026-08-06 09:38:56', '2026-08-06 09:38:56'),
(18, 18, 'Dr', 'External', NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-08-08 12:45:49', '2026-08-08 12:45:49'),
(19, 19, 'Nilu', 'Guest', NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-08-08 13:09:01', '2026-08-08 13:09:01'),
(20, 20, 'rajesh', 'Guest', NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-08-08 13:15:13', '2026-08-08 13:15:13'),
(21, 21, 'fgfdg', 'Guest', NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-08-08 13:16:22', '2026-08-08 13:16:22'),
(22, 22, 'dfdsf', 'Guest', NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-08-08 13:46:24', '2026-08-08 13:46:24');

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
-- Indexes for table `appointment_id_sequence`
--
ALTER TABLE `appointment_id_sequence`
  ADD PRIMARY KEY (`id`);

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
-- Indexes for table `conference_clinical_reports`
--
ALTER TABLE `conference_clinical_reports`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_conf_report_user` (`conference_id`,`user_id`),
  ADD KEY `user_id` (`user_id`);

--
-- Indexes for table `conference_generated_documents`
--
ALTER TABLE `conference_generated_documents`
  ADD PRIMARY KEY (`id`),
  ADD KEY `conference_id` (`conference_id`),
  ADD KEY `participant_user_id` (`participant_user_id`);

--
-- Indexes for table `conference_guest_access`
--
ALTER TABLE `conference_guest_access`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `access_code` (`access_code`),
  ADD KEY `conference_id` (`conference_id`),
  ADD KEY `user_id` (`user_id`),
  ADD KEY `created_by` (`created_by`);

--
-- Indexes for table `conference_id_sequence`
--
ALTER TABLE `conference_id_sequence`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `conference_participants`
--
ALTER TABLE `conference_participants`
  ADD PRIMARY KEY (`id`),
  ADD KEY `conference_id` (`conference_id`),
  ADD KEY `user_id` (`user_id`);

--
-- Indexes for table `conference_participant_sessions`
--
ALTER TABLE `conference_participant_sessions`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`),
  ADD KEY `idx_cps_conf_user` (`conference_id`,`user_id`),
  ADD KEY `idx_cps_open` (`conference_id`,`left_at`);

--
-- Indexes for table `conference_report_edit_requests`
--
ALTER TABLE `conference_report_edit_requests`
  ADD PRIMARY KEY (`id`),
  ADD KEY `conference_id` (`conference_id`),
  ADD KEY `user_id` (`user_id`),
  ADD KEY `reviewed_by` (`reviewed_by`);

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
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=18;

--
-- AUTO_INCREMENT for table `appointment_ahps`
--
ALTER TABLE `appointment_ahps`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=43;

--
-- AUTO_INCREMENT for table `appointment_files`
--
ALTER TABLE `appointment_files`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `audit_logs`
--
ALTER TABLE `audit_logs`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=402;

--
-- AUTO_INCREMENT for table `conferences`
--
ALTER TABLE `conferences`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=19;

--
-- AUTO_INCREMENT for table `conference_clinical_reports`
--
ALTER TABLE `conference_clinical_reports`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=18;

--
-- AUTO_INCREMENT for table `conference_generated_documents`
--
ALTER TABLE `conference_generated_documents`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT for table `conference_guest_access`
--
ALTER TABLE `conference_guest_access`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `conference_participants`
--
ALTER TABLE `conference_participants`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=99;

--
-- AUTO_INCREMENT for table `conference_participant_sessions`
--
ALTER TABLE `conference_participant_sessions`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `conference_report_edit_requests`
--
ALTER TABLE `conference_report_edit_requests`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `gps`
--
ALTER TABLE `gps`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `login_history`
--
ALTER TABLE `login_history`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=275;

--
-- AUTO_INCREMENT for table `notifications`
--
ALTER TABLE `notifications`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=131;

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
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT for table `settings`
--
ALTER TABLE `settings`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=65;

--
-- AUTO_INCREMENT for table `tasks`
--
ALTER TABLE `tasks`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=23;

--
-- AUTO_INCREMENT for table `user_profiles`
--
ALTER TABLE `user_profiles`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=23;

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
-- Constraints for table `conference_clinical_reports`
--
ALTER TABLE `conference_clinical_reports`
  ADD CONSTRAINT `conference_clinical_reports_ibfk_1` FOREIGN KEY (`conference_id`) REFERENCES `conferences` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `conference_clinical_reports_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `conference_generated_documents`
--
ALTER TABLE `conference_generated_documents`
  ADD CONSTRAINT `conference_generated_documents_ibfk_1` FOREIGN KEY (`conference_id`) REFERENCES `conferences` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `conference_generated_documents_ibfk_2` FOREIGN KEY (`participant_user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `conference_guest_access`
--
ALTER TABLE `conference_guest_access`
  ADD CONSTRAINT `conference_guest_access_ibfk_1` FOREIGN KEY (`conference_id`) REFERENCES `conferences` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `conference_guest_access_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `conference_guest_access_ibfk_3` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `conference_participants`
--
ALTER TABLE `conference_participants`
  ADD CONSTRAINT `conference_participants_ibfk_1` FOREIGN KEY (`conference_id`) REFERENCES `conferences` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `conference_participants_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `conference_participant_sessions`
--
ALTER TABLE `conference_participant_sessions`
  ADD CONSTRAINT `conference_participant_sessions_ibfk_1` FOREIGN KEY (`conference_id`) REFERENCES `conferences` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `conference_participant_sessions_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `conference_report_edit_requests`
--
ALTER TABLE `conference_report_edit_requests`
  ADD CONSTRAINT `conference_report_edit_requests_ibfk_1` FOREIGN KEY (`conference_id`) REFERENCES `conferences` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `conference_report_edit_requests_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `conference_report_edit_requests_ibfk_3` FOREIGN KEY (`reviewed_by`) REFERENCES `users` (`id`) ON DELETE SET NULL;

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
