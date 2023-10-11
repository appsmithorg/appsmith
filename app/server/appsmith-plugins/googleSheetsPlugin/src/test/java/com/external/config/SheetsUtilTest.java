package com.external.config;

import com.appsmith.external.models.DatasourceConfiguration;
import com.appsmith.external.models.OAuth2;
import com.appsmith.external.models.Property;
import com.external.utils.SheetsUtil;
import com.fasterxml.jackson.core.JsonProcessingException;
import org.junit.jupiter.api.Test;

import java.util.ArrayList;
import java.util.List;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.assertEquals;

public class SheetsUtilTest {

    @Test
    public void testGetUserAuthorizedSheetIds_allsheets_returnsNull() throws JsonProcessingException {
        DatasourceConfiguration dsConfig = new DatasourceConfiguration();
        List<Property> propList = new ArrayList<Property>();
        Property prop = new Property();
        prop.setKey("emailAddress");
        prop.setValue("test_email");
        propList.add(prop);
        dsConfig.setProperties(propList);
        Set<String> result = SheetsUtil.getUserAuthorizedSheetIds(dsConfig);
        assertEquals(result, null);
    }

    @Test
    public void testGetUserAuthorizedSheetIds_specificSheets_returnsSetOfFileIds() throws JsonProcessingException {
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
        Set<String> result = SheetsUtil.getUserAuthorizedSheetIds(dsConfig);
        assertEquals(result.size(), 1);
    }
}
