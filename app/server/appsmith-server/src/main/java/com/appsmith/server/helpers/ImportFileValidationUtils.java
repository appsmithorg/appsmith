package com.appsmith.server.helpers;

import com.appsmith.server.constants.FieldName;
import com.appsmith.server.constants.ImportValidationErrors;
import com.appsmith.server.domains.ActionCollection;
import com.appsmith.server.domains.NewAction;
import com.appsmith.server.domains.NewPage;
import com.appsmith.server.dtos.ActionCollectionDTO;
import com.appsmith.server.dtos.ActionDTO;
import com.appsmith.server.dtos.ApplicationJson;
import com.appsmith.server.dtos.DslActionDTO;
import com.appsmith.server.dtos.PageDTO;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import org.apache.commons.collections.CollectionUtils;
import org.apache.commons.lang.StringUtils;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

public class ImportFileValidationUtils {

    public static final String INVALID_JSON_FILE = "invalid json file";
    /**
     * validates whether a ApplicationJSON contains the required fields or not.
     * @param importedDoc ApplicationJSON object that needs to be validated
     * @return Name of the field that have error. Empty string otherwise
     */
    public static void validateApplicationJson(ApplicationJson importedDoc) {
        String errorField = "";
        if (org.apache.commons.collections.CollectionUtils.isEmpty(importedDoc.getPageList())) {
            errorField = FieldName.PAGES;
        } else if (importedDoc.getExportedApplication() == null) {
            errorField = FieldName.APPLICATION;
        } else if (importedDoc.getActionList() == null) {
            errorField = FieldName.ACTIONS;
        } else if (importedDoc.getDatasourceList() == null) {
            errorField = FieldName.DATASOURCE;
        }

        if (!errorField.isEmpty()) {
            throw new AppsmithException(AppsmithError.NO_RESOURCE_FOUND, errorField, INVALID_JSON_FILE);
        }

        List<Set<String>> uniquePageNames = validatePageList(importedDoc.getPageList());
        Set<String> uniqueUnpublishedPageNames = uniquePageNames.get(0);
        Set<String> uniquePublishedPageNames = uniquePageNames.get(1);

        // Check action collection
        List<Set<String>> uniqueCollectionIds = validateActionCollections(importedDoc.getActionCollectionList(), uniqueUnpublishedPageNames, uniquePublishedPageNames);
        Set<String> uniqueUnpublishedCollectionIds = uniqueCollectionIds.get(0);
        Set<String> uniquePublishedCollectionIds = uniqueCollectionIds.get(1);

        // Check actions
        List<Set<String>> uniqueActionIds = validateActions(importedDoc.getActionList(), uniqueUnpublishedPageNames, uniquePublishedPageNames, uniqueUnpublishedCollectionIds, uniquePublishedCollectionIds);
        Set<String> uniqueUnpublishedActionIds = uniqueActionIds.get(0);
        Set<String> uniquePublishedActionIds = uniqueActionIds.get(1);

        // Check layoutOnPageLoadAction DSL
        for (NewPage newPage : importedDoc.getPageList()) {
            PageDTO unpublishedPage = newPage.getUnpublishedPage();
            PageDTO publishedPage = newPage.getPublishedPage();
            validateDslActionDTO(unpublishedPage, uniqueUnpublishedActionIds, uniqueUnpublishedCollectionIds);
            validateDslActionDTO(publishedPage, uniquePublishedActionIds, uniquePublishedCollectionIds);
        }
    }

    private static List<Set<String>> validatePageList(List<NewPage> pageList) {

        String errorField;
        List<String> unpublishedPageNames = new ArrayList<>();
        List<String> publishedPageNames = new ArrayList<>();
        for (NewPage newPage : pageList) {
            if (newPage.getUnpublishedPage() == null) {
                errorField = ImportValidationErrors.INVALID_UNPUBLISHED_RESOURCE.getMessage(FieldName.PAGE, FieldName.PAGE_LIST);
                throw new AppsmithException(AppsmithError.INVALID_IMPORTED_FILE, errorField);
            }
            unpublishedPageNames.add(newPage.getUnpublishedPage().getName());
            if (newPage.getPublishedPage() != null) {
                publishedPageNames.add(newPage.getPublishedPage().getName());
            }
        }
        // Check for unique page names
        Set<String> uniqueUnpublishedPageNames = new HashSet<>(unpublishedPageNames);
        if (uniqueUnpublishedPageNames.size() != unpublishedPageNames.size()) {
            errorField = ImportValidationErrors.UNIQUE_UNPUBLISHED_RESOURCE_NAME.getMessage(FieldName.PAGE, FieldName.PAGE_LIST);
            throw new AppsmithException(AppsmithError.INVALID_IMPORTED_FILE, errorField);
        }

        Set<String> uniquePublishedPageNames = new HashSet<>();
        if (!CollectionUtils.isEmpty(publishedPageNames)) {
            uniquePublishedPageNames = new HashSet<>(publishedPageNames);
            if (uniquePublishedPageNames.size() != publishedPageNames.size()) {
                errorField = ImportValidationErrors.UNIQUE_PUBLISHED_RESOURCE_NAME.getMessage(FieldName.PAGE, FieldName.PAGE_LIST);
                throw new AppsmithException(AppsmithError.INVALID_IMPORTED_FILE, errorField);
            }
        }
        return List.of(uniqueUnpublishedPageNames, uniquePublishedPageNames);
    }

