package com.bloodbank.bloodgroup.dto;

import java.util.List;

public record CompatibleDonorsResponse(String recipientGroup, List<BloodGroupResponse> donorGroups) {}