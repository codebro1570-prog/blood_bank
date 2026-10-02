package com.bloodbank.inventory;

import com.bloodbank.bloodgroup.BloodGroup;
import com.bloodbank.common.enums.UnitStatus;
import com.bloodbank.user.User;
import jakarta.persistence.*;

import java.time.Instant;
import java.time.LocalDate;

@Entity
@Table(name = "blood_inventory")
public class BloodInventory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "unit_number", length = 25, nullable = false, unique = true)
    private String unitNumber;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "blood_group_id", nullable = false)
    private BloodGroup bloodGroup;

    @Column(name = "donation_id", nullable = false, unique = true)
    private Long donationId;

    @Column(name = "collection_date", nullable = false)
    private LocalDate collectionDate;

    @Column(name = "expiry_date", nullable = false)
    private LocalDate expiryDate;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", length = 12, nullable = false)
    private UnitStatus status = UnitStatus.AVAILABLE;

    @Column(name = "discard_reason")
    private String discardReason;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "discarded_by")
    private User discardedBy;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    @Version
    @Column(name = "version", nullable = false)
    private Long version = 0L;

    public BloodInventory() {}

    public BloodInventory(String unitNumber, BloodGroup bloodGroup, Long donationId,
                          LocalDate collectionDate, LocalDate expiryDate) {
        this.unitNumber = unitNumber;
        this.bloodGroup = bloodGroup;
        this.donationId = donationId;
        this.collectionDate = collectionDate;
        this.expiryDate = expiryDate;
        this.status = UnitStatus.AVAILABLE;
        this.createdAt = Instant.now();
        this.version = 0L;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getUnitNumber() { return unitNumber; }
    public void setUnitNumber(String unitNumber) { this.unitNumber = unitNumber; }

    public BloodGroup getBloodGroup() { return bloodGroup; }
    public void setBloodGroup(BloodGroup bloodGroup) { this.bloodGroup = bloodGroup; }

    public Long getDonationId() { return donationId; }
    public void setDonationId(Long donationId) { this.donationId = donationId; }

    public LocalDate getCollectionDate() { return collectionDate; }
    public void setCollectionDate(LocalDate collectionDate) { this.collectionDate = collectionDate; }

    public LocalDate getExpiryDate() { return expiryDate; }
    public void setExpiryDate(LocalDate expiryDate) { this.expiryDate = expiryDate; }

    public UnitStatus getStatus() { return status; }
    public void setStatus(UnitStatus status) { this.status = status; }

    public String getDiscardReason() { return discardReason; }
    public void setDiscardReason(String discardReason) { this.discardReason = discardReason; }

    public User getDiscardedBy() { return discardedBy; }
    public void setDiscardedBy(User discardedBy) { this.discardedBy = discardedBy; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }

    public Long getVersion() { return version; }
    public void setVersion(Long version) { this.version = version; }
}
