package com.appsmith.external.constants;

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
        String GRAPH_QL_PLUGIN = "graphql-plugin";
        String OPEN_AI_PLUGIN = "openai-plugin";
        String ANTHROPIC_PLUGIN = "anthropic-plugin";
    }

    public static final String DEFAULT_REST_DATASOURCE = "DEFAULT_REST_DATASOURCE";

    interface PluginName {
        public static final String S3_PLUGIN_NAME = "S3";
        public static final String ARANGO_PLUGIN_NAME = "Arango";
        public static final String DYNAMO_PLUGIN_NAME = "Dynamo";
        public static final String ELASTIC_SEARCH_PLUGIN_NAME = "ElasticSearch";
        public static final String FIRESTORE_PLUGIN_NAME = "Firestore";
        public static final String GOOGLE_SHEETS_PLUGIN_NAME = "GoogleSheets";
        public static final String GRAPHQL_PLUGIN_NAME = "Graphql";
        public static final String MSSQL_PLUGIN_NAME = "Mssql";
        public static final String MYSQL_PLUGIN_NAME = "Mysql";
        public static final String ORACLE_PLUGIN_NAME = "Oracle";
        public static final String POSTGRES_PLUGIN_NAME = "Postgres";
        public static final String REDIS_PLUGIN_NAME = "Redis";
        public static final String REDSHIFT_PLUGIN_NAME = "Redshift";
        public static final String REST_API_PLUGIN_NAME = "RestApi";
        public static final String SAAS_PLUGIN_NAME = "Saas";
        public static final String SMTP_PLUGIN_NAME = "Smtp";
        public static final String SNOWFLAKE_PLUGIN_NAME = "Snowflake";

        public static final String OPEN_AI_PLUGIN_NAME = "Open AI";
        public static final String ANTHROPIC_PLUGIN_NAME = "Anthropic";
    }

    interface HostName {
        public static final String LOCALHOST = "localhost";
    }
}
