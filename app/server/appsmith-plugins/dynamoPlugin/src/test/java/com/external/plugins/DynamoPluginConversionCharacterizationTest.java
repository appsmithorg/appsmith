package com.external.plugins;

import com.appsmith.external.models.ActionConfiguration;
import com.appsmith.external.models.ActionExecutionResult;
import com.appsmith.external.models.DatasourceConfiguration;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;
import software.amazon.awssdk.core.SdkBytes;
import software.amazon.awssdk.services.dynamodb.DynamoDbClient;
import software.amazon.awssdk.services.dynamodb.model.AttributeDefinition;
import software.amazon.awssdk.services.dynamodb.model.AttributeValue;
import software.amazon.awssdk.services.dynamodb.model.BatchGetItemRequest;
import software.amazon.awssdk.services.dynamodb.model.BillingMode;
import software.amazon.awssdk.services.dynamodb.model.BillingModeSummary;
import software.amazon.awssdk.services.dynamodb.model.Capacity;
import software.amazon.awssdk.services.dynamodb.model.ConsumedCapacity;
import software.amazon.awssdk.services.dynamodb.model.CreateTableRequest;
import software.amazon.awssdk.services.dynamodb.model.DescribeTableRequest;
import software.amazon.awssdk.services.dynamodb.model.DescribeTableResponse;
import software.amazon.awssdk.services.dynamodb.model.Get;
import software.amazon.awssdk.services.dynamodb.model.GetItemRequest;
import software.amazon.awssdk.services.dynamodb.model.GetItemResponse;
import software.amazon.awssdk.services.dynamodb.model.GlobalSecondaryIndexDescription;
import software.amazon.awssdk.services.dynamodb.model.IndexStatus;
import software.amazon.awssdk.services.dynamodb.model.KeySchemaElement;
import software.amazon.awssdk.services.dynamodb.model.KeyType;
import software.amazon.awssdk.services.dynamodb.model.KeysAndAttributes;
import software.amazon.awssdk.services.dynamodb.model.Projection;
import software.amazon.awssdk.services.dynamodb.model.ProjectionType;
import software.amazon.awssdk.services.dynamodb.model.ProvisionedThroughputDescription;
import software.amazon.awssdk.services.dynamodb.model.PutItemRequest;
import software.amazon.awssdk.services.dynamodb.model.QueryRequest;
import software.amazon.awssdk.services.dynamodb.model.QueryResponse;
import software.amazon.awssdk.services.dynamodb.model.ScalarAttributeType;
import software.amazon.awssdk.services.dynamodb.model.StreamSpecification;
import software.amazon.awssdk.services.dynamodb.model.StreamViewType;
import software.amazon.awssdk.services.dynamodb.model.TableDescription;
import software.amazon.awssdk.services.dynamodb.model.TableStatus;
import software.amazon.awssdk.services.dynamodb.model.TimeToLiveSpecification;
import software.amazon.awssdk.services.dynamodb.model.TransactGetItem;
import software.amazon.awssdk.services.dynamodb.model.TransactGetItemsRequest;
import software.amazon.awssdk.services.dynamodb.model.UpdateTimeToLiveRequest;

import java.time.Duration;
import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Stream;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

/**
 * Pins the plugin's conversions between query bodies and SDK objects. Bodies are converted to requests built with the
 * SDK's typed builders; typed SDK responses are converted to what an execution returns, kept in
 * {@code characterization/conversion-golden.json}.
 */
class DynamoPluginConversionCharacterizationTest {

    private static final CharacterizationGolden GOLDEN =
            new CharacterizationGolden("conversion", DynamoPluginConversionCharacterizationTest.class);
    private static final DynamoPlugin.DynamoPluginExecutor EXECUTOR = new DynamoPlugin.DynamoPluginExecutor();

    @AfterAll
    static void writeActuals() {
        GOLDEN.writeActuals();
    }

