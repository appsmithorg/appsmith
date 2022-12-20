package com.appsmith.server.migrations;

import com.appsmith.external.models.Policy;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.domains.AuditLog;
import com.appsmith.server.domains.Config;
import com.appsmith.server.domains.Environment;
import com.appsmith.server.domains.EnvironmentVariable;
import com.appsmith.server.domains.PermissionGroup;
import com.appsmith.server.domains.QConfig;
import com.appsmith.server.domains.QPermissionGroup;
import com.appsmith.server.domains.QTenant;
import com.appsmith.server.domains.Tenant;
import com.appsmith.server.domains.TenantConfiguration;
import com.appsmith.server.domains.UserGroup;
import com.appsmith.server.domains.Workspace;
import com.appsmith.server.dtos.Permission;
import com.appsmith.server.helpers.PolicyUtils;
import com.github.cloudyrock.mongock.ChangeLog;
import com.github.cloudyrock.mongock.ChangeSet;
import com.github.cloudyrock.mongock.driver.mongodb.springdata.v3.decorator.impl.MongockTemplate;
import io.changock.migration.api.annotations.NonLockGuarded;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.mongodb.core.index.Index;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Update;

import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

import static com.appsmith.server.acl.AclPermission.READ_PERMISSION_GROUPS;
import static com.appsmith.server.acl.AclPermission.READ_PERMISSION_GROUP_MEMBERS;
import static com.appsmith.server.acl.AppsmithRole.TENANT_ADMIN;
import static com.appsmith.server.constants.FieldName.DEFAULT_PERMISSION_GROUP;
import static com.appsmith.server.constants.FieldName.PUBLIC_PERMISSION_GROUP;
import static com.appsmith.server.migrations.DatabaseChangelog.ensureIndexes;
import static com.appsmith.server.migrations.DatabaseChangelog.makeIndex;
import static com.appsmith.server.repositories.BaseAppsmithRepositoryImpl.fieldName;
import static org.springframework.data.mongodb.core.query.Criteria.where;

@Slf4j
@ChangeLog(order = "100")
// Marking this class as EE because it contains a migration that is only applicable to EE. Making the changelog order
// to be 100 so that it is executed after all the CE migrations
public class DatabaseChangelogEE {

    /**
     * TODO : Remove the runAlways to false once the RBAC feature is dev complete
     */
    @ChangeSet(order = "001", id = "add-tenant-admin-permissions-instance-admin", author = "", runAlways = true)
    public void addTenantAdminPermissionsToInstanceAdmin(MongockTemplate mongockTemplate, @NonLockGuarded PolicyUtils policyUtils) {
        Query tenantQuery = new Query();
        tenantQuery.addCriteria(where(fieldName(QTenant.tenant.slug)).is("default"));
        Tenant defaultTenant = mongockTemplate.findOne(tenantQuery, Tenant.class);

        Query instanceConfigurationQuery = new Query();
        instanceConfigurationQuery.addCriteria(where(fieldName(QConfig.config1.name)).is(FieldName.INSTANCE_CONFIG));
        Config instanceAdminConfiguration = mongockTemplate.findOne(instanceConfigurationQuery, Config.class);

        String instanceAdminPermissionGroupId = (String) instanceAdminConfiguration.getConfig().get(DEFAULT_PERMISSION_GROUP);

        Query permissionGroupQuery = new Query();
        permissionGroupQuery.addCriteria(where(fieldName(QPermissionGroup.permissionGroup.id)).is(instanceAdminPermissionGroupId));

        PermissionGroup instanceAdminPGBeforeChanges = mongockTemplate.findOne(permissionGroupQuery, PermissionGroup.class);

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
        mongockTemplate.save(instanceAdminPG);

        Map<String, Policy> tenantPolicy = policyUtils.generatePolicyFromPermissionGroupForObject(instanceAdminPG, defaultTenant.getId());
        Tenant updatedTenant = policyUtils.addPoliciesToExistingObject(tenantPolicy, defaultTenant);
        mongockTemplate.save(updatedTenant);
    }

    @ChangeSet(order = "002", id = "add-index-user-groups", author = "")
    public void addIndexOnUserGroupCollection(MongockTemplate mongockTemplate, @NonLockGuarded PolicyUtils policyUtils) {
        Index tenantIdIndex = makeIndex("tenantId");
        ensureIndexes(mongockTemplate, UserGroup.class, tenantIdIndex);
    }

    @ChangeSet(order = "003", id = "add-index-for-audit-logs", author = "", runAlways = true)
    public void addIndexOnAuditLogsCollection(MongockTemplate mongockTemplate) {
        Index userEmailIndex = makeIndex("user.email");
        ensureIndexes(mongockTemplate, AuditLog.class, userEmailIndex);

        Index resourceIdIndex = makeIndex("resource.id");
        ensureIndexes(mongockTemplate, AuditLog.class, resourceIdIndex);

        Index resourceTypeIndex = makeIndex("resource.type");
        ensureIndexes(mongockTemplate, AuditLog.class, resourceTypeIndex);

        Index createdTimeIndex = makeIndex("timestamp");
        ensureIndexes(mongockTemplate, AuditLog.class, createdTimeIndex);

        Index eventIndex = makeIndex("event");
        ensureIndexes(mongockTemplate, AuditLog.class, eventIndex);

        Index userEmailEventCompoundIndex = makeIndex("event", "user.email", "timestamp").named("userEmail_event_compound_index");
        ensureIndexes(mongockTemplate, AuditLog.class, userEmailEventCompoundIndex);
    }

