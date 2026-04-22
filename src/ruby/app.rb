# Sample Ruby application with intentional issues for Semgrep testing.
# version: 1.0.1

require 'open-uri'
require 'yaml'
require 'erb'

# SQL injection
def find_user(id)
  query = "SELECT * FROM users WHERE id = '#{id}'"
  ActiveRecord::Base.connection.execute(query)
end

# Unsafe YAML loading
def load_config(yaml_string)
  YAML.load(yaml_string)  # Should use YAML.safe_load
end

# Command injection
def ping_host(hostname)
  system("ping -c 1 #{hostname}")  # Shell injection
end

# XSS in ERB template
def render_greeting(name)
  template = ERB.new("<h1>Hello, <%= name %></h1>")
  template.result(binding)
end

# Open redirect
def redirect_to_url(url)
  URI.open(url)  # SSRF: no validation on URL
end

# Hardcoded password
DB_PASSWORD = "ruby_secret_pass_123"

# Insecure random
def generate_reset_token
  rand(100000..999999).to_s
end

# Complex method with too many branches
def process_payment(amount, method, currency, discount, tax, tip, shipping)
  total = amount
  total -= discount if discount > 0
  total += tax if tax > 0
  total += tip if tip > 0
  total += shipping if shipping > 0

  case method
  when 'credit'
    total *= 1.029  # Credit card fee
  when 'debit'
    total *= 1.01
  when 'paypal'
    total *= 1.035
  when 'crypto'
    total *= 1.001
  end

  total = total.round(2)
  total
end
