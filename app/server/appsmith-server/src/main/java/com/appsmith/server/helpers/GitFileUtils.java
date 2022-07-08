package com.appsmith.server.helpers;

import com.appsmith.external.constants.AnalyticsEvents;
import com.appsmith.external.git.FileInterface;
import com.appsmith.external.helpers.Stopwatch;
import com.appsmith.external.models.ApplicationGitReference;
import com.appsmith.external.models.Datasource;
import com.appsmith.git.helpers.FileUtilsImpl;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.domains.ActionCollection;
import com.appsmith.server.domains.Application;
import com.appsmith.server.domains.ApplicationPage;
import com.appsmith.server.domains.NewAction;
import com.appsmith.server.domains.NewPage;
import com.appsmith.server.domains.Theme;
import com.appsmith.server.dtos.ActionCollectionDTO;
import com.appsmith.server.dtos.ActionDTO;
import com.appsmith.server.dtos.ApplicationJson;
import com.appsmith.server.dtos.PageDTO;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.services.AnalyticsService;
import com.appsmith.server.services.SessionUserService;
import com.google.gson.Gson;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.collections.PredicateUtils;
import org.eclipse.jgit.api.errors.GitAPIException;
import org.springframework.context.annotation.Import;
import org.springframework.stereotype.Component;
import reactor.core.Exceptions;
import reactor.core.publisher.Mono;

import java.io.IOException;
import java.lang.reflect.Field;
import java.lang.reflect.Type;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

import static com.appsmith.external.constants.GitConstants.NAME_SEPARATOR;
import static com.appsmith.external.helpers.AppsmithBeanUtils.copyNestedNonNullProperties;
import static com.appsmith.external.helpers.AppsmithBeanUtils.copyProperties;
import static com.appsmith.server.constants.FieldName.ACTION_COLLECTION_LIST;
import static com.appsmith.server.constants.FieldName.ACTION_LIST;
import static com.appsmith.server.constants.FieldName.DATASOURCE_LIST;
import static com.appsmith.server.constants.FieldName.DECRYPTED_FIELDS;
import static com.appsmith.server.constants.FieldName.EDIT_MODE_THEME;
import static com.appsmith.server.constants.FieldName.EXPORTED_APPLICATION;
import static com.appsmith.server.constants.FieldName.PAGE_LIST;

@Slf4j
@RequiredArgsConstructor
@Component
@Import({FileUtilsImpl.class})
public class GitFileUtils {

    private final FileInterface fileUtils;
    private final AnalyticsService analyticsService;
    private final SessionUserService sessionUserService;

    // Only include the application helper fields in metadata object
    private static final Set<String> blockedMetadataFields
        = Set.of(EXPORTED_APPLICATION, DATASOURCE_LIST, PAGE_LIST, ACTION_LIST, ACTION_COLLECTION_LIST, DECRYPTED_FIELDS, EDIT_MODE_THEME);
    /**
     * This method will save the complete application in the local repo directory.
     * Path to repo will be : ./container-volumes/git-repo/workspaceId/defaultApplicationId/repoName/{application_data}
     * @param baseRepoSuffix path suffix used to create a local repo path
     * @param applicationJson application reference object from which entire application can be rehydrated
     * @param branchName name of the branch for the current application
     * @return repo path where the application is stored
     */
    public Mono<Path> saveApplicationToLocalRepo(Path baseRepoSuffix,
                                                 ApplicationJson applicationJson,
                                                 String branchName) throws IOException, GitAPIException {

        /*
            1. Checkout to branch
            2. Create application reference for appsmith-git module
            3. Save application to git repo
         */
        Stopwatch stopwatch = new Stopwatch(AnalyticsEvents.GIT_SERIALIZE_APP_RESOURCES_TO_LOCAL_FILE.getEventName());
        ApplicationGitReference applicationReference = createApplicationReference(applicationJson);
        // Save application to git repo
        try {
            Mono<Path> repoPathMono = fileUtils.saveApplicationToGitRepo(baseRepoSuffix, applicationReference, branchName).cache();
            return Mono.zip(repoPathMono, sessionUserService.getCurrentUser())
                    .map(tuple -> {
                        stopwatch.stopTimer();
                        Path repoPath = tuple.getT1();
                        // Path to repo will be : ./container-volumes/git-repo/workspaceId/defaultApplicationId/repoName/
                        final Map<String, Object> data = Map.of(
                                FieldName.APPLICATION_ID, repoPath.getParent().getFileName().toString(),
                                FieldName.ORGANIZATION_ID, repoPath.getParent().getParent().getFileName().toString(),
                                FieldName.FLOW_NAME, stopwatch.getFlow(),
                                "executionTime", stopwatch.getExecutionTime()
                        );
                        analyticsService.sendEvent(AnalyticsEvents.UNIT_EXECUTION_TIME.getEventName(), tuple.getT2().getUsername(), data);
                        return repoPath;
                    });
        } catch (IOException | GitAPIException e) {
            log.error("Error occurred while saving files to local git repo: ", e);
            throw Exceptions.propagate(e);
        }
    }

