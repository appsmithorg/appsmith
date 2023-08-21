package com.appsmith.server.solutions;

import com.appsmith.server.configurations.LicenseConfig;
import com.appsmith.server.constants.LicenseOrigin;
import com.appsmith.server.constants.LicenseStatus;
import com.appsmith.server.constants.LicenseType;
import com.appsmith.server.domains.License;
import com.appsmith.server.domains.Tenant;
import com.appsmith.server.domains.TenantConfiguration;
import com.appsmith.server.services.ConfigService;
import com.google.gson.Gson;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.bouncycastle.util.encoders.Hex;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.testcontainers.shaded.org.bouncycastle.crypto.AsymmetricCipherKeyPair;
import org.testcontainers.shaded.org.bouncycastle.crypto.generators.Ed25519KeyPairGenerator;
import org.testcontainers.shaded.org.bouncycastle.crypto.params.Ed25519KeyGenerationParameters;
import org.testcontainers.shaded.org.bouncycastle.crypto.params.Ed25519PrivateKeyParameters;
import org.testcontainers.shaded.org.bouncycastle.crypto.params.Ed25519PublicKeyParameters;
import org.testcontainers.shaded.org.bouncycastle.crypto.signers.Ed25519Signer;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import java.security.SecureRandom;
import java.time.Instant;
import java.util.Base64;
import java.util.Map;

@SpringBootTest
@Slf4j
@RequiredArgsConstructor
public class OfflineLicenseValidatorTests {

    @Autowired
    LicenseConfig licenseConfig;

    @Autowired
    ReleaseNotesService releaseNotesService;

    @Autowired
    ConfigService configService;

    @Autowired
    Gson gson;

    private LicenseAPIManager licenseAPIManager;

    private String activeLicenseKey;
    private String activeTenantFeaturesLicenseKey;
    private String expiredLicenseKey;

    String PAID_ACTIVE_DATASET = "{" + "\"origin\":\"AIR_GAP\","
            + "\"type\":\"PAID\","
            + "\"expiry\":\"2099-05-30\","
            + "\"email\":\"test@example.com\","
            + "\"contractType\":\"FIXED_EXPIRY\","
            + "\"createdAt\":\"2023-03-15T08:17:39.010Z\""
            + "}";

    String PAID_ACTIVE_TENANT_FEATURES_DATASET = "{" + "\"origin\":\"AIR_GAP\","
            + "\"type\":\"PAID\","
            + "\"expiry\":\"2099-05-30\","
            + "\"email\":\"test@example.com\","
            + "\"contractType\":\"FIXED_EXPIRY\","
            + "\"tenantFeatures\":"
            + "{"
            + "\"feature1\":true,"
            + "\"feature2\":false"
            + "},"
            + "\"createdAt\":\"2023-03-15T08:17:39.010Z\""
            + "}";

    String TRIAL_EXPIRED_DATASET = "{" + "\"origin\":\"AIR_GAP\","
            + "\"type\":\"TRIAL\","
            + "\"expiry\":\"2021-05-30\","
            + "\"email\":\"test@example.com\","
            + "\"contractType\":\"FIXED_EXPIRY\","
            + "\"createdAt\":\"2021-04-30T08:17:39.010Z\""
            + "}";

    @BeforeEach
    public void setup() throws Exception {
        this.licenseAPIManager =
                new OfflineLicenseAPIManagerImpl(releaseNotesService, configService, licenseConfig, gson);
        // Generate Ed25519 key pair
        Ed25519KeyPairGenerator keyPairGenerator = new Ed25519KeyPairGenerator();
        keyPairGenerator.init(new Ed25519KeyGenerationParameters(new SecureRandom()));

        AsymmetricCipherKeyPair keyPair = keyPairGenerator.generateKeyPair();
        Ed25519PrivateKeyParameters privateKey = (Ed25519PrivateKeyParameters) keyPair.getPrivate();
        Ed25519PublicKeyParameters publicKey = (Ed25519PublicKeyParameters) keyPair.getPublic();

        // Generate license key for custom dataset
        activeLicenseKey = getLicenseForCustomDataset(privateKey, PAID_ACTIVE_DATASET);
        activeTenantFeaturesLicenseKey = getLicenseForCustomDataset(privateKey, PAID_ACTIVE_TENANT_FEATURES_DATASET);
        expiredLicenseKey = getLicenseForCustomDataset(privateKey, TRIAL_EXPIRED_DATASET);

        // Encode public key to hex
        String hexPublicKey = Hex.toHexString(publicKey.getEncoded());
        licenseConfig.setPublicVerificationKey(hexPublicKey);
    }

