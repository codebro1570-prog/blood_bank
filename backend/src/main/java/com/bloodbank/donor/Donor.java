package com.bloodbank.donor;

import com.bloodbank.common.enums.Gender;
import com.bloodbank.user.User;
import jakarta.persistence.*;
import java.time.LocalDate;

@Entity
@Table(name = "donor")
public class Donor {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false, unique = true)
    private Long userId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", insertable = false, updatable = false)
    private User user;

    @Column(name = "blood_group_id", nullable = false)
    private Long bloodGroupId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "blood_group_id", insertable = false, updatable = false)
    private com.bloodbank.bloodgroup.BloodGroup bloodGroup;

    @Column(name = "dob", nullable = false)
    private LocalDate dob;

    @Enumerated(EnumType.STRING)
    @Column(name = "gender", nullable = false, length = 10)
    private Gender gender;

    @Column(name = "weight_kg", nullable = false, precision = 5, scale = 2)
    private java.math.BigDecimal weightKg;

    @Column(name = "phone", nullable = false, length = 20)
    private String phone;

    @Column(name = "city", nullable = false, length = 80)
    private String city;

    @Column(name = "last_donation_date")
    private LocalDate lastDonationDate;

    @Column(name = "deferred_until")
    private LocalDate deferredUntil;

    @Column(name = "deferred_reason", length = 255)
    private String deferredReason;

    @Column(name = "created_at", nullable = false, updatable = false)
    private java.time.Instant createdAt;

    @PrePersist
    void onCreate() { createdAt = java.time.Instant.now(); }

    public Long getId() { return id; }
    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }
    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }
    public Long getBloodGroupId() { return bloodGroupId; }
    public void setBloodGroupId(Long bloodGroupId) { this.bloodGroupId = bloodGroupId; }
    public LocalDate getDob() { return dob; }
    public void setDob(LocalDate dob) { this.dob = dob; }
    public Gender getGender() { return gender; }
    public void setGender(Gender gender) { this.gender = gender; }
    public Double getWeightKg() { return weightKg != null ? weightKg.doubleValue() : null; }
    public java.math.BigDecimal getWeightKgBigDecimal() { return weightKg; }
    public void setWeightKg(Double weightKg) { this.weightKg = weightKg != null ? java.math.BigDecimal.valueOf(weightKg) : null; }
    public void setWeightKg(java.math.BigDecimal weightKg) { this.weightKg = weightKg; }
    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }
    public String getCity() { return city; }
    public void setCity(String city) { this.city = city; }
    public LocalDate getLastDonationDate() { return lastDonationDate; }
    public void setLastDonationDate(LocalDate d) { this.lastDonationDate = d; }
    public LocalDate getDeferredUntil() { return deferredUntil; }
    public void setDeferredUntil(LocalDate d) { this.deferredUntil = d; }
    public String getDeferredReason() { return deferredReason; }
    public String getDeferralReason() { return deferredReason; }
    public void setDeferredReason(String r) { this.deferredReason = r; }
    public com.bloodbank.bloodgroup.BloodGroup getBloodGroup() { return bloodGroup; }
    public void setBloodGroup(com.bloodbank.bloodgroup.BloodGroup bloodGroup) { this.bloodGroup = bloodGroup; }
    public java.time.Instant getCreatedAt() { return createdAt; }
}