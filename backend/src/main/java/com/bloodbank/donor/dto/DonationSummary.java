package com.bloodbank.donor.dto;

import java.time.LocalDate;

public record DonationSummary(Long id, LocalDate donationDate, Integer volumeMl, String status, String failureReason) {}