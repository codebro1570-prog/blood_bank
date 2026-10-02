package com.bloodbank.inventory.dto;

import com.bloodbank.common.enums.UnitStatus;

import java.time.LocalDate;

public record UnitResponse(
        Long id,
        String unitNumber,
        String bloodGroup,
        Long donationId,
        LocalDate collectionDate,
        LocalDate expiryDate,
        UnitStatus status,
        long daysToExpiry
) {
}
