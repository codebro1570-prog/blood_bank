package com.bloodbank.user;

import com.bloodbank.common.dto.PageResponse;
import com.bloodbank.common.enums.Role;
import com.bloodbank.user.dto.AdminUserResponse;
import com.bloodbank.user.dto.CreateStaffRequest;
import com.bloodbank.user.dto.SetActiveRequest;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping({"/api/v1/admin", "/admin"})
@Tag(name = "Admin Users")
@SecurityRequirement(name = "bearerAuth")
@PreAuthorize("hasRole('ADMIN')")
public class AdminUserController {

    private final UserAdminService userAdminService;

    public AdminUserController(UserAdminService userAdminService) {
        this.userAdminService = userAdminService;
    }

    @PostMapping("/staff")
    @ResponseStatus(HttpStatus.CREATED)
    public AdminUserResponse createStaff(@Valid @RequestBody CreateStaffRequest req) {
        return userAdminService.createStaff(req);
    }

    @GetMapping("/users")
    public PageResponse<AdminUserResponse> listUsers(
            @RequestParam(required = false) String role,
            @RequestParam(required = false) Boolean active,
            @RequestParam(required = false) String q,
            @PageableDefault Pageable pageable) {
        Role r = null;
        if (role != null && !role.isBlank() && !role.equalsIgnoreCase("ALL")) {
            try {
                r = Role.valueOf(role.trim().toUpperCase());
            } catch (IllegalArgumentException ignored) {}
        }
        return userAdminService.list(r, active, q, pageable);
    }

    @RequestMapping(value = "/users/{id}/active", method = {RequestMethod.PATCH, RequestMethod.PUT})
    public AdminUserResponse setActive(@PathVariable Long id, @Valid @RequestBody SetActiveRequest req) {
        return userAdminService.setActive(id, req);
    }
}
