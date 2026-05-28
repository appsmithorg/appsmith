package com.appsmith.server.helpers;

import lombok.extern.slf4j.Slf4j;
import org.apache.commons.codec.binary.Hex;
import org.springframework.util.StringUtils;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;

/**
 * Computes HMAC-SHA256 email hashes used for Pylon chat widget identity verification.
 * The Pylon identity secret is a hex string and must be decoded to raw bytes before use.
 * See: https://docs.usepylon.com/pylon-docs/chat-widget/identity-verification
 */
@Slf4j
public class PylonIdentityHelper {

    private PylonIdentityHelper() {}

    /**
     * Returns lowercase hex HMAC-SHA256 of {@code email} keyed by the hex-decoded secret,
     * or {@code null} if the secret/email is missing or computation fails. Failures are
     * logged so a misconfigured secret degrades to unverified Pylon mode rather than
     * breaking login.
     */
    public static String computeEmailHash(String secretHex, String email) {
        if (!StringUtils.hasText(secretHex) || !StringUtils.hasText(email)) {
            return null;
        }
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(Hex.decodeHex(secretHex), "HmacSHA256"));
            return Hex.encodeHexString(mac.doFinal(email.getBytes(StandardCharsets.UTF_8)));
        } catch (Exception e) {
            log.error("Failed to compute Pylon email hash", e);
            return null;
        }
    }
}
