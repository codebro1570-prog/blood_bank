package com.bloodbank.exception;

import org.springframework.http.HttpStatus;

public class InvalidCredentialsException extends BusinessException {
    public InvalidCredentialsException(String message) {
        super("INVALID_CREDENTIALS", HttpStatus.UNAUTHORIZED, message);
    }
}