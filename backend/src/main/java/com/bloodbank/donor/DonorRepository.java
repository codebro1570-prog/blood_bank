package com.bloodbank.donor;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface DonorRepository extends JpaRepository<Donor, Long> {

    Optional<Donor> findByUserId(Long userId);

    @Query("""
        SELECT d FROM Donor d JOIN User u ON u.id = d.userId
        WHERE (:q is null or lower(u.fullName) like lower(concat('%', :q, '%'))
            or lower(d.phone) like lower(concat('%', :q, '%')))
          AND (:bloodGroup is null or d.bloodGroupId = :bloodGroup)
          AND (:city is null or lower(d.city) = lower(:city))
        """)
    Page<Donor> search(@Param("q") String q, @Param("bloodGroup") Long bloodGroup,
                       @Param("city") String city, Pageable pageable);

    @Query("""
        SELECT d FROM Donor d
        WHERE (:bloodGroup is null or d.bloodGroupId = :bloodGroup)
          AND d.dob <= :maxDob AND d.dob >= :minDob
          AND d.weightKg >= :minWeight
          AND (d.lastDonationDate is null or d.lastDonationDate <= :gapDate)
          AND (d.deferredUntil is null or d.deferredUntil < :today)
        ORDER BY d.lastDonationDate ASC NULLS FIRST
        """)
    List<Donor> findEligible(@Param("bloodGroup") Long bloodGroup,
                             @Param("minWeight") Double minWeight,
                             @Param("maxDob") LocalDate maxDob,
                             @Param("minDob") LocalDate minDob,
                             @Param("gapDate") LocalDate gapDate,
                             @Param("today") LocalDate today);
}