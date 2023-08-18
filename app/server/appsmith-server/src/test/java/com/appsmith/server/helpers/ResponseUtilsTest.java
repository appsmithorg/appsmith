package com.appsmith.server.helpers;

import com.appsmith.external.helpers.AppsmithBeanUtils;
import com.appsmith.server.domains.ActionCollection;
import com.appsmith.server.domains.Application;
import com.appsmith.server.domains.ApplicationPage;
import com.appsmith.server.domains.NewAction;
import com.appsmith.server.domains.NewPage;
import com.appsmith.server.migrations.JsonSchemaVersions;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.google.gson.Gson;
import lombok.SneakyThrows;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.context.junit.jupiter.SpringExtension;

import java.io.File;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotEquals;
import static org.junit.jupiter.api.Assertions.assertNull;

@ExtendWith(SpringExtension.class)
@SpringBootTest
@DirtiesContext
public class ResponseUtilsTest {

    private static final File mockObjects =
            new File("src/test/resources/test_assets/ResponseUtilsTest/mockObjects.json");
    private static final ObjectMapper objectMapper = new ObjectMapper();
    private static JsonNode jsonNode;

    @Autowired
    ResponseUtils responseUtils;

    Gson gson = new Gson();

    @SneakyThrows
    @BeforeEach
    public void setup() {
        jsonNode = objectMapper.readValue(mockObjects, JsonNode.class);
    }

    @Test
    public void getPage_whenDefaultIdsNull_returnsSamePage() {
        final NewPage newPage = objectMapper.convertValue(jsonNode.get("newPage"), NewPage.class);
        newPage.setDefaultResources(null);
        assertEquals(newPage, responseUtils.updateNewPageWithDefaultResources(newPage));
    }

    @Test
    public void getPage_withDefaultIdsPresent_returnsUpdatedPage() {
        NewPage newPage = gson.fromJson(String.valueOf(jsonNode.get("newPage")), NewPage.class);

        final NewPage newPageCopy = new NewPage();
        AppsmithBeanUtils.copyNestedNonNullProperties(newPage, newPageCopy);
        responseUtils.updateNewPageWithDefaultResources(newPage);
        assertNotEquals(newPageCopy, newPage);
        assertEquals(newPageCopy.getDefaultResources().getPageId(), newPage.getId());
        assertEquals(newPageCopy.getDefaultResources().getApplicationId(), newPage.getApplicationId());
    }

    @Test
    public void getAction_whenDefaultIdsNull_returnsSameAction() {
        final NewAction newAction = objectMapper.convertValue(jsonNode.get("newAction"), NewAction.class);
        newAction.setDefaultResources(null);
        assertEquals(newAction, responseUtils.updateNewActionWithDefaultResources(newAction));
    }

    @Test
    public void getAction_withDefaultIdsPresent_returnsUpdatedAction() {
        NewAction newAction = gson.fromJson(String.valueOf(jsonNode.get("newAction")), NewAction.class);

        final NewAction newActionCopy = new NewAction();
        AppsmithBeanUtils.copyNestedNonNullProperties(newAction, newActionCopy);
        responseUtils.updateNewActionWithDefaultResources(newAction);
        assertNotEquals(newActionCopy, newAction);
        assertEquals(newActionCopy.getDefaultResources().getActionId(), newAction.getId());
        assertEquals(newActionCopy.getDefaultResources().getApplicationId(), newAction.getApplicationId());

        assertEquals(
                newActionCopy.getUnpublishedAction().getDefaultResources().getPageId(),
                newAction.getUnpublishedAction().getPageId());
        assertEquals(
                newActionCopy.getUnpublishedAction().getDefaultResources().getCollectionId(),
                newAction.getUnpublishedAction().getCollectionId());

        assertEquals(
                newActionCopy.getPublishedAction().getDefaultResources().getPageId(),
                newAction.getPublishedAction().getPageId());
        assertEquals(
                newActionCopy.getPublishedAction().getDefaultResources().getCollectionId(),
                newAction.getPublishedAction().getCollectionId());
    }

    @Test
    public void getActionCollection_whenDefaultIdsNull_returnsSameActionCollection() {
        final ActionCollection actionCollection =
                objectMapper.convertValue(jsonNode.get("actionCollection"), ActionCollection.class);
        actionCollection.setDefaultResources(null);
        assertEquals(actionCollection, responseUtils.updateActionCollectionWithDefaultResources(actionCollection));
    }

