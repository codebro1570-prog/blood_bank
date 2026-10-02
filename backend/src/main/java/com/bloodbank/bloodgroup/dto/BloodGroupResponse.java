package com.bloodbank.bloodgroup.dto;

import com.bloodbank.bloodgroup.BloodGroup;

public record BloodGroupResponse(Long id, String code) {
    public static BloodGroupResponse from(BloodGroup g) {
        return new BloodGroupResponse(g.getId(), g.getCode());
    }
}