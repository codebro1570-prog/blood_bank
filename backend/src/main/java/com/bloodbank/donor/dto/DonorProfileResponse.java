package com.bloodbank.donor.dto;

import com.bloodbank.common.enums.Gender;
import java.time.LocalDate;
import java.util.List;

public record DonorProfileResponse(
        Long id,
        String fullName,
        String email,
        String phone,
        LocalDate dob,
        Gender gender,
        Double weightKg,
        String bloodGroup,
        String city,
        LocalDate lastDonationDate,
        int totalDonations,
        boolean eligible,
        List<DonationSummary> donations
) {}