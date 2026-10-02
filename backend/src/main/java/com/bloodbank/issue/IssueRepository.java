package com.bloodbank.issue;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.List;

public interface IssueRepository extends JpaRepository<BloodIssue, Long> {

    List<BloodIssue> findByRequestId(Long requestId);

    @Query("""
        SELECT bi FROM BloodIssue bi
        JOIN FETCH bi.request r
        JOIN FETCH bi.inventory inv
        JOIN FETCH r.hospital h
        WHERE (:hospitalId IS NULL OR h.id = :hospitalId)
        ORDER BY bi.issuedAt DESC
    """)
    Page<BloodIssue> search(@Param("hospitalId") Long hospitalId, Pageable pageable);

    @Query("""
        SELECT count(bi) FROM BloodIssue bi
        WHERE bi.issuedAt >= :start AND bi.issuedAt <= :end
    """)
    long countIssuedBetween(@Param("start") Instant start, @Param("end") Instant end);
}
