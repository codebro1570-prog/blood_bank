package com.bloodbank.issue;

import com.bloodbank.inventory.BloodInventory;
import com.bloodbank.request.BloodRequest;
import com.bloodbank.user.User;
import jakarta.persistence.*;

import java.time.Instant;

@Entity
@Table(name = "blood_issue")
public class BloodIssue {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "request_id", nullable = false)
    private BloodRequest request;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "inventory_id", nullable = false, unique = true)
    private BloodInventory inventory;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "issued_by", nullable = false)
    private User issuedBy;

    @Column(name = "issued_at", nullable = false, updatable = false)
    private Instant issuedAt = Instant.now();

    public BloodIssue() {}

    public BloodIssue(BloodRequest request, BloodInventory inventory, User issuedBy) {
        this.request = request;
        this.inventory = inventory;
        this.issuedBy = issuedBy;
        this.issuedAt = Instant.now();
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public BloodRequest getRequest() { return request; }
    public void setRequest(BloodRequest request) { this.request = request; }

    public BloodInventory getInventory() { return inventory; }
    public void setInventory(BloodInventory inventory) { this.inventory = inventory; }

    public User getIssuedBy() { return issuedBy; }
    public void setIssuedBy(User issuedBy) { this.issuedBy = issuedBy; }

    public Instant getIssuedAt() { return issuedAt; }
    public void setIssuedAt(Instant issuedAt) { this.issuedAt = issuedAt; }
}