    private String getLicenseForCustomDataset(Ed25519PrivateKeyParameters privateKey, String dataset) {
        // Generate license key for custom dataset
        String signingData = String.format("key/%s", Base64.getUrlEncoder().encodeToString(dataset.getBytes()));

        Ed25519Signer signer = new Ed25519Signer();
        signer.init(true, privateKey);
        signer.update(signingData.getBytes(), 0, signingData.getBytes().length);

        byte[] signature = signer.generateSignature();
        return String.format("%s.%s", signingData, Base64.getUrlEncoder().encodeToString(signature));
    }

    private Tenant createTransientTenantWithSampleLicense(License license) {
        TenantConfiguration tenantConfiguration = new TenantConfiguration();
        tenantConfiguration.setLicense(license);
        Tenant tenant = new Tenant();
        tenant.setTenantConfiguration(tenantConfiguration);
        return tenant;
    }

    @Test
    public void validLicense_validateLicense_success() {

        License license = new License();
        license.setKey(activeLicenseKey);
        Tenant tenant = this.createTransientTenantWithSampleLicense(license);
        Mono<License> verifiedLicenseMono = licenseAPIManager.licenseCheck(tenant);

        StepVerifier.create(verifiedLicenseMono)
                .assertNext(verifiedLicense -> {
                    Assertions.assertNotNull(verifiedLicense);
                    Assertions.assertEquals(verifiedLicense.getOrigin(), LicenseOrigin.AIR_GAP);
                    Assertions.assertEquals(verifiedLicense.getExpiry(), Instant.parse("2099-05-30T00:00:00Z"));
                    Assertions.assertTrue(license.getActive());
                    Assertions.assertEquals(license.getKey(), activeLicenseKey);
                    Assertions.assertEquals(license.getType(), LicenseType.PAID);
                    Assertions.assertNull(license.getTenantFeatures());
                    Assertions.assertEquals(license.getStatus(), LicenseStatus.ACTIVE);
                })
                .verifyComplete();
    }

    @Test
    public void invalidLicense_validateLicense_emptyLicenseObjectReturned() {

        License license = new License();
        license.setKey("key/randomLicenseKey");
        Tenant tenant = this.createTransientTenantWithSampleLicense(license);
        Mono<License> licenseMono = licenseAPIManager.licenseCheck(tenant);
        StepVerifier.create(licenseMono)
                .assertNext(verifiedLicense -> Assertions.assertEquals(verifiedLicense, new License()))
                .verifyComplete();
    }

    @Test
    public void expiredLicense_validateLicense_success() {

        License license = new License();
        license.setKey(expiredLicenseKey);

        Tenant tenant = this.createTransientTenantWithSampleLicense(license);
        Mono<License> verifiedLicenseMono = licenseAPIManager.licenseCheck(tenant);

        StepVerifier.create(verifiedLicenseMono)
                .assertNext(verifiedLicense -> {
                    Assertions.assertNotNull(verifiedLicense);
                    Assertions.assertEquals(verifiedLicense.getOrigin(), LicenseOrigin.AIR_GAP);
                    Assertions.assertEquals(verifiedLicense.getExpiry(), Instant.parse("2021-05-30T00:00:00Z"));
                    Assertions.assertFalse(license.getActive());
                    Assertions.assertEquals(license.getKey(), expiredLicenseKey);
                    Assertions.assertEquals(license.getType(), LicenseType.TRIAL);
                    Assertions.assertNull(license.getTenantFeatures());
                    Assertions.assertEquals(license.getStatus(), LicenseStatus.EXPIRED);
                })
                .verifyComplete();
    }

    @Test
    public void validTenantFeaturesLicense_validateLicense_success() {

        License license = new License();
        license.setKey(activeTenantFeaturesLicenseKey);
        Tenant tenant = this.createTransientTenantWithSampleLicense(license);
        Mono<License> verifiedLicenseMono = licenseAPIManager.licenseCheck(tenant);

        StepVerifier.create(verifiedLicenseMono)
                .assertNext(verifiedLicense -> {
                    Assertions.assertNotNull(verifiedLicense);
                    Assertions.assertEquals(verifiedLicense.getOrigin(), LicenseOrigin.AIR_GAP);
                    Assertions.assertEquals(verifiedLicense.getExpiry(), Instant.parse("2099-05-30T00:00:00Z"));
                    Assertions.assertTrue(license.getActive());
                    Assertions.assertEquals(license.getKey(), activeTenantFeaturesLicenseKey);
                    Assertions.assertEquals(license.getType(), LicenseType.PAID);
                    Assertions.assertEquals(license.getStatus(), LicenseStatus.ACTIVE);
                    Assertions.assertNotNull(license.getTenantFeatures());
                    Map<String, Boolean> tenantFeatures = license.getTenantFeatures();
                    Assertions.assertTrue(tenantFeatures.containsKey("feature1")
                            && tenantFeatures.get("feature1").equals(true));
                    Assertions.assertTrue(tenantFeatures.containsKey("feature2")
                            && tenantFeatures.get("feature2").equals(false));
                })
                .verifyComplete();
    }
}
