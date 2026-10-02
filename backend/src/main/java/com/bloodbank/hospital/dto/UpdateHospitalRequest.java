package com.bloodbank.hospital.dto;

import jakarta.validation.constraints.Size;

public record UpdateHospitalRequest(
        @Size(max = 120) String contactPerson,
        @Size(max = 20) String phone,
        @Size(max = 255) String address,
        @Size(max = 80) String city
) {}