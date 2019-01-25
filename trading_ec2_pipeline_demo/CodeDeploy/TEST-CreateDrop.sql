-- Drop and recreate the TEST database with every build
DROP DATABASE IF EXISTS `TEST-airports`;

CREATE DATABASE IF NOT EXISTS `TEST-airports`;
use `TEST-airports`
