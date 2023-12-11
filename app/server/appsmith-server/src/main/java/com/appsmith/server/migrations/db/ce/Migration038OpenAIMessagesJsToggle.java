package com.appsmith.server.migrations.db.ce;

import com.appsmith.external.constants.PluginConstants;
import com.appsmith.server.constants.ce.FieldNameCE;
import com.appsmith.server.domains.NewAction;
import com.appsmith.server.domains.Plugin;
import io.mongock.api.annotations.ChangeUnit;
import io.mongock.api.annotations.Execution;
import io.mongock.api.annotations.RollbackExecution;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Update;

import java.util.List;
import java.util.Map;

@Slf4j
@ChangeUnit(order = "038", id = "move-messages-to-data-key-in-openai", author = " ")
public class Migration038OpenAIMessagesJsToggle {
    private final MongoTemplate mongoTemplate;
    public static final String MESSAGES = "messages";
    public static final String DATA = "data";
    public static final String USER_MESSAGES = "userMessages";
    public static final String SYSTEM_MESSAGES = "systemMessages";

    public Migration038OpenAIMessagesJsToggle(MongoTemplate mongoTemplate) {
        this.mongoTemplate = mongoTemplate;
    }

    @RollbackExecution
    public void rollbackExecution() {}

    @Execution
    public void moveMessagesToDataKeyForSupportingJsToggle() {
        // find OpenAI plugin
        Plugin plugin = mongoTemplate.findOne(
                new Query(Criteria.where(FieldNameCE.PACKAGE_NAME).is(PluginConstants.PackageName.OPEN_AI_PLUGIN)),
                Plugin.class);
        if (plugin == null || plugin.getId() == null) {
            // plugin is not installed, no need of rest of migration steps
            return;
        }
        // find all actions by OpenAI pluginId
        List<NewAction> actions = mongoTemplate.find(
                new Query(Criteria.where(FieldNameCE.PLUGIN_ID).is(plugin.getId())), NewAction.class);
        // update actionConfiguration to insert all the messages into a data key field
        for (NewAction action : actions) {
            Query findQuery = new Query(Criteria.where("_id").is(action.getId()));
            Update update = new Update();
            boolean anyUpdates = false;
            if (action.getUnpublishedAction() != null
                    && action.getUnpublishedAction().getActionConfiguration() != null
                    && action.getUnpublishedAction().getActionConfiguration().getFormData() != null) {
                Map<String, Object> formData =
                        action.getUnpublishedAction().getActionConfiguration().getFormData();
                updateFormData(formData);
                update.set("unpublishedAction.actionConfiguration.formData", formData);
                anyUpdates = true;
            }

            if (action.getPublishedAction() != null
                    && action.getPublishedAction().getActionConfiguration() != null
                    && action.getPublishedAction().getActionConfiguration().getFormData() != null) {
                Map<String, Object> formData =
                        action.getPublishedAction().getActionConfiguration().getFormData();
                updateFormData(formData);
                update.set("publishedAction.actionConfiguration.formData", formData);
                anyUpdates = true;
            }
            if (anyUpdates) {
                mongoTemplate.updateFirst(findQuery, update, NewAction.class);
            }
        }
    }

    /**
     * Moves all messages field values into a `data` key so that it becomes compatible to JS Toggle change on messages field in UI
     */
    private void updateFormData(Map<String, Object> formData) {
        if (formData.containsKey(MESSAGES)) {
            formData.put(MESSAGES, Map.of(DATA, formData.get(MESSAGES)));
        }
        if (formData.containsKey(SYSTEM_MESSAGES)) {
            formData.put(SYSTEM_MESSAGES, Map.of(DATA, formData.get(SYSTEM_MESSAGES)));
        }
        if (formData.containsKey(USER_MESSAGES)) {
            formData.put(USER_MESSAGES, Map.of(DATA, formData.get(USER_MESSAGES)));
        }
    }
}
