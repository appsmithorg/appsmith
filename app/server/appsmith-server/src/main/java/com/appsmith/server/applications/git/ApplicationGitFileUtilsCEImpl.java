package com.appsmith.server.applications.git;

import com.appsmith.external.git.FileInterface;
import com.appsmith.external.git.models.GitResourceIdentity;
import com.appsmith.external.git.models.GitResourceMap;
import com.appsmith.external.git.models.GitResourceType;
import com.appsmith.external.helpers.AppsmithBeanUtils;
import com.appsmith.external.models.ActionDTO;
import com.appsmith.external.models.ApplicationGitReference;
import com.appsmith.external.models.ArtifactGitReference;
import com.appsmith.external.models.DatasourceStorage;
import com.appsmith.external.models.PluginType;
import com.appsmith.git.files.FileUtilsImpl;
import com.appsmith.git.helpers.DSLTransformerHelper;
import com.appsmith.server.actioncollections.base.ActionCollectionService;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.domains.ActionCollection;
import com.appsmith.server.domains.Application;
import com.appsmith.server.domains.ApplicationPage;
import com.appsmith.server.domains.CustomJSLib;
import com.appsmith.server.domains.NewAction;
import com.appsmith.server.domains.NewPage;
import com.appsmith.server.domains.Theme;
import com.appsmith.server.dtos.ActionCollectionDTO;
import com.appsmith.server.dtos.ApplicationJson;
import com.appsmith.server.dtos.ArtifactExchangeJson;
import com.appsmith.server.dtos.PageDTO;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.helpers.CollectionUtils;
import com.appsmith.server.helpers.ce.ArtifactGitFileUtilsCE;
import com.appsmith.server.migrations.JsonSchemaMigration;
import com.appsmith.server.newactions.base.NewActionService;
import com.google.gson.Gson;
import lombok.NonNull;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import net.minidev.json.JSONObject;
import net.minidev.json.parser.JSONParser;
import net.minidev.json.parser.ParseException;
import org.apache.commons.collections.PredicateUtils;
import org.apache.commons.lang3.StringUtils;
import org.springframework.context.annotation.Import;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Mono;

import java.lang.reflect.Field;
import java.lang.reflect.Type;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

import static com.appsmith.external.git.constants.GitConstants.NAME_SEPARATOR;
import static com.appsmith.external.helpers.AppsmithBeanUtils.copyNestedNonNullProperties;
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

@Slf4j
@Component
@RequiredArgsConstructor
@Import({FileUtilsImpl.class})
public class ApplicationGitFileUtilsCEImpl implements ArtifactGitFileUtilsCE<ApplicationGitReference> {

    private final Gson gson;
    private final NewActionService newActionService;
    private final FileInterface fileUtils;
    private final JsonSchemaMigration jsonSchemaMigration;
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

