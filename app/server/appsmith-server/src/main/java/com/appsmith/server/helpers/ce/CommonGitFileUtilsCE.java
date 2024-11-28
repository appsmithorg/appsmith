package com.appsmith.server.helpers.ce;

import com.appsmith.external.constants.AnalyticsEvents;
import com.appsmith.external.git.FileInterface;
import com.appsmith.external.git.models.GitResourceIdentity;
import com.appsmith.external.git.models.GitResourceMap;
import com.appsmith.external.git.models.GitResourceType;
import com.appsmith.external.git.operations.FileOperations;
import com.appsmith.external.helpers.Stopwatch;
import com.appsmith.external.models.ApplicationGitReference;
import com.appsmith.external.models.ArtifactGitReference;
import com.appsmith.external.models.BaseDomain;
import com.appsmith.external.models.DatasourceStorage;
import com.appsmith.external.models.PluginType;
import com.appsmith.git.constants.CommonConstants;
import com.appsmith.git.files.FileUtilsImpl;
import com.appsmith.server.actioncollections.base.ActionCollectionService;
import com.appsmith.server.constants.ArtifactType;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.domains.ActionCollection;
import com.appsmith.server.domains.GitArtifactMetadata;
import com.appsmith.server.domains.NewAction;
import com.appsmith.server.domains.Theme;
import com.appsmith.server.dtos.ApplicationJson;
import com.appsmith.server.dtos.ArtifactExchangeJson;
import com.appsmith.server.dtos.PageDTO;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.helpers.ArtifactGitFileUtils;
import com.appsmith.server.migrations.JsonSchemaVersions;
import com.appsmith.server.newactions.base.NewActionService;
import com.appsmith.server.services.AnalyticsService;
import com.appsmith.server.services.SessionUserService;
import com.google.gson.Gson;
import com.google.gson.JsonElement;
import com.google.gson.JsonObject;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.eclipse.jgit.api.errors.GitAPIException;
import org.json.JSONObject;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Import;
import org.springframework.stereotype.Component;
import reactor.core.Exceptions;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Schedulers;

import java.io.IOException;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.HashMap;
import java.util.Map;

import static com.appsmith.external.git.constants.ce.GitConstantsCE.GitCommandConstantsCE.CHECKOUT_BRANCH;
import static com.appsmith.external.git.constants.ce.GitConstantsCE.RECONSTRUCT_PAGE;
import static com.appsmith.git.constants.CommonConstants.CLIENT_SCHEMA_VERSION;
import static com.appsmith.git.constants.CommonConstants.FILE_FORMAT_VERSION;
import static com.appsmith.git.constants.CommonConstants.SERVER_SCHEMA_VERSION;
import static com.appsmith.git.files.FileUtilsCEImpl.getJsLibFileName;
import static org.springframework.util.StringUtils.hasText;

@Slf4j
@RequiredArgsConstructor
@Component
@Import({FileUtilsImpl.class})
public class CommonGitFileUtilsCE {

    protected final ArtifactGitFileUtils<ApplicationGitReference> applicationGitFileUtils;
    private final FileInterface fileUtils;
    private final FileOperations fileOperations;
    private final AnalyticsService analyticsService;
    private final SessionUserService sessionUserService;

    private final NewActionService newActionService;
    private final ActionCollectionService actionCollectionService;

    // Number of seconds after lock file is stale
    @Value("${appsmith.index.lock.file.time}")
    public final int INDEX_LOCK_FILE_STALE_TIME = 300;

    private final JsonSchemaVersions jsonSchemaVersions;

    private ArtifactGitFileUtils<?> getArtifactBasedFileHelper(ArtifactType artifactType) {
        if (ArtifactType.APPLICATION.equals(artifactType)) {
            return applicationGitFileUtils;
        }

        // default case for now
        return applicationGitFileUtils;
    }

