package com.bloodbank.exception;

import org.springframework.http.HttpStatus;

public class DonorNotEligibleException extends BusinessException {
    public DonorNotEligibleException(String message) {
        super("DONOR_NOT_ELIGIBLE", HttpStatus.UNPROCESSABLE_ENTITY, message);
    }
}