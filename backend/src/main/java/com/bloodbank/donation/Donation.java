package com.bloodbank.donation;

import com.bloodbank.common.enums.ScreeningStatus;
import com.bloodbank.donor.Donor;
import com.bloodbank.user.User;
import jakarta.persistence.*;

import java.time.Instant;
import java.time.LocalDate;

@Entity
@Table(name = "donation")
public class Donation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "donor_id", nullable = false)
    private Donor donor;

    @Column(name = "donation_date", nullable = false)
    private LocalDate donationDate;

    @Column(name = "volume_ml", nullable = false)
    private Integer volumeMl;

    @Enumerated(EnumType.STRING)
    @Column(name = "screening_status", length = 10, nullable = false)
    private ScreeningStatus screeningStatus = ScreeningStatus.PENDING;

    @Column(name = "failure_reason")
    private String failureReason;

    @Column(name = "notes")
    private String notes;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "recorded_by", nullable = false)
    private User recordedBy;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt = Instant.now();

    public Donation() {}

    public Donation(Donor donor, LocalDate donationDate, Integer volumeMl, String notes, User recordedBy) {
        this.donor = donor;
        this.donationDate = donationDate;
        this.volumeMl = volumeMl;
        this.notes = notes;
        this.recordedBy = recordedBy;
        this.screeningStatus = ScreeningStatus.PENDING;
        this.createdAt = Instant.now();
        this.updatedAt = Instant.now();
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Donor getDonor() { return donor; }
    public void setDonor(Donor donor) { this.donor = donor; }

    public LocalDate getDonationDate() { return donationDate; }
    public void setDonationDate(LocalDate donationDate) { this.donationDate = donationDate; }

    public Integer getVolumeMl() { return volumeMl; }
    public void setVolumeMl(Integer volumeMl) { this.volumeMl = volumeMl; }

    public ScreeningStatus getScreeningStatus() { return screeningStatus; }
    public void setScreeningStatus(ScreeningStatus screeningStatus) { this.screeningStatus = screeningStatus; }

    public String getFailureReason() { return failureReason; }
    public void setFailureReason(String failureReason) { this.failureReason = failureReason; }

    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }

    public User getRecordedBy() { return recordedBy; }
    public void setRecordedBy(User recordedBy) { this.recordedBy = recordedBy; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }

    public Instant getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }
}
