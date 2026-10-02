package com.bloodbank.admin.dto;

import com.bloodbank.inventory.dto.StockSummaryRow;

import java.util.List;

public record DashboardResponse(
        List<StockSummaryRow> stockByGroup,
        long pendingRequests,
        long emergencyPending,
        long nearExpiryCount,
        long todaysDonations,
        long issuedThisMonth,
        long expiredThisMonth
) {
}
