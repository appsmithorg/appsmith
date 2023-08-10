package com.appsmith.server.solutions;

import com.appsmith.server.configurations.LicenseConfig;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.constants.LicenseOrigin;
import com.appsmith.server.constants.LicenseStatus;
import com.appsmith.server.domains.License;
import com.appsmith.server.domains.Tenant;
import com.appsmith.server.dtos.OfflineLicenseDataset;
import com.appsmith.server.services.ConfigService;
import com.google.gson.Gson;
import lombok.extern.slf4j.Slf4j;
import org.bouncycastle.crypto.params.Ed25519PublicKeyParameters;
import org.bouncycastle.crypto.signers.Ed25519Signer;
import org.bouncycastle.util.encoders.Hex;
import org.springframework.util.StringUtils;
import reactor.core.publisher.Mono;

import java.time.Instant;
import java.util.Base64;

/**
 * Class dedicated to Air-gap license validations
 */
@Slf4j
public class OfflineLicenseAPIManagerImpl extends BaseLicenseAPIManagerImpl implements LicenseAPIManager {

    private final LicenseConfig licenseConfig;
    private final Gson gson;

    public OfflineLicenseAPIManagerImpl(
            ReleaseNotesService releaseNotesService,
            ConfigService configService,
            LicenseConfig licenseConfig,
            Gson gson) {
        super(releaseNotesService, configService);
        this.licenseConfig = licenseConfig;
        this.gson = gson;
    }

    @Override
    public Mono<License> licenseCheck(Tenant tenant) {

        log.debug("Initiating offline license check");
        License license =
                isLicenseKeyValid(tenant) ? tenant.getTenantConfiguration().getLicense() : new License();

        if (!StringUtils.hasLength(license.getKey())) {
            log.debug("License key not found for tenant {}", tenant.getId());
            return Mono.just(license);
        }

        license = this.getVerifiedLicense(license, licenseConfig.getPublicVerificationKey());
        return Mono.just(license);
    }

    public License getVerifiedLicense(License license, String publicVerificationKey) {

        String licenseKey = license.getKey();

        try {
            // Parse signed license key
            String signingData = licenseKey.split("\\.", 2)[0];
            String encodedSignature = licenseKey.split("\\.", 2)[1];
            String signingPrefix = signingData.split("/", 2)[0];
            String encodedDataset = signingData.split("/", 2)[1];
            // Verify signing prefix
            if (!StringUtils.pathEquals(FieldName.KEY, signingPrefix)) {
                log.error("Unsupported signing prefix for offline license key check");
                return new License();
            }
            // Convert hex-encoded public key to a byte array
            byte[] publicKeyBytes = Hex.decode(publicVerificationKey);

            // Decode base64 signature and signing data to byte arrays
            byte[] signatureBytes = Base64.getUrlDecoder().decode(encodedSignature);
            byte[] signingDataBytes = signingData.getBytes();

            // Set up Ed25519 verifier
            Ed25519PublicKeyParameters params = new Ed25519PublicKeyParameters(publicKeyBytes, 0);
            Ed25519Signer verifier = new Ed25519Signer();

            verifier.init(false, params);
            verifier.update(signingDataBytes, 0, signingDataBytes.length);

            // Verify the signature
            boolean isSignatureValid = verifier.verifySignature(signatureBytes);
            if (isSignatureValid) {
                // Decode base64 dataset to a string
                byte[] datasetBytes = Base64.getUrlDecoder().decode(encodedDataset);
                String dataset = new String(datasetBytes);

                log.debug("> Dataset: {}", dataset);
                OfflineLicenseDataset licenseDataset = gson.fromJson(dataset, OfflineLicenseDataset.class);
                if (this.isLicenseDatasetValid(licenseDataset)) {
                    log.debug("Provided license key is valid!");
                    license.setExpiry(licenseDataset.getExpiry());
                    license.setActive(Instant.now().isBefore(license.getExpiry()));
                    license.setOrigin(LicenseOrigin.AIR_GAP);
                    license.setKey(licenseKey);
                    license.setType(licenseDataset.getType());
                    if (Boolean.TRUE.equals(license.getActive())) {
                        license.setStatus(LicenseStatus.ACTIVE);
                    } else {
                        license.setStatus(LicenseStatus.EXPIRED);
                    }
                    if (licenseDataset.getTenantFeatures() != null) {
                        license.setTenantFeatures(licenseDataset.getTenantFeatures());
                    }
                    return license;
                }
            }
            log.debug("License key is invalid!");
            License license1 = new License();
            license1.setActive(false);
            license1.setKey(licenseKey);
            return license1;
        } catch (Exception e) {
            log.debug("Exception while processing the offline license: {}", e.getMessage());
            return new License();
        }
    }

    private boolean isLicenseDatasetValid(OfflineLicenseDataset licenseDataset) {
        return licenseDataset != null && licenseDataset.getExpiry() != null;
    }
}
