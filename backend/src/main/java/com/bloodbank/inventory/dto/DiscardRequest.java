package com.bloodbank.inventory.dto;

import jakarta.validation.constraints.NotBlank;

public record DiscardRequest(
        @NotBlank(message = "reason is required")
        String reason
) {
}
