package com.external.config;


import org.junit.Assert;
import org.junit.Test;

import java.util.Arrays;
import java.util.HashMap;
import java.util.Map;

public class MethodConfigTest {

    @Test
    public void testWhiteSpaceRemovalForIntegerParsingErrors() {

        final String[] testPropKeys = {"range", "tableHeaderIndex", "rowLimit", "rowOffset", "rowIndex"};

        final String testData = "\t\n 444 \t\n";
        final String resultant = "444";

        Map<String, Object> propertyMap = new HashMap<>();
        Arrays.stream(testPropKeys).forEach(prop -> propertyMap.put(prop, testData));

        MethodConfig methodConfig = new MethodConfig(propertyMap);

        Assert.assertEquals(resultant, methodConfig.getSpreadsheetRange());
        Assert.assertEquals(resultant, methodConfig.getTableHeaderIndex());
        Assert.assertEquals(resultant, methodConfig.getRowLimit());
        Assert.assertEquals(resultant, methodConfig.getRowOffset());
        Assert.assertEquals(resultant, methodConfig.getRowIndex());
    }
}

