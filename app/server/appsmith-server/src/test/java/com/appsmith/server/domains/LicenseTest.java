package com.appsmith.server.domains;

import com.appsmith.server.constants.LicenseOrigin;
import com.appsmith.server.constants.LicensePlan;
import com.appsmith.server.constants.LicenseStatus;
import com.appsmith.server.dtos.LicenseValidationResponseDTO;
import com.appsmith.server.dtos.ProductEdition;
import org.junit.jupiter.api.Test;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

class LicenseTest {

    private License getBusinessLicense(String key) {
        License license = new License();
        license.setKey(key);
        license.setOrigin(LicenseOrigin.SELF_SERVE);
        license.setProductEdition(ProductEdition.COMMERCIAL);
        license.setPlan(LicensePlan.BUSINESS);
        return license;
    }

    private License getEnterpriseLicense(String key) {
        License license = new License();
        license.setKey(key);
        license.setOrigin(LicenseOrigin.SALES);
        license.setPlan(LicensePlan.ENTERPRISE);
        license.setProductEdition(ProductEdition.COMMERCIAL);
        return license;
    }

    @Test
    void updateLicenseFromValidationResponse_expiredLicense() {
        LicenseValidationResponseDTO responseDTO = new LicenseValidationResponseDTO();
        responseDTO.setExpiry(Instant.now().minus(1, ChronoUnit.DAYS));
        responseDTO.setValid(false);
        String licenseKey = UUID.randomUUID().toString();
        License license = getBusinessLicense(licenseKey);
        Instant licenseExpiry = Instant.now().minus(10, ChronoUnit.DAYS);
        license.setExpiry(licenseExpiry);
        license.updateLicenseFromValidationResponse(responseDTO);

        assertEquals(license.getKey(), licenseKey);
        assertEquals(license.getPlan(), LicensePlan.BUSINESS);
        assertEquals(license.getProductEdition(), ProductEdition.COMMERCIAL);
        assertNull(license.getPreviousPlan());
        assertFalse(license.getActive());
        assertEquals(license.getOrigin(), LicenseOrigin.SELF_SERVE);
        assertEquals(license.getChangeType(), License.ChangeType.NO_CHANGE);
        assertNotEquals(license.getExpiry(), responseDTO.getExpiry());
        assertEquals(license.getExpiry(), licenseExpiry);
        assertEquals(license.getStatus(), LicenseStatus.EXPIRED);
        assertNull(license.getSubscriptionDetails());
    }

    @Test
    void updateLicenseFromValidationResponse_upgradedLicenseWithEnterprisePlan() {
        LicenseValidationResponseDTO responseDTO = new LicenseValidationResponseDTO();
        responseDTO.setExpiry(Instant.now().plus(1, ChronoUnit.DAYS));
        responseDTO.setLicensePlan(LicensePlan.ENTERPRISE);
        responseDTO.setValid(true);
        responseDTO.setLicenseId(UUID.randomUUID().toString());
        responseDTO.setLicenseOrigin(LicenseOrigin.SALES);
        responseDTO.setProductEdition(ProductEdition.COMMERCIAL);
        String licenseKey = UUID.randomUUID().toString();
        License license = getBusinessLicense(licenseKey);
        license.updateLicenseFromValidationResponse(responseDTO);

        assertEquals(license.getKey(), licenseKey);
        assertEquals(license.getId(), responseDTO.getLicenseId());
        assertEquals(license.getPlan(), LicensePlan.ENTERPRISE);
        assertEquals(license.getPreviousPlan(), LicensePlan.BUSINESS);
        assertEquals(license.getProductEdition(), ProductEdition.COMMERCIAL);
        assertTrue(license.getActive());
        assertEquals(license.getOrigin(), LicenseOrigin.SALES);
        assertEquals(license.getChangeType(), License.ChangeType.UPGRADE);
    }

    @Test
    void updateLicenseFromValidationResponse_samePlan() {
        LicenseValidationResponseDTO responseDTO = new LicenseValidationResponseDTO();
        responseDTO.setExpiry(Instant.now().plus(1, ChronoUnit.DAYS));
        responseDTO.setLicensePlan(LicensePlan.BUSINESS);
        responseDTO.setValid(true);
        responseDTO.setLicenseOrigin(LicenseOrigin.SELF_SERVE);
        responseDTO.setProductEdition(ProductEdition.COMMERCIAL);
        String licenseKey = UUID.randomUUID().toString();
        License license = getBusinessLicense(licenseKey);
        license.setPreviousPlan(LicensePlan.BUSINESS);
        license.updateLicenseFromValidationResponse(responseDTO);

        assertEquals(license.getKey(), licenseKey);
        assertEquals(license.getPlan(), LicensePlan.BUSINESS);
        assertEquals(license.getPreviousPlan(), LicensePlan.BUSINESS);
        assertEquals(license.getProductEdition(), ProductEdition.COMMERCIAL);
        assertTrue(license.getActive());
        assertEquals(license.getOrigin(), LicenseOrigin.SELF_SERVE);
        assertEquals(license.getChangeType(), License.ChangeType.NO_CHANGE);
    }

    @Test
    void updateLicenseFromValidationResponse_downgradedPlan() {
        LicenseValidationResponseDTO responseDTO = new LicenseValidationResponseDTO();
        responseDTO.setExpiry(Instant.now().plus(1, ChronoUnit.DAYS));
        responseDTO.setLicensePlan(LicensePlan.BUSINESS);
        responseDTO.setProductEdition(ProductEdition.COMMERCIAL);
        responseDTO.setValid(true);
        responseDTO.setLicenseOrigin(LicenseOrigin.SELF_SERVE);
        String licenseKey = UUID.randomUUID().toString();
        License license = getEnterpriseLicense(licenseKey);
        license.updateLicenseFromValidationResponse(responseDTO);

        assertEquals(license.getKey(), licenseKey);
        assertEquals(license.getPlan(), LicensePlan.BUSINESS);
        assertEquals(license.getPreviousPlan(), LicensePlan.ENTERPRISE);
        assertEquals(license.getProductEdition(), ProductEdition.COMMERCIAL);
        assertTrue(license.getActive());
        assertEquals(license.getOrigin(), LicenseOrigin.SELF_SERVE);
        assertEquals(license.getChangeType(), License.ChangeType.DOWNGRADE);
    }
}
