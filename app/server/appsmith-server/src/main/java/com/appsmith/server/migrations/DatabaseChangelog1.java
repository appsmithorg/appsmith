package com.appsmith.server.migrations;

import com.appsmith.external.helpers.MustacheHelper;
import com.appsmith.external.models.ActionDTO;
import com.appsmith.external.models.Datasource;
import com.appsmith.external.models.PluginType;
import com.appsmith.external.models.Property;
import com.appsmith.server.constants.Appsmith;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.domains.Action;
import com.appsmith.server.domains.ActionCollection;
import com.appsmith.server.domains.Application;
import com.appsmith.server.domains.Collection;
import com.appsmith.server.domains.Config;
import com.appsmith.server.domains.NewAction;
import com.appsmith.server.domains.NewPage;
import com.appsmith.server.domains.Page;
import com.appsmith.server.domains.PasswordResetToken;
import com.appsmith.server.domains.Plugin;
import com.appsmith.server.domains.QActionCollection;
import com.appsmith.server.domains.QNewAction;
import com.appsmith.server.domains.QPlugin;
import com.appsmith.server.domains.QUserData;
import com.appsmith.server.domains.Role;
import com.appsmith.server.domains.Sequence;
import com.appsmith.server.domains.User;
import com.appsmith.server.domains.UserData;
import com.appsmith.server.domains.Workspace;
import com.appsmith.server.domains.WorkspacePlugin;
import com.appsmith.server.dtos.WorkspacePluginStatus;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.github.cloudyrock.mongock.ChangeLog;
import com.github.cloudyrock.mongock.ChangeSet;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.extern.slf4j.Slf4j;
import net.minidev.json.JSONObject;
import org.bson.Document;
import org.bson.types.ObjectId;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.data.domain.Sort;
import org.springframework.data.mongodb.UncategorizedMongoDbException;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.index.CompoundIndexDefinition;
import org.springframework.data.mongodb.core.index.Index;
import org.springframework.data.mongodb.core.index.IndexOperations;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Update;
import org.springframework.data.redis.core.ReactiveRedisOperations;
import org.springframework.data.redis.core.script.RedisScript;
import org.springframework.util.CollectionUtils;
import reactor.core.publisher.Flux;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashMap;
import java.util.HashSet;
import java.util.Iterator;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.TimeUnit;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

import static com.appsmith.external.helpers.PluginUtils.setValueSafelyInFormData;
import static com.appsmith.server.constants.FieldName.DYNAMIC_TRIGGER_PATH_LIST;
import static com.appsmith.server.repositories.BaseAppsmithRepositoryImpl.fieldName;
import static org.springframework.data.mongodb.core.query.Criteria.where;
import static org.springframework.data.mongodb.core.query.Query.query;
import static org.springframework.data.mongodb.core.query.Update.update;

@Slf4j
@ChangeLog(order = "001")
public class DatabaseChangelog1 {

    public static ObjectMapper objectMapper = new ObjectMapper();
    private static final String AGGREGATE_LIMIT = "aggregate.limit";
    private static final Object DEFAULT_BATCH_SIZE = "101";
    public static final String FIRESTORE_PLUGIN_NAME = "firestore-plugin";
    public static final String CONDITION_KEY = "condition";
    public static final String CHILDREN_KEY = "children";
    public static final String OPERATOR_KEY = "operator";
    public static final String VALUE_KEY = "value";
    public static final String PATH_KEY = "path";
    public static final String AND = "AND";
    public static final String KEY = "key";
    public static final String START_AFTER = "startAfter";
    public static final String END_BEFORE = "endBefore";
    public static final String SMART_SUBSTITUTION = "smartSubstitution";

    @AllArgsConstructor
    @NoArgsConstructor
    @Setter
    @Getter
    class DslUpdateDto {
        private JSONObject dsl;
        private Boolean updated;
    }

    /**
     * A public, pure utility function to create instances of Index objects to pass to `IndexOps.ensureIndex` method.
     * Note: The order of the fields here is important. An index with the fields `"name", "organizationId"` is different
     * from an index with the fields `"organizationId", "name"`. If an index exists with the first ordering, and we try
     * to **ensure** an index with the same name but the second ordering of fields, errors will show up and bad things
     * WILL happen.
     * <p>
     * Also, please check out the following blog on how to best create indexes :
     * https://emptysqua.re/blog/optimizing-mongodb-compound-indexes/
     */
    public static Index makeIndex(String... fields) {
        if (fields.length == 1) {
            return new Index(fields[0], Sort.Direction.ASC).named(fields[0]);
        } else {
            org.bson.Document doc = new org.bson.Document();
            for (String field : fields) {
                doc.put(field, 1);
            }
            return new CompoundIndexDefinition(doc);
        }
    }

    /**
     * Given a mongoTemplate, a domain class and a bunch of Index definitions, this pure utility function will ensure
     * those indexes on the database behind the mongoTemplate instance.
     */
    public static void ensureIndexes(MongoTemplate mongoTemplate, Class<?> entityClass, Index... indexes) {
        final int dbNameLength = mongoTemplate
                .getMongoDatabaseFactory()
                .getMongoDatabase()
                .getName()
                .length();
        for (Index index : indexes) {
            final String indexName = (String) index.getIndexOptions().get("name");
            if (indexName == null) {
                throw new RuntimeException("Index name cannot be null");
            }
            // Index name length limitations on DocumentDB, at
            // https://docs.aws.amazon.com/documentdb/latest/developerguide/limits.html.
            final int indexNameLength = indexName.length();
            final int collectionNameLength = entityClass.getSimpleName().length();
            if (dbNameLength + indexNameLength + collectionNameLength + 3 > 127
                    || indexNameLength + collectionNameLength + 1 > 63) {
                throw new RuntimeException("Index name is too long. Please give a shorter name.");
            }
        }

        IndexOperations indexOps = mongoTemplate.indexOps(entityClass);
        for (Index index : indexes) {
            indexOps.ensureIndex(index);
        }
    }

    public static boolean dropIndexIfExists(MongoTemplate mongoTemplate, Class<?> entityClass, String name) {
        try {
            mongoTemplate.indexOps(entityClass).dropIndex(name);
        } catch (UncategorizedMongoDbException ignored) {
            // The index probably doesn't exist. This happens if the database is created after the @Indexed annotation
            // has been removed.
            return false;
        }
        return true;
    }

    private ActionDTO copyActionToDTO(Action action) {
        ActionDTO actionDTO = new ActionDTO();
        actionDTO.setName(action.getName());
        actionDTO.setDatasource(action.getDatasource());
        actionDTO.setPageId(action.getPageId());
        actionDTO.setActionConfiguration(action.getActionConfiguration());
        actionDTO.setExecuteOnLoad(action.getExecuteOnLoad());
        actionDTO.setDynamicBindingPathList(action.getDynamicBindingPathList());
        actionDTO.setIsValid(action.getIsValid());
        actionDTO.setInvalids(action.getInvalids());
        actionDTO.setJsonPathKeys(action.getJsonPathKeys());
        actionDTO.setCacheResponse(action.getCacheResponse());
        actionDTO.setUserSetOnLoad(action.getUserSetOnLoad());
        actionDTO.setConfirmBeforeExecute(action.getConfirmBeforeExecute());

        return actionDTO;
    }

    public static void installPluginToAllWorkspaces(MongoTemplate mongoTemplate, String pluginId) {

        Query queryToFetchWorkspacesWOPlugin = new Query();
        /* Filter in only those workspaces that don't have the plugin installed */
        queryToFetchWorkspacesWOPlugin.addCriteria(
                Criteria.where("plugins.pluginId").ne(pluginId));

        /* Add plugin to the workspace */
        Update update = new Update();
        update.addToSet("plugins", new WorkspacePlugin(pluginId, WorkspacePluginStatus.FREE));

        mongoTemplate.updateMulti(queryToFetchWorkspacesWOPlugin, update, Workspace.class);
    }

