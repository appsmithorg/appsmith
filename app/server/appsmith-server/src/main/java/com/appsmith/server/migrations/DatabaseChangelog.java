package com.appsmith.server.migrations;

import com.appsmith.external.helpers.MustacheHelper;
import com.appsmith.external.models.BaseDomain;
import com.appsmith.external.models.Connection;
import com.appsmith.external.models.DBAuth;
import com.appsmith.external.models.DatasourceConfiguration;
import com.appsmith.external.models.Policy;
import com.appsmith.external.models.Property;
import com.appsmith.external.models.SSLDetails;
import com.appsmith.server.acl.AppsmithRole;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.domains.Action;
import com.appsmith.server.domains.Application;
import com.appsmith.server.domains.Collection;
import com.appsmith.server.domains.Config;
import com.appsmith.server.domains.Datasource;
import com.appsmith.server.domains.Group;
import com.appsmith.server.domains.InviteUser;
import com.appsmith.server.domains.Layout;
import com.appsmith.server.domains.NewAction;
import com.appsmith.server.domains.NewPage;
import com.appsmith.server.domains.Organization;
import com.appsmith.server.domains.OrganizationPlugin;
import com.appsmith.server.domains.Page;
import com.appsmith.server.domains.PasswordResetToken;
import com.appsmith.server.domains.Permission;
import com.appsmith.server.domains.Plugin;
import com.appsmith.server.domains.PluginType;
import com.appsmith.server.domains.QApplication;
import com.appsmith.server.domains.QConfig;
import com.appsmith.server.domains.QDatasource;
import com.appsmith.server.domains.QNewAction;
import com.appsmith.server.domains.QOrganization;
import com.appsmith.server.domains.QPlugin;
import com.appsmith.server.domains.Role;
import com.appsmith.server.domains.Sequence;
import com.appsmith.server.domains.User;
import com.appsmith.server.domains.UserData;
import com.appsmith.server.domains.UserRole;
import com.appsmith.server.dtos.ActionDTO;
import com.appsmith.server.dtos.DslActionDTO;
import com.appsmith.server.dtos.OrganizationPluginStatus;
import com.appsmith.server.dtos.PageDTO;
import com.appsmith.server.services.EncryptionService;
import com.appsmith.server.services.OrganizationService;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.github.cloudyrock.mongock.ChangeLog;
import com.github.cloudyrock.mongock.ChangeSet;
import com.google.gson.Gson;
import com.mongodb.MongoClient;
import com.mongodb.MongoException;
import com.mongodb.client.MongoCollection;
import com.mongodb.client.MongoCursor;
import com.mongodb.client.model.Filters;
import lombok.extern.slf4j.Slf4j;
import net.minidev.json.JSONObject;
import org.apache.commons.lang.ObjectUtils;
import org.bson.Document;
import org.bson.types.ObjectId;
import org.springframework.core.io.DefaultResourceLoader;
import org.springframework.dao.DataAccessException;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.data.domain.Sort;
import org.springframework.data.mongodb.UncategorizedMongoDbException;
import org.springframework.data.mongodb.core.CollectionCallback;
import org.springframework.data.mongodb.core.MongoOperations;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.index.CompoundIndexDefinition;
import org.springframework.data.mongodb.core.index.Index;
import org.springframework.data.mongodb.core.index.IndexOperations;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Update;
import org.springframework.util.CollectionUtils;
import org.springframework.util.StreamUtils;

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
import java.util.regex.Pattern;
import java.util.stream.Collectors;

