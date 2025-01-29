package com.appsmith.server.migrations;

import com.appsmith.external.converters.ISOStringToInstantConverter;
import com.appsmith.external.models.BaseDomain;
import com.appsmith.external.models.Datasource;
import com.appsmith.external.models.GitSyncedDomain;
import com.appsmith.external.models.PluginType;
import com.appsmith.external.models.Policy;
import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.acl.PolicyGenerator;
import com.appsmith.server.configurations.CommonConfig;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.domains.ActionCollection;
import com.appsmith.server.domains.Application;
import com.appsmith.server.domains.Config;
import com.appsmith.server.domains.CustomJSLib;
import com.appsmith.server.domains.NewAction;
import com.appsmith.server.domains.NewPage;
import com.appsmith.server.domains.Organization;
import com.appsmith.server.domains.PermissionGroup;
import com.appsmith.server.domains.Plugin;
import com.appsmith.server.domains.PricingPlan;
import com.appsmith.server.domains.Theme;
import com.appsmith.server.domains.UsagePulse;
import com.appsmith.server.domains.User;
import com.appsmith.server.domains.Workspace;
import com.appsmith.server.dtos.Permission;
import com.appsmith.server.helpers.TextUtils;
import com.appsmith.server.migrations.solutions.UpdateSuperUserMigrationHelper;
import com.appsmith.server.repositories.CacheableRepositoryHelper;
import com.appsmith.server.solutions.PolicySolution;
import com.github.cloudyrock.mongock.ChangeLog;
import com.github.cloudyrock.mongock.ChangeSet;
import com.google.gson.GsonBuilder;
import io.changock.migration.api.annotations.NonLockGuarded;
import lombok.extern.slf4j.Slf4j;
import net.minidev.json.JSONObject;
import org.springframework.core.io.DefaultResourceLoader;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.data.domain.Sort;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.index.Index;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Update;
import org.springframework.data.redis.core.ReactiveRedisOperations;
import org.springframework.util.StreamUtils;

import java.io.IOException;
import java.nio.charset.Charset;
import java.time.Instant;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

import static com.appsmith.server.acl.AclPermission.ASSIGN_PERMISSION_GROUPS;
import static com.appsmith.server.acl.AclPermission.MANAGE_INSTANCE_CONFIGURATION;
import static com.appsmith.server.acl.AclPermission.MANAGE_INSTANCE_ENV;
import static com.appsmith.server.acl.AclPermission.READ_INSTANCE_CONFIGURATION;
import static com.appsmith.server.acl.AclPermission.READ_PERMISSION_GROUP_MEMBERS;
import static com.appsmith.server.acl.AclPermission.READ_THEMES;
import static com.appsmith.server.acl.AppsmithRole.TENANT_ADMIN;
import static com.appsmith.server.constants.EnvVariables.APPSMITH_ADMIN_EMAILS;
import static com.appsmith.server.constants.FieldName.DEFAULT_PERMISSION_GROUP;
import static com.appsmith.server.constants.FieldName.PERMISSION_GROUP_ID;
import static com.appsmith.server.helpers.CollectionUtils.findSymmetricDiff;
import static com.appsmith.server.migrations.DatabaseChangelog1.dropIndexIfExists;
import static com.appsmith.server.migrations.DatabaseChangelog1.ensureIndexes;
import static com.appsmith.server.migrations.DatabaseChangelog1.installPluginToAllWorkspaces;
import static com.appsmith.server.migrations.DatabaseChangelog1.makeIndex;
import static com.appsmith.server.migrations.MigrationHelperMethods.evictPermissionCacheForUsers;
import static org.springframework.data.mongodb.core.query.Criteria.where;
import static org.springframework.data.mongodb.core.query.Query.query;
import static org.springframework.data.mongodb.core.query.Update.update;

@Slf4j
@ChangeLog(order = "002")
public class DatabaseChangelog2 {

    private final UpdateSuperUserMigrationHelper updateSuperUserMigrationHelper = new UpdateSuperUserMigrationHelper();

    @ChangeSet(order = "001", id = "fix-plugin-title-casing", author = "")
    public void fixPluginTitleCasing(MongoTemplate mongoTemplate) {
        mongoTemplate.updateFirst(
                query(where(Plugin.Fields.packageName).is("mysql-plugin")),
                update(Plugin.Fields.name, "MySQL"),
                Plugin.class);

        mongoTemplate.updateFirst(
                query(where(Plugin.Fields.packageName).is("mssql-plugin")),
                update(Plugin.Fields.name, "Microsoft SQL Server"),
                Plugin.class);

        mongoTemplate.updateFirst(
                query(where(Plugin.Fields.packageName).is("elasticsearch-plugin")),
                update(Plugin.Fields.name, "Elasticsearch"),
                Plugin.class);
    }