    static Stream<Arguments> bodiesAndRequests() {
        return Stream.of(
                Arguments.of(
                        "PutItem with every attribute value kind",
                        PutItemRequest.class,
                        Map.of("TableName", "Music", "Item", plainItem(), "ReturnValues", "ALL_OLD"),
                        PutItemRequest.builder()
                                .tableName("Music")
                                .item(sdkItem())
                                .returnValues("ALL_OLD")
                                .build()),
                Arguments.of(
                        "GetItem with key, projection and names",
                        GetItemRequest.class,
                        Map.of(
                                "TableName",
                                "Music",
                                "Key",
                                Map.of("Artist", Map.of("S", "A"), "SongTitle", Map.of("S", "S1")),
                                "ProjectionExpression",
                                "#yr",
                                "ExpressionAttributeNames",
                                Map.of("#yr", "Year"),
                                "ConsistentRead",
                                true),
                        GetItemRequest.builder()
                                .tableName("Music")
                                .key(Map.of("Artist", s("A"), "SongTitle", s("S1")))
                                .projectionExpression("#yr")
                                .expressionAttributeNames(Map.of("#yr", "Year"))
                                .consistentRead(true)
                                .build()),
                Arguments.of(
                        "Query with values of every kind and a start key",
                        QueryRequest.class,
                        Map.of(
                                "TableName",
                                "Music",
                                "KeyConditionExpression",
                                "Artist = :a",
                                "ExpressionAttributeValues",
                                Map.of(
                                        ":a", Map.of("S", "A"),
                                        ":n", Map.of("N", "5"),
                                        ":b", Map.of("BOOL", false),
                                        ":bin", Map.of("B", "bytes"),
                                        ":ss", Map.of("SS", List.of("x", "y"))),
                                "ExclusiveStartKey",
                                Map.of("Artist", Map.of("S", "A"), "SongTitle", Map.of("S", "S2")),
                                "Limit",
                                2,
                                "ScanIndexForward",
                                false,
                                "Select",
                                "ALL_ATTRIBUTES"),
                        QueryRequest.builder()
                                .tableName("Music")
                                .keyConditionExpression("Artist = :a")
                                .expressionAttributeValues(Map.of(
                                        ":a",
                                        s("A"),
                                        ":n",
                                        AttributeValue.builder().n("5").build(),
                                        ":b",
                                        AttributeValue.builder().bool(false).build(),
                                        ":bin",
                                        AttributeValue.builder()
                                                .b(SdkBytes.fromUtf8String("bytes"))
                                                .build(),
                                        ":ss",
                                        AttributeValue.builder().ss("x", "y").build()))
                                .exclusiveStartKey(Map.of("Artist", s("A"), "SongTitle", s("S2")))
                                .limit(2)
                                .scanIndexForward(false)
                                .select("ALL_ATTRIBUTES")
                                .build()),
                Arguments.of(
                        "BatchGetItem with keys per table",
                        BatchGetItemRequest.class,
                        Map.of(
                                "RequestItems",
                                Map.of(
                                        "Music",
                                        Map.of(
                                                "Keys",
                                                List.of(Map.of("Artist", Map.of("S", "A"))),
                                                "ConsistentRead",
                                                true)),
                                "ReturnConsumedCapacity",
                                "TOTAL"),
                        BatchGetItemRequest.builder()
                                .requestItems(Map.of(
                                        "Music",
                                        KeysAndAttributes.builder()
                                                .keys(List.of(Map.of("Artist", s("A"))))
                                                .consistentRead(true)
                                                .build()))
                                .returnConsumedCapacity("TOTAL")
                                .build()),
                Arguments.of(
                        "TransactGetItems with a list of nested objects",
                        TransactGetItemsRequest.class,
                        Map.of(
                                "TransactItems",
                                List.of(Map.of(
                                        "Get",
                                        Map.of("TableName", "Music", "Key", Map.of("Artist", Map.of("S", "A")))))),
                        TransactGetItemsRequest.builder()
                                .transactItems(List.of(TransactGetItem.builder()
                                        .get(Get.builder()
                                                .tableName("Music")
                                                .key(Map.of("Artist", s("A")))
                                                .build())
                                        .build()))
                                .build()),
                Arguments.of(
                        "CreateTable with definitions, key schema and billing mode",
                        CreateTableRequest.class,
                        Map.of(
                                "TableName",
                                "Music",
                                "AttributeDefinitions",
                                List.of(Map.of("AttributeName", "Artist", "AttributeType", "S")),
                                "KeySchema",
                                List.of(Map.of("AttributeName", "Artist", "KeyType", "HASH")),
                                "BillingMode",
                                "PAY_PER_REQUEST"),
                        CreateTableRequest.builder()
                                .tableName("Music")
                                .attributeDefinitions(AttributeDefinition.builder()
                                        .attributeName("Artist")
                                        .attributeType(ScalarAttributeType.S)
                                        .build())
                                .keySchema(KeySchemaElement.builder()
                                        .attributeName("Artist")
                                        .keyType(KeyType.HASH)
                                        .build())
                                .billingMode(BillingMode.PAY_PER_REQUEST)
                                .build()),
                Arguments.of(
                        "UpdateTimeToLive with a nested object",
                        UpdateTimeToLiveRequest.class,
                        Map.of(
                                "TableName",
                                "Music",
                                "TimeToLiveSpecification",
                                Map.of("Enabled", true, "AttributeName", "ttl")),
                        UpdateTimeToLiveRequest.builder()
                                .tableName("Music")
                                .timeToLiveSpecification(TimeToLiveSpecification.builder()
                                        .enabled(true)
                                        .attributeName("ttl")
                                        .build())
                                .build()));
    }

