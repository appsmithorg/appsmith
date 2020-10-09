package com.external.plugins.dynamodb.actions;

import lombok.Data;
import org.apache.commons.lang.ObjectUtils;
import software.amazon.awssdk.services.dynamodb.DynamoDbClient;
import software.amazon.awssdk.services.dynamodb.model.ListTablesRequest;
import software.amazon.awssdk.services.dynamodb.model.ListTablesResponse;

import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.Map;

public class ListTables {

    @Data
    public static class Parameters {
        String exclusiveStartTableName;
        Integer limit;
    }

    public static Map<String, Object> execute(DynamoDbClient ddb, Parameters parameters) {
        ListTablesRequest.Builder request = ListTablesRequest.builder();

        if (parameters.exclusiveStartTableName != null) {
            request = request.exclusiveStartTableName(parameters.exclusiveStartTableName);
        }

        if (parameters.limit != null) {
            request = request.limit(parameters.limit);
        }

        final ListTablesResponse response = ddb.listTables(request.build());

        final Map<String, Object> body = new LinkedHashMap<>();
        body.put("tables", ObjectUtils.defaultIfNull(response.tableNames(), Collections.emptyList()));
        body.put("lastEvaluatedTableName", response.lastEvaluatedTableName());
        return body;
    }

}
