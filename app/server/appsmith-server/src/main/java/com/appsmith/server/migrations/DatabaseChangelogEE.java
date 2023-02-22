package com.appsmith.server.migrations;

import com.appsmith.external.models.Datasource;
import com.appsmith.external.models.Policy;
import com.appsmith.external.models.QDatasource;
import com.appsmith.server.configurations.LicenseConfig;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.constants.LicenseOrigin;
import com.appsmith.server.constants.LicenseStatus;
import com.appsmith.server.domains.AuditLog;
import com.appsmith.server.domains.Config;
import com.appsmith.external.models.Environment;
import com.appsmith.external.models.EnvironmentVariable;
import com.appsmith.server.domains.NewAction;
import com.appsmith.server.domains.PermissionGroup;
import com.appsmith.server.domains.QConfig;
import com.appsmith.server.domains.QNewAction;
import com.appsmith.server.domains.QPermissionGroup;
import com.appsmith.server.domains.QTenant;
import com.appsmith.server.domains.QUsagePulse;
import com.appsmith.server.domains.QUser;
import com.appsmith.server.domains.Tenant;
import com.appsmith.server.domains.TenantConfiguration;
import com.appsmith.server.domains.UsagePulse;
import com.appsmith.server.domains.User;
import com.appsmith.server.domains.UserGroup;
import com.appsmith.server.domains.Workspace;
import com.appsmith.server.dtos.Permission;
import com.appsmith.server.helpers.PolicyUtils;
import com.appsmith.server.repositories.CacheableRepositoryHelper;
import com.github.cloudyrock.mongock.ChangeLog;
import com.github.cloudyrock.mongock.ChangeSet;
import io.changock.migration.api.annotations.NonLockGuarded;
import io.mongock.api.annotations.ChangeUnit;
import lombok.extern.slf4j.Slf4j;
import net.minidev.json.JSONObject;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.index.Index;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.CriteriaDefinition;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Update;
import org.springframework.util.StringUtils;

import java.time.Instant;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

import static com.appsmith.server.acl.AclPermission.CREATE_DATASOURCE_ACTIONS;
import static com.appsmith.server.acl.AclPermission.CREATE_WORKSPACES;
import static com.appsmith.server.acl.AclPermission.MANAGE_DATASOURCES;
import static com.appsmith.server.acl.AclPermission.MANAGE_PERMISSION_GROUPS;
import static com.appsmith.server.acl.AclPermission.READ_PERMISSION_GROUPS;
import static com.appsmith.server.acl.AclPermission.READ_PERMISSION_GROUP_MEMBERS;
import static com.appsmith.server.acl.AppsmithRole.TENANT_ADMIN;
import static com.appsmith.server.constants.FieldName.DEFAULT_PERMISSION_GROUP;
import static com.appsmith.server.constants.FieldName.PUBLIC_PERMISSION_GROUP;
import static com.appsmith.server.migrations.DatabaseChangelog1.ensureIndexes;
import static com.appsmith.server.migrations.DatabaseChangelog1.makeIndex;
import static com.appsmith.server.migrations.MigrationHelperMethods.evictPermissionCacheForUsers;
import static com.appsmith.server.repositories.BaseAppsmithRepositoryImpl.fieldName;
import static org.springframework.data.mongodb.core.query.Criteria.where;
import static org.springframework.data.mongodb.core.query.Query.query;

@Slf4j
@ChangeLog(order = "100")
// Marking this class as EE because it contains a migration that is only applicable to EE. Making the changelog order
// to be 100 so that it is executed after all the CE migrations
public class DatabaseChangelogEE {