    /**
     * Method to convert application resources to the structure which can be serialised by appsmith-git module for
     * serialisation
     * @param applicationJson application resource including actions, jsobjects, pages
     * @return                resource which can be saved to file system
     */
    public ApplicationGitReference createApplicationReference(ApplicationJson applicationJson) {
        ApplicationGitReference applicationReference = new ApplicationGitReference();

        Application application = applicationJson.getExportedApplication();
        removeUnwantedFieldsFromApplication(application);
        // Pass application reference
        applicationReference.setApplication(applicationJson.getExportedApplication());

        // No need to commit publish mode theme as it leads to conflict resolution at both the places if any
        applicationJson.setPublishedTheme(null);

        // Pass metadata
        Iterable<String> keys = Arrays.stream(applicationJson.getClass().getDeclaredFields())
                .map(Field::getName)
                .filter(name -> !blockedMetadataFields.contains(name))
                .collect(Collectors.toList());

        ApplicationJson applicationMetadata = new ApplicationJson();
        Map<String, Set<String>> updatedResources = applicationJson.getUpdatedResources();
        applicationJson.setUpdatedResources(null);
        copyProperties(applicationJson, applicationMetadata, keys);
        applicationReference.setMetadata(applicationMetadata);

        // Remove policies from the themes
        applicationJson.getEditModeTheme().setPolicies(null);

        applicationReference.setTheme(applicationJson.getEditModeTheme());

        // Insert only active pages which will then be committed to repo as individual file
        Map<String, Object> resourceMap = new HashMap<>();
        applicationJson
                .getPageList()
                .stream()
                // As we are expecting the commit will happen only after the application is published, so we can safely
                // assume if the unpublished version is deleted entity should not be committed to git
                .filter(newPage -> newPage.getUnpublishedPage() != null
                        && newPage.getUnpublishedPage().getDeletedAt() == null)
                .forEach(newPage -> {
                    String pageName = newPage.getUnpublishedPage() != null
                            ? newPage.getUnpublishedPage().getName()
                            : newPage.getPublishedPage().getName();
                    removeUnwantedFieldsFromPage(newPage);
                    // pageName will be used for naming the json file
                    resourceMap.put(pageName, newPage);
                });

        applicationReference.setPages(new HashMap<>(resourceMap));
        resourceMap.clear();

        // Insert active actions and also assign the keys which later will be used for saving the resource in actual filepath
        // For actions, we are referring to validNames to maintain unique file names as just name
        // field don't guarantee unique constraint for actions within JSObject
        // queryValidName_pageName => nomenclature for the keys
        applicationJson
                .getActionList()
                .stream()
                // As we are expecting the commit will happen only after the application is published, so we can safely
                // assume if the unpublished version is deleted entity should not be committed to git
                .filter(newAction -> newAction.getUnpublishedAction() != null
                        && newAction.getUnpublishedAction().getDeletedAt() == null)
                .forEach(newAction -> {
                    String prefix = newAction.getUnpublishedAction() != null ?
                            newAction.getUnpublishedAction().getValidName() + NAME_SEPARATOR + newAction.getUnpublishedAction().getPageId()
                            : newAction.getPublishedAction().getValidName() + NAME_SEPARATOR + newAction.getPublishedAction().getPageId();
                    removeUnwantedFieldFromAction(newAction);
                    resourceMap.put(prefix, newAction);
                });
        applicationReference.setActions(new HashMap<>(resourceMap));
        resourceMap.clear();

        // Insert JSOObjects and also assign the keys which later will be used for saving the resource in actual filepath
        // JSObjectName_pageName => nomenclature for the keys
        applicationJson
                .getActionCollectionList()
                .stream()
                // As we are expecting the commit will happen only after the application is published, so we can safely
                // assume if the unpublished version is deleted entity should not be committed to git
                .filter(collection -> collection.getUnpublishedCollection() != null
                        && collection.getUnpublishedCollection().getDeletedAt() == null)
                .forEach(actionCollection -> {
                    String prefix = actionCollection.getUnpublishedCollection() != null ?
                            actionCollection.getUnpublishedCollection().getName() + NAME_SEPARATOR + actionCollection.getUnpublishedCollection().getPageId()
                            : actionCollection.getPublishedCollection().getName() + NAME_SEPARATOR + actionCollection.getPublishedCollection().getPageId();
                    removeUnwantedFieldFromActionCollection(actionCollection);

                    resourceMap.put(prefix, actionCollection);
                });
        applicationReference.setActionCollections(new HashMap<>(resourceMap));
        applicationReference.setUpdatedResources(updatedResources);
        resourceMap.clear();

        // Send datasources
        applicationJson
                .getDatasourceList()
                .forEach(datasource -> {
                    resourceMap.put(datasource.getName(), datasource);
                });
        applicationReference.setDatasources(new HashMap<>(resourceMap));
        resourceMap.clear();

        return applicationReference;
    }

