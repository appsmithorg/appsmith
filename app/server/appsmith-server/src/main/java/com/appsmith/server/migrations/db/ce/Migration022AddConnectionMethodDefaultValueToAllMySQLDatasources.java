package com.appsmith.server.migrations.db.ce;

import com.appsmith.external.models.Datasource;
import com.appsmith.external.models.DatasourceStorage;
import com.appsmith.external.models.Property;
import com.appsmith.external.models.QDatasource;
import com.appsmith.external.models.QDatasourceStorage;
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
import static com.appsmith.server.repositories.ce.BaseAppsmithRepositoryCEImpl.fieldName;
import static org.springframework.data.mongodb.core.query.Criteria.where;
import static org.springframework.data.mongodb.core.query.Query.query;
import static org.springframework.util.CollectionUtils.isEmpty;

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
        queryToGetDatasources.fields().include(fieldName(QDatasource.datasource.id));
        List<Datasource> mysqlDatasources = mongoTemplate.find(queryToGetDatasources, Datasource.class);

        /**
         * Quoting from the Spring framework's official documentation:
         * Once configured, MongoTemplate is thread-safe and can be reused across multiple instances.
         *
         * ref: sec 5.4 in https://docs.spring.io/spring-data/data-document/docs/current/reference/html/
         */
        mysqlDatasources.parallelStream()
                .map(Datasource::getId)
                .forEach(id -> {
                    List<DatasourceStorage> datasourceStorageList = fetchAllDomainObjectsUsingId(id, mongoTemplate,
                            QDatasourceStorage.datasourceStorage.datasourceId
                            , DatasourceStorage.class);
                    datasourceStorageList.stream()
                            .forEach(datasourceStorage -> {
                                List<Property> properties = datasourceStorage.getDatasourceConfiguration().getProperties();
                                if(isEmpty(properties)) {
                                    properties = new ArrayList<>();
                                    properties.add(null);
                                    datasourceStorage.getDatasourceConfiguration().setProperties(properties);
                                }

                                properties.add(new Property("Connection method", "STANDARD"));
                                mongoTemplate.save(datasourceStorage);
                            });
                });

    }
}
