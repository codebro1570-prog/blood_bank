package com.bloodbank.bloodgroup;

import jakarta.persistence.*;

@Entity
@Table(name = "blood_group")
public class BloodGroup {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "code", nullable = false, length = 3, unique = true)
    private String code;

    public Long getId() {
        return id;
    }

    public String getCode() {
        return code;
    }

    public void setCode(String code) {
        this.code = code;
    }
}