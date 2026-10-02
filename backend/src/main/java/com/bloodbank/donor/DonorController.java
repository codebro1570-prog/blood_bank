package com.bloodbank.donor;

import com.bloodbank.common.dto.PageResponse;
import com.bloodbank.donor.dto.*;
import java.util.List;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping({"/api/v1/donors", "/donors"})
@Tag(name = "Donors")
public class DonorController {

    private final DonorService service;

    public DonorController(DonorService service) {
        this.service = service;
    }

    // Self-service (DONOR)
    @GetMapping("/me")
    @SecurityRequirement(name = "bearerAuth")
    @PreAuthorize("hasRole('DONOR')")
    public DonorProfileResponse getMyProfile() {
        return service.getMyProfile();
    }

    @PutMapping("/me")
    @SecurityRequirement(name = "bearerAuth")
    @PreAuthorize("hasRole('DONOR')")
    public DonorProfileResponse updateMyProfile(@Valid @RequestBody UpdateDonorRequest req) {
        return service.updateMyProfile(req);
    }

    @GetMapping("/me/eligibility")
    @SecurityRequirement(name = "bearerAuth")
    @PreAuthorize("hasRole('DONOR')")
    public EligibilityResponse getMyEligibility() {
        return service.getMyEligibility();
    }

    // Staff/Admin endpoints
    @GetMapping("/eligible")
    @SecurityRequirement(name = "bearerAuth")
    @PreAuthorize("hasAnyRole('STAFF','ADMIN')")
    public PageResponse<DonorProfileResponse> listEligible(
            @RequestParam(required = false) String bloodGroup,
            @PageableDefault Pageable pageable) {
        return service.listEligible(bloodGroup, pageable);
    }

    @GetMapping
    @SecurityRequirement(name = "bearerAuth")
    @PreAuthorize("hasAnyRole('STAFF','ADMIN')")
    public PageResponse<DonorProfileResponse> search(
            @RequestParam(required = false) String q,
            @RequestParam(required = false) String bloodGroup,
            @RequestParam(required = false) String city,
            @PageableDefault Pageable pageable) {
        return service.search(q, bloodGroup, city, pageable);
    }

    @GetMapping("/{id}")
    @SecurityRequirement(name = "bearerAuth")
    @PreAuthorize("hasAnyRole('STAFF','ADMIN')")
    public DonorDetailResponse getDetail(@PathVariable Long id) {
        return service.getDetail(id);
    }
}