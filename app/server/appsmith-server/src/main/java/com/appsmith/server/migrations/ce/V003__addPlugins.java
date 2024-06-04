package com.appsmith.server.migrations.ce;

import com.appsmith.external.models.PluginType;
import com.appsmith.server.domains.Plugin;
import com.appsmith.server.migrations.AppsmithJavaMigration;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.jdbc.core.JdbcTemplate;

@Slf4j
public class V003__addPlugins extends AppsmithJavaMigration {
    private JdbcTemplate jdbcTemplate;

    @Override
    public void migrate(JdbcTemplate jdbcTemplate) throws Exception {
        this.jdbcTemplate = jdbcTemplate;
        addPostgresPlugin();
        addRestApiPlugin();
        addMongoDBPlugin();
        addMySQLPlugin();
        addElasticsearchPlugin();
        addDynamoDBPlugin();
        addRedisPlugin();
        addMsSQLPlugin();
        addFirestorePlugin();
        addRedshiftPlugin();
        addS3Plugin();
        addGoogleSheetsPlugin();
        addSnowflakePlugin();
        addArangoDBPlugin();
        addJSFunctionsPlugin();
        addSMTPPlugin();
        addAuthenticatedGraphQLAPIPlugin();
        addOraclePlugin();
        addOpenAIPlugin();
        addAnthropicPlugin();
        addGoogleAIPlugin();
        addDatabricksPlugin();
        addAppsmithAIPlugin();
        addAWSLambdaPlugin();
    }

    private void insertPlugin(Plugin plugin) {
        try {
            String sql =
                    """
                INSERT INTO plugin (id, name, type, package_name, icon_location, documentation_link, response_type, ui_component, datasource_component, generatecrudpage_component, default_install, is_remote_plugin, is_supported_for_air_gap, is_dependent_oncs, created_at, updated_at)
                VALUES (gen_random_uuid(), ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, now(), now())
                ON CONFLICT DO NOTHING
                """;
            jdbcTemplate.update(
                    sql,
                    plugin.getName(),
                    plugin.getType().toString(),
                    plugin.getPackageName(),
                    plugin.getIconLocation(),
                    plugin.getDocumentationLink(),
                    plugin.getResponseType() == null
                            ? null
                            : plugin.getResponseType().toString(),
                    plugin.getUiComponent(),
                    plugin.getDatasourceComponent(),
                    plugin.getGenerateCRUDPageComponent(),
                    plugin.getDefaultInstall(),
                    plugin.isRemotePlugin(),
                    plugin.isSupportedForAirGap(),
                    plugin.getIsDependentOnCS());
        } catch (DuplicateKeyException e) {
            log.warn("{} plugin already present in database.", plugin.getName());
        }
        installPluginToAllWorkspaces(plugin);
    }

    public void installPluginToAllWorkspaces(Plugin plugin) {
        // Get the plugin ID
        String pluginId =
                jdbcTemplate.queryForObject("SELECT id FROM plugin WHERE name = ?", String.class, plugin.getName());
        // Define the new plugin as a JSON object
        String newPlugin = String.format("'{\"pluginId\": \"%s\", \"status\": \"FREE\"}'::JSONB", pluginId);

        // Update the workspace table
        String sql =
                "UPDATE workspace SET plugins = plugins || " + newPlugin + " WHERE NOT (plugins @> " + newPlugin + ")";
        jdbcTemplate.update(sql);
    }

    private void addPostgresPlugin() {
        Plugin plugin = Plugin.builder()
                .name("PostgreSQL")
                .type(PluginType.DB)
                .packageName("postgres-plugin")
                .iconLocation("https://assets.appsmith.com/logo/Postgresql.png")
                .documentationLink(
                        "https://docs.appsmith.com/reference/datasources/querying-postgres#create-crud-queries")
                .responseType(Plugin.ResponseType.TABLE)
                .uiComponent("DbEditorForm")
                .datasourceComponent("AutoForm")
                .generateCRUDPageComponent("PostgreSQL")
                .defaultInstall(true)
                .isRemotePlugin(false)
                .isSupportedForAirGap(true)
                .build();
        insertPlugin(plugin);
    }

