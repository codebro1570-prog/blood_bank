package com.bloodbank.audit;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface AuditRepository extends JpaRepository<AuditLog, Long> {

    @Query("""
        SELECT a FROM AuditLog a
        LEFT JOIN FETCH a.actor
        WHERE (:action IS NULL OR a.action = :action)
          AND (:entityType IS NULL OR a.entityType = :entityType)
        ORDER BY a.createdAt DESC
    """)
    Page<AuditLog> search(@Param("action") String action,
                          @Param("entityType") String entityType,
                          Pageable pageable);
}
