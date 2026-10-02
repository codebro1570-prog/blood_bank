package com.bloodbank.donor;

import com.bloodbank.bloodgroup.BloodGroup;
import com.bloodbank.bloodgroup.BloodGroupRepository;
import com.bloodbank.common.dto.PageResponse;
import com.bloodbank.donor.dto.*;
import com.bloodbank.exception.BusinessException;
import com.bloodbank.exception.ResourceNotFoundException;
import com.bloodbank.security.SecurityUtils;
import com.bloodbank.user.User;
import com.bloodbank.user.UserRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Comparator;
import java.util.List;

@Service
@Transactional(readOnly = true)
public class DonorService {

    private final DonorRepository donors;
    private final DonationQueryPort donationPort;
    private final EligibilityService eligibilityService;
    private final BloodGroupRepository bloodGroups;
    private final UserRepository users;

    public DonorService(DonorRepository donors,
                        DonationQueryPort donationPort,
                        EligibilityService eligibilityService,
                        BloodGroupRepository bloodGroups,
                        UserRepository users) {
        this.donors = donors;
        this.donationPort = donationPort;
        this.eligibilityService = eligibilityService;
        this.bloodGroups = bloodGroups;
        this.users = users;
    }

    // ---------- donor self-service ----------
    public DonorProfileResponse getMyProfile() {
        return toProfile(currentDonor(), true);
    }

    @Transactional
    public DonorProfileResponse updateMyProfile(UpdateDonorRequest req) {
        Donor d = currentDonor();
        if (req.fullName() != null && !req.fullName().isBlank()) {
            User u = d.getUser();
            if (u != null) {
                u.setFullName(req.fullName().trim());
                users.save(u);
            }
        }
        if (req.phone() != null) d.setPhone(req.phone().trim());
        if (req.weightKg() != null) d.setWeightKg(req.weightKg());
        if (req.city() != null) d.setCity(req.city().trim());
        // Blood group and DOB are not updatable
        return toProfile(donors.save(d), false);
    }

    public EligibilityResponse getMyEligibility() {
        return eligibilityService.evaluate(currentDonor());
    }

    public List<DonationSummary> getMyDonations() {
        return donationPort.findByDonorId(currentDonor().getId());
    }

    // ---------- shared with other modules ----------
    public EligibilityResponse getEligibility(Long donorId) {
        return eligibilityService.evaluate(find(donorId));
    }

    public boolean isEligible(Long donorId) {
        return eligibilityService.evaluate(find(donorId)).eligible();
    }

    public boolean hasDonations(Long donorId) {
        return donationPort.hasDonations(donorId);
    }

    // ---------- staff / admin ----------
    public PageResponse<DonorProfileResponse> search(String q, String bloodGroup, String city, Pageable pageable) {
        Long bgId = null;
        if (bloodGroup != null && !bloodGroup.isBlank()) {
            bgId = bloodGroups.findByCodeIgnoreCase(bloodGroup.trim())
                    .map(BloodGroup::getId)
                    .orElse(null);
            if (bgId == null) {
                try {
                    bgId = Long.parseLong(bloodGroup.trim());
                } catch (NumberFormatException ignored) {}
            }
        }
        String pattern = (q == null || q.isBlank()) ? null : q.trim();
        Page<Donor> page = donors.search(pattern, bgId, blankToNull(city), pageable);
        return PageResponse.from(page, d -> toProfile(d, false));
    }

    public DonorDetailResponse getDetail(Long id) {
        Donor d = find(id);
        List<DonationSummary> hist = donationPort.findByDonorId(id);
        return new DonorDetailResponse(toProfile(d, true), eligibilityService.evaluate(d), hist);
    }

    public PageResponse<DonorProfileResponse> listEligible(String bloodGroup, Pageable pageable) {
        Long bgId = null;
        if (bloodGroup != null && !bloodGroup.isBlank()) {
            bgId = bloodGroups.findByCodeIgnoreCase(bloodGroup.trim())
                    .map(BloodGroup::getId)
                    .orElse(null);
            if (bgId == null) {
                try {
                    bgId = Long.parseLong(bloodGroup.trim());
                } catch (NumberFormatException ignored) {}
            }
        }
        final Long filterBgId = bgId;
        List<Donor> allDonors = donors.findAll();
        List<Donor> eligibleList = allDonors.stream()
                .filter(d -> filterBgId == null || d.getBloodGroupId().equals(filterBgId))
                .filter(d -> eligibilityService.evaluate(d).eligible())
                .sorted(Comparator.comparing(Donor::getLastDonationDate, Comparator.nullsFirst(Comparator.naturalOrder())))
                .toList();

        int start = (int) pageable.getOffset();
        int end = Math.min((start + pageable.getPageSize()), eligibleList.size());
        List<Donor> paged = (start <= end && start < eligibleList.size()) ? eligibleList.subList(start, end) : List.of();
        Page<Donor> page = new PageImpl<>(paged, pageable, eligibleList.size());
        return PageResponse.from(page, d -> toProfile(d, false));
    }

    public DonorProfileResponse toProfile(Donor d, boolean includeDonations) {
        String bgCode = bloodGroups.findById(d.getBloodGroupId())
                .map(BloodGroup::getCode)
                .orElse(String.valueOf(d.getBloodGroupId()));
        List<DonationSummary> history = donationPort.findByDonorId(d.getId());
        boolean eligible = eligibilityService.evaluate(d).eligible();
        String name = d.getUser() != null ? d.getUser().getFullName() : "";
        String email = d.getUser() != null ? d.getUser().getEmail() : "";
        return new DonorProfileResponse(
                d.getId(),
                name,
                email,
                d.getPhone(),
                d.getDob(),
                d.getGender(),
                d.getWeightKg(),
                bgCode,
                d.getCity(),
                d.getLastDonationDate(),
                history.size(),
                eligible,
                includeDonations ? history : null
        );
    }

    public Donor currentDonor() {
        Long userId = SecurityUtils.currentUserId();
        return donors.findByUserId(userId)
                .orElseThrow(() -> new BusinessException("DONOR_NOT_FOUND", HttpStatus.NOT_FOUND, "Donor profile not found"));
    }

    public Donor find(Long id) {
        return donors.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Donor not found with id " + id));
    }

    private static String blankToNull(String s) {
        return (s == null || s.isBlank()) ? null : s.trim();
    }
}