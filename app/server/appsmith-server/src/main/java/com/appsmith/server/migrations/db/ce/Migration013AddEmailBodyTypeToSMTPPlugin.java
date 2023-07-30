package com.appsmith.server.migrations.db.ce;

import com.appsmith.server.domains.NewAction;
import com.appsmith.server.domains.Plugin;
import io.mongock.api.annotations.ChangeUnit;
import io.mongock.api.annotations.Execution;
import io.mongock.api.annotations.RollbackExecution;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Update;

import static com.appsmith.server.migrations.MigrationHelperMethods.getQueryToFetchAllDomainObjectsWhichAreNotDeletedUsingPluginId;
import static org.springframework.data.mongodb.core.query.Criteria.where;
import static org.springframework.data.mongodb.core.query.Query.query;

@ChangeUnit(order = "013", id = "add-smtp-email-body-type", author = " ")
public class Migration013AddEmailBodyTypeToSMTPPlugin {

    private final MongoTemplate mongoTemplate;

    public Migration013AddEmailBodyTypeToSMTPPlugin(MongoTemplate mongoTemplate) {
        this.mongoTemplate = mongoTemplate;
    }

    @RollbackExecution
    public void rollBackExecution() {}

    @Execution
    public void addSmtpEmailBodyType() {
        Plugin smtpPlugin = mongoTemplate.findOne(query(where("packageName").is("smtp-plugin")), Plugin.class);

        /* Query to get all smtp plugin unpublished actions which are not deleted and doesn't have bodyType field */
        Query unpublishedActionsQuery = getQueryToFetchAllDomainObjectsWhichAreNotDeletedUsingPluginId(smtpPlugin)
                .addCriteria(where("unpublishedAction.actionConfiguration.formData.send")
                        .exists(true))
                .addCriteria(where("unpublishedAction.actionConfiguration.formData.send.bodyType")
                        .exists(false));

        /* Update the bodyType field to have "text/html" value by default */
        Update updateUnpublishedActions = new Update();
        updateUnpublishedActions.set("unpublishedAction.actionConfiguration.formData.send.bodyType", "text/html");

        mongoTemplate.updateMulti(unpublishedActionsQuery, updateUnpublishedActions, NewAction.class);

        /* Query to get all smtp plugin published actions which are not deleted and doesn't have bodyType field */
        Query publishedActionsQuery = getQueryToFetchAllDomainObjectsWhichAreNotDeletedUsingPluginId(smtpPlugin)
                .addCriteria(where("publishedAction.actionConfiguration.formData.send")
                        .exists(true))
                .addCriteria(where("publishedAction.actionConfiguration.formData.send.bodyType")
                        .exists(false));

        /* Update the bodyType field to have "text/html" value by default */
        Update updatePublishedActions = new Update();
        updatePublishedActions.set("publishedAction.actionConfiguration.formData.send.bodyType", "text/html");

        mongoTemplate.updateMulti(publishedActionsQuery, updatePublishedActions, NewAction.class);
    }
}
