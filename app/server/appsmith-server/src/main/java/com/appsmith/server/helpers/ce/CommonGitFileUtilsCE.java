package com.appsmith.server.helpers.ce;

import com.appsmith.external.constants.AnalyticsEvents;
import com.appsmith.external.git.FileInterface;
import com.appsmith.external.git.models.GitResourceIdentity;
import com.appsmith.external.git.models.GitResourceMap;
import com.appsmith.external.git.models.GitResourceType;
import com.appsmith.external.git.operations.FileOperations;
import com.appsmith.external.helpers.Stopwatch;
import com.appsmith.external.models.ActionConfiguration;
import com.appsmith.external.models.ActionDTO;
import com.appsmith.external.models.ArtifactGitReference;
import com.appsmith.external.models.BaseDomain;
import com.appsmith.external.models.CreatorContextType;
import com.appsmith.external.models.DatasourceStorage;
import com.appsmith.external.models.PluginType;
import com.appsmith.git.constants.CommonConstants;
import com.appsmith.git.files.FileUtilsImpl;
import com.appsmith.server.actioncollections.base.ActionCollectionService;
import com.appsmith.server.constants.ArtifactType;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.domains.ActionCollection;
import com.appsmith.server.domains.CustomJSLib;
import com.appsmith.server.domains.GitArtifactMetadata;
import com.appsmith.server.domains.NewAction;
import com.appsmith.server.domains.Theme;
import com.appsmith.server.dtos.ActionCollectionDTO;
import com.appsmith.server.dtos.ApplicationJson;
import com.appsmith.server.dtos.ArtifactExchangeJson;
import com.appsmith.server.dtos.PageDTO;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.git.dtos.ArtifactJsonTransformationDTO;
import com.appsmith.server.helpers.ArtifactGitFileUtils;
import com.appsmith.server.migrations.JsonSchemaVersions;
import com.appsmith.server.newactions.base.NewActionService;
import com.appsmith.server.services.AnalyticsService;
import com.appsmith.server.services.SessionUserService;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.MapperFeature;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.google.gson.Gson;
import com.google.gson.JsonElement;
import com.google.gson.JsonObject;
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
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collector;
import java.util.stream.Collectors;

import static com.appsmith.external.git.constants.ce.GitConstantsCE.GitCommandConstantsCE.CHECKOUT_BRANCH;
import static com.appsmith.external.git.constants.ce.GitConstantsCE.RECONSTRUCT_PAGE;
import static com.appsmith.git.constants.CommonConstants.CLIENT_SCHEMA_VERSION;
import static com.appsmith.git.constants.CommonConstants.DELIMITER_PATH;
import static com.appsmith.git.constants.CommonConstants.FILE_FORMAT_VERSION;
import static com.appsmith.git.constants.CommonConstants.JSON_EXTENSION;
import static com.appsmith.git.constants.CommonConstants.JS_EXTENSION;
import static com.appsmith.git.constants.CommonConstants.METADATA;
import static com.appsmith.git.constants.CommonConstants.SERVER_SCHEMA_VERSION;
import static com.appsmith.git.constants.CommonConstants.TEXT_FILE_EXTENSION;
import static com.appsmith.git.constants.CommonConstants.THEME;
import static com.appsmith.git.constants.ce.GitDirectoriesCE.ACTION_COLLECTION_DIRECTORY;
import static com.appsmith.git.constants.ce.GitDirectoriesCE.ACTION_DIRECTORY;
import static com.appsmith.git.constants.ce.GitDirectoriesCE.DATASOURCE_DIRECTORY;
import static com.appsmith.git.constants.ce.GitDirectoriesCE.JS_LIB_DIRECTORY;
import static com.appsmith.git.constants.ce.GitDirectoriesCE.PAGE_DIRECTORY;
import static com.appsmith.git.files.FileUtilsCEImpl.getJsLibFileName;
import static org.springframework.util.StringUtils.hasText;

