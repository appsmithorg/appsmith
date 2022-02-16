package com.appsmith.server.helpers;

import com.appsmith.external.git.FileInterface;
import com.appsmith.external.models.ApplicationGitReference;
import com.appsmith.external.models.Datasource;
import com.appsmith.git.helpers.FileUtilsImpl;
import com.appsmith.server.domains.ActionCollection;
import com.appsmith.server.domains.Application;
import com.appsmith.server.domains.ApplicationJson;
import com.appsmith.server.domains.Layout;
import com.appsmith.server.domains.NewAction;
import com.appsmith.server.domains.NewPage;
import com.appsmith.server.dtos.ActionCollectionDTO;
import com.appsmith.server.dtos.ActionDTO;
import com.appsmith.server.dtos.DslActionDTO;
import com.appsmith.server.dtos.PageDTO;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.google.gson.Gson;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
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
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.TreeSet;
import java.util.stream.Collectors;

import static com.appsmith.external.helpers.AppsmithBeanUtils.copyNestedNonNullProperties;
import static com.appsmith.external.helpers.AppsmithBeanUtils.copyProperties;
import static com.appsmith.server.constants.FieldName.ACTION_COLLECTION_LIST;
import static com.appsmith.server.constants.FieldName.ACTION_LIST;
import static com.appsmith.server.constants.FieldName.DATASOURCE_LIST;
import static com.appsmith.server.constants.FieldName.DECRYPTED_FIELDS;
import static com.appsmith.server.constants.FieldName.EXPORTED_APPLICATION;
import static com.appsmith.server.constants.FieldName.PAGE_LIST;

@Slf4j
@RequiredArgsConstructor
@Component
@Import({FileUtilsImpl.class})
public class GitFileUtils {

    private final FileInterface fileUtils;

    // Only include the application helper fields in metadata object
    private static final Set<String> blockedMetadataFields
        = Set.of(EXPORTED_APPLICATION, DATASOURCE_LIST, PAGE_LIST, ACTION_LIST, ACTION_COLLECTION_LIST, DECRYPTED_FIELDS);

