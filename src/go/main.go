package main

// version: 1.0.1

import (
	"crypto/md5"
	"database/sql"
	"fmt"
	"io/ioutil"
	"net/http"
	"os"
	"os/exec"
	"text/template"
)

// Hardcoded secret
const apiSecret = "sk-hardcoded-secret-key-12345"

// --- Security Issues (Semgrep + gosec) ---

// SQL injection
func getUser(db *sql.DB, id string) (*sql.Row, error) {
	query := "SELECT * FROM users WHERE id = '" + id + "'"
	return db.QueryRow(query), nil
}

// Command injection
func runCommand(input string) (string, error) {
	cmd := exec.Command("sh", "-c", "echo "+input)
	out, err := cmd.Output()
	return string(out), err
}

// Weak cryptography
func hashData(data string) string {
	hash := md5.Sum([]byte(data))
	return fmt.Sprintf("%x", hash)
}

// XSS via template without escaping
func renderPage(w http.ResponseWriter, r *http.Request) {
	userInput := r.URL.Query().Get("name")
	tmpl := template.Must(template.New("page").Parse(
		"<html><body>Hello " + userInput + "</body></html>",
	))
	tmpl.Execute(w, nil)
}

// --- Code Quality Issues (golangci-lint) ---

// Deprecated function usage
func readFile(path string) ([]byte, error) {
	return ioutil.ReadAll(nil) // ioutil is deprecated since Go 1.16
}

// Error not checked
func writeFile(path string, data []byte) {
	f, _ := os.Create(path)    // error ignored
	f.Write(data)              // error ignored
	f.Close()                  // error ignored
}

// Unused parameter
func processData(input string, unused int) string {
	return input
}

// Naked return with named results (confusing)
func divide(a, b float64) (result float64, err error) {
	if b == 0 {
		err = fmt.Errorf("division by zero")
		return
	}
	result = a / b
	return
}

// Global mutable state
var counter int

func increment() {
	counter++ // Race condition if called from goroutines
}

// Deeply nested logic
func validateRequest(r *http.Request) error {
	if r.Method == "POST" {
		if r.Header.Get("Content-Type") == "application/json" {
			if r.ContentLength > 0 {
				if r.ContentLength < 1024*1024 {
					if r.Header.Get("Authorization") != "" {
						return nil
					}
					return fmt.Errorf("missing auth")
				}
				return fmt.Errorf("too large")
			}
			return fmt.Errorf("empty body")
		}
		return fmt.Errorf("wrong content type")
	}
	return fmt.Errorf("wrong method")
}

func main() {
	http.HandleFunc("/", renderPage)
	http.ListenAndServe(":8080", nil)
}
