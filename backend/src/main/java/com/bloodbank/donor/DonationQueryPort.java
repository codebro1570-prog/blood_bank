package com.bloodbank.donor;

import com.bloodbank.donor.dto.DonationSummary;
import java.util.List;

public interface DonationQueryPort {
    List<DonationSummary> findByDonorId(Long donorId);
    boolean hasDonations(Long donorId);
}