    private void addRestApiPlugin() {
        Plugin plugin = Plugin.builder()
                .name("REST API")
                .type(PluginType.API)
                .packageName("restapi-plugin")
                .iconLocation("https://assets.appsmith.com/RestAPI.png")
                .uiComponent("ApiEditorForm")
                .datasourceComponent("RestAPIDatasourceForm")
                .defaultInstall(true)
                .isRemotePlugin(false)
                .isSupportedForAirGap(true)
                .build();
        insertPlugin(plugin);
    }

    private void addMongoDBPlugin() {
        Plugin plugin = Plugin.builder()
                .name("MongoDB")
                .type(PluginType.DB)
                .packageName("mongo-plugin")
                .iconLocation("https://assets.appsmith.com/logo/mongodb.svg")
                .documentationLink("https://docs.appsmith.com/reference/datasources/querying-mongodb#create-queries")
                .responseType(Plugin.ResponseType.JSON)
                .uiComponent("UQIDbEditorForm")
                .datasourceComponent("AutoForm")
                .generateCRUDPageComponent("MongoDB")
                .defaultInstall(true)
                .isRemotePlugin(false)
                .isSupportedForAirGap(true)
                .build();
        insertPlugin(plugin);
    }

    private void addMySQLPlugin() {
        Plugin plugin = Plugin.builder()
                .name("MySQL")
                .type(PluginType.DB)
                .packageName("mysql-plugin")
                .iconLocation("https://assets.appsmith.com/logo/mysql.svg")
                .documentationLink("https://docs.appsmith.com/reference/datasources/querying-mysql#create-queries")
                .responseType(Plugin.ResponseType.TABLE)
                .uiComponent("DbEditorForm")
                .datasourceComponent("AutoForm")
                .generateCRUDPageComponent("SQL")
                .defaultInstall(true)
                .isRemotePlugin(false)
                .isSupportedForAirGap(true)
                .build();
        insertPlugin(plugin);
    }

    private void addElasticsearchPlugin() {
        Plugin plugin = Plugin.builder()
                .name("Elasticsearch")
                .type(PluginType.DB)
                .packageName("elasticsearch-plugin")
                .iconLocation("https://assets.appsmith.com/logo/elastic.svg")
                .documentationLink(
                        "https://docs.appsmith.com/reference/datasources/querying-elasticsearch#querying-elasticsearch")
                .responseType(Plugin.ResponseType.JSON)
                .uiComponent("DbEditorForm")
                .datasourceComponent("AutoForm")
                .defaultInstall(true)
                .isRemotePlugin(false)
                .isSupportedForAirGap(true)
                .build();
        insertPlugin(plugin);
    }

    private void addDynamoDBPlugin() {
        Plugin plugin = Plugin.builder()
                .name("DynamoDB")
                .type(PluginType.DB)
                .packageName("dynamo-plugin")
                .iconLocation("https://assets.appsmith.com/logo/aws-dynamodb.svg")
                .documentationLink("https://docs.appsmith.com/reference/datasources/querying-dynamodb#create-queries")
                .responseType(Plugin.ResponseType.JSON)
                .uiComponent("DbEditorForm")
                .datasourceComponent("AutoForm")
                .defaultInstall(true)
                .isRemotePlugin(false)
                .isSupportedForAirGap(true)
                .build();
        insertPlugin(plugin);
    }

    private void addRedisPlugin() {
        Plugin plugin = Plugin.builder()
                .name("Redis")
                .type(PluginType.DB)
                .packageName("redis-plugin")
                .iconLocation("https://assets.appsmith.com/logo/redis.svg")
                .documentationLink("https://docs.appsmith.com/reference/datasources/querying-redis#querying-redis")
                .responseType(Plugin.ResponseType.TABLE)
                .uiComponent("DbEditorForm")
                .datasourceComponent("AutoForm")
                .defaultInstall(true)
                .isRemotePlugin(false)
                .isSupportedForAirGap(true)
                .build();
        insertPlugin(plugin);
    }

