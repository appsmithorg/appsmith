package com.external.utils;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;

/**
 * Utility class providing URL encoding helpers for Google Sheets API query parameters.
 * <p>
 * Google Sheets API range parameters (e.g., A1 notation with sheet names containing
 * special characters like '+') must be percent-encoded before being appended as query
 * parameters. Standard URI builders may leave '+' unencoded, causing the API to
 * misinterpret it as a space.
 * </p>
 */
public final class GoogleSheetsApiEncoding {

    /**
     * Private constructor to prevent instantiation of this utility class.
     *
     * @throws UnsupportedOperationException always, since this class should not be instantiated
     */
    private GoogleSheetsApiEncoding() {
        throw new UnsupportedOperationException("Utility class — do not instantiate");
    }

    /**
     * Encodes a string for safe use as a Google Sheets API query parameter value.
     * <p>
     * Uses {@link URLEncoder#encode(String, java.nio.charset.Charset)} with UTF-8
     * and additionally replaces '+' (which URLEncoder uses for spaces) with '%20'
     * so the value can be placed inside a URI that is already considered pre-encoded
     * (i.e., built with {@code UriComponentsBuilder.build(true)}).
     * </p>
     *
     * @param value the raw query parameter value to encode; must not be {@code null}
     * @return the percent-encoded value safe for URI query parameters
     */
    public static String encodeQueryParameter(String value) {
        return URLEncoder.encode(value, StandardCharsets.UTF_8)
                .replace("+", "%20");
    }
}
