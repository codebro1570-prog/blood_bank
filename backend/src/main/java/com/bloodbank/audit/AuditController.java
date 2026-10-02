package com.bloodbank.audit;

import com.bloodbank.audit.dto.AuditLogResponse;
import com.bloodbank.common.dto.PageResponse;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@Tag(name = "Audit")
@SecurityRequirement(name = "bearerAuth")
@PreAuthorize("hasRole('ADMIN')")
public class AuditController {

    private final AuditRepository auditRepo;

    public AuditController(AuditRepository auditRepo) {
        this.auditRepo = auditRepo;
    }

    @GetMapping({"/api/v1/admin/audit-logs", "/admin/audit-logs"})
    public PageResponse<AuditLogResponse> list(
            @RequestParam(required = false) String action,
            @RequestParam(required = false) String entityType,
            @PageableDefault(sort = "createdAt") Pageable pageable) {
        Page<AuditLog> page = auditRepo.search(action, entityType, pageable);
        return PageResponse.from(page, this::toResponse);
    }

    private AuditLogResponse toResponse(AuditLog a) {
        AuditLogResponse.ActorRef actorRef = null;
        if (a.getActor() != null) {
            actorRef = new AuditLogResponse.ActorRef(a.getActor().getId(), a.getActor().getEmail());
        }
        return new AuditLogResponse(
                a.getId(),
                actorRef,
                a.getAction(),
                a.getEntityType(),
                a.getEntityId(),
                a.getDetails(),
                a.getCreatedAt()
        );
    }
}
