package com.appsmith.server.migrations.ce;

import com.appsmith.external.helpers.JsonForDatabase;
import com.appsmith.server.constants.ApplicationConstants;
import com.appsmith.server.domains.CustomJSLib;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.migrations.AppsmithJavaMigration;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.jdbc.core.JdbcTemplate;

@Slf4j
public class V013__addXmlParserCustomJsLib extends AppsmithJavaMigration {
    @Override
    public void migrate(JdbcTemplate jdbcTemplate) throws Exception {
        CustomJSLib customJSLib = generateXmlParserJSLibObject();

        try {
            jdbcTemplate.update(
                    "INSERT INTO customjslib (id, uid_string, name, accessor, url, version, defs, created_at, updated_at) VALUES (gen_random_uuid(), ?, ?, cast(? as jsonb), ?, ?, ?, now(), now())",
                    customJSLib.getUidString(),
                    customJSLib.getName(),
                    JsonForDatabase.writeValueAsString(customJSLib.getAccessor()),
                    customJSLib.getUrl(),
                    customJSLib.getVersion(),
                    customJSLib.getDefs());
        } catch (DuplicateKeyException duplicateKeyException) {
            log.debug(
                    "Addition of xmlParser object in customJSLib failed, because object with similar UID already exists");
        } catch (Exception exception) {
            log.error("Error in exception : ", exception);
            throw new AppsmithException(
                    AppsmithError.MIGRATION_FAILED,
                    "V12__addXmlParserCustomJsLib",
                    exception.getMessage(),
                    "Unable to insert xml parser library in CustomJSLib collection");
        }
    }

    private static CustomJSLib generateXmlParserJSLibObject() {
        return ApplicationConstants.getDefaultParserCustomJsLibCompatibilityDTO();
    }
}
