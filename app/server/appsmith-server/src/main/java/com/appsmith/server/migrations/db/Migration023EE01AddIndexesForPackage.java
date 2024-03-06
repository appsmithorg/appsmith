package com.appsmith.server.migrations.db;

import com.appsmith.server.constants.FieldName;
import com.appsmith.server.domains.Package;
import com.appsmith.server.domains.QPackage;
import io.mongock.api.annotations.ChangeUnit;
import io.mongock.api.annotations.Execution;
import io.mongock.api.annotations.RollbackExecution;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.mongodb.core.MongoTemplate;

import static com.appsmith.server.migrations.DatabaseChangelog1.dropIndexIfExists;
import static com.appsmith.server.migrations.DatabaseChangelog1.ensureIndexes;
import static com.appsmith.server.migrations.DatabaseChangelog1.makeIndex;
import static com.appsmith.server.repositories.ce.BaseAppsmithRepositoryCEImpl.fieldName;

@Slf4j
@ChangeUnit(order = "023-ee-01", id = "composite-indexes-on-package", author = " ")
public class Migration023EE01AddIndexesForPackage {
    private final MongoTemplate mongoTemplate;

    public static final String workspace_pkg_name_deleted_at_uindex = "ws_pkg_name_deleted_at_uindex";
    public static final String workspace_pkg_uuid_deleted_index = "ws_pkg_uuid_deleted_index";

    public Migration023EE01AddIndexesForPackage(MongoTemplate mongoTemplate) {
        this.mongoTemplate = mongoTemplate;
    }

    @RollbackExecution
    public void rollBackExecution() {}

    @Execution
    public void createCompositeUniqueIndexForPackage() {
        dropIndexIfExists(mongoTemplate, Package.class, workspace_pkg_name_deleted_at_uindex);
        ensureIndexes(
                mongoTemplate,
                Package.class,
                makeIndex(
                                fieldName(QPackage.package$.workspaceId),
                                "unpublishedPackage.name",
                                fieldName(QPackage.package$.deletedAt),
                                FieldName.DELETED,
                                fieldName(QPackage.package$.lastPublishedAt))
                        .unique()
                        .named(workspace_pkg_name_deleted_at_uindex));

        dropIndexIfExists(mongoTemplate, Package.class, workspace_pkg_uuid_deleted_index);
        ensureIndexes(
                mongoTemplate,
                Package.class,
                makeIndex(
                                fieldName(QPackage.package$.workspaceId),
                                fieldName(QPackage.package$.packageUUID),
                                fieldName(QPackage.package$.deletedAt),
                                FieldName.DELETED)
                        .named(workspace_pkg_uuid_deleted_index));
    }
}
