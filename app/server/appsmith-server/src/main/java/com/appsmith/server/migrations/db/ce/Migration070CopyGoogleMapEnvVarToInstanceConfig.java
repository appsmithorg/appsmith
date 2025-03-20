package com.appsmith.server.migrations.db.ce;

import com.appsmith.server.configurations.CommonConfig;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.domains.Config;
import io.mongock.api.annotations.ChangeUnit;
import io.mongock.api.annotations.Execution;
import io.mongock.api.annotations.RollbackExecution;
import lombok.extern.slf4j.Slf4j;
import net.minidev.json.JSONObject;
import org.apache.commons.lang3.StringUtils;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Query;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Optional;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import static org.springframework.data.mongodb.core.query.Criteria.where;

@Slf4j
@ChangeUnit(order = "070", id = "copy-google-maps-env-var-to-instance-config", author = "")
public class Migration070CopyGoogleMapEnvVarToInstanceConfig {

    private final MongoTemplate mongoTemplate;
    private final CommonConfig commonConfig;

    /**
     * This regex pattern matches environment variable declarations like `VAR_NAME=value` or `VAR_NAME="value"` or just
     * `VAR_NAME=`. It also defines two named capture groups, `name` and `value`, for the variable's name and value
     * respectively.
     */
    private static final Pattern ENV_VARIABLE_PATTERN = Pattern.compile("^(?<name>[A-Z\\d_]+)\\s*=\\s*(?<value>.*)$");

    public Migration070CopyGoogleMapEnvVarToInstanceConfig(MongoTemplate mongoTemplate, CommonConfig commonConfig) {
        this.mongoTemplate = mongoTemplate;
        this.commonConfig = commonConfig;
    }

    @RollbackExecution
    public void rollbackExecution() {
        // This is a data migration, no rollback required
    }

    @Execution
    public void copyGoogleMapsEnvVarToInstanceConfig() throws IOException {
        log.info("Starting migration to copy Google Maps API key from environment variable to instance config");

        final String envName = "APPSMITH_GOOGLE_MAPS_API_KEY";
        String googleMapsApiKey = System.getenv(envName);

        // If not available in system env, try to read from env file
        if (StringUtils.isEmpty(googleMapsApiKey)) {
            googleMapsApiKey = readGoogleMapsApiKeyFromEnvFile(envName);
        }

        // If still not available, nothing to migrate
        if (StringUtils.isEmpty(googleMapsApiKey)) {
            log.info("Google Maps API key not found in environment or env file. Nothing to migrate.");
            return;
        }

        // Fetch the instanceConfig from Config collection
        Query instanceConfigQuery = new Query();
        instanceConfigQuery.addCriteria(where(Config.Fields.name).is(FieldName.INSTANCE_CONFIG));
        Config instanceConfig = mongoTemplate.findOne(instanceConfigQuery, Config.class);

        if (instanceConfig == null) {
            log.error("Instance config not found. Migration cannot proceed.");
            return;
        }

        // Get the current config
        JSONObject config = instanceConfig.getConfig();
        if (config == null) {
            config = new JSONObject();
        }

        // Get the instanceVariables object
        JSONObject instanceVariables = (JSONObject) config.get("instanceVariables");
        if (instanceVariables == null) {
            instanceVariables = new JSONObject();
        }

        // Update the Google Maps API key
        instanceVariables.put("googleMapsKey", googleMapsApiKey);

        // Update config
        config.put("instanceVariables", instanceVariables);
        instanceConfig.setConfig(config);

        // Save the updated instanceConfig
        mongoTemplate.save(instanceConfig);

        log.info("Successfully migrated Google Maps API key from environment variable to instance config");
    }

    private String readGoogleMapsApiKeyFromEnvFile(String envName) throws IOException {
        String envFilePath = commonConfig.getEnvFilePath();
        if (StringUtils.isEmpty(envFilePath)) {
            log.warn("Environment file path is empty, cannot read Google Maps API key from env file");
            return null;
        }

        Path path = Path.of(envFilePath);
        if (!Files.exists(path)) {
            log.warn("Environment file does not exist at path: {}", envFilePath);
            return null;
        }

        String content = Files.readString(path);
        Optional<String> keyLine = content.lines()
                .filter(line -> {
                    Matcher matcher = ENV_VARIABLE_PATTERN.matcher(line);
                    if (matcher.matches()) {
                        String name = matcher.group("name");
                        return name.equals(envName);
                    }
                    return false;
                })
                .findFirst();

        if (keyLine.isPresent()) {
            String line = keyLine.get();
            Matcher matcher = ENV_VARIABLE_PATTERN.matcher(line);
            if (matcher.matches()) {
                String value = matcher.group("value");
                // Remove quotes if present
                if (value.startsWith("\"") && value.endsWith("\"")) {
                    value = value.substring(1, value.length() - 1);
                } else if (value.startsWith("'") && value.endsWith("'")) {
                    value = value.substring(1, value.length() - 1);
                }
                return unescapeFromShell(value);
            }
        }

        return null;
    }

    private String unescapeFromShell(String input) {
        final int len = input.length();
        final StringBuilder valueBuilder = new StringBuilder();
        Character inQuote = null;

        for (int i = 0; i < len; ++i) {
            final char c = input.charAt(i);

            if (inQuote != null && inQuote == '\'') {
                if (c == '\'') {
                    inQuote = null;
                } else {
                    valueBuilder.append(c);
                }

            } else if (inQuote != null) {
                // If `inQuote` is not null here, then it can only be the double-quote character.
                // We don't do variable interpolation here, since we don't expect it to be present in the env file.
                if (c == '"') {
                    inQuote = null;
                } else {
                    valueBuilder.append(c);
                }

            } else if (c == '\'' || c == '"') {
                inQuote = c;

            } else {
                valueBuilder.append(c);
            }
        }

        return valueBuilder.toString();
    }
}
