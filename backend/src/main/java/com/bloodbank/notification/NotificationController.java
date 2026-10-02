package com.bloodbank.notification;

import com.bloodbank.common.dto.PageResponse;
import com.bloodbank.notification.dto.NotificationResponse;
import com.bloodbank.notification.dto.UnreadCountResponse;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@Tag(name = "Notifications")
@SecurityRequirement(name = "bearerAuth")
@PreAuthorize("isAuthenticated()")
public class NotificationController {

    private final NotificationService service;

    public NotificationController(NotificationService service) {
        this.service = service;
    }

    @GetMapping({"/api/v1/notifications", "/notifications"})
    public PageResponse<NotificationResponse> listMine(@PageableDefault Pageable pageable) {
        return service.listMine(pageable);
    }

    @GetMapping({"/api/v1/notifications/unread-count", "/notifications/unread-count"})
    public UnreadCountResponse getUnreadCount() {
        return service.getUnreadCount();
    }

    @PatchMapping({"/api/v1/notifications/{id}/read", "/notifications/{id}/read"})
    public NotificationResponse markRead(@PathVariable Long id) {
        return service.markRead(id);
    }

    @PostMapping({"/api/v1/notifications/read-all", "/notifications/read-all"})
    public ResponseEntity<Void> markAllRead() {
        service.markAllRead();
        return ResponseEntity.noContent().build();
    }
}