    /**
     * This migration introduces indexes on newAction, actionCollection, newPage to improve the query performance for
     * queries like getResourceByDefaultAppIdAndGitSyncId which excludes the deleted entries.
     */
    @ChangeSet(order = "007", id = "update-git-indexes", author = "")
    public void addIndexesForGit(MongoTemplate mongoTemplate) {
        doAddIndexesForGit(mongoTemplate);
    }

    public static void doAddIndexesForGit(MongoTemplate mongoTemplate) {
        ensureIndexes(
                mongoTemplate,
                ActionCollection.class,
                makeIndex(
                                "defaultResources." + FieldName.APPLICATION_ID,
                                GitSyncedDomain.Fields.gitSyncId,
                                FieldName.DELETED)
                        .named("defaultApplicationId_gitSyncId_deleted"));

        ensureIndexes(
                mongoTemplate,
                NewAction.class,
                makeIndex(
                                "defaultResources." + FieldName.APPLICATION_ID,
                                GitSyncedDomain.Fields.gitSyncId,
                                FieldName.DELETED)
                        .named("defaultApplicationId_gitSyncId_deleted"));

        ensureIndexes(
                mongoTemplate,
                NewPage.class,
                makeIndex(
                                "defaultResources." + FieldName.APPLICATION_ID,
                                GitSyncedDomain.Fields.gitSyncId,
                                FieldName.DELETED)
                        .named("defaultApplicationId_gitSyncId_deleted"));
    }

    /**
     * We are creating indexes manually because Spring's index resolver creates indexes on fields as well.
     * See https://stackoverflow.com/questions/60867491/ for an explanation of the problem. We have that problem with
     * the `Action.datasource` field.
     */
    @ChangeSet(order = "010", id = "add-workspace-indexes", author = "")
    public void addWorkspaceIndexes(MongoTemplate mongoTemplate) {
        ensureIndexes(mongoTemplate, Workspace.class, makeIndex("createdAt"));
    }

    @ChangeSet(order = "012", id = "add-default-tenant", author = "")
    public void addDefaultTenant(MongoTemplate mongoTemplate) {

        Query tenantQuery = new Query();
        tenantQuery.addCriteria(where(Organization.Fields.slug).is("default"));
        Organization organization = mongoTemplate.findOne(tenantQuery, Organization.class);

        // if organization already exists, don't create a new one.
        if (organization != null) {
            return;
        }

        Organization defaultOrganization = new Organization();
        defaultOrganization.setDisplayName("Default");
        defaultOrganization.setSlug("default");
        defaultOrganization.setPricingPlan(PricingPlan.FREE);

        mongoTemplate.save(defaultOrganization);
    }

    @ChangeSet(order = "016", id = "organization-to-workspace-indexes-recreate", author = "")
    public void organizationToWorkspaceIndexesRecreate(MongoTemplate mongoTemplate) {
        // If this migration is re-run
        dropIndexIfExists(mongoTemplate, Application.class, "workspace_app_deleted_gitApplicationMetadata");
        dropIndexIfExists(mongoTemplate, Datasource.class, "workspace_datasource_deleted_compound_index");

        ensureIndexes(
                mongoTemplate,
                Application.class,
                makeIndex(
                                Application.Fields.workspaceId,
                                Application.Fields.name,
                                Application.Fields.deletedAt,
                                "gitApplicationMetadata.remoteUrl",
                                "gitApplicationMetadata.branchName")
                        .unique()
                        .named("workspace_app_deleted_gitApplicationMetadata"));
        ensureIndexes(
                mongoTemplate,
                Datasource.class,
                makeIndex(Datasource.Fields.workspaceId, Datasource.Fields.name, Datasource.Fields.deletedAt)
                        .unique()
                        .named("workspace_datasource_deleted_compound_index"));
    }

    @ChangeSet(order = "021", id = "flush-spring-redis-keys-2a", author = "")
    public void clearRedisCache2(ReactiveRedisOperations<String, String> reactiveRedisOperations) {
        DatabaseChangelog1.doClearRedisKeys(reactiveRedisOperations);
    }