    private static List<Set<String>> validateActionCollections(List<ActionCollection> actionCollectionList,
                                                               Set<String> uniqueUnpublishedPageNames,
                                                               Set<String> uniquePublishedPageNames) {

        String errorField;
        List<String> unpublishedCollectionIds= new ArrayList<>();
        List<String> publishedCollectionIds = new ArrayList<>();
        for (ActionCollection collection : actionCollectionList) {
            ActionCollectionDTO unpublishedCollection = collection.getUnpublishedCollection();
            ActionCollectionDTO publishedCollection = collection.getPublishedCollection();

            if (unpublishedCollection == null) {
                errorField = ImportValidationErrors.INVALID_UNPUBLISHED_RESOURCE.getMessage(FieldName.ACTION_COLLECTION, FieldName.ACTION_COLLECTION_LIST);
                throw new AppsmithException(AppsmithError.INVALID_IMPORTED_FILE, errorField);
            }
            unpublishedCollectionIds.add(unpublishedCollection.getId());
            if (publishedCollection != null) {
                publishedCollectionIds.add(publishedCollection.getId());
            }

            if (!uniqueUnpublishedPageNames.contains(unpublishedCollection.getPageId())) {
                errorField = ImportValidationErrors.INVALID_PAGE_BINDING_WITH_COLLECTION.getMessage(unpublishedCollection.getPageId(), collection.getId());
                throw new AppsmithException(AppsmithError.INVALID_IMPORTED_FILE, errorField);
            } else if (publishedCollection != null && !uniquePublishedPageNames.contains(publishedCollection.getPageId())) {
                errorField = ImportValidationErrors.INVALID_PAGE_BINDING_WITH_COLLECTION.getMessage(publishedCollection.getPageId(), collection.getId());
                throw new AppsmithException(AppsmithError.INVALID_IMPORTED_FILE, errorField);
            }
        }
        // Check for unique collection names
        Set<String> uniqueUnpublishedCollectionIds = new HashSet<>(unpublishedCollectionIds);
        if (uniqueUnpublishedCollectionIds.size() != unpublishedCollectionIds.size()) {
            errorField = ImportValidationErrors.UNIQUE_UNPUBLISHED_RESOURCE_NAME.getMessage(FieldName.ACTION_COLLECTION, FieldName.ACTION_COLLECTION_LIST);
            throw new AppsmithException(AppsmithError.INVALID_IMPORTED_FILE, errorField);
        }

        Set<String> uniquePublishedCollectionIds = new HashSet<>();
        if (!CollectionUtils.isEmpty(publishedCollectionIds)) {
            uniquePublishedCollectionIds = new HashSet<>(publishedCollectionIds);
            if (uniquePublishedCollectionIds.size() != publishedCollectionIds.size()) {
                errorField = ImportValidationErrors.UNIQUE_PUBLISHED_RESOURCE_NAME.getMessage(FieldName.ACTION_COLLECTION, FieldName.ACTION_COLLECTION_LIST);
                throw new AppsmithException(AppsmithError.INVALID_IMPORTED_FILE, errorField);
            }
        }

        return List.of(uniqueUnpublishedCollectionIds, uniquePublishedCollectionIds);
    }

