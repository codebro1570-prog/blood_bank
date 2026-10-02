package com.bloodbank.donor.dto;

import jakarta.validation.constraints.*;
import java.time.LocalDate;

public record UpdateDonorRequest(
        @Size(max = 150) String fullName,
        @Size(max = 20) String phone,
        @NotNull @Min(30) @Max(250) Double weightKg,
        @Size(max = 80) String city
) {}