    /**
     * Method to reconstruct the application from the local git repo
     *
     * @param workspaceId To which workspace application needs to be rehydrated
     * @param defaultApplicationId Root application for the current branched application
     * @param branchName for which branch the application needs to rehydrate
     * @return application reference from which entire application can be rehydrated
     */
    public Mono<ApplicationJson> reconstructApplicationJsonFromGitRepo(String workspaceId,
                                                                       String defaultApplicationId,
                                                                       String repoName,
                                                                       String branchName) {
        Stopwatch stopwatch = new Stopwatch(AnalyticsEvents.GIT_DESERIALIZE_APP_RESOURCES_FROM_FILE.getEventName());
        Mono<ApplicationGitReference> appReferenceMono = fileUtils
                .reconstructApplicationReferenceFromGitRepo(workspaceId, defaultApplicationId, repoName, branchName);
        return Mono.zip(appReferenceMono, sessionUserService.getCurrentUser())
                .map(tuple -> {
                    ApplicationGitReference applicationReference = tuple.getT1();
                    // Extract application metadata from the json
                    ApplicationJson metadata = getApplicationResource(applicationReference.getMetadata(), ApplicationJson.class);
                    ApplicationJson applicationJson = getApplicationJsonFromGitReference(applicationReference);
                    copyNestedNonNullProperties(metadata, applicationJson);
                    stopwatch.stopTimer();
                    final Map<String, Object> data = Map.of(
                            FieldName.APPLICATION_ID, defaultApplicationId,
                            FieldName.ORGANIZATION_ID, workspaceId,
                            FieldName.FLOW_NAME, stopwatch.getFlow(),
                            "executionTime", stopwatch.getExecutionTime()
                    );
                    analyticsService.sendEvent(AnalyticsEvents.UNIT_EXECUTION_TIME.getEventName(), tuple.getT2().getUsername(), data);
                    return applicationJson;
                });
    }

    private <T> List<T> getApplicationResource(Map<String, Object> resources, Type type) {

        List<T> deserializedResources = new ArrayList<>();
        if (!CollectionUtils.isNullOrEmpty(resources)) {
            for (Map.Entry<String, Object> resource : resources.entrySet()) {
                deserializedResources.add(getApplicationResource(resource.getValue(), type));
            }
        }
        return deserializedResources;
    }

    private <T> T getApplicationResource(Object resource, Type type) {
        if (resource == null) {
            return null;
        }
        Gson gson = new Gson();
        return gson.fromJson(gson.toJson(resource), type);
    }

    /**
     * Once the user connects the existing application to a remote repo, we will initialize the repo with Readme.md -
     * Url to the deployed app(view and edit mode)
     * Link to discord channel for support
     * Link to appsmith documentation for Git related operations
     * Welcome message
     *
     * @param baseRepoSuffix path suffix used to create a branch repo path as per worktree implementation
     * @param viewModeUrl    URL to deployed version of the application view only mode
     * @param editModeUrl    URL to deployed version of the application edit mode
     * @return Path where the Application is stored
     */
    public Mono<Path> initializeReadme(Path baseRepoSuffix,
                                       String viewModeUrl,
                                       String editModeUrl) throws IOException {
        return fileUtils.initializeReadme(baseRepoSuffix,viewModeUrl, editModeUrl)
                .onErrorResume(e -> Mono.error(new AppsmithException(AppsmithError.GIT_FILE_SYSTEM_ERROR, e)));
    }

    /**
     * When the user clicks on detach remote, we need to remove the repo from the file system
     * @param baseRepoSuffix path suffix used to create a branch repo path as per worktree implementation
     * @return success on remove of file system
     */
    public Mono<Boolean> deleteLocalRepo(Path baseRepoSuffix) {
        return fileUtils.deleteLocalRepo(baseRepoSuffix);
    }

    public Mono<Boolean> checkIfDirectoryIsEmpty(Path baseRepoSuffix) throws IOException {
        return fileUtils.checkIfDirectoryIsEmpty(baseRepoSuffix)
                .onErrorResume(e -> Mono.error(new AppsmithException(AppsmithError.GIT_FILE_SYSTEM_ERROR, e)));
    }

