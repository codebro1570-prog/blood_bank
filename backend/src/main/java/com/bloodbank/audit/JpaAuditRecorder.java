package com.bloodbank.audit;

import com.bloodbank.security.SecurityUtils;
import com.bloodbank.user.User;
import com.bloodbank.user.UserRepository;
import org.springframework.context.annotation.Primary;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

@Component
@Primary
public class JpaAuditRecorder implements AuditRecorder {

    private final AuditRepository auditRepo;
    private final UserRepository userRepo;

    public JpaAuditRecorder(AuditRepository auditRepo, UserRepository userRepo) {
        this.auditRepo = auditRepo;
        this.userRepo = userRepo;
    }

    @Override
    @Transactional(propagation = Propagation.REQUIRED)
    public void record(Long actorId, String action, String entityType, Long entityId, String details) {
        Long resolvedActorId = actorId;
        if (resolvedActorId == null) {
            try {
                resolvedActorId = SecurityUtils.currentUserId();
            } catch (Exception ignored) {
                // Background task or unauthenticated
            }
        }

        User actor = null;
        if (resolvedActorId != null) {
            actor = userRepo.findById(resolvedActorId).orElse(null);
        }

        String truncatedDetails = (details != null && details.length() > 500)
                ? details.substring(0, 497) + "..."
                : details;

        AuditLog log = new AuditLog(actor, action, entityType, entityId, truncatedDetails);
        auditRepo.save(log);
    }
}
