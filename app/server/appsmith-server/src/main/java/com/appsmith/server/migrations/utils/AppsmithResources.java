package com.appsmith.server.migrations.utils;

import com.appsmith.server.constants.FieldName;
import com.appsmith.server.domains.Config;
import com.appsmith.server.domains.PermissionGroup;
import com.appsmith.server.domains.QConfig;
import com.appsmith.server.domains.QPermissionGroup;
import com.appsmith.server.domains.QTenant;
import com.appsmith.server.domains.QUser;
import com.appsmith.server.domains.Tenant;
import com.appsmith.server.domains.User;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Query;

import static com.appsmith.server.constants.FieldName.PROVISIONING_CONFIG;
import static com.appsmith.server.constants.FieldName.PROVISIONING_USER;
import static com.appsmith.server.constants.ce.FieldNameCE.DEFAULT;
import static com.appsmith.server.constants.ce.FieldNameCE.DEFAULT_PERMISSION_GROUP;
import static com.appsmith.server.repositories.ce.BaseAppsmithRepositoryCEImpl.fieldName;
import static org.springframework.data.mongodb.core.query.Criteria.where;

public class AppsmithResources {

    public static Config getInstanceConfig(MongoTemplate mongoTemplate) {
        Query instanceConfigQuery = new Query();
        instanceConfigQuery.addCriteria(where(fieldName(QConfig.config1.name)).is(FieldName.INSTANCE_CONFIG));
        return mongoTemplate.findOne(instanceConfigQuery, Config.class);
    }

    public static PermissionGroup getInstanceAdminRole(MongoTemplate mongoTemplate) {
        Config instanceConfig = getInstanceConfig(mongoTemplate);
        String instanceAdminRoleId = (String) instanceConfig.getConfig().get(DEFAULT_PERMISSION_GROUP);
        Query instanceAdminRoleQuery = new Query();
        instanceAdminRoleQuery.addCriteria(where(fieldName(QPermissionGroup.permissionGroup.id)).is(instanceAdminRoleId));
        return mongoTemplate.findOne(instanceAdminRoleQuery, PermissionGroup.class);
    }

    public static String getInstanceAdminRoleId(MongoTemplate mongoTemplate) {
        Config instanceConfig = getInstanceConfig(mongoTemplate);
        return (String) instanceConfig.getConfig().get(DEFAULT_PERMISSION_GROUP);
    }

    public static Tenant getDefaultTenant(MongoTemplate mongoTemplate) {
        Query tenantQuery = new Query();
        tenantQuery.addCriteria(where(fieldName(QTenant.tenant.slug)).is(DEFAULT));
        return mongoTemplate.findOne(tenantQuery, Tenant.class);
    }

    public static User getProvisionUser(MongoTemplate mongoTemplate) {
        Query provisionUserQuery = new Query();
        provisionUserQuery.addCriteria(where(fieldName(QUser.user.email)).is(PROVISIONING_USER));
        return mongoTemplate.findOne(provisionUserQuery, User.class);
    }

    public static Config getProvisionConfig(MongoTemplate mongoTemplate) {
        Query instanceConfigQuery = new Query();
        instanceConfigQuery.addCriteria(where(fieldName(QConfig.config1.name)).is(PROVISIONING_CONFIG));
        return mongoTemplate.findOne(instanceConfigQuery, Config.class);
    }

    public static String getProvisioningRoleId(MongoTemplate mongoTemplate) {
        Config instanceConfig = getProvisionConfig(mongoTemplate);
        return (String) instanceConfig.getConfig().get(DEFAULT_PERMISSION_GROUP);
    }

    public static PermissionGroup getProvisioningRole(MongoTemplate mongoTemplate) {
        Config instanceConfig = getProvisionConfig(mongoTemplate);
        String instanceAdminRoleId = (String) instanceConfig.getConfig().get(DEFAULT_PERMISSION_GROUP);
        Query instanceAdminRoleQuery = new Query();
        instanceAdminRoleQuery.addCriteria(where(fieldName(QPermissionGroup.permissionGroup.id)).is(instanceAdminRoleId));
        return mongoTemplate.findOne(instanceAdminRoleQuery, PermissionGroup.class);
    }
}
