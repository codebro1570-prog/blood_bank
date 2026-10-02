package com.bloodbank.request.dto;

import java.time.LocalDate;

public record IssuedUnitSummary(
        String unitNumber,
        String bloodGroup,
        LocalDate expiryDate
) {
}
