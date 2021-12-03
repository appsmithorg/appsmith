package com.external.config;

import com.appsmith.external.models.Property;
import com.external.domains.RowObject;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.type.TypeFactory;
import org.junit.Assert;
import org.junit.Test;

import java.util.*;
import java.util.stream.Collectors;
import java.util.stream.StreamSupport;


public class BulkAppendMethodTest {

    final ObjectMapper objectMapper = new ObjectMapper();

    @Test
    public void testBulkAppendExecutePrerequisites() {

        Property testProp = null;
        List<Property> properties = null;

        //Test data Expected output type vs inputs
        Map<String, String> testDataMap = new HashMap<String, String>();
        testDataMap.put("emptyArray",           "[{}]");
        testDataMap.put("arrayWithData",        "[{\"Sl#\":\"100\"}]");
        testDataMap.put("arrayWithData",        "[{\"Sl#\":\"100\",\"Topic\":\"topic\"}]");
        testDataMap.put("arrayWithData",        "[{\"Sl#\":\"100\"},{\"Sl#\":\"101\"}]");
        testDataMap.put("notAnArray",           "[]");
        testDataMap.put("notAnArray",           "");


            for (Map.Entry<String, String> testData : testDataMap.entrySet()) {


                properties = new ArrayList<Property>();
                testProp = new Property("rowObjects", testData.getValue());
                properties.add(testProp);
                MethodConfig methodConfig = new MethodConfig(properties);

                List<RowObject> rowObjectListFromBody = null;
                JsonNode body = null;
                try {
                    body = objectMapper.readTree(methodConfig.getRowObjects());
                } catch (JsonProcessingException e) {
                    // Should never enter here
                }

                MethodConfig returnMethodConfig = null;
                rowObjectListFromBody = this.getRowObjectListFromBody(body);

                if(rowObjectListFromBody != null ) {
                    boolean fieldsEmpty = true;

                    for (RowObject rowObject : rowObjectListFromBody) {
                        if (rowObject.getValueMap().size() == 0) continue;
                        fieldsEmpty = false;
                    }

                    if (fieldsEmpty) {
                        //Mono.just(methodConfig);
                        returnMethodConfig = new MethodConfig(new ArrayList<Property>());  //In new implementation, we are returning Mono earlier to GoogleSheetPlugin
                    } else {
                        returnMethodConfig = methodConfig;  // Proceed with existing implementation
                    }
                }

           switch (testData.getKey()) {
                case "emptyArray":
                    Assert.assertEquals(returnMethodConfig.getRowObjects(), new MethodConfig(new ArrayList<Property>()).getRowObjects());
                    break;
                case "arrayWithData":
                    Assert.assertEquals(returnMethodConfig.getRowObjects(), methodConfig.getRowObjects());
                    break;
                case "notAnArray":
                    Assert.assertEquals(rowObjectListFromBody, null);
                    break;
            }
        }
    }

    private List<RowObject> getRowObjectListFromBody(JsonNode body) {
        if (!body.isArray() || body.isEmpty()) {
            return null;
        }
        return StreamSupport
                .stream(body.spliterator(), false)
                .map(rowJson -> new RowObject(
                        objectMapper.convertValue(
                                rowJson,
                                TypeFactory
                                        .defaultInstance()
                                        .constructMapType(LinkedHashMap.class, String.class, String.class))))
                .collect(Collectors.toList());
    }
}