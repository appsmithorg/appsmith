package com.appsmith.server.migrations.db.ce;

import io.mongock.api.annotations.ChangeUnit;
import io.mongock.api.annotations.Execution;
import io.mongock.api.annotations.RollbackExecution;
import lombok.RequiredArgsConstructor;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;

import static org.springframework.data.mongodb.core.query.Criteria.where;

/**
 * Delete entries in changelog for the migrations deleted in code.
 * Why? Because if we add a new migration in the future that has the same ID as one of these, Mongock won't complain at
 * startup because it won't see any clash, but for those old instances that have Changelog entries for these IDs
 * already, the new migration will be silently ignored, since Mongock will think it has already been executed.
 */
@ChangeUnit(order = "039", id = "delete-old-migrations", author = "")
@RequiredArgsConstructor
public class Migration039DeleteOldMigrations {

    private final MongoTemplate mongoTemplate;

    @RollbackExecution
    public void rollbackExecution() {}

    @Execution
    public void execute() {
        final Criteria criteria = where("changeId")
                .in(
                        // List generated with the following command:
                        // git diff release HEAD | awk -F\" '/^-[[:space:]]+@ChangeSet/ {print "\"" $4 "\","}'
                        // Once the PR is merged, the `git` command would just be for the changes of the squash commit.
                        "remove-org-name-index",
                        "application-deleted-at",
                        "hide-rapidapi-plugin",
                        "datasource-deleted-at",
                        "page-deleted-at",
                        "friendly-plugin-names",
                        "add-delete-datasource-perm-existing-groups",
                        "install-default-plugins-to-all-organizations",
                        "ensure-datasource-created-and-updated-at-fields",
                        "add-index-for-sequence-name",
                        "fix-double-escapes",
                        "encrypt-password",
                        "execute-action-for-read-action",
                        "invite-and-public-permissions",
                        "migrate-page-and-actions",
                        "new-action-add-index-pageId",
                        "ensure-app-icons-and-colors",
                        "update-authentication-type",
                        "add-isSendSessionEnabled-key-for-datasources",
                        "add-app-viewer-invite-policy",
                        "update-database-encode-params-toggle",
                        "update-postgres-plugin-preparedStatement-config",
                        "fix-dynamicBindingPathListForActions",
                        "update-database-action-configuration-timeout",
                        "change-applayout-type-definition",
                        "update-mysql-postgres-mongo-ssl-mode",
                        "add-commenting-permissions",
                        "create-entry-in-sequence-per-organization-for-datasource",
                        "migrate-smartSubstitution-dataType",
                        "update-mongo-import-from-srv-field",
                        "delete-mongo-datasource-structures",
                        "set-mongo-actions-type-to-raw",
                        "update-firestore-where-conditions-data",
                        "add-application-export-permissions",
                        "mongo-form-merge-update-commands",
                        "ensure-user-created-and-updated-at-fields",
                        "add-and-update-order-for-all-pages",
                        "mongo-form-migrate-raw",
                        "remove-order-field-from-application- pages",
                        "encrypt-certificate",
                        "application-git-metadata",
                        "update-google-sheet-plugin-smartSubstitution-config",
                        "uninstall-mongo-uqi-plugin",
                        "migrate-mongo-to-uqi",
                        "migrate-mongo-uqi-dynamicBindingPathList",
                        "delete-orphan-actions",
                        "migrate-old-app-color-to-new-colors",
                        "update-s3-permanent-url-toggle-default-value",
                        "application-git-metadata-index",
                        "set-slug-to-application-and-page",
                        "update-list-widget-trigger-paths",
                        "update-s3-action-configuration-for-type",
                        "fix-ispublic-is-false-for-public-apps",
                        "update-js-action-client-side-execution",
                        "update-mockdb-endpoint",
                        "insert-default-resources",
                        "flush-spring-redis-keys",
                        "migrate-firestore-to-uqi-2",
                        "migrate-firestore-pagination-data",
                        "update-mongodb-mockdb-endpoint",
                        "create-system-themes",
                        "add-limit-field-data-to-mongo-aggregate-cmd",
                        "update-mockdb-endpoint-2",
                        "migrate-from-RSA-SHA1-to-ECDSA-SHA2-protocol-for-key-generation",
                        "create-system-themes-v2",
                        "set-firestore-smart-substitution-to-false-for-old-cmds",
                        "deprecate-archivedAt-in-action",
                        "update-form-data-for-uqi-mode",
                        "add-isConfigured-flag-for-all-datasources",
                        "set-application-version",
                        "delete-orphan-pages",
                        "copy-organization-to-workspaces",
                        "add-tenant-to-all-workspaces",
                        "migrate-permission-in-workspace",
                        "migrate-organizationId-to-workspaceId-in-newaction-datasource",
                        "add-default-permission-groups",
                        "mark-public-apps",
                        "mark-workspaces-for-inheritance",
                        "inherit-policies-to-every-child-object",
                        "make-applications-public",
                        "install-graphql-plugin-to-remaining-workspaces",
                        "delete-rapid-api-plugin-related-items",
                        "remove-preferred-ssl-mode-from-mysql");

        mongoTemplate.remove(Query.query(criteria), "mongockChangeLog");
    }
}
