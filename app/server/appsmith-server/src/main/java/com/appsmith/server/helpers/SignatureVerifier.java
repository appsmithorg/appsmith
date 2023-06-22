package com.appsmith.server.helpers;

import org.bouncycastle.crypto.signers.Ed25519Signer;
import org.bouncycastle.crypto.params.AsymmetricKeyParameter;
import org.bouncycastle.crypto.util.OpenSSHPublicKeyUtil;

import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Base64;

public class SignatureVerifier {
    private static final String publicVerificationKey = "ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAICNwJ+zx2opXjjOga/YyzRxb2czvNgQ/twA+miCKDIX3 appsmith";

    private static final String TIMESTAMP = "timestamp";

    private static final String EQUAL = "=";

    public static boolean isSignatureValid(String signature, String dateHeader) {

        String signingData = signature.split("\\.", 2)[0];
        String encodedSignature = signature.split("\\.", 2)[1];

        // Decode base64 signature and signing data to byte arrays
        byte[] signatureBytes = Base64.getUrlDecoder().decode(encodedSignature);
        byte[] signingDataBytes = signingData.getBytes(StandardCharsets.UTF_8);

        String publicKeyBody = publicVerificationKey.split(" ")[1];
        AsymmetricKeyParameter publicKeyParameters = OpenSSHPublicKeyUtil.parsePublicKey(Base64.getDecoder().decode(publicKeyBody));
        // Set up Ed25519 verifier
        Ed25519Signer verifier = new Ed25519Signer();
        verifier.init(false, publicKeyParameters);
        verifier.update(signingDataBytes, 0, signingDataBytes.length);

        // Verify the signature to check if the data is tampered
        if(verifier.verifySignature(signatureBytes)) {
            String decodedData = new String(Base64.getDecoder().decode(signingData));
            // To avoid the replay attacks check if the date provided in the header is within 24hrs and matches with
            // the date used while encoding the data.
            // Data format for ref: String.format("data=%s_timestamp=%s", dataset.toString(), date)
            String timestampFieldFormat = TIMESTAMP + EQUAL;
            String date = decodedData
                    .substring(decodedData.indexOf(timestampFieldFormat) + timestampFieldFormat.length());

            return dateHeader.equals(date) && Instant.parse(date).isAfter(Instant.now().minus(24, ChronoUnit.HOURS));
        }
        return false;
    }
}
