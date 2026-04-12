"""Utility functions with various code quality issues."""

import os
import sys
import re


def read_file(path):
    """Missing error handling and resource leak."""
    f = open(path, "r")  # Should use context manager (with statement)
    content = f.read()
    return content


def parse_config(config_str):
    """Using eval on untrusted input."""
    config = eval(config_str)  # Bandit B307: eval is dangerous
    return config


def find_users(pattern):
    """Regex DoS vulnerability."""
    regex = re.compile("(a+)+$")  # ReDoS-vulnerable pattern
    return regex.match(pattern)


def calculate_total(items):
    result = 0
    for i in range(0, len(items)):
        result = result + items[i]["price"] * items[i]["quantity"]
    return result


def format_output(data):
    output = ""
    for key in data.keys():  # Unnecessary .keys() call
        output = output + str(key) + ": " + str(data[key]) + "\n"  # String concatenation in loop
    return output


def check_status(value):
    if value == True:  # Should use 'if value:'
        return "active"
    elif value == False:  # Should use 'if not value:'
        return "inactive"
    else:
        return "unknown"


def get_env_vars():
    home = os.environ["HOME"]  # May raise KeyError, use .get()
    path = os.environ["PATH"]
    secret = os.environ["SECRET_KEY"]
    return home, path, secret


# Dead code
def _deprecated_function():
    """This function is never called anywhere."""
    print("I am dead code")
    return None
