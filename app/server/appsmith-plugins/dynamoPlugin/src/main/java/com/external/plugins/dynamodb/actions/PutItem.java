package com.external.plugins.dynamodb.actions;

import lombok.Data;
import software.amazon.awssdk.services.dynamodb.DynamoDbClient;
import software.amazon.awssdk.services.dynamodb.model.AttributeValue;

import java.util.LinkedHashMap;
import java.util.Map;

public class PutItem {

    @Data
    public static class Parameters {
        String tableName;
        Map<String, AttributeValue> item;
    }

    public static Map<String, Object> execute(DynamoDbClient ddb, Parameters parameters) {
        System.out.println(parameters);

/*
        HashMap<String, AttributeValue> itemValues = new HashMap<>();
        for (final Map.Entry entry : parameters.item.entrySet()) {
            itemValues.put(
                    entry.getKey(),
                    software.amazon.awssdk.services.dynamodb.model.AttributeValue.builder().s(entry.getValue()).build()
            );
        }

        // Add all content to the table
        itemValues.put(key, AttributeValue.builder().s(keyVal).build());
        itemValues.put(songTitle, AttributeValue.builder().s(songTitleVal).build());
        itemValues.put(albumTitle, AttributeValue.builder().s(albumTitleValue).build());
        itemValues.put(awards, AttributeValue.builder().s(awardVal).build());

        // Create a PutItemRequest object
        PutItemRequest request = PutItemRequest.builder()
                .tableName(tableName)
                .item(itemValues)
                .build();

        ddb.putItem(request);
        System.out.println(tableName +" was successfully updated");

        //*/

        final Map<String, Object> body = new LinkedHashMap<>();
        body.put("lastEvaluatedTableName", "awesome");
        return body;
    }

}