    @ChangeSet(order = "023", id = "add-anonymousUser", author = "")
    public void addAnonymousUser(MongoTemplate mongoTemplate) {
        Query tenantQuery = new Query();
        tenantQuery.addCriteria(where(Organization.Fields.slug).is("default"));
        Organization organization = mongoTemplate.findOne(tenantQuery, Organization.class);

        Query userQuery = new Query();
        userQuery
                .addCriteria(where(User.Fields.email).is(FieldName.ANONYMOUS_USER))
                .addCriteria(where(User.Fields.tenantId).is(organization.getId()));
        User anonymousUser = mongoTemplate.findOne(userQuery, User.class);

        if (anonymousUser == null) {
            anonymousUser = new User();
            anonymousUser.setName(FieldName.ANONYMOUS_USER);
            anonymousUser.setEmail(FieldName.ANONYMOUS_USER);
            anonymousUser.setWorkspaceIds(new HashSet<>());
            anonymousUser.setIsAnonymous(true);
            anonymousUser.setTenantId(organization.getId());

            mongoTemplate.save(anonymousUser);
        }
    }

    @ChangeSet(order = "029", id = "add-instance-config-object", author = "")
    public void addInstanceConfigurationPlaceHolder(MongoTemplate mongoTemplate) {
        Query instanceConfigurationQuery = new Query();
        instanceConfigurationQuery.addCriteria(where(Config.Fields.name).is(FieldName.INSTANCE_CONFIG));
        Config instanceAdminConfiguration = mongoTemplate.findOne(instanceConfigurationQuery, Config.class);

        if (instanceAdminConfiguration != null) {
            return;
        }

        instanceAdminConfiguration = new Config();
        instanceAdminConfiguration.setName(FieldName.INSTANCE_CONFIG);
        Config savedInstanceConfig = mongoTemplate.save(instanceAdminConfiguration);

        // Create instance management permission group
        PermissionGroup instanceManagerPermissionGroup = new PermissionGroup();
        instanceManagerPermissionGroup.setName(FieldName.INSTANCE_ADMIN_ROLE);
        instanceManagerPermissionGroup.setPermissions(
                Set.of(new Permission(savedInstanceConfig.getId(), MANAGE_INSTANCE_CONFIGURATION)));

        Query adminUserQuery = new Query();
        adminUserQuery.addCriteria(
                where(BaseDomain.Fields.policies).elemMatch(where("permission").is(MANAGE_INSTANCE_ENV.getValue())));
        List<User> adminUsers = mongoTemplate.find(adminUserQuery, User.class);

        instanceManagerPermissionGroup.setAssignedToUserIds(
                adminUsers.stream().map(User::getId).collect(Collectors.toSet()));

        PermissionGroup savedPermissionGroup = mongoTemplate.save(instanceManagerPermissionGroup);

        // Update the instance config with the permission group id
        savedInstanceConfig.setConfig(new JSONObject(Map.of(DEFAULT_PERMISSION_GROUP, savedPermissionGroup.getId())));

        Policy editConfigPolicy = Policy.builder()
                .permission(MANAGE_INSTANCE_CONFIGURATION.getValue())
                .permissionGroups(Set.of(savedPermissionGroup.getId()))
                .build();
        Policy readConfigPolicy = Policy.builder()
                .permission(READ_INSTANCE_CONFIGURATION.getValue())
                .permissionGroups(Set.of(savedPermissionGroup.getId()))
                .build();

        savedInstanceConfig.setPolicies(new HashSet<>(Set.of(editConfigPolicy, readConfigPolicy)), false);

        mongoTemplate.save(savedInstanceConfig);

        // Also give the permission group permission to unassign & assign & read to itself
        Policy updatePermissionGroupPolicy = Policy.builder()
                .permission(AclPermission.UNASSIGN_PERMISSION_GROUPS.getValue())
                .permissionGroups(Set.of(savedPermissionGroup.getId()))
                .build();

        Policy assignPermissionGroupPolicy = Policy.builder()
                .permission(ASSIGN_PERMISSION_GROUPS.getValue())
                .permissionGroups(Set.of(savedPermissionGroup.getId()))
                .build();

        savedPermissionGroup.setPolicies(
                new HashSet<>(Set.of(updatePermissionGroupPolicy, assignPermissionGroupPolicy)), false);

        Set<Permission> permissions = new HashSet<>(savedPermissionGroup.getPermissions());
        permissions.addAll(Set.of(
                new Permission(savedPermissionGroup.getId(), AclPermission.UNASSIGN_PERMISSION_GROUPS),
                new Permission(savedPermissionGroup.getId(), ASSIGN_PERMISSION_GROUPS),
                new Permission(savedPermissionGroup.getId(), READ_PERMISSION_GROUP_MEMBERS)));
        savedPermissionGroup.setPermissions(permissions);

        mongoTemplate.save(savedPermissionGroup);
    }

