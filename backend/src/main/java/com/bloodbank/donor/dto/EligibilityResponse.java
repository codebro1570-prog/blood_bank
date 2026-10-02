package com.bloodbank.donor.dto;

import java.time.LocalDate;
import java.util.List;

public record EligibilityResponse(
        boolean eligible,
        LocalDate nextEligibleDate,
        List<String> reasons,
        EligibilityRules rules,
        EligibilityChecks checks
) {
    public record EligibilityRules(int minAge, int maxAge, double minWeightKg, int gapDays) {}
    public record EligibilityChecks(boolean age, boolean weight, boolean gap) {}
}