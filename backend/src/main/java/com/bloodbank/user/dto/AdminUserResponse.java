package com.bloodbank.user.dto;

import com.bloodbank.common.enums.Role;
import com.bloodbank.user.User;
import java.time.Instant;

public record AdminUserResponse(
        Long id,
        String email,
        String fullName,
        String phone,
        Role role,
        boolean active,
        Instant createdAt
) {
    public static AdminUserResponse from(User u) {
        return new AdminUserResponse(
                u.getId(),
                u.getEmail(),
                u.getFullName(),
                u.getPhone(),
                u.getRole(),
                u.isActive(),
                u.getCreatedAt()
        );
    }
}