    private void addMsSQLPlugin() {
        Plugin plugin = Plugin.builder()
                .name("Microsoft SQL Server")
                .type(PluginType.DB)
                .packageName("mssql-plugin")
                .iconLocation("https://assets.appsmith.com/logo/mssql.svg")
                .documentationLink("https://docs.appsmith.com/reference/datasources/querying-mssql#create-queries")
                .responseType(Plugin.ResponseType.TABLE)
                .uiComponent("DbEditorForm")
                .datasourceComponent("AutoForm")
                .generateCRUDPageComponent("SQL")
                .defaultInstall(true)
                .isRemotePlugin(false)
                .isSupportedForAirGap(true)
                .build();
        insertPlugin(plugin);
    }

    private void addFirestorePlugin() {
        Plugin plugin = Plugin.builder()
                .name("Firestore")
                .type(PluginType.DB)
                .packageName("firestore-plugin")
                .iconLocation("https://assets.appsmith.com/logo/firestore.svg")
                .documentationLink(
                        "https://docs.appsmith.com/reference/datasources/querying-firestore#understanding-commands")
                .responseType(Plugin.ResponseType.JSON)
                .uiComponent("UQIDbEditorForm")
                .datasourceComponent("AutoForm")
                .defaultInstall(true)
                .isRemotePlugin(false)
                .isSupportedForAirGap(true)
                .build();
        insertPlugin(plugin);
    }

    private void addRedshiftPlugin() {
        Plugin plugin = Plugin.builder()
                .name("Redshift")
                .type(PluginType.DB)
                .packageName("redshift-plugin")
                .iconLocation("https://assets.appsmith.com/logo/aws-redshift.svg")
                .documentationLink(
                        "https://docs.appsmith.com/reference/datasources/querying-redshift#querying-redshift")
                .responseType(Plugin.ResponseType.TABLE)
                .uiComponent("DbEditorForm")
                .datasourceComponent("AutoForm")
                .generateCRUDPageComponent("SQL")
                .defaultInstall(true)
                .isRemotePlugin(false)
                .isSupportedForAirGap(true)
                .build();
        insertPlugin(plugin);
    }

    private void addS3Plugin() {
        Plugin plugin = Plugin.builder()
                .name("S3")
                .type(PluginType.DB)
                .packageName("amazons3-plugin")
                .iconLocation("https://assets.appsmith.com/logo/aws-s3.svg")
                .documentationLink("https://docs.appsmith.com/reference/datasources/querying-amazon-s3#list-files")
                .responseType(Plugin.ResponseType.JSON)
                .uiComponent("UQIDbEditorForm")
                .datasourceComponent("AutoForm")
                .generateCRUDPageComponent("S3")
                .defaultInstall(true)
                .isRemotePlugin(false)
                .isSupportedForAirGap(true)
                .build();
        insertPlugin(plugin);
    }

    private void addGoogleSheetsPlugin() {
        Plugin plugin = Plugin.builder()
                .name("Google Sheets")
                .type(PluginType.SAAS)
                .packageName("google-sheets-plugin")
                .iconLocation("https://assets.appsmith.com/GoogleSheets.svg")
                .documentationLink(
                        "https://docs.appsmith.com/reference/datasources/querying-google-sheets#create-queries")
                .responseType(Plugin.ResponseType.JSON)
                .uiComponent("UQIDbEditorForm")
                .datasourceComponent("OAuth2DatasourceForm")
                .generateCRUDPageComponent("Google Sheets")
                .defaultInstall(true)
                .isRemotePlugin(false)
                .isSupportedForAirGap(false)
                .isDependentOnCS(true)
                .build();
        insertPlugin(plugin);
    }

