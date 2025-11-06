package com.appsmith.server.migrations.db.ce;

import com.appsmith.server.domains.Application;
import com.appsmith.server.domains.Application.Fields;
import com.appsmith.server.domains.NewPage;
import io.mongock.api.annotations.ChangeUnit;
import io.mongock.api.annotations.Execution;
import io.mongock.api.annotations.RollbackExecution;
import lombok.extern.slf4j.Slf4j;
import org.bson.Document;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.index.Index;

import static com.appsmith.server.migrations.DatabaseChangelog1.dropIndexIfExists;
import static com.appsmith.server.migrations.DatabaseChangelog1.ensureIndexes;
import static com.appsmith.server.migrations.DatabaseChangelog1.makeIndex;

@Slf4j
@ChangeUnit(order = "074", id = "add-idx-unique-slug-on-application-and-newpage", author = " ")
public class Migration074AddUniqueSlugIndicesForApplicationAndNewPage {

    private final MongoTemplate mongoTemplate;

    // Indices name have been cut short due to mongodb index name lenght limitation
    public static final String NEWPAGE_APPID_EDIT_UNIQUESLUG_INDEX = "appId_edit_uniqSlug_dltdAt";
    public static final String NEWPAGE_APPID_VIEW_UNIQUESLUG_INDEX = "appId_view_uniqSlug_dltdAt";
    public static final String APPLICATION_UNIQUESLUG_DEFAULTAPPLICATIONID_BRANCH_INDEX =
            "defAppId_uniqSlug_brnch_dltdAt";

    public Migration074AddUniqueSlugIndicesForApplicationAndNewPage(MongoTemplate mongoTemplate) {
        this.mongoTemplate = mongoTemplate;
    }

    @RollbackExecution
    public void rollbackExecution() {}

    @Execution
    public void createIndexes() {
        // NewPage: index on applicationId, uniqueSlug, and deletedAt
        dropIndexIfExists(mongoTemplate, NewPage.class, NEWPAGE_APPID_EDIT_UNIQUESLUG_INDEX);
        Index editModeIndex = makeIndex(
                        NewPage.Fields.applicationId,
                        NewPage.Fields.unpublishedPage_uniqueSlug,
                        NewPage.Fields.unpublishedPage_deletedAt,
                        NewPage.Fields.deletedAt)
                .named(NEWPAGE_APPID_EDIT_UNIQUESLUG_INDEX)
                .unique()
                .partial(() -> {
                    Document document = new Document();
                    Document condition = new Document();
                    condition.put("$exists", true);
                    document.put(NewPage.Fields.unpublishedPage_uniqueSlug, condition);
                    return document;
                })
                .background();

        ensureIndexes(mongoTemplate, NewPage.class, editModeIndex);

        dropIndexIfExists(mongoTemplate, NewPage.class, NEWPAGE_APPID_VIEW_UNIQUESLUG_INDEX);
        Index viewModeIndex = makeIndex(
                        NewPage.Fields.applicationId, NewPage.Fields.publishedPage_uniqueSlug, NewPage.Fields.deletedAt)
                .named(NEWPAGE_APPID_VIEW_UNIQUESLUG_INDEX)
                .unique()
                .partial(() -> {
                    Document document = new Document();
                    Document condition = new Document();
                    condition.put("$exists", true);
                    document.put(NewPage.Fields.publishedPage_uniqueSlug, condition);
                    return document;
                })
                .background();
        ensureIndexes(mongoTemplate, NewPage.class, viewModeIndex);

        // Application: index on uniqueSlug, deletedAt, and gitApplicationMetadata.defaultArtifactId
        dropIndexIfExists(mongoTemplate, Application.class, APPLICATION_UNIQUESLUG_DEFAULTAPPLICATIONID_BRANCH_INDEX);
        Index applicationIndex = makeIndex(
                        Application.Fields.staticUrlSettings_uniqueSlug,
                        Application.Fields.deletedAt,
                        Fields.gitApplicationMetadata_defaultApplicationId,
                        Fields.gitApplicationMetadata_branchName)
                .named(APPLICATION_UNIQUESLUG_DEFAULTAPPLICATIONID_BRANCH_INDEX)
                .unique()
                .partial(() -> {
                    Document document = new Document();
                    Document condition = new Document();
                    condition.put("$exists", true);
                    document.put(Fields.staticUrlSettings_uniqueSlug, condition);
                    return document;
                })
                .background();
        ensureIndexes(mongoTemplate, Application.class, applicationIndex);
    }
}
