package com.appsmith.server.migrations.db.ce;

import com.appsmith.server.domains.Plugin;
import io.mongock.api.annotations.ChangeUnit;
import io.mongock.api.annotations.Execution;
import io.mongock.api.annotations.RollbackExecution;
import org.springframework.data.mongodb.core.MongoTemplate;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@ChangeUnit(order = "010", id = "update-plugins-docs-link", author = " ")
public class Migration010UpdatePluginDocsLink {
    private final MongoTemplate mongoTemplate;

    public Migration010UpdatePluginDocsLink(MongoTemplate mongoTemplate) {
        this.mongoTemplate = mongoTemplate;
    }

    @RollbackExecution
    public void rollBackExecution() {
        // This migration is inconsequential to product functionality, so we do not need a rollback strategy
    }

    @Execution
    public void updatePluginDocumentationLinks() {

        final Map<String, String> newDocsLinkMap = new HashMap<>();
        newDocsLinkMap.putAll(Map.of(
                "amazons3-plugin", "https://docs.appsmith.com/reference/datasources/querying-amazon-s3#list-files",
                "postgres-plugin",
                        "https://docs.appsmith.com/reference/datasources/querying-postgres#create-crud-queries",
                "mongo-plugin", "https://docs.appsmith.com/reference/datasources/querying-mongodb#create-queries",
                "mysql-plugin", "https://docs.appsmith.com/reference/datasources/querying-mysql#create-queries",
                "elasticsearch-plugin",
                        "https://docs.appsmith.com/reference/datasources/querying-elasticsearch#querying-elasticsearch",
                "dynamo-plugin", "https://docs.appsmith.com/reference/datasources/querying-dynamodb#create-queries",
                "redis-plugin", "https://docs.appsmith.com/reference/datasources/querying-redis#querying-redis",
                "mssql-plugin", "https://docs.appsmith.com/reference/datasources/querying-mssql#create-queries",
                "firestore-plugin",
                        "https://docs.appsmith.com/reference/datasources/querying-firestore#understanding-commands",
                "redshift-plugin",
                        "https://docs.appsmith.com/reference/datasources/querying-redshift#querying-redshift"));
        newDocsLinkMap.putAll(Map.of(
                "google-sheets-plugin",
                        "https://docs.appsmith.com/reference/datasources/querying-google-sheets#create-queries",
                "snowflake-plugin",
                        "https://docs.appsmith.com/reference/datasources/querying-snowflake-db#querying-snowflake",
                "arangodb-plugin",
                        "https://docs.appsmith.com/reference/datasources/querying-arango-db#using-queries-in-applications",
                "smtp-plugin", "https://docs.appsmith.com/reference/datasources/using-smtp",
                "graphql-plugin", "https://docs.appsmith.com/reference/datasources/graphql#create-queries"));

        List<Plugin> plugins = mongoTemplate.findAll(Plugin.class);

        for (Plugin plugin : plugins) {
            if (newDocsLinkMap.containsKey(plugin.getPackageName())) {
                plugin.setDocumentationLink(newDocsLinkMap.get(plugin.getPackageName()));
                mongoTemplate.save(plugin);
            }
        }
    }
}
