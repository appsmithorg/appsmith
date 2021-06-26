package com.appsmith.server.helpers;

import org.junit.Assert;
import org.junit.Test;


public class NumberUtilsTest {
    @Test
    public void parseInteger() {
        Assert.assertEquals(2, NumberUtils.parseInteger("2", 0, 0));
        Assert.assertEquals(2, NumberUtils.parseInteger("2", 2, 0));
        Assert.assertEquals(10, NumberUtils.parseInteger("-2", 0, 10));
        Assert.assertEquals(123, NumberUtils.parseInteger("abc", 0, 123));
        Assert.assertEquals(123, NumberUtils.parseInteger("234.44", 0, 123));
    }
}