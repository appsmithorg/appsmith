package com.external.config;


import com.appsmith.external.models.Property;
import com.external.config.MethodConfig;
import org.junit.Assert;
import org.junit.Test;
import java.util.*;

public class MethodConfigTest {

    @Test
    public void testWhiteSpaceRemovalForIntegerParsingErrors() throws Exception {
        Property testProp = null;
        MethodConfig methodConfig =null;
        List<Property> properties = null;
        final String[] testPropKeys = { "range","tableHeaderIndex","rowLimit","rowOffset","rowIndex"};

        //Test data Expected output vs inputs
        Map<String, String>  testDataMap = new HashMap<String, String>();
        testDataMap.put("2",       "2 ");
        testDataMap.put("22",      " 22 ");
        testDataMap.put("200",     "  200");
        testDataMap.put("2",       "  \t 2  ");
        testDataMap.put("7",       "7 \n");
        testDataMap.put("72",      " \n\n 72 \n\n");
        testDataMap.put("24",      "\t\n 24 ");
        testDataMap.put("444",     "\t\n 444 \t\n");
        testDataMap.put("7878",    "\n\n\n\n 7878 ");
        testDataMap.put("7",       "7 \n\n\n\n\n");
        testDataMap.put("1",       "\n\n\n 1 \n\n\n\n ");

        for(int i=0; i< testPropKeys.length; i++) {

            for (Map.Entry<String, String> e : testDataMap.entrySet()){
                properties = new ArrayList<Property>();
                testProp = new Property(testPropKeys[i],e.getValue());
                properties.add(testProp);

                methodConfig = new MethodConfig(properties); // We are testing this Class with test data

                switch (testPropKeys[i]){
                    case "range":
                        Assert.assertEquals(methodConfig.getSpreadsheetRange(), e.getKey());
                        break;
                    case "tableHeaderIndex":
                        Assert.assertEquals(methodConfig.getTableHeaderIndex(), e.getKey());
                        break;
                    case "rowLimit":
                        Assert.assertEquals(methodConfig.getRowLimit(), e.getKey());
                        break;
                    case "rowOffset":
                        Assert.assertEquals(methodConfig.getRowOffset(), e.getKey());
                        break;
                    case "rowIndex":
                        Assert.assertEquals(methodConfig.getRowIndex(), e.getKey());
                        break;
                }

            }
        }
    }
}