    @ChangeSet(order = "001", id = "add-tenant-admin-permissions-instance-admin-ee", author = "")
    public void addTenantAdminPermissionsToInstanceAdmin(MongoTemplate mongoTemplate, @NonLockGuarded PolicyUtils policyUtils) {
        Query tenantQuery = new Query();
        tenantQuery.addCriteria(where(fieldName(QTenant.tenant.slug)).is("default"));
        Tenant defaultTenant = mongoTemplate.findOne(tenantQuery, Tenant.class);

        Query instanceConfigurationQuery = new Query();
        instanceConfigurationQuery.addCriteria(where(fieldName(QConfig.config1.name)).is(FieldName.INSTANCE_CONFIG));
        Config instanceAdminConfiguration = mongoTemplate.findOne(instanceConfigurationQuery, Config.class);

        String instanceAdminPermissionGroupId = (String) instanceAdminConfiguration.getConfig().get(DEFAULT_PERMISSION_GROUP);

        Query permissionGroupQuery = new Query();
        permissionGroupQuery.addCriteria(where(fieldName(QPermissionGroup.permissionGroup.id)).is(instanceAdminPermissionGroupId));

        PermissionGroup instanceAdminPGBeforeChanges = mongoTemplate.findOne(permissionGroupQuery, PermissionGroup.class);

        // Give read permission to instanceAdminPg to all the users who have been assigned this permission group
        Map<String, Policy> readPermissionGroupPolicyMap = Map.of(
                READ_PERMISSION_GROUPS.getValue(),
                Policy.builder()
                        .permission(READ_PERMISSION_GROUPS.getValue())
                        .permissionGroups(Set.of(instanceAdminPGBeforeChanges.getId()))
                        .build(),
                READ_PERMISSION_GROUP_MEMBERS.getValue(),
                Policy.builder()
                        .permission(READ_PERMISSION_GROUP_MEMBERS.getValue())
                        .permissionGroups(Set.of(instanceAdminPGBeforeChanges.getId()))
                        .build()
        );
        PermissionGroup instanceAdminPG = policyUtils.addPoliciesToExistingObject(readPermissionGroupPolicyMap, instanceAdminPGBeforeChanges);

        // Now add admin permissions to the tenant
        Set<Permission> tenantPermissions = TENANT_ADMIN.getPermissions().stream()
                .map(permission -> new Permission(defaultTenant.getId(), permission))
                .collect(Collectors.toSet());
        HashSet<Permission> permissions = new HashSet<>(instanceAdminPG.getPermissions());
        permissions.addAll(tenantPermissions);
        instanceAdminPG.setPermissions(permissions);
        mongoTemplate.save(instanceAdminPG);

        Map<String, Policy> tenantPolicy = policyUtils.generatePolicyFromPermissionGroupForObject(instanceAdminPG, defaultTenant.getId());
        Tenant updatedTenant = policyUtils.addPoliciesToExistingObject(tenantPolicy, defaultTenant);
        mongoTemplate.save(updatedTenant);
    }

    @ChangeSet(order = "002", id = "add-index-user-groups", author = "")
    public void addIndexOnUserGroupCollection(MongoTemplate mongoTemplate, @NonLockGuarded PolicyUtils policyUtils) {
        Index tenantIdIndex = makeIndex("tenantId");
        ensureIndexes(mongoTemplate, UserGroup.class, tenantIdIndex);
    }

    @ChangeSet(order = "003", id = "add-index-for-audit-logs", author = "")
    public void addIndexOnAuditLogsCollection(MongoTemplate mongoTemplate) {
        Index userEmailIndex = makeIndex("user.email");
        ensureIndexes(mongoTemplate, AuditLog.class, userEmailIndex);

        Index resourceIdIndex = makeIndex("resource.id");
        ensureIndexes(mongoTemplate, AuditLog.class, resourceIdIndex);

        Index resourceTypeIndex = makeIndex("resource.type");
        ensureIndexes(mongoTemplate, AuditLog.class, resourceTypeIndex);

        Index createdTimeIndex = makeIndex("timestamp");
        ensureIndexes(mongoTemplate, AuditLog.class, createdTimeIndex);

        Index eventIndex = makeIndex("event");
        ensureIndexes(mongoTemplate, AuditLog.class, eventIndex);

        Index userEmailEventCompoundIndex = makeIndex("event", "user.email", "timestamp").named("userEmail_event_compound_index");
        ensureIndexes(mongoTemplate, AuditLog.class, userEmailEventCompoundIndex);
    }

    @ChangeSet(order = "004", id = "add-brand-tenant-configuration", author = "")
    public void addBrandTenantConfiguration(MongoTemplate mongoTemplate, @NonLockGuarded PolicyUtils policyUtils) {
        Query tenantQuery = new Query();
        tenantQuery.addCriteria(where(fieldName(QTenant.tenant.slug)).is("default"));
        Tenant defaultTenant = mongoTemplate.findOne(tenantQuery, Tenant.class);
        TenantConfiguration tenantConfiguration = new TenantConfiguration();
        tenantConfiguration.setWhiteLabelLogo("https://assets.appsmith.com/appsmith-logo-full.png");
        tenantConfiguration.setWhiteLabelEnable("false");
        tenantConfiguration.setWhiteLabelFavicon("https://assets.appsmith.com/appsmith-favicon-orange.ico");
        defaultTenant.setTenantConfiguration(tenantConfiguration);
        mongoTemplate.save(defaultTenant);
    }

