package com.bloodbank.user.dto;

import com.bloodbank.common.enums.Gender;
import jakarta.validation.constraints.*;
import java.time.LocalDate;

public record RegisterDonorRequest(
        @NotBlank @Email @Size(max = 190) String email,
        @NotBlank @Size(min = 8, max = 100) @Pattern(regexp = "^(?=.*[A-Za-z])(?=.*\\d).+$", message = "must contain at least one letter and one digit")
        String password,
        @NotBlank @Size(max = 120) String fullName,
        @Size(max = 20) String phone,
        LocalDate dob,
        LocalDate dateOfBirth,
        Gender gender,
        Double weightKg,
        String bloodGroup,
        Long bloodGroupId,
        String city
) {
    public LocalDate effectiveDob() {
        return dob != null ? dob : dateOfBirth;
    }
}