    @ChangeSet(order = "001", id = "initial-plugins", author = "")
    public void initialPlugins(MongoTemplate mongoTemplate) {
        Plugin plugin1 = new Plugin();
        plugin1.setName("PostgreSQL");
        plugin1.setType(PluginType.DB);
        plugin1.setPackageName("postgres-plugin");
        plugin1.setUiComponent("DbEditorForm");
        plugin1.setDefaultInstall(true);
        try {
            mongoTemplate.insert(plugin1);
        } catch (DuplicateKeyException e) {
            log.warn("postgres-plugin already present in database.");
        }

        Plugin plugin2 = new Plugin();
        plugin2.setName("REST API");
        plugin2.setType(PluginType.API);
        plugin2.setPackageName("restapi-plugin");
        plugin2.setUiComponent("ApiEditorForm");
        plugin2.setDefaultInstall(true);
        try {
            mongoTemplate.insert(plugin2);
        } catch (DuplicateKeyException e) {
            log.warn("restapi-plugin already present in database.");
        }

        Plugin plugin3 = new Plugin();
        plugin3.setName("MongoDB");
        plugin3.setType(PluginType.DB);
        plugin3.setPackageName("mongo-plugin");
        plugin3.setUiComponent("DbEditorForm");
        plugin3.setDefaultInstall(true);
        try {
            mongoTemplate.insert(plugin3);
        } catch (DuplicateKeyException e) {
            log.warn("mongo-plugin already present in database.");
        }
    }

    /**
     * We are creating indexes manually because Spring's index resolver creates indexes on fields as well.
     * See https://stackoverflow.com/questions/60867491/ for an explanation of the problem. We have that problem with
     * the `Action.datasource` field.
     */
    @ChangeSet(order = "004", id = "initial-indexes", author = "")
    public void addInitialIndexes(MongoTemplate mongoTemplate) {
        Index createdAtIndex = makeIndex("createdAt");

        ensureIndexes(
                mongoTemplate,
                Action.class,
                createdAtIndex,
                makeIndex("pageId", "name").unique().named("action_page_compound_index"));

        ensureIndexes(mongoTemplate, Collection.class, createdAtIndex);

        ensureIndexes(
                mongoTemplate, Config.class, createdAtIndex, makeIndex("name").unique());

        ensureIndexes(
                mongoTemplate,
                Datasource.class,
                createdAtIndex,
                makeIndex("organizationId", "name").unique().named("organization_datasource_compound_index"));

        ensureIndexes(
                mongoTemplate,
                Page.class,
                createdAtIndex,
                makeIndex("applicationId", "name").unique().named("application_page_compound_index"));

        ensureIndexes(
                mongoTemplate,
                PasswordResetToken.class,
                createdAtIndex,
                makeIndex("email").unique().expire(3600, TimeUnit.SECONDS));

        ensureIndexes(
                mongoTemplate,
                Plugin.class,
                createdAtIndex,
                makeIndex("type"),
                makeIndex("packageName").unique());

        ensureIndexes(mongoTemplate, Role.class, createdAtIndex);

        ensureIndexes(
                mongoTemplate, User.class, createdAtIndex, makeIndex("email").unique());

        ensureIndexes(
                mongoTemplate,
                Page.class,
                makeIndex(FieldName.APPLICATION_ID, FieldName.NAME, FieldName.DELETED_AT)
                        .unique()
                        .named("application_page_deleted_compound_index"));

        ensureIndexes(mongoTemplate, Sequence.class, makeIndex(FieldName.NAME).unique());
    }

    @ChangeSet(order = "014", id = "set-initial-sequence-for-datasource", author = "") // preserve
    public void setInitialSequenceForDatasource(MongoTemplate mongoTemplate) {
        final Long maxUntitledDatasourceNumber = mongoTemplate
                .find(
                        query(where(FieldName.NAME).regex("^" + Datasource.DEFAULT_NAME_PREFIX + " \\d+$")),
                        Datasource.class)
                .stream()
                .map(datasource -> Long.parseLong(datasource.getName().split(" ")[2]))
                .max(Long::compareTo)
                .orElse(0L);

        mongoTemplate.upsert(
                query(where(FieldName.NAME).is(mongoTemplate.getCollectionName(Datasource.class))),
                update("nextNumber", maxUntitledDatasourceNumber + 1),
                Sequence.class);
    }

    @ChangeSet(order = "015", id = "set-plugin-image-and-docs-link", author = "") // preserve
    public void setPluginImageAndDocsLink(MongoTemplate mongoTemplate) {
        for (Plugin plugin : mongoTemplate.findAll(Plugin.class)) {
            if ("postgres-plugin".equals(plugin.getPackageName())) {
                plugin.setIconLocation("https://s3.us-east-2.amazonaws.com/assets.appsmith.com/Postgress.png");
                plugin.setDocumentationLink("https://www.postgresql.org/docs/12/index.html");
                plugin.setResponseType(Plugin.ResponseType.TABLE);

            } else if ("restapi-plugin".equals(plugin.getPackageName())) {
                plugin.setIconLocation("https://s3.us-east-2.amazonaws.com/assets.appsmith.com/RestAPI.png");

            } else if ("mongo-plugin".equals(plugin.getPackageName())) {
                plugin.setIconLocation("https://s3.us-east-2.amazonaws.com/assets.appsmith.com/MongoDB.png");
                plugin.setDocumentationLink("https://docs.mongodb.com/manual/reference/command/nav-crud/");
                plugin.setResponseType(Plugin.ResponseType.JSON);

            } else {
                continue;
            }

            mongoTemplate.save(plugin);
        }
    }

    @ChangeSet(order = "018", id = "install-mysql-plugins", author = "") // preserve
    public void mysqlPlugin(MongoTemplate mongoTemplate) {
        Plugin plugin1 = new Plugin();
        plugin1.setName("Mysql");
        plugin1.setType(PluginType.DB);
        plugin1.setPackageName("mysql-plugin");
        plugin1.setUiComponent("DbEditorForm");
        plugin1.setResponseType(Plugin.ResponseType.TABLE);
        plugin1.setIconLocation("https://s3.us-east-2.amazonaws.com/assets.appsmith.com/Mysql.jpg");
        plugin1.setDefaultInstall(true);
        try {
            mongoTemplate.insert(plugin1);
        } catch (DuplicateKeyException e) {
            log.warn("mysql-plugin already present in database.");
        }

        installPluginToAllWorkspaces(mongoTemplate, plugin1.getId());
    }

    @ChangeSet(order = "019", id = "update-database-documentation-links", author = "") // preserve
    public void updateDatabaseDocumentationLinks(MongoTemplate mongoTemplate) {
        for (Plugin plugin : mongoTemplate.findAll(Plugin.class)) {
            if ("postgres-plugin".equals(plugin.getPackageName())) {
                plugin.setDocumentationLink("");

            } else if ("mongo-plugin".equals(plugin.getPackageName())) {
                plugin.setDocumentationLink("https://docs.appsmith.com/reference/datasources/querying-mongodb/");

            } else {
                continue;
            }

            mongoTemplate.save(plugin);
        }
    }

    @ChangeSet(order = "025", id = "generate-unique-id-for-instance", author = "") // preserve
    public void generateUniqueIdForInstance(MongoTemplate mongoTemplate) {
        mongoTemplate.insert(new Config(new JSONObject(Map.of("value", new ObjectId().toHexString())), "instance-id"));
    }

    @ChangeSet(order = "026", id = "fix-password-reset-token-expiration", author = "") // preserve
    public void fixTokenExpiration(MongoTemplate mongoTemplate) {
        dropIndexIfExists(mongoTemplate, PasswordResetToken.class, FieldName.CREATED_AT);
        dropIndexIfExists(mongoTemplate, PasswordResetToken.class, FieldName.EMAIL);

        ensureIndexes(
                mongoTemplate,
                PasswordResetToken.class,
                makeIndex(FieldName.CREATED_AT).expire(2, TimeUnit.DAYS),
                makeIndex(FieldName.EMAIL).unique());
    }

