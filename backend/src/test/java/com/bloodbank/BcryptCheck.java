package com.bloodbank;

import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

public class BcryptCheck {
    public static void main(String[] args) {
        BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();
        String dbHash = "$2a$10$XNOdv1ypqlfrRlCxs3DHKu6vi33sKhMR8SB2i49rTwhYCKHByySz6";
        String migHash = "$2a$10$sVIsLf/oSgm7FITl5nT9Xue1s/lrKhR6KVjHv9imW.i1s0nHEdP5W";
        System.out.println("DB hash matches Admin@123: " + encoder.matches("Admin@123", dbHash));
        System.out.println("Mig hash matches Admin@123: " + encoder.matches("Admin@123", migHash));
        System.out.println("DB hash matches Password123: " + encoder.matches("Password123", dbHash));
        System.out.println("DB hash matches admin: " + encoder.matches("admin", dbHash));
        System.out.println("DB hash matches admin@bloodbank: " + encoder.matches("admin@bloodbank", dbHash));
    }
}