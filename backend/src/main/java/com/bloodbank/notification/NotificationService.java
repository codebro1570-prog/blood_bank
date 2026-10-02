package com.bloodbank.notification;

import com.bloodbank.common.dto.PageResponse;
import com.bloodbank.common.enums.NotificationType;
import com.bloodbank.common.enums.Role;
import com.bloodbank.exception.ResourceNotFoundException;
import com.bloodbank.notification.dto.NotificationResponse;
import com.bloodbank.notification.dto.UnreadCountResponse;
import com.bloodbank.security.SecurityUtils;
import com.bloodbank.user.User;
import com.bloodbank.user.UserRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional
public class NotificationService {

    private final NotificationRepository notificationRepo;
    private final UserRepository userRepo;

    public NotificationService(NotificationRepository notificationRepo, UserRepository userRepo) {
        this.notificationRepo = notificationRepo;
        this.userRepo = userRepo;
    }

    public void notifyUser(Long userId, NotificationType type, String title, String message,
                           String refType, Long refId, Long eventId) {
        if (eventId != null && notificationRepo.existsByEventIdAndUserId(eventId, userId)) {
            return;
        }

        userRepo.findById(userId).ifPresent(user -> {
            Notification n = new Notification(user, type, title, message, refType, refId, eventId);
            notificationRepo.save(n);
        });
    }

    public void notifyRole(Role role, NotificationType type, String title, String message,
                           String refType, Long refId, Long eventId) {
        List<User> users = userRepo.findByRoleAndActiveTrue(role);
        for (User u : users) {
            notifyUser(u.getId(), type, title, message, refType, refId, eventId);
        }
    }

    @Transactional(readOnly = true)
    public PageResponse<NotificationResponse> listMine(Pageable pageable) {
        Long userId = SecurityUtils.currentUserId();
        Page<Notification> page = notificationRepo.findByUserIdOrderByCreatedAtDesc(userId, pageable);
        return PageResponse.from(page, this::toResponse);
    }

    @Transactional(readOnly = true)
    public UnreadCountResponse getUnreadCount() {
        Long userId = SecurityUtils.currentUserId();
        long count = notificationRepo.countByUserIdAndReadFalse(userId);
        return new UnreadCountResponse(count);
    }

    public NotificationResponse markRead(Long id) {
        Long userId = SecurityUtils.currentUserId();
        Notification n = notificationRepo.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Notification not found with id " + id));

        if (!n.getUser().getId().equals(userId)) {
            throw new ResourceNotFoundException("Notification not found with id " + id);
        }

        n.setRead(true);
        n = notificationRepo.save(n);
        return toResponse(n);
    }

    public void markAllRead() {
        Long userId = SecurityUtils.currentUserId();
        notificationRepo.markAllRead(userId);
    }

    private NotificationResponse toResponse(Notification n) {
        return new NotificationResponse(
                n.getId(),
                n.getType(),
                n.getTitle(),
                n.getMessage(),
                n.isRead(),
                n.getRefType(),
                n.getRefId(),
                n.getCreatedAt()
        );
    }
}
