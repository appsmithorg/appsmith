package com.appsmith.server.migrations.solutions.ce;

import com.appsmith.server.constants.FieldName;
import org.springframework.data.mongodb.core.MongoTemplate;

import java.util.Map;

public class DatasourceStorageMigrationSolutionCE {

    public Map<String, String> getDefaultEnvironmentsMap(MongoTemplate mongoTemplate) {
        return Map.of();
    }

    public String getEnvironmentIdForDatasource(Map<String, String> wsIdToEnvIdMap, String workspaceId) {
        return FieldName.UNUSED_ENVIRONMENT_ID;
    }
}
