package com.bloodbank.common.sequence;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;

import java.io.Serializable;
import java.time.LocalDate;
import java.util.Objects;

@Embeddable
public class DailySequenceId implements Serializable {

    @Column(name = "seq_type", length = 20, nullable = false)
    private String seqType;

    @Column(name = "seq_date", nullable = false)
    private LocalDate seqDate;

    public DailySequenceId() {}

    public DailySequenceId(String seqType, LocalDate seqDate) {
        this.seqType = seqType;
        this.seqDate = seqDate;
    }

    public String getSeqType() { return seqType; }
    public void setSeqType(String seqType) { this.seqType = seqType; }

    public LocalDate getSeqDate() { return seqDate; }
    public void setSeqDate(LocalDate seqDate) { this.seqDate = seqDate; }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        DailySequenceId that = (DailySequenceId) o;
        return Objects.equals(seqType, that.seqType) && Objects.equals(seqDate, that.seqDate);
    }

    @Override
    public int hashCode() {
        return Objects.hash(seqType, seqDate);
    }
}
