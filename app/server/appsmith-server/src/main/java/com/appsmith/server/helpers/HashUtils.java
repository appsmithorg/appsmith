package com.appsmith.server.helpers;

import org.apache.commons.codec.digest.DigestUtils;
import org.apache.commons.lang3.StringUtils;

public class HashUtils {

    public static String hash(String value) {
        return StringUtils.isEmpty(value) ? "" : DigestUtils.sha256Hex(value);
    }

    public static String getEmailDomainHash(String email) {
        if (email == null) {
            return "";
        }

        return hash(email.contains("@") ? email.split("@", 2)[1] : "");
    }
}
