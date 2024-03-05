package com.appsmith.server.migrations.db;

import com.appsmith.server.constants.FieldName;
import com.appsmith.server.domains.Package;
import com.appsmith.server.domains.QPackage;
import io.mongock.api.annotations.ChangeUnit;
import io.mongock.api.annotations.Execution;
import io.mongock.api.annotations.RollbackExecution;
import lombok.extern.slf4j.Slf4j;
import org.bson.Document;
import org.springframework.data.mongodb.core.MongoTemplate;

import static com.appsmith.server.migrations.DatabaseChangelog1.dropIndexIfExists;
import static com.appsmith.server.migrations.DatabaseChangelog1.ensureIndexes;
import static com.appsmith.server.migrations.DatabaseChangelog1.makeIndex;
import static com.appsmith.server.repositories.ce.BaseAppsmithRepositoryCEImpl.completeFieldName;
import static com.appsmith.server.repositories.ce.BaseAppsmithRepositoryCEImpl.fieldName;

@Slf4j
@ChangeUnit(order = "047-ee-03", id = "new-composite-indexes-on-package", author = " ")
public class Migration047EE03ModifyIndexesForPackage {
    private final MongoTemplate mongoTemplate;

    public static final String ws_pkg_name_deleted_at_uindex = "ws_pkg_name_deleted_at_uindex";
    public static final String ws_pkg_uuid_name_branch_deleted_at_uindex = "ws_pkg_uuid_name_branch_deleted_at_uindex";
    public static final String ws_pkg_uuid_deleted_index = "ws_pkg_uuid_deleted_index";

    public Migration047EE03ModifyIndexesForPackage(MongoTemplate mongoTemplate) {
        this.mongoTemplate = mongoTemplate;
    }

    @RollbackExecution
    public void rollBackExecution() {}

    @Execution
    public void createCompositeUniqueIndexForPackage() {
        // Remove older indexes
        dropIndexIfExists(mongoTemplate, Package.class, ws_pkg_name_deleted_at_uindex);
        dropIndexIfExists(mongoTemplate, Package.class, ws_pkg_uuid_deleted_index);

        // Add single new index (compound, uniq)
        dropIndexIfExists(mongoTemplate, Package.class, ws_pkg_uuid_name_branch_deleted_at_uindex);
        ensureIndexes(
                mongoTemplate,
                Package.class,
                makeIndex(
                                fieldName(QPackage.package$.workspaceId),
                                fieldName(QPackage.package$.packageUUID),
                                completeFieldName(QPackage.package$.unpublishedPackage.name),
                                completeFieldName(QPackage.package$.gitArtifactMetadata.branchName),
                                fieldName(QPackage.package$.deletedAt),
                                FieldName.DELETED)
                        .unique()
                        .partial(() -> {
                            Document document = new Document();
                            Document condition = new Document();
                            condition.put("$exists", true);
                            document.put(completeFieldName(QPackage.package$.unpublishedPackage.name), condition);
                            return document;
                        })
                        .named(ws_pkg_uuid_name_branch_deleted_at_uindex));
    }
}
