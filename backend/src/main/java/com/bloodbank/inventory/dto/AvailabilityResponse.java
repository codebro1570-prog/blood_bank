package com.bloodbank.inventory.dto;

public record AvailabilityResponse(
        String bloodGroup,
        int requested,
        long exactAvailable,
        long compatibleAvailable,
        boolean sufficientExact,
        boolean sufficientWithCompatible,
        boolean emergencyOnlyCompatible
) {
}
