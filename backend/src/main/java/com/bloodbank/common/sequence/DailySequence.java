package com.bloodbank.common.sequence;

import jakarta.persistence.Column;
import jakarta.persistence.EmbeddedId;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;

import java.time.LocalDate;

@Entity
@Table(name = "daily_sequence")
public class DailySequence {

    @EmbeddedId
    private DailySequenceId id;

    @Column(name = "current_value", nullable = false)
    private int currentValue;

    public DailySequence() {}

    public DailySequence(String seqType, LocalDate seqDate, int currentValue) {
        this.id = new DailySequenceId(seqType, seqDate);
        this.currentValue = currentValue;
    }

    public DailySequenceId getId() { return id; }
    public void setId(DailySequenceId id) { this.id = id; }

    public int getCurrentValue() { return currentValue; }
    public void setCurrentValue(int currentValue) { this.currentValue = currentValue; }
}
