package com.bloodbank.hospital;

import com.bloodbank.common.dto.PageResponse;
import com.bloodbank.hospital.dto.*;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/hospitals")
@Tag(name = "Hospitals")
public class HospitalController {

    private final HospitalService service;

    public HospitalController(HospitalService service) {
        this.service = service;
    }

    @GetMapping("/me")
    @SecurityRequirement(name = "bearerAuth")
    @PreAuthorize("hasRole('HOSPITAL')")
    public HospitalResponse getMine() {
        return service.getMine();
    }

    @PutMapping("/me")
    @SecurityRequirement(name = "bearerAuth")
    @PreAuthorize("hasRole('HOSPITAL')")
    public HospitalResponse updateMine(@Valid @RequestBody UpdateHospitalRequest req) {
        return service.updateMine(req);
    }

    @PatchMapping("/{id}/approval")
    @SecurityRequirement(name = "bearerAuth")
    @PreAuthorize("hasRole('ADMIN')")
    public HospitalResponse decide(
            @PathVariable Long id,
            @Valid @RequestBody HospitalDecisionRequest req) {
        return service.decide(id, req);
    }

    @GetMapping
    @SecurityRequirement(name = "bearerAuth")
    @PreAuthorize("hasRole('ADMIN')")
    public PageResponse<HospitalResponse> list(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String q,
            @PageableDefault Pageable pageable) {
        return service.list(parseStatus(status), q, pageable);
    }

    private com.bloodbank.common.enums.ApprovalStatus parseStatus(String s) {
        if (s == null || s.isBlank() || s.equalsIgnoreCase("ALL")) return null;
        try {
            return com.bloodbank.common.enums.ApprovalStatus.valueOf(s.trim().toUpperCase());
        } catch (IllegalArgumentException e) {
            return null;
        }
    }
}