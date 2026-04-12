/**
 * Utility functions with code quality issues.
 */

// Regex DoS
function validateEmail(email) {
  const regex = /^([a-zA-Z0-9_\.\-])+\@(([a-zA-Z0-9\-])+\.)+([a-zA-Z0-9]{2,4})+$/;
  return regex.test(email);
}

// No input validation
function divide(a, b) {
  return a / b;
}

// Memory leak: growing array never cleaned
const eventLog = [];
function logEvent(event) {
  eventLog.push({ ...event, timestamp: Date.now() });
}

// Synchronous file operation in potentially async context
function readConfig() {
  const fs = require("fs");
  return JSON.parse(fs.readFileSync("./config.json"));
}

// Deeply nested ternary
function getStatus(code) {
  return code === 200
    ? "ok"
    : code === 404
    ? "not found"
    : code === 500
    ? "error"
    : code === 403
    ? "forbidden"
    : "unknown";
}

// Mutating function parameters
function addDefaults(options) {
  options.timeout = options.timeout || 5000;
  options.retries = options.retries || 3;
  return options;
}

module.exports = { validateEmail, divide, logEvent, readConfig, getStatus, addDefaults };