    @ChangeSet(order = "030", id = "add-anonymous-user-permission-group", author = "")
    public void addAnonymousUserPermissionGroup(MongoTemplate mongoTemplate) {
        Query anonymousUserPermissionConfig = new Query();
        anonymousUserPermissionConfig.addCriteria(where(Config.Fields.name).is(FieldName.PUBLIC_PERMISSION_GROUP));

        Config publicPermissionGroupConfig = mongoTemplate.findOne(anonymousUserPermissionConfig, Config.class);

        if (publicPermissionGroupConfig != null) {
            return;
        }

        PermissionGroup publicPermissionGroup = new PermissionGroup();
        publicPermissionGroup.setName(FieldName.PUBLIC_PERMISSION_GROUP);
        publicPermissionGroup.setDescription("Role for giving accesses for all objects to anonymous users");

        Query tenantQuery = new Query();
        tenantQuery.addCriteria(where(Organization.Fields.slug).is("default"));
        Organization organization = mongoTemplate.findOne(tenantQuery, Organization.class);

        Query userQuery = new Query();
        userQuery
                .addCriteria(where(User.Fields.email).is(FieldName.ANONYMOUS_USER))
                .addCriteria(where(User.Fields.tenantId).is(organization.getId()));
        User anonymousUser = mongoTemplate.findOne(userQuery, User.class);

        // Give access to anonymous user to the permission group.
        publicPermissionGroup.setAssignedToUserIds(Set.of(anonymousUser.getId()));
        PermissionGroup savedPermissionGroup = mongoTemplate.save(publicPermissionGroup);

        publicPermissionGroupConfig = new Config();
        publicPermissionGroupConfig.setName(FieldName.PUBLIC_PERMISSION_GROUP);

        publicPermissionGroupConfig.setConfig(
                new JSONObject(Map.of(PERMISSION_GROUP_ID, savedPermissionGroup.getId())));

        mongoTemplate.save(publicPermissionGroupConfig);
        return;
    }

    @ChangeSet(order = "031", id = "create-themes-indices", author = "")
    public void createThemesIndices(MongoTemplate mongoTemplate) {

        Index systemThemeIndex = new Index()
                .on(Theme.Fields.isSystemTheme, Sort.Direction.ASC)
                .named("system_theme_index")
                .background();

        Index applicationIdIndex = new Index()
                .on(Theme.Fields.applicationId, Sort.Direction.ASC)
                .on(FieldName.DELETED, Sort.Direction.ASC)
                .named("application_id_index")
                .background();

        dropIndexIfExists(mongoTemplate, Theme.class, "system_theme_index");
        dropIndexIfExists(mongoTemplate, Theme.class, "application_id_index");
        ensureIndexes(mongoTemplate, Theme.class, systemThemeIndex, applicationIdIndex);
    }