    @ChangeSet(order = "005", id = "add-read-pg-to-instance-admins", author = "")
    public void addReadPermissionGroupForInstanceAdmin(MongoTemplate mongoTemplate) {
        Query instanceConfigurationQuery = new Query();
        instanceConfigurationQuery.addCriteria(where(fieldName(QConfig.config1.name)).is(FieldName.INSTANCE_CONFIG));
        Config instanceAdminConfiguration = mongoTemplate.findOne(instanceConfigurationQuery, Config.class);

        // Get the default Instance Admin permission group Id from the DB
        String instanceAdminPermissionGroupId = (String) instanceAdminConfiguration.getConfig().get(DEFAULT_PERMISSION_GROUP);

        // Update all the permission groups with `read:permissionGroups` policy for the above permissionGroupId
        Policy policy = Policy.builder()
                .permission(READ_PERMISSION_GROUPS.getValue())
                .permissionGroups(Set.of(instanceAdminPermissionGroupId))
                .build();
        Query query = new Query(where("policies.permission").ne(READ_PERMISSION_GROUPS));
        Update update = new Update().addToSet("policies", policy);
        mongoTemplate.updateMulti(query, update, PermissionGroup.class);
    }

    @ChangeSet(order = "006", id = "introduce-missing-permissions", author = "")
    public void addMissingPermissionsToExistingObjects(MongoTemplate mongoTemplate) {

        // Find al the administrator permission groups and give make public to the default workspace
        Query adminPermissionGroupQuery = new Query().addCriteria(where("name").regex("^Administrator - .*"));
        adminPermissionGroupQuery.fields().include("_id", "defaultWorkspaceId");
        List<PermissionGroup> permissionGroups = mongoTemplate.find(adminPermissionGroupQuery, PermissionGroup.class);

        permissionGroups.forEach(permissionGroup -> {
            String defaultWorkspaceId = permissionGroup.getDefaultWorkspaceId();
            if (defaultWorkspaceId != null) {

                Policy makePublicPolicy = Policy.builder()
                        .permission("makePublic:workspaceApplications")
                        .permissionGroups(Set.of(permissionGroup.getId()))
                        .build();
                Query workspaceQuery = new Query().addCriteria(where("id").is(defaultWorkspaceId));

                mongoTemplate.updateFirst(workspaceQuery, new Update().addToSet("policies", makePublicPolicy), Workspace.class);
            }
        });
    }

    @ChangeSet(order = "007", id = "remove-internal-permission-group-read-permission", author = "")
    public void removeReadPermissionForInternalPermissionGroups(MongoTemplate mongoTemplate) {
        Criteria userManagementPgCriteria = where("name").regex(" User Management$");
        Criteria publicPermissionGroupPgCriteria = where("name").is(PUBLIC_PERMISSION_GROUP);

        Criteria interestingPermissionGroupCriteria = new Criteria().orOperator(userManagementPgCriteria, publicPermissionGroupPgCriteria);

        Criteria readPgCriteria = where("policies.permission").is("read:permissionGroups");

        Query query = new Query(interestingPermissionGroupCriteria.andOperator(readPgCriteria));

        Update update = new Update().set("policies.$.permissionGroups", Set.of());

        mongoTemplate.updateMulti(query, update, PermissionGroup.class);
    }

    @ChangeSet(order = "008", id = "add-index-for-environment", author = "")
    public void addInitialIndexforEnvironmentAndEnvironmentVariable(MongoTemplate mongoTemplate) {
        Index environmentUniqueness = makeIndex("name", "workspaceId", "deletedAt").unique()
                .named("environment_compound_index");

        Index createdAt = makeIndex("createdAt");

        ensureIndexes(mongoTemplate, Environment.class, createdAt, environmentUniqueness);
        ensureIndexes(mongoTemplate, EnvironmentVariable.class, createdAt);
    }

    @ChangeSet(order = "009", id = "remove-default-logo-urls", author = "")
    public void removeDefaultLogoURLs(MongoTemplate mongoTemplate) {
        mongoTemplate.updateMulti(
                new Query(where("tenantConfiguration.whiteLabelLogo").is("https://assets.appsmith.com/appsmith-logo-full.png")),
                new Update().unset("tenantConfiguration.whiteLabelLogo"),
                Tenant.class
        );

        mongoTemplate.updateMulti(
                new Query(where("tenantConfiguration.whiteLabelFavicon").is("https://assets.appsmith.com/appsmith-favicon-orange.ico")),
                new Update().unset("tenantConfiguration.whiteLabelFavicon"),
                Tenant.class
        );
    }