    @ChangeSet(order = "004", id = "add-brand-tenant-configuration", author = "")
    public void addBrandTenantConfiguration(MongockTemplate mongockTemplate, @NonLockGuarded PolicyUtils policyUtils) {
        Query tenantQuery = new Query();
        tenantQuery.addCriteria(where(fieldName(QTenant.tenant.slug)).is("default"));
        Tenant defaultTenant = mongockTemplate.findOne(tenantQuery, Tenant.class);
        TenantConfiguration tenantConfiguration = new TenantConfiguration();
        tenantConfiguration.setWhiteLabelLogo("https://assets.appsmith.com/appsmith-logo-full.png");
        tenantConfiguration.setWhiteLabelEnable("false");
        tenantConfiguration.setWhiteLabelFavicon("https://assets.appsmith.com/appsmith-favicon-orange.ico");
        defaultTenant.setTenantConfiguration(tenantConfiguration);
        mongockTemplate.save(defaultTenant);
    }

    @ChangeSet(order = "005", id = "add-read-pg-to-instance-admins", author = "")
    public void addReadPermissionGroupForInstanceAdmin(MongockTemplate mongockTemplate) {
        Query instanceConfigurationQuery = new Query();
        instanceConfigurationQuery.addCriteria(where(fieldName(QConfig.config1.name)).is(FieldName.INSTANCE_CONFIG));
        Config instanceAdminConfiguration = mongockTemplate.findOne(instanceConfigurationQuery, Config.class);

        // Get the default Instance Admin permission group Id from the DB
        String instanceAdminPermissionGroupId = (String) instanceAdminConfiguration.getConfig().get(DEFAULT_PERMISSION_GROUP);

        // Update all the permission groups with `read:permissionGroups` policy for the above permissionGroupId
        Policy policy = Policy.builder()
                .permission(READ_PERMISSION_GROUPS.getValue())
                .permissionGroups(Set.of(instanceAdminPermissionGroupId))
                .build();
        Query query = new Query(where("policies.permission").ne(READ_PERMISSION_GROUPS));
        Update update = new Update().addToSet("policies", policy);
        mongockTemplate.updateMulti(query, update, PermissionGroup.class);
    }

    @ChangeSet(order = "006", id = "introduce-missing-permissions", author = "")
    public void addMissingPermissionsToExistingObjects(MongockTemplate mongockTemplate) {

        // Find al the administrator permission groups and give make public to the default workspace
        Query adminPermissionGroupQuery = new Query().addCriteria(where("name").regex("^Administrator - .*"));
        adminPermissionGroupQuery.fields().include("_id", "defaultWorkspaceId");
        List<PermissionGroup> permissionGroups = mongockTemplate.find(adminPermissionGroupQuery, PermissionGroup.class);

        permissionGroups.forEach(permissionGroup -> {
            String defaultWorkspaceId = permissionGroup.getDefaultWorkspaceId();
            if (defaultWorkspaceId != null) {

                Policy makePublicPolicy = Policy.builder()
                        .permission("makePublic:workspaceApplications")
                        .permissionGroups(Set.of(permissionGroup.getId()))
                        .build();
                Query workspaceQuery = new Query().addCriteria(where("id").is(defaultWorkspaceId));

                mongockTemplate.updateFirst(workspaceQuery, new Update().addToSet("policies", makePublicPolicy), Workspace.class);
            }
        });
    }

    @ChangeSet(order = "007", id = "remove-internal-permission-group-read-permission", author = "")
    public void removeReadPermissionForInternalPermissionGroups(MongockTemplate mongockTemplate) {
        Criteria userManagementPgCriteria = where("name").regex(" User Management$");
        Criteria publicPermissionGroupPgCriteria = where("name").is(PUBLIC_PERMISSION_GROUP);

        Criteria interestingPermissionGroupCriteria = new Criteria().orOperator(userManagementPgCriteria, publicPermissionGroupPgCriteria);

        Criteria readPgCriteria = where("policies.permission").is("read:permissionGroups");

        Query query = new Query(interestingPermissionGroupCriteria.andOperator(readPgCriteria));

        Update update = new Update().set("policies.$.permissionGroups", Set.of());

        mongockTemplate.updateMulti(query, update, PermissionGroup.class);
    }

    @ChangeSet(order = "008", id = "add-index-for-environment", author = "")
    public void addInitialIndexforEnvironmentAndEnvironmentVariable(MongockTemplate mongoTemplate) {
        Index environmentUniqueness = makeIndex("name", "workspaceId", "deletedAt").unique()
                .named("environment_compound_index");

        Index createdAt = makeIndex("createdAt");

        ensureIndexes(mongoTemplate, Environment.class, createdAt, environmentUniqueness);
        ensureIndexes(mongoTemplate, EnvironmentVariable.class, createdAt);
    }

    @ChangeSet(order = "009", id = "remove-default-logo-urls", author = "")
    public void removeDefaultLogoURLs(MongockTemplate mongockTemplate) {
        mongockTemplate.updateMulti(
                new Query(where("tenantConfiguration.whiteLabelLogo").is("https://assets.appsmith.com/appsmith-logo-full.png")),
                new Update().unset("tenantConfiguration.whiteLabelLogo"),
                Tenant.class
        );

        mongockTemplate.updateMulti(
                new Query(where("tenantConfiguration.whiteLabelFavicon").is("https://assets.appsmith.com/appsmith-favicon-orange.ico")),
                new Update().unset("tenantConfiguration.whiteLabelFavicon"),
                Tenant.class
        );
    }

}
