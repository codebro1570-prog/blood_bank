package com.bloodbank.exception;

import org.springframework.http.HttpStatus;

public class ConflictException extends BusinessException {
    public ConflictException(String errorCode, String message) {
        super(errorCode, HttpStatus.CONFLICT, message);
    }

    public static ConflictException emailExists(String email) {
        return new ConflictException("EMAIL_EXISTS", "A user with email '" + email + "' already exists");
    }

    public static ConflictException licenseExists(String licenseNumber) {
        return new ConflictException("LICENSE_EXISTS", "A hospital with license number '" + licenseNumber + "' already exists");
    }
}