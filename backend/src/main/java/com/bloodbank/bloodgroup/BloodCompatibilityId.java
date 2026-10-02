package com.bloodbank.bloodgroup;

import java.io.Serializable;
import java.util.Objects;

public class BloodCompatibilityId implements Serializable {

    private Long recipientGroupId;
    private Long donorGroupId;

    public BloodCompatibilityId() {}

    public BloodCompatibilityId(Long recipientGroupId, Long donorGroupId) {
        this.recipientGroupId = recipientGroupId;
        this.donorGroupId = donorGroupId;
    }

    public Long getRecipientGroupId() { return recipientGroupId; }
    public void setRecipientGroupId(Long recipientGroupId) { this.recipientGroupId = recipientGroupId; }
    public Long getDonorGroupId() { return donorGroupId; }
    public void setDonorGroupId(Long donorGroupId) { this.donorGroupId = donorGroupId; }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof BloodCompatibilityId that)) return false;
        return Objects.equals(recipientGroupId, that.recipientGroupId) &&
                Objects.equals(donorGroupId, that.donorGroupId);
    }

    @Override
    public int hashCode() {
        return Objects.hash(recipientGroupId, donorGroupId);
    }
}