    @ChangeSet(order = "027", id = "add-elastic-search-plugin", author = "") // preserve
    public void addElasticSearchPlugin(MongoTemplate mongoTemplate) {
        Plugin plugin1 = new Plugin();
        plugin1.setName("ElasticSearch");
        plugin1.setType(PluginType.DB);
        plugin1.setPackageName("elasticsearch-plugin");
        plugin1.setUiComponent("DbEditorForm");
        plugin1.setResponseType(Plugin.ResponseType.JSON);
        plugin1.setIconLocation("https://s3.us-east-2.amazonaws.com/assets.appsmith.com/ElasticSearch.jpg");
        plugin1.setDocumentationLink("https://docs.appsmith.com/reference/datasources/querying-elasticsearch");
        plugin1.setDefaultInstall(true);
        try {
            mongoTemplate.insert(plugin1);
        } catch (DuplicateKeyException e) {
            log.warn(plugin1.getPackageName() + " already present in database.");
        }

        installPluginToAllWorkspaces(mongoTemplate, plugin1.getId());
    }

    @ChangeSet(order = "028", id = "add-dynamo-plugin", author = "") // preserve
    public void addDynamoPlugin(MongoTemplate mongoTemplate) {
        Plugin plugin1 = new Plugin();
        plugin1.setName("DynamoDB");
        plugin1.setType(PluginType.DB);
        plugin1.setPackageName("dynamo-plugin");
        plugin1.setUiComponent("DbEditorForm");
        plugin1.setResponseType(Plugin.ResponseType.JSON);
        plugin1.setIconLocation("https://s3.us-east-2.amazonaws.com/assets.appsmith.com/DynamoDB.png");
        plugin1.setDocumentationLink("https://docs.appsmith.com/reference/datasources/querying-dynamodb");
        plugin1.setDefaultInstall(true);
        try {
            mongoTemplate.insert(plugin1);
        } catch (DuplicateKeyException e) {
            log.warn(plugin1.getPackageName() + " already present in database.");
        }

        installPluginToAllWorkspaces(mongoTemplate, plugin1.getId());
    }

    @ChangeSet(order = "029", id = "use-png-logos", author = "") // preserve
    public void usePngLogos(MongoTemplate mongoTemplate) {
        mongoTemplate.updateFirst(
                query(where(fieldName(QPlugin.plugin.packageName)).is("elasticsearch-plugin")),
                update(
                        fieldName(QPlugin.plugin.iconLocation),
                        "https://s3.us-east-2.amazonaws.com/assets.appsmith.com/ElasticSearch.png"),
                Plugin.class);
    }

    @ChangeSet(order = "030", id = "add-redis-plugin", author = "") // preserve
    public void addRedisPlugin(MongoTemplate mongoTemplate) {
        Plugin plugin1 = new Plugin();
        plugin1.setName("Redis");
        plugin1.setType(PluginType.DB);
        plugin1.setPackageName("redis-plugin");
        plugin1.setUiComponent("DbEditorForm");
        plugin1.setResponseType(Plugin.ResponseType.TABLE);
        plugin1.setIconLocation("https://s3.us-east-2.amazonaws.com/assets.appsmith.com/redis.jpg");
        plugin1.setDocumentationLink("https://docs.appsmith.com/reference/datasources/querying-redis");
        plugin1.setDefaultInstall(true);
        try {
            mongoTemplate.insert(plugin1);
        } catch (DuplicateKeyException e) {
            log.warn(plugin1.getPackageName() + " already present in database.");
        }

        installPluginToAllWorkspaces(mongoTemplate, plugin1.getId());
    }

    @ChangeSet(order = "031", id = "add-msSql-plugin", author = "") // preserve
    public void addMsSqlPlugin(MongoTemplate mongoTemplate) {
        Plugin plugin1 = new Plugin();
        plugin1.setName("MsSQL");
        plugin1.setType(PluginType.DB);
        plugin1.setPackageName("mssql-plugin");
        plugin1.setUiComponent("DbEditorForm");
        plugin1.setResponseType(Plugin.ResponseType.TABLE);
        plugin1.setIconLocation("https://s3.us-east-2.amazonaws.com/assets.appsmith.com/MsSQL.jpg");
        plugin1.setDocumentationLink("https://docs.appsmith.com/reference/datasources/querying-mssql");
        plugin1.setDefaultInstall(true);
        try {
            mongoTemplate.insert(plugin1);
        } catch (DuplicateKeyException e) {
            log.warn(plugin1.getPackageName() + " already present in database.");
        }

        installPluginToAllWorkspaces(mongoTemplate, plugin1.getId());
    }

    @ChangeSet(order = "037", id = "createNewPageIndexAfterDroppingNewPage", author = "") // preserve
    public void addNewPageIndexAfterDroppingNewPage(MongoTemplate mongoTemplate) {
        Index createdAtIndex = makeIndex("createdAt");

        // Drop existing NewPage class
        mongoTemplate.dropCollection(NewPage.class);

        // Now add an index
        ensureIndexes(mongoTemplate, NewPage.class, createdAtIndex);
    }

    @ChangeSet(order = "038", id = "createNewActionIndexAfterDroppingNewAction", author = "") // preserve
    public void addNewActionIndexAfterDroppingNewAction(MongoTemplate mongoTemplate) {
        Index createdAtIndex = makeIndex("createdAt");

        // Drop existing NewAction class
        mongoTemplate.dropCollection(NewAction.class);

        // Now add an index
        ensureIndexes(mongoTemplate, NewAction.class, createdAtIndex);
    }

    @ChangeSet(order = "040", id = "new-page-new-action-add-indexes", author = "")
    public void addNewPageAndNewActionNewIndexes(MongoTemplate mongoTemplate) {

        dropIndexIfExists(mongoTemplate, NewAction.class, "createdAt");

        dropIndexIfExists(mongoTemplate, NewPage.class, "createdAt");

        ensureIndexes(
                mongoTemplate,
                NewPage.class,
                makeIndex("applicationId", "deleted").named("applicationId_deleted_compound_index"));
    }

    @ChangeSet(order = "042", id = "update-action-index-to-single-multiple-indices", author = "") // preserve
    public void updateActionIndexToSingleMultipleIndices(MongoTemplate mongoTemplate) {

        ensureIndexes(mongoTemplate, NewAction.class, makeIndex("applicationId").named("applicationId"));

        ensureIndexes(mongoTemplate, NewAction.class, makeIndex("deleted").named("deleted"));
    }

    @ChangeSet(order = "043", id = "add-firestore-plugin", author = "") // preserve
    public void addFirestorePlugin(MongoTemplate mongoTemplate) {
        Plugin plugin = new Plugin();
        plugin.setName("Firestore");
        plugin.setType(PluginType.DB);
        plugin.setPackageName("firestore-plugin");
        plugin.setUiComponent("DbEditorForm");
        plugin.setResponseType(Plugin.ResponseType.JSON);
        plugin.setIconLocation("https://s3.us-east-2.amazonaws.com/assets.appsmith.com/Firestore.png");
        plugin.setDocumentationLink("https://docs.appsmith.com/reference/datasources/querying-firestore");
        plugin.setDefaultInstall(true);
        try {
            mongoTemplate.insert(plugin);
        } catch (DuplicateKeyException e) {
            log.warn(plugin.getPackageName() + " already present in database.");
        }

        installPluginToAllWorkspaces(mongoTemplate, plugin.getId());
    }

    @ChangeSet(order = "048", id = "add-redshift-plugin", author = "") // preserve
    public void addRedshiftPlugin(MongoTemplate mongoTemplate) {
        Plugin plugin = new Plugin();
        plugin.setName("Redshift");
        plugin.setType(PluginType.DB);
        plugin.setPackageName("redshift-plugin");
        plugin.setUiComponent("DbEditorForm");
        plugin.setResponseType(Plugin.ResponseType.TABLE);
        plugin.setIconLocation("https://s3.us-east-2.amazonaws.com/assets.appsmith.com/Redshift.png");
        plugin.setDocumentationLink("https://docs.appsmith.com/reference/datasources/querying-redshift");
        plugin.setDefaultInstall(true);
        try {
            mongoTemplate.insert(plugin);
        } catch (DuplicateKeyException e) {
            log.warn(plugin.getPackageName() + " already present in database.");
        }

        installPluginToAllWorkspaces(mongoTemplate, plugin.getId());
    }