@Slf4j
@Component
@Import({FileUtilsImpl.class})
public class CommonGitFileUtilsCE {

    protected final ArtifactGitFileUtils<ApplicationJson> applicationGitFileUtils;
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
    protected final ObjectMapper objectMapper;

    public CommonGitFileUtilsCE(
            ArtifactGitFileUtils<ApplicationJson> applicationGitFileUtils,
            FileInterface fileUtils,
            FileOperations fileOperations,
            AnalyticsService analyticsService,
            SessionUserService sessionUserService,
            NewActionService newActionService,
            ActionCollectionService actionCollectionService,
            JsonSchemaVersions jsonSchemaVersions,
            ObjectMapper objectMapper) {
        this.applicationGitFileUtils = applicationGitFileUtils;
        this.fileUtils = fileUtils;
        this.fileOperations = fileOperations;
        this.analyticsService = analyticsService;
        this.sessionUserService = sessionUserService;
        this.newActionService = newActionService;
        this.actionCollectionService = actionCollectionService;
        this.jsonSchemaVersions = jsonSchemaVersions;
        this.objectMapper = objectMapper.copy().disable(MapperFeature.USE_ANNOTATIONS);
    }

    protected ArtifactGitFileUtils<?> getArtifactBasedFileHelper(ArtifactType artifactType) {
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

    public Mono<Path> saveArtifactToLocalRepoNew(
            Path baseRepoSuffix, ArtifactExchangeJson artifactExchangeJson, String branchName) {

        // this should come from the specific files
        GitResourceMap gitResourceMap = createGitResourceMap(artifactExchangeJson);

        // Save application to git repo
        try {
            return fileUtils
                    .saveArtifactToGitRepo(baseRepoSuffix, gitResourceMap, branchName)
                    .subscribeOn(Schedulers.boundedElastic());
        } catch (IOException | GitAPIException exception) {
            return Mono.error(exception);
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
        List<DatasourceStorage> datasourceList = artifactExchangeJson.getDatasourceList();
        if (datasourceList != null) {
            datasourceList.forEach(datasource -> {
                removeUnwantedFieldsFromDatasource(datasource);
                final String filePath = DATASOURCE_DIRECTORY + DELIMITER_PATH + datasource.getName() + JSON_EXTENSION;
                GitResourceIdentity identity =
                        new GitResourceIdentity(GitResourceType.DATASOURCE_CONFIG, datasource.getGitSyncId(), filePath);
                resourceMap.put(identity, datasource);
            });
        }

        // themes
        Theme theme = artifactExchangeJson.getUnpublishedTheme();
        // Only proceed if the current artifact supports themes
        if (theme != null) {
            // Reset published mode theme since it is not required
            artifactExchangeJson.setThemes(theme, null);
            // Remove internal fields from the themes
            removeUnwantedFieldsFromBaseDomain(theme);
            final String filePath = THEME + JSON_EXTENSION;
            GitResourceIdentity identity = new GitResourceIdentity(GitResourceType.ROOT_CONFIG, filePath, filePath);
            resourceMap.put(identity, theme);
        }

        // custom js libs
        List<CustomJSLib> customJSLibList = artifactExchangeJson.getCustomJSLibList();
        if (customJSLibList != null) {
            customJSLibList.forEach(jsLib -> {
                removeUnwantedFieldsFromBaseDomain(jsLib);
                String jsLibFileName = getJsLibFileName(jsLib.getUidString());
                final String filePath = JS_LIB_DIRECTORY + DELIMITER_PATH + jsLibFileName + JSON_EXTENSION;
                GitResourceIdentity identity =
                        new GitResourceIdentity(GitResourceType.JSLIB_CONFIG, jsLibFileName, filePath);
                resourceMap.put(identity, jsLib);
            });
        }

        // actions
        setNewActionsInResourceMap(artifactExchangeJson, resourceMap);

        // action collections
        setActionCollectionsInResourceMap(artifactExchangeJson, resourceMap);
    }

    protected String getContextDirectoryByType(CreatorContextType contextType) {
        return PAGE_DIRECTORY;
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
                    ActionDTO action = newAction.getUnpublishedAction();
                    final String actionFileName = action.getValidName().replace(".", "-");
                    final String filePathPrefix = getContextDirectoryByType(action.getContextType())
                            + DELIMITER_PATH
                            + action.calculateContextId()
                            + DELIMITER_PATH
                            + ACTION_DIRECTORY
                            + DELIMITER_PATH
                            + actionFileName
                            + DELIMITER_PATH;
                    String body = action.getActionConfiguration() != null
                                    && action.getActionConfiguration().getBody() != null
                            ? action.getActionConfiguration().getBody()
                            : null;

                    // This is a special case where we are handling REMOTE type plugins based actions such as Twilio
                    // The user configured values are stored in an attribute called formData which is a map unlike the
                    // body
                    if (PluginType.REMOTE.equals(newAction.getPluginType())
                            && action.getActionConfiguration() != null
                            && action.getActionConfiguration().getFormData() != null) {
                        body = new Gson().toJson(action.getActionConfiguration().getFormData(), Map.class);
                        action.getActionConfiguration().setFormData(null);
                    }
                    // This is a special case where we are handling JS actions as we don't want to commit the body of JS
                    // actions
                    if (PluginType.JS.equals(newAction.getPluginType())) {
                        if (action.getActionConfiguration() != null) {
                            action.getActionConfiguration().setBody(null);
                            action.setJsonPathKeys(null);
                        }
                    } else if (body != null) {
                        // For the regular actions we save the body field to git repo
                        final String filePath = filePathPrefix + actionFileName + TEXT_FILE_EXTENSION;
                        GitResourceIdentity actionDataIdentity =
                                new GitResourceIdentity(GitResourceType.QUERY_DATA, newAction.getGitSyncId(), filePath);
                        resourceMap.put(actionDataIdentity, body);
                    }
                    final String filePath = filePathPrefix + METADATA + JSON_EXTENSION;
                    GitResourceIdentity actionConfigIdentity =
                            new GitResourceIdentity(GitResourceType.QUERY_CONFIG, newAction.getGitSyncId(), filePath);
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
                    ActionCollectionDTO collection = actionCollection.getUnpublishedCollection();
                    final String filePathPrefix = getContextDirectoryByType(collection.getContextType())
                            + DELIMITER_PATH
                            + collection.calculateContextId()
                            + DELIMITER_PATH
                            + ACTION_COLLECTION_DIRECTORY
                            + DELIMITER_PATH
                            + collection.getName()
                            + DELIMITER_PATH;
                    String body = collection.getBody();
                    collection.setBody(null);

                    String configFilePath = filePathPrefix + METADATA + JSON_EXTENSION;
                    GitResourceIdentity collectionConfigIdentity = new GitResourceIdentity(
                            GitResourceType.JSOBJECT_CONFIG, actionCollection.getGitSyncId(), configFilePath);
                    resourceMap.put(collectionConfigIdentity, actionCollection);

                    if (body != null) {
                        String dataFilePath = filePathPrefix + collection.getName() + JS_EXTENSION;
                        GitResourceIdentity collectionDataIdentity = new GitResourceIdentity(
                                GitResourceType.JSOBJECT_DATA, actionCollection.getGitSyncId(), dataFilePath);
                        resourceMap.put(collectionDataIdentity, body);
                    }
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

    public ArtifactExchangeJson createArtifactExchangeJson(GitResourceMap gitResourceMap, ArtifactType artifactType) {
        ArtifactGitFileUtils<?> artifactGitFileUtils = getArtifactBasedFileHelper(artifactType);

        ArtifactExchangeJson artifactExchangeJson = artifactGitFileUtils.createArtifactExchangeJsonObject();

        artifactGitFileUtils.setArtifactDependentPropertiesInJson(gitResourceMap, artifactExchangeJson);

        setArtifactIndependentPropertiesInJson(gitResourceMap, artifactExchangeJson);

        return artifactExchangeJson;
    }

    protected void setArtifactIndependentPropertiesInJson(
            GitResourceMap gitResourceMap, ArtifactExchangeJson artifactExchangeJson) {
        Map<GitResourceIdentity, Object> resourceMap = gitResourceMap.getGitResourceMap();

        // datasources
        List<DatasourceStorage> datasourceList = resourceMap.entrySet().stream()
                .filter(entry -> {
                    GitResourceIdentity key = entry.getKey();
                    return GitResourceType.DATASOURCE_CONFIG.equals(key.getResourceType());
                })
                .map(Map.Entry::getValue)
                .map(value -> objectMapper.convertValue(value, DatasourceStorage.class))
                .collect(Collectors.toList());
        artifactExchangeJson.setDatasourceList(datasourceList);

        // themes
        final String themeFilePath = THEME + JSON_EXTENSION;
        GitResourceIdentity themeIdentity =
                new GitResourceIdentity(GitResourceType.ROOT_CONFIG, themeFilePath, themeFilePath);
        Object themeObject = resourceMap.get(themeIdentity);
        Theme theme = objectMapper.convertValue(themeObject, Theme.class);
        artifactExchangeJson.setThemes(theme, null);

        // custom js libs
        List<CustomJSLib> jsLibList = resourceMap.entrySet().stream()
                .filter(entry -> {
                    GitResourceIdentity key = entry.getKey();
                    return GitResourceType.JSLIB_CONFIG.equals(key.getResourceType());
                })
                .map(Map.Entry::getValue)
                .map(value -> objectMapper.convertValue(value, CustomJSLib.class))
                .collect(Collectors.toList());
        artifactExchangeJson.setCustomJSLibList(jsLibList);

        // actions
        final Set<GitResourceType> queryTypes = Set.of(GitResourceType.QUERY_CONFIG, GitResourceType.QUERY_DATA);
        List<NewAction> actionList = resourceMap.entrySet().stream()
                .filter(entry -> {
                    GitResourceIdentity key = entry.getKey();
                    return queryTypes.contains(key.getResourceType());
                })
                .collect(collectByGitSyncId())
                .entrySet()
                .parallelStream()
                .map(entry -> {
                    Object config = entry.getValue().get(GitResourceType.QUERY_CONFIG);
                    NewAction newAction = objectMapper.convertValue(config, NewAction.class);
                    ActionDTO actionDTO = newAction.getUnpublishedAction();
                    Object data = entry.getValue().get(GitResourceType.QUERY_DATA);
                    ActionConfiguration actionConfiguration = actionDTO.getActionConfiguration();
                    if (actionConfiguration == null) {
                        // This shouldn't happen but safe-guarding just in case
                        actionConfiguration = new ActionConfiguration();
                    }

                    if (PluginType.REMOTE.equals(newAction.getPluginType())) {
                        Map<String, Object> formData = objectMapper.convertValue(data, new TypeReference<>() {});
                        actionConfiguration.setFormData(formData);
                    } else if (data != null) {
                        String body = String.valueOf(data);
                        actionConfiguration.setBody(body);
                    }

                    return newAction;
                })
                .collect(Collectors.toList());
        artifactExchangeJson.setActionList(actionList);

        // action collections
        final Set<GitResourceType> jsObjectTypes =
                Set.of(GitResourceType.JSOBJECT_CONFIG, GitResourceType.JSOBJECT_DATA);
        List<ActionCollection> collectionList = resourceMap.entrySet().stream()
                .filter(entry -> {
                    GitResourceIdentity key = entry.getKey();
                    return jsObjectTypes.contains(key.getResourceType());
                })
                .collect(collectByGitSyncId())
                .entrySet()
                .parallelStream()
                .map(entry -> {
                    Object config = entry.getValue().get(GitResourceType.JSOBJECT_CONFIG);
                    ActionCollection actionCollection = objectMapper.convertValue(config, ActionCollection.class);
                    Object data = entry.getValue().get(GitResourceType.JSOBJECT_DATA);
                    String body = String.valueOf(data);
                    actionCollection.getUnpublishedCollection().setBody(body);

                    return actionCollection;
                })
                .collect(Collectors.toList());
        artifactExchangeJson.setActionCollectionList(collectionList);
    }

    private Collector<Map.Entry<GitResourceIdentity, Object>, ?, Map<String, HashMap<GitResourceType, Object>>>
            collectByGitSyncId() {
        return Collectors.toMap(
                entry -> entry.getKey().getResourceIdentifier(),
                entry -> {
                    HashMap<GitResourceType, Object> map = new HashMap<>();
                    map.put(entry.getKey().getResourceType(), entry.getValue());
                    return map;
                },
                (x, y) -> {
                    x.putAll(y);
                    return x;
                });
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

    public Mono<? extends ArtifactExchangeJson> constructArtifactExchangeJsonFromGitRepositoryWithAnalytics(
            ArtifactJsonTransformationDTO jsonTransformationDTO) {
        if (!isJsonTransformationDTOValid(jsonTransformationDTO)) {
            return Mono.error(new AppsmithException(
                    AppsmithError.INVALID_GIT_CONFIGURATION, "ArtifactJSONTransformationDTO is invalid"));
        }

        String workspaceId = jsonTransformationDTO.getWorkspaceId();
        String baseArtifactId = jsonTransformationDTO.getBaseArtifactId();

        ArtifactGitFileUtils<?> artifactGitFileUtils =
                getArtifactBasedFileHelper(jsonTransformationDTO.getArtifactType());
        Map<String, String> constantsMap = artifactGitFileUtils.getConstantsMap();

        return Mono.zip(
                        constructArtifactExchangeJsonFromGitRepository(jsonTransformationDTO),
                        sessionUserService.getCurrentUser())
                .flatMap(tuple -> {
                    final Map<String, Object> data = Map.of(
                            constantsMap.get(FieldName.ID),
                            baseArtifactId,
                            FieldName.WORKSPACE_ID,
                            workspaceId,
                            FieldName.FLOW_NAME,
                            AnalyticsEvents.GIT_DESERIALIZE_APP_RESOURCES_FROM_FILE.getEventName());

                    return analyticsService
                            .sendEvent(
                                    AnalyticsEvents.UNIT_EXECUTION_TIME.getEventName(),
                                    tuple.getT2().getUsername(),
                                    data)
                            .thenReturn(tuple.getT1());
                });
    }

    /**
     * Method to reconstruct the application from the local git repo
     * @param jsonTransformationDTO : DTO which carries the parameter for transformation
     * @return an instance of an object which extends artifact exchange json.
     * i.e. Application Json, Package Json
     */
    public Mono<? extends ArtifactExchangeJson> constructArtifactExchangeJsonFromGitRepository(
            ArtifactJsonTransformationDTO jsonTransformationDTO) {
        ArtifactType artifactType = jsonTransformationDTO.getArtifactType();
        ArtifactGitFileUtils<?> artifactGitFileUtils = getArtifactBasedFileHelper(artifactType);

        // Type is not required as checkout happens in similar fashion
        String refName = jsonTransformationDTO.getRefName();
        String workspaceId = jsonTransformationDTO.getWorkspaceId();
        String baseArtifactId = jsonTransformationDTO.getBaseArtifactId();
        String repoName = jsonTransformationDTO.getRepoName();
        Path repoSuffixPath = artifactGitFileUtils.getRepoSuffixPath(workspaceId, baseArtifactId, repoName);

        Mono<GitResourceMap> gitResourceMapMono = fileUtils.constructGitResourceMapFromGitRepo(repoSuffixPath, refName);

        return gitResourceMapMono.flatMap(gitResourceMap -> {
            ArtifactExchangeJson artifactExchangeJson = createArtifactExchangeJson(gitResourceMap, artifactType);
            copyMetadataToArtifactExchangeJson(gitResourceMap, artifactExchangeJson);
            return artifactGitFileUtils.performJsonMigration(jsonTransformationDTO, artifactExchangeJson);
        });
    }

    /**
     * This method copies the metadata from git resource map to artifactExchangeJson
     * @param gitResourceMap : git resource map generated from file system
     * @param artifactExchangeJson : artifact json constructed from git resource map
     */
    protected void copyMetadataToArtifactExchangeJson(
            GitResourceMap gitResourceMap, ArtifactExchangeJson artifactExchangeJson) {
        final String metadataFilePath = CommonConstants.METADATA + JSON_EXTENSION;
        GitResourceIdentity metadataIdentity =
                new GitResourceIdentity(GitResourceType.ROOT_CONFIG, metadataFilePath, metadataFilePath);
        Object metadata = gitResourceMap.getGitResourceMap().get(metadataIdentity);

        Gson gson = new Gson();
        JsonObject metadataJsonObject = gson.toJsonTree(metadata, Object.class).getAsJsonObject();

        Integer serverSchemaVersion = getServerSchemaVersion(metadataJsonObject);
        Integer clientSchemaVersion = getClientSchemaVersion(metadataJsonObject);

        artifactExchangeJson.setServerSchemaVersion(serverSchemaVersion);
        artifactExchangeJson.setClientSchemaVersion(clientSchemaVersion);
    }

    public boolean isJsonTransformationDTOValid(ArtifactJsonTransformationDTO jsonTransformationDTO) {
        return jsonTransformationDTO.getArtifactType() != null
                && hasText(jsonTransformationDTO.getWorkspaceId())
                && hasText(jsonTransformationDTO.getBaseArtifactId())
                && hasText(jsonTransformationDTO.getRefName());
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
        String refName = gitArtifactMetadata.getRefName();
        String repoName = gitArtifactMetadata.getRepoName();

        if (!hasText(workspaceId)) {
            return Mono.error(new AppsmithException(AppsmithError.INVALID_PARAMETER, FieldName.WORKSPACE_ID));
        }

        if (!hasText(defaultArtifactId)) {
            return Mono.error(new AppsmithException(AppsmithError.INVALID_PARAMETER, FieldName.ARTIFACT_ID));
        }

        if (!hasText(refName)) {
            return Mono.error(new AppsmithException(AppsmithError.INVALID_PARAMETER, FieldName.BRANCH_NAME));
        }

        if (!hasText(repoName)) {
            return Mono.error(new AppsmithException(AppsmithError.INVALID_PARAMETER, FieldName.REPO_NAME));
        }

        Mono<Integer> serverSchemaNumberMono = reconstructMetadataFromRepo(
                        workspaceId, defaultArtifactId, repoName, refName, isResetToLastCommitRequired, artifactType)
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
        String refName = gitArtifactMetadata.getRefName();
        String repoName = gitArtifactMetadata.getRepoName();

        if (!hasText(workspaceId)) {
            return Mono.error(new AppsmithException(AppsmithError.INVALID_PARAMETER, FieldName.WORKSPACE_ID));
        }

        if (!hasText(defaultArtifactId)) {
            return Mono.error(new AppsmithException(AppsmithError.INVALID_PARAMETER, FieldName.ARTIFACT_ID));
        }

        if (!hasText(refName)) {
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
                .reconstructPageFromGitRepo(pageDTO.getName(), refName, baseRepoSuffix, isResetToLastCommitRequired)
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
