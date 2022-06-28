package com.appsmith.server.migrations;

import com.appsmith.external.models.InvisibleActionFields;
import com.appsmith.server.constants.ResourceModes;
import com.appsmith.server.domains.ApplicationPage;
import com.appsmith.server.domains.NewAction;
import com.appsmith.server.dtos.ActionDTO;
import com.appsmith.server.dtos.ApplicationJson;
import com.appsmith.server.helpers.CollectionUtils;
import org.apache.commons.lang.StringUtils;

import java.time.Instant;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

import static com.appsmith.server.constants.ResourceModes.EDIT;
import static com.appsmith.server.constants.ResourceModes.VIEW;

public class MigrationHelperMethods {
    // Migration for deprecating archivedAt field in ActionDTO
    public static void updateArchivedAtByDeletedATForActions(List<NewAction> actionList) {
        for (NewAction newAction : actionList) {
            ActionDTO unpublishedAction = newAction.getUnpublishedAction();
            if (unpublishedAction != null) {
                final Instant archivedAt = unpublishedAction.getArchivedAt();
                unpublishedAction.setDeletedAt(archivedAt);
                unpublishedAction.setArchivedAt(null);
            }
        }
    }

    public static void migrateActionFormDataToObject(ApplicationJson applicationJson) {
        final List<NewAction> actionList = applicationJson.getActionList();

        if (!CollectionUtils.isNullOrEmpty(actionList)) {
            actionList.parallelStream()
                    .forEach(newAction -> {
                        // determine plugin
                        final String pluginName = newAction.getPluginId();
                        if ("mongo-plugin".equals(pluginName)) {
                            DatabaseChangelog2.migrateMongoActionsFormData(newAction);
                        } else if ("amazons3-plugin".equals(pluginName)) {
                            DatabaseChangelog2.migrateAmazonS3ActionsFormData(newAction);
                        } else if ("firestore-plugin".equals(pluginName)) {
                            DatabaseChangelog2.migrateFirestoreActionsFormData(newAction);
                        }
                    });
        }
    }

    // Method to embed application pages in imported application object as per modified serialization format where we
    // are serialising JsonIgnored fields to keep the relevant data with domain objects only
    public static void arrangeApplicationPagesAsPerImportedPageOrder(ApplicationJson applicationJson) {

        Map<ResourceModes, List<ApplicationPage>> applicationPages = Map.of(
                EDIT, new ArrayList<>(),
                VIEW, new ArrayList<>()
        );
        // Reorder the pages based on edit mode page sequence
        List<String> pageOrderList;
        if(!CollectionUtils.isNullOrEmpty(applicationJson.getPageOrder())) {
            pageOrderList = applicationJson.getPageOrder();
        } else {
            pageOrderList = applicationJson.getPageList()
                    .parallelStream()
                    .filter(newPage -> newPage.getUnpublishedPage() != null && newPage.getUnpublishedPage().getDeletedAt() == null)
                    .map(newPage -> newPage.getUnpublishedPage().getName())
                    .collect(Collectors.toList());
        }
        for(String pageName : pageOrderList) {
            ApplicationPage unpublishedAppPage = new ApplicationPage();
            unpublishedAppPage.setId(pageName);
            unpublishedAppPage.setIsDefault(StringUtils.equals(pageName, applicationJson.getUnpublishedDefaultPageName()));
            applicationPages.get(EDIT).add(unpublishedAppPage);
        }

        // Reorder the pages based on view mode page sequence
        pageOrderList.clear();
        if(!CollectionUtils.isNullOrEmpty(applicationJson.getPublishedPageOrder())) {
            pageOrderList = applicationJson.getPublishedPageOrder();
        } else {
            pageOrderList = applicationJson.getPageList()
                    .parallelStream()
                    .filter(newPage -> newPage.getPublishedPage() != null && !StringUtils.isEmpty(newPage.getPublishedPage().getName()))
                    .map(newPage -> newPage.getPublishedPage().getName())
                    .collect(Collectors.toList());
        }
        for(String pageName : pageOrderList) {
            ApplicationPage publishedAppPage = new ApplicationPage();
            publishedAppPage.setId(pageName);
            publishedAppPage.setIsDefault(StringUtils.equals(pageName, applicationJson.getPublishedDefaultPageName()));
            applicationPages.get(VIEW).add(publishedAppPage);
        }
        applicationJson.getExportedApplication().setPages(applicationPages.get(EDIT));
        applicationJson.getExportedApplication().setPublishedPages(applicationPages.get(VIEW));
    }