    @ChangeSet(order = "049", id = "clear-userdata-collection", author = "") // preserve?
    public void clearUserDataCollection(MongoTemplate mongoTemplate) {
        mongoTemplate.dropCollection(UserData.class);
    }

    @ChangeSet(order = "050", id = "update-database-documentation-links-v1-2-1", author = "") // preserve
    public void updateDatabaseDocumentationLinks_v1_2_1(MongoTemplate mongoTemplate) {
        for (Plugin plugin : mongoTemplate.findAll(Plugin.class)) {
            switch (plugin.getPackageName()) {
                case "postgres-plugin":
                    plugin.setDocumentationLink("https://docs.appsmith.com/reference/datasources/querying-postgres");
                    break;
                case "mongo-plugin":
                    plugin.setDocumentationLink("https://docs.appsmith.com/reference/datasources/querying-mongodb/");
                    break;
                case "elasticsearch-plugin":
                    plugin.setDocumentationLink(
                            "https://docs.appsmith.com/reference/datasources/querying-elasticsearch");
                    break;
                case "dynamo-plugin":
                    plugin.setDocumentationLink("https://docs.appsmith.com/reference/datasources/querying-dynamodb");
                    break;
                case "redis-plugin":
                    plugin.setDocumentationLink("https://docs.appsmith.com/reference/datasources/querying-redis");
                    break;
                case "mssql-plugin":
                    plugin.setDocumentationLink("https://docs.appsmith.com/reference/datasources/querying-mssql");
                    break;
                case "firestore-plugin":
                    plugin.setDocumentationLink("https://docs.appsmith.com/reference/datasources/querying-firestore");
                    break;
                case "redshift-plugin":
                    plugin.setDocumentationLink("https://docs.appsmith.com/reference/datasources/querying-redshift");
                    break;
                case "mysql-plugin":
                    plugin.setDocumentationLink("https://docs.appsmith.com/reference/datasources/querying-mysql");
                    break;
                default:
                    continue;
            }

            mongoTemplate.save(plugin);
        }
    }

    @ChangeSet(order = "051", id = "add-amazons3-plugin", author = "") // preserve
    public void addAmazonS3Plugin(MongoTemplate mongoTemplate) {
        Plugin plugin = new Plugin();
        plugin.setName("Amazon S3");
        plugin.setType(PluginType.DB);
        plugin.setPackageName("amazons3-plugin");
        plugin.setUiComponent("DbEditorForm");
        plugin.setResponseType(Plugin.ResponseType.JSON);
        plugin.setIconLocation("https://s3.us-east-2.amazonaws.com/assets.appsmith.com/AmazonS3.jpeg");
        plugin.setDocumentationLink("https://docs.appsmith.com/datasource-reference/querying-amazon-s3");
        plugin.setDefaultInstall(true);
        try {
            mongoTemplate.insert(plugin);
        } catch (DuplicateKeyException e) {
            log.warn(plugin.getPackageName() + " already present in database.");
        }

        installPluginToAllWorkspaces(mongoTemplate, plugin.getId());
    }

    @ChangeSet(order = "053", id = "update-plugin-datasource-form-components", author = "") // preserve
    public void updatePluginDatasourceFormComponents(MongoTemplate mongoTemplate) {
        for (Plugin plugin : mongoTemplate.findAll(Plugin.class)) {
            switch (plugin.getPackageName()) {
                case "postgres-plugin":
                case "mongo-plugin":
                case "elasticsearch-plugin":
                case "dynamo-plugin":
                case "redis-plugin":
                case "mssql-plugin":
                case "firestore-plugin":
                case "redshift-plugin":
                case "mysql-plugin":
                case "amazons3-plugin":
                    plugin.setDatasourceComponent("AutoForm");
                    break;
                case "restapi-plugin":
                    plugin.setDatasourceComponent("RestAPIDatasourceForm");
                    break;
                default:
                    continue;
            }

            mongoTemplate.save(plugin);
        }
    }

    private static Set<String> getInvalidDynamicBindingPathsInAction(
            ObjectMapper mapper, NewAction action, List<String> dynamicBindingPathNames) {
        Set<String> pathsToRemove = new HashSet<>();
        for (String path : dynamicBindingPathNames) {

            if (path != null) {

                String[] fields = path.split("[].\\[]");

                // Convert actionConfiguration into JSON Object and then walk till we reach the path specified.
                Map<String, Object> actionConfigurationMap =
                        mapper.convertValue(action.getUnpublishedAction().getActionConfiguration(), Map.class);
                Object parent = new JSONObject(actionConfigurationMap);
                Iterator<String> fieldsIterator = Arrays.stream(fields)
                        .filter(fieldToken -> !fieldToken.isBlank())
                        .iterator();
                Boolean isLeafNode = false;

                while (fieldsIterator.hasNext()) {
                    String nextKey = fieldsIterator.next();
                    if (parent instanceof JSONObject) {
                        parent = ((JSONObject) parent).get(nextKey);
                    } else if (parent instanceof Map) {
                        parent = ((Map<String, ?>) parent).get(nextKey);
                    } else if (parent instanceof List) {
                        if (Pattern.matches(Pattern.compile("[0-9]+").toString(), nextKey)) {
                            try {
                                parent = ((List) parent).get(Integer.parseInt(nextKey));
                            } catch (IndexOutOfBoundsException e) {
                                // The index being referred does not exist. Hence the path would not exist.
                                pathsToRemove.add(path);
                            }
                        } else {
                            // Parent is a list but does not match the pattern. Hence the path would not exist.
                            pathsToRemove.add(path);
                            break;
                        }
                    }

                    // After updating the parent, check for the types
                    if (parent == null) {
                        pathsToRemove.add(path);
                        break;
                    } else if (parent instanceof String) {
                        // If we get String value, then this is a leaf node
                        isLeafNode = true;
                    }
                }
                // Only extract mustache keys from leaf nodes
                if (parent != null && isLeafNode) {
                    Set<String> mustacheKeysFromFields = MustacheHelper.extractMustacheKeysFromFields(parent).stream()
                            .map(token -> token.getValue())
                            .collect(Collectors.toSet());

                    // We found the path. But if the path does not have any mustache bindings, remove it from the path
                    // list
                    if (mustacheKeysFromFields.isEmpty()) {
                        pathsToRemove.add(path);
                    }
                }
            }
        }
        return pathsToRemove;
    }

    @ChangeSet(order = "058", id = "update-s3-datasource-configuration-and-label", author = "") // preserve
    public void updateS3DatasourceConfigurationAndLabel(MongoTemplate mongoTemplate) {
        Plugin s3Plugin = mongoTemplate
                .find(query(where("name").is("Amazon S3")), Plugin.class)
                .get(0);
        s3Plugin.setName("S3");
        mongoTemplate.save(s3Plugin);
    }

    @ChangeSet(order = "062", id = "add-google-sheets-plugin", author = "") // preserve
    public void addGoogleSheetsPlugin(MongoTemplate mongoTemplate) {
        Plugin plugin = new Plugin();
        plugin.setName("Google Sheets");
        plugin.setType(PluginType.SAAS);
        plugin.setPackageName("google-sheets-plugin");
        plugin.setUiComponent("SaaSEditorForm");
        plugin.setDatasourceComponent("OAuth2DatasourceForm");
        plugin.setResponseType(Plugin.ResponseType.JSON);
        plugin.setIconLocation("https://s3.us-east-2.amazonaws.com/assets.appsmith.com/GoogleSheets.svg");
        plugin.setDocumentationLink("https://docs.appsmith.com/datasource-reference/querying-google-sheets");
        plugin.setDefaultInstall(true);
        try {
            mongoTemplate.insert(plugin);
        } catch (DuplicateKeyException e) {
            log.warn(plugin.getPackageName() + " already present in database.");
        }

        installPluginToAllWorkspaces(mongoTemplate, plugin.getId());
    }

    @ChangeSet(order = "063", id = "mark-instance-unregistered", author = "") // preserve
    public void markInstanceAsUnregistered(MongoTemplate mongoTemplate) {
        mongoTemplate.insert(new Config(new JSONObject(Map.of("value", false)), Appsmith.APPSMITH_REGISTERED));
    }

