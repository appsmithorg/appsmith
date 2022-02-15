package com.appsmith.server.migrations;

import com.appsmith.external.helpers.MustacheHelper;
import com.appsmith.external.models.ActionConfiguration;
import com.appsmith.external.models.BaseDomain;
import com.appsmith.external.models.Connection;
import com.appsmith.external.models.DBAuth;
import com.appsmith.external.models.Datasource;
import com.appsmith.external.models.DatasourceConfiguration;
import com.appsmith.external.models.DefaultResources;
import com.appsmith.external.models.Policy;
import com.appsmith.external.models.Property;
import com.appsmith.external.models.QBaseDomain;
import com.appsmith.external.models.QDatasource;
import com.appsmith.external.models.SSLDetails;
import com.appsmith.external.services.EncryptionService;
import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.acl.AppsmithRole;
import com.appsmith.server.constants.Appsmith;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.domains.Action;
import com.appsmith.server.domains.ActionCollection;
import com.appsmith.server.domains.Application;
import com.appsmith.server.domains.Collection;
import com.appsmith.server.domains.Comment;
import com.appsmith.server.domains.CommentNotification;
import com.appsmith.server.domains.CommentThread;
import com.appsmith.server.domains.CommentThreadNotification;
import com.appsmith.server.domains.Config;
import com.appsmith.server.domains.GitApplicationMetadata;
import com.appsmith.server.domains.GitAuth;
import com.appsmith.server.domains.Group;
import com.appsmith.server.domains.InviteUser;
import com.appsmith.server.domains.Layout;
import com.appsmith.server.domains.NewAction;
import com.appsmith.server.domains.NewPage;
import com.appsmith.server.domains.Notification;
import com.appsmith.server.domains.Organization;
import com.appsmith.server.domains.OrganizationPlugin;
import com.appsmith.server.domains.Page;
import com.appsmith.server.domains.PasswordResetToken;
import com.appsmith.server.domains.Permission;
import com.appsmith.server.domains.Plugin;
import com.appsmith.server.domains.PluginType;
import com.appsmith.server.domains.QActionCollection;
import com.appsmith.server.domains.QApplication;
import com.appsmith.server.domains.QComment;
import com.appsmith.server.domains.QCommentNotification;
import com.appsmith.server.domains.QCommentThread;
import com.appsmith.server.domains.QCommentThreadNotification;
import com.appsmith.server.domains.QConfig;
import com.appsmith.server.domains.QNewAction;
import com.appsmith.server.domains.QNewPage;
import com.appsmith.server.domains.QNotification;
import com.appsmith.server.domains.QOrganization;
import com.appsmith.server.domains.QPlugin;
import com.appsmith.server.domains.QTheme;
import com.appsmith.server.domains.QUserData;
import com.appsmith.server.domains.Role;
import com.appsmith.server.domains.Sequence;
import com.appsmith.server.domains.Theme;
import com.appsmith.server.domains.User;
import com.appsmith.server.domains.UserData;
import com.appsmith.server.domains.UserRole;
import com.appsmith.server.dtos.ActionCollectionDTO;
import com.appsmith.server.dtos.ActionDTO;
import com.appsmith.server.dtos.DslActionDTO;
import com.appsmith.server.dtos.OrganizationPluginStatus;
import com.appsmith.server.dtos.PageDTO;
import com.appsmith.server.helpers.GitDeployKeyGenerator;
import com.appsmith.server.helpers.TextUtils;
import com.appsmith.server.services.OrganizationService;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.github.cloudyrock.mongock.ChangeLog;
import com.github.cloudyrock.mongock.ChangeSet;
import com.github.cloudyrock.mongock.driver.mongodb.springdata.v3.decorator.impl.MongockTemplate;
import com.google.gson.Gson;
import com.mongodb.MongoException;
import com.mongodb.client.MongoCollection;
import com.mongodb.client.MongoCursor;
import com.mongodb.client.model.Filters;
import com.mysema.commons.lang.Pair;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.extern.slf4j.Slf4j;
import net.minidev.json.JSONObject;
import org.apache.commons.lang.ArrayUtils;
import org.apache.commons.lang.ObjectUtils;
import org.apache.commons.lang.StringUtils;
import org.bson.Document;
import org.bson.types.ObjectId;
import org.springframework.core.io.DefaultResourceLoader;
import org.springframework.dao.DataAccessException;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.data.domain.Sort;
import org.springframework.data.mongodb.UncategorizedMongoDbException;
import org.springframework.data.mongodb.core.CollectionCallback;
import org.springframework.data.mongodb.core.MongoOperations;
import org.springframework.data.mongodb.core.index.CompoundIndexDefinition;
import org.springframework.data.mongodb.core.index.Index;
import org.springframework.data.mongodb.core.index.IndexOperations;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Update;
import org.springframework.data.redis.core.ReactiveRedisOperations;
import org.springframework.data.redis.core.script.RedisScript;
import org.springframework.util.CollectionUtils;
import org.springframework.util.StreamUtils;
import reactor.core.publisher.Flux;

import java.io.IOException;
import java.nio.charset.Charset;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.HashMap;
import java.util.HashSet;
import java.util.Iterator;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Random;
import java.util.Set;
import java.util.concurrent.TimeUnit;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

import static com.appsmith.external.helpers.AppsmithBeanUtils.copyNewFieldValuesIntoOldObject;
import static com.appsmith.external.helpers.PluginUtils.getValueSafelyFromFormData;
import static com.appsmith.external.helpers.PluginUtils.setValueSafelyInFormData;
import static com.appsmith.server.acl.AclPermission.EXECUTE_ACTIONS;
import static com.appsmith.server.acl.AclPermission.EXPORT_APPLICATIONS;
import static com.appsmith.server.acl.AclPermission.MAKE_PUBLIC_APPLICATIONS;
import static com.appsmith.server.acl.AclPermission.ORGANIZATION_EXPORT_APPLICATIONS;
import static com.appsmith.server.acl.AclPermission.ORGANIZATION_INVITE_USERS;
import static com.appsmith.server.acl.AclPermission.READ_ACTIONS;
import static com.appsmith.server.constants.FieldName.DEFAULT_RESOURCES;
import static com.appsmith.server.constants.FieldName.DYNAMIC_TRIGGER_PATH_LIST;
import static com.appsmith.server.helpers.CollectionUtils.isNullOrEmpty;
import static com.appsmith.server.repositories.BaseAppsmithRepositoryImpl.fieldName;
import static java.lang.Boolean.FALSE;
import static java.lang.Boolean.TRUE;
import static org.springframework.data.mongodb.core.query.Criteria.where;
import static org.springframework.data.mongodb.core.query.Query.query;
import static org.springframework.data.mongodb.core.query.Update.update;

@Slf4j
@ChangeLog(order = "001")
public class DatabaseChangelog {

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

    @AllArgsConstructor
    @NoArgsConstructor
    @Setter
    @Getter
    class DslUpdateDto {
        private JSONObject dsl;
        private Boolean updated;
    }

