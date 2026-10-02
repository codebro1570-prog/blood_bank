package com.bloodbank.request;

import com.bloodbank.common.enums.RequestPriority;
import com.bloodbank.common.enums.RequestStatus;
import jakarta.persistence.LockModeType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface RequestRepository extends JpaRepository<BloodRequest, Long> {

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT r FROM BloodRequest r WHERE r.id = :id")
    Optional<BloodRequest> findByIdForUpdate(@Param("id") Long id);

    Optional<BloodRequest> findByHospitalIdAndIdempotencyKey(Long hospitalId, String idempotencyKey);

    @Query("""
        SELECT r FROM BloodRequest r
        WHERE r.hospital.id = :hospitalId
          AND r.bloodGroup.id = :bloodGroupId
          AND r.status IN ('PENDING', 'APPROVED')
          AND r.createdAt >= :since
    """)
    List<BloodRequest> findOpenDuplicates(
            @Param("hospitalId") Long hospitalId,
            @Param("bloodGroupId") Long bloodGroupId,
            @Param("since") Instant since);

    @Query("""
        SELECT r FROM BloodRequest r
        WHERE r.hospital.id = :hospitalId
          AND (:status IS NULL OR r.status = :status)
        ORDER BY r.createdAt DESC
    """)
    Page<BloodRequest> findMine(
            @Param("hospitalId") Long hospitalId,
            @Param("status") RequestStatus status,
            Pageable pageable);

    @Query("""
        SELECT r FROM BloodRequest r
        WHERE (:hasStatuses = false OR r.status IN :statuses)
          AND (:priority IS NULL OR r.priority = :priority)
        ORDER BY
          CASE r.priority
            WHEN com.bloodbank.common.enums.RequestPriority.EMERGENCY THEN 1
            WHEN com.bloodbank.common.enums.RequestPriority.URGENT THEN 2
            WHEN com.bloodbank.common.enums.RequestPriority.NORMAL THEN 3
            ELSE 4
          END ASC,
          r.requiredBy ASC,
          r.id ASC
    """)
    Page<BloodRequest> findQueue(
            @Param("hasStatuses") boolean hasStatuses,
            @Param("statuses") Collection<RequestStatus> statuses,
            @Param("priority") RequestPriority priority,
            Pageable pageable);

    long countByStatus(RequestStatus status);

    long countByStatusAndPriority(RequestStatus status, RequestPriority priority);
}
