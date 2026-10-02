package com.bloodbank.user.dto;

import jakarta.validation.constraints.*;

public record CreateStaffRequest(
        @NotBlank @Email @Size(max = 190) String email,
        @NotBlank @Size(min = 8, max = 100)
        @Pattern(regexp = "^(?=.*[A-Za-z])(?=.*\\d).+$", message = "must contain at least one letter and one digit")
        String password,
        @NotBlank @Size(max = 120) String fullName,
        @Size(max = 20) String phone
) {}
