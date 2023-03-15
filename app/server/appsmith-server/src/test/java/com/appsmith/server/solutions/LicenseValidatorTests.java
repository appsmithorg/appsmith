package com.appsmith.server.solutions;

import com.appsmith.server.constants.LicenseOrigin;
import com.appsmith.server.domains.TenantConfiguration;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.testcontainers.shaded.org.bouncycastle.crypto.signers.Ed25519Signer;
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

import java.security.SecureRandom;
import java.time.Instant;
import java.util.Base64;

@SpringBootTest
@Slf4j
@RequiredArgsConstructor
public class LicenseValidatorTests {

    @Autowired
    OfflineLicenseValidatorImpl licenseValidator;

    private String activeLicenseKey;
    private String expiredLicenseKey;
    private String hexPublicKey;

    String PAID_ACTIVE_DATASET = "{" +
            "\"origin\":\"AIR_GAP\"," +
            "\"type\":\"PAID\"," +
            "\"expiry\":\"2099-05-30\"," +
            "\"email\":\"test@example.com\"," +
            "\"contractType\":\"FIXED_EXPIRY\"," +
            "\"createdAt\":\"2023-03-15T08:17:39.010Z\"" +
        "}";

    String TRIAL_EXPIRED_DATASET = "{" +
        "\"origin\":\"AIR_GAP\"," +
        "\"type\":\"PAID\"," +
        "\"expiry\":\"2021-05-30\"," +
        "\"email\":\"test@example.com\"," +
        "\"contractType\":\"FIXED_EXPIRY\"," +
        "\"createdAt\":\"2021-04-30T08:17:39.010Z\"" +
        "}";

    @BeforeEach
    public void setup() throws Exception {
        // Generate Ed25519 key pair
        Ed25519KeyPairGenerator keyPairGenerator = new Ed25519KeyPairGenerator();
        keyPairGenerator.init(new Ed25519KeyGenerationParameters(new SecureRandom()));

        AsymmetricCipherKeyPair keyPair = keyPairGenerator.generateKeyPair();
        Ed25519PrivateKeyParameters privateKey = (Ed25519PrivateKeyParameters) keyPair.getPrivate();
        Ed25519PublicKeyParameters publicKey = (Ed25519PublicKeyParameters) keyPair.getPublic();
        // Encode public key to hex
        hexPublicKey = Hex.toHexString(publicKey.getEncoded());

        // Generate license key for custom dataset
        activeLicenseKey = getLicenseForCustomDataset(privateKey, PAID_ACTIVE_DATASET);
        expiredLicenseKey = getLicenseForCustomDataset(privateKey, TRIAL_EXPIRED_DATASET);

        log.debug("Generated license key:");
        log.debug(activeLicenseKey);
        log.debug("Generated public key:");
        log.debug(hexPublicKey);
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

    @Test
    public void validLicense_validateLicense_success() {

        TenantConfiguration.License license = new TenantConfiguration.License();
        license.setKey(activeLicenseKey);
        TenantConfiguration.License verifiedLicense = licenseValidator.getVerifiedLicense(license, hexPublicKey);

        Assertions.assertNotNull(verifiedLicense);
        Assertions.assertEquals(verifiedLicense.getOrigin(), LicenseOrigin.AIR_GAP);
        Assertions.assertEquals(verifiedLicense.getExpiry(), Instant.parse("2099-05-30T00:00:00Z"));
        Assertions.assertTrue(license.getActive());
    }

    @Test
    public void invalidLicense_validateLicense_emptyLicenseObjectReturned() {

        TenantConfiguration.License license = new TenantConfiguration.License();
        license.setKey("key/randomLicenseKey");
        TenantConfiguration.License verifiedLicense = licenseValidator.getVerifiedLicense(license, hexPublicKey);
        Assertions.assertEquals(verifiedLicense, new TenantConfiguration.License());
    }

    @Test
    public void expiredLicense_validateLicense_success() {

        TenantConfiguration.License license = new TenantConfiguration.License();
        license.setKey(expiredLicenseKey);
        TenantConfiguration.License verifiedLicense = licenseValidator.getVerifiedLicense(license, hexPublicKey);

        Assertions.assertNotNull(verifiedLicense);
        Assertions.assertEquals(verifiedLicense.getOrigin(), LicenseOrigin.AIR_GAP);
        Assertions.assertEquals(verifiedLicense.getExpiry(), Instant.parse("2021-05-30T00:00:00Z"));
        Assertions.assertFalse(license.getActive());
    }
}
