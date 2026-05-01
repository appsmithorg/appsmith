package com.external.utils;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

public class GoogleSheetsApiEncodingTest {

    @Test
    public void encodeQueryParameter_plusInSheetName_usesPercent2BNotLiteralPlus() {
        String encoded = GoogleSheetsApiEncoding.encodeQueryParameter("'Data+A'!1:1");
        assertTrue(encoded.contains("%2B"), encoded);
        assertFalse(encoded.contains("+"), encoded);
    }
}
