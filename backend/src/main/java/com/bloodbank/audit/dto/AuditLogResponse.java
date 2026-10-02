package com.bloodbank.audit.dto;

import java.time.Instant;

public record AuditLogResponse(
        Long id,
        ActorRef actor,
        String action,
        String entityType,
        Long entityId,
        String details,
        Instant createdAt
) {
    public record ActorRef(Long id, String email) {}
}