    private static List<Set<String>> validateActions(List<NewAction> actionList,
                                                     Set<String> uniqueUnpublishedPageNames,
                                                     Set<String> uniquePublishedPageNames,
                                                     Set<String> uniqueUnpublishedCollectionIds,
                                                     Set<String> uniquePublishedCollectionIds) {

        String errorField;
        List<String> unpublishedActionIds = new ArrayList<>();
        List<String> publishedActionIds = new ArrayList<>();
        for (NewAction newAction : actionList) {
            ActionDTO unpublishedAction = newAction.getUnpublishedAction();
            ActionDTO publishedAction = newAction.getPublishedAction();

            if (unpublishedAction == null) {
                errorField = ImportValidationErrors.INVALID_UNPUBLISHED_RESOURCE.getMessage(FieldName.ACTION, FieldName.ACTION_LIST);
                throw new AppsmithException(AppsmithError.INVALID_IMPORTED_FILE, errorField);
            }
            unpublishedActionIds.add(unpublishedAction.getId());
            if (publishedAction != null) {
                publishedActionIds.add(publishedAction.getId());
            }

            if (!uniqueUnpublishedPageNames.contains(unpublishedAction.getPageId())) {
                errorField = ImportValidationErrors.INVALID_PAGE_BINDING_WITH_ACTION.getMessage(unpublishedAction.getPageId(), newAction.getId());
                throw new AppsmithException(AppsmithError.INVALID_IMPORTED_FILE, errorField);
            }

            if (publishedAction != null && !uniquePublishedPageNames.contains(publishedAction.getPageId())) {
                errorField = ImportValidationErrors.INVALID_PAGE_BINDING_WITH_ACTION.getMessage(unpublishedAction.getPageId(), newAction.getId());
                throw new AppsmithException(AppsmithError.INVALID_IMPORTED_FILE, errorField);
            }

            if (!StringUtils.isEmpty(unpublishedAction.getCollectionId())
                    && !uniqueUnpublishedCollectionIds.contains(unpublishedAction.getCollectionId())) {
                errorField = ImportValidationErrors.INVALID_COLLECTION_BINDING_WITH_ACTION.getMessage(unpublishedAction.getCollectionId(), newAction.getId());
                throw new AppsmithException(AppsmithError.INVALID_IMPORTED_FILE, errorField);
            }

            if (publishedAction != null
                    && !StringUtils.isEmpty(publishedAction.getCollectionId())
                    && !uniquePublishedCollectionIds.contains(publishedAction.getCollectionId())) {

                errorField = ImportValidationErrors.INVALID_COLLECTION_BINDING_WITH_ACTION.getMessage(publishedAction.getCollectionId(), newAction.getId());
                throw new AppsmithException(AppsmithError.INVALID_IMPORTED_FILE, errorField);
            }
        }
        // Check for unique action names
        Set<String> uniqueUnpublishedActionIds = new HashSet<>(unpublishedActionIds);
        if (uniqueUnpublishedActionIds.size() != unpublishedActionIds.size()) {
            errorField = ImportValidationErrors.UNIQUE_UNPUBLISHED_RESOURCE_NAME.getMessage(FieldName.ACTION, FieldName.ACTION_LIST);
            throw new AppsmithException(AppsmithError.INVALID_IMPORTED_FILE, errorField);
        }

        Set<String> uniquePublishedActionIds = new HashSet<>();
        if (!CollectionUtils.isEmpty(publishedActionIds)) {
            uniquePublishedActionIds = new HashSet<>(publishedActionIds);
            if (uniquePublishedActionIds.size() != publishedActionIds.size()) {
                errorField = ImportValidationErrors.UNIQUE_PUBLISHED_RESOURCE_NAME.getMessage(FieldName.ACTION, FieldName.ACTION_LIST);
                throw new AppsmithException(AppsmithError.INVALID_IMPORTED_FILE, errorField);
            }
        }

        return List.of(uniqueUnpublishedActionIds, uniquePublishedActionIds);
    }

    private static void validateDslActionDTO(PageDTO page, Set<String> actionIds, Set<String> collectionIds) {
        if (page == null) {
            return;
        }
        if (!CollectionUtils.isEmpty(page.getLayouts())) {
            page.getLayouts().forEach(layout -> {
                if (!CollectionUtils.isEmpty(layout.getLayoutOnLoadActions())) {
                    layout.getLayoutOnLoadActions().forEach(dslActionDTOS -> {
                        String errorField = "";
                        for (DslActionDTO dslActionDTO : dslActionDTOS) {
                            if (!actionIds.contains(dslActionDTO.getId())) {
                                errorField = ImportValidationErrors.INVALID_ACTION_BINDING_WITH_ON_LOAD_ACTION.getMessage(dslActionDTO.getId());
                                throw new AppsmithException(AppsmithError.INVALID_IMPORTED_FILE, errorField);
                            }

                            if (!StringUtils.isEmpty(dslActionDTO.getCollectionId()) && !collectionIds.contains(dslActionDTO.getCollectionId())) {
                                errorField = ImportValidationErrors.INVALID_COLLECTION_BINDING_WITH_ON_LOAD_ACTION.getMessage(dslActionDTO.getCollectionId());
                                throw new AppsmithException(AppsmithError.INVALID_IMPORTED_FILE, errorField);
                            }
                        }
                    });
                }
            });
        }
    }
}