    // The order 031-a is ensured to run after 031, as theme indices might be a requirement.
    @ChangeSet(order = "031-a", id = "create-system-themes-v3", author = "", runAlways = true)
    public void createSystemThemes3(MongoTemplate mongoTemplate) throws IOException {

        final String themesJson = StreamUtils.copyToString(
                new DefaultResourceLoader().getResource("system-themes.json").getInputStream(),
                Charset.defaultCharset());

        Theme[] themes = new GsonBuilder()
                .registerTypeAdapter(Instant.class, new ISOStringToInstantConverter())
                .create()
                .fromJson(themesJson, Theme[].class);

        // Make this theme accessible to anonymous users.
        Query anonymousUserPermissionConfig = new Query();
        anonymousUserPermissionConfig.addCriteria(where(Config.Fields.name).is(FieldName.PUBLIC_PERMISSION_GROUP));
        Config publicPermissionGroupConfig = mongoTemplate.findOne(anonymousUserPermissionConfig, Config.class);

        String permissionGroupId = publicPermissionGroupConfig.getConfig().getAsString(PERMISSION_GROUP_ID);

        PermissionGroup publicPermissionGroup =
                mongoTemplate.findOne(query(where("_id").is(permissionGroupId)), PermissionGroup.class);

        // Initialize the permissions for the role
        HashSet<Permission> permissions = new HashSet<>();
        if (publicPermissionGroup.getPermissions() != null) {
            permissions.addAll(publicPermissionGroup.getPermissions());
        }

        Policy policyWithCurrentPermission = Policy.builder()
                .permission(READ_THEMES.getValue())
                .permissionGroups(Set.of(publicPermissionGroup.getId()))
                .build();

        for (Theme theme : themes) {
            theme.setSystemTheme(true);
            theme.setCreatedAt(Instant.now());
            Query query = new Query(Criteria.where(Theme.Fields.name)
                    .is(theme.getName())
                    .and(Theme.Fields.isSystemTheme)
                    .is(true));
            Set<Policy> themePolicies = new HashSet<>(Set.of(policyWithCurrentPermission));
            Theme savedTheme = mongoTemplate.findOne(query, Theme.class);
            if (savedTheme == null) { // this theme does not exist, create it
                theme.setPolicies(themePolicies);
                savedTheme = mongoTemplate.save(theme);
            } else { // theme already found, update
                savedTheme.setDisplayName(theme.getDisplayName());
                savedTheme.setPolicies(themePolicies);
                savedTheme.setConfig(theme.getConfig());
                savedTheme.setProperties(theme.getProperties());
                savedTheme.setStylesheet(theme.getStylesheet());
                if (savedTheme.getCreatedAt() == null) {
                    savedTheme.setCreatedAt(Instant.now());
                }
                mongoTemplate.save(savedTheme);
            }

            // Add the access to this theme to the public permission group
            Theme finalSavedTheme = savedTheme;
            boolean isThemePermissionPresent = permissions.stream()
                    .filter(p -> p.getAclPermission().equals(READ_THEMES)
                            && p.getDocumentId().equals(finalSavedTheme.getId()))
                    .findFirst()
                    .isPresent();
            if (!isThemePermissionPresent) {
                permissions.add(new Permission(finalSavedTheme.getId(), READ_THEMES));
            }
        }

        // Finally save the role which gives access to all the system themes to the anonymous user.
        publicPermissionGroup.setPermissions(permissions);
        mongoTemplate.save(publicPermissionGroup);
    }

    @ChangeSet(order = "032", id = "create-indices-on-permissions-for-performance", author = "")
    public void addPermissionGroupIndex(MongoTemplate mongoTemplate) {
        doAddPermissionGroupIndex(mongoTemplate);
    }

    public static void doAddPermissionGroupIndex(MongoTemplate mongoTemplate) {

        dropIndexIfExists(mongoTemplate, PermissionGroup.class, "permission_group_workspace_deleted_compound_index");
        dropIndexIfExists(
                mongoTemplate, PermissionGroup.class, "permission_group_assignedUserIds_deleted_compound_index");
        dropIndexIfExists(mongoTemplate, PermissionGroup.class, "permission_group_assignedUserIds_deleted");

        Index assignedToUserIds_deleted_compound_index = makeIndex(
                        PermissionGroup.Fields.assignedToUserIds, FieldName.DELETED)
                .named("permission_group_assignedUserIds_deleted");

        ensureIndexes(mongoTemplate, PermissionGroup.class, assignedToUserIds_deleted_compound_index);
    }

