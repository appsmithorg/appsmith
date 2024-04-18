package com.appsmith.server.helpers.ce;

import com.appsmith.external.constants.AnalyticsEvents;
import com.appsmith.external.git.FileInterface;
import com.appsmith.external.helpers.Stopwatch;
import com.appsmith.external.models.ApplicationGitReference;
import com.appsmith.external.models.ArtifactGitReference;
import com.appsmith.external.models.BaseDomain;
import com.appsmith.external.models.DatasourceStorage;
import com.appsmith.git.constants.CommonConstants;
import com.appsmith.git.files.FileUtilsImpl;
import com.appsmith.server.constants.ArtifactType;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.dtos.ApplicationJson;
import com.appsmith.server.dtos.ArtifactExchangeJson;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.helpers.ArtifactGitFileUtils;
import com.appsmith.server.migrations.JsonSchemaVersions;
import com.appsmith.server.services.AnalyticsService;
import com.appsmith.server.services.SessionUserService;
import com.google.gson.Gson;
import com.google.gson.JsonElement;
import com.google.gson.JsonObject;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.eclipse.jgit.api.errors.GitAPIException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Import;
import org.springframework.stereotype.Component;
import reactor.core.Exceptions;
import reactor.core.publisher.Mono;

import java.io.IOException;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.HashMap;
import java.util.Map;

import static com.appsmith.git.constants.CommonConstants.CLIENT_SCHEMA_VERSION;
import static com.appsmith.git.constants.CommonConstants.FILE_FORMAT_VERSION;
import static com.appsmith.git.constants.CommonConstants.SERVER_SCHEMA_VERSION;

@Slf4j
@RequiredArgsConstructor
@Component
@Import({FileUtilsImpl.class})
public class CommonGitFileUtilsCE {

    protected final ArtifactGitFileUtils<ApplicationGitReference> applicationGitFileUtils;
    private final FileInterface fileUtils;
    private final AnalyticsService analyticsService;
    private final SessionUserService sessionUserService;
    private final Gson gson;

    // Number of seconds after lock file is stale
    @Value("${appsmith.index.lock.file.time}")
    public final int INDEX_LOCK_FILE_STALE_TIME = 300;

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
            return fileUtils.saveApplicationToGitRepo(baseRepoSuffix, artifactGitReference, branchName);
        } catch (IOException | GitAPIException e) {
            log.error("Error occurred while saving files to local git repo: ", e);
            throw Exceptions.propagate(e);
        }
    }

    public Mono<Path> saveArtifactToLocalRepoWithAnalytics(
            Path baseRepoSuffix, ArtifactExchangeJson artifactExchangeJson, String branchName)
            throws IOException, GitAPIException {

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
            String defaultArtifactId,
            String repoName,
            ApplicationJson applicationJson,
            String branchName)
            throws GitAPIException, IOException {

        // TODO: Paths are to populated by artifact specific services
        Path baseRepoSuffix = Paths.get(workspaceId, defaultArtifactId, repoName);
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
     * @param defaultArtifactId Root application for the current branched application
     * @param branchName        for which branch the application needs to rehydrate
     * @param artifactType
     * @return application reference from which entire application can be rehydrated
     */
    public Mono<ArtifactExchangeJson> reconstructArtifactExchangeJsonFromGitRepoWithAnalytics(
            String workspaceId,
            String defaultArtifactId,
            String repoName,
            String branchName,
            ArtifactType artifactType) {

        Stopwatch stopwatch = new Stopwatch(AnalyticsEvents.GIT_DESERIALIZE_APP_RESOURCES_FROM_FILE.getEventName());
        ArtifactGitFileUtils<?> artifactGitFileUtils = getArtifactBasedFileHelper(artifactType);
        Map<String, String> constantsMap = artifactGitFileUtils.getConstantsMap();
        return Mono.zip(
                        reconstructArtifactExchangeJsonFromGitRepo(
                                workspaceId, defaultArtifactId, repoName, branchName, artifactType),
                        sessionUserService.getCurrentUser())
                .flatMap(tuple -> {
                    stopwatch.stopTimer();
                    final Map<String, Object> data = Map.of(
                            constantsMap.get(FieldName.ID),
                            defaultArtifactId,
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
            String workspaceId,
            String defaultApplicationId,
            String repoName,
            String branchName,
            ArtifactType artifactType) {

        ArtifactGitFileUtils<?> artifactGitFileUtils = getArtifactBasedFileHelper(artifactType);
        return artifactGitFileUtils.reconstructArtifactExchangeJsonFromFilesInRepository(
                workspaceId, defaultApplicationId, repoName, branchName);
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
            String workspaceId, String applicationId, String repoName, String branchName, Path baseRepoSuffix) {
        return fileUtils
                .reconstructMetadataFromGitRepo(workspaceId, applicationId, repoName, branchName, baseRepoSuffix)
                .onErrorResume(error -> Mono.error(
                        new AppsmithException(AppsmithError.GIT_ACTION_FAILED, "checkout", error.getMessage())))
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

    private Integer getServerSchemaVersion(JsonObject metadataJsonObject) {
        if (metadataJsonObject == null) {
            return JsonSchemaVersions.serverVersion;
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
