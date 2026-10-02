package com.bloodbank.exception;

import org.springframework.http.HttpStatus;

public class ResourceNotFoundException extends BusinessException {
    public ResourceNotFoundException(String message) {
        super("RESOURCE_NOT_FOUND", HttpStatus.NOT_FOUND, message);
    }

    public ResourceNotFoundException(String resource, Object id) {
        this(resource + " not found with id " + id);
    }
}