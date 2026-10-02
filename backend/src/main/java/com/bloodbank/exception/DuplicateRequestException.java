package com.bloodbank.exception;

import org.springframework.http.HttpStatus;

public class DuplicateRequestException extends BusinessException {
    public DuplicateRequestException(String message) {
        super("DUPLICATE_REQUEST", HttpStatus.CONFLICT, message);
    }
}