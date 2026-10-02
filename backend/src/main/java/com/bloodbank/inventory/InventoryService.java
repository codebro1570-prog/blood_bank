package com.bloodbank.inventory;

import com.bloodbank.audit.AuditRecorder;
import com.bloodbank.bloodgroup.BloodGroup;
import com.bloodbank.bloodgroup.BloodGroupRepository;
import com.bloodbank.bloodgroup.BloodGroupService;
import com.bloodbank.common.dto.PageResponse;
import com.bloodbank.common.enums.UnitStatus;
import com.bloodbank.config.AppProperties;
import com.bloodbank.exception.InvalidStateException;
import com.bloodbank.exception.ResourceNotFoundException;
import com.bloodbank.inventory.dto.AvailabilityResponse;
import com.bloodbank.inventory.dto.DiscardRequest;
import com.bloodbank.inventory.dto.StockSummaryRow;
import com.bloodbank.inventory.dto.UnitResponse;
import com.bloodbank.security.SecurityUtils;
import com.bloodbank.user.User;
import com.bloodbank.user.UserRepository;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;

@Service
@Transactional
public class InventoryService {

    private final InventoryRepository inventoryRepo;
    private final BloodGroupRepository bloodGroupRepo;
    private final BloodGroupService bloodGroupService;
    private final UserRepository userRepo;
    private final AuditRecorder auditRecorder;
    private final AppProperties appProperties;

    public InventoryService(InventoryRepository inventoryRepo,
                            BloodGroupRepository bloodGroupRepo,
                            BloodGroupService bloodGroupService,
                            UserRepository userRepo,
                            AuditRecorder auditRecorder,
                            AppProperties appProperties) {
        this.inventoryRepo = inventoryRepo;
        this.bloodGroupRepo = bloodGroupRepo;
        this.bloodGroupService = bloodGroupService;
        this.userRepo = userRepo;
        this.auditRecorder = auditRecorder;
        this.appProperties = appProperties;
    }

    @Transactional(readOnly = true)
    public PageResponse<UnitResponse> list(Long bloodGroupId, UnitStatus status, String unitNumber, Pageable pageable) {
        String uNo = (unitNumber == null || unitNumber.isBlank()) ? null : unitNumber.trim();
        Page<BloodInventory> page = inventoryRepo.search(bloodGroupId, status, uNo, pageable);
        return PageResponse.from(page, this::toUnitResponse);
    }

    @Transactional(readOnly = true)
    public UnitResponse getById(Long id) {
        BloodInventory unit = inventoryRepo.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Unit not found with id " + id));
        return toUnitResponse(unit);
    }

    @Cacheable(value = "stock_summary", key = "'all'")
    @Transactional(readOnly = true)
    public List<StockSummaryRow> summary() {
        LocalDate today = LocalDate.now();
        LocalDate nearExpiryDate = today.plusDays(appProperties.getNearExpiryDays());
        int threshold = appProperties.getLowStockThreshold();

        List<BloodGroup> groups = bloodGroupRepo.findAll();
        List<StockSummaryRow> rows = new ArrayList<>();

        for (BloodGroup bg : groups) {
            long available = inventoryRepo.countByBloodGroupIdAndStatusAndExpiryDateAfter(bg.getId(), UnitStatus.AVAILABLE, today);
            List<BloodInventory> nearList = inventoryRepo.findNearExpiry(today, nearExpiryDate);
            long near = nearList.stream().filter(u -> u.getBloodGroup().getId().equals(bg.getId())).count();
            long expired = inventoryRepo.countByBloodGroupIdAndStatusAndExpiryDateAfter(bg.getId(), UnitStatus.EXPIRED, today.minusYears(10));
            boolean lowStock = available < threshold;

            rows.add(new StockSummaryRow(bg.getCode(), available, near, expired, lowStock, threshold));
        }
        return rows;
    }

    @CacheEvict(value = "stock_summary", allEntries = true)
    public UnitResponse discard(Long id, DiscardRequest req) {
        BloodInventory unit = inventoryRepo.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Unit not found with id " + id));

        if (unit.getStatus() != UnitStatus.AVAILABLE) {
            throw new InvalidStateException("Only AVAILABLE units can be discarded (current: " + unit.getStatus() + ")");
        }

        Long currentUserId = SecurityUtils.currentUserId();
        User user = userRepo.findById(currentUserId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        unit.setStatus(UnitStatus.DISCARDED);
        unit.setDiscardReason(req.reason().trim());
        unit.setDiscardedBy(user);
        unit = inventoryRepo.save(unit);

        auditRecorder.record("DISCARD_UNIT", "BLOOD_INVENTORY", unit.getId(),
                "Unit " + unit.getUnitNumber() + " discarded. Reason: " + req.reason().trim());

        return toUnitResponse(unit);
    }

    @Transactional(readOnly = true)
    public AvailabilityResponse checkAvailability(Long bloodGroupId, int requestedUnits, boolean emergency) {
        BloodGroup bg = bloodGroupRepo.findById(bloodGroupId)
                .orElseThrow(() -> new ResourceNotFoundException("Blood group not found with id " + bloodGroupId));

        LocalDate today = LocalDate.now();
        long exactAvailable = inventoryRepo.countByBloodGroupIdAndStatusAndExpiryDateAfter(bg.getId(), UnitStatus.AVAILABLE, today);

        List<Long> candidateIds = bloodGroupService.compatibleDonorGroupIds(bg.getId(), emergency);
        long compatibleTotal = 0;
        for (Long gid : candidateIds) {
            compatibleTotal += inventoryRepo.countByBloodGroupIdAndStatusAndExpiryDateAfter(gid, UnitStatus.AVAILABLE, today);
        }

        boolean sufficientExact = exactAvailable >= requestedUnits;
        boolean sufficientWithCompatible = compatibleTotal >= requestedUnits;
        boolean emergencyOnlyCompatible = !sufficientExact && sufficientWithCompatible;

        return new AvailabilityResponse(
                bg.getCode(),
                requestedUnits,
                exactAvailable,
                compatibleTotal,
                sufficientExact,
                sufficientWithCompatible,
                emergencyOnlyCompatible
        );
    }

    @CacheEvict(value = "stock_summary", allEntries = true)
    public int expireOverdueUnits() {
        return inventoryRepo.expireOverdueBatch(LocalDate.now());
    }

    private UnitResponse toUnitResponse(BloodInventory u) {
        long daysToExpiry = ChronoUnit.DAYS.between(LocalDate.now(), u.getExpiryDate());
        return new UnitResponse(
                u.getId(),
                u.getUnitNumber(),
                u.getBloodGroup().getCode(),
                u.getDonationId(),
                u.getCollectionDate(),
                u.getExpiryDate(),
                u.getStatus(),
                daysToExpiry
        );
    }
}