    /**
     * Changing the order of this function to 10000 so that it always gets executed at the end.
     * This ensures that any permission changes for super users happen once all other migrations are completed
     */
    @ChangeSet(order = "10000", id = "update-super-users", author = "", runAlways = true)
    public void updateSuperUsers(
            MongoTemplate mongoTemplate,
            CacheableRepositoryHelper cacheableRepositoryHelper,
            PolicySolution policySolution,
            PolicyGenerator policyGenerator) {
        // Read the admin emails from the environment and update the super users accordingly
        String adminEmailsStr = System.getenv(String.valueOf(APPSMITH_ADMIN_EMAILS));

        Set<String> adminEmails = TextUtils.csvToSet(adminEmailsStr);

        Query instanceConfigurationQuery = new Query();
        instanceConfigurationQuery.addCriteria(where(Config.Fields.name).is(FieldName.INSTANCE_CONFIG));
        Config instanceAdminConfiguration = mongoTemplate.findOne(instanceConfigurationQuery, Config.class);

        String instanceAdminPermissionGroupId =
                (String) instanceAdminConfiguration.getConfig().get(DEFAULT_PERMISSION_GROUP);

        Query permissionGroupQuery = new Query();
        permissionGroupQuery
                .addCriteria(where(PermissionGroup.Fields.id).is(instanceAdminPermissionGroupId))
                .fields()
                .include(PermissionGroup.Fields.assignedToUserIds);
        PermissionGroup instanceAdminPG = mongoTemplate.findOne(permissionGroupQuery, PermissionGroup.class);

        Query tenantQuery = new Query();
        tenantQuery.addCriteria(where(Organization.Fields.slug).is("default"));
        Organization organization = mongoTemplate.findOne(tenantQuery, Organization.class);

        Set<String> userIds = adminEmails.stream()
                .map(email -> email.trim())
                .map(String::toLowerCase)
                .map(email -> {
                    Query userQuery = new Query();
                    userQuery.addCriteria(where(User.Fields.email).is(email));
                    User user = mongoTemplate.findOne(userQuery, User.class);

                    if (user == null) {
                        log.info("Creating super user with username {}", email);
                        user = updateSuperUserMigrationHelper.createNewUser(
                                email, organization, instanceAdminPG, mongoTemplate, policySolution, policyGenerator);
                    }

                    return user.getId();
                })
                .collect(Collectors.toSet());

        Set<String> oldSuperUsers = instanceAdminPG.getAssignedToUserIds();
        Set<String> updatedUserIds = findSymmetricDiff(oldSuperUsers, userIds);
        evictPermissionCacheForUsers(updatedUserIds, mongoTemplate, cacheableRepositoryHelper);

        Update update = new Update().set(PermissionGroup.Fields.assignedToUserIds, userIds);
        mongoTemplate.updateFirst(permissionGroupQuery, update, PermissionGroup.class);
    }

    @ChangeSet(order = "034", id = "update-bad-theme-state", author = "")
    public void updateBadThemeState(
            MongoTemplate mongoTemplate,
            @NonLockGuarded PolicyGenerator policyGenerator,
            CacheableRepositoryHelper cacheableRepositoryHelper) {
        Query query = new Query();
        query.addCriteria(new Criteria()
                .andOperator(
                        new Criteria(Theme.Fields.isSystemTheme).is(false), new Criteria(FieldName.DELETED).is(false)));

        mongoTemplate.stream(query, Theme.class).forEach(theme -> {
            Query applicationQuery = new Query();
            Criteria themeCriteria = new Criteria(Application.Fields.editModeThemeId)
                    .is(theme.getId())
                    .orOperator(new Criteria(Application.Fields.publishedModeThemeId).is(theme.getId()));

            List<Application> applications =
                    mongoTemplate.find(applicationQuery.addCriteria(themeCriteria), Application.class);
            // This is an erroneous state where the theme is being used by multiple applications
            if (applications != null && applications.size() > 1) {
                // Create new themes for the rest of the applications which are copies of the original theme
                for (int i = 0; i < applications.size(); i++) {
                    Application application = applications.get(i);
                    Set<Policy> themePolicies = policyGenerator.getAllChildPolicies(
                            application.getPolicies(), Application.class, Theme.class);

                    if (i == 0) {
                        // Don't create a new theme for the first application
                        // Just update the policies
                        theme.setPolicies(themePolicies, false);
                        mongoTemplate.save(theme);
                    } else {

                        Theme newTheme = new Theme();
                        newTheme.setSystemTheme(false);
                        newTheme.setName(theme.getName());
                        newTheme.setDisplayName(theme.getDisplayName());
                        newTheme.setConfig(theme.getConfig());
                        newTheme.setStylesheet(theme.getStylesheet());
                        newTheme.setProperties(theme.getProperties());
                        newTheme.setCreatedAt(Instant.now());
                        newTheme.setUpdatedAt(Instant.now());
                        newTheme.setPolicies(themePolicies, false);

                        newTheme = mongoTemplate.save(newTheme);

                        if (application.getEditModeThemeId().equals(theme.getId())) {
                            application.setEditModeThemeId(newTheme.getId());
                        }
                        if (application.getPublishedModeThemeId().equals(theme.getId())) {
                            application.setPublishedModeThemeId(newTheme.getId());
                        }
                        mongoTemplate.save(application);
                    }
                }
            }
        });
    }

