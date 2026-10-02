package com.bloodbank.donation;

import com.bloodbank.donor.DonationQueryPort;
import com.bloodbank.donor.dto.DonationSummary;
import org.springframework.context.annotation.Primary;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
@Primary
public class DonationQueryAdapter implements DonationQueryPort {

    private final DonationRepository donationRepo;

    public DonationQueryAdapter(DonationRepository donationRepo) {
        this.donationRepo = donationRepo;
    }

    @Override
    public List<DonationSummary> findByDonorId(Long donorId) {
        return donationRepo.findAllByDonorIdOrderByDonationDateDesc(donorId).stream()
                .map(d -> new DonationSummary(
                        d.getId(),
                        d.getDonationDate(),
                        d.getVolumeMl(),
                        d.getScreeningStatus().name(),
                        d.getFailureReason()
                ))
                .toList();
    }

    @Override
    public boolean hasDonations(Long donorId) {
        return donationRepo.countByDonorId(donorId) > 0;
    }
}
