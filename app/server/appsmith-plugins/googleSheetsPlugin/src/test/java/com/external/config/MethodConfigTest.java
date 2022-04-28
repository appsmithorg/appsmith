package com.external.config;


import com.appsmith.external.exceptions.pluginExceptions.AppsmithPluginException;
import com.appsmith.external.models.Condition;
import com.appsmith.external.models.Property;
import com.external.config.MethodConfig;
import org.junit.Assert;
import org.junit.Test;
import java.util.*;

import static com.external.config.MethodConfig.OPERATOR_KEY;
import static com.external.config.MethodConfig.PATH_KEY;
import static com.external.config.MethodConfig.VALUE_KEY;
import static org.junit.Assert.assertEquals;

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
                        assertEquals(methodConfig.getSpreadsheetRange(), e.getKey());
                        break;
                    case "tableHeaderIndex":
                        assertEquals(methodConfig.getTableHeaderIndex(), e.getKey());
                        break;
                    case "rowLimit":
                        assertEquals(methodConfig.getRowLimit(), e.getKey());
                        break;
                    case "rowOffset":
                        assertEquals(methodConfig.getRowOffset(), e.getKey());
                        break;
                    case "rowIndex":
                        assertEquals(methodConfig.getRowIndex(), e.getKey());
                        break;
                }

            }
        }
    }

    @Test
    public void testInitialEmptyWhereCondition() {
        Map condition = new LinkedHashMap();
        condition.put(PATH_KEY, "");
        condition.put(VALUE_KEY, "");

        List<Map> listOfConditions = new ArrayList<>();
        listOfConditions.add(condition);

        Property property = new Property("where", listOfConditions);
        List<Property> propertyList = new ArrayList();
        propertyList.add(property);

        MethodConfig methodConfig = new MethodConfig(propertyList);
        List<Condition> parsedWhereConditions = methodConfig.getWhereConditions();
        assertEquals(0, parsedWhereConditions.size());
    }

    @Test(expected = AppsmithPluginException.class)
    public void testNonEmptyOperatorWithEmptyColumnWhereCondition() {
        Map condition = new LinkedHashMap();
        condition.put(PATH_KEY, "");
        condition.put(OPERATOR_KEY, "EQ");
        condition.put(VALUE_KEY, "");

        List<Map> listOfConditions = new ArrayList<>();
        listOfConditions.add(condition);

        Property property = new Property("where", listOfConditions);
        List<Property> propertyList = new ArrayList();
        propertyList.add(property);

        MethodConfig methodConfig = new MethodConfig(propertyList);
        List<Condition> parsedWhereConditions = methodConfig.getWhereConditions();
        assertEquals(0, parsedWhereConditions.size());
    }
}

