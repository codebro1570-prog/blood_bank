package com.bloodbank.user.dto;

import jakarta.validation.constraints.*;

public record RegisterHospitalRequest(
        @NotBlank @Email @Size(max = 190) String email,
        @NotBlank @Size(min = 8, max = 100) @Pattern(regexp = "^(?=.*[A-Za-z])(?=.*\\d).+$", message = "must contain at least one letter and one digit")
        String password,
        String name,
        String hospitalName,
        @NotBlank @Size(max = 60) String licenseNo,
        String contactPerson,
        @NotBlank @Size(max = 20) String phone,
        String address,
        @NotBlank @Size(max = 80) String city
) {
    public String effectiveName() {
        if (name != null && !name.isBlank()) return name.trim();
        if (hospitalName != null && !hospitalName.isBlank()) return hospitalName.trim();
        return "";
    }
}