    @Override
    public void setArtifactDependentResources(
            ArtifactExchangeJson artifactExchangeJson, GitResourceMap gitResourceMap) {

        ApplicationJson applicationJson = (ApplicationJson) artifactExchangeJson;
        Map<GitResourceIdentity, Object> resourceMap = gitResourceMap.getGitResourceMap();

        // application
        Application application = applicationJson.getExportedApplication();
        removeUnwantedFieldsFromApplication(application);
        GitResourceIdentity applicationIdentity =
                new GitResourceIdentity(GitResourceType.ROOT_CONFIG, "application.json");
        resourceMap.put(applicationIdentity, application);

        // metadata
        Iterable<String> keys = AppsmithBeanUtils.getAllFields(applicationJson.getClass())
                .map(Field::getName)
                .filter(name -> !getBlockedMetadataFields().contains(name))
                .collect(Collectors.toList());

        ApplicationJson applicationMetadata = new ApplicationJson();
        applicationJson.setModifiedResources(null);
        copyProperties(applicationJson, applicationMetadata, keys);
        GitResourceIdentity metadataIdentity = new GitResourceIdentity(GitResourceType.ROOT_CONFIG, "metadata.json");
        resourceMap.put(metadataIdentity, applicationMetadata);

        // pages and widgets
        applicationJson.getPageList().stream()
                // As we are expecting the commit will happen only after the application is published, so we can safely
                // assume if the unpublished version is deleted entity should not be committed to git
                .filter(newPage -> newPage.getUnpublishedPage() != null
                        && newPage.getUnpublishedPage().getDeletedAt() == null)
                .forEach(newPage -> {
                    removeUnwantedFieldsFromPage(newPage);
                    JSONObject dsl =
                            newPage.getUnpublishedPage().getLayouts().get(0).getDsl();
                    // Get MainContainer widget data, remove the children and club with Canvas.json file
                    JSONObject mainContainer = new JSONObject(dsl);
                    mainContainer.remove("children");
                    newPage.getUnpublishedPage().getLayouts().get(0).setDsl(mainContainer);
                    // pageName will be used for naming the json file
                    GitResourceIdentity pageIdentity =
                            new GitResourceIdentity(GitResourceType.CONTEXT_CONFIG, newPage.getGitSyncId());
                    resourceMap.put(pageIdentity, newPage);

                    Map<String, org.json.JSONObject> result =
                            DSLTransformerHelper.flatten(new org.json.JSONObject(dsl.toString()));
                    result.forEach((key, jsonObject) -> {
                        String widgetId = newPage.getGitSyncId() + "-" + jsonObject.getString("widgetId");
                        GitResourceIdentity widgetIdentity =
                                new GitResourceIdentity(GitResourceType.WIDGET_CONFIG, widgetId);
                        resourceMap.put(widgetIdentity, jsonObject);
                    });
                });
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
        Iterable<String> keys = AppsmithBeanUtils.getAllFields(applicationJson.getClass())
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

    /**
     * this method checkouts to the given branch name, and creates the ApplicationJson
     * from the contents of repository
     * @param workspaceId : workspaceId of the concerned application
     * @param baseArtifactId : main branch id of the application
     * @param repoName : repository name, it's mostly the app/package name/repository name of the git project
     * @param branchName : git branch from which the json has to be reconstructed
     * @return : ApplicationJson
     */
    @Override
    public Mono<ArtifactExchangeJson> reconstructArtifactExchangeJsonFromFilesInRepository(
            String workspaceId, String baseArtifactId, String repoName, String branchName) {
        Mono<ApplicationGitReference> appReferenceMono =
                fileUtils.reconstructApplicationReferenceFromGitRepo(workspaceId, baseArtifactId, repoName, branchName);
        return appReferenceMono.flatMap(applicationReference -> {
            // Extract application metadata from the json
            ApplicationJson metadata =
                    getApplicationResource(applicationReference.getMetadata(), ApplicationJson.class);
            ApplicationJson applicationJson = getApplicationJsonFromGitReference(applicationReference);
            copyNestedNonNullProperties(metadata, applicationJson);
            return jsonSchemaMigration.migrateApplicationJsonToLatestSchema(
                    applicationJson, baseArtifactId, branchName);
        });
    }

    protected <T> List<T> getApplicationResource(Map<String, Object> resources, Type type) {

        List<T> deserializedResources = new ArrayList<>();
        if (!CollectionUtils.isNullOrEmpty(resources)) {
            for (Map.Entry<String, Object> resource : resources.entrySet()) {
                deserializedResources.add(getApplicationResource(resource.getValue(), type));
            }
        }
        return deserializedResources;
    }

    public <T> T getApplicationResource(Object resource, Type type) {
        if (resource == null) {
            return null;
        }
        return gson.fromJson(gson.toJson(resource), type);
    }

    protected ApplicationJson getApplicationJsonFromGitReference(ApplicationGitReference applicationReference) {
        ApplicationJson applicationJson = new ApplicationJson();

        setApplicationInApplicationJson(applicationReference, applicationJson);

        setThemesInApplicationJson(applicationReference, applicationJson);

        setCustomJsLibsInApplicationJson(applicationReference, applicationJson);

        setNewPagesInApplicationJson(applicationReference, applicationJson);

        setNewActionsInApplicationJson(applicationReference, applicationJson);

        setActionCollectionsInApplicationJson(applicationReference, applicationJson);

        setDatasourcesInApplicationJson(applicationReference, applicationJson);

        return applicationJson;
    }

    private void setApplicationInApplicationJson(
            ApplicationGitReference applicationReference, ApplicationJson applicationJson) {
        // Extract application data from the json
        Application application = getApplicationResource(applicationReference.getApplication(), Application.class);
        applicationJson.setExportedApplication(application);

        if (application != null && !CollectionUtils.isNullOrEmpty(application.getPages())) {
            // Remove null values
            org.apache.commons.collections.CollectionUtils.filter(
                    application.getPages(), PredicateUtils.notNullPredicate());
            // Create a deep clone of application pages to update independently
            application.setViewMode(false);
            final List<ApplicationPage> applicationPages =
                    new ArrayList<>(application.getPages().size());
            application
                    .getPages()
                    .forEach(applicationPage ->
                            applicationPages.add(gson.fromJson(gson.toJson(applicationPage), ApplicationPage.class)));
            application.setPublishedPages(applicationPages);
        }
    }

    private void setThemesInApplicationJson(
            ApplicationGitReference applicationReference, ApplicationJson applicationJson) {
        applicationJson.setEditModeTheme(getApplicationResource(applicationReference.getTheme(), Theme.class));
        // Clone the edit mode theme to published theme as both should be same for git connected application because we
        // do deploy and push as a single operation
        applicationJson.setPublishedTheme(applicationJson.getEditModeTheme());
    }

    private void setDatasourcesInApplicationJson(
            ApplicationGitReference applicationReference, ApplicationJson applicationJson) {
        // Extract datasources
        applicationJson.setDatasourceList(
                getApplicationResource(applicationReference.getDatasources(), DatasourceStorage.class));
    }

    private void setActionCollectionsInApplicationJson(
            ApplicationGitReference applicationReference, ApplicationJson applicationJson) {
        // Extract actionCollection
        if (CollectionUtils.isNullOrEmpty(applicationReference.getActionCollections())) {
            applicationJson.setActionCollectionList(new ArrayList<>());
        } else {
            Map<String, String> actionCollectionBody = applicationReference.getActionCollectionBody();
            List<ActionCollection> actionCollections =
                    getApplicationResource(applicationReference.getActionCollections(), ActionCollection.class);
            // Remove null values if present
            org.apache.commons.collections.CollectionUtils.filter(actionCollections, PredicateUtils.notNullPredicate());
            actionCollections.forEach(actionCollection -> {
                // Set the js object body to the unpublished collection
                // Since file version v3 we are splitting the js object code and metadata separately
                String keyName = actionCollection.getUnpublishedCollection().getName()
                        + actionCollection.getUnpublishedCollection().getPageId();
                if (actionCollectionBody != null && actionCollectionBody.containsKey(keyName)) {
                    actionCollection.getUnpublishedCollection().setBody(actionCollectionBody.get(keyName));
                }
                // As we are publishing the app and then committing to git we expect the published and unpublished
                // actionCollectionDTO will be same, so we create a deep copy for the published version for
                // actionCollection from unpublishedActionCollectionDTO
                actionCollection.setPublishedCollection(gson.fromJson(
                        gson.toJson(actionCollection.getUnpublishedCollection()), ActionCollectionDTO.class));
            });
            applicationJson.setActionCollectionList(actionCollections);
        }
    }

    private void setNewActionsInApplicationJson(
            ApplicationGitReference applicationReference, ApplicationJson applicationJson) {
        // Extract actions
        if (CollectionUtils.isNullOrEmpty(applicationReference.getActions())) {
            applicationJson.setActionList(new ArrayList<>());
        } else {
            Map<String, String> actionBody = applicationReference.getActionBody();
            List<NewAction> actions = getApplicationResource(applicationReference.getActions(), NewAction.class);
            // Remove null values if present
            org.apache.commons.collections.CollectionUtils.filter(actions, PredicateUtils.notNullPredicate());
            actions.forEach(newAction -> {
                // With the file version v4 we have split the actions and metadata separately into two files
                // So we need to set the body to the unpublished action
                String keyName = newAction.getUnpublishedAction().getName()
                        + newAction.getUnpublishedAction().getPageId();
                if (actionBody != null
                        && (actionBody.containsKey(keyName))
                        && !StringUtils.isEmpty(actionBody.get(keyName))) {
                    // For REMOTE plugin like Twilio the user actions are stored in key value pairs and hence they need
                    // to be
                    // deserialized separately unlike the body which is stored as string in the db.
                    if (newAction.getPluginType().toString().equals("REMOTE")) {
                        Map<String, Object> formData = gson.fromJson(actionBody.get(keyName), Map.class);
                        newAction
                                .getUnpublishedAction()
                                .getActionConfiguration()
                                .setFormData(formData);
                    } else {
                        newAction
                                .getUnpublishedAction()
                                .getActionConfiguration()
                                .setBody(actionBody.get(keyName));
                    }
                }
                // As we are publishing the app and then committing to git we expect the published and unpublished
                // actionDTO will be same, so we create a deep copy for the published version for action from
                // unpublishedActionDTO
                newAction.setPublishedAction(
                        gson.fromJson(gson.toJson(newAction.getUnpublishedAction()), ActionDTO.class));
            });
            applicationJson.setActionList(actions);
        }
    }

    private void setCustomJsLibsInApplicationJson(
            ApplicationGitReference applicationReference, ApplicationJson applicationJson) {
        List<CustomJSLib> customJSLibList =
                getApplicationResource(applicationReference.getJsLibraries(), CustomJSLib.class);

        // remove the duplicate js libraries if there is any
        List<CustomJSLib> customJSLibListWithoutDuplicates = new ArrayList<>(new HashSet<>(customJSLibList));

        applicationJson.setCustomJSLibList(customJSLibListWithoutDuplicates);
    }

    private void setNewPagesInApplicationJson(
            ApplicationGitReference applicationReference, ApplicationJson applicationJson) {
        // Extract pages
        List<NewPage> pages = getApplicationResource(applicationReference.getPages(), NewPage.class);
        // Remove null values
        org.apache.commons.collections.CollectionUtils.filter(pages, PredicateUtils.notNullPredicate());
        // Set the DSL to page object before saving
        Map<String, String> pageDsl = applicationReference.getPageDsl();
        pages.forEach(page -> {
            JSONParser jsonParser = new JSONParser();
            try {
                if (pageDsl != null && pageDsl.get(page.getUnpublishedPage().getName()) != null) {
                    page.getUnpublishedPage().getLayouts().get(0).setDsl((JSONObject) jsonParser.parse(
                            pageDsl.get(page.getUnpublishedPage().getName())));
                }
            } catch (ParseException e) {
                log.error(
                        "Error parsing the page dsl for page: {}",
                        page.getUnpublishedPage().getName(),
                        e);
                throw new AppsmithException(
                        AppsmithError.JSON_PROCESSING_ERROR,
                        page.getUnpublishedPage().getName());
            }
        });
        pages.forEach(newPage -> {
            // As we are publishing the app and then committing to git we expect the published and unpublished PageDTO
            // will be same, so we create a deep copy for the published version for page from the unpublishedPageDTO
            newPage.setPublishedPage(gson.fromJson(gson.toJson(newPage.getUnpublishedPage()), PageDTO.class));
        });
        applicationJson.setPageList(pages);
    }

    @Override
    public Path getRepoSuffixPath(String workspaceId, String artifactId, String repoName, @NonNull String... args) {
        List<String> varargs = new ArrayList<>(List.of(artifactId, repoName));
        varargs.addAll(List.of(args));
        return Paths.get(workspaceId, varargs.toArray(new String[0]));
    }
}
