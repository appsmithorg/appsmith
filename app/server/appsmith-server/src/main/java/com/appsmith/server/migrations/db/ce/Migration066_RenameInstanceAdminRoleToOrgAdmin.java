package com.appsmith.server.migrations.db.ce;

import com.appsmith.server.domains.Config;
import com.appsmith.server.domains.Organization;
import com.appsmith.server.domains.PermissionGroup;
import io.mongock.api.annotations.ChangeUnit;
import io.mongock.api.annotations.Execution;
import io.mongock.api.annotations.RollbackExecution;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Update;

@Slf4j
@ChangeUnit(id = "rename-instance-admin-role-to-org-admin-role", order = "066")
public class Migration066_RenameInstanceAdminRoleToOrgAdmin {

    private final MongoTemplate mongoTemplate;

    public Migration066_RenameInstanceAdminRoleToOrgAdmin(MongoTemplate mongoTemplate) {
        this.mongoTemplate = mongoTemplate;
    }

    @RollbackExecution
    public void rollbackExecution() {}

    @Execution
    public void execute() {
        try {
            // 1. Find instanceConfig
            Config instanceConfig =
                    mongoTemplate.findOne(Query.query(Criteria.where("name").is("instanceConfig")), Config.class);

            if (instanceConfig == null || instanceConfig.getConfig() == null) {
                log.error("Instance config not found");
                return;
            }

            String instanceAdminRoleId =
                    instanceConfig.getConfig().get("defaultPermissionGroup").toString();

            // 2. Find default organization - add null check
            Organization defaultOrganization = mongoTemplate.findOne(new Query(), Organization.class);
            if (defaultOrganization == null) {
                log.error("Default organization not found");
                return;
            }

            // 3. Update permission group with all fields in a single update
            Update update = Update.update("name", "Organization Administrator Role")
                    .set("defaultDomainId", defaultOrganization.getId())
                    .set("defaultDomainType", "Organization"); // Use string directly instead of class name

            long modifiedCount = mongoTemplate
                    .updateFirst(
                            Query.query(Criteria.where("_id").is(instanceAdminRoleId)), update, PermissionGroup.class)
                    .getModifiedCount();

            if (modifiedCount > 0) {
                log.info(
                        "Successfully renamed instance admin role to organization admin role for group: {}",
                        instanceAdminRoleId);
            } else {
                log.warn("No permission group was updated for id: {}", instanceAdminRoleId);
            }

        } catch (Exception e) {
            log.error("Error while renaming instance admin role", e);
            throw e;
        }
    }
}
