package com.bloodbank.request;

import com.bloodbank.common.enums.RequestStatus;
import com.bloodbank.exception.InvalidStateException;
import org.springframework.stereotype.Component;

@Component
public class RequestStateMachine {

    public void assertTransition(RequestStatus from, RequestStatus to) {
        boolean valid = switch (from) {
            case PENDING -> to == RequestStatus.APPROVED ||
                            to == RequestStatus.REJECTED ||
                            to == RequestStatus.CANCELLED ||
                            to == RequestStatus.FULFILLED; // Emergency approve-and-issue
            case APPROVED -> to == RequestStatus.FULFILLED;
            case FULFILLED, REJECTED, CANCELLED -> false;
        };

        if (!valid) {
            throw new InvalidStateException("Illegal request transition from " + from + " to " + to);
        }
    }
}
