package com.appsmith.server.helpers;

import java.text.Normalizer;
import java.util.regex.Pattern;

public class EmailNormalizer {

    private static final Pattern INVISIBLE_CHAR_PATTERN =
            Pattern.compile("[\u200B-\u200D\uFEFF\u2060\u00AD\u200C\u200E\u200F\u202A-\u202E\u2061-\u2063]");

    /**
     * Normalizes an email address by applying NFKC Unicode normalization, stripping invisible
     * characters, trimming whitespace, and lowercasing. Returns null if the result is empty.
     */
    public static String normalizeEmail(String email) {
        if (email == null) {
            return null;
        }

        String normalized = Normalizer.normalize(email, Normalizer.Form.NFKC);
        normalized = INVISIBLE_CHAR_PATTERN.matcher(normalized).replaceAll("");
        normalized = normalized.trim();
        normalized = normalized.toLowerCase();

        return normalized.isEmpty() ? null : normalized;
    }

    /**
     * Returns true if the email contains invisible Unicode characters that would be stripped
     * by normalization.
     */
    public static boolean containsInvisibleCharacters(String email) {
        if (email == null) {
            return false;
        }
        return INVISIBLE_CHAR_PATTERN.matcher(email).find();
    }
}
