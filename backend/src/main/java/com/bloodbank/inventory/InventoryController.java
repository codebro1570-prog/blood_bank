package com.bloodbank.inventory;

import com.bloodbank.common.dto.PageResponse;
import com.bloodbank.common.enums.UnitStatus;
import com.bloodbank.inventory.dto.AvailabilityResponse;
import com.bloodbank.inventory.dto.DiscardRequest;
import com.bloodbank.inventory.dto.StockSummaryRow;
import com.bloodbank.inventory.dto.UnitResponse;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@Tag(name = "Inventory")
@SecurityRequirement(name = "bearerAuth")
@PreAuthorize("hasAnyRole('ADMIN', 'STAFF')")
public class InventoryController {

    private final InventoryService service;

    public InventoryController(InventoryService service) {
        this.service = service;
    }

    @GetMapping({"/api/v1/inventory", "/inventory", "/api/v1/inventory/units", "/inventory/units"})
    public PageResponse<UnitResponse> list(
            @RequestParam(required = false) Long bloodGroupId,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String unitNumber,
            @PageableDefault Pageable pageable) {
        UnitStatus s = null;
        if (status != null && !status.isBlank() && !status.equalsIgnoreCase("ALL")) {
            try {
                s = UnitStatus.valueOf(status.trim().toUpperCase());
            } catch (IllegalArgumentException ignored) {}
        }
        return service.list(bloodGroupId, s, unitNumber, pageable);
    }

    @GetMapping({"/api/v1/inventory/summary", "/inventory/summary"})
    public List<StockSummaryRow> summary() {
        return service.summary();
    }

    @GetMapping({"/api/v1/inventory/availability", "/inventory/availability"})
    public AvailabilityResponse checkAvailability(
            @RequestParam Long bloodGroupId,
            @RequestParam(defaultValue = "1") int requestedUnits,
            @RequestParam(defaultValue = "false") boolean emergency) {
        return service.checkAvailability(bloodGroupId, requestedUnits, emergency);
    }

    @GetMapping({"/api/v1/inventory/{id}", "/inventory/{id}"})
    public UnitResponse getById(@PathVariable Long id) {
        return service.getById(id);
    }

    @PostMapping({"/api/v1/inventory/{id}/discard", "/inventory/{id}/discard", "/api/v1/inventory/units/{id}/discard", "/inventory/units/{id}/discard"})
    public UnitResponse discard(@PathVariable Long id, @Valid @RequestBody DiscardRequest req) {
        return service.discard(id, req);
    }
}
