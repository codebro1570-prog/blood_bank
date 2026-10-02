package com.bloodbank.exception;

import java.time.Instant;
import java.util.List;

public record ApiError(
        Instant timestamp,
        int status,
        String code,
        String message,
        List<FieldDetail> details,
        String path
) {
    public record FieldDetail(String field, String message) {}

    public static ApiError of(int status, String code, String message, List<FieldDetail> details, String path) {
        return new ApiError(Instant.now(), status, code, message, details == null ? List.of() : details, path);
    }
}