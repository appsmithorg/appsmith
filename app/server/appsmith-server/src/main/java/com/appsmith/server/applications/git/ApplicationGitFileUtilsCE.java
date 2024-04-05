package com.appsmith.server.applications.git;

import com.appsmith.external.models.ApplicationGitReference;
import com.appsmith.external.models.ArtifactGitReference;
import com.appsmith.external.models.PluginType;
import com.appsmith.server.actioncollections.base.ActionCollectionService;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.domains.ActionCollection;
import com.appsmith.server.domains.Application;
import com.appsmith.server.domains.NewAction;
import com.appsmith.server.domains.NewPage;
import com.appsmith.server.dtos.ApplicationJson;
import com.appsmith.server.dtos.ArtifactExchangeJson;
import com.appsmith.server.helpers.ce.ArtifactGitFileUtilsCE;
import com.appsmith.server.newactions.base.NewActionService;
import com.google.gson.Gson;
import lombok.RequiredArgsConstructor;
import net.minidev.json.JSONObject;
import org.springframework.stereotype.Component;

import java.lang.reflect.Field;
import java.util.Arrays;
import java.util.HashMap;
import java.util.HashSet;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;
import java.util.stream.Stream;

import static com.appsmith.external.git.constants.GitConstants.NAME_SEPARATOR;
import static com.appsmith.external.helpers.AppsmithBeanUtils.copyProperties;
import static com.appsmith.server.constants.ce.FieldNameCE.ACTION_COLLECTION_LIST;
import static com.appsmith.server.constants.ce.FieldNameCE.ACTION_LIST;
import static com.appsmith.server.constants.ce.FieldNameCE.CUSTOM_JS_LIB_LIST;
import static com.appsmith.server.constants.ce.FieldNameCE.DATASOURCE_LIST;
import static com.appsmith.server.constants.ce.FieldNameCE.DECRYPTED_FIELDS;
import static com.appsmith.server.constants.ce.FieldNameCE.EDIT_MODE_THEME;
import static com.appsmith.server.constants.ce.FieldNameCE.EXPORTED_APPLICATION;
import static com.appsmith.server.constants.ce.FieldNameCE.PAGE_LIST;
import static com.appsmith.server.helpers.ce.CommonGitFileUtilsCE.removeUnwantedFieldsFromBaseDomain;

@Component
@RequiredArgsConstructor
public class ApplicationGitFileUtilsCE implements ArtifactGitFileUtilsCE<ApplicationGitReference> {

    private final NewActionService newActionService;
    private final ActionCollectionService actionCollectionService;

    // Only include the application helper fields in metadata object
    protected Set<String> getBlockedMetadataFields() {
        return Set.of(
                EXPORTED_APPLICATION,
                DATASOURCE_LIST,
                PAGE_LIST,
                ACTION_LIST,
                ACTION_COLLECTION_LIST,
                DECRYPTED_FIELDS,
                EDIT_MODE_THEME,
                CUSTOM_JS_LIB_LIST);
    }

    protected final Map<String, String> applicationConstantsMap =
            Map.of(FieldName.ARTIFACT_CONTEXT, FieldName.APPLICATION, FieldName.ID, FieldName.APPLICATION_ID);

    public Map<String, String> getConstantsMap() {
        return applicationConstantsMap;
    }

    @Override
    public ApplicationGitReference createArtifactReferenceObject() {
        return new ApplicationGitReference();
    }

    @Override
    public void addArtifactReferenceFromExportedJson(
            ArtifactExchangeJson artifactExchangeJson, ArtifactGitReference artifactGitReference) {

        ApplicationJson applicationJson = (ApplicationJson) artifactExchangeJson;
        ApplicationGitReference applicationReference = (ApplicationGitReference) artifactGitReference;

        setApplicationInApplicationReference(applicationJson, applicationReference);
        setThemesInApplicationReference(applicationJson, applicationReference);

        setApplicationMetadataInApplicationReference(applicationJson, applicationReference);

        setNewPagesInApplicationReference(applicationJson, applicationReference);

        setNewActionsInApplicationReference(applicationJson, applicationReference);

        setActionCollectionsInApplicationReference(applicationJson, applicationReference);

        setCustomJSLibsInApplicationReference(applicationJson, applicationReference);
    }

    private void setApplicationInApplicationReference(
            ApplicationJson applicationJson, ApplicationGitReference applicationReference) {
        Application application = applicationJson.getExportedApplication();
        removeUnwantedFieldsFromApplication(application);
        // Pass application reference
        applicationReference.setApplication(applicationJson.getExportedApplication());
    }

    private void setThemesInApplicationReference(
            ApplicationJson applicationJson, ApplicationGitReference applicationReference) {
        // No need to commit publish mode theme as it leads to conflict resolution at both the places if any
        applicationJson.setPublishedTheme(null);

        // Remove internal fields from the themes
        removeUnwantedFieldsFromBaseDomain(applicationJson.getEditModeTheme());
        applicationReference.setTheme(applicationJson.getEditModeTheme());
    }

