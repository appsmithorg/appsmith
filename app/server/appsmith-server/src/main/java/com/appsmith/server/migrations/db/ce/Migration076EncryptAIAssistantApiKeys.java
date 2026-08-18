package com.appsmith.server.migrations.db.ce;

import com.appsmith.server.domains.AIAssistantConfig;
import com.appsmith.server.domains.Organization;
import com.appsmith.server.helpers.ce.AIConfigSecretsCE;
import io.mongock.api.annotations.ChangeUnit;
import io.mongock.api.annotations.Execution;
import io.mongock.api.annotations.RollbackExecution;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Update;

import java.util.List;

/**
 * Encrypts AI Assistant provider credentials that were written before {@link AIConfigSecretsCE}
 * existed.
 *
 * <p>The {@code @Encrypted} annotations on {@code AIAssistantConfig} never took effect (see that
 * class for why), so any key stored by an earlier build is sitting in cleartext in the organization
 * document. This encrypts those in place.
 *
 * <p>Every value is left in the marked form {@link AIConfigSecretsCE} writes, which is what makes a
 * re-run — or a run against an instance that never had a cleartext key — a no-op. Values that a
 * pre-marker build had already encrypted keep their bytes and gain the marker; re-encrypting them
 * would nest one ciphertext inside another. Community instances have no such values at all, because
 * the feature arrives with this release; the work exists for instances that ran the enterprise
 * build, which reach this change unit through the community sync.
 */
@Slf4j
@RequiredArgsConstructor
@ChangeUnit(order = "076", id = "encrypt-ai-assistant-api-keys")
public class Migration076EncryptAIAssistantApiKeys {

    private static final String CONFIG_PATH = "organizationConfiguration.aiAssistantConfig";

    private static final List<String> KEY_FIELDS =
            List.of("claudeApiKey", "openaiApiKey", "copilotApiKey", "azureOpenaiApiKey");

    private final MongoTemplate mongoTemplate;

    @RollbackExecution
    public void rollbackExecution() {
        // Intentionally empty. Decrypting back to cleartext would reintroduce the very exposure
        // this change unit removes, and the encrypted values stay readable by the application.
    }

    @Execution
    public void executeMigration() {
        // Match only organizations that actually hold a credential worth encrypting. Migration075 gives EVERY
        // organization an aiAssistantConfig, so a bare `CONFIG_PATH ne null` matches the whole collection — and this
        // loads full Organization documents into memory. Harmless for a single-org self-hosted instance, an
        // unbounded in-memory scan on a multi-tenant deployment, which is exactly where this also has to run.
        Criteria hasAnyKey = new Criteria()
                .orOperator(KEY_FIELDS.stream()
                        .map(field -> Criteria.where(CONFIG_PATH + "." + field)
                                .exists(true)
                                .ne(""))
                        .toArray(Criteria[]::new));
        Query hasAiConfig = Query.query(hasAnyKey);

        long encryptedCount = 0;
        long organizationCount = 0;

        for (Organization organization : mongoTemplate.find(hasAiConfig, Organization.class)) {
            if (organization.getOrganizationConfiguration() == null
                    || organization.getOrganizationConfiguration().getAiAssistantConfig() == null) {
                continue;
            }

            AIAssistantConfig aiConfig =
                    organization.getOrganizationConfiguration().getAiAssistantConfig();

            Update update = new Update();
            boolean touched = false;

            for (String field : KEY_FIELDS) {
                String normalized = AIConfigSecretsCE.normalizeForStorage(readKey(aiConfig, field));
                if (normalized == null) {
                    continue;
                }
                update.set(CONFIG_PATH + "." + field, normalized);
                touched = true;
                encryptedCount++;
            }

            if (touched) {
                mongoTemplate.updateFirst(
                        Query.query(Criteria.where("_id").is(organization.getId())), update, Organization.class);
                organizationCount++;
            }
        }

        if (encryptedCount > 0) {
            log.info(
                    "Encrypted {} AI Assistant credential(s) across {} organization(s).",
                    encryptedCount,
                    organizationCount);
        }
    }

    private String readKey(AIAssistantConfig config, String field) {
        return switch (field) {
            case "claudeApiKey" -> config.getClaudeApiKey();
            case "openaiApiKey" -> config.getOpenaiApiKey();
            case "copilotApiKey" -> config.getCopilotApiKey();
            case "azureOpenaiApiKey" -> config.getAzureOpenaiApiKey();
            default -> null;
        };
    }
}
