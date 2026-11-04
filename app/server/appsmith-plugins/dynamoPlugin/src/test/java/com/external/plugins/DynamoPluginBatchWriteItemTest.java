package com.external.plugins;

import org.junit.jupiter.api.Test;
import software.amazon.awssdk.core.SdkBytes;
import software.amazon.awssdk.services.dynamodb.model.AttributeValue;
import software.amazon.awssdk.services.dynamodb.model.BatchWriteItemRequest;
import software.amazon.awssdk.services.dynamodb.model.DeleteRequest;
import software.amazon.awssdk.services.dynamodb.model.PutRequest;
import software.amazon.awssdk.services.dynamodb.model.WriteRequest;

import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * BatchWriteItem's request items are lists of write requests per table. Binary values in them are read as base64,
 * the form DynamoDB takes in a request's JSON.
 */
class DynamoPluginBatchWriteItemTest {

    @Test
    void should_buildWriteRequestsWithBase64Binary_when_bodyHasRequestItems() throws Exception {
        // Given
        Map<String, Object> body = Map.of(
                "RequestItems",
                Map.of(
                        "Music",
                        List.of(
                                Map.of(
                                        "PutRequest",
                                        Map.of(
                                                "Item",
                                                Map.of(
                                                        "Artist", Map.of("S", "E"),
                                                        "Cover", Map.of("B", "aGVsbG8="),
                                                        "Samples", Map.of("BS", List.of("aGk=")),
                                                        "Album", Map.of("M", Map.of("Art", Map.of("B", "YXJ0")))))),
                                Map.of("DeleteRequest", Map.of("Key", Map.of("Artist", Map.of("S", "F")))))),
                "ReturnConsumedCapacity",
                "TOTAL");

        // When
        BatchWriteItemRequest request = DynamoPlugin.plainToSdk(body, BatchWriteItemRequest.class);

        // Then
        BatchWriteItemRequest expected = BatchWriteItemRequest.builder()
                .requestItems(Map.of(
                        "Music",
                        List.of(
                                WriteRequest.builder()
                                        .putRequest(PutRequest.builder()
                                                .item(Map.of(
                                                        "Artist",
                                                        AttributeValue.builder()
                                                                .s("E")
                                                                .build(),
                                                        "Cover",
                                                        AttributeValue.builder()
                                                                .b(bytes("hello"))
                                                                .build(),
                                                        "Samples",
                                                        AttributeValue.builder()
                                                                .bs(bytes("hi"))
                                                                .build(),
                                                        "Album",
                                                        AttributeValue.builder()
                                                                .m(
                                                                        Map.of(
                                                                                "Art",
                                                                                AttributeValue.builder()
                                                                                        .b(bytes("art"))
                                                                                        .build()))
                                                                .build()))
                                                .build())
                                        .build(),
                                WriteRequest.builder()
                                        .deleteRequest(DeleteRequest.builder()
                                                .key(Map.of(
                                                        "Artist",
                                                        AttributeValue.builder()
                                                                .s("F")
                                                                .build()))
                                                .build())
                                        .build())))
                .returnConsumedCapacity("TOTAL")
                .build();
        assertThat(request).isEqualTo(expected);
    }

    private static SdkBytes bytes(String text) {
        return SdkBytes.fromByteArray(text.getBytes(StandardCharsets.UTF_8));
    }
}