    /**
     * This method will save the complete application in the local repo directory.
     * Path to repo will be : ./container-volumes/git-repo/organizationId/defaultApplicationId/repoName/{application_data}
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
        ApplicationGitReference applicationReference = new ApplicationGitReference();

        Application application = applicationJson.getExportedApplication();
        removeUnwantedFieldsFromApplication(application);
        // Pass application reference
        applicationReference.setApplication(applicationJson.getExportedApplication());

        // Pass metadata
        Iterable<String> keys = Arrays.stream(applicationJson.getClass().getDeclaredFields())
                .map(Field::getName)
                .filter(name -> !blockedMetadataFields.contains(name))
                .collect(Collectors.toList());

        ApplicationJson applicationMetadata = new ApplicationJson();

        copyProperties(applicationJson, applicationMetadata, keys);
        applicationReference.setMetadata(applicationMetadata);

        // Pass pages within the application
        Map<String, Object> resourceMap = new HashMap<>();
        applicationJson.getPageList().forEach(newPage -> {
            String pageName = newPage.getUnpublishedPage() != null
                    ? newPage.getUnpublishedPage().getName()
                    : newPage.getPublishedPage().getName();

            removeUnwantedFieldsFromPage(newPage);
            // pageName will be used for naming the json file
            resourceMap.put(pageName, newPage);
        });
        applicationReference.setPages(new HashMap<>(resourceMap));
        resourceMap.clear();

        // Send actions
        applicationJson.getActionList().forEach(newAction -> {
            String prefix = newAction.getUnpublishedAction() != null ?
                    newAction.getUnpublishedAction().getName() + "_" + newAction.getUnpublishedAction().getPageId()
                    : newAction.getPublishedAction().getName() + "_" + newAction.getPublishedAction().getPageId();
            removeUnwantedFieldFromAction(newAction);
            resourceMap.put(prefix, newAction);
        });
        applicationReference.setActions(new HashMap<>(resourceMap));
        resourceMap.clear();

        // Send jsActionCollections
        applicationJson.getActionCollectionList().forEach(actionCollection -> {
            String prefix = actionCollection.getUnpublishedCollection() != null ?
                    actionCollection.getUnpublishedCollection().getName() + "_" + actionCollection.getUnpublishedCollection().getPageId()
                    : actionCollection.getPublishedCollection().getName() + "_" + actionCollection.getPublishedCollection().getPageId();

            removeUnwantedFieldFromActionCollection(actionCollection);

            resourceMap.put(prefix, actionCollection);
        });
        applicationReference.setActionsCollections(new HashMap<>(resourceMap));
        resourceMap.clear();

        // Send datasources
        applicationJson.getDatasourceList().forEach(datasource -> {
                    removeUnwantedFieldsFromDatasource(datasource);
                    resourceMap.put(datasource.getName(), datasource);
                }
        );
        applicationReference.setDatasources(new HashMap<>(resourceMap));
        resourceMap.clear();


        // Save application to git repo
        try {
            return fileUtils.saveApplicationToGitRepo(baseRepoSuffix, applicationReference, branchName);
        } catch (IOException | GitAPIException e) {
            log.error("Error occurred while saving files to local git repo: ", e);
            throw Exceptions.propagate(e);
        }
    }

    /**
     * Method to reconstruct the application from the local git repo
     *
     * @param organisationId To which organisation application needs to be rehydrated
     * @param defaultApplicationId Root application for the current branched application
     * @param branchName for which branch the application needs to rehydrate
     * @return application reference from which entire application can be rehydrated
     */
    public Mono<ApplicationJson> reconstructApplicationJsonFromGitRepo(String organisationId,
                                                                       String defaultApplicationId,
                                                                       String repoName,
                                                                       String branchName) {


        return fileUtils.reconstructApplicationReferenceFromGitRepo(organisationId, defaultApplicationId, repoName, branchName)
                .map(applicationReference -> {

                    // Extract application metadata from the json
                    ApplicationJson metadata = getApplicationResource(applicationReference.getMetadata(), ApplicationJson.class);

                    if (!isVersionCompatible(metadata)) {
                        migrateToLatestVersion(applicationReference);
                    }
                    ApplicationJson applicationJson = getApplicationJsonFromGitReference(applicationReference);
                    copyNestedNonNullProperties(metadata, applicationJson);

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
    public Mono<Path> initializeGitRepo(Path baseRepoSuffix,
                                        String viewModeUrl,
                                        String editModeUrl) throws IOException {
        return fileUtils.initializeGitRepo(baseRepoSuffix,viewModeUrl, editModeUrl)
                .onErrorResume(e -> Mono.error(new AppsmithException(AppsmithError.GIT_FILE_SYSTEM_ERROR, e)));
    }

    /**
     * When the user clicks on detach remote, we need to remove the repo from the file system
     * @param baseRepoSuffix path suffix used to create a branch repo path as per worktree implementation
     * @return success on remove of file system
     */
    public Mono<Boolean> detachRemote(Path baseRepoSuffix) {
        return fileUtils.detachRemote(baseRepoSuffix);
    }

    public Mono<Boolean> checkIfDirectoryIsEmpty(Path baseRepoSuffix) throws IOException {
        return fileUtils.checkIfDirectoryIsEmpty(baseRepoSuffix)
                .onErrorResume(e -> Mono.error(new AppsmithException(AppsmithError.GIT_FILE_SYSTEM_ERROR, e)));
    }

    private void removeUnwantedFieldsFromPage(NewPage page) {
        page.setDefaultResources(null);
        page.setCreatedAt(null);
        page.setUpdatedAt(null);
        // As we are publishing the app and then committing to git we expect the published and unpublished PageDTO will
        // be same, so we only commit unpublished PageDTO.
        page.setPublishedPage(null);
        page.setUserPermissions(null);
        PageDTO unpublishedPage = page.getUnpublishedPage();
        if (unpublishedPage != null) {
            unpublishedPage
                    .getLayouts()
                    .forEach(this::removeUnwantedFieldsFromLayout);
        }
    }

    private void removeUnwantedFieldsFromApplication(Application application) {
        // Don't commit application name as while importing we are using the repoName as application name
        application.setName(null);
        application.setPublishedPages(null);
    }

    private void removeUnwantedFieldsFromDatasource(Datasource datasource) {
        datasource.setPolicies(new HashSet<>());
        datasource.setStructure(null);
        datasource.setUpdatedAt(null);
        datasource.setCreatedAt(null);
        datasource.setUserPermissions(null);
    }

    private void removeUnwantedFieldFromAction(NewAction action) {
        action.setDefaultResources(null);
        action.setCreatedAt(null);
        action.setUpdatedAt(null);
        // As we are publishing the app and then committing to git we expect the published and unpublished ActionDTO will
        // be same, so we only commit unpublished ActionDTO.
        action.setPublishedAction(null);
        action.setUserPermissions(null);
        ActionDTO unpublishedAction = action.getUnpublishedAction();
        if (unpublishedAction != null) {
            unpublishedAction.setDefaultResources(null);
            if (unpublishedAction.getDatasource() != null) {
                unpublishedAction.getDatasource().setCreatedAt(null);
            }
        }
    }

    private void removeUnwantedFieldFromActionCollection(ActionCollection actionCollection) {
        actionCollection.setDefaultResources(null);
        actionCollection.setCreatedAt(null);
        actionCollection.setUpdatedAt(null);
        // As we are publishing the app and then committing to git we expect the published and unpublished
        // ActionCollectionDTO will be same, so we only commit unpublished ActionCollectionDTO.
        actionCollection.setPublishedCollection(null);
        actionCollection.setUserPermissions(null);
        ActionCollectionDTO unpublishedCollection = actionCollection.getUnpublishedCollection();
        if (unpublishedCollection != null) {
            unpublishedCollection.setDefaultResources(null);
            unpublishedCollection.setDefaultToBranchedActionIdsMap(null);
            unpublishedCollection.setDefaultToBranchedArchivedActionIdsMap(null);
            unpublishedCollection.setActionIds(null);
            unpublishedCollection.setArchivedActionIds(null);
        }
    }

    private void removeUnwantedFieldsFromLayout(Layout layout) {
        layout.setAllOnPageLoadActionNames(null);
        layout.setCreatedAt(null);
        layout.setUpdatedAt(null);
        layout.setAllOnPageLoadActionEdges(null);
        layout.setActionsUsedInDynamicBindings(null);
        layout.setMongoEscapedWidgetNames(null);
        List<Set<DslActionDTO>> layoutOnLoadActions = layout.getLayoutOnLoadActions();
        if (!CollectionUtils.isNullOrEmpty(layout.getLayoutOnLoadActions())) {
            // Sort actions based on id to commit to git in ordered manner
            for (int dslActionIndex = 0; dslActionIndex < layoutOnLoadActions.size(); dslActionIndex++) {
                TreeSet<DslActionDTO> sortedActions = new TreeSet<>(new CompareDslActionDTO());
                sortedActions.addAll(layoutOnLoadActions.get(dslActionIndex));
                sortedActions
                        .forEach(actionDTO -> actionDTO.setDefaultActionId(null));
                layoutOnLoadActions.set(dslActionIndex, sortedActions);
            }
        }
    }

    private ApplicationJson getApplicationJsonFromGitReference(ApplicationGitReference applicationReference) {
        ApplicationJson applicationJson = new ApplicationJson();
        // Extract application data from the json
        applicationJson.setExportedApplication(getApplicationResource(applicationReference.getApplication(), Application.class));

        Gson gson = new Gson();
        // Extract pages
        List<NewPage> pages = getApplicationResource(applicationReference.getPages(), NewPage.class);
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
            actions.forEach(newAction -> {
                // As we are publishing the app and then committing to git we expect the published and unpublished
                // actionDTO will be same, so we create a deep copy for the published version for action from
                // unpublishedActionDTO
                newAction.setPublishedAction(gson.fromJson(gson.toJson(newAction.getUnpublishedAction()), ActionDTO.class));
            });
            applicationJson.setActionList(actions);
        }

        // Extract actionCollection
        if (CollectionUtils.isNullOrEmpty(applicationReference.getActionsCollections())) {
            applicationJson.setActionCollectionList(new ArrayList<>());
        } else {
            List<ActionCollection> actionCollections = getApplicationResource(applicationReference.getActionsCollections(), ActionCollection.class);
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

    private ApplicationGitReference migrateToLatestVersion(ApplicationGitReference applicationReference) {
        // Implement the incremental version upgrade for JSON files here
        return applicationReference;
    }

    private boolean isVersionCompatible(ApplicationJson metadata) {
        Integer importedFileFormatVersion = metadata == null ? null : metadata.getFileFormatVersion();
        Integer currentFileFormatVersion = new ApplicationJson().getFileFormatVersion();

        return (importedFileFormatVersion == null || importedFileFormatVersion.equals(currentFileFormatVersion));
    }
}
