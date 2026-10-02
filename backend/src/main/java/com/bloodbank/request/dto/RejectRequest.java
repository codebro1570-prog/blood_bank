package com.bloodbank.request.dto;

import jakarta.validation.constraints.NotBlank;

public record RejectRequest(
        @NotBlank(message = "reason is required")
        String reason
) {
}
