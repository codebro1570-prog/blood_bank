package com.bloodbank.exception;

import org.springframework.http.HttpStatus;

public class InvalidStateException extends BusinessException {
    public InvalidStateException(String message) {
        super("INVALID_STATE", HttpStatus.CONFLICT, message);
    }
}