    /**
     * This method will save the complete application in the local repo directory.
     * Path to repo will be : ./container-volumes/git-repo/workspaceId/defaultApplicationId/repoName/{application_data}
     *
     * @param baseRepoSuffix  path suffix used to create a local repo path
     * @param artifactExchangeJson application reference object from which entire application can be rehydrated
     * @param branchName      name of the branch for the current application
     * @return repo path where the application is stored
     */
    public Mono<Path> saveArtifactToLocalRepo(
            Path baseRepoSuffix, ArtifactExchangeJson artifactExchangeJson, String branchName)
            throws IOException, GitAPIException {

        // this should come from the specific files
        ArtifactGitReference artifactGitReference = createArtifactReference(artifactExchangeJson);

        // Save application to git repo
        try {
            return fileUtils
                    .saveApplicationToGitRepo(baseRepoSuffix, artifactGitReference, branchName)
                    .subscribeOn(Schedulers.boundedElastic());
        } catch (IOException | GitAPIException e) {
            log.error("Error occurred while saving files to local git repo: ", e);
            throw Exceptions.propagate(e);
        }
    }

    public Mono<Path> saveArtifactToLocalRepoWithAnalytics(
            Path baseRepoSuffix, ArtifactExchangeJson artifactExchangeJson, String branchName) {

        /*
           1. Checkout to branch
           2. Create artifact reference for appsmith-git module
           3. Save artifact to git repo
        */
        // TODO: see if event needs to be generalised or kept specific
        Stopwatch stopwatch = new Stopwatch(AnalyticsEvents.GIT_SERIALIZE_APP_RESOURCES_TO_LOCAL_FILE.getEventName());
        ArtifactGitFileUtils<?> artifactGitFileUtils =
                getArtifactBasedFileHelper(artifactExchangeJson.getArtifactJsonType());
        String artifactConstant = artifactGitFileUtils.getConstantsMap().get(FieldName.ARTIFACT_CONTEXT);

        try {
            Mono<Path> repoPathMono = saveArtifactToLocalRepo(baseRepoSuffix, artifactExchangeJson, branchName);
            return Mono.zip(repoPathMono, sessionUserService.getCurrentUser()).flatMap(tuple -> {
                stopwatch.stopTimer();
                Path repoPath = tuple.getT1();
                // Path to repo will be : ./container-volumes/git-repo/workspaceId/defaultApplicationId/repoName/
                final Map<String, Object> data = Map.of(
                        artifactConstant,
                        repoPath.getParent().getFileName().toString(),
                        FieldName.ORGANIZATION_ID,
                        repoPath.getParent().getParent().getFileName().toString(),
                        FieldName.FLOW_NAME,
                        stopwatch.getFlow(),
                        "executionTime",
                        stopwatch.getExecutionTime());
                return analyticsService
                        .sendEvent(
                                AnalyticsEvents.UNIT_EXECUTION_TIME.getEventName(),
                                tuple.getT2().getUsername(),
                                data)
                        .thenReturn(repoPath);
            });
        } catch (IOException | GitAPIException e) {
            log.error("Error occurred while saving files to local git repo: ", e);
            throw Exceptions.propagate(e);
        }
    }

    public Mono<Path> saveArtifactToLocalRepo(
            String workspaceId,
            String baseArtifactId,
            String repoName,
            ApplicationJson applicationJson,
            String branchName)
            throws GitAPIException, IOException {

        // TODO: Paths are to populated by artifact specific services
        Path baseRepoSuffix = Paths.get(workspaceId, baseArtifactId, repoName);
        return saveArtifactToLocalRepo(baseRepoSuffix, applicationJson, branchName);
    }

    /**
     * Method to convert artifact resources to the structure which can be serialised by appsmith-git module for
     * serialisation
     *
     * @param artifactExchangeJson artifact resource including datasource, jsobjects, actions
     * @return resource which can be saved to file system
     */
    public ArtifactGitReference createArtifactReference(ArtifactExchangeJson artifactExchangeJson) {

        ArtifactGitFileUtils<?> artifactGitFileUtils =
                getArtifactBasedFileHelper(artifactExchangeJson.getArtifactJsonType());
        ArtifactGitReference artifactGitReference = artifactGitFileUtils.createArtifactReferenceObject();
        artifactGitReference.setModifiedResources(artifactExchangeJson.getModifiedResources());

        setDatasourcesInArtifactReference(artifactExchangeJson, artifactGitReference);
        artifactGitFileUtils.addArtifactReferenceFromExportedJson(artifactExchangeJson, artifactGitReference);
        return artifactGitReference;
    }