    @ParameterizedTest(name = "{0}")
    @MethodSource("bodiesAndRequests")
    void should_buildTheTypedRequest_when_bodyIsConverted(
            String description, Class<?> requestType, Map<String, Object> body, Object expected) throws Exception {
        // Given
        Map<String, Object> mutableBody = new LinkedHashMap<>(body);

        // When
        Object request = DynamoPlugin.plainToSdk(mutableBody, requestType);

        // Then
        assertThat(request).isEqualTo(expected);
    }

    @Test
    void should_returnCharacterizedItem_when_responseHasEveryAttributeValueKind() throws Exception {
        // Given
        DynamoDbClient client = mock(DynamoDbClient.class);
        when(client.getItem(any(GetItemRequest.class)))
                .thenReturn(GetItemResponse.builder()
                        .item(sdkItem())
                        .consumedCapacity(ConsumedCapacity.builder()
                                .tableName("Music")
                                .capacityUnits(1.0)
                                .build())
                        .build());

        // When
        ActionExecutionResult result = execute(client, "GetItem", "{\"TableName\":\"Music\"}");

        // Then
        GOLDEN.assertMatches("GetItem_everyAttributeValueKind", CharacterizationGolden.snapshot(result, true));
    }

    @Test
    void should_returnCharacterizedTable_when_describeTableResponseIsPopulated() throws Exception {
        // Given
        DynamoDbClient client = mock(DynamoDbClient.class);
        when(client.describeTable(any(DescribeTableRequest.class)))
                .thenReturn(DescribeTableResponse.builder()
                        .table(TableDescription.builder()
                                .tableName("Music")
                                .tableStatus(TableStatus.ACTIVE)
                                .creationDateTime(Instant.parse("2017-03-15T18:33:17.149Z"))
                                .attributeDefinitions(AttributeDefinition.builder()
                                        .attributeName("Artist")
                                        .attributeType(ScalarAttributeType.S)
                                        .build())
                                .keySchema(KeySchemaElement.builder()
                                        .attributeName("Artist")
                                        .keyType(KeyType.HASH)
                                        .build())
                                .provisionedThroughput(ProvisionedThroughputDescription.builder()
                                        .readCapacityUnits(5L)
                                        .writeCapacityUnits(5L)
                                        .numberOfDecreasesToday(0L)
                                        .build())
                                .tableSizeBytes(2048L)
                                .itemCount(12L)
                                .tableArn("arn:aws:dynamodb:us-east-1:123456789012:table/Music")
                                .billingModeSummary(BillingModeSummary.builder()
                                        .billingMode(BillingMode.PROVISIONED)
                                        .build())
                                .globalSecondaryIndexes(GlobalSecondaryIndexDescription.builder()
                                        .indexName("TitleIndex")
                                        .indexStatus(IndexStatus.ACTIVE)
                                        .projection(Projection.builder()
                                                .projectionType(ProjectionType.KEYS_ONLY)
                                                .build())
                                        .build())
                                .streamSpecification(StreamSpecification.builder()
                                        .streamEnabled(true)
                                        .streamViewType(StreamViewType.NEW_IMAGE)
                                        .build())
                                .build())
                        .build());

        // When
        ActionExecutionResult result = execute(client, "DescribeTable", "{\"TableName\":\"Music\"}");

        // Then
        GOLDEN.assertMatches("DescribeTable_populated", CharacterizationGolden.snapshot(result, true));
    }

