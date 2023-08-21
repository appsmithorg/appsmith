package com.appsmith.server.domains;

import com.appsmith.server.constants.LicenseOrigin;
import com.appsmith.server.constants.LicensePlan;
import com.appsmith.server.constants.LicenseStatus;
import com.appsmith.server.dtos.LicenseValidationResponseDTO;
import org.junit.jupiter.api.Test;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

class LicenseTest {

    private License getBusinessLicense(String key) {
        License license = new License();
        license.setKey(key);
        license.setOrigin(LicenseOrigin.SELF_SERVE);
        license.setPlan(LicensePlan.SELF_SERVE);
        return license;
    }

    private License getEnterpriseLicense(String key) {
        License license = new License();
        license.setKey(key);
        license.setOrigin(LicenseOrigin.ENTERPRISE);
        license.setPlan(LicensePlan.ENTERPRISE);
        return license;
    }

    @Test
    void updateLicenseFromValidationResponse_expiredLicense() {
        LicenseValidationResponseDTO responseDTO = new LicenseValidationResponseDTO();
        responseDTO.setExpiry(Instant.now().minus(1, ChronoUnit.DAYS));
        responseDTO.setValid(false);
        String licenseKey = UUID.randomUUID().toString();
        License license = getBusinessLicense(licenseKey);
        license.updateLicenseFromValidationResponse(responseDTO);

        assertEquals(license.getKey(), licenseKey);
        assertEquals(license.getPlan(), LicensePlan.SELF_SERVE);
        assertEquals(license.getPreviousPlan(), LicensePlan.FREE);
        assertFalse(license.getActive());
        assertEquals(license.getOrigin(), LicenseOrigin.SELF_SERVE);
        assertEquals(license.getChangeType(), License.ChangeType.UPGRADE);
        assertEquals(license.getExpiry(), responseDTO.getExpiry());
        assertEquals(license.getStatus(), LicenseStatus.EXPIRED);
    }

    @Test
    void updateLicenseFromValidationResponse_upgradedLicenseWithEnterprisePlan() {
        LicenseValidationResponseDTO responseDTO = new LicenseValidationResponseDTO();
        responseDTO.setExpiry(Instant.now().plus(1, ChronoUnit.DAYS));
        responseDTO.setLicensePlan(LicensePlan.ENTERPRISE);
        responseDTO.setValid(true);
        responseDTO.setOrigin(LicenseOrigin.ENTERPRISE);
        String licenseKey = UUID.randomUUID().toString();
        License license = getBusinessLicense(licenseKey);
        license.updateLicenseFromValidationResponse(responseDTO);

        assertEquals(license.getKey(), licenseKey);
        assertEquals(license.getPlan(), LicensePlan.ENTERPRISE);
        assertEquals(license.getPreviousPlan(), LicensePlan.SELF_SERVE);
        assertTrue(license.getActive());
        assertEquals(license.getOrigin(), LicenseOrigin.ENTERPRISE);
        assertEquals(license.getChangeType(), License.ChangeType.UPGRADE);
    }

    @Test
    void updateLicenseFromValidationResponse_samePlan() {
        LicenseValidationResponseDTO responseDTO = new LicenseValidationResponseDTO();
        responseDTO.setExpiry(Instant.now().plus(1, ChronoUnit.DAYS));
        responseDTO.setLicensePlan(LicensePlan.SELF_SERVE);
        responseDTO.setValid(true);
        responseDTO.setOrigin(LicenseOrigin.SELF_SERVE);
        String licenseKey = UUID.randomUUID().toString();
        License license = getBusinessLicense(licenseKey);
        license.setPreviousPlan(LicensePlan.SELF_SERVE);
        license.updateLicenseFromValidationResponse(responseDTO);

        assertEquals(license.getKey(), licenseKey);
        assertEquals(license.getPlan(), LicensePlan.SELF_SERVE);
        assertEquals(license.getPreviousPlan(), LicensePlan.SELF_SERVE);
        assertTrue(license.getActive());
        assertEquals(license.getOrigin(), LicenseOrigin.SELF_SERVE);
        assertEquals(license.getChangeType(), License.ChangeType.NO_CHANGE);
    }

    @Test
    void updateLicenseFromValidationResponse_downgradedPlan() {
        LicenseValidationResponseDTO responseDTO = new LicenseValidationResponseDTO();
        responseDTO.setExpiry(Instant.now().plus(1, ChronoUnit.DAYS));
        responseDTO.setLicensePlan(LicensePlan.SELF_SERVE);
        responseDTO.setValid(true);
        responseDTO.setOrigin(LicenseOrigin.SELF_SERVE);
        String licenseKey = UUID.randomUUID().toString();
        License license = getEnterpriseLicense(licenseKey);
        license.updateLicenseFromValidationResponse(responseDTO);

        assertEquals(license.getKey(), licenseKey);
        assertEquals(license.getPlan(), LicensePlan.SELF_SERVE);
        assertEquals(license.getPreviousPlan(), LicensePlan.ENTERPRISE);
        assertTrue(license.getActive());
        assertEquals(license.getOrigin(), LicenseOrigin.SELF_SERVE);
        assertEquals(license.getChangeType(), License.ChangeType.DOWNGRADE);
    }
}
