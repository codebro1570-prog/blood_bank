package com.bloodbank.donor;

import com.bloodbank.config.AppProperties;
import com.bloodbank.donor.dto.EligibilityResponse;
import com.bloodbank.donor.dto.EligibilityResponse.EligibilityChecks;
import com.bloodbank.donor.dto.EligibilityResponse.EligibilityRules;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.Period;
import java.util.ArrayList;
import java.util.List;

@Service
public class EligibilityService {

    private final AppProperties properties;

    public EligibilityService(AppProperties properties) {
        this.properties = properties;
    }

    public EligibilityResponse evaluate(Donor donor) {
        LocalDate today = LocalDate.now();
        List<String> reasons = new ArrayList<>();

        int minAge = properties.getMinAge() > 0 ? properties.getMinAge() : 18;
        int maxAge = properties.getMaxAge() > 0 ? properties.getMaxAge() : 65;
        double minWeight = properties.getMinWeightKg() > 0 ? properties.getMinWeightKg() : 50.0;
        int gapDays = properties.getDonationGapDays() > 0 ? properties.getDonationGapDays() : 90;

        EligibilityRules rules = new EligibilityRules(minAge, maxAge, minWeight, gapDays);

        // Active check
        if (donor.getUser() != null && !donor.getUser().isActive()) {
            reasons.add("User account is deactivated");
        }

        // Deferral check
        if (donor.getDeferredUntil() != null && !donor.getDeferredUntil().isBefore(today)) {
            String reason = donor.getDeferralReason() != null ? donor.getDeferralReason() : "Donor is deferred until " + donor.getDeferredUntil();
            reasons.add(reason);
        }

        // Age check
        boolean agePassed = false;
        if (donor.getDob() != null) {
            int age = Period.between(donor.getDob(), today).getYears();
            if (age >= minAge && age <= maxAge) {
                agePassed = true;
            } else if (age < minAge) {
                reasons.add("Donor age is " + age + ", minimum required age is " + minAge);
            } else {
                reasons.add("Donor age is " + age + ", maximum allowed age is " + maxAge);
            }
        } else {
            reasons.add("Date of birth is not specified");
        }

        // Weight check
        boolean weightPassed = false;
        if (donor.getWeightKg() != null && donor.getWeightKg() >= minWeight) {
            weightPassed = true;
        } else {
            double w = donor.getWeightKg() != null ? donor.getWeightKg() : 0.0;
            reasons.add("Donor weight is " + w + " kg, minimum required weight is " + minWeight + " kg");
        }

        // Gap check
        boolean gapPassed = true;
        LocalDate nextEligibleDate = null;
        if (donor.getLastDonationDate() != null) {
            LocalDate allowedDate = donor.getLastDonationDate().plusDays(gapDays);
            if (today.isBefore(allowedDate)) {
                gapPassed = false;
                nextEligibleDate = allowedDate;
                reasons.add("Next eligible donation date is " + allowedDate);
            }
        }

        if (donor.getDeferredUntil() != null && !donor.getDeferredUntil().isBefore(today)) {
            LocalDate deferralNext = donor.getDeferredUntil().plusDays(1);
            if (nextEligibleDate == null || deferralNext.isAfter(nextEligibleDate)) {
                nextEligibleDate = deferralNext;
            }
        }

        EligibilityChecks checks = new EligibilityChecks(agePassed, weightPassed, gapPassed);
        boolean eligible = reasons.isEmpty();

        return new EligibilityResponse(eligible, nextEligibleDate, reasons, rules, checks);
    }
}
