package com.bloodbank.exception;

import org.springframework.http.HttpStatus;

public class AccountDisabledException extends BusinessException {
    public AccountDisabledException(String message) {
        super("ACCOUNT_DISABLED", HttpStatus.FORBIDDEN, message);
    }
}