    public GitResourceMap createGitResourceMap(ArtifactExchangeJson artifactExchangeJson) {
        ArtifactGitFileUtils<?> artifactGitFileUtils =
                getArtifactBasedFileHelper(artifactExchangeJson.getArtifactJsonType());
        GitResourceMap gitResourceMap = new GitResourceMap();
        gitResourceMap.setModifiedResources(artifactExchangeJson.getModifiedResources());

        setArtifactIndependentResources(artifactExchangeJson, gitResourceMap);

        artifactGitFileUtils.setArtifactDependentResources(artifactExchangeJson, gitResourceMap);

        return gitResourceMap;
    }

    protected void setArtifactIndependentResources(
            ArtifactExchangeJson artifactExchangeJson, GitResourceMap gitResourceMap) {
        Map<GitResourceIdentity, Object> resourceMap = gitResourceMap.getGitResourceMap();

        // datasources
        artifactExchangeJson.getDatasourceList().forEach(datasource -> {
            removeUnwantedFieldsFromDatasource(datasource);
            GitResourceIdentity identity =
                    new GitResourceIdentity(GitResourceType.DATASOURCE_CONFIG, datasource.getGitSyncId());
            resourceMap.put(identity, datasource);
        });

        // themes
        Theme theme = artifactExchangeJson.getUnpublishedTheme();
        // Only proceed if the current artifact supports themes
        if (theme != null) {
            // Reset published mode theme since it is not required
            artifactExchangeJson.setThemes(theme, null);
            // Remove internal fields from the themes
            removeUnwantedFieldsFromBaseDomain(theme);
            GitResourceIdentity identity = new GitResourceIdentity(GitResourceType.ROOT_CONFIG, "theme.json");
            resourceMap.put(identity, theme);
        }

        // custom js libs
        artifactExchangeJson.getCustomJSLibList().forEach(jsLib -> {
            removeUnwantedFieldsFromBaseDomain(jsLib);
            String jsLibFileName = getJsLibFileName(jsLib.getUidString());
            GitResourceIdentity identity = new GitResourceIdentity(GitResourceType.JSLIB_CONFIG, jsLibFileName);
            resourceMap.put(identity, jsLib);
        });

        // actions
        setNewActionsInResourceMap(artifactExchangeJson, resourceMap);

        // action collections
        setActionCollectionsInResourceMap(artifactExchangeJson, resourceMap);
    }