    private void setApplicationMetadataInApplicationReference(
            ApplicationJson applicationJson, ApplicationGitReference applicationReference) {
        // Pass metadata
        Iterable<String> keys = getAllFields(applicationJson)
                .map(Field::getName)
                .filter(name -> !getBlockedMetadataFields().contains(name))
                .collect(Collectors.toList());

        ApplicationJson applicationMetadata = new ApplicationJson();
        applicationJson.setModifiedResources(null);
        copyProperties(applicationJson, applicationMetadata, keys);
        applicationReference.setMetadata(applicationMetadata);
    }

    private void setCustomJSLibsInApplicationReference(
            ApplicationJson applicationJson, ApplicationGitReference applicationReference) {
        Map<String, Object> resourceMap = new HashMap<>();
        applicationJson.getCustomJSLibList().forEach(jsLib -> {
            removeUnwantedFieldsFromBaseDomain(jsLib);
            resourceMap.put(jsLib.getUidString(), jsLib);
        });
        applicationReference.setJsLibraries(resourceMap);
    }

    private void setActionCollectionsInApplicationReference(
            ApplicationJson applicationJson, ApplicationGitReference applicationReference) {
        Map<String, Object> resourceMap = new HashMap<>();
        Map<String, String> resourceMapActionCollectionBody = new HashMap<>();
        // Insert JSOObjects and also assign the keys which later will be used for saving the resource in actual
        // filepath
        // JSObjectName_pageName => nomenclature for the keys
        applicationJson.getActionCollectionList().stream()
                // As we are expecting the commit will happen only after the application is published, so we can safely
                // assume if the unpublished version is deleted entity should not be committed to git
                .filter(collection -> collection.getUnpublishedCollection() != null
                        && collection.getUnpublishedCollection().getDeletedAt() == null)
                .peek(actionCollection ->
                        actionCollectionService.generateActionCollectionByViewMode(actionCollection, false))
                .forEach(actionCollection -> {
                    String prefix = actionCollection.getUnpublishedCollection().getUserExecutableName()
                            + NAME_SEPARATOR
                            + actionCollection.getUnpublishedCollection().getPageId();
                    removeUnwantedFieldFromActionCollection(actionCollection);

                    String body = actionCollection.getUnpublishedCollection().getBody() != null
                            ? actionCollection.getUnpublishedCollection().getBody()
                            : "";
                    actionCollection.getUnpublishedCollection().setBody(null);
                    resourceMapActionCollectionBody.put(prefix, body);
                    resourceMap.put(prefix, actionCollection);
                });
        applicationReference.setActionCollections(resourceMap);
        applicationReference.setActionCollectionBody(resourceMapActionCollectionBody);
    }

    private void setNewPagesInApplicationReference(
            ApplicationJson applicationJson, ApplicationGitReference applicationReference) {
        // Insert only active pages which will then be committed to repo as individual file
        Map<String, Object> resourceMap = new HashMap<>();
        Map<String, String> dslBody = new HashMap<>();
        applicationJson.getPageList().stream()
                // As we are expecting the commit will happen only after the application is published, so we can safely
                // assume if the unpublished version is deleted entity should not be committed to git
                .filter(newPage -> newPage.getUnpublishedPage() != null
                        && newPage.getUnpublishedPage().getDeletedAt() == null)
                .forEach(newPage -> {
                    String pageName = newPage.getUnpublishedPage() != null
                            ? newPage.getUnpublishedPage().getName()
                            : newPage.getPublishedPage().getName();
                    removeUnwantedFieldsFromPage(newPage);
                    JSONObject dsl =
                            newPage.getUnpublishedPage().getLayouts().get(0).getDsl();
                    // Get MainContainer widget data, remove the children and club with Canvas.json file
                    JSONObject mainContainer = new JSONObject(dsl);
                    mainContainer.remove("children");
                    newPage.getUnpublishedPage().getLayouts().get(0).setDsl(mainContainer);
                    // pageName will be used for naming the json file
                    dslBody.put(pageName, dsl.toString());
                    resourceMap.put(pageName, newPage);
                });

        applicationReference.setPages(resourceMap);
        applicationReference.setPageDsl(dslBody);
    }

