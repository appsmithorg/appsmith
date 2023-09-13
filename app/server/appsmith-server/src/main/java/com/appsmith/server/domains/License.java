package com.appsmith.server.domains;

import com.appsmith.server.constants.LicenseOrigin;
import com.appsmith.server.constants.LicensePlan;
import com.appsmith.server.constants.LicenseStatus;
import com.appsmith.server.constants.LicenseType;
import com.appsmith.server.domains.ce.LicenseCE;
import com.appsmith.server.dtos.LicenseValidationResponseDTO;
import lombok.Data;
import org.springframework.data.annotation.Transient;

import java.time.Instant;
import java.util.List;
import java.util.Map;

@Data
public class License extends LicenseCE {
    Boolean active;
    String id;
    String key;
    LicenseType type;
    Instant expiry;
    LicenseStatus status;
    LicenseOrigin origin;

    @Transient
    Map<String, Boolean> tenantFeatures;

    // Field to detect previous license plan which will be used to provide the appropriate messaging on UI
    LicensePlan previousPlan = LicensePlan.FREE;

    @Transient
    ChangeType changeType;

    SubscriptionDetails subscriptionDetails;

    // Hierarchy of license plan
    private static final List<LicensePlan> licensePlansHierarchy =
            List.of(LicensePlan.FREE, LicensePlan.SELF_SERVE, LicensePlan.ENTERPRISE);

    enum ChangeType {
        UPGRADE,
        DOWNGRADE,
        NO_CHANGE
    }

    public ChangeType getChangeType() {
        if (this.getPreviousPlan() == null || this.getPlan() == null) {
            return ChangeType.NO_CHANGE;
        }
        int currentPlanIndex = licensePlansHierarchy.indexOf(this.getPlan());
        int previousPlanIndex = licensePlansHierarchy.indexOf(this.getPreviousPlan());
        return currentPlanIndex == previousPlanIndex
                ? ChangeType.NO_CHANGE
                : (currentPlanIndex > previousPlanIndex) ? ChangeType.UPGRADE : ChangeType.DOWNGRADE;
    }

    public void updateLicenseFromValidationResponse(LicenseValidationResponseDTO validationResponse) {
        this.setActive(validationResponse.isValid());
        if (Boolean.TRUE.equals(validationResponse.isValid())) {
            this.setExpiry(validationResponse.getExpiry());
            this.setStatus(validationResponse.getLicenseStatus());
            this.setType(validationResponse.getLicenseType());
            this.setOrigin(validationResponse.getOrigin());
            if (this.getPlan() != null && !this.getPlan().equals(validationResponse.getLicensePlan())) {
                this.setPreviousPlan(this.getPlan());
                this.setPlan(validationResponse.getLicensePlan());
            } else {
                this.setPlan(validationResponse.getLicensePlan());
            }
            this.setSubscriptionDetails(validationResponse.getSubscriptionDetails());
        } else {
            this.setStatus(LicenseStatus.EXPIRED);
        }
    }
}
