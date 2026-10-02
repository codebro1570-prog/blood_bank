package com.bloodbank.inventory;

import com.bloodbank.common.enums.UnitStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface InventoryRepository extends JpaRepository<BloodInventory, Long> {

    Optional<BloodInventory> findByUnitNumber(String unitNumber);

    Optional<BloodInventory> findByDonationId(Long donationId);

    @Query(value = """
        SELECT * FROM blood_inventory
        WHERE status = 'AVAILABLE'
          AND expiry_date > :today
          AND blood_group_id IN (:groupIds)
        ORDER BY
          CASE WHEN blood_group_id = :exactGroupId THEN 0 ELSE 1 END,
          expiry_date ASC,
          id ASC
        LIMIT :limit
        FOR UPDATE SKIP LOCKED
    """, nativeQuery = true)
    List<BloodInventory> lockAvailableUnits(
            @Param("exactGroupId") Long exactGroupId,
            @Param("groupIds") Collection<Long> groupIds,
            @Param("today") LocalDate today,
            @Param("limit") int limit);

    @Query("""
        SELECT u FROM BloodInventory u
        WHERE (:bloodGroupId IS NULL OR u.bloodGroup.id = :bloodGroupId)
          AND (:status IS NULL OR u.status = :status)
          AND (:unitNumber IS NULL OR u.unitNumber LIKE CONCAT('%', :unitNumber, '%'))
        ORDER BY u.expiryDate ASC
    """)
    Page<BloodInventory> search(
            @Param("bloodGroupId") Long bloodGroupId,
            @Param("status") UnitStatus status,
            @Param("unitNumber") String unitNumber,
            Pageable pageable);

    @Query("""
        SELECT u FROM BloodInventory u
        WHERE u.status = 'AVAILABLE'
          AND u.expiryDate <= :thresholdDate
          AND u.expiryDate > :today
        ORDER BY u.expiryDate ASC
    """)
    List<BloodInventory> findNearExpiry(@Param("today") LocalDate today, @Param("thresholdDate") LocalDate thresholdDate);

    @Query("""
        SELECT count(u) FROM BloodInventory u
        WHERE u.status = 'AVAILABLE'
          AND u.expiryDate <= :thresholdDate
          AND u.expiryDate > :today
    """)
    long countNearExpiry(@Param("today") LocalDate today, @Param("thresholdDate") LocalDate thresholdDate);

    @Modifying
    @Query("""
        UPDATE BloodInventory u
        SET u.status = 'EXPIRED'
        WHERE u.status = 'AVAILABLE' AND u.expiryDate <= :today
    """)
    int expireOverdueBatch(@Param("today") LocalDate today);

    long countByBloodGroupIdAndStatusAndExpiryDateAfter(Long bloodGroupId, UnitStatus status, LocalDate today);

    long countByStatus(UnitStatus status);

    @Query("""
        SELECT count(u) FROM BloodInventory u
        WHERE u.status = 'EXPIRED'
          AND u.expiryDate >= :startOfMonth
          AND u.expiryDate <= :endOfMonth
    """)
    long countExpiredBetween(@Param("startOfMonth") LocalDate startOfMonth, @Param("endOfMonth") LocalDate endOfMonth);
}
