package com.bloodbank.common.sequence;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;

@Service
public class DailySequenceService {

    private static final DateTimeFormatter DATE_FMT = DateTimeFormatter.ofPattern("yyyyMMdd");
    private final DailySequenceRepository repository;

    public DailySequenceService(DailySequenceRepository repository) {
        this.repository = repository;
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public int next(String seqType, LocalDate seqDate) {
        DailySequenceId id = new DailySequenceId(seqType, seqDate);
        DailySequence seq = repository.findByIdForUpdate(id).orElse(null);
        if (seq == null) {
            seq = new DailySequence(seqType, seqDate, 1);
        } else {
            seq.setCurrentValue(seq.getCurrentValue() + 1);
        }
        seq = repository.saveAndFlush(seq);
        return seq.getCurrentValue();
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public String nextUnitNumber(LocalDate date) {
        int seq = next("UNIT", date);
        return String.format("BB-%s-%04d", date.format(DATE_FMT), seq);
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public String nextRequestNumber(LocalDate date) {
        int seq = next("REQUEST", date);
        return String.format("REQ-%s-%04d", date.format(DATE_FMT), seq);
    }
}
