package com.appsmith.server.migrations.db.ce;

import com.appsmith.server.configurations.CommonConfig;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.domains.Config;
import com.appsmith.server.domains.PermissionGroup;
import com.appsmith.server.domains.User;
import com.appsmith.server.dtos.InstanceAdminMetaDTO;
import com.appsmith.server.helpers.CollectionUtils;
import io.mongock.api.annotations.ChangeUnit;
import io.mongock.api.annotations.Execution;
import io.mongock.api.annotations.RollbackExecution;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.util.StringUtils;
import reactor.core.publisher.Flux;

import static com.appsmith.server.constants.ce.FieldNameCE.INSTANCE_ADMIN_CONFIG;
import static com.appsmith.server.helpers.ce.bridge.BridgeQuery.where;
import static com.appsmith.server.migrations.constants.FieldName.DEFAULT_CLOUD_ADMIN_EMAIL;
import static com.appsmith.server.repositories.ce.BaseAppsmithRepositoryCEImpl.notDeleted;

@RequiredArgsConstructor
@Slf4j
@ChangeUnit(order = "064", id = "add_instance_admin_details_to_config_collection")
public class Migration064AddInstanceAdminDetailsToDB {

    private final MongoTemplate mongoTemplate;
    private final CommonConfig commonConfig;

    @RollbackExecution
    public void rollbackExecution() {}

    @Execution
    public void executeMigration() {
        // Add instance admin details to the DB
        // This migration is idempotent and can be run multiple times without any side effects
        log.info("Adding instance admin details to the DB");
        // Check if instance admin details are already present in the DB to make the migration idempotent
        if (verifyIfInstanceAdminDetailsArePresent(mongoTemplate)) {
            return;
        }

        // Add instance admin details to the DB
        Query instanceAdminRoleQuery = new Query()
                .addCriteria(where(FieldName.NAME).is(FieldName.INSTANCE_ADMIN_ROLE))
                .addCriteria(notDeleted());
        PermissionGroup instanceAdminPG = mongoTemplate.findOne(instanceAdminRoleQuery, PermissionGroup.class);
        if (instanceAdminPG == null) {
            log.error("Instance admin permission group not found in the DB. Skipping migration 064");
            return;
        }
        String adminEmail = null;
        if (commonConfig.isCloudHosting()) {
            // As a fallback, use the default admin email for cloud hosting
            adminEmail = DEFAULT_CLOUD_ADMIN_EMAIL;
        } else if (!CollectionUtils.isNullOrEmpty(instanceAdminPG.getAssignedToUserIds())) {
            adminEmail = Flux.fromIterable(instanceAdminPG.getAssignedToUserIds())
                    .map(userId -> {
                        User user = mongoTemplate.findOne(
                                new Query()
                                        .addCriteria(where(FieldName.ID).is(userId))
                                        .addCriteria(notDeleted()),
                                User.class);
                        return user != null ? user.getEmail() : "";
                    })
                    .filter(email -> email != null && email.contains("@"))
                    .blockFirst();
        }

        if (!StringUtils.hasLength(adminEmail)) {
            adminEmail = commonConfig.getAdminEmails().stream()
                    .filter(email -> email != null && email.contains("@"))
                    .findFirst()
                    .orElse(null);
        }
        Config config = new Config();
        config.setName(INSTANCE_ADMIN_CONFIG);
        if (StringUtils.hasLength(adminEmail)) {
            config.setConfig(InstanceAdminMetaDTO.toJsonObject(adminEmail));
            mongoTemplate.save(config);
        }
    }

    public static boolean verifyIfInstanceAdminDetailsArePresent(MongoTemplate mongoTemplate) {
        Query instanceAdminConfigQuery = new Query()
                .addCriteria(where(FieldName.NAME).is(FieldName.INSTANCE_ADMIN_CONFIG))
                .addCriteria(notDeleted());
        Config instanceAdminConfig = mongoTemplate.findOne(instanceAdminConfigQuery, Config.class);
        boolean adminDetailsPresent = instanceAdminConfig != null
                && StringUtils.hasLength(InstanceAdminMetaDTO.fromJsonObject(instanceAdminConfig.getConfig())
                        .getEmail());
        if (adminDetailsPresent) {
            log.info("Instance admin details already present in the DB. Skipping migration 64");
        }
        return adminDetailsPresent;
    }
}