    private List<Property> generateMongoFormConfigTemplates(Map<Integer, Object> configuration) {
        List<Property> templates = new ArrayList<>();
        for (int i = 0; i < 22; i++) {
            Property template = new Property();
            if (configuration.containsKey(i)) {
                template.setValue(configuration.get(i));
            }
            templates.add(template);
        }
        return templates;
    }

    @ChangeSet(order = "072", id = "add-snowflake-plugin", author = "") // preserve
    public void addSnowflakePlugin(MongoTemplate mongoTemplate) {
        Plugin plugin = new Plugin();
        plugin.setName("Snowflake");
        plugin.setType(PluginType.DB);
        plugin.setPackageName("snowflake-plugin");
        plugin.setUiComponent("DbEditorForm");
        plugin.setDatasourceComponent("AutoForm");
        plugin.setResponseType(Plugin.ResponseType.TABLE);
        plugin.setIconLocation("https://s3.us-east-2.amazonaws.com/assets.appsmith.com/Snowflake.png");
        plugin.setDocumentationLink("https://docs.appsmith.com/datasource-reference/querying-snowflake-db");

        plugin.setDefaultInstall(true);
        try {
            mongoTemplate.insert(plugin);
        } catch (DuplicateKeyException e) {
            log.warn(plugin.getPackageName() + " already present in database.");
        }

        installPluginToAllWorkspaces(mongoTemplate, plugin.getId());
    }

    @ChangeSet(order = "077", id = "add-arangodb-plugin", author = "") // preserve
    public void addArangoDBPlugin(MongoTemplate mongoTemplate) {
        Plugin plugin = new Plugin();
        plugin.setName("ArangoDB");
        plugin.setType(PluginType.DB);
        plugin.setPackageName("arangodb-plugin");
        plugin.setUiComponent("DbEditorForm");
        plugin.setDatasourceComponent("AutoForm");
        plugin.setResponseType(Plugin.ResponseType.TABLE);
        plugin.setIconLocation("https://s3.us-east-2.amazonaws.com/assets.appsmith.com/ArangoDB.png");
        plugin.setDocumentationLink("https://docs.appsmith.com/datasource-reference/querying-arango-db");
        plugin.setDefaultInstall(true);
        try {
            mongoTemplate.insert(plugin);
        } catch (DuplicateKeyException e) {
            log.warn(plugin.getPackageName() + " already present in database.");
        }

        installPluginToAllWorkspaces(mongoTemplate, plugin.getId());
    }

    @ChangeSet(order = "078", id = "set-svg-logo-to-plugins", author = "") // preserve
    public void setSvgLogoToPluginIcons(MongoTemplate mongoTemplate) {
        for (Plugin plugin : mongoTemplate.findAll(Plugin.class)) {
            if ("postgres-plugin".equals(plugin.getPackageName())) {
                plugin.setIconLocation("https://s3.us-east-2.amazonaws.com/assets.appsmith.com/logo/postgresql.svg");
            } else if ("dynamo-plugin".equals(plugin.getPackageName())) {
                plugin.setIconLocation("https://s3.us-east-2.amazonaws.com/assets.appsmith.com/logo/aws-dynamodb.svg");
            } else if ("firestore-plugin".equals(plugin.getPackageName())) {
                plugin.setIconLocation("https://s3.us-east-2.amazonaws.com/assets.appsmith.com/logo/firestore.svg");
            } else if ("redshift-plugin".equals(plugin.getPackageName())) {
                plugin.setIconLocation("https://s3.us-east-2.amazonaws.com/assets.appsmith.com/logo/aws-redshift.svg");
            } else if ("mongo-plugin".equals(plugin.getPackageName())) {
                plugin.setIconLocation("https://s3.us-east-2.amazonaws.com/assets.appsmith.com/logo/mongodb.svg");
            } else if ("redis-plugin".equals(plugin.getPackageName())) {
                plugin.setIconLocation("https://s3.us-east-2.amazonaws.com/assets.appsmith.com/logo/redis.svg");
            } else if ("amazons3-plugin".equals(plugin.getPackageName())) {
                plugin.setIconLocation("https://s3.us-east-2.amazonaws.com/assets.appsmith.com/logo/aws-s3.svg");
            } else if ("mssql-plugin".equals(plugin.getPackageName())) {
                plugin.setIconLocation("https://s3.us-east-2.amazonaws.com/assets.appsmith.com/logo/mssql.svg");
            } else if ("snowflake-plugin".equals(plugin.getPackageName())) {
                plugin.setIconLocation("https://s3.us-east-2.amazonaws.com/assets.appsmith.com/logo/snowflake.svg");
            } else if ("elasticsearch-plugin".equals(plugin.getPackageName())) {
                plugin.setIconLocation("https://s3.us-east-2.amazonaws.com/assets.appsmith.com/logo/elastic.svg");
            } else if ("mysql-plugin".equals(plugin.getPackageName())) {
                plugin.setIconLocation("https://s3.us-east-2.amazonaws.com/assets.appsmith.com/logo/mysql.svg");
            } else if ("arangodb-plugin".equals(plugin.getPackageName())) {
                plugin.setIconLocation("https://s3.us-east-2.amazonaws.com/assets.appsmith.com/logo/arangodb.svg");
            } else {
                continue;
            }

            mongoTemplate.save(plugin);
        }
    }

    @ChangeSet(order = "080", id = "create-plugin-reference-for-genarate-CRUD-page", author = "") // preserve
    public void createPluginReferenceForGenerateCRUDPage(MongoTemplate mongoTemplate) {

        final String templatePageNameForSQLDatasource = "SQL";
        final Set<String> sqlPackageNames =
                Set.of("mysql-plugin", "mssql-plugin", "redshift-plugin", "snowflake-plugin");
        Set<String> validPackageNames = new HashSet<>(sqlPackageNames);
        validPackageNames.add("mongo-plugin");
        validPackageNames.add("postgres-plugin");

        List<Plugin> plugins = mongoTemplate.findAll(Plugin.class);
        for (Plugin plugin : plugins) {
            if (validPackageNames.contains(plugin.getPackageName())) {
                if (sqlPackageNames.contains(plugin.getPackageName())) {
                    plugin.setGenerateCRUDPageComponent(templatePageNameForSQLDatasource);
                } else {
                    plugin.setGenerateCRUDPageComponent(plugin.getName());
                }
            }
            mongoTemplate.save(plugin);
        }
    }

    public static Document getDocumentFromPath(Document document, String path) {
        String[] pathKeys = path.split("\\.");
        Document documentPtr = document;

        /**
         * - Traverse document one key at a time.
         * - Forced to traverse document one key at a time for the lack of a better API that allows traversal for
         * chained keys or key list.
         */
        for (int i = 0; i < pathKeys.length; i++) {
            if (documentPtr.containsKey(pathKeys[i])) {
                try {
                    documentPtr = documentPtr.get(pathKeys[i], Document.class);
                } catch (ClassCastException e) {
                    log.debug("Failed to cast document for path: " + path);
                    e.printStackTrace();
                    return null;
                }
            } else {
                return null;
            }
        }

        return documentPtr;
    }

    @ChangeSet(order = "082", id = "create-plugin-reference-for-S3-GSheet-genarate-CRUD-page", author = "") // preserve
    public void createPluginReferenceForS3AndGSheetGenerateCRUDPage(MongoTemplate mongoTemplate) {

        Set<String> validPackageNames = Set.of("amazons3-plugin", "google-sheets-plugin");

        List<Plugin> plugins = mongoTemplate.findAll(Plugin.class);
        for (Plugin plugin : plugins) {
            if (validPackageNames.contains(plugin.getPackageName())) {
                plugin.setGenerateCRUDPageComponent(plugin.getName());
            }
            mongoTemplate.save(plugin);
        }
    }

