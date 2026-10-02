package com.bloodbank.exception;

import org.springframework.http.HttpStatus;

public class InsufficientStockException extends BusinessException {
    public InsufficientStockException(String message) {
        super("INSUFFICIENT_STOCK", HttpStatus.CONFLICT, message);
    }
}