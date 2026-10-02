package com.bloodbank.exception;

import org.springframework.http.HttpStatus;

public class HospitalNotApprovedException extends BusinessException {
    public HospitalNotApprovedException(String message) {
        super("HOSPITAL_NOT_APPROVED", HttpStatus.FORBIDDEN, message);
    }
}