    @Test
    public void getActionCollection_withDefaultIdsPresent_returnsUpdatedActionCollection() {
        ActionCollection actionCollection =
                gson.fromJson(String.valueOf(jsonNode.get("actionCollection")), ActionCollection.class);

        final ActionCollection actionCollectionCopy = new ActionCollection();
        AppsmithBeanUtils.copyNestedNonNullProperties(actionCollection, actionCollectionCopy);
        responseUtils.updateActionCollectionWithDefaultResources(actionCollection);
        assertNotEquals(actionCollectionCopy, actionCollection);
        assertEquals(actionCollectionCopy.getDefaultResources().getCollectionId(), actionCollection.getId());
        assertEquals(
                actionCollectionCopy.getDefaultResources().getApplicationId(), actionCollection.getApplicationId());

        assertEquals(
                actionCollectionCopy
                        .getUnpublishedCollection()
                        .getDefaultResources()
                        .getPageId(),
                actionCollection.getUnpublishedCollection().getPageId());
        assertEquals(
                actionCollectionCopy
                        .getPublishedCollection()
                        .getDefaultResources()
                        .getPageId(),
                actionCollection.getPublishedCollection().getPageId());
    }

    @Test
    public void getApplication_withDefaultIdsPresent_returnsUpdatedApplication() {
        Application application = gson.fromJson(String.valueOf(jsonNode.get("application")), Application.class);

        final Application applicationCopy = new Application();
        AppsmithBeanUtils.copyNestedNonNullProperties(application, applicationCopy);

        // Check if the id and defaultPage ids for pages are not same before we update the application using
        // responseUtils
        for (ApplicationPage applicationPage : application.getPages()) {
            assertNotEquals(applicationPage.getId(), applicationPage.getDefaultPageId());
        }
        for (ApplicationPage applicationPage : application.getPublishedPages()) {
            assertNotEquals(applicationPage.getId(), applicationPage.getDefaultPageId());
        }
        responseUtils.updateApplicationWithDefaultResources(application);
        assertNotEquals(applicationCopy, application);
        // Check if the id and defaultPage ids for pages are same after we update the application from responseUtils
        for (ApplicationPage applicationPage : application.getPages()) {
            assertEquals(applicationPage.getId(), applicationPage.getDefaultPageId());
        }
        for (ApplicationPage applicationPage : application.getPublishedPages()) {
            assertEquals(applicationPage.getId(), applicationPage.getDefaultPageId());
        }
    }

    @Test
    public void getApplication_withMultipleSchemaVersions_returnsCorrectManualUpdate() {
        Application application = gson.fromJson(String.valueOf(jsonNode.get("application")), Application.class);

        final Application applicationCopy = new Application();
        AppsmithBeanUtils.copyNestedNonNullProperties(application, applicationCopy);

        application.setServerSchemaVersion(null);
        assertNull(application.getIsAutoUpdate());
        responseUtils.updateApplicationWithDefaultResources(application);
        assertEquals(application.getIsAutoUpdate(), false);

        application.setClientSchemaVersion(null);
        application.setIsAutoUpdate(null);
        responseUtils.updateApplicationWithDefaultResources(application);
        assertEquals(application.getIsAutoUpdate(), false);

        application.setIsAutoUpdate(null);
        application.setServerSchemaVersion(1000);
        application.setClientSchemaVersion(JsonSchemaVersions.clientVersion);
        responseUtils.updateApplicationWithDefaultResources(application);
        assertEquals(application.getIsAutoUpdate(), true);

        application.setIsAutoUpdate(null);
        application.setClientSchemaVersion(1000);
        application.setServerSchemaVersion(JsonSchemaVersions.serverVersion);
        responseUtils.updateApplicationWithDefaultResources(application);
        assertEquals(application.getIsAutoUpdate(), true);

        application.setIsAutoUpdate(null);
        application.setClientSchemaVersion(JsonSchemaVersions.clientVersion);
        application.setServerSchemaVersion(JsonSchemaVersions.serverVersion);
        responseUtils.updateApplicationWithDefaultResources(application);
        assertEquals(application.getIsAutoUpdate(), false);
    }
}