    @Test
    void should_returnCharacterizedPage_when_queryResponseHasLastEvaluatedKey() throws Exception {
        // Given
        DynamoDbClient client = mock(DynamoDbClient.class);
        when(client.query(any(QueryRequest.class)))
                .thenReturn(QueryResponse.builder()
                        .items(List.of(Map.of("Artist", s("A"), "SongTitle", s("S1"))))
                        .count(1)
                        .scannedCount(3)
                        .lastEvaluatedKey(Map.of("Artist", s("A"), "SongTitle", s("S1")))
                        .consumedCapacity(ConsumedCapacity.builder()
                                .tableName("Music")
                                .capacityUnits(0.5)
                                .table(Capacity.builder().capacityUnits(0.5).build())
                                .build())
                        .build());

        // When
        ActionExecutionResult result = execute(client, "Query", "{\"TableName\":\"Music\"}");

        // Then
        GOLDEN.assertMatches("Query_page", CharacterizationGolden.snapshot(result, true));
    }

    private static ActionExecutionResult execute(DynamoDbClient client, String action, String body) {
        ActionConfiguration configuration = new ActionConfiguration();
        configuration.setPath(action);
        configuration.setBody(body);
        return EXECUTOR.execute(client, new DatasourceConfiguration(), configuration)
                .block(Duration.ofSeconds(30));
    }

    private static AttributeValue s(String value) {
        return AttributeValue.builder().s(value).build();
    }

    /** An item in query-body form with every attribute value kind, nested maps and lists included. */
    private static Map<String, Object> plainItem() {
        Map<String, Object> item = new LinkedHashMap<>();
        item.put("S", Map.of("S", "text"));
        item.put("N", Map.of("N", "1.5"));
        item.put("B", Map.of("B", "bytes"));
        item.put("BOOL", Map.of("BOOL", true));
        item.put("NULL", Map.of("NULL", true));
        item.put("SS", Map.of("SS", List.of("a", "b")));
        item.put("NS", Map.of("NS", List.of("1", "2")));
        item.put("BS", Map.of("BS", List.of("x", "y")));
        item.put("M", Map.of("M", Map.of("inner", Map.of("S", "v"), "list", Map.of("L", List.of(Map.of("N", "1"))))));
        item.put("L", Map.of("L", List.of(Map.of("S", "first"), Map.of("M", Map.of("k", Map.of("BOOL", false))))));
        return item;
    }

    /** {@link #plainItem()} as the SDK represents it. */
    private static Map<String, AttributeValue> sdkItem() {
        Map<String, AttributeValue> item = new LinkedHashMap<>();
        item.put("S", s("text"));
        item.put("N", AttributeValue.builder().n("1.5").build());
        item.put(
                "B",
                AttributeValue.builder().b(SdkBytes.fromUtf8String("bytes")).build());
        item.put("BOOL", AttributeValue.builder().bool(true).build());
        item.put("NULL", AttributeValue.builder().nul(true).build());
        item.put("SS", AttributeValue.builder().ss("a", "b").build());
        item.put("NS", AttributeValue.builder().ns("1", "2").build());
        item.put(
                "BS",
                AttributeValue.builder()
                        .bs(SdkBytes.fromUtf8String("x"), SdkBytes.fromUtf8String("y"))
                        .build());
        item.put(
                "M",
                AttributeValue.builder()
                        .m(Map.of(
                                "inner",
                                s("v"),
                                "list",
                                AttributeValue.builder()
                                        .l(AttributeValue.builder().n("1").build())
                                        .build()))
                        .build());
        item.put(
                "L",
                AttributeValue.builder()
                        .l(
                                s("first"),
                                AttributeValue.builder()
                                        .m(Map.of(
                                                "k",
                                                AttributeValue.builder()
                                                        .bool(false)
                                                        .build()))
                                        .build())
                        .build());
        return item;
    }
}
