package com.bloodbank.bloodgroup;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface BloodGroupRepository extends JpaRepository<BloodGroup, Long> {
    Optional<BloodGroup> findByCodeIgnoreCase(String code);
    Optional<BloodGroup> findByCode(String code);
}