    private void addSnowflakePlugin() {
        Plugin plugin = Plugin.builder()
                .name("Snowflake")
                .type(PluginType.DB)
                .packageName("snowflake-plugin")
                .iconLocation("https://assets.appsmith.com/logo/snowflake.svg")
                .documentationLink(
                        "https://docs.appsmith.com/reference/datasources/querying-snowflake-db#querying-snowflake")
                .responseType(Plugin.ResponseType.TABLE)
                .uiComponent("DbEditorForm")
                .datasourceComponent("AutoForm")
                .generateCRUDPageComponent("SQL")
                .defaultInstall(true)
                .isRemotePlugin(false)
                .isSupportedForAirGap(true)
                .build();
        insertPlugin(plugin);
    }

    private void addArangoDBPlugin() {
        Plugin plugin = Plugin.builder()
                .name("ArangoDB")
                .type(PluginType.DB)
                .packageName("arangodb-plugin")
                .iconLocation("https://assets.appsmith.com/logo/arangodb.svg")
                .documentationLink(
                        "https://docs.appsmith.com/reference/datasources/querying-arango-db#using-queries-in-applications")
                .responseType(Plugin.ResponseType.TABLE)
                .uiComponent("DbEditorForm")
                .datasourceComponent("AutoForm")
                .defaultInstall(true)
                .isRemotePlugin(false)
                .isSupportedForAirGap(true)
                .build();
        insertPlugin(plugin);
    }

    private void addJSFunctionsPlugin() {
        Plugin plugin = Plugin.builder()
                .name("JS Functions")
                .type(PluginType.JS)
                .packageName("js-plugin")
                .iconLocation("https://assets.appsmith.com/js-yellow.svg")
                .documentationLink("https://docs.appsmith.com/v/v1.2.1/js-reference/using-js")
                .responseType(Plugin.ResponseType.JSON)
                .uiComponent("JsEditorForm")
                .defaultInstall(true)
                .isRemotePlugin(false)
                .isSupportedForAirGap(true)
                .build();
        insertPlugin(plugin);
    }

    private void addSMTPPlugin() {
        Plugin plugin = Plugin.builder()
                .name("SMTP")
                .type(PluginType.DB)
                .packageName("smtp-plugin")
                .iconLocation("https://assets.appsmith.com/smtp-icon.svg")
                .documentationLink("https://docs.appsmith.com/reference/datasources/using-smtp")
                .responseType(Plugin.ResponseType.JSON)
                .uiComponent("UQIDbEditorForm")
                .datasourceComponent("AutoForm")
                .defaultInstall(true)
                .isRemotePlugin(false)
                .isSupportedForAirGap(true)
                .build();
        insertPlugin(plugin);
    }

    private void addAuthenticatedGraphQLAPIPlugin() {
        Plugin plugin = Plugin.builder()
                .name("Authenticated GraphQL API")
                .type(PluginType.API)
                .packageName("graphql-plugin")
                .iconLocation("https://assets.appsmith.com/logo/graphql.svg")
                .documentationLink("https://docs.appsmith.com/reference/datasources/graphql#create-queries")
                .responseType(Plugin.ResponseType.JSON)
                .uiComponent("GraphQLEditorForm")
                .datasourceComponent("RestAPIDatasourceForm")
                .defaultInstall(true)
                .isRemotePlugin(false)
                .isSupportedForAirGap(true)
                .build();
        insertPlugin(plugin);
    }

    private void addOraclePlugin() {
        Plugin plugin = Plugin.builder()
                .name("Oracle")
                .type(PluginType.DB)
                .packageName("oracle-plugin")
                .iconLocation("https://s3.us-east-2.amazonaws.com/assets.appsmith.com/oracle.svg")
                .documentationLink("https://docs.appsmith.com/reference/datasources/querying-oracle#create-queries")
                .responseType(Plugin.ResponseType.TABLE)
                .uiComponent("DbEditorForm")
                .defaultInstall(true)
                .isRemotePlugin(false)
                .isSupportedForAirGap(true)
                .build();
        insertPlugin(plugin);
    }

