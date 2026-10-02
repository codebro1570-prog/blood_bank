package com.bloodbank.user;

import com.bloodbank.audit.AuditRecorder;
import com.bloodbank.common.dto.PageResponse;
import com.bloodbank.common.enums.Role;
import com.bloodbank.exception.BusinessException;
import com.bloodbank.exception.ConflictException;
import com.bloodbank.exception.ResourceNotFoundException;
import com.bloodbank.security.SecurityUtils;
import com.bloodbank.user.dto.AdminUserResponse;
import com.bloodbank.user.dto.CreateStaffRequest;
import com.bloodbank.user.dto.SetActiveRequest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class UserAdminService {

    private final UserRepository users;
    private final PasswordEncoder encoder;
    private final AuditRecorder auditRecorder;

    public UserAdminService(UserRepository users, PasswordEncoder encoder, AuditRecorder auditRecorder) {
        this.users = users;
        this.encoder = encoder;
        this.auditRecorder = auditRecorder;
    }

    public AdminUserResponse createStaff(CreateStaffRequest req) {
        String email = req.email().trim().toLowerCase();
        if (users.existsByEmailIgnoreCase(email)) {
            throw ConflictException.emailExists(email);
        }

        User u = new User();
        u.setEmail(email);
        u.setPasswordHash(encoder.encode(req.password()));
        u.setFullName(req.fullName().trim());
        u.setPhone(req.phone() != null ? req.phone().trim() : null);
        u.setRole(Role.STAFF);
        u.setActive(true);
        u = users.save(u);

        auditRecorder.record("STAFF_CREATED", "USER", u.getId(), "Staff created: " + email);
        return AdminUserResponse.from(u);
    }

    @Transactional(readOnly = true)
    public PageResponse<AdminUserResponse> list(Role role, Boolean active, String q, Pageable pageable) {
        String pattern = (q == null || q.isBlank()) ? null : q.trim();
        Page<User> page = users.search(role, active, pattern, pageable);
        return PageResponse.from(page, AdminUserResponse::from);
    }

    public AdminUserResponse setActive(Long id, SetActiveRequest req) {
        Long currentUserId = SecurityUtils.currentUserId();
        if (currentUserId.equals(id) && Boolean.FALSE.equals(req.active())) {
            throw new BusinessException("CANNOT_DEACTIVATE_SELF", HttpStatus.BAD_REQUEST, "Admin cannot deactivate their own account");
        }

        User u = users.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id " + id));

        u.setActive(req.active());
        u = users.save(u);

        auditRecorder.record("USER_STATUS_CHANGED", "USER", u.getId(), "User active set to " + req.active());
        return AdminUserResponse.from(u);
    }
}
