package com.appsmith.server.helpers;

import com.appsmith.external.helpers.AppsmithBeanUtils;
import com.appsmith.server.domains.ActionCollection;
import com.appsmith.server.domains.Application;
import com.appsmith.server.domains.ApplicationPage;
import com.appsmith.server.domains.NewAction;
import com.appsmith.server.domains.NewPage;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.google.gson.Gson;
import lombok.SneakyThrows;
import org.junit.Assert;
import org.junit.Before;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.context.junit4.SpringRunner;

import java.io.File;

@RunWith(SpringRunner.class)
@SpringBootTest
@DirtiesContext
public class ResponseUtilsTest {

    @Autowired
    ResponseUtils responseUtils;

    private static final File mockObjects = new File("src/test/resources/test_assets/ResponseUtilsTest/mockObjects.json");
    private static final ObjectMapper objectMapper = new ObjectMapper();
    private static JsonNode jsonNode;
    Gson gson = new Gson();

    @SneakyThrows
    @Before
    public void setup() {
        jsonNode = objectMapper.readValue(mockObjects, JsonNode.class);
    }

    @Test
    public void getPage_whenDefaultIdsNull_returnsSamePage() {
        final NewPage newPage = objectMapper.convertValue(jsonNode.get("newPage"), NewPage.class);
        newPage.setDefaultResources(null);
        Assert.assertEquals(newPage, responseUtils.updateNewPageWithDefaultResources(newPage));
    }

    @Test
    public void getPage_withDefaultIdsPresent_returnsUpdatedPage() {
        NewPage newPage = gson.fromJson(String.valueOf(jsonNode.get("newPage")), NewPage.class);

        final NewPage newPageCopy = new NewPage();
        AppsmithBeanUtils.copyNestedNonNullProperties(newPage, newPageCopy);
        responseUtils.updateNewPageWithDefaultResources(newPage);
        Assert.assertNotEquals(newPageCopy, newPage);
        Assert.assertEquals(newPageCopy.getDefaultResources().getPageId(), newPage.getId());
        Assert.assertEquals(newPageCopy.getDefaultResources().getApplicationId(), newPage.getApplicationId());
    }

    @Test
    public void getAction_whenDefaultIdsNull_returnsSameAction() {
        final NewAction newAction = objectMapper.convertValue(jsonNode.get("newAction"), NewAction.class);
        newAction.setDefaultResources(null);
        Assert.assertEquals(newAction, responseUtils.updateNewActionWithDefaultResources(newAction));
    }

    @Test
    public void getAction_withDefaultIdsPresent_returnsUpdatedAction() {
        NewAction newAction = gson.fromJson(String.valueOf(jsonNode.get("newAction")), NewAction.class);

        final NewAction newActionCopy = new NewAction();
        AppsmithBeanUtils.copyNestedNonNullProperties(newAction, newActionCopy);
        responseUtils.updateNewActionWithDefaultResources(newAction);
        Assert.assertNotEquals(newActionCopy, newAction);
        Assert.assertEquals(newActionCopy.getDefaultResources().getActionId(), newAction.getId());
        Assert.assertEquals(newActionCopy.getDefaultResources().getApplicationId(), newAction.getApplicationId());

        Assert.assertEquals(newActionCopy.getUnpublishedAction().getDefaultResources().getPageId(), newAction.getUnpublishedAction().getPageId());
        Assert.assertEquals(newActionCopy.getUnpublishedAction().getDefaultResources().getCollectionId(), newAction.getUnpublishedAction().getCollectionId());

        Assert.assertEquals(newActionCopy.getPublishedAction().getDefaultResources().getPageId(), newAction.getPublishedAction().getPageId());
        Assert.assertEquals(newActionCopy.getPublishedAction().getDefaultResources().getCollectionId(), newAction.getPublishedAction().getCollectionId());
    }

    @Test
    public void getActionCollection_whenDefaultIdsNull_returnsSameActionCollection() {
        final ActionCollection actionCollection = objectMapper.convertValue(jsonNode.get("actionCollection"), ActionCollection.class);
        actionCollection.setDefaultResources(null);
        Assert.assertEquals(actionCollection, responseUtils.updateActionCollectionWithDefaultResources(actionCollection));
    }

    @Test
    public void getActionCollection_withDefaultIdsPresent_returnsUpdatedActionCollection() {
        ActionCollection actionCollection = gson.fromJson(String.valueOf(jsonNode.get("actionCollection")), ActionCollection.class);

        final ActionCollection actionCollectionCopy = new ActionCollection();
        AppsmithBeanUtils.copyNestedNonNullProperties(actionCollection, actionCollectionCopy);
        responseUtils.updateActionCollectionWithDefaultResources(actionCollection);
        Assert.assertNotEquals(actionCollectionCopy, actionCollection);
        Assert.assertEquals(actionCollectionCopy.getDefaultResources().getCollectionId(), actionCollection.getId());
        Assert.assertEquals(actionCollectionCopy.getDefaultResources().getApplicationId(), actionCollection.getApplicationId());

        Assert.assertEquals(actionCollectionCopy.getUnpublishedCollection().getDefaultResources().getPageId(), actionCollection.getUnpublishedCollection().getPageId());
        Assert.assertEquals(actionCollectionCopy.getPublishedCollection().getDefaultResources().getPageId(), actionCollection.getPublishedCollection().getPageId());
    }

    @Test
    public void getApplication_withDefaultIdsPresent_returnsUpdatedApplication() {
        Application application = gson.fromJson(String.valueOf(jsonNode.get("application")), Application.class);

        final Application applicationCopy = new Application();
        AppsmithBeanUtils.copyNestedNonNullProperties(application, applicationCopy);

        // Check if the id and defaultPage ids for pages are not same before we update the application using responseUtils
        for (ApplicationPage applicationPage : application.getPages()) {
            Assert.assertNotEquals(applicationPage.getId(), applicationPage.getDefaultPageId());
        }
        for (ApplicationPage applicationPage : application.getPublishedPages()) {
            Assert.assertNotEquals(applicationPage.getId(), applicationPage.getDefaultPageId());
        }
        responseUtils.updateApplicationWithDefaultResources(application);
        Assert.assertNotEquals(applicationCopy, application);
        // Check if the id and defaultPage ids for pages are same after we update the application from responseUtils
        for (ApplicationPage applicationPage : application.getPages()) {
            Assert.assertEquals(applicationPage.getId(), applicationPage.getDefaultPageId());
        }
        for (ApplicationPage applicationPage : application.getPublishedPages()) {
            Assert.assertEquals(applicationPage.getId(), applicationPage.getDefaultPageId());
        }
    }
}
