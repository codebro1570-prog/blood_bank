package com.bloodbank.bloodgroup;

import com.bloodbank.bloodgroup.dto.BloodGroupResponse;
import com.bloodbank.exception.ResourceNotFoundException;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@Transactional(readOnly = true)
public class BloodGroupService {

    private final BloodGroupRepository groups;
    private final CompatibilityRepository compatibility;

    public BloodGroupService(BloodGroupRepository groups, CompatibilityRepository compatibility) {
        this.groups = groups;
        this.compatibility = compatibility;
    }

    /** Case-insensitive. Throws ResourceNotFoundException (404 NOT_FOUND) for unknown codes. */
    public BloodGroup findByCode(String code) {
        return groups.findByCodeIgnoreCase(normalize(code))
                .orElseThrow(() -> new ResourceNotFoundException("Blood group not found: " + code));
    }

    @Cacheable(value = "blood_groups", key = "'all'")
    public List<BloodGroupResponse> list() {
        return groups.findAll(Sort.by("id")).stream()
                .map(BloodGroupResponse::from).toList();
    }

    /** All donor groups the recipient can receive from; the exact group is first. */
    @Cacheable(value = "blood_group_compatibility", key = "#recipientCode")
    public List<BloodGroupResponse> compatibleDonorGroups(String recipientCode) {
        BloodGroup recipient = findByCode(recipientCode);
        List<Long> ids = compatibleDonorGroupIds(recipient.getId(), true);
        Map<Long, BloodGroup> byId = groups.findAllById(ids).stream()
                .collect(Collectors.toMap(BloodGroup::getId, Function.identity()));
        return ids.stream().map(byId::get).filter(Objects::nonNull)
                .map(BloodGroupResponse::from).toList();
    }

    /**
     * emergency=false: only the exact group.
     * emergency=true: all compatible groups, exact group FIRST, the rest ordered by id.
     */
    @Cacheable(value = "blood_group_compatibility_ids", key = "#recipientGroupId + '-' + #emergency")
    public List<Long> compatibleDonorGroupIds(Long recipientGroupId, boolean emergency) {
        if (!emergency) {
            return List.of(recipientGroupId);
        }
        List<Long> compatible = compatibility.findDonorGroupIdsByRecipient(recipientGroupId);
        List<Long> result = new ArrayList<>(compatible.size() + 1);
        result.add(recipientGroupId);
        for (Long id : compatible) {
            if (!id.equals(recipientGroupId)) {
                result.add(id);
            }
        }
        return result;
    }

    static String normalize(String code) {
        if (code == null) return "";
        String c = code.toUpperCase();
        if (c.endsWith(" ")) {
            return c.trim() + "+";
        }
        return c.trim();
    }
}