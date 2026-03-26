package com.appsmith.external.constants;

import java.util.List;

import static com.appsmith.external.constants.PluginConstants.PackageName.APPSMITH_AI_PLUGIN;
import static com.appsmith.external.constants.PluginConstants.PackageName.GRAPHQL_PLUGIN;
import static com.appsmith.external.constants.PluginConstants.PackageName.REST_API_PLUGIN;

public interface PluginConstants {

    interface PackageName {
        String SAAS_PLUGIN = "saas-plugin";
        String RAPID_API_PLUGIN = "rapidapi-plugin";
        String FIRESTORE_PLUGIN = "firestore-plugin";
        String REDSHIFT_PLUGIN = "redshift-plugin";
        String DYNAMO_PLUGIN = "dynamo-plugin";
        String AMAZON_S3_PLUGIN = "amazons3-plugin";
        String GOOGLE_SHEETS_PLUGIN = "google-sheets-plugin";
        String REST_API_PLUGIN = "restapi-plugin";
        String GRAPHQL_PLUGIN = "graphql-plugin";
        String OPEN_AI_PLUGIN = "openai-plugin";
        String ANTHROPIC_PLUGIN = "anthropic-plugin";
        String GOOGLE_AI_PLUGIN = "googleai-plugin";
        String APPSMITH_AI_PLUGIN = "appsmithai-plugin";
        String DATABRICKS_PLUGIN = "databricks-plugin";
        String AWS_LAMBDA_PLUGIN = "aws-lambda-plugin";
        String MONGO_PLUGIN = "mongo-plugin";
    }

    String DEFAULT_REST_DATASOURCE = "DEFAULT_REST_DATASOURCE";
    String DEFAULT_APPSMITH_AI_DATASOURCE = "DEFAULT_APPSMITH_AI_DATASOURCE";

    interface PluginName {
        String S3_PLUGIN_NAME = "S3";
        String ARANGO_PLUGIN_NAME = "Arango";
        String DYNAMO_PLUGIN_NAME = "Dynamo";
        String ELASTIC_SEARCH_PLUGIN_NAME = "ElasticSearch";
        String FIRESTORE_PLUGIN_NAME = "Firestore";
        String GOOGLE_SHEETS_PLUGIN_NAME = "GoogleSheets";
        String GRAPHQL_PLUGIN_NAME = "Graphql";
        String MSSQL_PLUGIN_NAME = "Mssql";
        String MYSQL_PLUGIN_NAME = "Mysql";
        String ORACLE_PLUGIN_NAME = "Oracle";
        String POSTGRES_PLUGIN_NAME = "Postgres";
        String REDIS_PLUGIN_NAME = "Redis";
        String REDSHIFT_PLUGIN_NAME = "Redshift";
        String REST_API_PLUGIN_NAME = "RestApi";
        String SAAS_PLUGIN_NAME = "Saas";
        String SMTP_PLUGIN_NAME = "Smtp";
        String SNOWFLAKE_PLUGIN_NAME = "Snowflake";

        String OPEN_AI_PLUGIN_NAME = "Open AI";
        String ANTHROPIC_PLUGIN_NAME = "Anthropic";
        String GOOGLE_AI_PLUGIN_NAME = "Google AI";
        String APPSMITH_AI_PLUGIN_NAME = "Appsmith AI";
        String DATABRICKS_PLUGIN_NAME = "Databricks";
        String AWS_LAMBDA_PLUGIN_NAME = "AWS Lambda";
    }

    interface HostName {
        String LOCALHOST = "localhost";
    }

    List<String> PLUGINS_THAT_ALLOW_QUERY_CREATION_WITHOUT_DATASOURCE =
            List.of(REST_API_PLUGIN, GRAPHQL_PLUGIN, APPSMITH_AI_PLUGIN);
}
