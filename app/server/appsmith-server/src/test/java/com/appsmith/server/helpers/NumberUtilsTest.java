package com.appsmith.server.helpers;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;

public class NumberUtilsTest {
    @Test
    public void parseInteger() {
        assertEquals(2, NumberUtils.parseInteger("2", 0, 0));
        assertEquals(2, NumberUtils.parseInteger("2", 2, 0));
        assertEquals(10, NumberUtils.parseInteger("-2", 0, 10));
        assertEquals(123, NumberUtils.parseInteger("abc", 0, 123));
        assertEquals(123, NumberUtils.parseInteger("234.44", 0, 123));
    }
}