    /**
     * A private, pure utility function to create instances of Index objects to pass to `IndexOps.ensureIndex` method.
     * Note: The order of the fields here is important. An index with the fields `"name", "organizationId"` is different
     * from an index with the fields `"organizationId", "name"`. If an index exists with the first ordering and we try
     * to **ensure** an index with the same name but the second ordering of fields, errors will show up and bad things
     * WILL happen.
     * <p>
     * Also, please check out the following blog on how to best create indexes :
     * https://emptysqua.re/blog/optimizing-mongodb-compound-indexes/
     */
    private static Index makeIndex(String... fields) {
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
     * Given a MongockTemplate, a domain class and a bunch of Index definitions, this pure utility function will ensure
     * those indexes on the database behind the MongockTemplate instance.
     */
    private static void ensureIndexes(MongockTemplate mongoTemplate, Class<?> entityClass, Index... indexes) {
        IndexOperations indexOps = mongoTemplate.indexOps(entityClass);
        for (Index index : indexes) {
            indexOps.ensureIndex(index);
        }
    }

    private static void dropIndexIfExists(MongockTemplate mongoTemplate, Class<?> entityClass, String name) {
        try {
            mongoTemplate.indexOps(entityClass).dropIndex(name);
        } catch (UncategorizedMongoDbException ignored) {
            // The index probably doesn't exist. This happens if the database is created after the @Indexed annotation
            // has been removed.
        }
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

    private void installPluginToAllOrganizations(MongockTemplate mongockTemplate, String pluginId) {
        for (Organization organization : mongockTemplate.findAll(Organization.class)) {
            if (CollectionUtils.isEmpty(organization.getPlugins())) {
                organization.setPlugins(new HashSet<>());
            }

            final Set<String> installedPlugins = organization.getPlugins()
                    .stream().map(OrganizationPlugin::getPluginId).collect(Collectors.toSet());

            if (!installedPlugins.contains(pluginId)) {
                organization.getPlugins()
                        .add(new OrganizationPlugin(pluginId, OrganizationPluginStatus.FREE));
            }

            mongockTemplate.save(organization);
        }
    }

    @ChangeSet(order = "001", id = "initial-plugins", author = "")
    public void initialPlugins(MongockTemplate mongoTemplate) {
        Plugin plugin1 = new Plugin();
        plugin1.setName("PostgresDbPlugin");
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
        plugin2.setName("RestTemplatePluginExecutor");
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
        plugin3.setName("MongoDBPlugin");
        plugin3.setType(PluginType.DB);
        plugin3.setPackageName("mongo-plugin");
        plugin3.setUiComponent("DbEditorForm");
        plugin3.setDefaultInstall(true);
        try {
            mongoTemplate.insert(plugin3);
        } catch (DuplicateKeyException e) {
            log.warn("mongo-plugin already present in database.");
        }

        Plugin plugin4 = new Plugin();
        plugin4.setName("Rapid API Plugin");
        plugin4.setType(PluginType.API);
        plugin4.setPackageName("rapidapi-plugin");
        plugin4.setUiComponent("RapidApiEditorForm");
        plugin4.setDefaultInstall(true);
        try {
            mongoTemplate.insert(plugin4);
        } catch (DuplicateKeyException e) {
            log.warn("rapidapi-plugin already present in database.");
        }
    }

    @ChangeSet(order = "002", id = "remove-org-name-index", author = "")
    public void removeOrgNameIndex(MongockTemplate mongoTemplate) {
        dropIndexIfExists(mongoTemplate, Organization.class, "name");
    }

    @ChangeSet(order = "003", id = "add-org-slugs", author = "")
    public void addOrgSlugs(MongockTemplate mongoTemplate, OrganizationService organizationService) {
        // For all existing organizations, add a slug field, which should be unique.
        // We are blocking here for adding a slug to each existing organization. This is bad and slow. Do NOT copy this
        // code fragment into the services' control flow. This is a single migration code and is expected to run once in
        // lifetime of a deployment.
        for (Organization organization : mongoTemplate.findAll(Organization.class)) {
            if (organization.getSlug() == null) {
                organizationService.getNextUniqueSlug(organization.makeSlug())
                        .doOnSuccess(slug -> {
                            organization.setSlug(slug);
                            mongoTemplate.save(organization);
                        })
                        .block();
            }
        }
    }

    /**
     * We are creating indexes manually because Spring's index resolver creates indexes on fields as well.
     * See https://stackoverflow.com/questions/60867491/ for an explanation of the problem. We have that problem with
     * the `Action.datasource` field.
     */
    @ChangeSet(order = "004", id = "initial-indexes", author = "")
    public void addInitialIndexes(MongockTemplate mongoTemplate) {
        Index createdAtIndex = makeIndex("createdAt");

        ensureIndexes(mongoTemplate, Action.class,
                createdAtIndex,
                makeIndex("pageId", "name").unique().named("action_page_compound_index")
        );

        ensureIndexes(mongoTemplate, Application.class,
                createdAtIndex,
                makeIndex("organizationId", "name").unique().named("organization_application_compound_index")
        );

        ensureIndexes(mongoTemplate, Collection.class,
                createdAtIndex
        );

        ensureIndexes(mongoTemplate, Config.class,
                createdAtIndex,
                makeIndex("name").unique()
        );

        ensureIndexes(mongoTemplate, Datasource.class,
                createdAtIndex,
                makeIndex("organizationId", "name").unique().named("organization_datasource_compound_index")
        );

        ensureIndexes(mongoTemplate, InviteUser.class,
                createdAtIndex,
                makeIndex("token").unique().expire(3600, TimeUnit.SECONDS),
                makeIndex("email").unique()
        );

        ensureIndexes(mongoTemplate, Organization.class,
                createdAtIndex,
                makeIndex("slug").unique()
        );

        ensureIndexes(mongoTemplate, Page.class,
                createdAtIndex,
                makeIndex("applicationId", "name").unique().named("application_page_compound_index")
        );

        ensureIndexes(mongoTemplate, PasswordResetToken.class,
                createdAtIndex,
                makeIndex("email").unique().expire(3600, TimeUnit.SECONDS)
        );

        ensureIndexes(mongoTemplate, Permission.class,
                createdAtIndex
        );

        ensureIndexes(mongoTemplate, Plugin.class,
                createdAtIndex,
                makeIndex("type"),
                makeIndex("packageName").unique()
        );

        ensureIndexes(mongoTemplate, Role.class,
                createdAtIndex
        );

        ensureIndexes(mongoTemplate, User.class,
                createdAtIndex,
                makeIndex("email").unique()
        );
    }

    @ChangeSet(order = "005", id = "application-deleted-at", author = "")
    public void addApplicationDeletedAtFieldAndIndex(MongockTemplate mongoTemplate) {
        dropIndexIfExists(mongoTemplate, Application.class, "organization_application_compound_index");

        ensureIndexes(mongoTemplate, Application.class,
                makeIndex("organizationId", "name", "deletedAt")
                        .unique().named("organization_application_deleted_compound_index")
        );

        for (Application application : mongoTemplate.findAll(Application.class)) {
            if (application.isDeleted()) {
                application.setDeletedAt(application.getUpdatedAt());
                mongoTemplate.save(application);
            }
        }
    }

    @ChangeSet(order = "006", id = "hide-rapidapi-plugin", author = "")
    public void hideRapidApiPluginFromCreateDatasource(MongockTemplate mongoTemplate) {
        final Plugin rapidApiPlugin = mongoTemplate.findOne(
                query(where("packageName").is("rapidapi-plugin")),
                Plugin.class
        );

        if (rapidApiPlugin == null) {
            log.error("Couldn't find rapidapi-plugin, to set it's `allowUserDatasources` to false.");

        } else {
            rapidApiPlugin.setAllowUserDatasources(false);
            mongoTemplate.save(rapidApiPlugin);

        }
    }

    @ChangeSet(order = "007", id = "datasource-deleted-at", author = "")
    public void addDatasourceDeletedAtFieldAndIndex(MongockTemplate mongoTemplate) {
        dropIndexIfExists(mongoTemplate, Datasource.class, "organization_datasource_compound_index");

        ensureIndexes(mongoTemplate, Datasource.class,
                makeIndex(FieldName.ORGANIZATION_ID, FieldName.NAME, FieldName.DELETED_AT)
                        .unique().named("organization_datasource_deleted_compound_index")
        );

        for (Datasource datasource : mongoTemplate.findAll(Datasource.class)) {
            if (datasource.isDeleted()) {
                datasource.setDeletedAt(datasource.getUpdatedAt());
                mongoTemplate.save(datasource);
            }
        }
    }

    @ChangeSet(order = "008", id = "page-deleted-at", author = "")
    public void addPageDeletedAtFieldAndIndex(MongockTemplate mongoTemplate) {
        dropIndexIfExists(mongoTemplate, Page.class, "application_page_compound_index");

        ensureIndexes(mongoTemplate, Page.class,
                makeIndex(FieldName.APPLICATION_ID, FieldName.NAME, FieldName.DELETED_AT)
                        .unique().named("application_page_deleted_compound_index")
        );

        for (Page page : mongoTemplate.findAll(Page.class)) {
            if (page.isDeleted()) {
                page.setDeletedAt(page.getUpdatedAt());
                mongoTemplate.save(page);
            }
        }
    }

    @ChangeSet(order = "009", id = "friendly-plugin-names", author = "")
    public void setFriendlyPluginNames(MongockTemplate mongoTemplate) {
        for (Plugin plugin : mongoTemplate.findAll(Plugin.class)) {
            if ("postgres-plugin".equals(plugin.getPackageName())) {
                plugin.setName("PostgreSQL");
            } else if ("restapi-plugin".equals(plugin.getPackageName())) {
                plugin.setName("REST API");
            } else if ("mongo-plugin".equals(plugin.getPackageName())) {
                plugin.setName("MongoDB");
            } else {
                continue;
            }
            mongoTemplate.save(plugin);
        }
    }

    @ChangeSet(order = "010", id = "add-delete-datasource-perm-existing-groups", author = "")
    public void addDeleteDatasourcePermToExistingGroups(MongockTemplate mongoTemplate) {
        for (Group group : mongoTemplate.findAll(Group.class)) {
            if (CollectionUtils.isEmpty(group.getPermissions())) {
                group.setPermissions(new HashSet<>());
            }
            group.getPermissions().add("delete:datasources");
            mongoTemplate.save(group);
        }
    }

    @ChangeSet(order = "011", id = "install-default-plugins-to-all-organizations", author = "")
    public void installDefaultPluginsToAllOrganizations(MongockTemplate mongoTemplate) {
        final List<Plugin> defaultPlugins = mongoTemplate.find(
                query(where("defaultInstall").is(true)),
                Plugin.class
        );

        mongoTemplate.findAll(Plugin.class);

        for (Organization organization : mongoTemplate.findAll(Organization.class)) {
            if (CollectionUtils.isEmpty(organization.getPlugins())) {
                organization.setPlugins(new HashSet<>());
            }

            final Set<String> installedPlugins = organization.getPlugins()
                    .stream().map(OrganizationPlugin::getPluginId).collect(Collectors.toSet());

            for (Plugin defaultPlugin : defaultPlugins) {
                if (!installedPlugins.contains(defaultPlugin.getId())) {
                    organization.getPlugins()
                            .add(new OrganizationPlugin(defaultPlugin.getId(), OrganizationPluginStatus.FREE));
                }
            }

            mongoTemplate.save(organization);
        }
    }

    @ChangeSet(order = "012", id = "ensure-datasource-created-and-updated-at-fields", author = "")
    public void ensureDatasourceCreatedAndUpdatedAt(MongockTemplate mongoTemplate) {
        final List<Datasource> missingCreatedAt = mongoTemplate.find(
                query(where("createdAt").exists(false)),
                Datasource.class
        );

        for (Datasource datasource : missingCreatedAt) {
            datasource.setCreatedAt(Instant.now());
            mongoTemplate.save(datasource);
        }

        final List<Datasource> missingUpdatedAt = mongoTemplate.find(
                query(where("updatedAt").exists(false)),
                Datasource.class
        );

        for (Datasource datasource : missingUpdatedAt) {
            datasource.setUpdatedAt(Instant.now());
            mongoTemplate.save(datasource);
        }
    }

    @ChangeSet(order = "013", id = "add-index-for-sequence-name", author = "")
    public void addIndexForSequenceName(MongockTemplate mongoTemplate) {
        ensureIndexes(mongoTemplate, Sequence.class,
                makeIndex(FieldName.NAME).unique()
        );
    }

    @ChangeSet(order = "014", id = "set-initial-sequence-for-datasource", author = "")
    public void setInitialSequenceForDatasource(MongockTemplate mongoTemplate) {
        final Long maxUntitledDatasourceNumber = mongoTemplate.find(
                        query(where(FieldName.NAME).regex("^" + Datasource.DEFAULT_NAME_PREFIX + " \\d+$")),
                        Datasource.class
                )
                .stream()
                .map(datasource -> Long.parseLong(datasource.getName().split(" ")[2]))
                .max(Long::compareTo)
                .orElse(0L);

        mongoTemplate.upsert(
                query(where(FieldName.NAME).is(mongoTemplate.getCollectionName(Datasource.class))),
                update("nextNumber", maxUntitledDatasourceNumber + 1),
                Sequence.class
        );
    }

    @ChangeSet(order = "015", id = "set-plugin-image-and-docs-link", author = "")
    public void setPluginImageAndDocsLink(MongockTemplate mongoTemplate) {
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

    @ChangeSet(order = "016", id = "fix-double-escapes", author = "")
    public void fixDoubleEscapes(MongockTemplate mongoTemplate) {
        final List<Action> actions = mongoTemplate.find(
                query(where("jsonPathKeys").exists(true)),
                Action.class
        );

        for (final Action action : actions) {
            final Set<String> keys = action.getJsonPathKeys();
            if (CollectionUtils.isEmpty(keys)) {
                continue;
            }

            final Set<String> fixedKeys = new HashSet<>();
            boolean hasFixes = false;
            for (final String key : keys) {
                final String fixed = key
                        .replaceAll("\\\\n", "\n")
                        .replaceAll("\\\\r", "\r")
                        .replaceAll("\\\\t", "\t");
                fixedKeys.add(fixed);
                if (!hasFixes && !fixed.equals(key)) {
                    hasFixes = true;
                }
            }

            if (hasFixes) {
                action.setJsonPathKeys(fixedKeys);
                mongoTemplate.save(action);
            }
        }
    }

    @ChangeSet(order = "017", id = "encrypt-password", author = "")
    public void encryptPassword(MongockTemplate mongoTemplate, EncryptionService encryptionService) {
        final List<Datasource> datasources = mongoTemplate.find(
                query(where("datasourceConfiguration.authentication.password").exists(true)),
                Datasource.class
        );

        for (final Datasource datasource : datasources) {
            DBAuth authentication = (DBAuth) datasource.getDatasourceConfiguration().getAuthentication();
            authentication.setPassword(encryptionService.encryptString(authentication.getPassword()));
            mongoTemplate.save(datasource);
        }
    }

    @ChangeSet(order = "018", id = "install-mysql-plugins", author = "")
    public void mysqlPlugin(MongockTemplate mongoTemplate) {
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

        installPluginToAllOrganizations(mongoTemplate, plugin1.getId());
    }

    @ChangeSet(order = "019", id = "update-database-documentation-links", author = "")
    public void updateDatabaseDocumentationLinks(MongockTemplate mongoTemplate) {
        for (Plugin plugin : mongoTemplate.findAll(Plugin.class)) {
            if ("postgres-plugin".equals(plugin.getPackageName())) {
                plugin.setDocumentationLink(
                        "");

            } else if ("mongo-plugin".equals(plugin.getPackageName())) {
                plugin.setDocumentationLink(
                        "https://docs.appsmith.com/v/v1.2.1/datasource-reference/querying-mongodb");

            } else {
                continue;

            }

            mongoTemplate.save(plugin);
        }
    }

    @ChangeSet(order = "020", id = "execute-action-for-read-action", author = "")
    public void giveExecutePermissionToReadActionUsers(MongockTemplate mongoTemplate) {
        final List<Action> actions = mongoTemplate.find(
                query(where("policies").exists(true)),
                Action.class
        );

        for (final Action action : actions) {
            Set<Policy> policies = action.getPolicies();
            if (policies.size() > 0) {
                Optional<Policy> readActionsOptional = policies.stream().filter(policy -> policy.getPermission().equals(READ_ACTIONS.getValue())).findFirst();
                if (readActionsOptional.isPresent()) {
                    Policy readActionPolicy = readActionsOptional.get();

                    Optional<Policy> executeActionsOptional = policies.stream().filter(policy -> policy.getPermission().equals(EXECUTE_ACTIONS.getValue())).findFirst();
                    if (executeActionsOptional.isPresent()) {
                        Policy executeActionPolicy = executeActionsOptional.get();
                        executeActionPolicy.getUsers().addAll(readActionPolicy.getUsers());
                    } else {
                        // this policy doesnt exist. create and add this to the policy set
                        Policy newExecuteActionPolicy = Policy.builder().permission(EXECUTE_ACTIONS.getValue())
                                .users(readActionPolicy.getUsers()).build();
                        action.getPolicies().add(newExecuteActionPolicy);
                    }
                    mongoTemplate.save(action);
                }
            }
        }
    }

    @ChangeSet(order = "021", id = "invite-and-public-permissions", author = "")
    public void giveInvitePermissionToOrganizationsAndPublicPermissionsToApplications(MongockTemplate mongoTemplate) {
        final List<Organization> organizations = mongoTemplate.find(
                query(where("userRoles").exists(true)),
                Organization.class
        );

        for (final Organization organization : organizations) {
            Set<String> adminUsernames = organization.getUserRoles()
                    .stream()
                    .filter(role -> (role.getRole().equals(AppsmithRole.ORGANIZATION_ADMIN)))
                    .map(role -> role.getUsername())
                    .collect(Collectors.toSet());

            Set<String> developerUsernames = organization.getUserRoles()
                    .stream()
                    .filter(role -> (role.getRole().equals(AppsmithRole.ORGANIZATION_DEVELOPER)))
                    .map(role -> role.getUsername())
                    .collect(Collectors.toSet());

            // All the developers and administrators of the organization should be allowed to get invite permissions
            Set<String> invitePermissionUsernames = new HashSet<>();
            invitePermissionUsernames.addAll(developerUsernames);
            invitePermissionUsernames.addAll(adminUsernames);

            Set<Policy> policies = organization.getPolicies();
            if (policies == null) {
                policies = new HashSet<>();
            }

            Optional<Policy> inviteUsersOptional = policies.stream().filter(policy -> policy.getPermission().equals(ORGANIZATION_INVITE_USERS.getValue())).findFirst();
            if (inviteUsersOptional.isPresent()) {
                Policy inviteUserPolicy = inviteUsersOptional.get();
                inviteUserPolicy.getUsers().addAll(invitePermissionUsernames);
            } else {
                // this policy doesnt exist. create and add this to the policy set
                Policy inviteUserPolicy = Policy.builder().permission(ORGANIZATION_INVITE_USERS.getValue())
                        .users(invitePermissionUsernames).build();
                organization.getPolicies().add(inviteUserPolicy);
            }

            mongoTemplate.save(organization);

            // Update the applications with public view policy for all administrators of the organization
            List<Application> orgApplications = mongoTemplate.find(
                    query(where(fieldName(QApplication.application.organizationId)).is(organization.getId())),
                    Application.class
            );

            for (final Application application : orgApplications) {
                Set<Policy> applicationPolicies = application.getPolicies();
                if (applicationPolicies == null) {
                    applicationPolicies = new HashSet<>();
                }

                Optional<Policy> makePublicAppOptional = applicationPolicies.stream().filter(policy -> policy.getPermission().equals(MAKE_PUBLIC_APPLICATIONS.getValue())).findFirst();
                if (makePublicAppOptional.isPresent()) {
                    Policy makePublicPolicy = makePublicAppOptional.get();
                    makePublicPolicy.getUsers().addAll(adminUsernames);
                } else {
                    // this policy doesnt exist. create and add this to the policy set
                    Policy newPublicAppPolicy = Policy.builder().permission(MAKE_PUBLIC_APPLICATIONS.getValue())
                            .users(adminUsernames).build();
                    application.getPolicies().add(newPublicAppPolicy);
                }

                mongoTemplate.save(application);
            }
        }
    }

    @SuppressWarnings({"unchecked", "rawtypes"})
    @ChangeSet(order = "022", id = "examples-organization", author = "")
    public void examplesOrganization(MongockTemplate mongoTemplate, EncryptionService encryptionService) throws IOException {
        final Map<String, String> plugins = new HashMap<>();

        final List<Map<String, Object>> organizationPlugins = mongoTemplate
                .find(query(where("defaultInstall").is(true)), Plugin.class)
                .stream()
                .map(plugin -> {
                    assert plugin.getId() != null;
                    plugins.put(plugin.getPackageName(), plugin.getId());
                    return Map.of(
                            "pluginId", plugin.getId(),
                            "status", "FREE",
                            FieldName.DELETED, false,
                            "policies", Collections.emptyList()
                    );
                })
                .collect(Collectors.toList());
        final String jsonContent = StreamUtils.copyToString(
                new DefaultResourceLoader().getResource("examples-organization.json").getInputStream(),
                Charset.defaultCharset()
        );

        final Map<String, Object> organization = new Gson().fromJson(jsonContent, HashMap.class);

        final List<Map<String, Object>> datasources = (List) organization.remove("$datasources");
        final List<Map<String, Object>> applications = (List) organization.remove("$applications");

        organization.put("plugins", organizationPlugins);
        organization.put(FieldName.CREATED_AT, Instant.now());
        final Map<String, Object> insertedOrganization = mongoTemplate.insert(organization, mongoTemplate.getCollectionName(Organization.class));
        final String organizationId = ((ObjectId) insertedOrganization.get("_id")).toHexString();

        final Map<String, String> datasourceIdsByName = new HashMap<>();

        for (final Map<String, Object> datasource : datasources) {
            datasource.put("pluginId", plugins.get(datasource.remove("$pluginPackageName")));
            final Map authentication = (Map) ((Map) datasource.get("datasourceConfiguration")).get("authentication");
            if (authentication != null) {
                final String plainPassword = (String) authentication.get("password");
                authentication.put("password", encryptionService.encryptString(plainPassword));
            }
            datasource.put(FieldName.ORGANIZATION_ID, organizationId);
            datasource.put(FieldName.CREATED_AT, Instant.now());
            final Map<String, Object> insertedDatasource = mongoTemplate.insert(datasource, mongoTemplate.getCollectionName(Datasource.class));
            datasourceIdsByName.put((String) datasource.get("name"), ((ObjectId) insertedDatasource.get("_id")).toHexString());
        }

        for (final Map<String, Object> application : applications) {
            final List<Map<String, Object>> fullPages = (List) application.remove("$pages");
            final List<Map<String, Object>> embeddedPages = new ArrayList<>();

            application.put(FieldName.ORGANIZATION_ID, organizationId);
            mongoTemplate.insert(application, mongoTemplate.getCollectionName(Application.class));
            final String applicationId = ((ObjectId) application.get("_id")).toHexString();

            for (final Map<String, Object> fullPage : fullPages) {
                final boolean isDefault = (boolean) fullPage.remove("$isDefault");

                final List<Map<String, Object>> actions = (List) ObjectUtils.defaultIfNull(
                        fullPage.remove("$actions"), Collections.emptyList());

                final List<Map<String, Object>> layouts = (List) fullPage.getOrDefault("layouts", Collections.emptyList());
                for (final Map<String, Object> layout : layouts) {
                    layout.put("_id", new ObjectId());
                }

                fullPage.put("applicationId", applicationId);
                fullPage.put(FieldName.CREATED_AT, Instant.now());
                final Map<String, Object> insertedPage = mongoTemplate.insert(fullPage, mongoTemplate.getCollectionName(Page.class));
                final String pageId = ((ObjectId) insertedPage.get("_id")).toHexString();
                embeddedPages.add(Map.of(
                        "_id", pageId,
                        "isDefault", isDefault
                ));

                final Map<String, String> actionIdsByName = new HashMap<>();
                for (final Map<String, Object> action : actions) {
                    final Map<String, Object> datasource = (Map) action.get("datasource");
                    datasource.put("pluginId", plugins.get(datasource.remove("$pluginPackageName")));
                    datasource.put(FieldName.ORGANIZATION_ID, organizationId);
                    if (FALSE.equals(datasource.remove("$isEmbedded"))) {
                        datasource.put("_id", new ObjectId(datasourceIdsByName.get(datasource.get("name"))));
                    }
                    action.put(FieldName.ORGANIZATION_ID, organizationId);
                    action.put("pageId", pageId);
                    action.put("pluginId", plugins.get(action.remove("$pluginPackageName")));
                    action.put(FieldName.CREATED_AT, Instant.now());
                    final Map<String, Object> insertedAction = mongoTemplate.insert(action, mongoTemplate.getCollectionName(Action.class));
                    actionIdsByName.put((String) action.get("name"), ((ObjectId) insertedAction.get("_id")).toHexString());
                }

                final List<Map<String, Object>> layouts1 = (List) insertedPage.get("layouts");
                for (Map<String, Object> layout : layouts1) {
                    final List<List<Map<String, Object>>> onLoadActions = (List) layout.getOrDefault("layoutOnLoadActions", Collections.emptyList());
                    for (final List<Map<String, Object>> actionSet : onLoadActions) {
                        for (final Map<String, Object> action : actionSet) {
                            action.put("_id", new ObjectId(actionIdsByName.get(action.get("name"))));
                        }
                    }
                    final List<List<Map<String, Object>>> onLoadActions2 = (List) layout.getOrDefault("publishedLayoutOnLoadActions", Collections.emptyList());
                    for (final List<Map<String, Object>> actionSet : onLoadActions2) {
                        for (final Map<String, Object> action : actionSet) {
                            action.put("_id", new ObjectId(actionIdsByName.get(action.get("name"))));
                        }
                    }
                }
                mongoTemplate.updateFirst(
                        query(where("_id").is(pageId)),
                        update("layouts", layouts1),
                        Page.class
                );
            }

            application.put("pages", embeddedPages);
            mongoTemplate.updateFirst(
                    query(where("_id").is(applicationId)),
                    update("pages", embeddedPages),
                    Application.class
            );
        }

        Config config = new Config();
        config.setName("template-organization");
        config.setConfig(new JSONObject(Map.of("organizationId", organizationId)));
        mongoTemplate.insert(config);
    }

    @ChangeSet(order = "023", id = "set-example-apps-in-config", author = "")
    public void setExampleAppsInConfig(MongockTemplate mongoTemplate) {
        final org.springframework.data.mongodb.core.query.Query configQuery = query(where("name").is("template-organization"));

        final Config config = mongoTemplate.findOne(
                configQuery,
                Config.class
        );

        if (config == null) {
            // No template organization configured. Nothing to migrate.
            return;
        }

        final String organizationId = config.getConfig().getAsString("organizationId");

        final List<Application> applications = mongoTemplate.find(
                query(where(fieldName(QApplication.application.organizationId)).is(organizationId)),
                Application.class
        );

        final List<String> applicationIds = new ArrayList<>();
        for (final Application application : applications) {
            applicationIds.add(application.getId());
        }

        mongoTemplate.updateFirst(
                configQuery,
                update("config.applicationIds", applicationIds),
                Config.class
        );
    }

    @ChangeSet(order = "024", id = "update-erroneous-action-ids", author = "")
    public void updateErroneousActionIdsInPage(MongockTemplate mongoTemplate) {
        final org.springframework.data.mongodb.core.query.Query configQuery = query(where("name").is("template-organization"));

        final Config config = mongoTemplate.findOne(
                configQuery,
                Config.class
        );

        if (config == null) {
            // No template organization configured. Nothing to migrate.
            return;
        }

        final String organizationId = config.getConfig().getAsString("organizationId");

        final org.springframework.data.mongodb.core.query.Query query = query(where(FieldName.ORGANIZATION_ID).is(organizationId));
        query.fields().include("_id");

        // Get IDs of applications in the template org.
        final List<String> applicationIds = mongoTemplate
                .find(query, Application.class)
                .stream()
                .map(BaseDomain::getId)
                .collect(Collectors.toList());

        // Get IDs of actions in the template org.
        final List<String> actionIds = mongoTemplate
                .find(query, Action.class)
                .stream()
                .map(BaseDomain::getId)
                .collect(Collectors.toList());

        // Get pages that are not in applications in the template org, and have template org's action IDs in their
        // layoutOnload lists.
        final Criteria incorrectActionIdCriteria = new Criteria().orOperator(
                where("layouts.layoutOnLoadActions").elemMatch(new Criteria().elemMatch(where("_id").in(actionIds))),
                where("layouts.publishedLayoutOnLoadActions").elemMatch(new Criteria().elemMatch(where("_id").in(actionIds)))
        );
        final List<Page> pagesToFix = mongoTemplate.find(
                query(where(FieldName.APPLICATION_ID).not().in(applicationIds))
                        .addCriteria(incorrectActionIdCriteria),
                Page.class
        );


        for (Page page : pagesToFix) {
            for (Layout layout : page.getLayouts()) {
                final ArrayList<Set<DslActionDTO>> layoutOnLoadActions = new ArrayList<>();
                if (layout.getLayoutOnLoadActions() != null) {
                    layoutOnLoadActions.addAll(layout.getLayoutOnLoadActions());
                }
                if (layout.getPublishedLayoutOnLoadActions() != null) {
                    layoutOnLoadActions.addAll(layout.getPublishedLayoutOnLoadActions());
                }
                for (Set<DslActionDTO> actionSet : layoutOnLoadActions) {
                    for (DslActionDTO actionDTO : actionSet) {
                        final String actionName = actionDTO.getName();
                        final Action action = mongoTemplate.findOne(
                                query(where(FieldName.PAGE_ID).is(page.getId()))
                                        .addCriteria(where(FieldName.NAME).is(actionName)),
                                Action.class
                        );
                        if (action != null) {
                            // Update the erroneous action id (template action id) to the cloned action id
                            actionDTO.setId(action.getId());
                        }
                    }
                }
            }

            mongoTemplate.save(page);
        }

        final long unfixablePagesCount = mongoTemplate.count(
                query(where(FieldName.APPLICATION_ID).not().in(applicationIds))
                        .addCriteria(where("layouts.layoutOnLoadActions").elemMatch(new Criteria().elemMatch(where("_id").in(actionIds)))),
                Page.class
        );

        if (unfixablePagesCount > 0) {
            log.info("Not all pages' onLoad actions could be fixed. Some old applications might not auto-run actions.");

        }
    }

    @ChangeSet(order = "025", id = "generate-unique-id-for-instance", author = "")
    public void generateUniqueIdForInstance(MongockTemplate mongoTemplate) {
        mongoTemplate.insert(new Config(
                new JSONObject(Map.of("value", new ObjectId().toHexString())),
                "instance-id"
        ));
    }

    @ChangeSet(order = "026", id = "fix-password-reset-token-expiration", author = "")
    public void fixTokenExpiration(MongockTemplate mongoTemplate) {
        dropIndexIfExists(mongoTemplate, PasswordResetToken.class, FieldName.CREATED_AT);
        dropIndexIfExists(mongoTemplate, PasswordResetToken.class, FieldName.EMAIL);

        ensureIndexes(mongoTemplate, PasswordResetToken.class,
                makeIndex(FieldName.CREATED_AT)
                        .expire(2, TimeUnit.DAYS),
                makeIndex(FieldName.EMAIL).unique()
        );
    }

    @ChangeSet(order = "027", id = "add-elastic-search-plugin", author = "")
    public void addElasticSearchPlugin(MongockTemplate mongoTemplate) {
        Plugin plugin1 = new Plugin();
        plugin1.setName("ElasticSearch");
        plugin1.setType(PluginType.DB);
        plugin1.setPackageName("elasticsearch-plugin");
        plugin1.setUiComponent("DbEditorForm");
        plugin1.setResponseType(Plugin.ResponseType.JSON);
        plugin1.setIconLocation("https://s3.us-east-2.amazonaws.com/assets.appsmith.com/ElasticSearch.jpg");
        plugin1.setDocumentationLink("https://docs.appsmith.com/v/v1.2.1/datasource-reference/querying-elasticsearch");
        plugin1.setDefaultInstall(true);
        try {
            mongoTemplate.insert(plugin1);
        } catch (DuplicateKeyException e) {
            log.warn(plugin1.getPackageName() + " already present in database.");
        }

        installPluginToAllOrganizations(mongoTemplate, plugin1.getId());
    }

    @ChangeSet(order = "028", id = "add-dynamo-plugin", author = "")
    public void addDynamoPlugin(MongockTemplate mongoTemplate) {
        Plugin plugin1 = new Plugin();
        plugin1.setName("DynamoDB");
        plugin1.setType(PluginType.DB);
        plugin1.setPackageName("dynamo-plugin");
        plugin1.setUiComponent("DbEditorForm");
        plugin1.setResponseType(Plugin.ResponseType.JSON);
        plugin1.setIconLocation("https://s3.us-east-2.amazonaws.com/assets.appsmith.com/DynamoDB.png");
        plugin1.setDocumentationLink("https://docs.appsmith.com/v/v1.2.1/datasource-reference/querying-dynamodb");
        plugin1.setDefaultInstall(true);
        try {
            mongoTemplate.insert(plugin1);
        } catch (DuplicateKeyException e) {
            log.warn(plugin1.getPackageName() + " already present in database.");
        }

        installPluginToAllOrganizations(mongoTemplate, plugin1.getId());
    }

    @ChangeSet(order = "029", id = "use-png-logos", author = "")
    public void usePngLogos(MongockTemplate mongoTemplate) {
        mongoTemplate.updateFirst(
                query(where(fieldName(QPlugin.plugin.packageName)).is("elasticsearch-plugin")),
                update(fieldName(QPlugin.plugin.iconLocation),
                        "https://s3.us-east-2.amazonaws.com/assets.appsmith.com/ElasticSearch.png"),
                Plugin.class
        );
    }

    @ChangeSet(order = "030", id = "add-redis-plugin", author = "")
    public void addRedisPlugin(MongockTemplate mongoTemplate) {
        Plugin plugin1 = new Plugin();
        plugin1.setName("Redis");
        plugin1.setType(PluginType.DB);
        plugin1.setPackageName("redis-plugin");
        plugin1.setUiComponent("DbEditorForm");
        plugin1.setResponseType(Plugin.ResponseType.TABLE);
        plugin1.setIconLocation("https://s3.us-east-2.amazonaws.com/assets.appsmith.com/redis.jpg");
        plugin1.setDocumentationLink("https://docs.appsmith.com/v/v1.2.1/datasource-reference/querying-redis");
        plugin1.setDefaultInstall(true);
        try {
            mongoTemplate.insert(plugin1);
        } catch (DuplicateKeyException e) {
            log.warn(plugin1.getPackageName() + " already present in database.");
        }

        installPluginToAllOrganizations(mongoTemplate, plugin1.getId());
    }

    @ChangeSet(order = "031", id = "add-msSql-plugin", author = "")
    public void addMsSqlPlugin(MongockTemplate mongoTemplate) {
        Plugin plugin1 = new Plugin();
        plugin1.setName("MsSQL");
        plugin1.setType(PluginType.DB);
        plugin1.setPackageName("mssql-plugin");
        plugin1.setUiComponent("DbEditorForm");
        plugin1.setResponseType(Plugin.ResponseType.TABLE);
        plugin1.setIconLocation("https://s3.us-east-2.amazonaws.com/assets.appsmith.com/MsSQL.jpg");
        plugin1.setDocumentationLink("https://docs.appsmith.com/v/v1.2.1/datasource-reference/querying-mssql");
        plugin1.setDefaultInstall(true);
        try {
            mongoTemplate.insert(plugin1);
        } catch (DuplicateKeyException e) {
            log.warn(plugin1.getPackageName() + " already present in database.");
        }

        installPluginToAllOrganizations(mongoTemplate, plugin1.getId());
    }

    @ChangeSet(order = "037", id = "createNewPageIndexAfterDroppingNewPage", author = "")
    public void addNewPageIndexAfterDroppingNewPage(MongockTemplate mongoTemplate) {
        Index createdAtIndex = makeIndex("createdAt");

        // Drop existing NewPage class
        mongoTemplate.dropCollection(NewPage.class);

        // Now add an index
        ensureIndexes(mongoTemplate, NewPage.class,
                createdAtIndex
        );
    }

    @ChangeSet(order = "038", id = "createNewActionIndexAfterDroppingNewAction", author = "")
    public void addNewActionIndexAfterDroppingNewAction(MongockTemplate mongoTemplate) {
        Index createdAtIndex = makeIndex("createdAt");

        // Drop existing NewAction class
        mongoTemplate.dropCollection(NewAction.class);

        // Now add an index
        ensureIndexes(mongoTemplate, NewAction.class,
                createdAtIndex
        );
    }

    @ChangeSet(order = "039", id = "migrate-page-and-actions", author = "")
    public void migratePage(MongockTemplate mongoTemplate) {
        final List<Page> pages = mongoTemplate.find(
                query(where("deletedAt").is(null)),
                Page.class
        );

        List<NewPage> toBeInsertedPages = new ArrayList<>();

        for (Page oldPage : pages) {
            PageDTO unpublishedPage = new PageDTO();
            PageDTO publishedPage = new PageDTO();

            unpublishedPage.setName(oldPage.getName());
            unpublishedPage.setLayouts(oldPage.getLayouts());

            publishedPage.setName(oldPage.getName());
            publishedPage.setLayouts(oldPage.getLayouts());

            if (oldPage.getLayouts() != null && !oldPage.getLayouts().isEmpty()) {
                unpublishedPage.setLayouts(new ArrayList<>());
                publishedPage.setLayouts(new ArrayList<>());
                for (Layout layout : oldPage.getLayouts()) {
                    Layout unpublishedLayout = new Layout();
                    copyNewFieldValuesIntoOldObject(layout, unpublishedLayout);
                    unpublishedLayout.setPublishedDsl(null);
                    unpublishedLayout.setPublishedLayoutOnLoadActions(null);
                    unpublishedPage.getLayouts().add(unpublishedLayout);

                    Layout publishedLayout = new Layout();
                    publishedLayout.setViewMode(true);
                    copyNewFieldValuesIntoOldObject(layout, publishedLayout);
                    publishedLayout.setDsl(publishedLayout.getDsl());
                    publishedLayout.setLayoutOnLoadActions(publishedLayout.getPublishedLayoutOnLoadActions());
                    publishedLayout.setPublishedDsl(null);
                    publishedLayout.setPublishedLayoutOnLoadActions(null);
                    publishedPage.getLayouts().add(publishedLayout);
                }
            }

            NewPage newPage = new NewPage();
            newPage.setApplicationId(oldPage.getApplicationId());
            newPage.setPublishedPage(publishedPage);
            newPage.setUnpublishedPage(unpublishedPage);

            //Set the base domain fields
            newPage.setId(oldPage.getId());
            newPage.setCreatedAt(oldPage.getCreatedAt());
            newPage.setUpdatedAt(oldPage.getUpdatedAt());
            newPage.setPolicies(oldPage.getPolicies());

            toBeInsertedPages.add(newPage);
        }
        mongoTemplate.insertAll(toBeInsertedPages);

        // Migrate Actions now

        Map<String, String> pageIdApplicationIdMap = pages
                .stream()
                .collect(Collectors.toMap(Page::getId, Page::getApplicationId));

        final List<Action> actions = mongoTemplate.find(
                query(where("deletedAt").is(null)),
                Action.class
        );

        List<NewAction> toBeInsertedActions = new ArrayList<>();

        for (Action oldAction : actions) {
            ActionDTO unpublishedAction = copyActionToDTO(oldAction);
            ActionDTO publishedAction = copyActionToDTO(oldAction);

            NewAction newAction = new NewAction();

            newAction.setOrganizationId(oldAction.getOrganizationId());
            newAction.setPluginType(oldAction.getPluginType());
            newAction.setPluginId(oldAction.getPluginId());
            newAction.setTemplateId(oldAction.getTemplateId());
            newAction.setProviderId(oldAction.getProviderId());
            newAction.setDocumentation(oldAction.getDocumentation());

            // During the first migration, both the published and the unpublished action dtos would match the existing
            // action because before this action only had a single instance (whether in edit/view mode)
            newAction.setUnpublishedAction(unpublishedAction);
            newAction.setPublishedAction(publishedAction);

            // Now set the application id for this action
            String applicationId = pageIdApplicationIdMap.get(oldAction.getPageId());

            if (applicationId != null) {
                newAction.setApplicationId(applicationId);
            }

            // Set the pluginId for the action
            if (oldAction.getDatasource() != null) {
                newAction.setPluginId(oldAction.getDatasource().getPluginId());
            }

            //Set the base domain fields
            newAction.setId(oldAction.getId());
            newAction.setCreatedAt(oldAction.getCreatedAt());
            newAction.setUpdatedAt(oldAction.getUpdatedAt());
            newAction.setPolicies(oldAction.getPolicies());

            toBeInsertedActions.add(newAction);
        }

        mongoTemplate.insertAll(toBeInsertedActions);

    }

    @ChangeSet(order = "040", id = "new-page-new-action-add-indexes", author = "")
    public void addNewPageAndNewActionNewIndexes(MongockTemplate mongoTemplate) {

        dropIndexIfExists(mongoTemplate, NewAction.class, "createdAt");

        ensureIndexes(mongoTemplate, NewAction.class,
                makeIndex("applicationId", "deleted", "createdAt")
                        .named("applicationId_deleted_createdAt_compound_index")
        );

        dropIndexIfExists(mongoTemplate, NewPage.class, "createdAt");

        ensureIndexes(mongoTemplate, NewPage.class,
                makeIndex("applicationId", "deleted")
                        .named("applicationId_deleted_compound_index")
        );

    }

    @ChangeSet(order = "041", id = "new-action-add-index-pageId", author = "")
    public void addNewActionIndexForPageId(MongockTemplate mongoTemplate) {

        dropIndexIfExists(mongoTemplate, NewAction.class, "applicationId_deleted_createdAt_compound_index");

        ensureIndexes(mongoTemplate, NewAction.class,
                makeIndex("applicationId", "deleted", "unpublishedAction.pageId")
                        .named("applicationId_deleted_unpublishedPageId_compound_index")
        );
    }

    @ChangeSet(order = "042", id = "update-action-index-to-single-multiple-indices", author = "")
    public void updateActionIndexToSingleMultipleIndices(MongockTemplate mongoTemplate) {

        dropIndexIfExists(mongoTemplate, NewAction.class, "applicationId_deleted_unpublishedPageId_compound_index");

        ensureIndexes(mongoTemplate, NewAction.class,
                makeIndex("applicationId")
                        .named("applicationId")
        );

        ensureIndexes(mongoTemplate, NewAction.class,
                makeIndex("unpublishedAction.pageId")
                        .named("unpublishedAction_pageId")
        );

        ensureIndexes(mongoTemplate, NewAction.class,
                makeIndex("deleted")
                        .named("deleted")
        );
    }

    @ChangeSet(order = "043", id = "add-firestore-plugin", author = "")
    public void addFirestorePlugin(MongockTemplate mongoTemplate) {
        Plugin plugin = new Plugin();
        plugin.setName("Firestore");
        plugin.setType(PluginType.DB);
        plugin.setPackageName("firestore-plugin");
        plugin.setUiComponent("DbEditorForm");
        plugin.setResponseType(Plugin.ResponseType.JSON);
        plugin.setIconLocation("https://s3.us-east-2.amazonaws.com/assets.appsmith.com/Firestore.png");
        plugin.setDocumentationLink("https://docs.appsmith.com/v/v1.2.1/datasource-reference/querying-firestore");
        plugin.setDefaultInstall(true);
        try {
            mongoTemplate.insert(plugin);
        } catch (DuplicateKeyException e) {
            log.warn(plugin.getPackageName() + " already present in database.");
        }

        installPluginToAllOrganizations(mongoTemplate, plugin.getId());
    }

    @ChangeSet(order = "044", id = "ensure-app-icons-and-colors", author = "")
    public void ensureAppIconsAndColors(MongockTemplate mongoTemplate) {
        final String iconFieldName = fieldName(QApplication.application.icon);
        final String colorFieldName = fieldName(QApplication.application.color);

        final org.springframework.data.mongodb.core.query.Query query = query(new Criteria().orOperator(
                where(iconFieldName).exists(false),
                where(colorFieldName).exists(false)
        ));

        // We are only getting the icon and color fields, rest will be null (or default values) in the
        // resulting Application objects.
        query.fields().include("_id").include(iconFieldName).include(colorFieldName);

        final List<String> iconPool = List.of(
                "bag",
                "product",
                "book",
                "camera",
                "file",
                "chat",
                "calender",
                "flight",
                "frame",
                "globe",
                "shopper",
                "heart",
                "alien",
                "bar-graph",
                "basketball",
                "bicycle",
                "bird",
                "bitcoin",
                "burger",
                "bus",
                "call",
                "car",
                "card",
                "cat",
                "chinese-remnibi",
                "cloud",
                "coding",
                "couples",
                "cricket",
                "diamond",
                "dog",
                "dollar",
                "earth",
                "email",
                "euros",
                "family",
                "flag",
                "football",
                "hat",
                "headphones",
                "hospital",
                "joystick",
                "laptop",
                "line-chart",
                "location",
                "lotus",
                "love",
                "medal",
                "medical",
                "money",
                "moon",
                "mug",
                "music",
                "pants",
                "pie-chart",
                "pizza",
                "plant",
                "rainy-weather",
                "restaurant",
                "rocket",
                "rose",
                "rupee",
                "saturn",
                "server",
                "shake-hands",
                "shirt",
                "shop",
                "single-person",
                "smartphone",
                "snowy-weather",
                "stars",
                "steam-bowl",
                "sunflower",
                "system",
                "team",
                "tree",
                "uk-pounds",
                "website",
                "yen",
                "airplane"
        );
        final List<String> colorPool = List.of(
                "#6C4CF1",
                "#4F70FD",
                "#F56AF4",
                "#B94CF1",
                "#54A9FB",
                "#5ED3DA",
                "#5EDA82",
                "#A8D76C",
                "#E9C951",
                "#FE9F44",
                "#ED86A1",
                "#EA6179",
                "#C03C3C",
                "#BC6DB2",
                "#6C9DD0",
                "#6CD0CF"
        );

        final Random iconRands = new Random();
        final Random colorRands = new Random();

        final int iconPoolSize = iconPool.size();
        final int colorPoolSize = colorPool.size();

        for (final Application app : mongoTemplate.find(query, Application.class)) {
            if (app.getIcon() == null) {
                mongoTemplate.updateFirst(
                        query(where(fieldName(QApplication.application.id)).is(app.getId())),
                        update(iconFieldName, iconPool.get(iconRands.nextInt(iconPoolSize))),
                        Application.class
                );
            }

            if (app.getColor() == null) {
                mongoTemplate.updateFirst(
                        query(where(fieldName(QApplication.application.id)).is(app.getId())),
                        update(colorFieldName, colorPool.get(colorRands.nextInt(colorPoolSize))),
                        Application.class
                );
            }
        }
    }

    @ChangeSet(order = "045", id = "update-authentication-type", author = "")
    public void updateAuthenticationTypes(MongockTemplate mongoTemplate) {
        mongoTemplate.execute("datasource", new CollectionCallback<String>() {
            @Override
            public String doInCollection(MongoCollection<Document> collection) throws MongoException, DataAccessException {
                // Only update _class for authentication objects that exist
                MongoCursor cursor = collection.find(Filters.exists("datasourceConfiguration.authentication")).cursor();
                while (cursor.hasNext()) {
                    Document current = (Document) cursor.next();
                    Document old = Document.parse(current.toJson());

                    // Extra precaution to only update _class for authentication objects that don't already have this
                    // Is this condition required? What does production datasource look like?
                    ((Document) ((Document) current.get("datasourceConfiguration"))
                            .get("authentication"))
                            .putIfAbsent("_class", "dbAuth");

                    // Replace old document with the new one
                    collection.findOneAndReplace(old, current);
                }
                return null;
            }
        });

        mongoTemplate.execute("newAction", new CollectionCallback<String>() {
            @Override
            public String doInCollection(MongoCollection<Document> collection) throws MongoException, DataAccessException {
                // Only update _class for authentication objects that exist
                MongoCursor cursor = collection
                        .find(Filters.and(
                                Filters.exists("unpublishedAction.datasource"),
                                Filters.exists("unpublishedAction.datasource.datasourceConfiguration"),
                                Filters.exists("unpublishedAction.datasource.datasourceConfiguration.authentication"))).cursor();
                while (cursor.hasNext()) {
                    Document current = (Document) cursor.next();
                    Document old = Document.parse(current.toJson());

                    // Extra precaution to only update _class for authentication objects that don't already have this
                    // Is this condition required? What does production datasource look like?
                    ((Document) ((Document) ((Document) ((Document) current.get("unpublishedAction"))
                            .get("datasource"))
                            .get("datasourceConfiguration"))
                            .get("authentication"))
                            .putIfAbsent("_class", "dbAuth");

                    // Replace old document with the new one
                    collection.findOneAndReplace(old, current);
                }
                return null;
            }
        });

        mongoTemplate.execute("newAction", new CollectionCallback<String>() {
            @Override
            public String doInCollection(MongoCollection<Document> collection) throws MongoException, DataAccessException {
                // Only update _class for authentication objects that exist
                MongoCursor cursor = collection
                        .find(Filters.and(
                                Filters.exists("publishedAction.datasource"),
                                Filters.exists("publishedAction.datasource.datasourceConfiguration"),
                                Filters.exists("publishedAction.datasource.datasourceConfiguration.authentication"))).cursor();
                while (cursor.hasNext()) {
                    Document current = (Document) cursor.next();
                    Document old = Document.parse(current.toJson());

                    // Extra precaution to only update _class for authentication objects that don't already have this
                    // Is this condition required? What does production datasource look like?
                    ((Document) ((Document) ((Document) ((Document) current.get("publishedAction"))
                            .get("datasource"))
                            .get("datasourceConfiguration"))
                            .get("authentication"))
                            .putIfAbsent("_class", "dbAuth");

                    // Replace old document with the new one
                    collection.findOneAndReplace(old, current);
                }
                return null;
            }
        });
    }

    @ChangeSet(order = "047", id = "add-isSendSessionEnabled-key-for-datasources", author = "")
    public void addIsSendSessionEnabledPropertyInDatasources(MongockTemplate mongoTemplate) {

        String keyName = "isSendSessionEnabled";

        Plugin restApiPlugin = mongoTemplate.findOne(
                query(where("packageName").is("restapi-plugin")),
                Plugin.class
        );

        final org.springframework.data.mongodb.core.query.Query query = query(where("pluginId").is(restApiPlugin.getId()));

        for (Datasource datasource : mongoTemplate.find(query, Datasource.class)) {
            // Find if the datasource should be updated with the new key
            Boolean updateRequired = false;
            if (datasource.getDatasourceConfiguration() == null) {
                updateRequired = true;
                datasource.setDatasourceConfiguration(new DatasourceConfiguration());
                datasource.getDatasourceConfiguration().setProperties(new ArrayList<>());
            } else if (datasource.getDatasourceConfiguration().getProperties() == null) {
                updateRequired = true;
                datasource.getDatasourceConfiguration().setProperties(new ArrayList<>());
            } else {
                List<Property> properties = datasource.getDatasourceConfiguration().getProperties();
                Optional<Property> isSendSessionEnabledOptional = properties
                        .stream()
                        .filter(property -> keyName.equals(property.getKey()))
                        .findFirst();

                if (!isSendSessionEnabledOptional.isPresent()) {
                    updateRequired = true;
                }
            }

            // If the property does not exist, add the same.
            if (updateRequired) {
                Property newProperty = new Property();
                newProperty.setKey(keyName);
                newProperty.setValue("N");
                datasource.getDatasourceConfiguration().getProperties().add(newProperty);
                mongoTemplate.save(datasource);
            }

        }
    }

    @ChangeSet(order = "048", id = "add-redshift-plugin", author = "")
    public void addRedshiftPlugin(MongockTemplate mongoTemplate) {
        Plugin plugin = new Plugin();
        plugin.setName("Redshift");
        plugin.setType(PluginType.DB);
        plugin.setPackageName("redshift-plugin");
        plugin.setUiComponent("DbEditorForm");
        plugin.setResponseType(Plugin.ResponseType.TABLE);
        plugin.setIconLocation("https://s3.us-east-2.amazonaws.com/assets.appsmith.com/Redshift.png");
        plugin.setDocumentationLink("https://docs.appsmith.com/v/v1.2.1/datasource-reference/querying-redshift");
        plugin.setDefaultInstall(true);
        try {
            mongoTemplate.insert(plugin);
        } catch (DuplicateKeyException e) {
            log.warn(plugin.getPackageName() + " already present in database.");
        }

        installPluginToAllOrganizations(mongoTemplate, plugin.getId());
    }

    @ChangeSet(order = "049", id = "clear-userdata-collection", author = "")
    public void clearUserDataCollection(MongockTemplate mongoTemplate) {
        mongoTemplate.dropCollection(UserData.class);
    }

    @ChangeSet(order = "050", id = "update-database-documentation-links-v1-2-1", author = "")
    public void updateDatabaseDocumentationLinks_v1_2_1(MongockTemplate mongoTemplate) {
        for (Plugin plugin : mongoTemplate.findAll(Plugin.class)) {
            switch (plugin.getPackageName()) {
                case "postgres-plugin":
                    plugin.setDocumentationLink("https://docs.appsmith.com/v/v1.2.1/datasource-reference/querying-postgres");
                    break;
                case "mongo-plugin":
                    plugin.setDocumentationLink("https://docs.appsmith.com/v/v1.2.1/datasource-reference/querying-mongodb");
                    break;
                case "elasticsearch-plugin":
                    plugin.setDocumentationLink("https://docs.appsmith.com/v/v1.2.1/datasource-reference/querying-elasticsearch");
                    break;
                case "dynamo-plugin":
                    plugin.setDocumentationLink("https://docs.appsmith.com/v/v1.2.1/datasource-reference/querying-dynamodb");
                    break;
                case "redis-plugin":
                    plugin.setDocumentationLink("https://docs.appsmith.com/v/v1.2.1/datasource-reference/querying-redis");
                    break;
                case "mssql-plugin":
                    plugin.setDocumentationLink("https://docs.appsmith.com/v/v1.2.1/datasource-reference/querying-mssql");
                    break;
                case "firestore-plugin":
                    plugin.setDocumentationLink("https://docs.appsmith.com/v/v1.2.1/datasource-reference/querying-firestore");
                    break;
                case "redshift-plugin":
                    plugin.setDocumentationLink("https://docs.appsmith.com/v/v1.2.1/datasource-reference/querying-redshift");
                    break;
                case "mysql-plugin":
                    plugin.setDocumentationLink("https://docs.appsmith.com/v/v1.2.1/datasource-reference/querying-mysql");
                    break;
                default:
                    continue;
            }

            mongoTemplate.save(plugin);
        }
    }

    @ChangeSet(order = "051", id = "add-amazons3-plugin", author = "")
    public void addAmazonS3Plugin(MongockTemplate mongoTemplate) {
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

        installPluginToAllOrganizations(mongoTemplate, plugin.getId());
    }

    @ChangeSet(order = "052", id = "add-app-viewer-invite-policy", author = "")
    public void addAppViewerInvitePolicy(MongockTemplate mongoTemplate) {
        final List<Organization> organizations = mongoTemplate.find(
                query(new Criteria().andOperator(
                        where(fieldName(QOrganization.organization.userRoles) + ".role").is(AppsmithRole.ORGANIZATION_VIEWER.name())
                )),
                Organization.class
        );

        for (final Organization org : organizations) {
            final Set<String> viewers = org.getUserRoles().stream()
                    .filter(role -> AppsmithRole.ORGANIZATION_VIEWER == role.getRole())
                    .map(UserRole::getUsername)
                    .collect(Collectors.toSet());
            mongoTemplate.updateFirst(
                    query(new Criteria().andOperator(
                            where(fieldName(QOrganization.organization.id)).is(org.getId()),
                            where(fieldName(QOrganization.organization.policies) + ".permission").is(ORGANIZATION_INVITE_USERS.getValue())
                    )),
                    new Update().addToSet("policies.$.users").each(viewers.toArray()),
                    Organization.class
            );
        }

    }

    @ChangeSet(order = "053", id = "update-plugin-datasource-form-components", author = "")
    public void updatePluginDatasourceFormComponents(MongockTemplate mongoTemplate) {
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

    @ChangeSet(order = "054", id = "update-database-encode-params-toggle", author = "")
    public void updateEncodeParamsToggle(MongockTemplate mongoTemplate) {

        for (NewAction action : mongoTemplate.findAll(NewAction.class)) {
            if (action.getPluginType() != null && action.getPluginType().equals("API")) {
                if (action.getUnpublishedAction() != null
                        && action.getUnpublishedAction().getActionConfiguration() != null) {
                    action.getUnpublishedAction().getActionConfiguration().setEncodeParamsToggle(true);
                }

                if (action.getPublishedAction() != null
                        && action.getPublishedAction().getActionConfiguration() != null) {
                    action.getPublishedAction().getActionConfiguration().setEncodeParamsToggle(true);
                }
                mongoTemplate.save(action);
            }
        }
    }

    @ChangeSet(order = "055", id = "update-postgres-plugin-preparedStatement-config", author = "")
    public void updatePostgresActionsSetPreparedStatementConfiguration(MongockTemplate mongoTemplate) {

        List<Plugin> plugins = mongoTemplate.find(
                query(new Criteria().andOperator(
                        where(fieldName(QPlugin.plugin.packageName)).is("postgres-plugin")
                )),
                Plugin.class);

        if (plugins.size() < 1) {
            return;
        }

        Plugin postgresPlugin = plugins.get(0);

        // Fetch all the actions built on top of a postgres database
        List<NewAction> postgresActions = mongoTemplate.find(
                query(new Criteria().andOperator(
                        where(fieldName(QNewAction.newAction.pluginId)).is(postgresPlugin.getId())
                )),
                NewAction.class
        );

        for (NewAction action : postgresActions) {
            List<Property> pluginSpecifiedTemplates = new ArrayList<>();
            pluginSpecifiedTemplates.add(new Property("preparedStatement", "false"));

            // We have found an action of postgres plugin type
            if (action.getUnpublishedAction().getActionConfiguration() != null) {
                action.getUnpublishedAction().getActionConfiguration().setPluginSpecifiedTemplates(pluginSpecifiedTemplates);
            }

            if (action.getPublishedAction() != null && action.getPublishedAction().getActionConfiguration() != null) {
                action.getPublishedAction().getActionConfiguration().setPluginSpecifiedTemplates(pluginSpecifiedTemplates);
            }

            mongoTemplate.save(action);
        }
    }

    @ChangeSet(order = "056", id = "fix-dynamicBindingPathListForActions", author = "")
    public void fixDynamicBindingPathListForExistingActions(MongockTemplate mongoTemplate) {

        ObjectMapper objectMapper = new ObjectMapper();

        for (NewAction action : mongoTemplate.findAll(NewAction.class)) {

            // We have found an action with dynamic binding path list set by the client.
            List<Property> dynamicBindingPaths = action.getUnpublishedAction().getDynamicBindingPathList();

            // Only investigate actions which have atleast one dynamic binding path list
            if (action.getUnpublishedAction().getActionConfiguration() != null && !isNullOrEmpty(dynamicBindingPaths)) {

                List<String> dynamicBindingPathNames = dynamicBindingPaths
                        .stream()
                        .map(property -> property.getKey())
                        .collect(Collectors.toList());

                // Initialize the final updated binding path list with the existing path names.
                List<String> finalDynamicBindingPathList = new ArrayList<>();
                finalDynamicBindingPathList.addAll(dynamicBindingPathNames);

                Set<String> pathsToRemove = getInvalidDynamicBindingPathsInAction(objectMapper, action, dynamicBindingPathNames);

                Boolean actionEdited = pathsToRemove.size() > 0 ? TRUE : FALSE;

                // Only update the action if required
                if (actionEdited) {
                    // We have walked all the dynamic binding paths which either dont exist or they exist but don't contain any mustache bindings
                    for (String path : dynamicBindingPathNames) {
                        if (pathsToRemove.contains(path)) {
                            finalDynamicBindingPathList.remove(path);
                        }
                    }

                    List<Property> updatedDynamicBindingPathList = finalDynamicBindingPathList
                            .stream()
                            .map(path -> {
                                Property property = new Property();
                                property.setKey(path);
                                return property;
                            })
                            .collect(Collectors.toList());

                    action.getUnpublishedAction().setDynamicBindingPathList(updatedDynamicBindingPathList);
                    mongoTemplate.save(action);
                }
            }

        }
    }

    private Set<String> getInvalidDynamicBindingPathsInAction(ObjectMapper mapper, NewAction action, List<String> dynamicBindingPathNames) {
        Set<String> pathsToRemove = new HashSet<>();
        for (String path : dynamicBindingPathNames) {

            if (path != null) {

                String[] fields = path.split("[].\\[]");

                // Convert actionConfiguration into JSON Object and then walk till we reach the path specified.
                Map<String, Object> actionConfigurationMap = mapper.convertValue(action.getUnpublishedAction().getActionConfiguration(), Map.class);
                Object parent = new JSONObject(actionConfigurationMap);
                Iterator<String> fieldsIterator = Arrays.stream(fields).filter(fieldToken -> !fieldToken.isBlank()).iterator();
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
                    Set<String> mustacheKeysFromFields = MustacheHelper.extractMustacheKeysFromFields(parent);

                    // We found the path. But if the path does not have any mustache bindings, remove it from the path list
                    if (mustacheKeysFromFields.isEmpty()) {
                        pathsToRemove.add(path);
                    }
                }
            }

        }
        return pathsToRemove;
    }

    @ChangeSet(order = "057", id = "update-database-action-configuration-timeout", author = "")
    public void updateActionConfigurationTimeout(MongockTemplate mongoTemplate) {

        for (NewAction action : mongoTemplate.findAll(NewAction.class)) {
            boolean updateTimeout = false;

            if (action.getUnpublishedAction() != null
                    && action.getUnpublishedAction().getActionConfiguration() != null
                    && action.getUnpublishedAction().getActionConfiguration().getTimeoutInMillisecond() != null
                    && action.getUnpublishedAction().getActionConfiguration().getTimeoutInMillisecond() > 60000) {
                action.getUnpublishedAction().getActionConfiguration().setTimeoutInMillisecond("60000");
                updateTimeout = true;
            }

            if (action.getPublishedAction() != null
                    && action.getPublishedAction().getActionConfiguration() != null
                    && action.getPublishedAction().getActionConfiguration().getTimeoutInMillisecond() != null
                    && action.getPublishedAction().getActionConfiguration().getTimeoutInMillisecond() > 60000) {
                action.getPublishedAction().getActionConfiguration().setTimeoutInMillisecond("60000");
                updateTimeout = true;
            }

            if (updateTimeout) {
                mongoTemplate.save(action);
            }
        }
    }

    @ChangeSet(order = "058", id = "update-s3-datasource-configuration-and-label", author = "")
    public void updateS3DatasourceConfigurationAndLabel(MongockTemplate mongoTemplate) {
        Plugin s3Plugin = mongoTemplate
                .find(query(where("name").is("Amazon S3")), Plugin.class).get(0);
        s3Plugin.setName("S3");
        mongoTemplate.save(s3Plugin);

        List<Datasource> s3Datasources = mongoTemplate
                .find(query(where("pluginId").is(s3Plugin.getId())), Datasource.class);

        s3Datasources
                .stream()
                .forEach(datasource -> {
                    datasource
                            .getDatasourceConfiguration()
                            .getProperties()
                            .add(new Property("s3Provider", "amazon-s3"));

                    mongoTemplate.save(datasource);
                });
    }

    @ChangeSet(order = "059", id = "change-applayout-type-definition", author = "")
    public void changeAppLayoutTypeDefinition(MongoOperations mongoOperations) {
        // Unset an old version of this field, that is no longer used.
        mongoOperations.updateMulti(
                query(where("appLayout").exists(true)),
                new Update().unset("appLayout"),
                Application.class
        );

        // For the published and unpublished app layouts, migrate the old way of specifying the device width to the new
        // way of doing it. Table of migrations:
        //     Desktop: Old - 1224, New 1160 - 1280
        //     Tablet L: Old - NA, New 960 - 1080
        //     Tablet: Old - 1024, New 650 - 800
        //     Mobile: Old - 720, New 350 - 450
        final Criteria criteria = new Criteria().orOperator(
                where(fieldName(QApplication.application.unpublishedAppLayout)).exists(true),
                where(fieldName(QApplication.application.publishedAppLayout)).exists(true)
        );

        final Query query = query(criteria);
        query.fields()
                .include(fieldName(QApplication.application.unpublishedAppLayout))
                .include(fieldName(QApplication.application.publishedAppLayout));

        List<Application> apps = mongoOperations.find(query, Application.class);

        for (final Application app : apps) {
            final Integer unpublishedWidth = app.getUnpublishedAppLayout() == null ? null : app.getUnpublishedAppLayout().getWidth();
            final Integer publishedWidth = app.getPublishedAppLayout() == null ? null : app.getPublishedAppLayout().getWidth();
            final Update update = new Update().unset("unpublishedAppLayout.width").unset("publishedAppLayout.width");

            if (unpublishedWidth != null) {
                final String typeField = "unpublishedAppLayout.type";
                if (unpublishedWidth == -1) {
                    update.set(typeField, Application.AppLayout.Type.FLUID.name());
                } else {
                    if (unpublishedWidth == 1024) {
                        update.set(typeField, Application.AppLayout.Type.TABLET.name());
                    } else if (unpublishedWidth == 720) {
                        update.set(typeField, Application.AppLayout.Type.MOBILE.name());
                    } else {
                        // Default to Desktop.
                        update.set(typeField, Application.AppLayout.Type.DESKTOP.name());
                    }
                }
            }

            if (publishedWidth != null) {
                final String typeField = "publishedAppLayout.type";
                if (publishedWidth == -1) {
                    update.set(typeField, Application.AppLayout.Type.FLUID.name());
                } else {
                    if (publishedWidth == 1024) {
                        update.set(typeField, Application.AppLayout.Type.TABLET.name());
                    } else if (publishedWidth == 720) {
                        update.set(typeField, Application.AppLayout.Type.MOBILE.name());
                    } else {
                        // Default to Desktop.
                        update.set(typeField, Application.AppLayout.Type.DESKTOP.name());
                    }
                }
            }

            mongoOperations.updateFirst(
                    query(where(fieldName(QApplication.application.id)).is(app.getId())),
                    update,
                    Application.class
            );

        }
    }

    @ChangeSet(order = "060", id = "clear-example-apps", author = "")
    public void clearExampleApps(MongockTemplate mongoTemplate) {
        mongoTemplate.updateFirst(
                query(where(fieldName(QConfig.config1.name)).is("template-organization")),
                update("config.applicationIds", Collections.emptyList()).set("config.organizationId", null),
                Config.class
        );
    }

    @ChangeSet(order = "061", id = "update-mysql-postgres-mongo-ssl-mode", author = "")
    public void updateMysqlPostgresMongoSslMode(MongockTemplate mongoTemplate) {
        Plugin mysqlPlugin = mongoTemplate
                .findOne(query(where("packageName").is("mysql-plugin")), Plugin.class);

        Plugin mongoPlugin = mongoTemplate
                .findOne(query(where("packageName").is("mongo-plugin")), Plugin.class);

        List<Datasource> mysqlAndMongoDatasources = mongoTemplate
                .find(
                        query(new Criteria()
                                .orOperator(
                                        where("pluginId").is(mysqlPlugin.getId()),
                                        where("pluginId").is(mongoPlugin.getId())
                                )
                        ),
                        Datasource.class);

        /*
         * - Set SSL mode to DEFAULT for all mysql and mongodb datasources.
         */
        mysqlAndMongoDatasources
                .stream()
                .forEach(datasource -> {
                    if (datasource.getDatasourceConfiguration() != null) {
                        if (datasource.getDatasourceConfiguration().getConnection() == null) {
                            datasource.getDatasourceConfiguration().setConnection(new Connection());
                        }

                        if (datasource.getDatasourceConfiguration().getConnection().getSsl() == null) {
                            datasource.getDatasourceConfiguration().getConnection().setSsl(new SSLDetails());
                        }

                        datasource.getDatasourceConfiguration().getConnection().getSsl().setAuthType(SSLDetails.AuthType.DEFAULT);
                        mongoTemplate.save(datasource);
                    }
                });

        Plugin postgresPlugin = mongoTemplate
                .findOne(query(where("packageName").is("postgres-plugin")), Plugin.class);

        List<Datasource> postgresDatasources = mongoTemplate
                .find(query(where("pluginId").is(postgresPlugin.getId())), Datasource.class);

        /*
         * - Set SSL mode to DEFAULT only for those postgres datasources where:
         *   - SSL mode config doesn't exist.
         *   - SSL mode config cannot be supported - NO_SSL, VERIFY_CA, VERIFY_FULL
         */
        postgresDatasources
                .stream()
                .forEach(datasource -> {
                    if (datasource.getDatasourceConfiguration() != null) {
                        if (datasource.getDatasourceConfiguration().getConnection() == null) {
                            datasource.getDatasourceConfiguration().setConnection(new Connection());
                        }

                        if (datasource.getDatasourceConfiguration().getConnection().getSsl() == null) {
                            datasource.getDatasourceConfiguration().getConnection().setSsl(new SSLDetails());
                        }

                        SSLDetails.AuthType authType = datasource.getDatasourceConfiguration().getConnection().getSsl().getAuthType();
                        if (authType == null
                                || (!SSLDetails.AuthType.ALLOW.equals(authType)
                                && !SSLDetails.AuthType.PREFER.equals(authType)
                                && !SSLDetails.AuthType.REQUIRE.equals(authType)
                                && !SSLDetails.AuthType.DISABLE.equals(authType))) {
                            datasource.getDatasourceConfiguration().getConnection().getSsl().setAuthType(SSLDetails.AuthType.DEFAULT);
                        }

                        mongoTemplate.save(datasource);
                    }
                });
    }

    @ChangeSet(order = "062", id = "add-commenting-permissions", author = "")
    public void addCommentingPermissions(MongockTemplate mongoTemplate) {
        final List<Application> applications = mongoTemplate.findAll(Application.class);

        for (final Application application : applications) {
            application.getPolicies()
                    .stream()
                    .filter(policy -> AclPermission.READ_APPLICATIONS.getValue().equals(policy.getPermission()))
                    .findFirst()
                    .ifPresent(readAppPolicy -> {
                        final Policy newPolicy = Policy.builder()
                                .permission(AclPermission.COMMENT_ON_APPLICATIONS.getValue())
                                .users(readAppPolicy.getUsers())
                                .groups(readAppPolicy.getGroups())
                                .build();
                        mongoTemplate.updateFirst(
                                query(where(fieldName(QApplication.application.id)).is(application.getId())),
                                new Update().push(fieldName(QApplication.application.policies), newPolicy),
                                Application.class
                        );
                    });
        }
    }

    @ChangeSet(order = "062", id = "add-google-sheets-plugin", author = "")
    public void addGoogleSheetsPlugin(MongockTemplate mongoTemplate) {
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

        installPluginToAllOrganizations(mongoTemplate, plugin.getId());
    }

    @ChangeSet(order = "063", id = "mark-instance-unregistered", author = "")
    public void markInstanceAsUnregistered(MongockTemplate mongoTemplate) {
        mongoTemplate.insert(new Config(
                new JSONObject(Map.of("value", false)),
                Appsmith.APPSMITH_REGISTERED
        ));
    }

    @ChangeSet(order = "065", id = "create-entry-in-sequence-per-organization-for-datasource", author = "")
    public void createEntryInSequencePerOrganizationForDatasource(MongockTemplate mongoTemplate) {

        Map<String, Long> maxDatasourceCount = new HashMap<>();
        mongoTemplate
                .find(query(where("name").regex("^Untitled Datasource \\d+$")), Datasource.class)
                .forEach(datasource -> {
                    long count = 1;
                    String datasourceCnt = datasource.getName().substring("Untitled Datasource ".length()).trim();
                    if (!datasourceCnt.isEmpty()) {
                        count = Long.parseLong(datasourceCnt);
                    }

                    if (maxDatasourceCount.containsKey(datasource.getOrganizationId())
                            && (count < maxDatasourceCount.get(datasource.getOrganizationId()))) {
                        return;
                    }
                    maxDatasourceCount.put(datasource.getOrganizationId(), count);
                });
        maxDatasourceCount.forEach((key, val) -> {
            Sequence sequence = new Sequence();
            sequence.setName("datasource for organization with _id : " + key);
            sequence.setNextNumber(val + 1);
            mongoTemplate.save(sequence);
        });
    }

    @ChangeSet(order = "066", id = "migrate-smartSubstitution-dataType", author = "")
    public void migrateSmartSubstitutionDataTypeBoolean(MongockTemplate mongoTemplate, MongoOperations mongoOperations) {
        Set<String> smartSubTurnedOn = new HashSet<>();
        Set<String> smartSubTurnedOff = new HashSet<>();
        Set<String> noSmartSubConfig = new HashSet<>();

        Set<String> pluginPackages = new HashSet<>();
        pluginPackages.add("mysql-plugin");
        pluginPackages.add("restapi-plugin");
        pluginPackages.add("postgres-plugin");
        pluginPackages.add("mongo-plugin");
        pluginPackages.add("mssql-plugin");

        Set<String> smartSubPlugins = mongoTemplate
                .find(query(where("packageName").in(pluginPackages)), Plugin.class)
                .stream()
                .map(plugin -> plugin.getId())
                .collect(Collectors.toSet());

        List<NewAction> actions = mongoTemplate
                .find(query(where("pluginId").in(smartSubPlugins)), NewAction.class);

        // Find all the action ids where the data migration needs to happen.
        for (NewAction action : actions) {
            ActionDTO unpublishedAction = action.getUnpublishedAction();
            if (unpublishedAction != null) {
                Datasource datasource = unpublishedAction.getDatasource();
                if (datasource != null) {
                    ActionConfiguration actionConfiguration = unpublishedAction.getActionConfiguration();
                    if (actionConfiguration != null) {
                        List<Property> pluginSpecifiedTemplates = actionConfiguration.getPluginSpecifiedTemplates();
                        if (!isNullOrEmpty(pluginSpecifiedTemplates)) {
                            Property smartSubstitutionProperty = pluginSpecifiedTemplates.get(0);
                            if (smartSubstitutionProperty != null) {
                                Object value = smartSubstitutionProperty.getValue();
                                if (value != null) {
                                    if (value instanceof String) {
                                        boolean parsedValue = Boolean.parseBoolean((String) value);
                                        if (TRUE.equals(parsedValue)) {
                                            smartSubTurnedOn.add(action.getId());
                                        } else if (FALSE.equals(parsedValue)) {
                                            smartSubTurnedOff.add(action.getId());
                                        }
                                    }
                                }
                            }
                        } else if (pluginSpecifiedTemplates == null) {
                            // No pluginSpecifiedTemplates array exists. This is possible when an action was created before
                            // the smart substitution feature was available
                            noSmartSubConfig.add(action.getId());
                        }
                    }
                }
            }
        }

        // Migrate actions where smart substitution is turned on
        mongoOperations.updateMulti(
                query(where("_id").in(smartSubTurnedOn)),
                new Update().set("unpublishedAction.actionConfiguration.pluginSpecifiedTemplates.0.value", true),
                NewAction.class
        );

        // Migrate actions where smart substitution is turned off
        mongoOperations.updateMulti(
                query(where("_id").in(smartSubTurnedOff)),
                new Update().set("unpublishedAction.actionConfiguration.pluginSpecifiedTemplates.0.value", false),
                NewAction.class
        );

        Property property = new Property();
        property.setValue(false);
        // Migrate actions where there is no configuration for smart substitution, aka add the array.
        mongoOperations.updateMulti(
                query(where("_id").in(noSmartSubConfig)),
                new Update().addToSet("unpublishedAction.actionConfiguration.pluginSpecifiedTemplates", property),
                NewAction.class
        );
    }

    @ChangeSet(order = "067", id = "update-mongo-import-from-srv-field", author = "")
    public void updateMongoImportFromSrvField(MongockTemplate mongoTemplate) {
        Plugin mongoPlugin = mongoTemplate
                .findOne(query(where("packageName").is("mongo-plugin")), Plugin.class);

        List<Datasource> mongoDatasources = mongoTemplate
                .find(query(where("pluginId").is(mongoPlugin.getId())), Datasource.class);

        mongoDatasources.stream()
                .forEach(datasource -> {
                    datasource.getDatasourceConfiguration().setProperties(List.of(new Property("Use Mongo Connection " +
                            "String URI", "No")));
                    mongoTemplate.save(datasource);
                });
    }

    @ChangeSet(order = "068", id = "delete-mongo-datasource-structures", author = "")
    public void deleteMongoDatasourceStructures(MongockTemplate mongoTemplate, MongoOperations mongoOperations) {

        // Mongo Form requires the query templates to change as well. To ensure this, mongo datasources
        // must re-compute the structure. The following deletes all such structures. Whenever getStructure API call is
        // made for these datasources, the server would re-compute the structure.
        Plugin mongoPlugin = mongoTemplate.findOne(query(where("packageName").is("mongo-plugin")), Plugin.class);

        Query query = query(new Criteria().andOperator(
                where(fieldName(QDatasource.datasource.pluginId)).is(mongoPlugin.getId()),
                where(fieldName(QDatasource.datasource.structure)).exists(true)
        ));

        Update update = new Update().set(fieldName(QDatasource.datasource.structure), null);

        // Delete all the existing mongo datasource structures by setting the key to null.
        mongoOperations.updateMulti(query, update, Datasource.class);
    }


    @ChangeSet(order = "069", id = "set-mongo-actions-type-to-raw", author = "")
    public void setMongoActionInputToRaw(MongockTemplate mongockTemplate) {

        // All the existing mongo actions at this point will only have ever been in the raw format
        // For these actions to be readily available to users, we need to set their input type to raw manually
        // This is required because since the mongo form, the default input type on the UI has been set to FORM
        Plugin mongoPlugin = mongockTemplate.findOne(query(where("packageName").is("mongo-plugin")), Plugin.class);

        // Fetch all the actions built on top of a mongo database, not having any value set for input type
        assert mongoPlugin != null;
        List<NewAction> rawMongoActions = mongockTemplate.find(
                        query(new Criteria().andOperator(
                                where(fieldName(QNewAction.newAction.pluginId)).is(mongoPlugin.getId()))),
                        NewAction.class
                )
                .stream()
                .filter(mongoAction -> {
                    if (mongoAction.getUnpublishedAction() == null || mongoAction.getUnpublishedAction().getActionConfiguration() == null) {
                        return false;
                    }
                    final List<Property> pluginSpecifiedTemplates = mongoAction.getUnpublishedAction().getActionConfiguration().getPluginSpecifiedTemplates();
                    return pluginSpecifiedTemplates != null && pluginSpecifiedTemplates.size() == 1;
                })
                .collect(Collectors.toList());

        for (NewAction action : rawMongoActions) {
            List<Property> pluginSpecifiedTemplates = action.getUnpublishedAction().getActionConfiguration().getPluginSpecifiedTemplates();
            pluginSpecifiedTemplates.add(new Property(null, "RAW"));

            mongockTemplate.save(action);
        }
    }

    /**
     * - Older firestore action form had support for only on where condition, which mapped path, operator and value to
     * three different indexes on the pluginSpecifiedTemplates list.
     * - In the newer form, the three properties are treated as a tuple, and a list of tuples is mapped to only one
     * index in pluginSpecifiedTemplates list.
     * - [... path, operator, value, ...] --> [... [ {"path":path, "operator":operator, "value":value} ] ...]
     */
    @ChangeSet(order = "070", id = "update-firestore-where-conditions-data", author = "")
    public void updateFirestoreWhereConditionsData(MongockTemplate mongoTemplate) {
        Plugin firestorePlugin = mongoTemplate
                .findOne(query(where("packageName").is("firestore-plugin")), Plugin.class);

        Query query = query(new Criteria().andOperator(
                where("pluginId").is(firestorePlugin.getId()),
                new Criteria().orOperator(
                        where("unpublishedAction.actionConfiguration.pluginSpecifiedTemplates.3").exists(true),
                        where("unpublishedAction.actionConfiguration.pluginSpecifiedTemplates.4").exists(true),
                        where("unpublishedAction.actionConfiguration.pluginSpecifiedTemplates.5").exists(true),
                        where("publishedAction.actionConfiguration.pluginSpecifiedTemplates.3").exists(true),
                        where("publishedAction.actionConfiguration.pluginSpecifiedTemplates.4").exists(true),
                        where("publishedAction.actionConfiguration.pluginSpecifiedTemplates.5").exists(true)
                )));

        List<NewAction> firestoreActionQueries = mongoTemplate.find(query, NewAction.class);

        firestoreActionQueries.stream()
                .forEach(action -> {
                    // For unpublished action
                    if (action.getUnpublishedAction() != null
                            && action.getUnpublishedAction().getActionConfiguration() != null
                            && action.getUnpublishedAction().getActionConfiguration().getPluginSpecifiedTemplates() != null
                            && action.getUnpublishedAction().getActionConfiguration().getPluginSpecifiedTemplates().size() > 3) {

                        String path = null;
                        String op = null;
                        String value = null;
                        List<Property> properties = action.getUnpublishedAction().getActionConfiguration().getPluginSpecifiedTemplates();
                        if (properties.size() > 3 && properties.get(3) != null) {
                            path = (String) properties.get(3).getValue();
                        }
                        if (properties.size() > 4 && properties.get(4) != null) {
                            op = (String) properties.get(4).getValue();
                            properties.set(4, null); // Index 4 does not map to any value in the new query format
                        }
                        if (properties.size() > 5 && properties.get(5) != null) {
                            value = (String) properties.get(5).getValue();
                            properties.set(5, null); // Index 5 does not map to any value in the new query format
                        }

                        Map newFormat = new HashMap();
                        newFormat.put("path", path);
                        newFormat.put("operator", op);
                        newFormat.put("value", value);
                        properties.set(3, new Property("whereConditionTuples", List.of(newFormat)));
                    }

                    // For published action
                    if (action.getPublishedAction() != null
                            && action.getPublishedAction().getActionConfiguration() != null
                            && action.getPublishedAction().getActionConfiguration().getPluginSpecifiedTemplates() != null
                            && action.getPublishedAction().getActionConfiguration().getPluginSpecifiedTemplates().size() > 3) {

                        String path = null;
                        String op = null;
                        String value = null;
                        List<Property> properties = action.getPublishedAction().getActionConfiguration().getPluginSpecifiedTemplates();
                        if (properties.size() > 3 && properties.get(3) != null) {
                            path = (String) properties.get(3).getValue();
                        }
                        if (properties.size() > 4 && properties.get(4) != null) {
                            op = (String) properties.get(4).getValue();
                            properties.set(4, null); // Index 4 does not map to any value in the new query format
                        }
                        if (properties.size() > 5 && properties.get(5) != null) {
                            value = (String) properties.get(5).getValue();
                            properties.set(5, null); // Index 5 does not map to any value in the new query format
                        }

                        HashMap newFormat = new HashMap();
                        newFormat.put("path", path);
                        newFormat.put("operator", op);
                        newFormat.put("value", value);
                        properties.set(3, new Property("whereConditionTuples", List.of(newFormat)));
                    }
                });

        /**
         * - Save changes only after all the processing is done so that in case any data manipulation fails, no data
         * write occurs.
         * - Write data back to db only if all data manipulations done above have succeeded.
         */
        firestoreActionQueries.stream()
                .forEach(action -> mongoTemplate.save(action));
    }

    @ChangeSet(order = "071", id = "add-application-export-permissions", author = "")
    public void addApplicationExportPermissions(MongockTemplate mongoTemplate) {
        final List<Organization> organizations = mongoTemplate.find(
                query(where("userRoles").exists(true)),
                Organization.class
        );

        for (final Organization organization : organizations) {
            Set<String> adminUsernames = organization.getUserRoles()
                    .stream()
                    .filter(role -> (role.getRole().equals(AppsmithRole.ORGANIZATION_ADMIN)))
                    .map(role -> role.getUsername())
                    .collect(Collectors.toSet());

            if (adminUsernames.isEmpty()) {
                continue;
            }
            // All the administrators of the organization should be allowed to export applications permission
            Set<String> exportApplicationPermissionUsernames = new HashSet<>();
            exportApplicationPermissionUsernames.addAll(adminUsernames);

            Set<Policy> policies = organization.getPolicies();
            if (policies == null) {
                policies = new HashSet<>();
            }

            Optional<Policy> exportAppOrgLevelOptional = policies.stream()
                    .filter(policy -> policy.getPermission().equals(ORGANIZATION_EXPORT_APPLICATIONS.getValue())).findFirst();

            if (exportAppOrgLevelOptional.isPresent()) {
                Policy exportApplicationPolicy = exportAppOrgLevelOptional.get();
                exportApplicationPolicy.getUsers().addAll(exportApplicationPermissionUsernames);
            } else {
                // this policy doesnt exist. create and add this to the policy set
                Policy inviteUserPolicy = Policy.builder().permission(ORGANIZATION_EXPORT_APPLICATIONS.getValue())
                        .users(exportApplicationPermissionUsernames).build();
                organization.getPolicies().add(inviteUserPolicy);
            }

            mongoTemplate.save(organization);

            // Update the applications with export applications policy for all administrators of the organization
            List<Application> orgApplications = mongoTemplate.find(
                    query(where(fieldName(QApplication.application.organizationId)).is(organization.getId())),
                    Application.class
            );

            for (final Application application : orgApplications) {
                Set<Policy> applicationPolicies = application.getPolicies();
                if (applicationPolicies == null) {
                    applicationPolicies = new HashSet<>();
                }

                Optional<Policy> exportAppOptional = applicationPolicies.stream()
                        .filter(policy -> policy.getPermission().equals(EXPORT_APPLICATIONS.getValue())).findFirst();

                if (exportAppOptional.isPresent()) {
                    Policy exportAppPolicy = exportAppOptional.get();
                    exportAppPolicy.getUsers().addAll(adminUsernames);
                } else {
                    // this policy doesn't exist, create and add this to the policy set
                    Policy newExportAppPolicy = Policy.builder().permission(EXPORT_APPLICATIONS.getValue())
                            .users(adminUsernames).build();
                    application.getPolicies().add(newExportAppPolicy);
                }

                mongoTemplate.save(application);
            }
        }
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

    @ChangeSet(order = "072", id = "add-snowflake-plugin", author = "")
    public void addSnowflakePlugin(MongockTemplate mongoTemplate) {
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

        installPluginToAllOrganizations(mongoTemplate, plugin.getId());
    }

    @ChangeSet(order = "073", id = "mongo-form-merge-update-commands", author = "")
    public void migrateUpdateOneToUpdateManyMongoFormCommand(MongockTemplate mongockTemplate) {

        Plugin mongoPlugin = mongockTemplate.findOne(query(where("packageName").is("mongo-plugin")), Plugin.class);

        // Fetch all the actions built on top of a mongo database with command type update_one or update_many
        assert mongoPlugin != null;
        List<NewAction> updateMongoActions = mongockTemplate.find(
                        query(new Criteria().andOperator(
                                where(fieldName(QNewAction.newAction.pluginId)).is(mongoPlugin.getId()))),
                        NewAction.class
                )
                .stream()
                .filter(mongoAction -> {
                    if (mongoAction.getUnpublishedAction() == null || mongoAction.getUnpublishedAction().getActionConfiguration() == null) {
                        return false;
                    }
                    final List<Property> pluginSpecifiedTemplates = mongoAction.getUnpublishedAction().getActionConfiguration().getPluginSpecifiedTemplates();

                    // Filter out all the actions which are of either of the two update command type
                    if (pluginSpecifiedTemplates != null && pluginSpecifiedTemplates.size() == 21) {
                        Property commandProperty = pluginSpecifiedTemplates.get(2);
                        if (commandProperty != null && commandProperty.getValue() != null) {
                            String command = (String) commandProperty.getValue();
                            if (command.equals("UPDATE_ONE") || command.equals("UPDATE_MANY")) {
                                return true;
                            }
                        }
                    }
                    // Not an action of interest for migration.
                    return false;
                })
                .collect(Collectors.toList());

        for (NewAction action : updateMongoActions) {
            List<Property> pluginSpecifiedTemplates = action.getUnpublishedAction().getActionConfiguration().getPluginSpecifiedTemplates();
            String command = (String) pluginSpecifiedTemplates.get(2).getValue();

            // In case of update one, migrate the query and update configurations.
            if (command.equals("UPDATE_ONE")) {

                String query = "";
                String update = "";
                String collection = "";

                Property queryProperty = pluginSpecifiedTemplates.get(8);
                if (queryProperty != null) {
                    query = (String) queryProperty.getValue();
                }

                Property updateProperty = pluginSpecifiedTemplates.get(10);
                if (updateProperty != null) {
                    update = (String) updateProperty.getValue();
                }

                Property collectionProperty = pluginSpecifiedTemplates.get(19);
                if (collectionProperty != null) {
                    collection = (String) collectionProperty.getValue();
                }

                Map<Integer, Object> configMap = new HashMap<>();
                configMap.put(0, pluginSpecifiedTemplates.get(0).getValue());
                configMap.put(1, "FORM");
                // All update commands have to be migrated to the new update name
                configMap.put(2, "UPDATE");
                configMap.put(19, collection);
                // Query for all the documents in the collection
                configMap.put(11, query);
                configMap.put(12, update);
                configMap.put(21, "SINGLE");

                List<Property> updatedTemplates = generateMongoFormConfigTemplates(configMap);
                action.getUnpublishedAction().getActionConfiguration().setPluginSpecifiedTemplates(updatedTemplates);

            }
        }

        // Now that all the actions have been updated, save all the actions
        for (NewAction action : updateMongoActions) {
            mongockTemplate.save(action);
        }
    }


    @ChangeSet(order = "074", id = "ensure-user-created-and-updated-at-fields", author = "")
    public void ensureUserCreatedAndUpdatedAt(MongockTemplate mongoTemplate) {
        final List<User> missingCreatedAt = mongoTemplate.find(
                query(where("createdAt").exists(false)),
                User.class
        );

        for (User user : missingCreatedAt) {
            user.setCreatedAt(Instant.parse("2019-01-07T00:00:00.00Z"));
            mongoTemplate.save(user);
        }

        final List<User> missingUpdatedAt = mongoTemplate.find(
                query(where("updatedAt").exists(false)),
                User.class
        );

        for (User user : missingUpdatedAt) {
            user.setUpdatedAt(Instant.now());
            mongoTemplate.save(user);
        }
    }

    /**
     * - Older order file where not present for the pages created within the application because page reordering with in
     * the application was not supported.
     * - New Form order field will be added to the Page object and is used to order the pages with in the application
     * Since the previously created pages doesnt have the order, we will be updating/adding order to all the previously
     * created pages of all the application present.
     * - []
     */
    @ChangeSet(order = "075", id = "add-and-update-order-for-all-pages", author = "")
    public void addOrderToAllPagesOfApplication(MongockTemplate mongoTemplate) {
        for (Application application : mongoTemplate.findAll(Application.class)) {
            //Commenting out this piece code as we have decided to remove the order field from ApplicationPages
            /*if(application.getPages() != null) {
                int i = 0;
                for (ApplicationPage page : application.getPages()) {
                    page.setOrder(i);
                    i++;
                }
                if (application.getPublishedPages() != null) {
                    i = 0;
                    for (ApplicationPage page : application.getPublishedPages()) {
                        page.setOrder(i);
                        i++;
                    }
                }
                mongoTemplate.save(application);
            }*/
        }
    }

    @ChangeSet(order = "076", id = "mongo-form-migrate-raw", author = "")
    public void migrateRawInputTypeToRawCommand(MongockTemplate mongockTemplate) {

        Plugin mongoPlugin = mongockTemplate.findOne(query(where("packageName").is("mongo-plugin")), Plugin.class);

        // Fetch all the actions built on top of a mongo database with input type set to raw.
        assert mongoPlugin != null;
        List<NewAction> rawMongoQueryActions = mongockTemplate.find(
                        query(new Criteria().andOperator(
                                where(fieldName(QNewAction.newAction.pluginId)).is(mongoPlugin.getId()))),
                        NewAction.class
                )
                .stream()
                .filter(mongoAction -> {
                    boolean result = false;
                    if (mongoAction.getUnpublishedAction() == null || mongoAction.getUnpublishedAction().getActionConfiguration() == null) {
                        return false;
                    }

                    List<Property> pluginSpecifiedTemplates = mongoAction.getUnpublishedAction().getActionConfiguration().getPluginSpecifiedTemplates();

                    // Filter out all the unpublished actions which have the input type raw configured.
                    if (pluginSpecifiedTemplates != null && pluginSpecifiedTemplates.size() >= 2) {
                        Property inputTypeProperty = pluginSpecifiedTemplates.get(1);
                        if (inputTypeProperty != null && inputTypeProperty.getValue() != null) {
                            String inputType = (String) inputTypeProperty.getValue();
                            if (inputType.equals("RAW")) {
                                result = true;
                            }
                        }
                    }

                    ActionDTO publishedAction = mongoAction.getPublishedAction();
                    if (publishedAction != null && publishedAction.getActionConfiguration() != null) {
                        pluginSpecifiedTemplates = publishedAction.getActionConfiguration().getPluginSpecifiedTemplates();

                        // Filter out all the published actions which have the input type raw configured.
                        if (pluginSpecifiedTemplates != null && pluginSpecifiedTemplates.size() >= 2) {
                            Property inputTypeProperty = pluginSpecifiedTemplates.get(1);
                            if (inputTypeProperty != null && inputTypeProperty.getValue() != null) {
                                String inputType = (String) inputTypeProperty.getValue();
                                if (inputType.equals("RAW")) {
                                    result = true;
                                }
                            }
                        }
                    }
                    return result;
                })
                .collect(Collectors.toList());

        for (NewAction action : rawMongoQueryActions) {

            Boolean smartSub = true;
            Property smartSubProperty;
            Map<Integer, Object> configMap;
            List<Property> updatedTemplates;

            // Migrate the unpublished actions
            List<Property> pluginSpecifiedTemplates = action.getUnpublishedAction().getActionConfiguration().getPluginSpecifiedTemplates();
            if (pluginSpecifiedTemplates != null) {
                smartSubProperty = pluginSpecifiedTemplates.get(0);
                if (smartSubProperty != null) {
                    Object value = smartSubProperty.getValue();
                    if (value instanceof Boolean) {
                        smartSub = (Boolean) value;
                    } else if (value instanceof String) {
                        smartSub = Boolean.parseBoolean((String) value);
                    }
                }

                configMap = new HashMap<>();
                configMap.put(0, smartSub);
                configMap.put(2, "RAW");

                updatedTemplates = generateMongoFormConfigTemplates(configMap);
                action.getUnpublishedAction().getActionConfiguration().setPluginSpecifiedTemplates(updatedTemplates);
            }


            // Now migrate the published actions
            ActionDTO publishedAction = action.getPublishedAction();
            if (publishedAction != null && publishedAction.getActionConfiguration() != null) {
                pluginSpecifiedTemplates = publishedAction.getActionConfiguration().getPluginSpecifiedTemplates();

                if (pluginSpecifiedTemplates != null) {
                    smartSub = true;
                    smartSubProperty = pluginSpecifiedTemplates.get(0);
                    if (smartSubProperty != null) {
                        Object value = smartSubProperty.getValue();
                        if (value instanceof Boolean) {
                            smartSub = (Boolean) value;
                        } else if (value instanceof String) {
                            smartSub = Boolean.parseBoolean((String) value);
                        }
                    }

                    configMap = new HashMap<>();
                    configMap.put(0, smartSub);
                    configMap.put(2, "RAW");

                    updatedTemplates = generateMongoFormConfigTemplates(configMap);
                    action.getPublishedAction().getActionConfiguration().setPluginSpecifiedTemplates(updatedTemplates);
                }
            }
        }

        // Now that all the actions have been updated, save all the actions
        for (NewAction action : rawMongoQueryActions) {
            mongockTemplate.save(action);
        }
    }

    @ChangeSet(order = "077", id = "add-arangodb-plugin", author = "")
    public void addArangoDBPlugin(MongockTemplate mongoTemplate) {
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

        installPluginToAllOrganizations(mongoTemplate, plugin.getId());
    }

    @ChangeSet(order = "078", id = "set-svg-logo-to-plugins", author = "")
    public void setSvgLogoToPluginIcons(MongockTemplate mongoTemplate) {
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

    @ChangeSet(order = "079", id = "remove-order-field-from-application- pages", author = "")
    public void removePageOrderFieldFromApplicationPages(MongockTemplate mongoTemplate) {
        Query query = new Query();
        query.addCriteria(Criteria.where("pages").exists(TRUE));

        Update update = new Update();
        update.unset("pages.$[].order");
        mongoTemplate.updateMulti(query(where("pages").exists(TRUE)), update, Application.class);

        update.unset("publishedPages.$[].order");
        mongoTemplate.updateMulti(query(where("publishedPages").exists(TRUE)), update, Application.class);
    }

    @ChangeSet(order = "080", id = "create-plugin-reference-for-genarate-CRUD-page", author = "")
    public void createPluginReferenceForGenerateCRUDPage(MongockTemplate mongoTemplate) {

        final String templatePageNameForSQLDatasource = "SQL";
        final Set<String> sqlPackageNames = Set.of("mysql-plugin", "mssql-plugin", "redshift-plugin", "snowflake-plugin");
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

    private Document getDocumentFromPath(Document document, String path) {
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
                    System.out.println("Failed to cast document for path: " + path);
                    e.printStackTrace();
                    return null;
                }
            } else {
                return null;
            }
        }

        return documentPtr;
    }

    private void encryptPathValueIfExists(Document document, String path, EncryptionService encryptionService) {
        String[] pathKeys = path.split("\\.");
        /**
         * - For attribute path "datasourceConfiguration.connection.ssl.keyFile.base64Content", first get the parent
         * document that contains the attribute 'base64Content' i.e. fetch the document corresponding to path
         * "datasourceConfiguration.connection.ssl.keyFile"
         */
        String parentDocumentPath = StringUtils.join(ArrayUtils.subarray(pathKeys, 0, pathKeys.length - 1), ".");
        Document parentDocument = getDocumentFromPath(document, parentDocumentPath);

        if (parentDocument != null) {
            /**
             * - Replace old value with new encrypted value if the key exists and is non-null.
             * - Use the last element in pathKeys since it the key that names the attribute that needs to be encrypted
             * e.g. 'base64Content' in "datasourceConfiguration.connection.ssl.keyFile.base64Content"
             */
            parentDocument.computeIfPresent(
                    pathKeys[pathKeys.length - 1],
                    (k, v) -> encryptionService.encryptString((String) v)
            );
        }
    }

    private void encryptRawValues(Document document, List<String> pathList, EncryptionService encryptionService) {
        pathList.stream()
                .forEach(path -> encryptPathValueIfExists(document, path, encryptionService));
    }

    @ChangeSet(order = "081", id = "encrypt-certificate", author = "")
    public void encryptCertificateAndPassword(MongockTemplate mongoTemplate, EncryptionService encryptionService) {

        /**
         * - List of attributes that need to be encoded.
         * - Each path represents where the attribute exists in mongo db document.
         */
        List<String> pathList = new ArrayList<>();
        pathList.add("datasourceConfiguration.connection.ssl.keyFile.base64Content");
        pathList.add("datasourceConfiguration.connection.ssl.certificateFile.base64Content");
        pathList.add("datasourceConfiguration.connection.ssl.caCertificateFile.base64Content");
        pathList.add("datasourceConfiguration.connection.ssl.pemCertificate.file.base64Content");
        pathList.add("datasourceConfiguration.connection.ssl.pemCertificate.password");
        pathList.add("datasourceConfiguration.sshProxy.privateKey.keyFile.base64Content");
        pathList.add("datasourceConfiguration.sshProxy.privateKey.password");

        mongoTemplate.execute("datasource", new CollectionCallback<String>() {
            @Override
            public String doInCollection(MongoCollection<Document> collection) {
                MongoCursor cursor = collection.find(
                        Filters.or(
                                Filters.exists(pathList.get(0)),
                                Filters.exists(pathList.get(1)),
                                Filters.exists(pathList.get(2)),
                                Filters.exists(pathList.get(3)),
                                Filters.exists(pathList.get(4)),
                                Filters.exists(pathList.get(5)),
                                Filters.exists(pathList.get(6))
                        )
                ).cursor();

                List<Pair<Document, Document>> documentPairList = new ArrayList<>();
                while (cursor.hasNext()) {
                    Document old = (Document) cursor.next();
                    // This document will have the encrypted values.
                    Document updated = Document.parse(old.toJson());
                    // Encrypt attributes
                    encryptRawValues(updated, pathList, encryptionService);
                    documentPairList.add(new Pair(old, updated));
                }

                /**
                 * - Replace old document with the updated document that has encrypted values.
                 * - Replacing here instead of the while loop above makes sure that we attempt replacement only if
                 * the encryption step succeeded without error for each selected document.
                 */
                documentPairList.stream()
                        .forEach(docPair -> collection.findOneAndReplace(docPair.getFirst(), docPair.getSecond()));

                return null;
            }
        });
    }

    @ChangeSet(order = "082", id = "create-plugin-reference-for-S3-GSheet-genarate-CRUD-page", author = "")
    public void createPluginReferenceForS3AndGSheetGenerateCRUDPage(MongockTemplate mongoTemplate) {

        Set<String> validPackageNames = Set.of("amazons3-plugin", "google-sheets-plugin");

        List<Plugin> plugins = mongoTemplate.findAll(Plugin.class);
        for (Plugin plugin : plugins) {
            if (validPackageNames.contains(plugin.getPackageName())) {
                plugin.setGenerateCRUDPageComponent(plugin.getName());
            }
            mongoTemplate.save(plugin);
        }
    }

    @ChangeSet(order = "083", id = "application-git-metadata", author = "")
    public void addApplicationGitMetadataFieldAndIndex(MongockTemplate mongoTemplate) {
        dropIndexIfExists(mongoTemplate, Application.class, "organization_application_compound_index");
        dropIndexIfExists(mongoTemplate, Application.class, "organization_application_deleted_compound_index");

        ensureIndexes(mongoTemplate, Application.class,
                makeIndex("organizationId", "name", "deletedAt", "gitMetadata.remoteUrl", "gitMetadata.branchName")
                        .unique().named("organization_application_deleted_gitRepo_gitBranch_compound_index")
        );
    }

    @ChangeSet(order = "084", id = "add-js-plugin", author = "")
    public void addJSPlugin(MongockTemplate mongoTemplate) {
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

        installPluginToAllOrganizations(mongoTemplate, plugin.getId());
    }

    @ChangeSet(order = "085", id = "update-google-sheet-plugin-smartSubstitution-config", author = "")
    public void updateGoogleSheetActionsSetSmartSubstitutionConfiguration(MongockTemplate mongoTemplate) {

        Plugin googleSheetPlugin = mongoTemplate.findOne(
                query(new Criteria().andOperator(
                        where(fieldName(QPlugin.plugin.packageName)).is("google-sheets-plugin")
                )),
                Plugin.class);

        if (googleSheetPlugin == null) {
            return;
        }

        // Fetch all the actions built on top of a google sheet plugin
        List<NewAction> googleSheetActions = mongoTemplate.find(
                query(new Criteria().andOperator(
                        where(fieldName(QNewAction.newAction.pluginId)).is(googleSheetPlugin.getId())
                )),
                NewAction.class
        );

        Set<String> toMigrateUnPublishedActions = new HashSet<>();
        Set<String> toMigratePublishedActions = new HashSet<>();

        for (NewAction action : googleSheetActions) {
            if (action.getUnpublishedAction().getActionConfiguration() != null) {
                toMigrateUnPublishedActions.add(action.getId());
            }

            if (action.getPublishedAction() != null && action.getPublishedAction().getActionConfiguration() != null) {
                toMigratePublishedActions.add(action.getId());
            }
        }

        Property smartSubProperty = new Property("smartSubstitution", false);

        // Migrate unpublished actions
        mongoTemplate.updateMulti(
                query(where("_id").in(toMigrateUnPublishedActions)),
                new Update().set("unpublishedAction.actionConfiguration.pluginSpecifiedTemplates.13", smartSubProperty),
                NewAction.class
        );

        // Migrate published actions
        mongoTemplate.updateMulti(
                query(where("_id").in(toMigratePublishedActions)),
                new Update().set("publishedAction.actionConfiguration.pluginSpecifiedTemplates.13", smartSubProperty),
                NewAction.class
        );
    }

    @ChangeSet(order = "086", id = "uninstall-mongo-uqi-plugin", author = "")
    public void uninstallMongoUqiPluginAndRemoveAllActions(MongockTemplate mongoTemplate) {

        Plugin mongoUqiPlugin = mongoTemplate.findAndRemove(
                query(where("packageName").is("mongo-uqi-plugin")),
                Plugin.class
        );

        if (mongoUqiPlugin == null) {
            // If there's no installed plugin for the same, don't go any further.
            return;
        }

        // Uninstall the plugin from all organizations
        for (Organization organization : mongoTemplate.findAll(Organization.class)) {
            if (CollectionUtils.isEmpty(organization.getPlugins())) {
                // do nothing
            }

            final Set<String> installedPlugins = organization
                    .getPlugins()
                    .stream()
                    .map(OrganizationPlugin::getPluginId)
                    .collect(Collectors.toSet());

            if (installedPlugins.contains(mongoUqiPlugin.getId())) {
                OrganizationPlugin mongoUqiOrganizationPlugin = organization.getPlugins()
                        .stream()
                        .filter(organizationPlugin -> organizationPlugin.getPluginId().equals(mongoUqiPlugin.getId()))
                        .findFirst()
                        .get();

                installedPlugins.remove(mongoUqiOrganizationPlugin);
                mongoTemplate.save(organization);
            }
        }

        // Delete all mongo uqi datasources
        List<Datasource> removedDatasources = mongoTemplate.findAllAndRemove(
                query(where("pluginId").is(mongoUqiPlugin.getId())),
                Datasource.class
        );

        // Now delete all the actions created on top of mongo uqi datasources
        for (Datasource deletedDatasource : removedDatasources) {
            mongoTemplate.findAllAndRemove(
                    query(where("unpublishedAction.datasource.id").is(deletedDatasource.getId())),
                    NewAction.class
            );
        }
    }

    public final static Map<Integer, String> mongoMigrationMap = Map.ofEntries(
            Map.entry(0, "smartSubstitution"), //SMART_BSON_SUBSTITUTION
            Map.entry(2, "command"), // COMMAND
            Map.entry(19, "collection"), // COLLECTION
            Map.entry(3, "find.query"), // FIND_QUERY
            Map.entry(4, "find.sort"), // FIND_SORT
            Map.entry(5, "find.projection"), // FIND_PROJECTION
            Map.entry(6, "find.limit"), // FIND_LIMIT
            Map.entry(7, "find.skip"), // FIND_SKIP
            Map.entry(11, "updateMany.query"), // UPDATE_QUERY
            Map.entry(12, "updateMany.update"), // UPDATE_UPDATE
            Map.entry(21, "updateMany.limit"), // UPDATE_LIMIT
            Map.entry(13, "delete.query"), // DELETE_QUERY
            Map.entry(20, "delete.limit"), // DELETE_LIMIT
            Map.entry(14, "count.query"), // COUNT_QUERY
            Map.entry(15, "distinct.query"), // DISTINCT_QUERY
            Map.entry(16, "distinct.key"), // DISTINCT_KEY
            Map.entry(17, "aggregate.arrayPipelines"), // AGGREGATE_PIPELINE
            Map.entry(18, "insert.documents") // INSERT_DOCUMENT
    );

    private void updateFormData(int index, Object value, Map formData, Map<Integer, String> migrationMap) {
        if (migrationMap.containsKey(index)) {
            String path = migrationMap.get(index);
            setValueSafelyInFormData(formData, path, value);
        }
    }

    public Map iteratePluginSpecifiedTemplatesAndCreateFormData(List<Property> pluginSpecifiedTemplates, Map<Integer, String> migrationMap) {

        if (pluginSpecifiedTemplates != null && !pluginSpecifiedTemplates.isEmpty()) {
            Map<String, Object> formData = new HashMap<>();
            for (int i = 0; i < pluginSpecifiedTemplates.size(); i++) {
                Property template = pluginSpecifiedTemplates.get(i);
                if (template != null) {
                    updateFormData(i, template.getValue(), formData, migrationMap);
                }
            }
            return formData;
        }

        return new HashMap<>();
    }

    @ChangeSet(order = "087", id = "migrate-mongo-to-uqi", author = "")
    public void migrateMongoPluginToUqi(MongockTemplate mongoTemplate) {

        // First update the UI component for the mongo plugin to UQI
        Plugin mongoPlugin = mongoTemplate.findOne(
                query(where("packageName").is("mongo-plugin")),
                Plugin.class
        );
        mongoPlugin.setUiComponent("UQIDbEditorForm");
        mongoTemplate.save(mongoPlugin);

        // Now migrate all the existing actions to the new UQI structure.

        List<NewAction> mongoActions = mongoTemplate.find(
                query(new Criteria().andOperator(
                        where(fieldName(QNewAction.newAction.pluginId)).is(mongoPlugin.getId()))),
                NewAction.class
        );

        for (NewAction mongoAction : mongoActions) {
            if (mongoAction.getUnpublishedAction() == null || mongoAction.getUnpublishedAction().getActionConfiguration() == null) {
                // No migrations required
                continue;
            }

            List<Property> pluginSpecifiedTemplates = mongoAction.getUnpublishedAction().getActionConfiguration().getPluginSpecifiedTemplates();

            mongoAction.getUnpublishedAction().getActionConfiguration().setFormData(
                    iteratePluginSpecifiedTemplatesAndCreateFormData(pluginSpecifiedTemplates, mongoMigrationMap)
            );
            mongoAction.getUnpublishedAction().getActionConfiguration().setPluginSpecifiedTemplates(null);

            ActionDTO publishedAction = mongoAction.getPublishedAction();
            if (publishedAction.getActionConfiguration() != null &&
                    publishedAction.getActionConfiguration().getPluginSpecifiedTemplates() != null) {
                pluginSpecifiedTemplates = publishedAction.getActionConfiguration().getPluginSpecifiedTemplates();
                publishedAction.getActionConfiguration().setFormData(
                        iteratePluginSpecifiedTemplatesAndCreateFormData(pluginSpecifiedTemplates, mongoMigrationMap)
                );
                publishedAction.getActionConfiguration().setPluginSpecifiedTemplates(null);
            }

            mongoTemplate.save(mongoAction);
        }
    }

    @ChangeSet(order = "088", id = "migrate-mongo-uqi-dynamicBindingPathList", author = "")
    public void migrateMongoPluginDynamicBindingListUqi(MongockTemplate mongoTemplate) {

        Plugin mongoPlugin = mongoTemplate.findOne(
                query(where("packageName").is("mongo-plugin")),
                Plugin.class
        );

        // Now migrate all the existing actions dynamicBindingList to the new UQI structure.
        List<NewAction> mongoActions = mongoTemplate.find(
                query(new Criteria().andOperator(
                        where(fieldName(QNewAction.newAction.pluginId)).is(mongoPlugin.getId())
                )),
                NewAction.class
        );

        for (NewAction mongoAction : mongoActions) {
            if (mongoAction.getUnpublishedAction() == null ||
                    mongoAction.getUnpublishedAction().getDynamicBindingPathList() == null ||
                    mongoAction.getUnpublishedAction().getDynamicBindingPathList().isEmpty()) {
                // No migrations required
                continue;
            }

            List<Property> dynamicBindingPathList = mongoAction.getUnpublishedAction().getDynamicBindingPathList();
            List<Property> newDynamicBindingPathList = new ArrayList<>();

            for (Property path : dynamicBindingPathList) {
                String pathKey = path.getKey();
                if (pathKey.contains("pluginSpecifiedTemplates")) {

                    // Pattern looks for pluginSpecifiedTemplates[12 and extracts the 12
                    Pattern pattern = Pattern.compile("(?<=pluginSpecifiedTemplates\\[)([0-9]+)");
                    Matcher matcher = pattern.matcher(pathKey);

                    while (matcher.find()) {
                        int index = Integer.parseInt(matcher.group());
                        String partialPath = mongoMigrationMap.get(index);
                        Property dynamicBindingPath = new Property("formData." + partialPath, null);
                        newDynamicBindingPathList.add(dynamicBindingPath);
                    }
                } else {
                    // this dynamic binding is for body. Add as is
                    newDynamicBindingPathList.add(path);
                }
            }

            mongoAction.getUnpublishedAction().setDynamicBindingPathList(newDynamicBindingPathList);

            mongoTemplate.save(mongoAction);
        }
    }

    @ChangeSet(order = "089", id = "update-plugin-package-name-index", author = "")
    public void updatePluginPackageNameIndexToPluginNamePackageNameAndVersion(MongockTemplate mongoTemplate) {
//        MongoTemplate mongoTemplate = mongockTemplate.getImpl();
        dropIndexIfExists(mongoTemplate, Plugin.class, "packageName");

        ensureIndexes(mongoTemplate, Plugin.class,
                makeIndex("pluginName", "packageName", "version")
                        .unique().named("plugin_name_package_name_version_index")
        );
    }

    @ChangeSet(order = "090", id = "delete-orphan-actions", author = "")
    public void deleteOrphanActions(MongockTemplate mongockTemplate) {
        final Update deletionUpdates = new Update();
        deletionUpdates.set(fieldName(QNewAction.newAction.deleted), true);
        deletionUpdates.set(fieldName(QNewAction.newAction.deletedAt), Instant.now());

        final Query actionQuery = query(where(fieldName(QNewAction.newAction.deleted)).ne(true));
        actionQuery.fields().include(fieldName(QNewAction.newAction.applicationId));

        final List<NewAction> actions = mongockTemplate.find(actionQuery, NewAction.class);

        for (final NewAction action : actions) {
            final String applicationId = action.getApplicationId();

            final boolean shouldDelete = StringUtils.isEmpty(applicationId) || mongockTemplate.exists(
                    query(
                            where(fieldName(QApplication.application.id)).is(applicationId)
                                    .and(fieldName(QApplication.application.deleted)).is(true)
                    ),
                    Application.class
            );

            if (shouldDelete) {
                mongockTemplate.updateFirst(
                        query(where(fieldName(QNewAction.newAction.id)).is(action.getId())),
                        deletionUpdates,
                        NewAction.class
                );
            }
        }
    }

    @ChangeSet(order = "091", id = "migrate-old-app-color-to-new-colors", author = "")
    public void migrateOldAppColorsToNewColors(MongockTemplate mongoTemplate) {
        String[] oldColors = {
                "#FF6786", "#FFAD5E", "#FCD43E", "#B0E968", "#5CE7EF", "#69B5FF", "#9177FF", "#FF76FE",
                "#61DF48", "#FF597B", "#6698FF", "#F8C356", "#6C4CF1", "#C5CD90", "#6272C8", "#4F70FD",
                "#6CD0CF", "#A8D76C", "#5EDA82", "#6C9DD0", "#F56AF4", "#5ED3DA", "#B94CF1", "#BC6DB2",
                "#EA6179", "#FE9F44", "#E9C951", "#ED86A1", "#54A9FB", "#F36380", "#C03C3C"
        };
        String[] newColors = {
                "#FFDEDE", "#FFEFDB", "#F3F1C7", "#F4FFDE", "#C7F3F0", "#D9E7FF", "#E3DEFF", "#F1DEFF",
                "#C7F3E3", "#F5D1D1", "#ECECEC", "#FBF4ED", "#D6D1F2", "#FFEBFB", "#EAEDFB", "#D6D1F2",
                "#C7F3F0", "#F4FFDE", "#C7F3E3", "#D9E7FF", "#F1DEFF", "#C7F3F0", "#D6D1F2", "#F1DEFF",
                "#F5D1D1", "#FFEFDB", "#F3F1C7", "#FFEBFB", "#D9E7FF", "#FFDEDE", "#F5D1D1"
        };

        for (int i = 0; i < oldColors.length; i++) {
            String oldColor = oldColors[i], newColor = newColors[i];

            // Migrate old color to new color
            String colorFieldName = fieldName(QApplication.application.color);
            mongoTemplate.updateMulti(
                    query(where(colorFieldName).is(oldColor).and(fieldName(QApplication.application.deleted)).is(false)),
                    new Update().set(colorFieldName, newColor),
                    Application.class
            );
        }
    }

    /**
     * Recently a change was introduced to modify the default value of s3 plugin's permanent URL toggle from NO to YES.
     * This created an issue with the older actions where the toggle didn't exist and hence no value was saved against its
     * property. Hence, since the default is now ON and the older actions don't have any value saved, the action
     * editor shows the toggle value as ON but behaves like the value is OFF. To fix this issue, this method adds
     * URL toggle as `NO` where no toggle value exists.
     *
     * @param mongockTemplate : Mongo client
     */
    @ChangeSet(order = "092", id = "update-s3-permanent-url-toggle-default-value", author = "")
    public void updateS3PermanentUrlToggleDefaultValue(MongockTemplate mongockTemplate) {
        Plugin s3Plugin = mongockTemplate.findOne(
                query(where("packageName").is("amazons3-plugin")),
                Plugin.class
        );

        /**
         * Query to find all S3 actions such that:
         *   o action type is LIST
         *   o permanent url property either does not exist or the property is null or the property's value is null -
         *   indicating that the property has not been set.
         */
        Query missingToggleQuery = query(new Criteria().andOperator(
                where("pluginId").is(s3Plugin.getId()),
                where("unpublishedAction.actionConfiguration.pluginSpecifiedTemplates.0.value").is("LIST"),
                new Criteria().orOperator(
                        where("unpublishedAction.actionConfiguration.pluginSpecifiedTemplates.8").exists(false),
                        where("unpublishedAction.actionConfiguration.pluginSpecifiedTemplates.8").is(null),
                        where("unpublishedAction.actionConfiguration.pluginSpecifiedTemplates.8.value").is(null)
                )
        ));
        List<NewAction> s3ListActionObjectsWithNoToggleValue = mongockTemplate.find(missingToggleQuery, NewAction.class);

        // Replace old pluginSpecifiedTemplates with updated pluginSpecifiedTemplates.
        s3ListActionObjectsWithNoToggleValue.stream()
                .forEach(action -> {
                    List<Property> oldPluginSpecifiedTemplates =
                            action.getUnpublishedAction().getActionConfiguration().getPluginSpecifiedTemplates();
                    List<Property> newPluginSpecifiedTemplates = setS3ListActionDefaults(oldPluginSpecifiedTemplates);
                    action.getUnpublishedAction().getActionConfiguration().setPluginSpecifiedTemplates(newPluginSpecifiedTemplates);
                });

        /**
         * Save changes only after all the processing is done so that in case any data manipulation fails, no data
         * write occurs.
         * Write data back to db only if all data manipulations done above have succeeded.
         */
        s3ListActionObjectsWithNoToggleValue.stream()
                .forEach(action -> mongockTemplate.save(action));
    }

    /**
     * This method fills `pluginSpecifiedTemplates` list with default values until the 7th index (i.e size = 8) for
     * LIST action type. The 8th index is mapped against the toggle for generating a permanent url for s3 resource.
     * However, a value cannot be set against this toggle if the value for previous keys in the list are missing.
     * Hence, this method populates the values for all the keys that appear before the permanent url toggle key. To
     * check out the indexes for each key / property please look into the `editor.json` file for s3 plugin.
     * <p>
     * The keys are saved as `null` for properties where editor.json does not define any value for the property keys.
     *
     * @param oldPluginSpecifiedTemplates : current config saved in db.
     * @return newPluginSpecifiedTemplates : new config with default values against missing keys.
     */
    private List<Property> setS3ListActionDefaults(List<Property> oldPluginSpecifiedTemplates) {
        List<Property> newPluginSpecifiedTemplates = new ArrayList<>(oldPluginSpecifiedTemplates);
        switch (newPluginSpecifiedTemplates.size()) {
            case 0:
                /**
                 * This case is never expected to be hit. However, I am still adding the handling here for the sake
                 * of completeness and comprehension.
                 */
                newPluginSpecifiedTemplates.add(new Property(null, "LIST")); // action type
            case 1:
                newPluginSpecifiedTemplates.add(new Property(null, "")); // bucket name
            case 2:
                newPluginSpecifiedTemplates.add(new Property(null, "NO")); // generate signed url
            case 3:
                newPluginSpecifiedTemplates.add(new Property(null, "5")); // expiry duration
            case 4:
                newPluginSpecifiedTemplates.add(new Property(null, "")); // prefix
            case 5:
                newPluginSpecifiedTemplates.add(new Property(null, "YES")); // base64 encode file
            case 6:
                newPluginSpecifiedTemplates.add(new Property(null, "YES")); // base64 data
            case 7:
                newPluginSpecifiedTemplates.add(new Property(null, "5")); // expiry duration for url with upload
            case 8:
                newPluginSpecifiedTemplates.add(new Property("generateUnsignedUrl", "NO")); // generate unsigned url
            default:
                if (newPluginSpecifiedTemplates.get(8) == null
                        || newPluginSpecifiedTemplates.get(8).getValue() == null) {
                    newPluginSpecifiedTemplates.set(8, new Property("generateUnsignedUrl", "NO"));
                }
        }

        return newPluginSpecifiedTemplates;
    }

    @ChangeSet(order = "093", id = "application-git-metadata-index", author = "")
    public void updateGitApplicationMetadataIndex(MongockTemplate mongoTemplate) {
        // MongoTemplate mongoTemplate = mongockTemplate.getImpl();
        dropIndexIfExists(mongoTemplate, Application.class, "organization_application_compound_index");
        dropIndexIfExists(mongoTemplate, Application.class, "organization_application_deleted_compound_index");
        dropIndexIfExists(mongoTemplate, Application.class, "organization_application_deleted_gitRepo_gitBranch_compound_index");

        ensureIndexes(mongoTemplate, Application.class,
                makeIndex("organizationId", "name", "deletedAt", "gitApplicationMetadata.remoteUrl", "gitApplicationMetadata.branchName")
                        .unique().named("organization_application_deleted_gitApplicationMetadata_compound_index")
        );
    }

    public final static Map<Integer, List<String>> s3MigrationMap = Map.ofEntries(
            Map.entry(0, List.of("command")),
            Map.entry(1, List.of("bucket")),
            Map.entry(2, List.of("list.signedUrl")),
            Map.entry(3, List.of("list.expiry")),
            Map.entry(4, List.of("list.prefix")),
            Map.entry(5, List.of("read.usingBase64Encoding")),
            Map.entry(6, List.of("create.dataType", "read.dataType")),
            Map.entry(7, List.of("create.expiry", "read.expiry", "delete.expiry")),
            Map.entry(8, List.of("list.unSignedUrl"))
    );

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
         * @param pluginName - name of the plugin for which the transformation is intended
         * @param transformationName - name of the transformation relative to the plugin
         * @param value - value that needs to be transformed
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
                            System.out.println("value: " + value);
                            oldListOfConditions = new ArrayList<>();
                        }

                        oldListOfConditions.stream()
                                .forEachOrdered(oldCondition -> {
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
                    String transformationKeyNotFoundErrorMessage = "Data transformer failed to find any " +
                            "matching case for plugin: " + pluginName + " and key: " + transformationName + ". Please " +
                            "contact Appsmith customer support to resolve this.";
                    assert false : transformationKeyNotFoundErrorMessage;

                    break;
                default:
                    /* Throw error since no handler could be found for the plugin matching pluginName */
                    String noPluginHandlerFoundErrorMessage = "Data transformer failed to find any matching case for " +
                            "plugin: " + pluginName + ". Please contact Appsmith customer support to resolve this.";
                    assert false : noPluginHandlerFoundErrorMessage;
            }

            /* Execution flow is never expected to reach here. */
            String badExecutionFlowErrorMessage = "Execution flow is never supposed to reach here. Please contact " +
                    "Appsmith customer support to resolve this.";
            assert false : badExecutionFlowErrorMessage;

            return value;
        }
    }

    private void updateFormDataMultipleOptions(int index, Object value, Map formData,
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

    public Map iteratePluginSpecifiedTemplatesAndCreateFormDataMultipleOptions(List<Property> pluginSpecifiedTemplates,
                                                                               Map<Integer, List<String>> migrationMap, Map<Integer, String> uqiDataTransformationMap,
                                                                               UQIMigrationDataTransformer dataTransformer, String pluginName) {

        if (pluginSpecifiedTemplates != null && !pluginSpecifiedTemplates.isEmpty()) {
            Map<String, Object> formData = new HashMap<>();
            for (int i = 0; i < pluginSpecifiedTemplates.size(); i++) {
                Property template = pluginSpecifiedTemplates.get(i);
                if (template != null) {
                    updateFormDataMultipleOptions(i, template.getValue(), formData, migrationMap,
                            uqiDataTransformationMap, dataTransformer, pluginName);
                }
            }

            return formData;
        }

        return new HashMap<>();
    }

    @ChangeSet(order = "094", id = "migrate-s3-to-uqi", author = "")
    public void migrateS3PluginToUqi(MongockTemplate mongockTemplate) {

        ObjectMapper objectMapper = new ObjectMapper();
        // First update the UI component for the s3 plugin to UQI
        Plugin s3Plugin = mongockTemplate.findOne(
                query(where("packageName").is("amazons3-plugin")),
                Plugin.class
        );
        s3Plugin.setUiComponent("UQIDbEditorForm");


        // Now migrate all the existing actions to the new UQI structure.

        List<NewAction> s3Actions = mongockTemplate.find(
                query(new Criteria().andOperator(
                        where(fieldName(QNewAction.newAction.pluginId)).is(s3Plugin.getId()))),
                NewAction.class
        );

        List<NewAction> actionsToSave = new ArrayList<>();

        for (NewAction s3Action : s3Actions) {
            // First migrate the plugin specified templates to form data
            ActionDTO unpublishedAction = s3Action.getUnpublishedAction();

            if (unpublishedAction == null || unpublishedAction.getActionConfiguration() == null) {
                // No migrations required
                continue;
            }

            List<Property> pluginSpecifiedTemplates = unpublishedAction.getActionConfiguration().getPluginSpecifiedTemplates();

            unpublishedAction.getActionConfiguration().setFormData(
                    iteratePluginSpecifiedTemplatesAndCreateFormDataMultipleOptions(pluginSpecifiedTemplates,
                            s3MigrationMap, null, null, null)
            );
            unpublishedAction.getActionConfiguration().setPluginSpecifiedTemplates(null);

            ActionDTO publishedAction = s3Action.getPublishedAction();
            if (publishedAction != null && publishedAction.getActionConfiguration() != null &&
                    publishedAction.getActionConfiguration().getPluginSpecifiedTemplates() != null) {
                pluginSpecifiedTemplates = publishedAction.getActionConfiguration().getPluginSpecifiedTemplates();
                publishedAction.getActionConfiguration().setFormData(
                        iteratePluginSpecifiedTemplatesAndCreateFormDataMultipleOptions(pluginSpecifiedTemplates,
                                s3MigrationMap, null, null, null)
                );
                publishedAction.getActionConfiguration().setPluginSpecifiedTemplates(null);
            }

            // Migrate the dynamic binding path list for unpublished action
            List<Property> dynamicBindingPathList = unpublishedAction.getDynamicBindingPathList();
            List<Property> newDynamicBindingPathList = getUpdatedDynamicBindingPathList(dynamicBindingPathList,
                    objectMapper, s3Action, s3MigrationMap);
            unpublishedAction.setDynamicBindingPathList(newDynamicBindingPathList);

            actionsToSave.add(s3Action);
        }

        // Now save the actions which have been migrated.
        for (NewAction s3Action : actionsToSave) {
            mongockTemplate.save(s3Action);
        }
        // Now that the actions have completed the migrations, update the plugin to use the new UI form.
        mongockTemplate.save(s3Plugin);
    }

    /**
     * Method to port `dynamicBindingPathList` to UQI model.
     *
     * @param dynamicBindingPathList : old dynamicBindingPathList
     * @param objectMapper
     * @param action
     * @param migrationMap : A mapping from `pluginSpecifiedTemplates` index to attribute path in UQI model. For
     *                     reference, please check out the `s3MigrationMap` defined above.
     * @return : updated dynamicBindingPathList - ported to UQI model.
     */
    private List<Property> getUpdatedDynamicBindingPathList(List<Property> dynamicBindingPathList,
                                                            ObjectMapper objectMapper, NewAction action,
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
            List<String> dynamicBindingPathNames = newDynamicBindingPathList
                    .stream()
                    .map(property -> property.getKey())
                    .collect(Collectors.toList());

            Set<String> pathsToRemove = getInvalidDynamicBindingPathsInAction(objectMapper, action, dynamicBindingPathNames);

            // We have found atleast 1 invalid dynamic binding path.
            if (!pathsToRemove.isEmpty()) {
                // First remove the invalid paths from the set of paths
                dynamicBindingPathNames.removeAll(pathsToRemove);

                // Transform the set of paths to Property as it is stored in the db.
                List<Property> updatedDynamicBindingPathList = dynamicBindingPathNames
                        .stream()
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

    @ChangeSet(order = "094", id = "set-slug-to-application-and-page", author = "")
    public void setSlugToApplicationAndPage(MongockTemplate mongockTemplate) {
        // update applications
        final Query applicationQuery = query(where("deletedAt").is(null));
        applicationQuery.fields()
                .include(fieldName(QApplication.application.name));

        List<Application> applications = mongockTemplate.find(applicationQuery, Application.class);

        for (Application application : applications) {
            mongockTemplate.updateFirst(
                    query(where(fieldName(QApplication.application.id)).is(application.getId())),
                    new Update().set(fieldName(QApplication.application.slug), TextUtils.makeSlug(application.getName())),
                    Application.class
            );
        }

        // update pages
        final Query pageQuery = query(where("deletedAt").is(null));
        pageQuery.fields()
                .include(String.format("%s.%s",
                        fieldName(QNewPage.newPage.unpublishedPage), fieldName(QNewPage.newPage.unpublishedPage.name)
                ))
                .include(String.format("%s.%s",
                        fieldName(QNewPage.newPage.publishedPage), fieldName(QNewPage.newPage.publishedPage.name)
                ));

        List<NewPage> pages = mongockTemplate.find(pageQuery, NewPage.class);

        for (NewPage page : pages) {
            Update update = new Update();
            if (page.getUnpublishedPage() != null) {
                String fieldName = String.format("%s.%s",
                        fieldName(QNewPage.newPage.unpublishedPage), fieldName(QNewPage.newPage.unpublishedPage.slug)
                );
                update = update.set(fieldName, TextUtils.makeSlug(page.getUnpublishedPage().getName()));
            }
            if (page.getPublishedPage() != null) {
                String fieldName = String.format("%s.%s",
                        fieldName(QNewPage.newPage.publishedPage), fieldName(QNewPage.newPage.publishedPage.slug)
                );
                update = update.set(fieldName, TextUtils.makeSlug(page.getPublishedPage().getName()));
            }
            mongockTemplate.updateFirst(
                    query(where(fieldName(QNewPage.newPage.id)).is(page.getId())),
                    update,
                    NewPage.class
            );
        }
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
                    Iterator<String> fieldsIterator = Arrays.stream(fields).filter(fieldToken -> !fieldToken.isBlank()).iterator();
                    boolean isLeafNode = false;
                    // This loop will end at either a leaf node, or the last identified JSON field (by throwing an exception)
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

                // Check if the newly computed trigger paths are different from the existing ones and if true, set it in the dsl
                if (dynamicTriggerPaths.size() != newTriggerPaths.size() || !newTriggerPaths.containsAll(dynamicTriggerPaths)) {
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

    @ChangeSet(order = "095", id = "update-list-widget-trigger-paths", author = "")
    public void removeUnusedTriggerPathsListWidget(MongockTemplate mongockTemplate) {


        // Find all the pages which haven't been deleted

        final Criteria possibleCandidatePagesCriteria = new Criteria().andOperator(
                where("deletedAt").is(null),
                where("unpublishedPage.layouts.0.dsl").exists(true)
        );

        Query pageQuery = query(possibleCandidatePagesCriteria);
        pageQuery.fields()
                .include(fieldName(QNewPage.newPage.id));

        final List<NewPage> pages = mongockTemplate.find(
                pageQuery,
                NewPage.class
        );

        for (NewPage onlyIdPage : pages) {

            // Fetch one action at a time to avoid OOM.
            NewPage page = mongockTemplate.findOne(
                    query(where(fieldName(QNewPage.newPage.id)).is(onlyIdPage.getId())),
                    NewPage.class
            );

            List<Layout> layouts = page.getUnpublishedPage().getLayouts();

            Layout layout = layouts.get(0);
            // update the dsl
            DslUpdateDto dslUpdateDto = updateListWidgetTriggerPaths(new DslUpdateDto(layout.getDsl(), FALSE));
            layout.setDsl(dslUpdateDto.getDsl());

            if (page.getPublishedPage() != null) {
                layouts = page.getPublishedPage().getLayouts();
                if (!CollectionUtils.isEmpty(layouts)) {
                    layout = layouts.get(0);
                    // update the dsl
                    dslUpdateDto = updateListWidgetTriggerPaths(new DslUpdateDto(layout.getDsl(), dslUpdateDto.getUpdated()));
                    layout.setDsl(dslUpdateDto.getDsl());
                }
            }

            if (dslUpdateDto.getUpdated().equals(TRUE)) {
                mongockTemplate.save(page);
            }
        }
    }

    /**
     * Updates all existing S3 actions to modify the body parameter.
     * Earlier, the body used to be a base64 encoded or a blob of file data.
     * With this migration, the structure is expected to follow the
     * {@link com.appsmith.external.dtos.MultipartFormDataDTO} format
     *
     * @param mongockTemplate
     */
    @ChangeSet(order = "096", id = "update-s3-action-configuration-for-type", author = "")
    public void updateS3ActionConfigurationBodyForContentTypeSupport(MongockTemplate mongockTemplate) {
        Plugin s3Plugin = mongockTemplate.findOne(
                query(where("packageName").is("amazons3-plugin")),
                Plugin.class
        );

        // Find all S3 actions
        List<NewAction> s3Actions = mongockTemplate.find(
                query(new Criteria().andOperator(
                        where(fieldName(QNewAction.newAction.pluginId)).is(s3Plugin.getId()))),
                NewAction.class
        );

        List<NewAction> actionsToSave = new ArrayList<>();

        for (NewAction s3Action : s3Actions) {
            ActionDTO unpublishedAction = s3Action.getUnpublishedAction();

            if (unpublishedAction == null || unpublishedAction.getActionConfiguration() == null) {
                // No migrations required
                continue;
            }

            final String oldUnpublishedBody = unpublishedAction.getActionConfiguration().getBody();
            final String newUnpublishedBody = "{\n\t\"data\": \"" + oldUnpublishedBody + "\"\n}";
            unpublishedAction.getActionConfiguration().setBody(newUnpublishedBody);

            ActionDTO publishedAction = s3Action.getPublishedAction();
            if (publishedAction != null && publishedAction.getActionConfiguration() != null) {
                final String oldPublishedBody = publishedAction.getActionConfiguration().getBody();
                final String newPublishedBody = "{\n\t\"data\": \"" + oldPublishedBody + "\"\n}";
                publishedAction.getActionConfiguration().setBody(newPublishedBody);
            }
            actionsToSave.add(s3Action);
        }

        // Now save the actions which have been migrated.
        for (NewAction s3Action : actionsToSave) {
            mongockTemplate.save(s3Action);
        }
    }

    /**
     * This migration fixes the data due to issue #8999 Due to this bug, public applications have isPublic=false
     * when they are edited but in policies anonymousUser still have read application permission.
     * This migration will set isPublic=true to those applications which have isPublic=false but anonymousUser has
     * read:applications permission in policies
     *
     * @param mongockTemplate
     */
    @ChangeSet(order = "097", id = "fix-ispublic-is-false-for-public-apps", author = "")
    public void fixIsPublicIsSetFalseWhenAppIsPublic(MongockTemplate mongockTemplate) {
        Query query = query(
                where("isPublic").is(false)
                        .and("deleted").is(false)
                        .and("policies").elemMatch(
                                where("permission").is("read:applications").and("users").is("anonymousUser")
                        )
        );
        Update update = new Update().set("isPublic", true);
        mongockTemplate.updateMulti(query, update, Application.class);
    }

    @ChangeSet(order = "098", id = "update-js-action-client-side-execution", author = "")
    public void updateJsActionsClientSideExecution(MongockTemplate mongockTemplate) {
        Plugin jsPlugin = mongockTemplate.findOne(
                query(where("packageName").is("js-plugin")),
                Plugin.class
        );

        // Find all JS actions
        List<NewAction> jsActions = mongockTemplate.find(
                query(new Criteria().andOperator(
                        where(fieldName(QNewAction.newAction.pluginId)).is(jsPlugin.getId()))),
                NewAction.class
        );

        List<NewAction> actionsToSave = new ArrayList<>();

        for (NewAction jsAction : jsActions) {
            ActionDTO unpublishedAction = jsAction.getUnpublishedAction();

            if (unpublishedAction == null || unpublishedAction.getActionConfiguration() == null) {
                // No migrations required
                continue;
            }

            unpublishedAction.setClientSideExecution(true);

            ActionDTO publishedAction = jsAction.getPublishedAction();
            if (publishedAction != null) {
                publishedAction.setClientSideExecution(true);
            }
            actionsToSave.add(jsAction);
        }

        // Now save the actions which have been migrated.
        for (NewAction jsAction : actionsToSave) {
            mongockTemplate.save(jsAction);
        }
    }

    @ChangeSet(order = "099", id = "add-smtp-plugin", author = "")
    public void addSmtpPluginPlugin(MongockTemplate mongoTemplate) {
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
        installPluginToAllOrganizations(mongoTemplate, plugin.getId());
    }

    @ChangeSet(order = "100", id = "update-mockdb-endpoint", author = "")
    public void updateMockdbEndpoint(MongockTemplate mongockTemplate) {
        mongockTemplate.updateMulti(
                query(where("datasourceConfiguration.endpoints.host").is("fake-api.cvuydmurdlas.us-east-1.rds.amazonaws.com")),
                update("datasourceConfiguration.endpoints.$.host", "mockdb.internal.appsmith.com"),
                Datasource.class
        );
    }

    @ChangeSet(order = "101", id = "add-google-sheets-plugin-name", author = "")
    public void addPluginNameForGoogleSheets(MongockTemplate mongockTemplate) {
        Plugin googleSheetsPlugin = mongockTemplate.findOne(
                query(where("packageName").is("google-sheets-plugin")),
                Plugin.class
        );

        assert googleSheetsPlugin != null;
        googleSheetsPlugin.setPluginName("google-sheets-plugin");

        mongockTemplate.save(googleSheetsPlugin);
    }

    @ChangeSet(order = "102", id = "insert-default-resources", author = "")
    public void insertDefaultResources(MongockTemplate mongockTemplate) {

        // Update datasources
        final Query datasourceQuery = query(where(fieldName(QDatasource.datasource.deleted)).ne(true));

        datasourceQuery.fields()
                .include(fieldName(QDatasource.datasource.id))
                .include(fieldName(QDatasource.datasource.organizationId));

        List<Datasource> datasources = mongockTemplate.find(datasourceQuery, Datasource.class);
        for(Datasource datasource: datasources) {
            final Update update = new Update();
            final String gitSyncId = datasource.getOrganizationId() + "_" + new ObjectId();
            update.set(fieldName(QDatasource.datasource.gitSyncId), gitSyncId);
            mongockTemplate.updateFirst(
                    query(where(fieldName(QDatasource.datasource.id)).is(datasource.getId())),
                    update,
                    Datasource.class
            );
        }

        // Update default page Ids in pages and publishedPages for all existing applications
        final Query applicationQuery = query(where(fieldName(QApplication.application.deleted)).ne(true))
                .addCriteria(where(fieldName(QApplication.application.pages)).exists(true));
        List<Application> applications = mongockTemplate.find(applicationQuery, Application.class);

        for(Application application: applications) {
            application.getPages().forEach(page -> {
                page.setDefaultPageId(page.getId());
            });

            if (!CollectionUtils.isEmpty(application.getPublishedPages())) {
                application.getPublishedPages().forEach(page -> {
                    page.setDefaultPageId(page.getId());
                });
            }
            mongockTemplate.save(application);
        }

        // Update pages for defaultIds (applicationId, pageId) along-with the defaultActionIds for onPageLoadActions
        final Query pageQuery = query(where(fieldName(QNewPage.newPage.deleted)).ne(true));
        pageQuery.fields()
                .include(fieldName(QNewPage.newPage.id));

        List<NewPage> pages = mongockTemplate.find(pageQuery, NewPage.class);

        for (NewPage onlyIdPage : pages) {

            // Fetch one page at a time to avoid OOM.
            NewPage page = mongockTemplate.findOne(
                    query(where(fieldName(QNewPage.newPage.id)).is(onlyIdPage.getId())),
                    NewPage.class
            );

            String applicationId = page.getApplicationId();
            final Update defaultResourceUpdates = new Update();
            DefaultResources defaults = new DefaultResources();
            defaults.setPageId(page.getId());
            defaults.setApplicationId(applicationId);

            defaultResourceUpdates.set(fieldName(QNewPage.newPage.defaultResources), defaults);

            // Update gitSyncId
            final String gitSyncId = applicationId + "_" + new ObjectId();
            defaultResourceUpdates.set(fieldName(QNewPage.newPage.gitSyncId), gitSyncId);

            if (!CollectionUtils.isEmpty(page.getUnpublishedPage().getLayouts())) {
                page.getUnpublishedPage()
                        .getLayouts()
                        .stream()
                        .filter(layout -> !CollectionUtils.isEmpty(layout.getLayoutOnLoadActions()))
                        .forEach(layout -> layout.getLayoutOnLoadActions()
                                .forEach(dslActionDTOS -> dslActionDTOS.forEach(actionDTO -> actionDTO.setDefaultActionId(actionDTO.getId()))));
            }

            defaultResourceUpdates.set(fieldName(QNewPage.newPage.unpublishedPage) + "." + "layouts", page.getUnpublishedPage().getLayouts());

            if (page.getPublishedPage() != null && !CollectionUtils.isEmpty(page.getPublishedPage().getLayouts())) {
                page.getPublishedPage()
                        .getLayouts()
                        .stream()
                        .filter(layout -> !CollectionUtils.isEmpty(layout.getLayoutOnLoadActions()))
                        .forEach(layout -> layout.getLayoutOnLoadActions()
                                .forEach(dslActionDTOS -> dslActionDTOS.forEach(actionDTO -> actionDTO.setDefaultActionId(actionDTO.getId()))));

                defaultResourceUpdates.set(fieldName(QNewPage.newPage.publishedPage) + "." + "layouts", page.getPublishedPage().getLayouts());
            }

            if (!StringUtils.isEmpty(applicationId) ) {
                mongockTemplate.updateFirst(
                        query(where(fieldName(QNewPage.newPage.id)).is(page.getId())),
                        defaultResourceUpdates,
                        NewPage.class
                );
            }
        }

        // Update actions
        final Query actionQuery = query(where(fieldName(QNewAction.newAction.deleted)).ne(true))
                .addCriteria(where(fieldName(QNewAction.newAction.applicationId)).exists(true));

        actionQuery.fields()
                .include(fieldName(QNewAction.newAction.id));

        List<NewAction> actions = mongockTemplate.find(actionQuery, NewAction.class);

        for (NewAction actionIdOnly : actions) {
            // Fetch one action at a time to avoid OOM.
            final NewAction action = mongockTemplate.findOne(
                    query(where(fieldName(QNewAction.newAction.id)).is(actionIdOnly.getId())),
                    NewAction.class
            );

            String applicationId = action.getApplicationId();
            if (StringUtils.isEmpty(applicationId)) {
                continue;
            }
            final Update defaultResourceUpdates = new Update();

            DefaultResources defaults = new DefaultResources();
            defaults.setActionId(action.getId());
            defaults.setApplicationId(applicationId);
            defaultResourceUpdates.set(fieldName(QNewAction.newAction.defaultResources), defaults);

            ActionDTO unpublishedAction = action.getUnpublishedAction();
            if (unpublishedAction != null) {
                DefaultResources unpublishedActionDTODefaults = new DefaultResources();
                unpublishedActionDTODefaults.setPageId(unpublishedAction.getPageId());
                unpublishedActionDTODefaults.setCollectionId(unpublishedAction.getCollectionId());
                defaultResourceUpdates.set(
                        fieldName(QNewAction.newAction.unpublishedAction) + "." + fieldName(QNewAction.newAction.unpublishedAction.defaultResources),
                        unpublishedActionDTODefaults
                );
            }

            ActionDTO publishedAction = action.getPublishedAction();
            if (publishedAction != null) {
                DefaultResources publishedActionDTODefaults = new DefaultResources();
                publishedActionDTODefaults.setPageId(publishedAction.getPageId());
                publishedActionDTODefaults.setCollectionId(publishedAction.getCollectionId());
                defaultResourceUpdates.set(
                        fieldName(QNewAction.newAction.publishedAction) + "." + fieldName(QNewAction.newAction.publishedAction.defaultResources),
                        publishedActionDTODefaults
                );
            }

            // Update gitSyncId
            final String gitSyncId = applicationId + "_" + new ObjectId();
            defaultResourceUpdates.set(fieldName(QNewAction.newAction.gitSyncId), gitSyncId);


            mongockTemplate.updateFirst(
                    query(where(fieldName(QNewAction.newAction.id)).is(action.getId())),
                    defaultResourceUpdates,
                    NewAction.class
            );
        }

        // Update JS collection
        final Query actionCollectionQuery = query(where(fieldName(QActionCollection.actionCollection.deleted)).ne(true))
                .addCriteria(where(fieldName(QActionCollection.actionCollection.applicationId)).exists(true));

        actionCollectionQuery.fields()
                .include(fieldName(QActionCollection.actionCollection.applicationId))
                .include(fieldName(QActionCollection.actionCollection.unpublishedCollection) + "." + fieldName(QActionCollection.actionCollection.unpublishedCollection.pageId))
                .include(fieldName(QActionCollection.actionCollection.publishedCollection) + "." + fieldName(QActionCollection.actionCollection.publishedCollection.pageId))
                .include(fieldName(QActionCollection.actionCollection.unpublishedCollection) + "." + fieldName(QActionCollection.actionCollection.unpublishedCollection.actionIds))
                .include(fieldName(QActionCollection.actionCollection.unpublishedCollection) + "." + fieldName(QActionCollection.actionCollection.unpublishedCollection.archivedActionIds))
                .include(fieldName(QActionCollection.actionCollection.publishedCollection) + "." + fieldName(QActionCollection.actionCollection.publishedCollection.actionIds))
                .include(fieldName(QActionCollection.actionCollection.publishedCollection) + "." + fieldName(QActionCollection.actionCollection.publishedCollection.archivedActionIds));


        List<ActionCollection> collections = mongockTemplate.find(actionCollectionQuery, ActionCollection.class);

        for (ActionCollection collection : collections) {

            final Update defaultResourceUpdates = new Update();

            String applicationId = collection.getApplicationId();
            DefaultResources defaults = new DefaultResources();
            defaults.setCollectionId(collection.getId());
            defaults.setApplicationId(applicationId);

            defaultResourceUpdates.set(fieldName(QActionCollection.actionCollection.defaultResources), defaults);

            ActionCollectionDTO unpublishedCollection = collection.getUnpublishedCollection();
            if (unpublishedCollection != null) {
                if (!CollectionUtils.isEmpty(unpublishedCollection.getActionIds())) {
                    Map<String, String> defaultIdMap = new HashMap<>();
                    unpublishedCollection.getActionIds().forEach(actionId -> defaultIdMap.put(actionId, actionId));
                    defaultResourceUpdates.set(
                            fieldName(QActionCollection.actionCollection.unpublishedCollection) + "." + fieldName(QActionCollection.actionCollection.unpublishedCollection.defaultToBranchedActionIdsMap),
                            defaultIdMap
                    );
                    // Remove actionIds from set as this will now be deprecated
                    defaultResourceUpdates.set(
                            fieldName(QActionCollection.actionCollection.unpublishedCollection) + "." + fieldName(QActionCollection.actionCollection.unpublishedCollection.actionIds),
                            null
                    );
                }
                if (!CollectionUtils.isEmpty(unpublishedCollection.getArchivedActionIds())) {
                    Map<String, String> defaultArchiveIdMap = new HashMap<>();
                    unpublishedCollection.getArchivedActionIds().forEach(actionId -> defaultArchiveIdMap.put(actionId, actionId));
                    defaultResourceUpdates.set(
                            fieldName(QActionCollection.actionCollection.unpublishedCollection) + "." + fieldName(QActionCollection.actionCollection.unpublishedCollection.defaultToBranchedArchivedActionIdsMap),
                            defaultArchiveIdMap
                    );
                    defaultResourceUpdates.set(
                            fieldName(QActionCollection.actionCollection.unpublishedCollection) + "." + fieldName(QActionCollection.actionCollection.unpublishedCollection.archivedActionIds),
                            null
                    );
                }

                DefaultResources unpubDefaults = new DefaultResources();
                unpubDefaults.setPageId(unpublishedCollection.getPageId());
                defaultResourceUpdates.set(
                        fieldName(QActionCollection.actionCollection.unpublishedCollection) + "." + FieldName.DEFAULT_RESOURCES,
                        unpubDefaults
                );
            }

            ActionCollectionDTO publishedCollection = collection.getPublishedCollection();
            if (publishedCollection != null) {
                if (!CollectionUtils.isEmpty(publishedCollection.getActionIds())) {
                    Map<String, String> defaultIdMap = new HashMap<>();
                    publishedCollection.getActionIds().forEach(actionId -> defaultIdMap.put(actionId, actionId));
                    publishedCollection.setDefaultToBranchedActionIdsMap(defaultIdMap);
                    defaultResourceUpdates.set(
                            fieldName(QActionCollection.actionCollection.publishedCollection) + "." + fieldName(QActionCollection.actionCollection.publishedCollection.defaultToBranchedActionIdsMap),
                            defaultIdMap
                    );

                    defaultResourceUpdates.set(
                            fieldName(QActionCollection.actionCollection.publishedCollection) + "." + fieldName(QActionCollection.actionCollection.publishedCollection.actionIds),
                            null
                    );
                }
                if (!CollectionUtils.isEmpty(publishedCollection.getArchivedActions())) {
                    Map<String, String> defaultArchiveIdMap = new HashMap<>();
                    publishedCollection.getArchivedActionIds().forEach(actionId -> defaultArchiveIdMap.put(actionId, actionId));
                    publishedCollection.setDefaultToBranchedArchivedActionIdsMap(defaultArchiveIdMap);
                    defaultResourceUpdates.set(
                            fieldName(QActionCollection.actionCollection.publishedCollection) + "." + fieldName(QActionCollection.actionCollection.publishedCollection.defaultToBranchedArchivedActionIdsMap),
                            defaultArchiveIdMap
                    );

                    defaultResourceUpdates.set(
                            fieldName(QActionCollection.actionCollection.publishedCollection) + "." + fieldName(QActionCollection.actionCollection.publishedCollection.archivedActionIds),
                            null
                    );
                }

                DefaultResources pubDefaults = new DefaultResources();
                pubDefaults.setPageId(publishedCollection.getPageId());
                defaultResourceUpdates.set(
                        fieldName(QActionCollection.actionCollection.publishedCollection) + "." + FieldName.DEFAULT_RESOURCES,
                        pubDefaults
                );
            }

            // Update gitSyncId
            final String gitSyncId = applicationId + "_" + new ObjectId();
            defaultResourceUpdates.set(fieldName(QActionCollection.actionCollection.gitSyncId), gitSyncId);

            if (!StringUtils.isEmpty(applicationId)) {
                mongockTemplate.updateFirst(
                        query(where(fieldName(QActionCollection.actionCollection.id)).is(collection.getId())),
                        defaultResourceUpdates,
                        ActionCollection.class
                );
            }
        }

        // Update comment threads
        final Query threadQuery = query(where(fieldName(QCommentThread.commentThread.deleted)).ne(true));
        threadQuery.fields()
                .include(fieldName(QCommentThread.commentThread.applicationId))
                .include(fieldName((QCommentThread.commentThread.pageId)));

        List<CommentThread> threads = mongockTemplate.find(threadQuery, CommentThread.class);

        for (CommentThread thread : threads) {
            DefaultResources defaults = new DefaultResources();
            defaults.setPageId(thread.getPageId());
            defaults.setApplicationId(thread.getApplicationId());

            final Update defaultResourceUpdates = new Update();

            defaultResourceUpdates.set(fieldName(QCommentThread.commentThread.defaultResources), defaults);
            mongockTemplate.updateFirst(
                    query(where(fieldName(QCommentThread.commentThread.id)).is(thread.getId())),
                    defaultResourceUpdates,
                    CommentThread.class
            );
        }

        // Update comment
        final Query commentQuery = query(where(fieldName(QComment.comment.deleted)).ne(true));
        commentQuery.fields()
                .include(fieldName(QComment.comment.applicationId))
                .include(fieldName((QComment.comment.pageId)));

        List<Comment> comments = mongockTemplate.find(commentQuery, Comment.class);

        for (Comment comment : comments) {
            DefaultResources defaults = new DefaultResources();
            defaults.setPageId(comment.getPageId());
            defaults.setApplicationId(comment.getApplicationId());

            final Update defaultResourceUpdates = new Update();

            defaultResourceUpdates.set(fieldName(QComment.comment.defaultResources), defaults);
            mongockTemplate.updateFirst(
                    query(where(fieldName(QComment.comment.id)).is(comment.getId())),
                    defaultResourceUpdates,
                    Comment.class
            );
        }

        // Update notification
        final Query notificationQuery = query(where(fieldName(QNotification.notification.deleted)).ne(true));

        List<? extends Notification> notifications = mongockTemplate.find(notificationQuery, Notification.class);

        notifications.forEach(notification -> {
            final Update defaultResourceUpdates = new Update();
            DefaultResources defaults = new DefaultResources();
            if (notification instanceof CommentNotification) {
                Comment comment = ((CommentNotification) notification).getComment();
                defaults.setPageId(comment.getPageId());
                defaults.setApplicationId(comment.getApplicationId());

                defaultResourceUpdates.set(
                        fieldName(QCommentNotification.commentNotification.comment) + "." + DEFAULT_RESOURCES,
                        defaults
                );
            } else if (notification instanceof CommentThreadNotification) {
                CommentThread thread = ((CommentThreadNotification) notification).getCommentThread();
                defaults.setPageId(thread.getPageId());
                defaults.setApplicationId(thread.getApplicationId());

                defaultResourceUpdates.set(
                        fieldName(QCommentThreadNotification.commentThreadNotification.commentThread) + "." + DEFAULT_RESOURCES,
                        defaults
                );
            }

            mongockTemplate.updateFirst(
                    query(where(fieldName(QNotification.notification.id)).is(notification.getId())),
                    defaultResourceUpdates,
                    Notification.class
            );
        });
    }

    @ChangeSet(order = "102", id = "flush-spring-redis-keys", author = "")
    public void clearRedisCache(ReactiveRedisOperations<String, String> reactiveRedisOperations) {
        final String script =
                "for _,k in ipairs(redis.call('keys','spring:session:sessions:*'))" +
                        " do redis.call('del',k) " +
                        "end";
        final Flux<Object> flushdb = reactiveRedisOperations.execute(RedisScript.of(script));

        flushdb.subscribe();
    }

    /* Map values from pluginSpecifiedTemplates to formData (UQI) */
    public final static Map<Integer, List<String>> firestoreMigrationMap = Map.ofEntries(
            Map.entry(0, List.of("command")),
            Map.entry(1, List.of("orderBy")),
            Map.entry(2, List.of("limitDocuments")),
            Map.entry(3, List.of("where")),
            Map.entry(4, List.of("")), // index 4 is not used in pluginSpecifiedTemplates
            Map.entry(5, List.of("")), // index 5 is not used in pluginSpecifiedTemplates
            Map.entry(6, List.of("startAfter")),
            Map.entry(7, List.of("endBefore")),
            Map.entry(8, List.of("timestampValuePath")),
            Map.entry(9, List.of("deleteKeyPath"))
    );

    /**
     * This map indicates which fields in pluginSpecifiedTemplates require a transformation before their data can be
     * migrated to the UQI schema.
     * The key contains the index of the data that needs transformation and the value indicates the which kind of
     * transformation is required. e.g. (3, "where-clause-migration") indicates that the value against index 3 in
     * pluginSpecifiedTemplates needs to be migrated by the rules identified by the string "where-clause-migration".
     * The rules are defined in the class UQIMigrationDataTransformer.
     */
    public static final Map<Integer, String> firestoreUQIDataTransformationMap = Map.ofEntries(
            Map.entry(3, "where-clause-migration")
    );

    @ChangeSet(order = "103", id = "migrate-firestore-to-uqi", author = "")
    public void migrateFirestorePluginToUqi(MongockTemplate mongockTemplate) {

        // Update Firestore plugin to indicate use of UQI schema
        Plugin firestorePlugin = mongockTemplate.findOne(
                query(where("packageName").is("firestore-plugin")),
                Plugin.class
        );
        firestorePlugin.setUiComponent("UQIDbEditorForm");

        // Find all Firestore actions
        final Query firestoreActionQuery = query(
                where(fieldName(QNewAction.newAction.pluginId)).is(firestorePlugin.getId())
                        .and(fieldName(QNewAction.newAction.deleted)).is(true) // Update: Should have been .ne(true)
        );
        firestoreActionQuery.fields()
                .include(fieldName(QNewAction.newAction.id));

        List<NewAction> firestoreActions = mongockTemplate.find(
                firestoreActionQuery,
                NewAction.class
        );

        migrateFirestoreToUQI(mongockTemplate, firestoreActions);

        // Update plugin data.
        mongockTemplate.save(firestorePlugin);
    }

    private void migrateFirestoreToUQI(MongockTemplate mongockTemplate, List<NewAction> firestoreActions) {
        for (NewAction firestoreActionId : firestoreActions) {

            // Fetch one page at a time to avoid OOM.
            final NewAction firestoreAction = mongockTemplate.findOne(
                    query(where(fieldName(QNewAction.newAction.id)).is(firestoreActionId.getId())),
                    NewAction.class
            );

            ActionDTO unpublishedAction = firestoreAction.getUnpublishedAction();

            /* No migrations required if action configuration does not exist. */
            if (unpublishedAction == null || unpublishedAction.getActionConfiguration() == null) {
                continue;
            }

            /* It means that earlier migration had succeeded on this action, hence current migration can be skipped. */
            if (!CollectionUtils.isEmpty(unpublishedAction.getActionConfiguration().getFormData())) {
                continue;
            }

            List<Property> pluginSpecifiedTemplates = unpublishedAction.getActionConfiguration().getPluginSpecifiedTemplates();
            UQIMigrationDataTransformer uqiMigrationDataTransformer = new UQIMigrationDataTransformer();

            /**
             * Migrate unpublished action configuration data.
             * Create `formData` used in UQI schema from the `pluginSpecifiedTemplates` used earlier.
             */
            unpublishedAction.getActionConfiguration().setFormData(
                    iteratePluginSpecifiedTemplatesAndCreateFormDataMultipleOptions(pluginSpecifiedTemplates,
                            firestoreMigrationMap, firestoreUQIDataTransformationMap, uqiMigrationDataTransformer,
                            "firestore-plugin")
            );

            /* `pluginSpecifiedTemplates` is no longer required since `formData` will be used in UQI schema. */
            unpublishedAction.getActionConfiguration().setPluginSpecifiedTemplates(null);

            /**
             * Migrate published action configuration data.
             * Create `formData` used in UQI schema from the `pluginSpecifiedTemplates` used earlier.
             */
            ActionDTO publishedAction = firestoreAction.getPublishedAction();
            if (publishedAction != null && publishedAction.getActionConfiguration() != null &&
                    publishedAction.getActionConfiguration().getPluginSpecifiedTemplates() != null) {
                pluginSpecifiedTemplates = publishedAction.getActionConfiguration().getPluginSpecifiedTemplates();
                publishedAction.getActionConfiguration().setFormData(
                        iteratePluginSpecifiedTemplatesAndCreateFormDataMultipleOptions(pluginSpecifiedTemplates,
                                firestoreMigrationMap, firestoreUQIDataTransformationMap, uqiMigrationDataTransformer
                                , "firestore-plugin")
                );

                /* `pluginSpecifiedTemplates` is no longer required since `formData` will be used in UQI schema. */
                publishedAction.getActionConfiguration().setPluginSpecifiedTemplates(null);
            }

            /**
             * Migrate the dynamic binding path list for unpublished action.
             * Please note that there is no requirement to migrate the dynamic binding path list for published actions
             * since the `on page load` actions do not get computed on published actions data. They are only computed
             * on unpublished actions data and copied over for the view mode.
             */
            List<Property> dynamicBindingPathList = unpublishedAction.getDynamicBindingPathList();
            List<Property> newDynamicBindingPathList = getUpdatedDynamicBindingPathList(dynamicBindingPathList,
                    objectMapper, firestoreAction, firestoreMigrationMap);
            unpublishedAction.setDynamicBindingPathList(newDynamicBindingPathList);

            mongockTemplate.save(firestoreAction);
        }
    }

    /**
     * This migration was required because migration numbered 103 had an error - it fetched all actions which had
     * `deleted` set to true instead of the other way around.
     */
    @ChangeSet(order = "104", id = "migrate-firestore-to-uqi-2", author = "")
    public void migrateFirestorePluginToUqi2(MongockTemplate mongockTemplate) {

        // Update Firestore plugin to indicate use of UQI schema
        Plugin firestorePlugin = mongockTemplate.findOne(
                query(where("packageName").is("firestore-plugin")),
                Plugin.class
        );

        // Find all Firestore actions
        final Query firestoreActionQuery = query(
                where(fieldName(QNewAction.newAction.pluginId)).is(firestorePlugin.getId())
                        .and(fieldName(QNewAction.newAction.deleted)).ne(true)); // setting `deleted` != `true`
        firestoreActionQuery.fields()
                .include(fieldName(QNewAction.newAction.id));

        List<NewAction> firestoreActions = mongockTemplate.find(
                firestoreActionQuery,
                NewAction.class
        );

        migrateFirestoreToUQI(mongockTemplate, firestoreActions);
    }

    @ChangeSet(order = "105", id = "migrate-firestore-pagination-data", author = "")
    public void migrateFirestorePaginationData(MongockTemplate mongockTemplate) {
        Plugin firestorePlugin = mongockTemplate.findOne(
                query(where("packageName").is("firestore-plugin")),
                Plugin.class
        );

        // Query to get action id from all Firestore actions
        Query queryToGetActionIds =query(
                where(fieldName(QNewAction.newAction.pluginId)).is(firestorePlugin.getId())
                        .and(fieldName(QNewAction.newAction.deleted)).ne(true)
        );
        queryToGetActionIds.fields()
                .include(fieldName(QNewAction.newAction.id));

        // Get list of Firestore action ids
        List<NewAction> firestoreActionIds = mongockTemplate.find(
                queryToGetActionIds,
                NewAction.class
        );

        // Iterate over each action id and operate on each action one by one.
        for (NewAction firestoreActionId : firestoreActionIds) {

            // Fetch one action at a time to avoid OOM.
            final NewAction firestoreAction = mongockTemplate.findOne(
                    query(where(fieldName(QNewAction.newAction.id)).is(firestoreActionId.getId())),
                    NewAction.class
            );

            ActionDTO unpublishedAction = firestoreAction.getUnpublishedAction();

            // No migrations required if action configuration does not exist.
            if (unpublishedAction == null || unpublishedAction.getActionConfiguration() == null ) {
                continue;
            }

            // Migrate unpublished action config data
            if (unpublishedAction.getActionConfiguration().getFormData() != null) {
                Map formData = unpublishedAction.getActionConfiguration().getFormData();

                String startAfter = getValueSafelyFromFormData(formData, START_AFTER, String.class, "{}");
                unpublishedAction.getActionConfiguration().setNext(startAfter);

                String endBefore = getValueSafelyFromFormData(formData, END_BEFORE, String.class, "{}");
                unpublishedAction.getActionConfiguration().setPrev(endBefore);
            }

            // Migrate published action config data.
            ActionDTO publishedAction = firestoreAction.getPublishedAction();
            if (publishedAction != null && publishedAction.getActionConfiguration() != null &&
                    publishedAction.getActionConfiguration().getFormData() != null) {
                Map formData = publishedAction.getActionConfiguration().getFormData();

                String startAfter = getValueSafelyFromFormData(formData, START_AFTER, String.class, "{}");
                publishedAction.getActionConfiguration().setNext(startAfter);

                String endBefore = getValueSafelyFromFormData(formData, END_BEFORE, String.class, "{}");
                publishedAction.getActionConfiguration().setPrev(endBefore);
            }

            mongockTemplate.save(firestoreAction);
        }
    }

    @ChangeSet(order = "106", id = "update-mongodb-mockdb-endpoint", author = "")
    public void updateMongoMockdbEndpoint(MongockTemplate mongockTemplate) {
        mongockTemplate.updateMulti(
                query(where("datasourceConfiguration.endpoints.host").is("mockdb.swrsq.mongodb.net")),
                update("datasourceConfiguration.endpoints.$.host", "mockdb.kce5o.mongodb.net"),
                Datasource.class
        );
        mongockTemplate.updateMulti(
                query(where("datasourceConfiguration.properties.value").is("mongodb+srv://mockdb_super:****@mockdb.swrsq.mongodb.net/movies")),
                update("datasourceConfiguration.properties.$.value", "mongodb+srv://mockdb_super:****@mockdb.kce5o.mongodb.net/movies"),
                Datasource.class
        );
    }

    /**
     * This migration was required because migration numbered 104 failed on prod due to ClassCastException on some
     * unexpected / bad older data.
     */
    @ChangeSet(order = "107", id = "migrate-firestore-to-uqi-3", author = "")
    public void migrateFirestorePluginToUqi3(MongockTemplate mongockTemplate) {
        // Update Firestore plugin to indicate use of UQI schema
        Plugin firestorePlugin = mongockTemplate.findOne(
                query(where("packageName").is("firestore-plugin")),
                Plugin.class
        );
        firestorePlugin.setUiComponent("UQIDbEditorForm");

        // Find all Firestore actions
        final Query firestoreActionQuery = query(
                where(fieldName(QNewAction.newAction.pluginId)).is(firestorePlugin.getId())
                        .and(fieldName(QNewAction.newAction.deleted)).ne(true)); // setting `deleted` != `true`
        firestoreActionQuery.fields()
                .include(fieldName(QNewAction.newAction.id));

        List<NewAction> firestoreActions = mongockTemplate.find(
                firestoreActionQuery,
                NewAction.class
        );

        migrateFirestoreToUQI(mongockTemplate, firestoreActions);

        // Update plugin data.
        mongockTemplate.save(firestorePlugin);
    }

    @ChangeSet(order = "108", id = "create-system-themes", author = "")
    public void createSystemThemes(MongockTemplate mongockTemplate) throws IOException {
        Index uniqueApplicationIdIndex = new Index()
                .on(fieldName(QTheme.theme.isSystemTheme), Sort.Direction.ASC)
                .named("system_theme_index");

        ensureIndexes(mongockTemplate, Theme.class, uniqueApplicationIdIndex);

        final String themesJson = StreamUtils.copyToString(
                new DefaultResourceLoader().getResource("system-themes.json").getInputStream(),
                Charset.defaultCharset()
        );
        Theme[] themes = new Gson().fromJson(themesJson, Theme[].class);

        Theme legacyTheme = null;
        for (Theme theme : themes) {
            theme.setSystemTheme(true);
            Theme savedTheme = mongockTemplate.save(theme);
            if(savedTheme.getName().equalsIgnoreCase(Theme.LEGACY_THEME_NAME)) {
                legacyTheme = savedTheme;
            }
        }

        // migrate all applications and set legacy theme to them in both mode
        Update update = new Update().set(fieldName(QApplication.application.publishedModeThemeId), legacyTheme.getId())
                .set(fieldName(QApplication.application.editModeThemeId), legacyTheme.getId());
        mongockTemplate.updateMulti(
                new Query(where(fieldName(QApplication.application.deleted)).is(false)), update, Application.class
        );
    }

    /**
     * This method sets the key formData.aggregate.limit to 101 for all Mongo plugin actions.
     * It iterates over each action id one by one to avoid out of memory error.
     * @param mongoActions
     * @param mongockTemplate
     */
    private void updateLimitFieldForEachAction(List<NewAction> mongoActions, MongockTemplate mongockTemplate) {
        mongoActions.stream()
                .map(NewAction::getId) // iterate over one action id at a time
                .map(actionId -> fetchActionUsingId(actionId, mongockTemplate)) // fetch action using id
                .filter(this::hasUnpublishedActionConfiguration)
                .forEachOrdered(mongoAction -> {
                    /* set key for unpublished action */
                    Map<String, Object> unpublishedFormData =
                            mongoAction.getUnpublishedAction().getActionConfiguration().getFormData();
                    setValueSafelyInFormData(unpublishedFormData, AGGREGATE_LIMIT, DEFAULT_BATCH_SIZE);

                    /* set key for published action */
                    if (hasPublishedActionConfiguration(mongoAction)) {
                        Map<String, Object> publishedFormData =
                                mongoAction.getPublishedAction().getActionConfiguration().getFormData();
                        setValueSafelyInFormData(publishedFormData, AGGREGATE_LIMIT, DEFAULT_BATCH_SIZE);
                    }

                    mongockTemplate.save(mongoAction);
                });
    }

    /**
     * Returns true only if the action has non-null published actionConfiguration.
     * @param action
     * @return true / false
     */
    private boolean hasPublishedActionConfiguration(NewAction action) {
        ActionDTO publishedAction = action.getPublishedAction();
        if (publishedAction == null || publishedAction.getActionConfiguration() == null) {
            return false;
        }

        return true;
    }

    /**
     * This migration adds a new field to Mongo aggregate command to set batchSize: formData.aggregate.limit. Its value
     * is set by this migration to 101 for all existing actions since this is the default `batchSize` used by
     * Mongo database - this is the same value that would have been applied to the aggregate cmd so far by the
     * database. However, for any new action, this field's initial value is 10.
     * Ref: https://docs.mongodb.com/manual/tutorial/iterate-a-cursor/
     * @param mongockTemplate
     */
    @ChangeSet(order = "109", id = "add-limit-field-data-to-mongo-aggregate-cmd", author = "")
    public void addLimitFieldDataToMongoAggregateCommand(MongockTemplate mongockTemplate) {
        Plugin mongoPlugin = mongockTemplate.findOne(query(where("packageName").is("mongo-plugin")), Plugin.class);

        /* Query to get all Mongo actions which are not deleted */
        Query queryToGetActions = getQueryToFetchAllPluginActionsWhichAreNotDeleted(mongoPlugin);

        /* Update the previous query to only include id field */
        queryToGetActions.fields().include(fieldName(QNewAction.newAction.id));

        /* Fetch Mongo actions using the previous query */
        List<NewAction> mongoActions = mongockTemplate.find(queryToGetActions, NewAction.class);

        /* insert key formData.aggregate.limit */
        updateLimitFieldForEachAction(mongoActions, mongockTemplate);
    }

    /**
     * Returns true only if the action has non-null un-published actionConfiguration.
     * @param action
     * @return true / false
     */
    private boolean hasUnpublishedActionConfiguration(NewAction action) {
        ActionDTO unpublishedAction = action.getUnpublishedAction();
        if (unpublishedAction == null || unpublishedAction.getActionConfiguration() == null) {
            return false;
        }

        return true;
    }

    /**
     * Fetch an action using id.
     * @param actionId
     * @param mongockTemplate
     * @return action
     */
    private NewAction fetchActionUsingId(String actionId, MongockTemplate mongockTemplate) {
        final NewAction action =
                mongockTemplate.findOne(query(where(fieldName(QNewAction.newAction.id)).is(actionId)), NewAction.class);
        return action;
    }

    /**
     * Generate query to fetch all non-deleted actions defined for a given plugin.
     * @param plugin
     * @return query
     */
    private Query getQueryToFetchAllPluginActionsWhichAreNotDeleted(Plugin plugin) {
        Criteria pluginIdIsMongoPluginId = where("pluginId").is(plugin.getId());
        Criteria isNotDeleted = where("deleted").ne(true);
        return query((new Criteria()).andOperator(pluginIdIsMongoPluginId, isNotDeleted));
    }

    /**
     * This migration introduces indexes on newAction, actionCollection, newPage and application collection to take
     * branchName param into consideration for optimising the find query for git connected applications
     */
    @ChangeSet(order = "110", id = "update-index-for-git", author = "")
    public void updateGitIndexes(MongockTemplate mongockTemplate) {

        // We can't set unique indexes for following as these requires the _id of the resource to be filled in for
        // defaultResourceId if the app is not connected to git. This results in handling the _id creation for resources
        // on our end instead of asking mongo driver to perform this operation
        ensureIndexes(mongockTemplate, NewAction.class,
                makeIndex("defaultResources.actionId", "defaultResources.branchName", "deleted")
                        .named("defaultActionId_branchName_deleted_compound_index")
        );

        ensureIndexes(mongockTemplate, ActionCollection.class,
                makeIndex("defaultResources.collectionId", "defaultResources.branchName", "deleted")
                        .named("defaultCollectionId_branchName_deleted_compound_index")
        );

        ensureIndexes(mongockTemplate, NewPage.class,
                makeIndex("defaultResources.pageId", "defaultResources.branchName", "deleted")
                        .named("defaultPageId_branchName_deleted_compound_index")
        );

        ensureIndexes(mongockTemplate, Application.class,
                makeIndex("gitApplicationMetadata.defaultApplicationId", "gitApplicationMetadata.branchName", "deleted")
                        .named("defaultApplicationId_branchName_deleted_compound_index")
        );
    }

    @ChangeSet(order = "111", id = "update-mockdb-endpoint-2", author = "")
    public void updateMockdbEndpoint2(MongockTemplate mongockTemplate) {
        // Doing this again as another migration since it appears some new datasource were created with the old
        // endpoint around 14-Dec-2021 to 16-Dec-2021.
        updateMockdbEndpoint(mongockTemplate);
    }

    @ChangeSet(order = "111", id = "migrate-from-RSA-SHA1-to-ECDSA-SHA2-protocol-for-key-generation", author = "")
    public void migrateFromRSASha1ToECDSASha2Protocol(MongockTemplate mongockTemplate) {
        Query query = new Query();
        query.addCriteria(Criteria.where("gitApplicationMetadata.gitAuth").exists(TRUE));
        query.addCriteria(Criteria.where("deleted").is(FALSE));

        for (Application application : mongockTemplate.find(query, Application.class)) {
            if(!Optional.ofNullable(application.getGitApplicationMetadata()).isEmpty()) {
                GitAuth gitAuth = GitDeployKeyGenerator.generateSSHKey();
                GitApplicationMetadata gitApplicationMetadata = application.getGitApplicationMetadata();
                gitApplicationMetadata.setGitAuth(gitAuth);
                application.setGitApplicationMetadata(gitApplicationMetadata);
                mongockTemplate.save(application);
            }
        }
    }

    @ChangeSet(order = "113", id = "use-assets-cdn-for-plugin-icons", author = "")
    public void useAssetsCDNForPluginIcons(MongockTemplate mongockTemplate) {
        final Query query = query(new Criteria());
        query.fields().include(fieldName(QPlugin.plugin.iconLocation));
        List<Plugin> plugins = mongockTemplate.find(query, Plugin.class);
        for (final Plugin plugin : plugins) {
            if (plugin.getIconLocation() != null && plugin.getIconLocation().startsWith("https://s3.us-east-2.amazonaws.com/assets.appsmith.com")) {
                final String cdnUrl = plugin.getIconLocation().replace("s3.us-east-2.amazonaws.com/", "");
                mongockTemplate.updateFirst(
                        query(where(fieldName(QPlugin.plugin.id)).is(plugin.getId())),
                        update(fieldName(QPlugin.plugin.iconLocation), cdnUrl),
                        Plugin.class
                );
            }
        }
    }

    /**
     * This migration introduces indexes on newAction, actionCollection and userData to improve the query performance
     */
    @ChangeSet(order = "114", id = "update-index-for-newAction-actionCollection-userData", author = "")
    public void updateNewActionActionCollectionAndUserDataIndexes(MongockTemplate mongockTemplate) {

        ensureIndexes(mongockTemplate, ActionCollection.class,
                makeIndex(FieldName.APPLICATION_ID)
                        .named("applicationId")
        );

        ensureIndexes(mongockTemplate, ActionCollection.class,
                makeIndex(fieldName(QActionCollection.actionCollection.unpublishedCollection) + "." + FieldName.PAGE_ID)
                        .named("unpublishedCollection_pageId")
        );

        String defaultResources = fieldName(QBaseDomain.baseDomain.defaultResources);
        ensureIndexes(mongockTemplate, ActionCollection.class,
                makeIndex(defaultResources + "." + FieldName.APPLICATION_ID, FieldName.GIT_SYNC_ID)
                        .named("defaultApplicationId_gitSyncId_compound_index")
        );

        ensureIndexes(mongockTemplate, NewAction.class,
                makeIndex(defaultResources + "." + FieldName.APPLICATION_ID, FieldName.GIT_SYNC_ID)
                        .named("defaultApplicationId_gitSyncId_compound_index")
        );

        ensureIndexes(mongockTemplate, UserData.class,
                makeIndex(fieldName(QUserData.userData.userId))
                        .unique()
                        .named("userId")
        );
    }

    @ChangeSet(order = "115", id = "mark-mssql-crud-unavailable", author = "")
    public void markMSSQLCrudUnavailable(MongockTemplate mongockTemplate) {
        Plugin plugin = mongockTemplate.findOne(query(where("packageName").is("mssql-plugin")), Plugin.class);
        assert plugin != null;
        plugin.setGenerateCRUDPageComponent(null);
        mongockTemplate.save(plugin);
    }

    /**
     * This migration introduces indexes on newAction, actionCollection to improve the query performance for queries like
     * getResourceByPageId which excludes the deleted entries
     */
    @ChangeSet(order = "116", id = "update-index-for-newAction-actionCollection", author = "")
    public void updateNewActionActionCollectionIndexes(MongockTemplate mongockTemplate) {

        dropIndexIfExists(mongockTemplate, NewAction.class, "unpublishedAction_pageId");

        ensureIndexes(mongockTemplate, NewAction.class,
                makeIndex(fieldName(QNewAction.newAction.unpublishedAction) + "." + FieldName.PAGE_ID, FieldName.DELETED)
                        .named("unpublishedActionPageId_deleted_compound_index")
        );

        ensureIndexes(mongockTemplate, NewAction.class,
                makeIndex(fieldName(QNewAction.newAction.publishedAction) + "." + FieldName.PAGE_ID, FieldName.DELETED)
                        .named("publishedActionPageId_deleted_compound_index")
        );

        dropIndexIfExists(mongockTemplate, ActionCollection.class, "unpublishedCollection_pageId");

        ensureIndexes(mongockTemplate, ActionCollection.class,
                makeIndex(fieldName(QActionCollection.actionCollection.unpublishedCollection) + "." + FieldName.PAGE_ID, FieldName.DELETED)
                        .named("unpublishedCollectionPageId_deleted_compound_index")
        );

        ensureIndexes(mongockTemplate, ActionCollection.class,
                makeIndex(fieldName(QActionCollection.actionCollection.publishedCollection) + "." + FieldName.PAGE_ID, FieldName.DELETED)
                        .named("publishedCollectionPageId_deleted_compound_index")
        );
    }

}
