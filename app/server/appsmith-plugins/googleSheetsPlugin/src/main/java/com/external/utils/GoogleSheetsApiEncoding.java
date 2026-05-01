package com.external.utils;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;

/**
 * Encoding helpers for Google Sheets HTTP APIs. Query parameters are often parsed as
 * {@code application/x-www-form-urlencoded}, where a literal '+' must be sent as {@code %2B}.
 */
public final class GoogleSheetsApiEncoding {

    private GoogleSheetsApiEncoding() {}

    /**
     * Encodes a string for use as a Google Sheets API query parameter value (e.g. {@code ranges}
     * on {@code spreadsheets.values.batchGet}).
     */
    public static String encodeQueryParameter(String value) {
        return URLEncoder.encode(value, StandardCharsets.UTF_8);
    }
}