    @ChangeSet(order = "010", id = "create-default-role-for-all-users", author = "")
    public void createDefaultRoleForAllUsers(MongoTemplate mongoTemplate, CacheableRepositoryHelper cacheableRepositoryHelper) {
        Query instanceConfigurationQuery = new Query();
        instanceConfigurationQuery.addCriteria(where(fieldName(QConfig.config1.name)).is(FieldName.INSTANCE_CONFIG));
        Config instanceAdminConfiguration = mongoTemplate.findOne(instanceConfigurationQuery, Config.class);

        // Get the default Instance Admin permission group Id from the DB
        String instanceAdminPermissionGroupId = (String) instanceAdminConfiguration.getConfig().get(DEFAULT_PERMISSION_GROUP);

        Query defaultRoleForUserConfig = new Query();
        defaultRoleForUserConfig.addCriteria(where(fieldName(QConfig.config1.name)).is(FieldName.DEFAULT_USER_PERMISSION_GROUP));

        Config defaultRoleConfig = mongoTemplate.findOne(defaultRoleForUserConfig, Config.class);

        if (defaultRoleConfig != null) {
            return;
        }

        Query tenantQuery = new Query();
        tenantQuery.addCriteria(where(fieldName(QTenant.tenant.slug)).is("default"));
        Tenant tenant = mongoTemplate.findOne(tenantQuery, Tenant.class);

        PermissionGroup defaultRoleForUser = new PermissionGroup();
        defaultRoleForUser.setName(FieldName.DEFAULT_USER_PERMISSION_GROUP);
        defaultRoleForUser.setDescription("This is a role for giving access to all the users. Please exercise caution while editing this role.");
        defaultRoleForUser.setTenantId(tenant.getId());
        defaultRoleForUser.setPolicies(Set.of(
                Policy.builder()
                        .permission(READ_PERMISSION_GROUPS.getValue())
                        .permissionGroups(Set.of(instanceAdminPermissionGroupId))
                        .build(),
                Policy.builder()
                        .permission(MANAGE_PERMISSION_GROUPS.getValue())
                        .permissionGroups(Set.of(instanceAdminPermissionGroupId))
                        .build()
        ));

        Query userQuery = new Query();
        userQuery.addCriteria(where(fieldName(QUser.user.tenantId)).is(tenant.getId()))
                .addCriteria(where(fieldName(QUser.user.email)).ne(FieldName.ANONYMOUS_USER))
                .addCriteria(where(fieldName(QUser.user.deletedAt)).is(null));
        userQuery.fields().include("_id", "email");
        List<User> users = mongoTemplate.find(userQuery, User.class);

        Set<String> userIds = users.stream().map(User::getId).collect(Collectors.toSet());

        // Give access to all existing users to the permission group.
        defaultRoleForUser.setAssignedToUserIds(userIds);
        PermissionGroup savedPermissionGroup = mongoTemplate.save(defaultRoleForUser);
        String savedPermissionGroupId = savedPermissionGroup.getId();

        // Now give access to create workspaces in the tenant
        tenant.getPolicies().stream().filter(policy -> policy.getPermission().equals(CREATE_WORKSPACES.getValue()))
                .findFirst()
                .ifPresent(policy -> {
                    policy.getPermissionGroups().add(savedPermissionGroupId);
                    mongoTemplate.save(tenant);
                });

        // Now store the default role id in the config collection
        defaultRoleConfig = new Config();
        defaultRoleConfig.setName(FieldName.DEFAULT_USER_PERMISSION_GROUP);

        defaultRoleConfig.setConfig(new JSONObject(Map.of(DEFAULT_PERMISSION_GROUP, savedPermissionGroupId)));

        mongoTemplate.save(defaultRoleConfig);

        // evict the cache entry for all the impacted users
        evictPermissionCacheForUsers(userIds, mongoTemplate, cacheableRepositoryHelper);
    }

    @ChangeSet(order = "011", id = "set-create-datasource-action-permission", author = "")
    public void setCreateDatasourceActionPermissions(MongoTemplate mongoTemplate) {
        Query datasourceQuery = new Query();
        Criteria manageDatasourcePermissionCriteria = Criteria.where("policies.permission").is(MANAGE_DATASOURCES.getValue());
        Criteria notCreateDatasourceActionsPermissionCriteria = Criteria.where("policies.permission").ne(CREATE_DATASOURCE_ACTIONS.getValue());
        datasourceQuery.fields().include(fieldName(QDatasource.datasource.id), fieldName(QDatasource.datasource.policies));
        datasourceQuery.addCriteria(manageDatasourcePermissionCriteria.andOperator(notCreateDatasourceActionsPermissionCriteria));
        List<Datasource> datasourceList = mongoTemplate.find(datasourceQuery, Datasource.class);

        datasourceList.forEach(datasource -> {
            Set<Policy> currentPolicies = datasource.getPolicies();
            Optional<Policy> manageDatasourcePolicy = currentPolicies.stream()
                    .filter(policy -> policy.getPermission().equals(MANAGE_DATASOURCES.getValue()))
                    .findFirst();
            if (manageDatasourcePolicy.isPresent()) {
                currentPolicies.add(Policy.builder()
                        .permission(CREATE_DATASOURCE_ACTIONS.getValue())
                        .permissionGroups(manageDatasourcePolicy.get().getPermissionGroups())
                        .build());
                Query datasourceUpdatePolicyQuery = new Query().addCriteria(Criteria.where("id").is(datasource.getId()));
                Update updatePolicy = new Update().set("policies", currentPolicies);
                mongoTemplate.updateFirst(datasourceUpdatePolicyQuery, updatePolicy, Datasource.class);
            }
        });
    }