    // Method to embed mongo escaped widgets in imported layouts as per modified serialization format where we are
    // serialising JsonIgnored fields to keep the relevant data with domain objects only
    public static void updateMongoEscapedWidget(ApplicationJson applicationJson) {
        Map<String, Set<String>> unpublishedMongoEscapedWidget
                = CollectionUtils.isNullOrEmpty(applicationJson.getUnpublishedLayoutmongoEscapedWidgets())
                ? new HashMap<>()
                : applicationJson.getUnpublishedLayoutmongoEscapedWidgets();

        Map<String, Set<String>> publishedMongoEscapedWidget
                = CollectionUtils.isNullOrEmpty(applicationJson.getPublishedLayoutmongoEscapedWidgets())
                ? new HashMap<>()
                : applicationJson.getPublishedLayoutmongoEscapedWidgets();

        applicationJson.getPageList().parallelStream().forEach(newPage -> {
            if (newPage.getUnpublishedPage() != null
                    && unpublishedMongoEscapedWidget.containsKey(newPage.getUnpublishedPage().getName())
                    && !CollectionUtils.isNullOrEmpty(newPage.getUnpublishedPage().getLayouts())) {

                newPage.getUnpublishedPage().getLayouts().forEach(layout -> {
                    layout.setMongoEscapedWidgetNames(unpublishedMongoEscapedWidget.get(layout.getId()));
                });
            }

            if (newPage.getPublishedPage() != null
                    && publishedMongoEscapedWidget.containsKey(newPage.getPublishedPage().getName())
                    && !CollectionUtils.isNullOrEmpty(newPage.getPublishedPage().getLayouts())) {

                newPage.getPublishedPage().getLayouts().forEach(layout -> {
                    layout.setMongoEscapedWidgetNames(publishedMongoEscapedWidget.get(layout.getId()));
                });
            }
        });
    }

    // Method to embed userSetOnLoad in imported actions as per modified serialization format where we are serialising
    // JsonIgnored fields to keep the relevant data with domain objects only
    public static void updateUserSetOnLoadAction(ApplicationJson applicationJson) {
        Map<String, InvisibleActionFields> invisibleActionFieldsMap = applicationJson.getInvisibleActionFields() ;
        if (invisibleActionFieldsMap != null) {
            applicationJson.getActionList().parallelStream().forEach(newAction -> {
                if (newAction.getUnpublishedAction() != null) {
                    newAction.getUnpublishedAction()
                            .setUserSetOnLoad(invisibleActionFieldsMap.get(newAction.getId()).getUnpublishedUserSetOnLoad());
                }
                if (newAction.getPublishedAction() != null) {
                    newAction.getPublishedAction()
                            .setUserSetOnLoad(invisibleActionFieldsMap.get(newAction.getId()).getPublishedUserSetOnLoad());
                }
            });
        }
    }

    public static void migrateGoogleSheetsActionsToUqi(ApplicationJson applicationJson) {
        final List<NewAction> actionList = applicationJson.getActionList();

        if (!CollectionUtils.isNullOrEmpty(actionList)) {
            actionList.parallelStream()
                    .forEach(newAction -> {
                        // Determine plugin
                        final String pluginName = newAction.getPluginId();
                        if ("google-sheets-plugin".equals(pluginName)) {
                            DatabaseChangelog2.migrateGoogleSheetsToUqi(newAction);
                        }
                    });
        }
    }
}
