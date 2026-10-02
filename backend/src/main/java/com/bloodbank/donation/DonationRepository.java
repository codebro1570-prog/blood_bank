package com.bloodbank.donation;

import com.bloodbank.common.enums.ScreeningStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface DonationRepository extends JpaRepository<Donation, Long> {

    Page<Donation> findByDonorIdOrderByDonationDateDesc(Long donorId, Pageable pageable);

    List<Donation> findAllByDonorIdOrderByDonationDateDesc(Long donorId);

    long countByDonorId(Long donorId);

    Optional<Donation> findFirstByDonorIdOrderByDonationDateDesc(Long donorId);

    @Query("""
        SELECT d FROM Donation d
        WHERE (:status IS NULL OR d.screeningStatus = :status)
          AND (:fromDate IS NULL OR d.donationDate >= :fromDate)
          AND (:toDate IS NULL OR d.donationDate <= :toDate)
          AND (:donorId IS NULL OR d.donor.id = :donorId)
        ORDER BY d.donationDate DESC, d.id DESC
    """)
    Page<Donation> search(
            @Param("status") ScreeningStatus status,
            @Param("fromDate") LocalDate fromDate,
            @Param("toDate") LocalDate toDate,
            @Param("donorId") Long donorId,
            Pageable pageable);

    long countByDonationDate(LocalDate date);
}
