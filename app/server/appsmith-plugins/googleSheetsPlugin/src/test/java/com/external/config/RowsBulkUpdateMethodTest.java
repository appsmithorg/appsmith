package com.external.config;

import com.appsmith.external.dtos.ExecuteActionDTO;
import com.appsmith.external.exceptions.pluginExceptions.AppsmithPluginException;
import com.appsmith.external.models.ActionConfiguration;
import com.appsmith.external.models.AuthenticationResponse;
import com.appsmith.external.models.DatasourceConfiguration;
import com.appsmith.external.models.OAuth2;
import com.appsmith.external.models.PaginationType;
import com.external.constants.ErrorMessages;
import com.external.plugins.GoogleSheetsPlugin;
import io.micrometer.observation.ObservationRegistry;
import org.junit.jupiter.api.Test;

import java.util.Collections;
import java.util.HashMap;
import java.util.Map;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

public class RowsBulkUpdateMethodTest {

    GoogleSheetsPlugin.GoogleSheetsPluginExecutor pluginExecutor =
            new GoogleSheetsPlugin.GoogleSheetsPluginExecutor(ObservationRegistry.NOOP);

    @Test
    public void testRowBulkUpdateMethodWithEmptyBody() {

        DatasourceConfiguration datasourceConfiguration = new DatasourceConfiguration();
        datasourceConfiguration.setAuthentication(getOAuthObject());

        Map<String, Object> formData = new HashMap<>();
        formData.put("command", Collections.singletonMap("data", "UPDATE_MANY"));
        formData.put("entityType", Collections.singletonMap("data", "ROWS"));
        formData.put("tableHeaderIndex", Collections.singletonMap("data", "1"));
        formData.put("projection", Collections.singletonMap("data", Collections.emptyList()));
        formData.put("queryFormat", Collections.singletonMap("data", "ROWS"));
        formData.put("range", Collections.singletonMap("data", ""));
        formData.put(
                "where",
                Collections.singletonMap(
                        "data",
                        Map.of(
                                "condition",
                                "AND",
                                "children",
                                Collections.singletonList(Collections.singletonMap("condition", "LT")))));
        formData.put("pagination", Collections.singletonMap("data", Map.of("limit", 20, "offset", 0)));
        formData.put("smartSubstitution", Collections.singletonMap("data", true));
        formData.put("sheetUrl", Collections.singletonMap("data", "https://docs.google.com/spreadsheets/d/123/edit"));
        formData.put("sheetName", Collections.singletonMap("data", "portSheet"));
        formData.put(
                "sortBy",
                Collections.singletonMap(
                        "data", Collections.singletonList(Map.of("column", "", "order", "Ascending"))));

        ActionConfiguration actionConfiguration = new ActionConfiguration();

        actionConfiguration.setTimeoutInMillisecond("10000");
        actionConfiguration.setPaginationType(PaginationType.NONE);
        actionConfiguration.setEncodeParamsToggle(true);
        actionConfiguration.setFormData(formData);

        String[] testDataArray = {null, "", "{}"};

        String[] expectedErrorMessageArray = {
            ErrorMessages.EMPTY_UPDATE_ROW_OBJECTS_MESSAGE,
            ErrorMessages.REQUEST_BODY_NOT_ARRAY,
            ErrorMessages.REQUEST_BODY_NOT_ARRAY
        };

        for (int i = 0; i < testDataArray.length; i++) {

            formData.put("rowObjects", new HashMap<>(Collections.singletonMap("data", testDataArray[i])));

            AppsmithPluginException appsmithPluginException = assertThrows(AppsmithPluginException.class, () -> {
                pluginExecutor.executeParameterized(
                        null, new ExecuteActionDTO(), datasourceConfiguration, actionConfiguration);
            });

            String actualMessage = appsmithPluginException.getMessage();

            assertEquals(actualMessage, expectedErrorMessageArray[i]);
        }
    }

    /**
     * Simulated oAuth2 object, just to bypass few case.
     * @return
     */
    private OAuth2 getOAuthObject() {
        OAuth2 oAuth2 = new OAuth2();
        oAuth2.setAuthenticationResponse(new AuthenticationResponse());
        oAuth2.getAuthenticationResponse().setToken("welcome123");
        oAuth2.setGrantType(OAuth2.Type.AUTHORIZATION_CODE);
        oAuth2.setScopeString(
                "https://www.googleapis.com/auth/spreadsheets.readonly,https://www.googleapis.com/auth/drive.readonly");
        oAuth2.setScope(Set.of(
                "https://www.googleapis.com/auth/spreadsheets.readonly",
                "https://www.googleapis.com/auth/drive.readonly"));
        return oAuth2;
    }
}
