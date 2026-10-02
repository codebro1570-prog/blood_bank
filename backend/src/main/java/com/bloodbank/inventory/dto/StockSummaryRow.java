package com.bloodbank.inventory.dto;

public record StockSummaryRow(
        String bloodGroup,
        long available,
        long nearExpiry,
        long expired,
        boolean lowStock,
        int threshold
) {
}
