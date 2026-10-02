package com.bloodbank.request;

import com.bloodbank.common.dto.PageResponse;
import com.bloodbank.common.enums.RequestPriority;
import com.bloodbank.common.enums.RequestStatus;
import com.bloodbank.inventory.dto.AvailabilityResponse;
import com.bloodbank.issue.dto.IssueResult;
import com.bloodbank.request.dto.CreateRequestRequest;
import com.bloodbank.request.dto.RejectRequest;
import com.bloodbank.request.dto.RequestResponse;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@Tag(name = "Requests")
@SecurityRequirement(name = "bearerAuth")
public class RequestController {

    private final RequestService service;

    public RequestController(RequestService service) {
        this.service = service;
    }

    @PostMapping({"/api/v1/requests", "/requests"})
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasRole('HOSPITAL')")
    public RequestResponse create(
            @RequestHeader(value = "Idempotency-Key", required = false) String idempotencyKey,
            @Valid @RequestBody CreateRequestRequest req) {
        return service.create(req, idempotencyKey);
    }

    @GetMapping({"/api/v1/requests/mine", "/requests/mine"})
    @PreAuthorize("hasRole('HOSPITAL')")
    public PageResponse<RequestResponse> mine(
            @RequestParam(required = false) String status,
            @PageableDefault Pageable pageable) {
        RequestStatus reqStatus = null;
        if (status != null && !status.isBlank() && !status.equalsIgnoreCase("ALL")) {
            try {
                reqStatus = RequestStatus.valueOf(status.trim().toUpperCase());
            } catch (IllegalArgumentException ignored) {
            }
        }
        return service.mine(reqStatus, pageable);
    }

    @GetMapping({"/api/v1/requests/queue", "/requests/queue", "/api/v1/requests", "/requests"})
    @PreAuthorize("hasAnyRole('ADMIN', 'STAFF')")
    public PageResponse<RequestResponse> queue(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String priority,
            @PageableDefault Pageable pageable) {
        java.util.List<RequestStatus> statusList = new java.util.ArrayList<>();
        if (status != null && !status.isBlank() && !status.equalsIgnoreCase("ALL")) {
            for (String part : status.split(",")) {
                String trimmed = part.trim().toUpperCase();
                if (!trimmed.isEmpty() && !trimmed.equalsIgnoreCase("ALL")) {
                    try {
                        statusList.add(RequestStatus.valueOf(trimmed));
                    } catch (IllegalArgumentException ignored) {
                    }
                }
            }
        }

        RequestPriority reqPriority = null;
        if (priority != null && !priority.isBlank() && !priority.equalsIgnoreCase("ALL")) {
            try {
                reqPriority = RequestPriority.valueOf(priority.trim().toUpperCase());
            } catch (IllegalArgumentException ignored) {
            }
        }

        return service.queue(statusList.isEmpty() ? null : statusList, reqPriority, pageable);
    }

    @GetMapping({"/api/v1/requests/{id}", "/requests/{id}"})
    @PreAuthorize("hasAnyRole('ADMIN', 'STAFF', 'HOSPITAL')")
    public RequestResponse getById(@PathVariable Long id) {
        return service.getById(id);
    }

    @GetMapping({"/api/v1/requests/{id}/availability", "/requests/{id}/availability"})
    @PreAuthorize("hasAnyRole('ADMIN', 'STAFF')")
    public AvailabilityResponse getAvailability(@PathVariable Long id) {
        return service.getAvailability(id);
    }

    @PostMapping({"/api/v1/requests/{id}/approve", "/requests/{id}/approve"})
    @PreAuthorize("hasAnyRole('ADMIN', 'STAFF')")
    public RequestResponse approve(@PathVariable Long id) {
        return service.approve(id);
    }

    @PostMapping({"/api/v1/requests/{id}/reject", "/requests/{id}/reject"})
    @PreAuthorize("hasAnyRole('ADMIN', 'STAFF')")
    public RequestResponse reject(@PathVariable Long id, @Valid @RequestBody RejectRequest req) {
        return service.reject(id, req);
    }

    @PostMapping({"/api/v1/requests/{id}/cancel", "/requests/{id}/cancel"})
    @PreAuthorize("hasRole('HOSPITAL')")
    public RequestResponse cancel(@PathVariable Long id) {
        return service.cancel(id);
    }

    @PostMapping({"/api/v1/requests/{id}/issue", "/requests/{id}/issue"})
    @PreAuthorize("hasAnyRole('ADMIN', 'STAFF')")
    public IssueResult issue(@PathVariable Long id) {
        return service.issue(id);
    }

    @PostMapping({"/api/v1/requests/{id}/approve-and-issue", "/requests/{id}/approve-and-issue"})
    @PreAuthorize("hasAnyRole('ADMIN', 'STAFF')")
    public IssueResult approveAndIssue(@PathVariable Long id) {
        return service.approveAndIssue(id);
    }
}