    private void setNewActionsInApplicationReference(
            ApplicationJson applicationJson, ApplicationGitReference applicationReference) {
        Map<String, Object> resourceMap = new HashMap<>();
        Map<String, String> resourceMapBody = new HashMap<>();
        // Insert active actions and also assign the keys which later will be used for saving the resource in actual
        // filepath
        // For actions, we are referring to validNames to maintain unique file names as just name
        // field don't guarantee unique constraint for actions within JSObject
        // queryValidName_pageName => nomenclature for the keys
        applicationJson.getActionList().stream()
                // As we are expecting the commit will happen only after the application is published, so we can safely
                // assume if the unpublished version is deleted entity should not be committed to git
                .filter(newAction -> newAction.getUnpublishedAction() != null
                        && newAction.getUnpublishedAction().getDeletedAt() == null)
                .peek(newAction -> newActionService.generateActionByViewMode(newAction, false))
                .forEach(newAction -> {
                    String prefix;
                    if (newAction.getUnpublishedAction() != null) {
                        prefix = newAction.getUnpublishedAction().getUserExecutableName()
                                + NAME_SEPARATOR
                                + newAction.getUnpublishedAction().getPageId();
                    } else {
                        prefix = newAction.getPublishedAction().getUserExecutableName()
                                + NAME_SEPARATOR
                                + newAction.getPublishedAction().getPageId();
                    }
                    removeUnwantedFieldFromAction(newAction);
                    String body = newAction.getUnpublishedAction().getActionConfiguration() != null
                                    && newAction
                                                    .getUnpublishedAction()
                                                    .getActionConfiguration()
                                                    .getBody()
                                            != null
                            ? newAction
                                    .getUnpublishedAction()
                                    .getActionConfiguration()
                                    .getBody()
                            : "";

                    // This is a special case where we are handling REMOTE type plugins based actions such as Twilio
                    // The user configured values are stored in a attribute called formData which is a map unlike the
                    // body
                    if (PluginType.REMOTE.equals(newAction.getPluginType())
                            && newAction.getUnpublishedAction().getActionConfiguration() != null
                            && newAction
                                            .getUnpublishedAction()
                                            .getActionConfiguration()
                                            .getFormData()
                                    != null) {
                        body = new Gson()
                                .toJson(
                                        newAction
                                                .getUnpublishedAction()
                                                .getActionConfiguration()
                                                .getFormData(),
                                        Map.class);
                        newAction
                                .getUnpublishedAction()
                                .getActionConfiguration()
                                .setFormData(null);
                    }
                    // This is a special case where we are handling JS actions as we don't want to commit the body of JS
                    // actions
                    if (PluginType.JS.equals(newAction.getPluginType())) {
                        if (newAction.getUnpublishedAction().getActionConfiguration() != null) {
                            newAction
                                    .getUnpublishedAction()
                                    .getActionConfiguration()
                                    .setBody(null);
                            newAction.getUnpublishedAction().setJsonPathKeys(null);
                        }
                    } else {
                        // For the regular actions we save the body field to git repo
                        resourceMapBody.put(prefix, body);
                    }
                    resourceMap.put(prefix, newAction);
                });
        applicationReference.setActions(resourceMap);
        applicationReference.setActionBody(resourceMapBody);
    }

    protected Stream<Field> getAllFields(ApplicationJson applicationJson) {
        Class<?> currentType = applicationJson.getClass();

        Set<Class<?>> classes = new HashSet<>();

        while (currentType != null) {
            classes.add(currentType);
            currentType = currentType.getSuperclass();
        }

        return classes.stream().flatMap(currentClass -> Arrays.stream(currentClass.getDeclaredFields()));
    }

    private void removeUnwantedFieldsFromApplication(Application application) {
        // Don't commit application name as while importing we are using the repoName as application name
        application.setName(null);
        application.setPublishedPages(null);
        application.setIsPublic(null);
        application.setSlug(null);
        application.setPublishedApplicationDetail(null);
        removeUnwantedFieldsFromBaseDomain(application);
        // we can call the sanitiseToExportDBObject() from BaseDomain as well here
    }

    private void removeUnwantedFieldsFromPage(NewPage page) {
        // As we are publishing the app and then committing to git we expect the published and unpublished PageDTO will
        // be same, so we only commit unpublished PageDTO.
        page.setPublishedPage(null);
        removeUnwantedFieldsFromBaseDomain(page);
    }

    private void removeUnwantedFieldFromAction(NewAction action) {
        // As we are publishing the app and then committing to git we expect the published and unpublished ActionDTO
        // will be same, so we only commit unpublished ActionDTO.
        action.setPublishedAction(null);
        action.getUnpublishedAction().sanitiseToExportDBObject();
        removeUnwantedFieldsFromBaseDomain(action);
    }

    private void removeUnwantedFieldFromActionCollection(ActionCollection actionCollection) {
        // As we are publishing the app and then committing to git we expect the published and unpublished
        // ActionCollectionDTO will be same, so we only commit unpublished ActionCollectionDTO.
        actionCollection.setPublishedCollection(null);
        actionCollection.getUnpublishedCollection().sanitiseForExport();
        removeUnwantedFieldsFromBaseDomain(actionCollection);
    }
}