    @ChangeSet(order = "084", id = "add-js-plugin", author = "") // preserve
    public void addJSPlugin(MongoTemplate mongoTemplate) {
        Plugin plugin = new Plugin();
        plugin.setName("JS Functions");
        plugin.setType(PluginType.JS);
        plugin.setPackageName("js-plugin");
        plugin.setUiComponent("JsEditorForm");
        plugin.setResponseType(Plugin.ResponseType.JSON);
        plugin.setIconLocation("https://s3.us-east-2.amazonaws.com/assets.appsmith.com/JSFile.svg");
        plugin.setDocumentationLink("https://docs.appsmith.com/v/v1.2.1/js-reference/using-js");
        plugin.setDefaultInstall(true);
        try {
            mongoTemplate.insert(plugin);
        } catch (DuplicateKeyException e) {
            log.warn(plugin.getPackageName() + " already present in database.");
        }

        installPluginToAllWorkspaces(mongoTemplate, plugin.getId());
    }

    private void updateFormData(int index, Object value, Map formData, Map<Integer, String> migrationMap) {
        if (migrationMap.containsKey(index)) {
            String path = migrationMap.get(index);
            setValueSafelyInFormData(formData, path, value);
        }
    }

    @ChangeSet(order = "089", id = "update-plugin-package-name-index", author = "") // preserve
    public void updatePluginPackageNameIndexToPluginNamePackageNameAndVersion(MongoTemplate mongoTemplate) {
        dropIndexIfExists(mongoTemplate, Plugin.class, "packageName");

        ensureIndexes(
                mongoTemplate,
                Plugin.class,
                makeIndex("pluginName", "packageName", "version")
                        .unique()
                        .named("plugin_name_package_name_version_index"));
    }

    public static final Map<Integer, List<String>> s3MigrationMap = Map.ofEntries(
            Map.entry(0, List.of("command")),
            Map.entry(1, List.of("bucket")),
            Map.entry(2, List.of("list.signedUrl")),
            Map.entry(3, List.of("list.expiry")),
            Map.entry(4, List.of("list.prefix")),
            Map.entry(5, List.of("read.usingBase64Encoding")),
            Map.entry(6, List.of("create.dataType", "read.dataType")),
            Map.entry(7, List.of("create.expiry", "read.expiry", "delete.expiry")),
            Map.entry(8, List.of("list.unSignedUrl")));

    /**
     * This class is meant to hold any method that is required to transform data before migrating the data to UQI
     * schema. Usage of a class makes the data transformation process modular e.g. someone could create
     * another class extending this class and override the `transformData` method.
     */
    public class UQIMigrationDataTransformer {

        /**
         * This method holds the steps to transform data before it is migrated to UQI schema.
         * Each transformation is uniquely identified by the combination of plugin name and the transformation name.
         *
         * @param pluginName         - name of the plugin for which the transformation is intended
         * @param transformationName - name of the transformation relative to the plugin
         * @param value              - value that needs to be transformed
         * @return - transformed value
         */
        public Object transformData(String pluginName, String transformationName, Object value) {

            if (value == null) {
                return value;
            }

            switch (pluginName) {
                    /* Data transformations for Firestore plugin are defined in this case. */
                case FIRESTORE_PLUGIN_NAME:
                    /**
                     * This case takes care of transforming Firestore's where clause data to UQI's where
                     * clause schema.
                     */
                    if ("where-clause-migration".equals(transformationName)) {
                        /* This map will hold the transformed data as per UQI's where clause schema */
                        HashMap<String, Object> uqiWhereMap = new HashMap<>();
                        uqiWhereMap.put(CONDITION_KEY, AND);
                        uqiWhereMap.put(CHILDREN_KEY, new ArrayList<>());

                        List<Map<String, Object>> oldListOfConditions;
                        try {
                            oldListOfConditions = (List<Map<String, Object>>) value;
                        } catch (ClassCastException e) {
                            log.debug("value: " + value);
                            oldListOfConditions = new ArrayList<>();
                        }

                        oldListOfConditions.stream().forEachOrdered(oldCondition -> {
                            /* Map old values to keys in the new UQI format. */
                            Map<String, Object> uqiCondition = new HashMap<>();
                            uqiCondition.put(CONDITION_KEY, oldCondition.get(OPERATOR_KEY));
                            uqiCondition.put(KEY, oldCondition.get(PATH_KEY));
                            uqiCondition.put(VALUE_KEY, oldCondition.get(VALUE_KEY));

                            /* Add condition to the UQI where clause. */
                            ((List) uqiWhereMap.get(CHILDREN_KEY)).add(uqiCondition);
                        });

                        return uqiWhereMap;
                    }

                    /**
                     * Throw error since no handler could be found for the pluginName and transformationName
                     * combination.
                     */
                    String transformationKeyNotFoundErrorMessage =
                            "Data transformer failed to find any " + "matching case for plugin: "
                                    + pluginName + " and key: " + transformationName + ". Please "
                                    + "contact Appsmith customer support to resolve this.";
                    assert false : transformationKeyNotFoundErrorMessage;

                    break;
                default:
                    /* Throw error since no handler could be found for the plugin matching pluginName */
                    String noPluginHandlerFoundErrorMessage = "Data transformer failed to find any matching case for "
                            + "plugin: " + pluginName + ". Please contact Appsmith customer support to resolve this.";
                    assert false : noPluginHandlerFoundErrorMessage;
            }

            /* Execution flow is never expected to reach here. */
            String badExecutionFlowErrorMessage = "Execution flow is never supposed to reach here. Please contact "
                    + "Appsmith customer support to resolve this.";
            assert false : badExecutionFlowErrorMessage;

            return value;
        }
    }

    private void updateFormDataMultipleOptions(
            int index,
            Object value,
            Map formData,
            Map<Integer, List<String>> migrationMap,
            Map<Integer, String> uqiDataTransformationMap,
            UQIMigrationDataTransformer dataTransformer,
            String pluginName) {
        if (migrationMap.containsKey(index)) {
            if (dataTransformer != null && uqiDataTransformationMap.containsKey(index)) {
                String transformationKey = uqiDataTransformationMap.get(index);
                value = dataTransformer.transformData(pluginName, transformationKey, value);
            }
            List<String> paths = migrationMap.get(index);
            for (String path : paths) {
                setValueSafelyInFormData(formData, path, value);
            }
        }
    }

    public Map iteratePluginSpecifiedTemplatesAndCreateFormDataMultipleOptions(
            List<Property> pluginSpecifiedTemplates,
            Map<Integer, List<String>> migrationMap,
            Map<Integer, String> uqiDataTransformationMap,
            UQIMigrationDataTransformer dataTransformer,
            String pluginName) {

        if (pluginSpecifiedTemplates != null && !pluginSpecifiedTemplates.isEmpty()) {
            Map<String, Object> formData = new HashMap<>();
            for (int i = 0; i < pluginSpecifiedTemplates.size(); i++) {
                Property template = pluginSpecifiedTemplates.get(i);
                if (template != null) {
                    updateFormDataMultipleOptions(
                            i,
                            template.getValue(),
                            formData,
                            migrationMap,
                            uqiDataTransformationMap,
                            dataTransformer,
                            pluginName);
                }
            }

            return formData;
        }

        return new HashMap<>();
    }

    @ChangeSet(order = "094", id = "migrate-s3-to-uqi", author = "") // preserve
    public void migrateS3PluginToUqi(MongoTemplate mongoTemplate) {
        // First update the UI component for the s3 plugin to UQI
        Plugin s3Plugin = mongoTemplate.findOne(query(where("packageName").is("amazons3-plugin")), Plugin.class);
        s3Plugin.setUiComponent("UQIDbEditorForm");

        // Update the plugin to use the new UI form.
        mongoTemplate.save(s3Plugin);
    }

