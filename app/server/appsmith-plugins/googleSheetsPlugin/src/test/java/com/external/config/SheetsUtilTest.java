package com.external.config;

import com.appsmith.external.exceptions.pluginExceptions.AppsmithPluginException;
import com.appsmith.external.models.DatasourceConfiguration;
import com.appsmith.external.models.OAuth2;
import com.appsmith.external.models.Property;
import com.external.constants.ErrorMessages;
import com.external.utils.SheetsUtil;
import com.fasterxml.jackson.core.JsonProcessingException;
import org.junit.jupiter.api.Test;

import java.util.*;

import static org.junit.jupiter.api.Assertions.*;

public class SheetsUtilTest {

    @Test
    public void testValidateAndGetUserAuthorizedSheetIds_allsheets_returnsNull() throws JsonProcessingException {
        DatasourceConfiguration dsConfig = new DatasourceConfiguration();
        List<Property> propList = new ArrayList<Property>();
        Property prop = new Property();
        prop.setKey("emailAddress");
        prop.setValue("test_email");
        propList.add(prop);
        dsConfig.setProperties(propList);
        Set<String> result = SheetsUtil.validateAndGetUserAuthorizedSheetIds(dsConfig, null);
        assertEquals(null, result);
    }

    @Test
    public void testValidateAndGetUserAuthorizedSheetIds_specificSheets_returnsSetOfFileIds()
            throws JsonProcessingException {
        DatasourceConfiguration dsConfig = new DatasourceConfiguration();
        List<Property> propList = new ArrayList<Property>();
        OAuth2 oAuth2 = new OAuth2();

        oAuth2.setScopeString("https://www.googleapis.com/auth/drive.file");
        dsConfig.setAuthentication(oAuth2);

        Property prop1 = new Property("emailAddress", "test_email");
        propList.add(prop1);

        List<String> ids = new ArrayList<String>();
        ids.add("id1");

        Property prop2 = new Property("userAuthorizedSheetIds", ids);
        propList.add(prop2);

        dsConfig.setProperties(propList);
        Set<String> result = SheetsUtil.validateAndGetUserAuthorizedSheetIds(dsConfig, null);
        assertEquals(1, result.size());
    }

    @Test
    public void testValidateAndGetUserAuthorizedSheetIds_invalidSpecificSheets_throwsException() {
        DatasourceConfiguration dsConfig = new DatasourceConfiguration();
        List<Property> propList = new ArrayList<>();
        OAuth2 oAuth2 = new OAuth2();

        oAuth2.setScopeString("https://www.googleapis.com/auth/drive.file");
        dsConfig.setAuthentication(oAuth2);

        Property prop1 = new Property("emailAddress", "test_email");
        propList.add(prop1);

        List<String> ids = new ArrayList<>();
        ids.add("id1");

        Property prop2 = new Property("userAuthorizedSheetIds", ids);
        propList.add(prop2);

        dsConfig.setProperties(propList);

        // Create formData map with only the spreadsheetUrl
        Map<String, Object> formData = new HashMap<>();
        Map<String, Object> spreadsheetUrlData = new HashMap<>();
        spreadsheetUrlData.put("data", "https://docs.google.com/spreadsheets/d/id2");
        formData.put("sheetUrl", spreadsheetUrlData);

        MethodConfig methodConfig = new MethodConfig(formData);

        AppsmithPluginException exception = assertThrows(AppsmithPluginException.class, () -> {
            SheetsUtil.validateAndGetUserAuthorizedSheetIds(dsConfig, methodConfig);
        });

        String expectedErrorMessage = ErrorMessages.MISSING_SPREADSHEET_URL_SELECTED_SHEETS_ERROR_MSG;
        assertEquals(expectedErrorMessage, exception.getMessage());
    }

    @Test
    public void testValidateAndGetUserAuthorizedSheetIds_validSpecificSheets_returnsAuthorisedSheetIds() {
        DatasourceConfiguration dsConfig = new DatasourceConfiguration();
        List<Property> propList = new ArrayList<>();
        OAuth2 oAuth2 = new OAuth2();

        oAuth2.setScopeString("https://www.googleapis.com/auth/drive.file");
        dsConfig.setAuthentication(oAuth2);

        Property prop1 = new Property("emailAddress", "test_email");
        propList.add(prop1);

        List<String> ids = new ArrayList<>();
        ids.add("id1");

        Property prop2 = new Property("userAuthorizedSheetIds", ids);
        propList.add(prop2);

        dsConfig.setProperties(propList);

        // Create formData map with the spreadsheetUrl
        Map<String, Object> formData = new HashMap<>();
        Map<String, Object> spreadsheetUrlData = new HashMap<>();
        spreadsheetUrlData.put("data", "https://docs.google.com/spreadsheets/d/id1");
        formData.put("sheetUrl", spreadsheetUrlData);

        MethodConfig methodConfig = new MethodConfig(formData);

        Set<String> result = SheetsUtil.validateAndGetUserAuthorizedSheetIds(dsConfig, methodConfig);

        assertEquals(1, result.size());
        assertTrue(result.contains("id1"));
    }

    @Test
    public void testValidateAndGetUserAuthorizedSheetIds_allSheets_returnsNull() {
        DatasourceConfiguration dsConfig = new DatasourceConfiguration();
        OAuth2 oAuth2 = new OAuth2();

        oAuth2.setScopeString("https://www.googleapis.com/auth/drive,https://www.googleapis.com/auth/spreadsheets");
        dsConfig.setAuthentication(oAuth2);

        // Not adding any properties to dsConfig

        Set<String> result = SheetsUtil.validateAndGetUserAuthorizedSheetIds(dsConfig, null);

        assertNull(result);
    }
}
