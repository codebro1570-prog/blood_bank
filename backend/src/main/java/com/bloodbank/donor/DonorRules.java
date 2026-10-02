package com.bloodbank.donor;

import lombok.Getter;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.stereotype.Component;

@Component
@EnableConfigurationProperties(com.bloodbank.config.AppProperties.class)
@Getter
public class DonorRules {
    private final int minAge;
    private final int maxAge;
    private final int minWeightKg;
    private final int donationGapDays;

    public DonorRules(com.bloodbank.config.AppProperties props) {
        this.minAge = props.getMinAge();
        this.maxAge = props.getMaxAge();
        this.minWeightKg = props.getMinWeightKg();
        this.donationGapDays = props.getDonationGapDays();
    }
}