    private void removeUnwantedFieldsFromPage(NewPage page) {
        // As we are publishing the app and then committing to git we expect the published and unpublished PageDTO will
        // be same, so we only commit unpublished PageDTO.
        page.setPublishedPage(null);
    }

    private void removeUnwantedFieldsFromApplication(Application application) {
        // Don't commit application name as while importing we are using the repoName as application name
        application.setName(null);
        application.setPublishedPages(null);
        application.setIsPublic(null);
        application.setSlug(null);
    }

    private void removeUnwantedFieldFromAction(NewAction action) {
        // As we are publishing the app and then committing to git we expect the published and unpublished ActionDTO will
        // be same, so we only commit unpublished ActionDTO.
        action.setPublishedAction(null);
    }

    private void removeUnwantedFieldFromActionCollection(ActionCollection actionCollection) {
        // As we are publishing the app and then committing to git we expect the published and unpublished
        // ActionCollectionDTO will be same, so we only commit unpublished ActionCollectionDTO.
        actionCollection.setPublishedCollection(null);
    }

    private ApplicationJson getApplicationJsonFromGitReference(ApplicationGitReference applicationReference) {
        ApplicationJson applicationJson = new ApplicationJson();
        // Extract application data from the json
        Application application = getApplicationResource(applicationReference.getApplication(), Application.class);
        applicationJson.setExportedApplication(application);
        applicationJson.setEditModeTheme(getApplicationResource(applicationReference.getTheme(), Theme.class));
        // Clone the edit mode theme to published theme as both should be same for git connected application because we
        // do deploy and push as a single operation
        applicationJson.setPublishedTheme(applicationJson.getEditModeTheme());
        Gson gson = new Gson();

        if (application != null && !CollectionUtils.isNullOrEmpty(application.getPages())) {
            // Remove null values
            org.apache.commons.collections.CollectionUtils.filter(application.getPages(), PredicateUtils.notNullPredicate());
            // Create a deep clone of application pages to update independently
            application.setViewMode(false);
            final List<ApplicationPage> applicationPages = new ArrayList<>(application.getPages().size());
            application.getPages()
                    .forEach(applicationPage -> applicationPages.add(gson.fromJson(gson.toJson(applicationPage), ApplicationPage.class)));
            application.setPublishedPages(applicationPages);
        }

        // Extract pages
        List<NewPage> pages = getApplicationResource(applicationReference.getPages(), NewPage.class);
        // Remove null values
        org.apache.commons.collections.CollectionUtils.filter(pages, PredicateUtils.notNullPredicate());
        pages.forEach(newPage -> {
            // As we are publishing the app and then committing to git we expect the published and unpublished PageDTO
            // will be same, so we create a deep copy for the published version for page from the unpublishedPageDTO
            newPage.setPublishedPage(gson.fromJson(gson.toJson(newPage.getUnpublishedPage()), PageDTO.class));
        });
        applicationJson.setPageList(pages);

        // Extract actions
        if (CollectionUtils.isNullOrEmpty(applicationReference.getActions())) {
            applicationJson.setActionList(new ArrayList<>());
        } else {
            List<NewAction> actions = getApplicationResource(applicationReference.getActions(), NewAction.class);
            // Remove null values if present
            org.apache.commons.collections.CollectionUtils.filter(actions, PredicateUtils.notNullPredicate());
            actions.forEach(newAction -> {
                // As we are publishing the app and then committing to git we expect the published and unpublished
                // actionDTO will be same, so we create a deep copy for the published version for action from
                // unpublishedActionDTO
                newAction.setPublishedAction(gson.fromJson(gson.toJson(newAction.getUnpublishedAction()), ActionDTO.class));
            });
            applicationJson.setActionList(actions);
        }

        // Extract actionCollection
        if (CollectionUtils.isNullOrEmpty(applicationReference.getActionCollections())) {
            applicationJson.setActionCollectionList(new ArrayList<>());
        } else {
            List<ActionCollection> actionCollections = getApplicationResource(applicationReference.getActionCollections(), ActionCollection.class);
            // Remove null values if present
            org.apache.commons.collections.CollectionUtils.filter(actionCollections, PredicateUtils.notNullPredicate());
            actionCollections.forEach(actionCollection -> {
                // As we are publishing the app and then committing to git we expect the published and unpublished
                // actionCollectionDTO will be same, so we create a deep copy for the published version for
                // actionCollection from unpublishedActionCollectionDTO
                actionCollection.setPublishedCollection(gson.fromJson(gson.toJson(actionCollection.getUnpublishedCollection()), ActionCollectionDTO.class));
            });
            applicationJson.setActionCollectionList(actionCollections);
        }

        // Extract datasources
        applicationJson.setDatasourceList(getApplicationResource(applicationReference.getDatasources(), Datasource.class));

        return applicationJson;
    }
}
