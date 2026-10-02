package com.bloodbank.admin;

import com.bloodbank.admin.dto.DashboardResponse;
import com.bloodbank.common.enums.RequestPriority;
import com.bloodbank.common.enums.RequestStatus;
import com.bloodbank.config.AppProperties;
import com.bloodbank.donation.DonationRepository;
import com.bloodbank.inventory.InventoryRepository;
import com.bloodbank.inventory.InventoryService;
import com.bloodbank.inventory.dto.StockSummaryRow;
import com.bloodbank.issue.IssueRepository;
import com.bloodbank.request.RequestRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.YearMonth;
import java.time.ZoneOffset;
import java.util.List;

@Service
@Transactional(readOnly = true)
public class DashboardService {

    private final InventoryService inventoryService;
    private final InventoryRepository inventoryRepo;
    private final RequestRepository requestRepo;
    private final DonationRepository donationRepo;
    private final IssueRepository issueRepo;
    private final AppProperties appProperties;

    public DashboardService(InventoryService inventoryService,
                            InventoryRepository inventoryRepo,
                            RequestRepository requestRepo,
                            DonationRepository donationRepo,
                            IssueRepository issueRepo,
                            AppProperties appProperties) {
        this.inventoryService = inventoryService;
        this.inventoryRepo = inventoryRepo;
        this.requestRepo = requestRepo;
        this.donationRepo = donationRepo;
        this.issueRepo = issueRepo;
        this.appProperties = appProperties;
    }

    public DashboardResponse getDashboard() {
        LocalDate today = LocalDate.now();
        YearMonth currentMonth = YearMonth.from(today);
        LocalDate startOfMonth = currentMonth.atDay(1);
        LocalDate endOfMonth = currentMonth.atEndOfMonth();

        List<StockSummaryRow> stockByGroup = inventoryService.summary();
        long pendingRequests = requestRepo.countByStatus(RequestStatus.PENDING);
        long emergencyPending = requestRepo.countByStatusAndPriority(RequestStatus.PENDING, RequestPriority.EMERGENCY);

        LocalDate nearExpiryThreshold = today.plusDays(appProperties.getNearExpiryDays());
        long nearExpiryCount = inventoryRepo.countNearExpiry(today, nearExpiryThreshold);

        long todaysDonations = donationRepo.countByDonationDate(today);

        long issuedThisMonth = issueRepo.countIssuedBetween(
                startOfMonth.atStartOfDay().toInstant(ZoneOffset.UTC),
                endOfMonth.plusDays(1).atStartOfDay().toInstant(ZoneOffset.UTC)
        );

        long expiredThisMonth = inventoryRepo.countExpiredBetween(startOfMonth, endOfMonth);

        return new DashboardResponse(
                stockByGroup,
                pendingRequests,
                emergencyPending,
                nearExpiryCount,
                todaysDonations,
                issuedThisMonth,
                expiredThisMonth
        );
    }
}
