package com.bloodbank.hospital;

import com.bloodbank.common.enums.ApprovalStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface HospitalRepository extends JpaRepository<Hospital, Long> {

    Optional<Hospital> findByUserId(Long userId);

    boolean existsByLicenseNoIgnoreCase(String licenseNo);

    @Query("""
        SELECT h FROM Hospital h
        WHERE (:status is null or h.approvalStatus = :status)
          AND (:q is null or lower(h.name) like lower(concat('%', :q, '%'))
              or lower(h.licenseNo) like lower(concat('%', :q, '%')))
        ORDER BY h.createdAt DESC
        """)
    Page<Hospital> search(@Param("status") ApprovalStatus status,
                          @Param("q") String q,
                          Pageable pageable);

    @Query("SELECT h FROM Hospital h JOIN User u ON u.id = h.userId WHERE u.role = 'HOSPITAL' AND u.active = true")
    List<Hospital> findAllApproved(@Param("approvalStatus") ApprovalStatus approvalStatus);
}