    /**
     * Method to port `dynamicBindingPathList` to UQI model.
     *
     * @param dynamicBindingPathList : old dynamicBindingPathList
     * @param objectMapper
     * @param action
     * @param migrationMap           : A mapping from `pluginSpecifiedTemplates` index to attribute path in UQI model. For
     *                               reference, please check out the `s3MigrationMap` defined above.
     * @return : updated dynamicBindingPathList - ported to UQI model.
     */
    static List<Property> getUpdatedDynamicBindingPathList(
            List<Property> dynamicBindingPathList,
            ObjectMapper objectMapper,
            NewAction action,
            Map<Integer, List<String>> migrationMap) {
        // Return if empty.
        if (CollectionUtils.isEmpty(dynamicBindingPathList)) {
            return dynamicBindingPathList;
        }

        List<Property> newDynamicBindingPathList = new ArrayList<>();
        for (Property path : dynamicBindingPathList) {
            String pathKey = path.getKey();
            if (pathKey.contains("pluginSpecifiedTemplates")) {

                // Pattern looks for pluginSpecifiedTemplates[12 and extracts the 12
                Pattern pattern = Pattern.compile("(?<=pluginSpecifiedTemplates\\[)([0-9]+)");
                Matcher matcher = pattern.matcher(pathKey);

                while (matcher.find()) {
                    int index = Integer.parseInt(matcher.group());
                    List<String> partialPaths = migrationMap.get(index);
                    for (String partialPath : partialPaths) {
                        Property dynamicBindingPath = new Property("formData." + partialPath, null);
                        newDynamicBindingPathList.add(dynamicBindingPath);
                    }
                }
            } else {
                // this dynamic binding is for body. Add as is
                newDynamicBindingPathList.add(path);
            }

            // We may have an invalid dynamic binding. Trim the same
            List<String> dynamicBindingPathNames = newDynamicBindingPathList.stream()
                    .map(property -> property.getKey())
                    .collect(Collectors.toList());

            Set<String> pathsToRemove =
                    getInvalidDynamicBindingPathsInAction(objectMapper, action, dynamicBindingPathNames);

            // We have found atleast 1 invalid dynamic binding path.
            if (!pathsToRemove.isEmpty()) {
                // First remove the invalid paths from the set of paths
                dynamicBindingPathNames.removeAll(pathsToRemove);

                // Transform the set of paths to Property as it is stored in the db.
                List<Property> updatedDynamicBindingPathList = dynamicBindingPathNames.stream()
                        .map(dynamicBindingPath -> {
                            Property property = new Property();
                            property.setKey(dynamicBindingPath);
                            return property;
                        })
                        .collect(Collectors.toList());

                // Reset the path list to only contain valid binding paths.
                newDynamicBindingPathList = updatedDynamicBindingPathList;
            }
        }

        return newDynamicBindingPathList;
    }

    private DslUpdateDto updateListWidgetTriggerPaths(DslUpdateDto dslUpdateDto) {
        JSONObject dsl = dslUpdateDto.getDsl();
        Boolean updated = dslUpdateDto.getUpdated();

        if (dsl == null) {
            // This isn't a valid widget configuration. No need to traverse this.
            return dslUpdateDto;
        }

        String widgetType = dsl.getAsString(FieldName.WIDGET_TYPE);
        if ("LIST_WIDGET".equals(widgetType)) {
            // Only List Widget would go through the following processing

            // Start by picking all fields where we expect to find dynamic triggers for this particular widget
            List<Object> dynamicTriggerPaths = (ArrayList<Object>) dsl.get(DYNAMIC_TRIGGER_PATH_LIST);

            Set<String> newTriggerPaths = new HashSet<>();

            if (dynamicTriggerPaths != null) {
                // Each of these might have nested structures, so we iterate through them to find the leaf node for each
                for (Object x : dynamicTriggerPaths) {
                    Boolean validPath = true;
                    final String fieldPath = String.valueOf(((Map) x).get(FieldName.KEY));
                    String[] fields = fieldPath.split("[].\\[]");
                    // For nested fields, the parent dsl to search in would shift by one level every iteration
                    Object parent = dsl;
                    Iterator<String> fieldsIterator = Arrays.stream(fields)
                            .filter(fieldToken -> !fieldToken.isBlank())
                            .iterator();
                    boolean isLeafNode = false;
                    // This loop will end at either a leaf node, or the last identified JSON field (by throwing an
                    // exception)
                    // Valid forms of the fieldPath for this search could be:
                    // root.field.list[index].childField.anotherList.indexWithDotOperator.multidimensionalList[index1][index2]
                    while (fieldsIterator.hasNext()) {
                        String nextKey = fieldsIterator.next();
                        if (parent instanceof JSONObject) {
                            parent = ((JSONObject) parent).get(nextKey);
                        } else if (parent instanceof Map) {
                            parent = ((Map<String, ?>) parent).get(nextKey);
                        } else if (parent instanceof List) {
                            if (Pattern.matches(Pattern.compile("[0-9]+").toString(), nextKey)) {
                                try {
                                    parent = ((List) parent).get(Integer.parseInt(nextKey));
                                } catch (IndexOutOfBoundsException e) {
                                    // The index being referred does not exist. Hence the path would not exist.
                                    validPath = false;
                                }
                            } else {
                                validPath = false;
                            }
                        }
                        // After updating the parent, check for the types
                        if (parent == null) {
                            validPath = false;
                        } else if (parent instanceof String) {
                            // If we get String value, then this is a leaf node
                            isLeafNode = true;
                        }

                        // Only extract mustache keys from leaf nodes
                        if (isLeafNode && validPath) {

                            // We found the path.
                            if (!MustacheHelper.laxIsBindingPresentInString((String) parent)) {
                                // No bindings found.
                                break;
                            }

                            newTriggerPaths.add(fieldPath);
                        }
                    }
                }

                // Check if the newly computed trigger paths are different from the existing ones and if true, set it in
                // the dsl
                if (dynamicTriggerPaths.size() != newTriggerPaths.size()
                        || !newTriggerPaths.containsAll(dynamicTriggerPaths)) {
                    updated = Boolean.TRUE;
                    List<Object> finalTriggerPaths = new ArrayList<>();
                    for (String triggerPath : newTriggerPaths) {
                        Map<String, String> entry = new HashMap<>();
                        entry.put("key", triggerPath);
                        finalTriggerPaths.add(entry);
                    }
                    dsl.put(DYNAMIC_TRIGGER_PATH_LIST, finalTriggerPaths);
                }
            }
        }

        // Fetch the children of the current node in the DSL and recursively iterate over them to extract bindings
        ArrayList<Object> children = (ArrayList<Object>) dsl.get(FieldName.CHILDREN);
        ArrayList<Object> newChildren = new ArrayList<>();
        if (children != null) {
            for (int i = 0; i < children.size(); i++) {
                Map data = (Map) children.get(i);
                JSONObject object = new JSONObject();
                // If the children tag exists and there are entries within it
                if (!CollectionUtils.isEmpty(data)) {
                    object.putAll(data);
                    DslUpdateDto childUpdated = updateListWidgetTriggerPaths(new DslUpdateDto(object, updated));
                    updated = childUpdated.getUpdated();
                    newChildren.add(childUpdated.getDsl());
                }
            }
            dsl.put(FieldName.CHILDREN, newChildren);
        }

        return new DslUpdateDto(dsl, updated);
    }

    @ChangeSet(order = "099", id = "add-smtp-plugin", author = "") // preserve
    public void addSmtpPluginPlugin(MongoTemplate mongoTemplate) {
        Plugin plugin = new Plugin();
        plugin.setName("SMTP");
        plugin.setType(PluginType.DB);
        plugin.setPackageName("smtp-plugin");
        plugin.setUiComponent("UQIDbEditorForm");
        plugin.setDatasourceComponent("AutoForm");
        plugin.setResponseType(Plugin.ResponseType.JSON);
        plugin.setIconLocation("https://assets.appsmith.com/smtp-icon.svg");
        plugin.setDocumentationLink("https://docs.appsmith.com/datasource-reference/querying-smtp-plugin");
        plugin.setDefaultInstall(true);
        try {
            mongoTemplate.insert(plugin);
        } catch (DuplicateKeyException e) {
            log.warn(plugin.getPackageName() + " already present in database.");
        }
        installPluginToAllWorkspaces(mongoTemplate, plugin.getId());
    }

    @ChangeSet(order = "101", id = "add-google-sheets-plugin-name", author = "")
    public void addPluginNameForGoogleSheets(MongoTemplate mongoTemplate) {
        Plugin googleSheetsPlugin =
                mongoTemplate.findOne(query(where("packageName").is("google-sheets-plugin")), Plugin.class);

        assert googleSheetsPlugin != null;
        googleSheetsPlugin.setPluginName("google-sheets-plugin");

        mongoTemplate.save(googleSheetsPlugin);
    }

