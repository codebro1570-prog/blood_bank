package com.bloodbank.notification;

import com.bloodbank.common.enums.NotificationType;
import com.bloodbank.common.enums.Role;
import com.bloodbank.hospital.Hospital;
import com.bloodbank.hospital.HospitalRepository;
import com.bloodbank.outbox.OutboxEvent;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import java.util.Map;

@Component
public class NotificationEventHandler {

    private static final Logger log = LoggerFactory.getLogger(NotificationEventHandler.class);

    private final NotificationService notificationService;
    private final HospitalRepository hospitalRepo;
    private final ObjectMapper objectMapper;

    public NotificationEventHandler(NotificationService notificationService,
                                  HospitalRepository hospitalRepo,
                                  ObjectMapper objectMapper) {
        this.notificationService = notificationService;
        this.hospitalRepo = hospitalRepo;
        this.objectMapper = objectMapper;
    }

    public void handle(OutboxEvent event) {
        try {
            Map<String, Object> payload = objectMapper.readValue(event.getPayload(), new TypeReference<>() {});
            String typeStr = event.getEventType();

            switch (typeStr) {
                case "DONATION_RECORDED" -> {
                    Long userId = getLong(payload, "userId");
                    Long donationId = getLong(payload, "donationId");
                    if (userId != null) {
                        notificationService.notifyUser(userId, NotificationType.DONATION_RECORDED,
                                "Donation Recorded", "Your blood donation has been recorded and is pending screening.",
                                "DONATION", donationId, event.getId());
                    }
                }
                case "SCREENING_FAILED" -> {
                    Long userId = getLong(payload, "userId");
                    Long donationId = getLong(payload, "donationId");
                    String reason = (String) payload.get("reason");
                    if (userId != null) {
                        notificationService.notifyUser(userId, NotificationType.SCREENING_FAILED,
                                "Screening Notice", "Donation screening was not completed successfully: " + reason,
                                "DONATION", donationId, event.getId());
                    }
                }
                case "DONOR_ELIGIBLE_AGAIN" -> {
                    Long userId = getLong(payload, "userId");
                    Long donorId = getLong(payload, "donorId");
                    if (userId != null) {
                        notificationService.notifyUser(userId, NotificationType.DONOR_ELIGIBLE_AGAIN,
                                "You are eligible to donate!", "The required waiting period has passed. You are now eligible to donate blood again.",
                                "DONOR", donorId, event.getId());
                    }
                }
                case "HOSPITAL_REGISTERED" -> {
                    Long hospitalId = getLong(payload, "hospitalId");
                    notificationService.notifyRole(Role.ADMIN, NotificationType.HOSPITAL_REGISTERED,
                            "New Hospital Registered", "A new hospital has registered and is pending approval.",
                            "HOSPITAL", hospitalId, event.getId());
                    notificationService.notifyRole(Role.STAFF, NotificationType.HOSPITAL_REGISTERED,
                            "New Hospital Registered", "A new hospital has registered and is pending approval.",
                            "HOSPITAL", hospitalId, event.getId());
                }
                case "HOSPITAL_DECIDED" -> {
                    Long userId = getLong(payload, "userId");
                    Long hospitalId = getLong(payload, "hospitalId");
                    String status = (String) payload.get("status");
                    if (userId != null) {
                        notificationService.notifyUser(userId, NotificationType.HOSPITAL_DECIDED,
                                "Account Status Update", "Your hospital account status has been updated to: " + status,
                                "HOSPITAL", hospitalId, event.getId());
                    }
                }
                case "REQUEST_CREATED" -> {
                    Long requestId = getLong(payload, "requestId");
                    String bg = (String) payload.get("bloodGroup");
                    Integer units = (Integer) payload.get("units");
                    notificationService.notifyRole(Role.STAFF, NotificationType.REQUEST_CREATED,
                            "New Blood Request", "Hospital requested " + units + " units of " + bg,
                            "REQUEST", requestId, event.getId());
                    notificationService.notifyRole(Role.ADMIN, NotificationType.REQUEST_CREATED,
                            "New Blood Request", "Hospital requested " + units + " units of " + bg,
                            "REQUEST", requestId, event.getId());
                }
                case "EMERGENCY_REQUEST" -> {
                    Long requestId = getLong(payload, "requestId");
                    String bg = (String) payload.get("bloodGroup");
                    Integer units = (Integer) payload.get("units");
                    notificationService.notifyRole(Role.STAFF, NotificationType.EMERGENCY_REQUEST,
                            "EMERGENCY Request", "URGENT: Emergency request for " + units + " units of " + bg,
                            "REQUEST", requestId, event.getId());
                    notificationService.notifyRole(Role.ADMIN, NotificationType.EMERGENCY_REQUEST,
                            "EMERGENCY Request", "URGENT: Emergency request for " + units + " units of " + bg,
                            "REQUEST", requestId, event.getId());
                }
                case "REQUEST_DECIDED" -> {
                    Long requestId = getLong(payload, "requestId");
                    Long hospitalId = getLong(payload, "hospitalId");
                    String status = (String) payload.get("status");
                    if (hospitalId != null) {
                        hospitalRepo.findById(hospitalId).ifPresent(h -> {
                            notificationService.notifyUser(h.getUser().getId(), NotificationType.REQUEST_DECIDED,
                                    "Request Status Update", "Your request #" + requestId + " has been " + status,
                                    "REQUEST", requestId, event.getId());
                        });
                    }
                }
                case "BLOOD_ISSUED" -> {
                    Long requestId = getLong(payload, "requestId");
                    Long hospitalId = getLong(payload, "hospitalId");
                    Integer units = (Integer) payload.get("unitsIssued");
                    if (hospitalId != null) {
                        hospitalRepo.findById(hospitalId).ifPresent(h -> {
                            notificationService.notifyUser(h.getUser().getId(), NotificationType.BLOOD_ISSUED,
                                    "Blood Units Issued", units + " units have been issued for request #" + requestId,
                                    "REQUEST", requestId, event.getId());
                        });
                    }
                }
                case "LOW_STOCK" -> {
                    String bg = (String) payload.get("bloodGroup");
                    notificationService.notifyRole(Role.STAFF, NotificationType.LOW_STOCK,
                            "Low Stock Warning", "Stock for blood group " + bg + " is below minimum threshold.",
                            "INVENTORY", null, event.getId());
                }
                case "UNIT_NEAR_EXPIRY" -> {
                    String unitNo = (String) payload.get("unitNumber");
                    notificationService.notifyRole(Role.STAFF, NotificationType.UNIT_NEAR_EXPIRY,
                            "Unit Near Expiry", "Unit " + unitNo + " is expiring soon.",
                            "INVENTORY", null, event.getId());
                }
                default -> log.debug("No notification handler for event type: {}", typeStr);
            }
        } catch (Exception e) {
            log.error("Error processing event {}: {}", event.getId(), e.getMessage(), e);
            throw new RuntimeException(e);
        }
    }

    private Long getLong(Map<String, Object> map, String key) {
        Object val = map.get(key);
        if (val instanceof Number n) {
            return n.longValue();
        }
        return null;
    }
}