    @ChangeSet(order = "012", id = "update-usage-pulse-index", author = "")
    public void updateUsagePulseIndex(MongoTemplate mongoTemplate) {
        ensureIndexes(
            mongoTemplate,
            UsagePulse.class,
            makeIndex(
                fieldName(QUsagePulse.usagePulse.createdAt),
                fieldName(QUsagePulse.usagePulse.deleted)
            )
            .named("createdAt_deleted_compound_index")
        );
    }

    /**
     * We have modified the usage pulse format to include instanceId and tenantId. This migration removes the stale
     * pulses created before updating the format
     * @param mongoTemplate
     */
    @ChangeSet(order = "013", id = "remove-stale-usage-pulses", author = "")
    public void removeStaleUsagePulses(MongoTemplate mongoTemplate) {
        final Update update = new Update();
        final Instant deletedAt = Instant.now();
        update.set(fieldName(QUsagePulse.usagePulse.deletedAt), deletedAt);
        update.set(fieldName(QUsagePulse.usagePulse.deleted), true);


        Query invalidUsagePulseQuery = new Query();
        invalidUsagePulseQuery.addCriteria(where(fieldName(QUsagePulse.usagePulse.tenantId)).exists(false))
            .addCriteria(where(fieldName(QUser.user.deleted)).ne(true));

        mongoTemplate.updateMulti(invalidUsagePulseQuery, update, UsagePulse.class);
    }

    /**
     * Migration to move license key from env to DB under tenant configuration
     * Discussion on why @Value is not supported in Mongock: https://github.com/mongock/mongock/discussions/525
     * @param mongoTemplate
     */
    @ChangeSet(order = "013", id = "move-license-key-to-db", author = "", runAlways = true)
    public void moveLicenseKeyToDB(MongoTemplate mongoTemplate, @NonLockGuarded LicenseConfig licenseConfig) {

        // Get default tenant as we only have single entry in tenant collection (before multi-tenancy is introduced)
        Tenant tenant = mongoTemplate.findOne(new Query(), Tenant.class);
        assert tenant != null;
        TenantConfiguration tenantConfiguration = tenant.getTenantConfiguration() == null
                ? new TenantConfiguration()
                : tenant.getTenantConfiguration();

        String licenseKey = licenseConfig.getLicenseKey();
        if (StringUtils.hasLength(licenseKey)
            && (tenantConfiguration.getLicense() == null
                || !StringUtils.hasText(tenantConfiguration.getLicense().getKey()))) {

                log.info("Moving license key to DB");
                TenantConfiguration.License license = new TenantConfiguration.License();
                license.setActive(true);
                license.setStatus(LicenseStatus.ACTIVE);
                license.setKey(licenseKey);
                license.setOrigin(LicenseOrigin.ENTERPRISE);
                tenantConfiguration.setLicense(license);
                tenant.setTenantConfiguration(tenantConfiguration);
                mongoTemplate.save(tenant);
        }

        if (!StringUtils.hasLength(licenseKey)) {
            log.info("Unable to find license key in docker.env");
        }
    }

    @ChangeSet(order = "014", id = "update-license-status-for-invalid-keys", author = "")
    public void updateLicenseStatus(MongoTemplate mongoTemplate) {

        // Get default tenant as we only have single entry in tenant collection (before multi-tenancy is introduced)
        Tenant tenant = mongoTemplate.findOne(new Query(), Tenant.class);
        assert tenant != null;
        TenantConfiguration tenantConfiguration = tenant.getTenantConfiguration();

        if (tenantConfiguration != null
            && tenantConfiguration.getLicense() != null
            && !StringUtils.hasText(tenantConfiguration.getLicense().getKey())) {

            tenantConfiguration.setLicense(new TenantConfiguration.License());
            mongoTemplate.save(tenant);
        }
    }

}
