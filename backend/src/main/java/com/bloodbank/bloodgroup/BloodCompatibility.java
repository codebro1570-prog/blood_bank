package com.bloodbank.bloodgroup;

import jakarta.persistence.*;

@Entity
@Table(name = "blood_compatibility")
public class BloodCompatibility {

    @EmbeddedId
    private BloodCompatibilityId id;

    @ManyToOne
    @MapsId("recipientGroupId")
    @JoinColumn(name = "recipient_group_id")
    private BloodGroup recipientGroup;

    @ManyToOne
    @MapsId("donorGroupId")
    @JoinColumn(name = "donor_group_id")
    private BloodGroup donorGroup;

    public BloodCompatibilityId getId() { return id; }
    public void setId(BloodCompatibilityId id) { this.id = id; }
    public BloodGroup getRecipientGroup() { return recipientGroup; }
    public void setRecipientGroup(BloodGroup recipientGroup) { this.recipientGroup = recipientGroup; }
    public BloodGroup getDonorGroup() { return donorGroup; }
    public void setDonorGroup(BloodGroup donorGroup) { this.donorGroup = donorGroup; }
}