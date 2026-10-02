package com.bloodbank.donor.dto;

import java.util.List;

public record DonorDetailResponse(
        DonorProfileResponse profile,
        EligibilityResponse eligibility,
        List<DonationSummary> donations
) {}