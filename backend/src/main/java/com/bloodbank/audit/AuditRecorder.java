package com.bloodbank.audit;

public interface AuditRecorder {
    void record(Long actorId, String action, String entityType, Long entityId, String details);

    default void record(String action, String entityType, Long entityId, String details) {
        record(null, action, entityType, entityId, details);
    }
}