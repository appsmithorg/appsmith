package com.appsmith.server.helpers;

import lombok.extern.slf4j.Slf4j;
import org.apache.commons.collections.CollectionUtils;
import org.bouncycastle.crypto.params.AsymmetricKeyParameter;
import org.bouncycastle.crypto.signers.Ed25519Signer;
import org.bouncycastle.crypto.util.OpenSSHPublicKeyUtil;
import org.pf4j.util.StringUtils;
import org.springframework.http.HttpHeaders;

import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Base64;

import static com.appsmith.server.constants.ApiConstants.CLOUD_SERVICES_SIGNATURE;
import static com.appsmith.server.constants.ApiConstants.DATE;

@Slf4j
public class SignatureVerifier {

    // Public key for verifying signatures with ED25519 scheme.
    private static final String PUBLIC_VERIFICATION_KEY =
            "AAAAC3NzaC1lZDI1NTE5AAAAICNwJ+zx2opXjjOga/YyzRxb2czvNgQ/twA+miCKDIX3";

    private static final String TIMESTAMP = "timestamp";

    private static final String EQUAL = "=";

    private static final AsymmetricKeyParameter publicKeyParameters;

    static {
        publicKeyParameters =
                OpenSSHPublicKeyUtil.parsePublicKey(Base64.getDecoder().decode(PUBLIC_VERIFICATION_KEY));
    }

    /**
     * Method to verify the API signature from CS.
     * @param headers   Response headers from CS
     * @return          If the signature is valid
     */
    public static boolean isSignatureValid(HttpHeaders headers) {
        if (CollectionUtils.isEmpty(headers.get(CLOUD_SERVICES_SIGNATURE))
                || CollectionUtils.isEmpty(headers.get(DATE))) {
            return false;
        }
        String signature = headers.get(CLOUD_SERVICES_SIGNATURE).get(0);
        String date = headers.get(DATE).get(0);
        if (StringUtils.isNullOrEmpty(signature) || StringUtils.isNullOrEmpty(date)) {
            return false;
        }
        try {
            if (publicKeyParameters == null) {
                return false;
            }
            return isSignatureValid(signature, date);
        } catch (Exception exception) {
            log.debug("Error occurred while verifying CS signature.", exception);
            return false;
        }
    }

    private static boolean isSignatureValid(String signature, String dateHeader) {
        String[] signatureParts = signature.split("\\.", 2);
        if (signatureParts.length != 2) {
            return false;
        }
        String signingData = signatureParts[0];
        String encodedSignature = signatureParts[1];

        // Decode base64 signature and signing data to byte arrays
        byte[] signatureBytes = Base64.getUrlDecoder().decode(encodedSignature);
        byte[] signingDataBytes = signingData.getBytes(StandardCharsets.UTF_8);

        // Set up Ed25519 verifier
        Ed25519Signer verifier = new Ed25519Signer();
        verifier.init(false, publicKeyParameters);
        verifier.update(signingDataBytes, 0, signingDataBytes.length);

        // Verify the signature to check if the data is tampered
        if (verifier.verifySignature(signatureBytes)) {
            String decodedData = new String(Base64.getDecoder().decode(signingData));
            // To avoid the replay attacks check if the date provided in the header is within 24hrs and matches with
            // the date used while encoding the data.
            // Data format for ref: String.format("data=%s_timestamp=%s", dataset.toString(), date)
            String timestampFieldFormat = TIMESTAMP + EQUAL;
            String date =
                    decodedData.substring(decodedData.indexOf(timestampFieldFormat) + timestampFieldFormat.length());

            return Instant.parse(date).isAfter(Instant.now().minus(24, ChronoUnit.HOURS));
        }
        return false;
    }
}
