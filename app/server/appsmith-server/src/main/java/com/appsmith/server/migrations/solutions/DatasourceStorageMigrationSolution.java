package com.appsmith.server.migrations.solutions;

import com.appsmith.external.models.Environment;
import com.appsmith.external.models.QEnvironment;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.migrations.solutions.ce.DatasourceStorageMigrationSolutionCE;
import com.appsmith.server.migrations.utils.CompatibilityUtils;
import lombok.NoArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;

import java.util.Map;
import java.util.stream.Collectors;

import static com.appsmith.server.repositories.ce.BaseAppsmithRepositoryCEImpl.fieldName;
import static org.springframework.data.mongodb.core.query.Criteria.where;

@Slf4j
@NoArgsConstructor
public class DatasourceStorageMigrationSolution extends DatasourceStorageMigrationSolutionCE {

    @Override
    public Map<String, String> getDefaultEnvironmentsMap(MongoTemplate mongoTemplate) {
        Query defaultEnvironmentQuery = new Query().addCriteria(nonDeletedDefaultEnvironmentCriteria());
        defaultEnvironmentQuery.fields().include(
                fieldName(QEnvironment.environment.id),
                fieldName(QEnvironment.environment.workspaceId));

        final Query performanceOptimizedDefaultEnvironmentQuery = CompatibilityUtils
                .optimizeQueryForNoCursorTimeout(mongoTemplate, defaultEnvironmentQuery, Environment.class);

        return mongoTemplate.find(performanceOptimizedDefaultEnvironmentQuery, Environment.class)
                .stream()
                .collect(Collectors.toMap(Environment::getWorkspaceId, Environment::getId));
    }

    @Override
    public String getEnvironmentIdForDatasource(Map<String, String> wsIdToEnvIdMap,
                                                String workspaceId) {
        if (!wsIdToEnvIdMap.containsKey(workspaceId)) {
             log.debug("No default environment id found for the given workspace id : {}", workspaceId);
        }

        // the default value has been placed so that incase of failures we to environmentId as unused_env
        return wsIdToEnvIdMap.getOrDefault(workspaceId, FieldName.UNUSED_ENVIRONMENT_ID);
    }


    public static Criteria olderCheckForDeletedCriteria() {
        return new Criteria().orOperator(
                where(FieldName.DELETED).exists(false),
                where(FieldName.DELETED).is(false)
        );
    }

    public static Criteria newerCheckForDeletedCriteria() {
        return new Criteria().orOperator(
                where(FieldName.DELETED_AT).exists(false),
                where(FieldName.DELETED_AT).is(null)
        );

    }

    public static Criteria nonDeletedDefaultEnvironmentCriteria() {
        return new Criteria().andOperator(
                olderCheckForDeletedCriteria(),
                newerCheckForDeletedCriteria(),
                where(fieldName(QEnvironment.environment.workspaceId)).exists(true),
                where(fieldName(QEnvironment.environment.workspaceId)).ne(null),
                where(fieldName(QEnvironment.environment.isDefault)).is(true)
        );
    }

}
