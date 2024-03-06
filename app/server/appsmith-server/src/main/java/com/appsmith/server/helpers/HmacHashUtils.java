package com.appsmith.server.helpers;

import com.appsmith.server.constants.FieldName;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import org.springframework.util.StringUtils;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.security.InvalidKeyException;
import java.security.NoSuchAlgorithmException;

public class HmacHashUtils {

    private static final char[] HEX_ARRAY = "0123456789ABCDEF".toCharArray();

    private static final String HMAC_ALGORITHM = "HmacSHA256";

    public static String createHash(String data, String key) {
        return createHash(HMAC_ALGORITHM, data, key);
    }

    public static String createHash(String algorithm, String data, String key) {
        if (!StringUtils.hasLength(key)) {
            throw new AppsmithException(AppsmithError.INVALID_PARAMETER, FieldName.LICENSE_KEY);
        }
        try {
            SecretKeySpec secretKeySpec = new SecretKeySpec(key.getBytes(), algorithm);
            Mac mac = Mac.getInstance(algorithm);
            mac.init(secretKeySpec);
            return bytesToHex(mac.doFinal(data.getBytes()));
        } catch (NoSuchAlgorithmException | InvalidKeyException e) {
            throw new AppsmithException(AppsmithError.HMAC_GENERATION_EXCEPTION);
        }
    }

    public static String bytesToHex(byte[] bytes) {
        char[] hexChars = new char[bytes.length * 2];
        for (int j = 0; j < bytes.length; j++) {
            int v = bytes[j] & 0xFF;
            hexChars[j * 2] = HEX_ARRAY[v >>> 4];
            hexChars[j * 2 + 1] = HEX_ARRAY[v & 0x0F];
        }
        return new String(hexChars);
    }
}