import static com.appsmith.external.helpers.BeanCopyUtils.copyNewFieldValuesIntoOldObject;
import static com.appsmith.server.acl.AclPermission.EXECUTE_ACTIONS;
import static com.appsmith.server.acl.AclPermission.MAKE_PUBLIC_APPLICATIONS;
import static com.appsmith.server.acl.AclPermission.ORGANIZATION_INVITE_USERS;
import static com.appsmith.server.acl.AclPermission.READ_ACTIONS;
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
     * Given a MongoTemplate, a domain class and a bunch of Index definitions, this pure utility function will ensure
     * those indexes on the database behind the MongoTemplate instance.
     */
    private static void ensureIndexes(MongoTemplate mongoTemplate, Class<?> entityClass, Index... indexes) {
        IndexOperations indexOps = mongoTemplate.indexOps(entityClass);
        for (Index index : indexes) {
            indexOps.ensureIndex(index);
        }
    }

    private static void dropIndexIfExists(MongoTemplate mongoTemplate, Class<?> entityClass, String name) {
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

    private void installPluginToAllOrganizations(MongoTemplate mongoTemplate, String pluginId) {
        for (Organization organization : mongoTemplate.findAll(Organization.class)) {
            if (CollectionUtils.isEmpty(organization.getPlugins())) {
                organization.setPlugins(new ArrayList<>());
            }

            final Set<String> installedPlugins = organization.getPlugins()
                    .stream().map(OrganizationPlugin::getPluginId).collect(Collectors.toSet());

            if (!installedPlugins.contains(pluginId)) {
                organization.getPlugins()
                        .add(new OrganizationPlugin(pluginId, OrganizationPluginStatus.FREE));
            }

            mongoTemplate.save(organization);
        }
    }

    @ChangeSet(order = "001", id = "initial-plugins", author = "")
    public void initialPlugins(MongoTemplate mongoTemplate) {
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
    public void removeOrgNameIndex(MongoTemplate mongoTemplate) {
        dropIndexIfExists(mongoTemplate, Organization.class, "name");
    }

    @ChangeSet(order = "003", id = "add-org-slugs", author = "")
    public void addOrgSlugs(MongoTemplate mongoTemplate, OrganizationService organizationService) {
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
    public void addInitialIndexes(MongoTemplate mongoTemplate) {
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
    public void addApplicationDeletedAtFieldAndIndex(MongoTemplate mongoTemplate) {
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
    public void hideRapidApiPluginFromCreateDatasource(MongoTemplate mongoTemplate) {
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
    public void addDatasourceDeletedAtFieldAndIndex(MongoTemplate mongoTemplate) {
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
    public void addPageDeletedAtFieldAndIndex(MongoTemplate mongoTemplate) {
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
    public void setFriendlyPluginNames(MongoTemplate mongoTemplate) {
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
    public void addDeleteDatasourcePermToExistingGroups(MongoTemplate mongoTemplate) {
        for (Group group : mongoTemplate.findAll(Group.class)) {
            if (CollectionUtils.isEmpty(group.getPermissions())) {
                group.setPermissions(new HashSet<>());
            }
            group.getPermissions().add("delete:datasources");
            mongoTemplate.save(group);
        }
    }

    @ChangeSet(order = "011", id = "install-default-plugins-to-all-organizations", author = "")
    public void installDefaultPluginsToAllOrganizations(MongoTemplate mongoTemplate) {
        final List<Plugin> defaultPlugins = mongoTemplate.find(
                query(where("defaultInstall").is(true)),
                Plugin.class
        );

        mongoTemplate.findAll(Plugin.class);

        for (Organization organization : mongoTemplate.findAll(Organization.class)) {
            if (CollectionUtils.isEmpty(organization.getPlugins())) {
                organization.setPlugins(new ArrayList<>());
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
    public void ensureDatasourceCreatedAndUpdatedAt(MongoTemplate mongoTemplate) {
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
    public void addIndexForSequenceName(MongoTemplate mongoTemplate) {
        ensureIndexes(mongoTemplate, Sequence.class,
                makeIndex(FieldName.NAME).unique()
        );
    }

    @ChangeSet(order = "014", id = "set-initial-sequence-for-datasource", author = "")
    public void setInitialSequenceForDatasource(MongoTemplate mongoTemplate) {
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

    @ChangeSet(order = "016", id = "fix-double-escapes", author = "")
    public void fixDoubleEscapes(MongoTemplate mongoTemplate) {
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
    public void encryptPassword(MongoTemplate mongoTemplate, EncryptionService encryptionService) {
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

        installPluginToAllOrganizations(mongoTemplate, plugin1.getId());
    }

    @ChangeSet(order = "019", id = "update-database-documentation-links", author = "")
    public void updateDatabaseDocumentationLinks(MongoTemplate mongoTemplate) {
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
    public void giveExecutePermissionToReadActionUsers(MongoTemplate mongoTemplate) {
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
    public void giveInvitePermissionToOrganizationsAndPublicPermissionsToApplications(MongoTemplate mongoTemplate) {
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
    public void examplesOrganization(MongoTemplate mongoTemplate, EncryptionService encryptionService) throws IOException {
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
    public void setExampleAppsInConfig(MongoTemplate mongoTemplate) {
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
    public void updateErroneousActionIdsInPage(MongoTemplate mongoTemplate) {
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
                final ArrayList<HashSet<DslActionDTO>> layoutOnLoadActions = new ArrayList<>();
                if (layout.getLayoutOnLoadActions() != null) {
                    layoutOnLoadActions.addAll(layout.getLayoutOnLoadActions());
                }
                if (layout.getPublishedLayoutOnLoadActions() != null) {
                    layoutOnLoadActions.addAll(layout.getPublishedLayoutOnLoadActions());
                }
                for (HashSet<DslActionDTO> actionSet : layoutOnLoadActions) {
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
    public void generateUniqueIdForInstance(MongoTemplate mongoTemplate) {
        mongoTemplate.insert(new Config(
                new JSONObject(Map.of("value", new ObjectId().toHexString())),
                "instance-id"
        ));
    }

    @ChangeSet(order = "026", id = "fix-password-reset-token-expiration", author = "")
    public void fixTokenExpiration(MongoTemplate mongoTemplate) {
        dropIndexIfExists(mongoTemplate, PasswordResetToken.class, FieldName.CREATED_AT);
        dropIndexIfExists(mongoTemplate, PasswordResetToken.class, FieldName.EMAIL);

        ensureIndexes(mongoTemplate, PasswordResetToken.class,
                makeIndex(FieldName.CREATED_AT)
                        .expire(2, TimeUnit.DAYS),
                makeIndex(FieldName.EMAIL).unique()
        );
    }

    @ChangeSet(order = "027", id = "add-elastic-search-plugin", author = "")
    public void addElasticSearchPlugin(MongoTemplate mongoTemplate) {
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
    public void addDynamoPlugin(MongoTemplate mongoTemplate) {
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
    public void usePngLogos(MongoTemplate mongoTemplate) {
        mongoTemplate.updateFirst(
                query(where(fieldName(QPlugin.plugin.packageName)).is("elasticsearch-plugin")),
                update(fieldName(QPlugin.plugin.iconLocation),
                        "https://s3.us-east-2.amazonaws.com/assets.appsmith.com/ElasticSearch.png"),
                Plugin.class
        );
    }

    @ChangeSet(order = "030", id = "add-redis-plugin", author = "")
    public void addRedisPlugin(MongoTemplate mongoTemplate) {
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
    public void addMsSqlPlugin(MongoTemplate mongoTemplate) {
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
    public void addNewPageIndexAfterDroppingNewPage(MongoTemplate mongoTemplate) {
        Index createdAtIndex = makeIndex("createdAt");

        // Drop existing NewPage class
        mongoTemplate.dropCollection(NewPage.class);

        // Now add an index
        ensureIndexes(mongoTemplate, NewPage.class,
                createdAtIndex
        );
    }

    @ChangeSet(order = "038", id = "createNewActionIndexAfterDroppingNewAction", author = "")
    public void addNewActionIndexAfterDroppingNewAction(MongoTemplate mongoTemplate) {
        Index createdAtIndex = makeIndex("createdAt");

        // Drop existing NewAction class
        mongoTemplate.dropCollection(NewAction.class);

        // Now add an index
        ensureIndexes(mongoTemplate, NewAction.class,
                createdAtIndex
        );
    }

    @ChangeSet(order = "039", id = "migrate-page-and-actions", author = "")
    public void migratePage(MongoTemplate mongoTemplate) {
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
    public void addNewPageAndNewActionNewIndexes(MongoTemplate mongoTemplate) {

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
    public void addNewActionIndexForPageId(MongoTemplate mongoTemplate) {

        dropIndexIfExists(mongoTemplate, NewAction.class, "applicationId_deleted_createdAt_compound_index");

        ensureIndexes(mongoTemplate, NewAction.class,
                makeIndex("applicationId", "deleted", "unpublishedAction.pageId")
                        .named("applicationId_deleted_unpublishedPageId_compound_index")
        );
    }

    @ChangeSet(order = "042", id = "update-action-index-to-single-multiple-indices", author = "")
    public void updateActionIndexToSingleMultipleIndices(MongoTemplate mongoTemplate) {

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
    public void addFirestorePlugin(MongoTemplate mongoTemplate) {
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
    public void ensureAppIconsAndColors(MongoTemplate mongoTemplate) {
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
    public void updateAuthenticationTypes(MongoTemplate mongoTemplate) {
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

    @ChangeSet(order = "046", id = "ensure-encrypted-field-for-datasources", author = "")
    public void ensureIsEncryptedFieldForDatasources(MongoTemplate mongoTemplate) {
        final String isEncryptedField = "datasourceConfiguration.authentication.isEncrypted";
        final String passwordField = "datasourceConfiguration.authentication.password";

        final org.springframework.data.mongodb.core.query.Query query = query(new Criteria().andOperator(
                where(passwordField).exists(true),
                where(isEncryptedField).exists(false)
        ));
        query.fields().include("_id");

        for (final Datasource datasource : mongoTemplate.find(query, Datasource.class)) {
            mongoTemplate.updateFirst(
                    query(where(fieldName(QDatasource.datasource.id)).is(datasource.getId())),
                    update(isEncryptedField, true),
                    Datasource.class
            );
        }
    }

    @ChangeSet(order = "047", id = "add-isSendSessionEnabled-key-for-datasources", author = "")
    public void addIsSendSessionEnabledPropertyInDatasources(MongoTemplate mongoTemplate) {

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
    public void addRedshiftPlugin(MongoTemplate mongoTemplate) {
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
    public void clearUserDataCollection(MongoTemplate mongoTemplate) {
        mongoTemplate.dropCollection(UserData.class);
    }

    @ChangeSet(order = "050", id = "update-database-documentation-links-v1-2-1", author = "")
    public void updateDatabaseDocumentationLinks_v1_2_1(MongoTemplate mongoTemplate) {
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

        installPluginToAllOrganizations(mongoTemplate, plugin.getId());
    }

    @ChangeSet(order = "052", id = "add-app-viewer-invite-policy", author = "")
    public void addAppViewerInvitePolicy(MongoTemplate mongoTemplate) {
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

    @ChangeSet(order = "054", id = "update-database-encode-params-toggle", author = "")
    public void updateEncodeParamsToggle(MongoTemplate mongoTemplate) {

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
    public void updatePostgresActionsSetPreparedStatementConfiguration(MongoTemplate mongoTemplate) {

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
    public void fixDynamicBindingPathListForExistingActions(MongoTemplate mongoTemplate) {

        ObjectMapper mapper = new ObjectMapper();
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

    @ChangeSet(order = "057", id = "update-database-action-configuration-timeout", author = "")
    public void updateActionConfigurationTimeout(MongoTemplate mongoTemplate) {

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

            if(updateTimeout) {
                mongoTemplate.save(action);
            }
        }
    }

    @ChangeSet(order = "058", id = "update-s3-datasource-configuration-and-label", author = "")
    public void updateS3DatasourceConfigurationAndLabel(MongoTemplate mongoTemplate) {
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
    public void changeAppLayoutTypeDefinition(MongoOperations mongoOperations, MongoClient mongoClient) {
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
    public void clearExampleApps(MongoTemplate mongoTemplate) {
        mongoTemplate.updateFirst(
                query(where(fieldName(QConfig.config1.name)).is("template-organization")),
                update("config.applicationIds", Collections.emptyList()).set("config.organizationId", null),
                Config.class
        );
    }

    @ChangeSet(order = "061", id = "update-mysql-postgres-mongo-ssl-mode", author = "")
    public void updateMysqlPostgresMongoSslMode(MongoTemplate mongoTemplate) {
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
                    if(datasource.getDatasourceConfiguration() != null) {
                        if(datasource.getDatasourceConfiguration().getConnection() == null) {
                            datasource.getDatasourceConfiguration().setConnection(new Connection());
                        }

                        if(datasource.getDatasourceConfiguration().getConnection().getSsl() == null) {
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
                    if(datasource.getDatasourceConfiguration() != null) {
                        if(datasource.getDatasourceConfiguration().getConnection() == null) {
                            datasource.getDatasourceConfiguration().setConnection(new Connection());
                        }

                        if(datasource.getDatasourceConfiguration().getConnection().getSsl() == null) {
                            datasource.getDatasourceConfiguration().getConnection().setSsl(new SSLDetails());
                        }

                        SSLDetails.AuthType authType = datasource.getDatasourceConfiguration().getConnection().getSsl().getAuthType();
                        if(authType == null
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
}
