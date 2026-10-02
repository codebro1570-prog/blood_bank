package com.bloodbank.config;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.validation.annotation.Validated;

@Validated
@ConfigurationProperties(prefix = "bloodbank")
public class AppProperties {

    @Min(1) private int shelfLifeDays = 42;
    @Min(1) private int donationGapDays = 90;
    @Min(1) private int minAge = 18;
    @Min(1) private int maxAge = 65;
    @Min(1) private int minWeightKg = 50;
    @Min(1) private int minVolumeMl = 300;
    @Min(1) private int maxVolumeMl = 500;
    @Min(1) private int maxUnitsPerRequest = 10;
    @Min(0) private int lowStockThreshold = 10;
    @Min(0) private int nearExpiryDays = 7;
    @Min(0) private int nearExpiryAlertDays = 3;
    @Min(1) private int duplicateWindowMinutes = 10;

    private Jwt jwt = new Jwt();

    public int getShelfLifeDays() { return shelfLifeDays; }
    public void setShelfLifeDays(int shelfLifeDays) { this.shelfLifeDays = shelfLifeDays; }

    public int getDonationGapDays() { return donationGapDays; }
    public void setDonationGapDays(int donationGapDays) { this.donationGapDays = donationGapDays; }

    public int getMinAge() { return minAge; }
    public void setMinAge(int minAge) { this.minAge = minAge; }

    public int getMaxAge() { return maxAge; }
    public void setMaxAge(int maxAge) { this.maxAge = maxAge; }

    public int getMinWeightKg() { return minWeightKg; }
    public void setMinWeightKg(int minWeightKg) { this.minWeightKg = minWeightKg; }

    public int getMinVolumeMl() { return minVolumeMl; }
    public void setMinVolumeMl(int minVolumeMl) { this.minVolumeMl = minVolumeMl; }

    public int getMaxVolumeMl() { return maxVolumeMl; }
    public void setMaxVolumeMl(int maxVolumeMl) { this.maxVolumeMl = maxVolumeMl; }

    public int getMaxUnitsPerRequest() { return maxUnitsPerRequest; }
    public void setMaxUnitsPerRequest(int maxUnitsPerRequest) { this.maxUnitsPerRequest = maxUnitsPerRequest; }

    public int getLowStockThreshold() { return lowStockThreshold; }
    public void setLowStockThreshold(int lowStockThreshold) { this.lowStockThreshold = lowStockThreshold; }

    public int getNearExpiryDays() { return nearExpiryDays; }
    public void setNearExpiryDays(int nearExpiryDays) { this.nearExpiryDays = nearExpiryDays; }

    public int getNearExpiryAlertDays() { return nearExpiryAlertDays; }
    public void setNearExpiryAlertDays(int nearExpiryAlertDays) { this.nearExpiryAlertDays = nearExpiryAlertDays; }

    public int getDuplicateWindowMinutes() { return duplicateWindowMinutes; }
    public void setDuplicateWindowMinutes(int duplicateWindowMinutes) { this.duplicateWindowMinutes = duplicateWindowMinutes; }

    public Jwt getJwt() { return jwt; }
    public void setJwt(Jwt jwt) { this.jwt = jwt; }

    public static class Jwt {
        @NotBlank
        @jakarta.validation.constraints.Size(min = 32, message = "JWT secret must be at least 32 characters")
        private String secret;
        @Min(1) private long expirySeconds = 3600;

        public String getSecret() { return secret; }
        public void setSecret(String secret) { this.secret = secret; }
        public long getExpirySeconds() { return expirySeconds; }
        public void setExpirySeconds(long expirySeconds) { this.expirySeconds = expirySeconds; }
    }
}