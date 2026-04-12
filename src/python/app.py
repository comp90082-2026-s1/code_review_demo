"""Sample Python web app with intentional issues for static analysis testing."""

import pickle
import os
import subprocess
import sqlite3
import hashlib
import random


# --- Security Issues (Semgrep + Bandit) ---

def get_user(user_id):
    """SQL injection vulnerability."""
    conn = sqlite3.connect("users.db")
    cursor = conn.cursor()
    query = "SELECT * FROM users WHERE id = '" + user_id + "'"  # SQL injection
    cursor.execute(query)
    return cursor.fetchone()


def load_session(data):
    """Insecure deserialization."""
    return pickle.loads(data)  # Bandit B301: pickle.loads is insecure


def run_command(user_input):
    """Command injection vulnerability."""
    result = subprocess.call("echo " + user_input, shell=True)  # Shell injection
    return result


def hash_password(password):
    """Weak hashing algorithm."""
    return hashlib.md5(password.encode()).hexdigest()  # MD5 is insecure


def generate_token():
    """Insecure random for security-sensitive operation."""
    return random.randint(100000, 999999)  # Should use secrets module


# --- Code Quality Issues (Ruff) ---

def process_data(data, flag, extra, more, also, another, yet_another, and_more, plus_this):
    """Too many parameters and high complexity."""
    result = []
    if flag:
        if extra:
            if more:
                if also:
                    if another:
                        result.append("deep nesting")  # Excessive nesting
    x = 1
    y = 2
    z = x + y
    unused_var = "this is never used"  # Unused variable
    for i in range(len(data)):  # Should use enumerate
        item = data[i]
        if item == None:  # Should use 'is None'
            continue
        if type(item) == str:  # Should use isinstance()
            result.append(item)
    return result


def duplicate_logic_a(items):
    """Duplicated code block A."""
    filtered = []
    for item in items:
        if item is not None:
            stripped = item.strip()
            if len(stripped) > 0:
                filtered.append(stripped.lower())
    return filtered


def duplicate_logic_b(items):
    """Duplicated code block B — same as above."""
    filtered = []
    for item in items:
        if item is not None:
            stripped = item.strip()
            if len(stripped) > 0:
                filtered.append(stripped.lower())
    return filtered


class   BadlyFormattedClass:
    """Class with formatting issues."""

    def __init__( self,name,age ):
        self.name=name
        self.age =age

    def greet(self):
        print( "Hello, " + self.name + "! You are " + str(self.age) + " years old." )
        return

    def unused_method(self):
        pass


# --- Entry Point ---

if __name__ == "__main__":
    user = get_user(input("Enter user ID: "))
    print(user)
