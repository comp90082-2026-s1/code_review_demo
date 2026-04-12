/**
 * Sample Express server with intentional issues for ESLint + Semgrep testing.
 */

const express = require("express");
const fs = require("fs");
const app = express();

// --- Security Issues (Semgrep + ESLint) ---

// XSS vulnerability: directly injecting user input into HTML
app.get("/search", (req, res) => {
  const query = req.query.q;
  res.send("<h1>Results for: " + query + "</h1>"); // XSS
});

// eval() usage — code injection
app.post("/calculate", (req, res) => {
  const expression = req.body.expr;
  const result = eval(expression); // Dangerous eval
  res.json({ result: result });
});

// Path traversal vulnerability
app.get("/file", (req, res) => {
  const filename = req.query.name;
  const content = fs.readFileSync("/data/" + filename, "utf8"); // Path traversal
  res.send(content);
});

// Hardcoded credentials
const DB_PASSWORD = "admin123!@#";
const JWT_SECRET = "my-super-secret-jwt-key-do-not-share";

// SQL-like injection in NoSQL (MongoDB-style)
app.get("/user/:id", async (req, res) => {
  const user = await db.collection("users").findOne({
    _id: req.params.id, // NoSQL injection if id is object
  });
  res.json(user);
});

// --- Code Quality Issues ---

// Unused variables
const unusedConfig = { debug: true, verbose: false };
let tempValue = 42;

// Callback hell
function fetchData(url, callback) {
  fetch(url, function (err, data) {
    if (err) {
      console.log(err);
    } else {
      processData(data, function (err, result) {
        if (err) {
          console.log(err);
        } else {
          saveData(result, function (err, saved) {
            if (err) {
              console.log(err);
            } else {
              callback(null, saved);
            }
          });
        }
      });
    }
  });
}

// var instead of let/const
var globalCounter = 0;

// == instead of ===
function checkValue(val) {
  if (val == null) {
    return "empty";
  }
  if (val == 0) {
    return "zero";
  }
  return "valid";
}

// Missing error handling
async function loadConfig() {
  const data = await fs.promises.readFile("config.json", "utf8");
  return JSON.parse(data);
}

// console.log left in production code
function processRequest(req) {
  console.log("Processing request:", req.body);
  console.log("Headers:", req.headers);
  return { status: "ok" };
}

// Prototype pollution risk
function merge(target, source) {
  for (const key in source) {
    target[key] = source[key]; // No hasOwnProperty check
  }
  return target;
}

app.listen(3000, () => {
  console.log("Server running on port 3000");
});