    private void addOpenAIPlugin() {
        Plugin plugin = Plugin.builder()
                .name("Open AI")
                .type(PluginType.AI)
                .packageName("openai-plugin")
                .iconLocation("https://assets.appsmith.com/logo/open-ai.svg")
                .documentationLink("https://docs.appsmith.com/connect-data/reference/open-ai")
                .responseType(Plugin.ResponseType.JSON)
                .uiComponent("UQIDbEditorForm")
                .datasourceComponent("DbEditorForm")
                .defaultInstall(true)
                .isRemotePlugin(false)
                .isSupportedForAirGap(true)
                .build();
        insertPlugin(plugin);
    }

    private void addAnthropicPlugin() {
        Plugin plugin = Plugin.builder()
                .name("Anthropic")
                .type(PluginType.AI)
                .packageName("anthropic-plugin")
                .iconLocation("https://assets.appsmith.com/logo/anthropic.svg")
                .documentationLink("https://docs.appsmith.com/connect-data/reference/anthropic")
                .responseType(Plugin.ResponseType.JSON)
                .uiComponent("UQIDbEditorForm")
                .datasourceComponent("DbEditorForm")
                .defaultInstall(true)
                .isRemotePlugin(false)
                .isSupportedForAirGap(true)
                .build();
        insertPlugin(plugin);
    }

    private void addGoogleAIPlugin() {
        Plugin plugin = Plugin.builder()
                .name("Google AI")
                .type(PluginType.AI)
                .packageName("googleai-plugin")
                .iconLocation("https://assets.appsmith.com/google-ai.svg")
                .documentationLink("https://docs.appsmith.com/connect-data/reference/google-ai")
                .responseType(Plugin.ResponseType.JSON)
                .uiComponent("UQIDbEditorForm")
                .datasourceComponent("DbEditorForm")
                .defaultInstall(true)
                .isRemotePlugin(false)
                .isSupportedForAirGap(true)
                .build();
        insertPlugin(plugin);
    }

    private void addDatabricksPlugin() {
        Plugin plugin = Plugin.builder()
                .name("Databricks")
                .type(PluginType.DB)
                .packageName("databricks-plugin")
                .iconLocation("https://assets.appsmith.com/databricks-logo.svg")
                .documentationLink("https://docs.appsmith.com/connect-data/reference/databricks")
                .responseType(Plugin.ResponseType.JSON)
                .uiComponent("UQIDbEditorForm")
                .datasourceComponent("DbEditorForm")
                .defaultInstall(true)
                .isRemotePlugin(false)
                .isSupportedForAirGap(true)
                .build();
        insertPlugin(plugin);
    }

    private void addAppsmithAIPlugin() {
        Plugin plugin = Plugin.builder()
                .name("Appsmith AI")
                .type(PluginType.AI)
                .packageName("appsmithai-plugin")
                .iconLocation("https://assets.appsmith.com/logo/appsmith-ai.svg")
                .documentationLink("https://docs.appsmith.com/connect-data/reference/appsmith-ai")
                .responseType(Plugin.ResponseType.JSON)
                .uiComponent("UQIDbEditorForm")
                .datasourceComponent("DbEditorForm")
                .defaultInstall(true)
                .isRemotePlugin(false)
                .isSupportedForAirGap(true)
                .build();
        insertPlugin(plugin);
    }

    private void addAWSLambdaPlugin() {
        Plugin plugin = Plugin.builder()
                .name("AWS Lambda")
                .type(PluginType.REMOTE)
                .packageName("aws-lambda-plugin")
                .iconLocation("https://assets.appsmith.com/aws-lambda-logo.svg")
                .documentationLink("https://docs.appsmith.com/connect-data/reference/aws-lambda")
                .responseType(Plugin.ResponseType.JSON)
                .uiComponent("UQIDbEditorForm")
                .datasourceComponent("DbEditorForm")
                .defaultInstall(true)
                .isRemotePlugin(false)
                .isSupportedForAirGap(true)
                .build();
        insertPlugin(plugin);
    }
}