    @ChangeSet(order = "036", id = "add-graphql-plugin", author = "")
    public void addGraphQLPlugin(MongoTemplate mongoTemplate) {
        Plugin plugin = new Plugin();
        plugin.setName("Authenticated GraphQL API");
        plugin.setType(PluginType.API);
        plugin.setPackageName("graphql-plugin");
        plugin.setUiComponent("GraphQLEditorForm");
        plugin.setDatasourceComponent("RestAPIDatasourceForm");
        plugin.setResponseType(Plugin.ResponseType.JSON);
        plugin.setIconLocation("https://s3.us-east-2.amazonaws.com/assets.appsmith.com/logo/graphql.svg");
        plugin.setDocumentationLink("https://docs.appsmith.com/reference/datasources/querying-graphql-db");
        plugin.setDefaultInstall(true);
        try {
            mongoTemplate.insert(plugin);
        } catch (DuplicateKeyException e) {
            log.warn(plugin.getPackageName() + " already present in database.");
        }

        installPluginToAllWorkspaces(mongoTemplate, plugin.getId());
    }

    @ChangeSet(order = "035", id = "add-tenant-admin-permissions-instance-admin", author = "")
    public void addTenantAdminPermissionsToInstanceAdmin(
            MongoTemplate mongoTemplate, @NonLockGuarded PolicySolution policySolution) {
        Query tenantQuery = new Query();
        tenantQuery.addCriteria(where(Organization.Fields.slug).is("default"));
        Organization defaultOrganization = mongoTemplate.findOne(tenantQuery, Organization.class);

        Query instanceConfigurationQuery = new Query();
        instanceConfigurationQuery.addCriteria(where(Config.Fields.name).is(FieldName.INSTANCE_CONFIG));
        Config instanceAdminConfiguration = mongoTemplate.findOne(instanceConfigurationQuery, Config.class);

        String instanceAdminPermissionGroupId =
                (String) instanceAdminConfiguration.getConfig().get(DEFAULT_PERMISSION_GROUP);

        Query permissionGroupQuery = new Query();
        permissionGroupQuery.addCriteria(where(PermissionGroup.Fields.id).is(instanceAdminPermissionGroupId));

        PermissionGroup instanceAdminPGBeforeChanges =
                mongoTemplate.findOne(permissionGroupQuery, PermissionGroup.class);

        // Give read permission to instanceAdminPg to all the users who have been assigned this permission group
        Map<String, Policy> readPermissionGroupPolicyMap = Map.of(
                READ_PERMISSION_GROUP_MEMBERS.getValue(),
                Policy.builder()
                        .permission(READ_PERMISSION_GROUP_MEMBERS.getValue())
                        .permissionGroups(Set.of(instanceAdminPGBeforeChanges.getId()))
                        .build());
        PermissionGroup instanceAdminPG =
                policySolution.addPoliciesToExistingObject(readPermissionGroupPolicyMap, instanceAdminPGBeforeChanges);

        // Now add admin permissions to the tenant
        Set<Permission> tenantPermissions = TENANT_ADMIN.getPermissions().stream()
                .map(permission -> new Permission(defaultOrganization.getId(), permission))
                .collect(Collectors.toSet());
        HashSet<Permission> permissions = new HashSet<>(instanceAdminPG.getPermissions());
        permissions.addAll(tenantPermissions);
        instanceAdminPG.setPermissions(permissions);
        instanceAdminPG.setPolicies(instanceAdminPG.getPolicies(), false);
        mongoTemplate.save(instanceAdminPG);

        Map<String, Policy> tenantPolicy =
                policySolution.generatePolicyFromPermissionGroupForObject(instanceAdminPG, defaultOrganization.getId());
        Organization updatedOrganization =
                policySolution.addPoliciesToExistingObject(tenantPolicy, defaultOrganization);
        updatedOrganization.setPolicies(updatedOrganization.getPolicies(), false);
        mongoTemplate.save(updatedOrganization);
    }

    @ChangeSet(order = "039", id = "change-readPermissionGroup-to-readPermissionGroupMembers", author = "")
    public void modifyReadPermissionGroupToReadPermissionGroupMembers(MongoTemplate mongoTemplate) {

        Query query = new Query(Criteria.where("policies.permission").is("read:permissionGroups"));
        Update update = new Update().set("policies.$.permission", "read:permissionGroupMembers");
        mongoTemplate.updateMulti(query, update, PermissionGroup.class);
    }

    @ChangeSet(order = "040", id = "delete-permissions-in-permissionGroups", author = "")
    public void deletePermissionsInPermissionGroups(MongoTemplate mongoTemplate) {
        Query query = new Query();
        Update update = new Update().set("permissions", List.of());
        mongoTemplate.updateMulti(query, update, PermissionGroup.class);
    }

