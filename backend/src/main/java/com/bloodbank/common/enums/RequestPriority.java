package com.bloodbank.common.enums;

public enum RequestPriority {
    EMERGENCY(1), URGENT(2), NORMAL(3);
    private final int rank;
    RequestPriority(int rank) { this.rank = rank; }
    public int rank() { return rank; }
}