    protected void setNewActionsInResourceMap(
            ArtifactExchangeJson artifactExchangeJson, Map<GitResourceIdentity, Object> resourceMap) {
        if (artifactExchangeJson.getActionList() == null) {
            return;
        }
        artifactExchangeJson.getActionList().stream()
                // As we are expecting the commit will happen only after the application is published, so we can safely
                // assume if the unpublished version is deleted entity should not be committed to git
                .filter(newAction -> newAction.getUnpublishedAction() != null
                        && newAction.getUnpublishedAction().getDeletedAt() == null)
                .peek(newAction -> newActionService.generateActionByViewMode(newAction, false))
                .forEach(newAction -> {
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
                    // The user configured values are stored in an attribute called formData which is a map unlike the
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
                        GitResourceIdentity actionDataIdentity =
                                new GitResourceIdentity(GitResourceType.QUERY_DATA, newAction.getGitSyncId());
                        resourceMap.put(actionDataIdentity, body);
                    }
                    GitResourceIdentity actionConfigIdentity =
                            new GitResourceIdentity(GitResourceType.QUERY_CONFIG, newAction.getGitSyncId());
                    resourceMap.put(actionConfigIdentity, newAction);
                });
    }

    protected void setActionCollectionsInResourceMap(
            ArtifactExchangeJson artifactExchangeJson, Map<GitResourceIdentity, Object> resourceMap) {
        if (artifactExchangeJson.getActionCollectionList() == null) {
            return;
        }
        artifactExchangeJson.getActionCollectionList().stream()
                // As we are expecting the commit will happen only after the application is published, so we can safely
                // assume if the unpublished version is deleted entity should not be committed to git
                .filter(collection -> collection.getUnpublishedCollection() != null
                        && collection.getUnpublishedCollection().getDeletedAt() == null)
                .peek(actionCollection ->
                        actionCollectionService.generateActionCollectionByViewMode(actionCollection, false))
                .forEach(actionCollection -> {
                    removeUnwantedFieldFromActionCollection(actionCollection);
                    String body = actionCollection.getUnpublishedCollection().getBody() != null
                            ? actionCollection.getUnpublishedCollection().getBody()
                            : "";
                    actionCollection.getUnpublishedCollection().setBody(null);

                    GitResourceIdentity collectionConfigIdentity =
                            new GitResourceIdentity(GitResourceType.JSOBJECT_CONFIG, actionCollection.getGitSyncId());
                    resourceMap.put(collectionConfigIdentity, actionCollection);

                    GitResourceIdentity collectionDataIdentity =
                            new GitResourceIdentity(GitResourceType.JSOBJECT_DATA, actionCollection.getGitSyncId());
                    resourceMap.put(collectionDataIdentity, body);
                });
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

    private void setDatasourcesInArtifactReference(
            ArtifactExchangeJson artifactExchangeJson, ArtifactGitReference artifactGitReference) {
        Map<String, Object> resourceMap = new HashMap<>();
        // Send datasources

        artifactExchangeJson.getDatasourceList().forEach(datasource -> {
            removeUnwantedFieldsFromDatasource(datasource);
            resourceMap.put(datasource.getName(), datasource);
        });

        artifactGitReference.setDatasources(resourceMap);
    }

    /**
     * Method to reconstruct the application from the local git repo
     *
     * @param workspaceId       To which workspace application needs to be rehydrated
     * @param baseArtifactId Root application for the current branched application
     * @param branchName        for which branch the application needs to rehydrate
     * @param artifactType
     * @return application reference from which entire application can be rehydrated
     */
    public Mono<ArtifactExchangeJson> reconstructArtifactExchangeJsonFromGitRepoWithAnalytics(
            String workspaceId, String baseArtifactId, String repoName, String branchName, ArtifactType artifactType) {

        Stopwatch stopwatch = new Stopwatch(AnalyticsEvents.GIT_DESERIALIZE_APP_RESOURCES_FROM_FILE.getEventName());
        ArtifactGitFileUtils<?> artifactGitFileUtils = getArtifactBasedFileHelper(artifactType);
        Map<String, String> constantsMap = artifactGitFileUtils.getConstantsMap();
        return Mono.zip(
                        reconstructArtifactExchangeJsonFromGitRepo(
                                workspaceId, baseArtifactId, repoName, branchName, artifactType),
                        sessionUserService.getCurrentUser())
                .flatMap(tuple -> {
                    stopwatch.stopTimer();
                    final Map<String, Object> data = Map.of(
                            constantsMap.get(FieldName.ID),
                            baseArtifactId,
                            FieldName.ORGANIZATION_ID,
                            workspaceId,
                            FieldName.FLOW_NAME,
                            stopwatch.getFlow(),
                            "executionTime",
                            stopwatch.getExecutionTime());
                    return analyticsService
                            .sendEvent(
                                    AnalyticsEvents.UNIT_EXECUTION_TIME.getEventName(),
                                    tuple.getT2().getUsername(),
                                    data)
                            .thenReturn(tuple.getT1());
                });
    }

    public Mono<ArtifactExchangeJson> reconstructArtifactExchangeJsonFromGitRepo(
            String workspaceId, String baseArtifactId, String repoName, String branchName, ArtifactType artifactType) {

        ArtifactGitFileUtils<?> artifactGitFileUtils = getArtifactBasedFileHelper(artifactType);
        return artifactGitFileUtils.reconstructArtifactExchangeJsonFromFilesInRepository(
                workspaceId, baseArtifactId, repoName, branchName);
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
    public Mono<Path> initializeReadme(Path baseRepoSuffix, String viewModeUrl, String editModeUrl) throws IOException {
        return fileUtils
                .initializeReadme(baseRepoSuffix, viewModeUrl, editModeUrl)
                .onErrorResume(e -> Mono.error(new AppsmithException(AppsmithError.GIT_FILE_SYSTEM_ERROR, e)));
    }

    /**
     * When the user clicks on detach remote, we need to remove the repo from the file system
     *
     * @param baseRepoSuffix path suffix used to create a branch repo path as per worktree implementation
     * @return success on remove of file system
     */
    public Mono<Boolean> deleteLocalRepo(Path baseRepoSuffix) {
        return fileUtils.deleteLocalRepo(baseRepoSuffix);
    }

    public Mono<Boolean> checkIfDirectoryIsEmpty(Path baseRepoSuffix) throws IOException {
        return fileUtils
                .checkIfDirectoryIsEmpty(baseRepoSuffix)
                .onErrorResume(e -> Mono.error(new AppsmithException(AppsmithError.GIT_FILE_SYSTEM_ERROR, e)));
    }

    public static void removeUnwantedFieldsFromBaseDomain(BaseDomain baseDomain) {
        baseDomain.setPolicies(null);
        baseDomain.setUserPermissions(null);
    }

    private void removeUnwantedFieldsFromDatasource(DatasourceStorage datasource) {
        datasource.setInvalids(null);
        removeUnwantedFieldsFromBaseDomain(datasource);
    }

    public Mono<Long> deleteIndexLockFile(Path path) {
        return fileUtils.deleteIndexLockFile(path, INDEX_LOCK_FILE_STALE_TIME);
    }

    public Mono<Map<String, Integer>> reconstructMetadataFromRepo(
            String workspaceId,
            String applicationId,
            String repoName,
            String branchName,
            Boolean isResetToLastCommitRequired,
            ArtifactType artifactType) {

        ArtifactGitFileUtils<?> artifactGitFileUtils = getArtifactBasedFileHelper(artifactType);
        Path baseRepoSuffix = artifactGitFileUtils.getRepoSuffixPath(workspaceId, applicationId, repoName);

        return fileUtils
                .reconstructMetadataFromGitRepo(
                        workspaceId, applicationId, repoName, branchName, baseRepoSuffix, isResetToLastCommitRequired)
                .onErrorResume(error -> Mono.error(
                        new AppsmithException(AppsmithError.GIT_ACTION_FAILED, CHECKOUT_BRANCH, error.getMessage())))
                .map(metadata -> {
                    Gson gson = new Gson();
                    JsonObject metadataJsonObject =
                            gson.toJsonTree(metadata, Object.class).getAsJsonObject();
                    Integer serverSchemaVersion = getServerSchemaVersion(metadataJsonObject);
                    Integer clientSchemaVersion = getClientSchemaVersion(metadataJsonObject);
                    Integer fileFormatVersion = getFileFormatVersion(metadataJsonObject);

                    Map<String, Integer> metadataMap = new HashMap<>();
                    metadataMap.put(SERVER_SCHEMA_VERSION, serverSchemaVersion);
                    metadataMap.put(CLIENT_SCHEMA_VERSION, clientSchemaVersion);
                    metadataMap.put(FILE_FORMAT_VERSION, fileFormatVersion);
                    return metadataMap;
                });
    }

    /**
     * Provides the server schema version in the application json for the given branch
     *
     * @param workspaceId                 : workspaceId of the artifact
     * @param gitArtifactMetadata         : git artifact metadata of the application
     * @param isResetToLastCommitRequired : would we need to execute reset command
     * @param artifactType                : artifact type of this operation
     * @return the server schema migration version number
     */
    public Mono<Integer> getMetadataServerSchemaMigrationVersion(
            String workspaceId,
            GitArtifactMetadata gitArtifactMetadata,
            Boolean isResetToLastCommitRequired,
            ArtifactType artifactType) {

        String defaultArtifactId = gitArtifactMetadata.getDefaultArtifactId();
        String branchName = gitArtifactMetadata.getBranchName();
        String repoName = gitArtifactMetadata.getRepoName();

        if (!hasText(workspaceId)) {
            return Mono.error(new AppsmithException(AppsmithError.INVALID_PARAMETER, FieldName.WORKSPACE_ID));
        }

        if (!hasText(defaultArtifactId)) {
            return Mono.error(new AppsmithException(AppsmithError.INVALID_PARAMETER, FieldName.ARTIFACT_ID));
        }

        if (!hasText(branchName)) {
            return Mono.error(new AppsmithException(AppsmithError.INVALID_PARAMETER, FieldName.BRANCH_NAME));
        }

        if (!hasText(repoName)) {
            return Mono.error(new AppsmithException(AppsmithError.INVALID_PARAMETER, FieldName.REPO_NAME));
        }

        Mono<Integer> serverSchemaNumberMono = reconstructMetadataFromRepo(
                        workspaceId, defaultArtifactId, repoName, branchName, isResetToLastCommitRequired, artifactType)
                .map(metadataMap -> {
                    return metadataMap.getOrDefault(
                            CommonConstants.SERVER_SCHEMA_VERSION, jsonSchemaVersions.getServerVersion());
                });

        return Mono.create(
                sink -> serverSchemaNumberMono.subscribe(sink::success, sink::error, null, sink.currentContext()));
    }

    /**
     * Provides the server schema version in the application json for the given branch
     *
     * @param workspaceId                 : workspace id of the application
     * @param gitArtifactMetadata         : git artifact metadata
     * @param isResetToLastCommitRequired : whether git reset hard is required
     * @param artifactType                : artifact type of this operation
     * @return the server schema migration version number
     */
    public Mono<JSONObject> getPageDslVersionNumber(
            String workspaceId,
            GitArtifactMetadata gitArtifactMetadata,
            PageDTO pageDTO,
            Boolean isResetToLastCommitRequired,
            ArtifactType artifactType) {

        String defaultArtifactId = gitArtifactMetadata.getDefaultArtifactId();
        String branchName = gitArtifactMetadata.getBranchName();
        String repoName = gitArtifactMetadata.getRepoName();

        if (!hasText(workspaceId)) {
            return Mono.error(new AppsmithException(AppsmithError.INVALID_PARAMETER, FieldName.WORKSPACE_ID));
        }

        if (!hasText(defaultArtifactId)) {
            return Mono.error(new AppsmithException(AppsmithError.INVALID_PARAMETER, FieldName.ARTIFACT_ID));
        }

        if (!hasText(branchName)) {
            return Mono.error(new AppsmithException(AppsmithError.INVALID_PARAMETER, FieldName.BRANCH_NAME));
        }

        if (!hasText(repoName)) {
            return Mono.error(new AppsmithException(AppsmithError.INVALID_PARAMETER, FieldName.REPO_NAME));
        }

        if (pageDTO == null) {
            return Mono.error(new AppsmithException(AppsmithError.PAGE_ID_NOT_GIVEN, FieldName.PAGE));
        }

        ArtifactGitFileUtils<?> artifactGitFileUtils = getArtifactBasedFileHelper(artifactType);
        Path baseRepoSuffix = artifactGitFileUtils.getRepoSuffixPath(workspaceId, defaultArtifactId, repoName);

        Mono<JSONObject> jsonObjectMono = fileUtils
                .reconstructPageFromGitRepo(pageDTO.getName(), branchName, baseRepoSuffix, isResetToLastCommitRequired)
                .onErrorResume(error -> Mono.error(
                        new AppsmithException(AppsmithError.GIT_ACTION_FAILED, RECONSTRUCT_PAGE, error.getMessage())))
                .map(pageJson -> {
                    return fileOperations.getMainContainer(pageJson);
                });

        return Mono.create(sink -> jsonObjectMono.subscribe(sink::success, sink::error, null, sink.currentContext()));
    }

    private Integer getServerSchemaVersion(JsonObject metadataJsonObject) {
        if (metadataJsonObject == null) {
            return jsonSchemaVersions.getServerVersion();
        }

        JsonElement serverSchemaVersion = metadataJsonObject.get(SERVER_SCHEMA_VERSION);
        return serverSchemaVersion.getAsInt();
    }

    private Integer getClientSchemaVersion(JsonObject metadataJsonObject) {
        if (metadataJsonObject == null) {
            return JsonSchemaVersions.clientVersion;
        }

        JsonElement clientSchemaVersion = metadataJsonObject.get(CommonConstants.CLIENT_SCHEMA_VERSION);
        return clientSchemaVersion.getAsInt();
    }

    private Integer getFileFormatVersion(JsonObject metadataJsonObject) {
        if (metadataJsonObject == null) {
            return 1;
        }

        JsonElement fileFormatVersion = metadataJsonObject.get(CommonConstants.FILE_FORMAT_VERSION);
        return fileFormatVersion.getAsInt();
    }
}
