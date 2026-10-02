package com.bloodbank.bloodgroup;

import com.bloodbank.bloodgroup.dto.BloodGroupResponse;
import com.bloodbank.bloodgroup.dto.CompatibleDonorsResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/blood-groups")
@Tag(name = "Blood Groups")
public class BloodGroupController {

    private final BloodGroupService service;

    public BloodGroupController(BloodGroupService service) {
        this.service = service;
    }

    @GetMapping
    public List<BloodGroupResponse> list() {
        return service.list();
    }

    @GetMapping("/{code}/compatible-donors")
    public ResponseEntity<CompatibleDonorsResponse> compatibleDonors(@PathVariable String code) {
        BloodGroup recipient = service.findByCode(code);
        return ResponseEntity.ok(new CompatibleDonorsResponse(recipient.getCode(),
                service.compatibleDonorGroups(recipient.getCode())));
    }
}