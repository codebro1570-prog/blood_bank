package com.bloodbank.request.dto;

import com.bloodbank.common.enums.RequestPriority;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

import java.time.Instant;

public record CreateRequestRequest(
        String bloodGroup,
        Long bloodGroupId,

        @NotNull(message = "unitsRequested is required")
        @Min(value = 1, message = "unitsRequested must be at least 1")
        @Max(value = 10, message = "unitsRequested must be at most 10")
        Integer unitsRequested,

        RequestPriority priority,

        @NotNull(message = "requiredBy is required")
        Instant requiredBy,

        String patientNote
) {
}
