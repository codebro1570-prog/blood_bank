package com.bloodbank.admin;

import com.bloodbank.admin.dto.DashboardResponse;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@Tag(name = "Admin")
@SecurityRequirement(name = "bearerAuth")
@PreAuthorize("hasAnyRole('ADMIN', 'STAFF')")
public class AdminDashboardController {

    private final DashboardService service;

    public AdminDashboardController(DashboardService service) {
        this.service = service;
    }

    @GetMapping({"/api/v1/admin/dashboard", "/admin/dashboard", "/api/v1/dashboard", "/dashboard"})
    public DashboardResponse getDashboard() {
        return service.getDashboard();
    }
}
