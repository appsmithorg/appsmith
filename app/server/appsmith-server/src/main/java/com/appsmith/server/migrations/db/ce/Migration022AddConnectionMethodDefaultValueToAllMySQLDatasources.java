package com.appsmith.server.migrations.db.ce;

import com.appsmith.external.models.Datasource;
import com.appsmith.external.models.DatasourceStorage;
import com.appsmith.external.models.Property;
import com.appsmith.server.domains.Plugin;
import io.mongock.api.annotations.ChangeUnit;
import io.mongock.api.annotations.Execution;
import io.mongock.api.annotations.RollbackExecution;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Query;

import java.util.ArrayList;
import java.util.List;

import static com.appsmith.server.migrations.MigrationHelperMethods.fetchAllDomainObjectsUsingId;
import static com.appsmith.server.migrations.MigrationHelperMethods.getQueryToFetchAllDomainObjectsWhichAreNotDeletedUsingPluginId;
import static org.springframework.data.mongodb.core.query.Criteria.where;
import static org.springframework.data.mongodb.core.query.Query.query;
import static org.springframework.util.CollectionUtils.isEmpty;

/**
 * A new toggle `Connection method` was introduced to the MySQL datasource configuration form as part of the
 * MySQL SSH tunnel feature. This migration change will add a default value for this new toggle field in the older
 * MySQL datasources.
 */
@ChangeUnit(order = "022", id = "add-connection-method-default-value-for-mysql", author = " ")
public class Migration022AddConnectionMethodDefaultValueToAllMySQLDatasources {
    private final MongoTemplate mongoTemplate;

    public Migration022AddConnectionMethodDefaultValueToAllMySQLDatasources(MongoTemplate mongoTemplate) {
        this.mongoTemplate = mongoTemplate;
    }

    @RollbackExecution
    public void rollBackExecution() {}

    @Execution
    public void updateConnectionMethodDefaultValueForMySQL() {
        Plugin mysqlPlugin = mongoTemplate.findOne(query(where("packageName").is("mysql-plugin")), Plugin.class);
        Query queryToGetDatasources = getQueryToFetchAllDomainObjectsWhichAreNotDeletedUsingPluginId(mysqlPlugin);
        queryToGetDatasources.fields().include(Datasource.Fields.id);
        List<Datasource> mysqlDatasources = mongoTemplate.find(queryToGetDatasources, Datasource.class);

        /**
         * Quoting from the Spring framework's official documentation:
         * Once configured, MongoTemplate is thread-safe and can be reused across multiple instances.
         *
         * ref: sec 5.4 in https://docs.spring.io/spring-data/data-document/docs/current/reference/html/
         */
        mysqlDatasources.parallelStream().map(Datasource::getId).forEach(id -> {
            List<DatasourceStorage> datasourceStorageList = fetchAllDomainObjectsUsingId(
                    id, mongoTemplate, DatasourceStorage.Fields.datasourceId, DatasourceStorage.class);
            datasourceStorageList.stream()
                    .filter(datasourceStorage -> datasourceStorage.getDatasourceConfiguration() != null)
                    .forEach(datasourceStorage -> {
                        List<Property> properties =
                                datasourceStorage.getDatasourceConfiguration().getProperties();
                        if (isEmpty(properties)) {
                            properties = new ArrayList<>();
                            properties.add(null);
                            datasourceStorage.getDatasourceConfiguration().setProperties(properties);
                        }

                        /**
                         * This condition should make sure that no matter how many times the regression is run, it
                         * will update the properties list only if it has not been updated by this migration before.
                         * This should prove helpful in case there is any migration failure.
                         */
                        if (properties.size() == 1) {
                            properties.add(new Property("Connection method", "STANDARD"));
                            mongoTemplate.save(datasourceStorage);
                        }
                    });
        });
    }
}