    protected static void doClearRedisKeys(ReactiveRedisOperations<String, String> reactiveRedisOperations) {
        final String script = "for _,k in ipairs(redis.call('keys','spring:session:sessions:*'))"
                + " do redis.call('del',k) " + "end";
        final Flux<Object> flushdb = reactiveRedisOperations.execute(RedisScript.of(script));

        flushdb.blockLast();
    }

    /* Map values from pluginSpecifiedTemplates to formData (UQI) */
    public static final Map<Integer, List<String>> firestoreMigrationMap = Map.ofEntries(
            Map.entry(0, List.of("command")),
            Map.entry(1, List.of("orderBy")),
            Map.entry(2, List.of("limitDocuments")),
            Map.entry(3, List.of("where")),
            Map.entry(4, List.of("")), // index 4 is not used in pluginSpecifiedTemplates
            Map.entry(5, List.of("")), // index 5 is not used in pluginSpecifiedTemplates
            Map.entry(6, List.of("startAfter")),
            Map.entry(7, List.of("endBefore")),
            Map.entry(8, List.of("timestampValuePath")),
            Map.entry(9, List.of("deleteKeyPath")));

    /**
     * This map indicates which fields in pluginSpecifiedTemplates require a transformation before their data can be
     * migrated to the UQI schema.
     * The key contains the index of the data that needs transformation and the value indicates the which kind of
     * transformation is required. e.g. (3, "where-clause-migration") indicates that the value against index 3 in
     * pluginSpecifiedTemplates needs to be migrated by the rules identified by the string "where-clause-migration".
     * The rules are defined in the class UQIMigrationDataTransformer.
     */
    public static final Map<Integer, String> firestoreUQIDataTransformationMap =
            Map.ofEntries(Map.entry(3, "where-clause-migration"));

    @ChangeSet(order = "103", id = "migrate-firestore-to-uqi", author = "")
    public void migrateFirestorePluginToUqi(MongoTemplate mongoTemplate) {

        // Update Firestore plugin to indicate use of UQI schema
        Plugin firestorePlugin =
                mongoTemplate.findOne(query(where("packageName").is("firestore-plugin")), Plugin.class);
        firestorePlugin.setUiComponent("UQIDbEditorForm");

        // Update plugin data.
        mongoTemplate.save(firestorePlugin);
    }

    /**
     * This migration was required because migration numbered 104 failed on prod due to ClassCastException on some
     * unexpected / bad older data.
     */
    @ChangeSet(order = "107", id = "migrate-firestore-to-uqi-3", author = "")
    public void migrateFirestorePluginToUqi3(MongoTemplate mongoTemplate) {
        // Update Firestore plugin to indicate use of UQI schema
        Plugin firestorePlugin =
                mongoTemplate.findOne(query(where("packageName").is("firestore-plugin")), Plugin.class);
        firestorePlugin.setUiComponent("UQIDbEditorForm");

        // Update plugin data.
        mongoTemplate.save(firestorePlugin);
    }

    /**
     * This migration introduces indexes on newAction, actionCollection, newPage and application collection to take
     * branchName param into consideration for optimising the find query for git connected applications
     */
    @ChangeSet(order = "110", id = "update-index-for-git", author = "") // preserve
    public void updateGitIndexes(MongoTemplate mongoTemplate) {

        // We can't set unique indexes for following as these requires the _id of the resource to be filled in for
        // defaultResourceId if the app is not connected to git. This results in handling the _id creation for resources
        // on our end instead of asking mongo driver to perform this operation
        ensureIndexes(
                mongoTemplate,
                NewAction.class,
                makeIndex("defaultResources.actionId", "defaultResources.branchName", "deleted")
                        .named("defaultActionId_branchName_deleted_compound_index"));

        ensureIndexes(
                mongoTemplate,
                ActionCollection.class,
                makeIndex("defaultResources.collectionId", "defaultResources.branchName", "deleted")
                        .named("defaultCollectionId_branchName_deleted"));

        ensureIndexes(
                mongoTemplate,
                NewPage.class,
                makeIndex("defaultResources.pageId", "defaultResources.branchName", "deleted")
                        .named("defaultPageId_branchName_deleted_compound_index"));

        ensureIndexes(
                mongoTemplate,
                Application.class,
                makeIndex("gitApplicationMetadata.defaultApplicationId", "gitApplicationMetadata.branchName", "deleted")
                        .named("defaultApplicationId_branchName_deleted"));
    }

    @ChangeSet(order = "113", id = "use-assets-cdn-for-plugin-icons", author = "") // preserve
    public void useAssetsCDNForPluginIcons(MongoTemplate mongoTemplate) {
        final Query query = query(new Criteria());
        query.fields().include(fieldName(QPlugin.plugin.iconLocation));
        List<Plugin> plugins = mongoTemplate.find(query, Plugin.class);
        for (final Plugin plugin : plugins) {
            if (plugin.getIconLocation() != null
                    && plugin.getIconLocation().startsWith("https://s3.us-east-2.amazonaws.com/assets.appsmith.com")) {
                final String cdnUrl = plugin.getIconLocation().replace("s3.us-east-2.amazonaws.com/", "");
                mongoTemplate.updateFirst(
                        query(where(fieldName(QPlugin.plugin.id)).is(plugin.getId())),
                        update(fieldName(QPlugin.plugin.iconLocation), cdnUrl),
                        Plugin.class);
            }
        }
    }

    /**
     * This migration introduces indexes on newAction, actionCollection and userData to improve the query performance
     */
    @ChangeSet(order = "114", id = "update-index-for-newAction-actionCollection-userData", author = "") // preserve
    public void updateNewActionActionCollectionAndUserDataIndexes(MongoTemplate mongoTemplate) {

        ensureIndexes(
                mongoTemplate,
                ActionCollection.class,
                makeIndex(FieldName.APPLICATION_ID).named("applicationId"));

        ensureIndexes(
                mongoTemplate,
                UserData.class,
                makeIndex(fieldName(QUserData.userData.userId)).unique().named("userId"));
    }

    @ChangeSet(order = "115", id = "mark-mssql-crud-unavailable", author = "") // preserve
    public void markMSSQLCrudUnavailable(MongoTemplate mongoTemplate) {
        Plugin plugin = mongoTemplate.findOne(query(where("packageName").is("mssql-plugin")), Plugin.class);
        assert plugin != null;
        plugin.setGenerateCRUDPageComponent(null);
        mongoTemplate.save(plugin);
    }

    /**
     * This migration introduces indexes on newAction, actionCollection to improve the query performance for queries like
     * getResourceByPageId which excludes the deleted entries
     */
    @ChangeSet(order = "116", id = "update-index-for-newAction-actionCollection", author = "")
    public void updateNewActionActionCollectionIndexes(MongoTemplate mongoTemplate) {

        ensureIndexes(
                mongoTemplate,
                NewAction.class,
                makeIndex(
                                fieldName(QNewAction.newAction.unpublishedAction) + "." + FieldName.PAGE_ID,
                                FieldName.DELETED)
                        .named("unpublishedActionPageId_deleted_compound_index"));

        ensureIndexes(
                mongoTemplate,
                NewAction.class,
                makeIndex(fieldName(QNewAction.newAction.publishedAction) + "." + FieldName.PAGE_ID, FieldName.DELETED)
                        .named("publishedActionPageId_deleted_compound_index"));

        ensureIndexes(
                mongoTemplate,
                ActionCollection.class,
                makeIndex(
                                fieldName(QActionCollection.actionCollection.unpublishedCollection) + "."
                                        + FieldName.PAGE_ID,
                                FieldName.DELETED)
                        .named("unpublishedCollectionPageId_deleted"));

        ensureIndexes(
                mongoTemplate,
                ActionCollection.class,
                makeIndex(
                                fieldName(QActionCollection.actionCollection.publishedCollection) + "."
                                        + FieldName.PAGE_ID,
                                FieldName.DELETED)
                        .named("publishedCollectionPageId_deleted"));
    }
}
