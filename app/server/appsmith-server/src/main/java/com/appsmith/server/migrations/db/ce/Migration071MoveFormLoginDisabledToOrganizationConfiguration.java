package com.appsmith.server.migrations.db.ce;

import com.appsmith.server.configurations.CommonConfig;
import com.appsmith.server.domains.Organization;
import io.mongock.api.annotations.ChangeUnit;
import io.mongock.api.annotations.Execution;
import io.mongock.api.annotations.RollbackExecution;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.lang3.StringUtils;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Update;

import java.io.IOException;

import static com.appsmith.server.migrations.db.ce.Migration021MoveGoogleMapsKeyToTenantConfiguration.commentEnvInFile;

@Slf4j
@RequiredArgsConstructor
@ChangeUnit(order = "071", id = "move-form-login-disabled-to-organization-configuration")
public class Migration071MoveFormLoginDisabledToOrganizationConfiguration {
    private final MongoTemplate mongoTemplate;
    private final CommonConfig commonConfig;

    @RollbackExecution
    public void rollbackExecution() {}

    @Execution
    public void executeMigration() throws IOException {
        final String envName = "APPSMITH_FORM_LOGIN_DISABLED";
        final String formLoginDisabledValue = System.getenv(envName);

        // Default to false if the environment variable is not present or empty
        boolean formLoginDisabled = false;

        if (StringUtils.isNotEmpty(formLoginDisabledValue)) {
            // Convert the string value to a boolean if env is present
            formLoginDisabled = Boolean.parseBoolean(formLoginDisabledValue);
            // Comment out the environment variable in the .env file
            commentEnvInFile(envName, commonConfig.getEnvFilePath());
        }

        // Update all organizations to set the form login disabled configuration
        // This happens whether the env var is present or not, defaulting to false
        mongoTemplate.updateMulti(
                new Query(),
                new Update().set("organizationConfiguration.isFormLoginEnabled", !formLoginDisabled),
                Organization.class);
    }
}
