package com.external.plugins;

import org.junit.Test;
import software.amazon.awssdk.services.dynamodb.model.GetItemRequest;
import software.amazon.awssdk.services.dynamodb.model.ListTablesRequest;
import software.amazon.awssdk.services.dynamodb.model.PutItemRequest;

import java.util.List;
import java.util.Map;

import static com.external.plugins.DynamoPlugin.plainToSdk;
import static org.junit.Assert.assertArrayEquals;
import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertNotNull;
import static org.junit.Assert.assertNull;
import static org.junit.Assert.assertTrue;

public class PlainToSdkTests {

    @Test
    public void testListTablesNull() throws Exception {
        final ListTablesRequest request = plainToSdk(
                null,
                ListTablesRequest.class
        );

        assertNotNull(request);
        assertNull(request.exclusiveStartTableName());
        assertNull(request.limit());
    }

    @Test
    public void testListTables() throws Exception {
        final ListTablesRequest request = plainToSdk(
                Map.of(
                        "ExclusiveStartTableName", "table_name",
                        "Limit", 1
                ),
                ListTablesRequest.class
        );

        assertNotNull(request);
        assertEquals("table_name", request.exclusiveStartTableName());
        assertEquals(1, request.limit().intValue());
    }

    @Test
    public void testPutItem() throws Exception {
        final PutItemRequest request = plainToSdk(
                Map.of(
                        "ConditionalOperator", "conditional operator value",
                        "ConditionExpression", "conditional expression value",
                        "ExpressionAttributeNames", Map.of(
                                "#P", "Percentile"
                        ),
                        "ExpressionAttributeValues", Map.of(
                                ":token1", Map.of("S", "value1"),
                                ":token2", Map.of("N", "42")
                        ),
                        "Item", Map.of(
                                "one", Map.of("B", "binary blob as a string"),
                                "two", Map.of("BOOL", true),
                                "three", Map.of("BS", List.of("binary blob 1", "binary blob 2")),
                                "four", Map.of("L", List.of(
                                        Map.of("S", "string in list 1"),
                                        Map.of("S", "string in list 2"),
                                        Map.of("S", "string in list 3")
                                )),
                                "five", Map.of("M", Map.of(
                                        "key1", "val1",
                                        "key2", "val2"
                                )),
                                "six", Map.of("N", "1234"),
                                "seven", Map.of("NS", List.of("12", "34", "56")),
                                "eight", Map.of("NULL", true),
                                "nine", Map.of("S", "string value")
                        ),
                        "TableName", "table_name"
                ),
                PutItemRequest.class
        );

        assertNotNull(request);
        assertEquals("conditional operator value", request.conditionalOperatorAsString());
        assertEquals("conditional expression value", request.conditionExpression());
        assertEquals(9, request.item().size());
        assertEquals("table_name", request.tableName());
    }

    @Test
    public void testGetItem() throws Exception {
        final GetItemRequest request = plainToSdk(
                Map.of(
                        "AttributesToGet", List.of("one", "two", "three"),
                        "ConsistentRead", true,
                        "ExpressionAttributeNames", Map.of(
                                "#P", "Percentile"
                        ),
                        "Key", Map.of(
                                "one", Map.of("B", "binary blob as a string"),
                                "two", Map.of("BOOL", true),
                                "three", Map.of("BS", List.of("binary blob 1", "binary blob 2")),
                                "four", Map.of("L", List.of(
                                        Map.of("S", "string in list 1"),
                                        Map.of("S", "string in list 2"),
                                        Map.of("S", "string in list 3")
                                )),
                                "five", Map.of("M", Map.of(
                                        "key1", "val1",
                                        "key2", "val2"
                                )),
                                "six", Map.of("N", "1234"),
                                "seven", Map.of("NS", List.of("12", "34", "56")),
                                "eight", Map.of("NULL", true),
                                "nine", Map.of("S", "string value")
                        ),
                        "TableName", "table_name"
                ),
                GetItemRequest.class
        );

        assertNotNull(request);
        assertArrayEquals(new String[]{"one", "two", "three"}, request.attributesToGet().toArray());
        assertTrue(request.consistentRead());
        assertEquals(9, request.key().size());
        assertEquals("table_name", request.tableName());
    }

}
