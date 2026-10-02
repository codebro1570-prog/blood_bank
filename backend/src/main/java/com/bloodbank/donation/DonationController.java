package com.bloodbank.donation;

import com.bloodbank.common.dto.PageResponse;
import com.bloodbank.common.enums.ScreeningStatus;
import com.bloodbank.donation.dto.DonationResponse;
import com.bloodbank.donation.dto.RecordDonationRequest;
import com.bloodbank.donation.dto.ScreeningRequest;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;

@RestController
@Tag(name = "Donations")
@SecurityRequirement(name = "bearerAuth")
public class DonationController {

    private final DonationService service;

    public DonationController(DonationService service) {
        this.service = service;
    }

    @PostMapping({"/api/v1/donations", "/donations"})
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasAnyRole('ADMIN', 'STAFF')")
    public DonationResponse record(@Valid @RequestBody RecordDonationRequest req) {
        return service.record(req);
    }

    @PatchMapping({"/api/v1/donations/{id}/screening", "/donations/{id}/screening"})
    @PreAuthorize("hasAnyRole('ADMIN', 'STAFF')")
    public DonationResponse updateScreening(@PathVariable Long id, @Valid @RequestBody ScreeningRequest req) {
        return service.updateScreening(id, req);
    }

    @GetMapping({"/api/v1/donations/{id}", "/donations/{id}"})
    @PreAuthorize("hasAnyRole('ADMIN', 'STAFF')")
    public DonationResponse getById(@PathVariable Long id) {
        return service.getById(id);
    }

    @GetMapping({"/api/v1/donations", "/donations"})
    @PreAuthorize("hasAnyRole('ADMIN', 'STAFF')")
    public PageResponse<DonationResponse> list(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fromDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate toDate,
            @RequestParam(required = false) Long donorId,
            @PageableDefault Pageable pageable) {
        ScreeningStatus screeningStatus = null;
        if (status != null && !status.isBlank() && !status.equalsIgnoreCase("ALL")) {
            try {
                screeningStatus = ScreeningStatus.valueOf(status.trim().toUpperCase());
            } catch (IllegalArgumentException ignored) {}
        }
        return service.list(screeningStatus, fromDate, toDate, donorId, pageable);
    }

    @GetMapping({"/api/v1/donors/me/donations", "/donors/me/donations"})
    @PreAuthorize("hasRole('DONOR')")
    public PageResponse<DonationResponse> listMine(@PageableDefault Pageable pageable) {
        return service.listMine(pageable);
    }
}
