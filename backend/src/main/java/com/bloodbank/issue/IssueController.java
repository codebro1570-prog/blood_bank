package com.bloodbank.issue;

import com.bloodbank.common.dto.PageResponse;
import com.bloodbank.issue.dto.IssueRecordResponse;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@Tag(name = "Issues")
@SecurityRequirement(name = "bearerAuth")
public class IssueController {

    private final IssueService service;

    public IssueController(IssueService service) {
        this.service = service;
    }

    @GetMapping({"/api/v1/issues", "/issues"})
    @PreAuthorize("hasAnyRole('ADMIN', 'STAFF')")
    public PageResponse<IssueRecordResponse> list(@PageableDefault Pageable pageable) {
        return service.list(pageable);
    }

    @GetMapping({"/api/v1/issues/mine", "/issues/mine"})
    @PreAuthorize("hasRole('HOSPITAL')")
    public PageResponse<IssueRecordResponse> listMine(@PageableDefault Pageable pageable) {
        return service.listMine(pageable);
    }
}
