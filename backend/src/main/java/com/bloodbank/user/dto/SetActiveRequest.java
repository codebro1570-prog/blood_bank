package com.bloodbank.user.dto;

import jakarta.validation.constraints.NotNull;

public record SetActiveRequest(
        @NotNull Boolean active
) {}
