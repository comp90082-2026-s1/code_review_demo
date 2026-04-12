package com.example.service;

import java.sql.*;
import java.io.*;
import java.util.*;
import java.security.MessageDigest;
import java.net.HttpURLConnection;
import java.net.URL;

/**
 * User service with intentional issues for PMD, Checkstyle, and Semgrep testing.
 */
public class UserService {

    // Hardcoded credentials
    private static final String DB_URL = "jdbc:mysql://localhost:3306/mydb";
    private static final String DB_USER = "root";
    private static final String DB_PASS = "password123";

    // --- Security Issues (Semgrep) ---

    // SQL Injection
    public User findUser(String userId) throws SQLException {
        Connection conn = DriverManager.getConnection(DB_URL, DB_USER, DB_PASS);
        Statement stmt = conn.createStatement();
        ResultSet rs = stmt.executeQuery("SELECT * FROM users WHERE id = '" + userId + "'");
        if (rs.next()) {
            return new User(rs.getString("name"), rs.getString("email"));
        }
        return null; // Resource leak: conn, stmt, rs not closed
    }

    // Insecure hashing
    public String hashPassword(String password) throws Exception {
        MessageDigest md = MessageDigest.getInstance("MD5"); // Weak hash
        byte[] hash = md.digest(password.getBytes());
        StringBuilder sb = new StringBuilder();
        for (byte b : hash) {
            sb.append(String.format("%02x", b));
        }
        return sb.toString();
    }

    // SSRF vulnerability
    public String fetchUrl(String url) throws Exception {
        HttpURLConnection conn = (HttpURLConnection) new URL(url).openConnection();
        BufferedReader reader = new BufferedReader(new InputStreamReader(conn.getInputStream()));
        StringBuilder result = new StringBuilder();
        String line;
        while ((line = reader.readLine()) != null) {
            result.append(line);
        }
        return result.toString(); // No URL validation, SSRF possible
    }

    // --- Code Quality Issues (PMD + Checkstyle) ---

    // God method with excessive complexity
    public String processOrder(String orderId,String customerId,List<Item> items,
        String shippingMethod,boolean expedited,String couponCode,
        String paymentMethod,Map<String,String> metadata) {

        double total = 0;
        for (int i = 0; i < items.size(); i++) {
            Item item = items.get(i);
            if (item != null) {
                if (item.getPrice() > 0) {
                    if (item.getQuantity() > 0) {
                        total += item.getPrice() * item.getQuantity();
                    }
                }
            }
        }

        // Magic numbers everywhere
        if (total > 100) {
            total = total * 0.9;
        }
        if (expedited) {
            total = total + 15.99;
        }
        if (couponCode != null && couponCode.equals("SAVE20")) {
            total = total * 0.8;
        }
        if (shippingMethod.equals("express")) {
            total = total + 25.50;
        } else if (shippingMethod.equals("standard")) {
            total = total + 5.99;
        }

        return "Order " + orderId + " total: $" + total;
    }

    // Empty catch blocks
    public void saveData(String data) {
        try {
            FileWriter writer = new FileWriter("data.txt");
            writer.write(data);
            writer.close();
        } catch (IOException e) {
            // silently swallowed
        }
    }

    // Unused method parameters
    public int calculate(int a, int b, int unused1, String unused2) {
        return a + b;
    }

    // Missing null checks
    public String getUserEmail(User user) {
        return user.getEmail().toLowerCase().trim();
    }

    // Inner class (for compilation context)
    public static class User {
        private String name;
        private String email;

        public User(String name, String email) {
            this.name = name;
            this.email = email;
        }

        public String getName() { return name; }
        public String getEmail() { return email; }
    }

    public static class Item {
        private double price;
        private int quantity;

        public double getPrice() { return price; }
        public int getQuantity() { return quantity; }
    }
}