    private Query getQueryToFetchAllDomainObjectsWhichAreNotDeletedUsingPluginId(Plugin plugin) {
        Criteria pluginIdMatchesSuppliedPluginId = where("pluginId").is(plugin.getId());
        Criteria isNotDeleted = where("deleted").ne(true);
        return query((new Criteria()).andOperator(pluginIdMatchesSuppliedPluginId, isNotDeleted));
    }

    @ChangeSet(order = "037", id = "indices-recommended-by-mongodb-cloud", author = "")
    public void addIndicesRecommendedByMongoCloud(MongoTemplate mongoTemplate) {
        dropIndexIfExists(mongoTemplate, NewPage.class, "deleted");
        ensureIndexes(mongoTemplate, NewPage.class, makeIndex("deleted"));

        dropIndexIfExists(mongoTemplate, Application.class, "deleted");
        ensureIndexes(mongoTemplate, Application.class, makeIndex("deleted"));

        dropIndexIfExists(mongoTemplate, Workspace.class, "tenantId_deleted");
        ensureIndexes(
                mongoTemplate, Workspace.class, makeIndex("tenantId", "deleted").named("tenantId_deleted"));
    }

    @ChangeSet(order = "038", id = "add-unique-index-for-uidstring", author = "")
    public void addUniqueIndexOnUidString(MongoTemplate mongoTemplate) {
        Index uidStringUniqueness = makeIndex("uidString").unique().named("customjslibs_uidstring_index");
        ensureIndexes(mongoTemplate, CustomJSLib.class, uidStringUniqueness);
    }

    // ----------------------------------------------------
    // v1.9.2 Checkpoint
    // ----------------------------------------------------

    // Migration to drop usage pulse collection for Appsmith cloud as we will not be logging these pulses unless
    // multi-tenancy is introduced
    @ChangeSet(order = "040", id = "remove-usage-pulses-for-appsmith-cloud", author = "")
    public void removeUsagePulsesForAppsmithCloud(
            MongoTemplate mongoTemplate, @NonLockGuarded CommonConfig commonConfig) {
        if (Boolean.TRUE.equals(commonConfig.isCloudHosting())) {
            mongoTemplate.dropCollection(UsagePulse.class);
        }
    }

    /**
     * We are introducing SSL settings config for MSSQL, hence this migration configures older existing datasources
     * with a setting that matches their current configuration (i.e. set to `disabled` since they have been running
     * with encryption disabled post the Spring 6 upgrade).
     *
     */
    @ChangeSet(order = "041", id = "add-ssl-mode-settings-for-existing-mssql-datasources", author = "")
    public void addSslModeSettingsForExistingMssqlDatasource(MongoTemplate mongoTemplate) {
        Plugin mssqlPlugin = mongoTemplate.findOne(query(where("packageName").is("mssql-plugin")), Plugin.class);
        Query queryToGetDatasources = getQueryToFetchAllDomainObjectsWhichAreNotDeletedUsingPluginId(mssqlPlugin);

        Update update = new Update();
        update.set("datasourceConfiguration.connection.ssl.authType", "DISABLE");
        mongoTemplate.updateMulti(queryToGetDatasources, update, Datasource.class);
    }

    @ChangeSet(order = "042", id = "add-oracle-plugin", author = "")
    public void addOraclePlugin(MongoTemplate mongoTemplate) {
        Plugin plugin = new Plugin();
        plugin.setName("Oracle");
        plugin.setType(PluginType.DB);
        plugin.setPackageName("oracle-plugin");
        plugin.setUiComponent("DbEditorForm");
        plugin.setResponseType(Plugin.ResponseType.TABLE);
        plugin.setIconLocation("https://s3.us-east-2.amazonaws.com/assets.appsmith.com/oracle.svg");
        plugin.setDocumentationLink("https://docs.appsmith.com/datasource-reference/querying-oracle");
        plugin.setDefaultInstall(true);
        try {
            mongoTemplate.insert(plugin);
        } catch (DuplicateKeyException e) {
            log.warn(plugin.getPackageName() + " already present in database.");
        }
        installPluginToAllWorkspaces(mongoTemplate, plugin.getId());
    }

    @ChangeSet(order = "043", id = "update-oracle-plugin-name", author = "")
    public void updateOraclePluginName(MongoTemplate mongoTemplate) {
        Plugin oraclePlugin = mongoTemplate.findOne(query(where("packageName").is("oracle-plugin")), Plugin.class);
        oraclePlugin.setName("Oracle");
        oraclePlugin.setIconLocation("https://s3.us-east-2.amazonaws.com/assets.appsmith.com/oracle.svg");
        mongoTemplate.save(oraclePlugin);
    }
}
