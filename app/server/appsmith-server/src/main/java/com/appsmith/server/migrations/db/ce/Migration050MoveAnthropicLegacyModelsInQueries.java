package com.appsmith.server.migrations.db.ce;

import com.appsmith.external.constants.PluginConstants;
import com.appsmith.external.models.ActionConfiguration;
import com.appsmith.server.domains.NewAction;
import com.appsmith.server.domains.Plugin;
import io.mongock.api.annotations.ChangeUnit;
import io.mongock.api.annotations.Execution;
import io.mongock.api.annotations.RollbackExecution;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;

import java.util.List;
import java.util.Map;

import static com.appsmith.server.constants.ce.FieldNameCE.PACKAGE_NAME;
import static com.appsmith.server.constants.ce.FieldNameCE.PLUGIN_ID;

/**
 * This migration moves the Anthropic legacy models to next versions models in Anthropic plugin queries.
 */
@Slf4j
@ChangeUnit(order = "050", id = "move-anthropic-legacy-models", author = "")
public class Migration050MoveAnthropicLegacyModelsInQueries {
    private final MongoTemplate mongoTemplate;
    private static final String HUMAN = "Human";
    private static final String ASSISTANT = "Assistant";
    public static final String CHAT_MODEL = "chatModel";
    public static final String MESSAGES = "messages";
    private static final Map<String, String> LEGACY_TO_NEXT_MODELS = Map.of(
            "claude-instant-1", "claude-instant-1.2",
            "claude-2", "claude-2.1");

    public Migration050MoveAnthropicLegacyModelsInQueries(MongoTemplate mongoTemplate) {
        this.mongoTemplate = mongoTemplate;
    }

    @RollbackExecution
    public void rollbackExecution() {}

    /**
     * Steps:
     * 1. Find Anthropic plugin id
     * 2. Find all queries with Anthropic plugin id
     * 3. For each query, find the action configuration and change models to next version models if using legacy models
     * 4. Change the action configuration in the query to use User/Assistant instead of Human/Assistant in messages
     * 5. Save the updated query
     */
    @Execution
    public void moveAnthropicLegacyModelsInQueries() {
        log.info("Migrating Anthropic legacy models in queries to next version models");
        Query anthropicPluginQuery = new Query();
        anthropicPluginQuery.addCriteria(Criteria.where(PACKAGE_NAME).is(PluginConstants.PackageName.ANTHROPIC_PLUGIN));
        Plugin plugin = mongoTemplate.findOne(anthropicPluginQuery, Plugin.class);
        if (plugin == null) {
            log.error("Anthropic plugin not found");
            return;
        }
        String pluginId = plugin.getId();
        List<NewAction> anthropicActions =
                mongoTemplate.find(Query.query(Criteria.where(PLUGIN_ID).is(pluginId)), NewAction.class);
        if (anthropicActions.isEmpty()) {
            log.info("No Anthropic actions found");
            return;
        }
        anthropicActions.forEach(this::updateAction);
    }

    private void updateAction(NewAction action) {
        ActionConfiguration unpublishedActionConfiguration =
                action.getUnpublishedAction().getActionConfiguration();
        if (unpublishedActionConfiguration != null && unpublishedActionConfiguration.getFormData() != null) {
            action.getUnpublishedAction()
                    .setActionConfiguration(updateActionConfiguration(unpublishedActionConfiguration));
        }
        ActionConfiguration publishedActionConfiguration =
                action.getPublishedAction().getActionConfiguration();
        if (publishedActionConfiguration != null && publishedActionConfiguration.getFormData() != null) {
            action.getPublishedAction().setActionConfiguration(updateActionConfiguration(publishedActionConfiguration));
        }
        mongoTemplate.save(action);
    }

    private ActionConfiguration updateActionConfiguration(ActionConfiguration actionConfiguration) {
        Map<String, Object> formData = actionConfiguration.getFormData();
        if (formData.containsKey(CHAT_MODEL)) {
            String chatModel = ((Map<String, String>) formData.get(CHAT_MODEL)).get("data");
            if (LEGACY_TO_NEXT_MODELS.containsKey(chatModel)) {
                formData.put(CHAT_MODEL, Map.of("data", LEGACY_TO_NEXT_MODELS.get(chatModel)));
            }
        }
        if (formData.containsKey(MESSAGES)) {
            List<Map<String, String>> messages =
                    (List<Map<String, String>>) ((Map<String, Object>) formData.get(MESSAGES)).get("data");
            for (Map<String, String> message : messages) {
                if (HUMAN.equals(message.get("role"))) {
                    message.put("role", "user");
                } else if (ASSISTANT.equals(message.get("role"))) {
                    message.put("role", "assistant");
                }
            }
            formData.put(MESSAGES, Map.of("data", messages));
        }
        actionConfiguration.setFormData(formData);
        return actionConfiguration;
    }
}
