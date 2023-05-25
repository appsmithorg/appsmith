package com.appsmith.server.migrations.solutions;

import com.appsmith.external.models.Environment;
import com.appsmith.external.models.QEnvironment;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.migrations.solutions.ce.DatasourceStorageMigrationSolutionCE;
import com.appsmith.server.migrations.utils.CompatibilityUtils;
import lombok.NoArgsConstructor;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;

import java.util.Map;
import java.util.stream.Collectors;

import static com.appsmith.server.repositories.ce.BaseAppsmithRepositoryCEImpl.fieldName;
import static org.springframework.data.mongodb.core.query.Criteria.where;

@NoArgsConstructor
public class DatasourceStorageMigrationSolution extends DatasourceStorageMigrationSolutionCE {

    @Override
    public Map<String, String> getDefaultEnvironmentsMap(MongoTemplate mongoTemplate) {
        Query defaultEnvironmentQuery = new Query().addCriteria(nonDeletedDefaultEnvironmentCriteria());
        defaultEnvironmentQuery.fields().include(fieldName(QEnvironment.environment.id),
                fieldName(QEnvironment.environment.workspaceId));

        final Query performanceOptimizedUpdateQuery = CompatibilityUtils
                .optimizeQueryForNoCursorTimeout(mongoTemplate, defaultEnvironmentQuery, Environment.class);


        return mongoTemplate.find(performanceOptimizedUpdateQuery, Environment.class)
                .stream().collect(Collectors.toMap(Environment::getWorkspaceId, Environment::getId));
    }

    @Override
    public String getEnvironmentIdForDatasource(Map<String, String> wsIdToEnvIdMap,
                                                String workspaceId) {
        return wsIdToEnvIdMap.get(workspaceId); // in case if it returns null what should be the action?

    }

    public static Criteria nonDeletedDefaultEnvironmentCriteria() {
        return new Criteria().andOperator( new Criteria().orOperator(
                        where(FieldName.DELETED).exists(false),
                        where(FieldName.DELETED).is(false)
                ),
                new Criteria().orOperator(
                        where(FieldName.DELETED_AT).exists(false),
                        where(FieldName.DELETED_AT).is(null)
                ),
                where(fieldName(QEnvironment.environment.workspaceId)).exists(true),
                where(fieldName(QEnvironment.environment.workspaceId)).not().is(null),
                where(fieldName(QEnvironment.environment.isDefault)).is(true)
        );
    }

}
