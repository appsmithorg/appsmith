package com.appsmith.git.files;

import com.appsmith.external.dtos.ModifiedResources;
import com.appsmith.external.exceptions.pluginExceptions.AppsmithPluginError;
import com.appsmith.external.exceptions.pluginExceptions.AppsmithPluginException;
import com.appsmith.external.git.FileInterface;
import com.appsmith.external.git.GitExecutor;
import com.appsmith.external.git.constants.GitSpan;
import com.appsmith.external.git.handler.FSGitHandler;
import com.appsmith.external.git.models.GitResourceIdentity;
import com.appsmith.external.git.models.GitResourceMap;
import com.appsmith.external.git.models.GitResourceType;
import com.appsmith.external.git.operations.FileOperations;
import com.appsmith.external.helpers.ObservationHelper;
import com.appsmith.external.helpers.Stopwatch;
import com.appsmith.external.models.ApplicationGitReference;
import com.appsmith.external.models.ArtifactGitReference;
import com.appsmith.git.configurations.GitServiceConfig;
import com.appsmith.git.constants.CommonConstants;
import com.appsmith.git.helpers.DSLTransformerHelper;
import com.fasterxml.jackson.databind.ObjectMapper;
import io.micrometer.tracing.Span;
import lombok.Getter;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.io.FileUtils;
import org.apache.commons.io.FilenameUtils;
import org.apache.commons.io.IOUtils;
import org.eclipse.jgit.api.errors.GitAPIException;
import org.json.JSONObject;
import org.springframework.context.annotation.Import;
import org.springframework.stereotype.Component;
import org.springframework.util.FileSystemUtils;
import org.springframework.util.StringUtils;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Scheduler;
import reactor.core.scheduler.Schedulers;
import reactor.util.function.Tuple2;
import reactor.util.function.Tuples;

import java.io.BufferedWriter;
import java.io.File;
import java.io.IOException;
import java.io.InputStream;
import java.io.StringWriter;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.Base64;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;
import java.util.stream.Stream;

import static com.appsmith.external.git.constants.GitConstants.ACTION_COLLECTION_LIST;
import static com.appsmith.external.git.constants.GitConstants.ACTION_LIST;
import static com.appsmith.external.git.constants.GitConstants.CUSTOM_JS_LIB_LIST;
import static com.appsmith.external.git.constants.GitConstants.GitMetricConstants.ACTION_COLLECTION_BODY;
import static com.appsmith.external.git.constants.GitConstants.GitMetricConstants.NEW_ACTION_BODY;
import static com.appsmith.external.git.constants.GitConstants.GitMetricConstants.RESOURCE_TYPE;
import static com.appsmith.external.git.constants.GitConstants.NAME_SEPARATOR;
import static com.appsmith.external.git.constants.GitConstants.PAGE_LIST;
import static com.appsmith.external.git.constants.GitConstants.README_FILE_NAME;
import static com.appsmith.git.constants.CommonConstants.JSON_EXTENSION;
import static com.appsmith.git.constants.GitDirectories.ACTION_COLLECTION_DIRECTORY;
import static com.appsmith.git.constants.GitDirectories.ACTION_DIRECTORY;
import static com.appsmith.git.constants.GitDirectories.DATASOURCE_DIRECTORY;
import static com.appsmith.git.constants.GitDirectories.JS_LIB_DIRECTORY;
import static com.appsmith.git.constants.GitDirectories.PAGE_DIRECTORY;
import static com.appsmith.git.constants.ce.CommonConstantsCE.DELIMITER_PATH;

@Slf4j
@Getter
@Component
@Import({GitServiceConfig.class})
public class FileUtilsCEImpl implements FileInterface {

    private final GitServiceConfig gitServiceConfig;
    protected final FSGitHandler fsGitHandler;
    private final GitExecutor gitExecutor;
    protected final FileOperations fileOperations;
    private final ObservationHelper observationHelper;
    protected final ObjectMapper objectMapper;

    private static final String EDIT_MODE_URL_TEMPLATE = "{{editModeUrl}}";

    private static final String VIEW_MODE_URL_TEMPLATE = "{{viewModeUrl}}";

    private static final Pattern ALLOWED_FILE_EXTENSION_PATTERN =
            Pattern.compile("(.*?)\\.(md|MD|git|gitignore|github|yml|yaml)$");

    private final Scheduler scheduler = Schedulers.boundedElastic();

    private static final String CANVAS_WIDGET = "(Canvas)[0-9]*.";

    public FileUtilsCEImpl(
            GitServiceConfig gitServiceConfig,
            FSGitHandler fsGitHandler,
            GitExecutor gitExecutor,
            FileOperations fileOperations,
            ObservationHelper observationHelper,
            ObjectMapper objectMapper) {
        this.gitServiceConfig = gitServiceConfig;
        this.fsGitHandler = fsGitHandler;
        this.gitExecutor = gitExecutor;
        this.fileOperations = fileOperations;
        this.observationHelper = observationHelper;
        this.objectMapper = objectMapper;
    }

    protected Map<GitResourceType, GitResourceType> getModifiedResourcesTypes() {
        return Map.of(
                GitResourceType.JSLIB_CONFIG, GitResourceType.JSLIB_CONFIG,
                GitResourceType.CONTEXT_CONFIG, GitResourceType.CONTEXT_CONFIG,
                GitResourceType.QUERY_CONFIG, GitResourceType.QUERY_CONFIG,
                GitResourceType.QUERY_DATA, GitResourceType.QUERY_CONFIG,
                GitResourceType.JSOBJECT_CONFIG, GitResourceType.JSOBJECT_CONFIG,
                GitResourceType.JSOBJECT_DATA, GitResourceType.JSOBJECT_CONFIG);
    }

    /**
     * Application will be stored in the following structure:
     *
     * For v1:
     * repo_name
     * application.json
     * metadata.json
     * datasource
     * datasource1Name.json
     * datasource2Name.json
     * queries (Only requirement here is the filename should be unique)
     * action1_page1
     * action2_page2
     * jsobjects (Only requirement here is the filename should be unique)
     * jsobject1_page1
     * jsobject2_page2
     * pages
     * page1
     * page2
     *
     * For v2:
     * repo_name
     * application.json
     * metadata.json
     * theme
     * publishedTheme.json
     * editModeTheme.json
     * pages
     * page1
     * canvas.json
     * queries
     * Query1.json
     * Query2.json
     * jsobjects
     * JSObject1.json
     * page2
     * page3
     * datasources
     * datasource1.json
     * datasource2.json
     *
     * For v3:
     * repo_name
     * application.json
     * metadata.json
     * theme
     * publishedTheme.json
     * editModeTheme.json
     * pages
     * page1
     * canvas.json
     * queries
     * Query1.json
     * jsobjects
     * JSObject1
     * JSObject1.js
     * Metadata.json
     * page2
     * page3
     * datasources
     * datasource1.json
     * datasource2.json
     *
     * For v4:
     * repo_name
     * application.json
     * metadata.json
     * theme
     * publishedTheme.json
     * editModeTheme.json
     * pages
     * page1
     * canvas.json
     * queries
     * Query1.json
     * jsobjects
     * JSObject1
     * JSObject1.js
     * Metadata.json
     * page2
     * page3
     * datasources
     * datasource1.json
     * datasource2.json
     */

    /**
     * This method will save the complete application in the local repo directory.
     * Path to repo will be : ./container-volumes/git-repo/workspaceId/defaultApplicationId/repoName/{application_data}
     *
     * @param baseRepoSuffix       path suffix used to create a repo path
     * @param artifactGitReference application reference object from which entire application can be rehydrated
     * @param branchName           name of the branch for the current application
     * @return repo path where the application is stored
     */
    public Mono<Path> saveApplicationToGitRepo(
            Path baseRepoSuffix, ArtifactGitReference artifactGitReference, String branchName)
            throws GitAPIException, IOException {

        ApplicationGitReference applicationGitReference = (ApplicationGitReference) artifactGitReference;

        // Repo path will be:
        // baseRepo : root/workspaceId/defaultAppId/repoName/{applicationData}
        // Checkout to mentioned branch if not already checked-out
        Stopwatch processStopwatch = new Stopwatch("FS application save");
        return gitExecutor
                .resetToLastCommit(baseRepoSuffix, branchName)
                .flatMap(isSwitched -> {
                    Path baseRepo = Paths.get(gitServiceConfig.getGitRootPath()).resolve(baseRepoSuffix);

                    updateEntitiesInRepo(applicationGitReference, baseRepo);

                    processStopwatch.stopAndLogTimeInMillis();
                    return Mono.just(baseRepo);
                })
                .subscribeOn(scheduler);
    }

    @Override
    public Mono<Path> saveArtifactToGitRepo(
            Path baseRepoSuffix, GitResourceMap gitResourceMap, String branchName, boolean keepWorkingDirChanges)
            throws GitAPIException, IOException {

        // Repo path will be:
        // baseRepo : root/workspaceId/defaultAppId/repoName/{applicationData}
        // Checkout to mentioned branch if not already checked-out
        return fsGitHandler
                .resetToLastCommit(baseRepoSuffix, branchName, keepWorkingDirChanges)
                .flatMap(isSwitched -> {
                    Path baseRepo = Paths.get(gitServiceConfig.getGitRootPath()).resolve(baseRepoSuffix);

                    try {
                        updateEntitiesInRepo(gitResourceMap, baseRepo);
                    } catch (IOException e) {
                        return Mono.error(e);
                    }

                    return Mono.just(baseRepo);
                })
                .subscribeOn(scheduler);
    }

    protected Set<String> getWhitelistedPaths() {
        String pages = PAGE_DIRECTORY + DELIMITER_PATH;
        String datasources = DATASOURCE_DIRECTORY + DELIMITER_PATH;
        String themes = CommonConstants.THEME + JSON_EXTENSION;
        String application = CommonConstants.APPLICATION + JSON_EXTENSION;
        String metadata = CommonConstants.METADATA + JSON_EXTENSION;
        String customJsLibs = JS_LIB_DIRECTORY + DELIMITER_PATH;

        return new HashSet<>(Set.of(pages, datasources, themes, application, metadata, customJsLibs));
    }

    protected Boolean isWhiteListedPath(Set<String> whiteListedPaths, String relativePath) {

        // Not expecting the relative path to ever be empty.
        // .git is internal file this shouldn't be whitelisted
        if (!StringUtils.hasText(relativePath) || relativePath.contains(".git/")) {
            return Boolean.FALSE;
        }

        // cases where the path is a direct root config object
        if (whiteListedPaths.contains(relativePath)) {
            return Boolean.TRUE;
        }

        String[] tokens = relativePath.strip().split(DELIMITER_PATH);
        // it means that path is not a root config object and adheres to the given whitelisted path
        if (tokens.length > 1 && whiteListedPaths.contains(tokens[0] + DELIMITER_PATH)) {
            return Boolean.TRUE;
        }

        return Boolean.FALSE;
    }

    protected Set<String> getExistingFilesInRepo(Path baseRepo) throws IOException {
        Set<String> whiteListedPaths = getWhitelistedPaths();
        try (Stream<Path> stream = Files.walk(baseRepo).parallel()) {
            return stream.filter(path -> {
                        try {
                            return (Files.isRegularFile(path) || FileUtils.isEmptyDirectory(path.toFile()))
                                    && isWhiteListedPath(
                                            whiteListedPaths,
                                            baseRepo.relativize(path).toString());
                        } catch (IOException e) {
                            log.error("Unable to find file details. Please check the file at file path: {}", path);
                            log.error("Assuming that it does not exist for now ...");
                            return false;
                        }
                    })
                    .map(baseRepo::relativize)
                    .map(Path::toString)
                    .collect(Collectors.toSet());
        }
    }

    protected Set<String> updateEntitiesInRepo(GitResourceMap gitResourceMap, Path baseRepo) throws IOException {
        ModifiedResources modifiedResources = gitResourceMap.getModifiedResources();
        Map<GitResourceIdentity, Object> resourceMap = gitResourceMap.getGitResourceMap();

        Set<String> filesInRepo = getExistingFilesInRepo(baseRepo);

        Set<String> updatedFilesToBeSerialized = resourceMap.keySet().parallelStream()
                .map(gitResourceIdentity -> gitResourceIdentity.getFilePath())
                .collect(Collectors.toSet());

        // Remove all files that need to be serialized from the existing files list, as well as the README file
        // What we are left with are all the files to be deleted
        filesInRepo.removeAll(updatedFilesToBeSerialized);
        filesInRepo.remove(README_FILE_NAME);

        // Delete all the files because they are no longer needed
        // This covers both older structures of storing files and,
        // legitimate changes in the artifact that might cause deletions
        filesInRepo.stream().parallel().forEach(filePath -> {
            try {
                Files.deleteIfExists(baseRepo.resolve(filePath));
            } catch (IOException e) {
                // We ignore files that could not be deleted and expect to come back to this at a later point
                // Just log the path for now
                log.error("Unable to delete file at path: {}", filePath);
            }
        });

        // Now go through the resource map and based on resource type, check if the resource is modified before
        // serialization
        // Or simply choose the mechanism for serialization
        Map<GitResourceType, GitResourceType> modifiedResourcesTypes = getModifiedResourcesTypes();
        return resourceMap.entrySet().parallelStream()
                .map(entry -> {
                    GitResourceIdentity key = entry.getKey();
                    boolean resourceUpdated = true;
                    if (modifiedResourcesTypes.containsKey(key.getResourceType()) && modifiedResources != null) {
                        GitResourceType comparisonType = modifiedResourcesTypes.get(key.getResourceType());

                        resourceUpdated =
                                modifiedResources.isResourceUpdatedNew(comparisonType, key.getResourceIdentifier());
                    }

                    if (resourceUpdated) {
                        String filePath = key.getFilePath();
                        saveResourceCommon(entry.getValue(), baseRepo.resolve(filePath));

                        return filePath;
                    }
                    return null;
                })
                .filter(Objects::nonNull)
                .collect(Collectors.toSet());
    }

    protected Set<String> updateEntitiesInRepo(ApplicationGitReference applicationGitReference, Path baseRepo) {

        Set<String> validDatasourceFileNames = new HashSet<>();
        ModifiedResources modifiedResources = applicationGitReference.getModifiedResources();

        // Remove unwanted directories which was present in v1 of the git file format version
        fileOperations.deleteDirectory(baseRepo.resolve(ACTION_DIRECTORY));
        fileOperations.deleteDirectory(baseRepo.resolve(ACTION_COLLECTION_DIRECTORY));

        // Save application
        saveResource(
                applicationGitReference.getApplication(),
                baseRepo.resolve(CommonConstants.APPLICATION + JSON_EXTENSION));

        // Save application metadata
        fileOperations.saveMetadataResource(applicationGitReference, baseRepo);

        // Save application theme
        saveResource(applicationGitReference.getTheme(), baseRepo.resolve(CommonConstants.THEME + JSON_EXTENSION));

        // Save pages
        Path pageDirectory = baseRepo.resolve(PAGE_DIRECTORY);
        Set<Map.Entry<String, Object>> pageEntries =
                applicationGitReference.getPages().entrySet();

        Set<String> validPages = new HashSet<>();
        for (Map.Entry<String, Object> pageResource : pageEntries) {
            Map<String, String> validWidgetToParentMap = new ConcurrentHashMap<>();
            final String pageName = pageResource.getKey();
            Path pageSpecificDirectory = pageDirectory.resolve(pageName);
            boolean isResourceUpdated =
                    modifiedResources != null && modifiedResources.isResourceUpdated(PAGE_LIST, pageName);
            if (Boolean.TRUE.equals(isResourceUpdated)) {
                // Save page metadata
                saveResource(pageResource.getValue(), pageSpecificDirectory.resolve(pageName + JSON_EXTENSION));
                Map<String, JSONObject> result = DSLTransformerHelper.flatten(
                        new JSONObject(applicationGitReference.getPageDsl().get(pageName)));
                result.keySet().parallelStream().forEach(key -> {
                    JSONObject jsonObject = result.get(key);
                    String widgetName = key.substring(key.lastIndexOf(CommonConstants.DELIMITER_POINT) + 1);

                    String childPath = DSLTransformerHelper.getPathToWidgetFile(key, jsonObject, widgetName);

                    Path path = Paths.get(
                            String.valueOf(pageSpecificDirectory.resolve(CommonConstants.WIDGETS)), childPath);
                    validWidgetToParentMap.put(widgetName, path.toFile().toString());
                    fileOperations.saveWidgets(jsonObject, widgetName, path);
                });
                // Remove deleted widgets from the file system
                deleteWidgets(
                        pageSpecificDirectory.resolve(CommonConstants.WIDGETS).toFile(), validWidgetToParentMap);

                // Remove the canvas.json from the file system since the value is stored in the page.json
                fileOperations.deleteFile(pageSpecificDirectory.resolve(CommonConstants.CANVAS + JSON_EXTENSION));
            }
            validPages.add(pageName);
        }

        fileOperations.scanAndDeleteDirectoryForDeletedResources(validPages, baseRepo.resolve(PAGE_DIRECTORY));

        // Earlier this condition included that modified resource not be null, and
        // it should either have allModified flag turned as true or CUSTOM_JS_LIB_LIST resource map is not empty
        // Save JS Libs if there's at least one change.

        // What are the possible caveats of making this change?
        // Since each resource in the entry needs to be present in the Modified resource map to be written
        // There won't be any differences in writing files.
        // In terms of performance, we would need to access the customJSLib directory every time to
        // compare with the valid js libs.
        if (modifiedResources != null) {
            Path jsLibDirectory = baseRepo.resolve(JS_LIB_DIRECTORY);
            Set<Map.Entry<String, Object>> jsLibEntries =
                    applicationGitReference.getJsLibraries().entrySet();
            Set<String> validJsLibs = ConcurrentHashMap.newKeySet();
            jsLibEntries.parallelStream().forEach(jsLibEntry -> {
                String uidString = jsLibEntry.getKey();
                boolean isResourceUpdated = modifiedResources.isResourceUpdated(CUSTOM_JS_LIB_LIST, uidString);

                String fileNameWithExtension = getJsLibFileName(uidString) + JSON_EXTENSION;

                Path jsLibSpecificFile = jsLibDirectory.resolve(fileNameWithExtension);
                if (isResourceUpdated) {
                    saveResource(jsLibEntry.getValue(), jsLibSpecificFile);
                }
                validJsLibs.add(fileNameWithExtension);
            });
            fileOperations.scanAndDeleteFileForDeletedResources(validJsLibs, jsLibDirectory);
        }

        // Create HashMap for valid actions and actionCollections
        ConcurrentHashMap<String, Set<String>> validActionsMap = new ConcurrentHashMap<>();
        ConcurrentHashMap<String, Set<String>> validActionCollectionsMap = new ConcurrentHashMap<>();
        validPages.forEach(validPage -> {
            validActionsMap.put(validPage, ConcurrentHashMap.newKeySet());
            validActionCollectionsMap.put(validPage, ConcurrentHashMap.newKeySet());
        });

        // Save actions
        // queryName_pageName => nomenclature for the keys
        // TODO queryName => for app level queries, this is not implemented yet
        applicationGitReference.getActions().entrySet().parallelStream().forEach(resource -> {
            String[] names = resource.getKey().split(NAME_SEPARATOR);
            if (names.length > 1 && StringUtils.hasLength(names[1])) {
                // For actions, we are referring to validNames to maintain unique file names as just name
                // field don't guarantee unique constraint for actions within JSObject
                boolean isResourceUpdated = modifiedResources != null
                        && modifiedResources.isResourceUpdated(ACTION_LIST, resource.getKey());
                final String queryName = names[0].replace(".", "-");
                final String pageName = names[1];
                Path pageSpecificDirectory = pageDirectory.resolve(pageName);
                Path actionSpecificDirectory = pageSpecificDirectory.resolve(ACTION_DIRECTORY);

                if (!validActionsMap.containsKey(pageName)) {
                    validActionsMap.put(pageName, new HashSet<>());
                }
                validActionsMap.get(pageName).add(queryName);
                if (Boolean.TRUE.equals(isResourceUpdated)) {
                    saveActions(
                            resource.getValue(),
                            applicationGitReference.getActionBody().containsKey(resource.getKey())
                                    ? applicationGitReference.getActionBody().get(resource.getKey())
                                    : null,
                            queryName,
                            actionSpecificDirectory.resolve(queryName));
                    // Delete the resource from the old file structure v2
                    fileOperations.deleteFile(
                            pageSpecificDirectory.resolve(ACTION_DIRECTORY).resolve(queryName + JSON_EXTENSION));
                }
            }
        });

        validActionsMap.forEach((pageName, validActionNames) -> {
            Path pageSpecificDirectory = pageDirectory.resolve(pageName);
            fileOperations.scanAndDeleteDirectoryForDeletedResources(
                    validActionNames, pageSpecificDirectory.resolve(ACTION_DIRECTORY));
        });

        // Save JSObjects
        // JSObjectName_pageName => nomenclature for the keys
        // TODO JSObjectName => for app level JSObjects, this is not implemented yet
        applicationGitReference.getActionCollections().entrySet().parallelStream()
                .forEach(resource -> {
                    String[] names = resource.getKey().split(NAME_SEPARATOR);
                    if (names.length > 1 && StringUtils.hasLength(names[1])) {
                        final String actionCollectionName = names[0];
                        final String pageName = names[1];
                        Path pageSpecificDirectory = pageDirectory.resolve(pageName);
                        Path actionCollectionSpecificDirectory =
                                pageSpecificDirectory.resolve(ACTION_COLLECTION_DIRECTORY);

                        if (!validActionCollectionsMap.containsKey(pageName)) {
                            validActionCollectionsMap.put(pageName, new HashSet<>());
                        }
                        validActionCollectionsMap.get(pageName).add(actionCollectionName);
                        boolean isResourceUpdated = modifiedResources != null
                                && modifiedResources.isResourceUpdated(ACTION_COLLECTION_LIST, resource.getKey());
                        if (Boolean.TRUE.equals(isResourceUpdated)) {
                            saveActionCollection(
                                    resource.getValue(),
                                    applicationGitReference
                                            .getActionCollectionBody()
                                            .get(resource.getKey()),
                                    actionCollectionName,
                                    actionCollectionSpecificDirectory.resolve(actionCollectionName));
                            // Delete the resource from the old file structure v2
                            fileOperations.deleteFile(
                                    actionCollectionSpecificDirectory.resolve(actionCollectionName + JSON_EXTENSION));
                        }
                    }
                });

        // Verify if the old files are deleted
        validActionCollectionsMap.forEach((pageName, validActionCollectionNames) -> {
            Path pageSpecificDirectory = pageDirectory.resolve(pageName);
            fileOperations.scanAndDeleteDirectoryForDeletedResources(
                    validActionCollectionNames, pageSpecificDirectory.resolve(ACTION_COLLECTION_DIRECTORY));
        });

        // Save datasources ref
        for (Map.Entry<String, Object> resource :
                applicationGitReference.getDatasources().entrySet()) {
            saveResource(
                    resource.getValue(),
                    baseRepo.resolve(DATASOURCE_DIRECTORY).resolve(resource.getKey() + JSON_EXTENSION));
            validDatasourceFileNames.add(resource.getKey() + JSON_EXTENSION);
        }
        // Scan datasource directory and delete any unwanted files if present
        if (!applicationGitReference.getDatasources().isEmpty()) {
            fileOperations.scanAndDeleteFileForDeletedResources(
                    validDatasourceFileNames, baseRepo.resolve(DATASOURCE_DIRECTORY));
        }

        return validPages;
    }

    /**
     * This method will be used to store the DB resource to JSON file
     *
     * @param sourceEntity resource extracted from DB to be stored in file
     * @param path         file path where the resource to be stored
     * @return if the file operation is successful
     */
    protected boolean saveResource(Object sourceEntity, Path path) {
        try {
            Files.createDirectories(path.getParent());
            return fileOperations.writeToFile(sourceEntity, path);
        } catch (IOException e) {
            log.error("Error while writing resource to file {} with {}", path, e.getMessage());
            log.debug(e.getMessage());
        }
        return false;
    }

    protected void saveResourceCommon(Object sourceEntity, Path path) {
        try {
            Files.createDirectories(path.getParent());
            if (sourceEntity instanceof String s) {
                writeStringToFile(s, path);
                return;
            }
            if (sourceEntity instanceof JSONObject) {
                sourceEntity = objectMapper.readTree(sourceEntity.toString());
            }
            fileOperations.writeToFile(sourceEntity, path);
        } catch (IOException e) {
            log.error("Error while writing resource to file {} with {}", path, e.getMessage());
            log.debug(e.getMessage());
        }
    }

    /**
     * This method is used to write actionCollection specific resource to file system. We write the data in two steps
     * 1. Actual js code
     * 2. Metadata of the actionCollection
     *
     * @param sourceEntity the metadata of the action collection
     * @param body         actual js code written by the user
     * @param resourceName name of the action collection
     * @param path         file path where the resource will be stored
     * @return if the file operation is successful
     */
    private boolean saveActionCollection(Object sourceEntity, String body, String resourceName, Path path) {
        Span span = observationHelper.createSpan(GitSpan.FILE_WRITE);
        try {
            Files.createDirectories(path);
            if (StringUtils.hasText(body)) {
                // Write the js Object body to .js file to make conflict handling easier
                Path bodyPath = path.resolve(resourceName + CommonConstants.JS_EXTENSION);
                String resourceType = ACTION_COLLECTION_BODY;
                span.tag(RESOURCE_TYPE, resourceType);
                observationHelper.startSpan(span);
                writeStringToFile(body, bodyPath);
            }

            // Write metadata for the jsObject
            Path metadataPath = path.resolve(CommonConstants.METADATA + JSON_EXTENSION);
            return fileOperations.writeToFile(sourceEntity, metadataPath);
        } catch (IOException e) {
            log.debug(e.getMessage());
        } finally {
            observationHelper.endSpan(span);
        }
        return false;
    }

    /**
     * This method is used to write action specific resource to file system. We write the data in two steps
     * * 1. Actual query written by the user
     * * 2. Metadata of the actios
     *
     * @param sourceEntity the metadata of the action
     * @param body         actual query written by the user
     * @param resourceName name of the action
     * @param path         file path where the resource will be stored
     * @return if the file operation is successful
     */
    private boolean saveActions(Object sourceEntity, String body, String resourceName, Path path) {
        Span span = observationHelper.createSpan(GitSpan.FILE_WRITE);
        try {
            Files.createDirectories(path);
            // Write the user written query to .txt file to make conflict handling easier
            // Body will be null if the action is of type JS
            if (StringUtils.hasLength(body)) {
                Path bodyPath = path.resolve(resourceName + CommonConstants.TEXT_FILE_EXTENSION);
                String resourceType = NEW_ACTION_BODY;
                span.tag(RESOURCE_TYPE, resourceType);
                observationHelper.startSpan(span);
                writeStringToFile(body, bodyPath);
            }

            // Write metadata for the actions
            Path metadataPath = path.resolve(CommonConstants.METADATA + JSON_EXTENSION);
            return fileOperations.writeToFile(sourceEntity, metadataPath);
        } catch (IOException e) {
            log.error("Error while reading file {} with message {} with cause", path, e.getMessage(), e.getCause());
        } finally {
            observationHelper.endSpan(span);
        }
        return false;
    }

    private void writeStringToFile(String sourceEntity, Path path) throws IOException {
        try (BufferedWriter fileWriter = Files.newBufferedWriter(path, StandardCharsets.UTF_8)) {
            fileWriter.write(sourceEntity);
        }
    }

    /**
     * This will reconstruct the application from the repo
     *
     * @param organisationId    To which organisation application needs to be rehydrated
     * @param baseApplicationId To which organisation application needs to be rehydrated
     * @param branchName        for which the application needs to be rehydrate
     * @return application reference from which entire application can be rehydrated
     */
    public Mono<ApplicationGitReference> reconstructApplicationReferenceFromGitRepo(
            String organisationId, String baseApplicationId, String repoName, String branchName) {

        Stopwatch processStopwatch = new Stopwatch("FS reconstruct application");
        Path baseRepoSuffix = Paths.get(organisationId, baseApplicationId, repoName);

        // Checkout to mentioned branch if not already checked-out
        return gitExecutor
                .checkoutToBranch(baseRepoSuffix, branchName)
                .map(isSwitched -> {
                    Path baseRepoPath =
                            Paths.get(gitServiceConfig.getGitRootPath()).resolve(baseRepoSuffix);

                    ApplicationGitReference applicationGitReference = fetchApplicationReference(baseRepoPath);
                    processStopwatch.stopAndLogTimeInMillis();
                    return applicationGitReference;
                })
                .subscribeOn(scheduler);
    }

    @Override
    public Mono<GitResourceMap> constructGitResourceMapFromGitRepo(Path repositorySuffix, String refName) {
        // TODO: check that we need to checkout to the ref
        Path repositoryPath = Paths.get(gitServiceConfig.getGitRootPath()).resolve(repositorySuffix);
        return Mono.fromCallable(() -> fetchGitResourceMap(repositoryPath)).subscribeOn(scheduler);
    }

    /**
     * This is used to initialize repo with Readme file when the application is connected to remote repo
     *
     * @param baseRepoSuffix path suffix used to create a repo path this includes the readme.md as well
     * @param viewModeUrl    URL to deployed version of the application view only mode
     * @param editModeUrl    URL to deployed version of the application edit mode
     * @return Path to the base repo
     * @throws IOException
     */
    @Override
    public Mono<Path> initializeReadme(Path baseRepoSuffix, String viewModeUrl, String editModeUrl) throws IOException {
        return Mono.fromCallable(() -> {
                    ClassLoader classLoader = getClass().getClassLoader();
                    InputStream inputStream = classLoader.getResourceAsStream(gitServiceConfig.getReadmeTemplatePath());

                    StringWriter stringWriter = new StringWriter();
                    IOUtils.copy(inputStream, stringWriter, "UTF-8");
                    String data = stringWriter
                            .toString()
                            .replace(EDIT_MODE_URL_TEMPLATE, editModeUrl)
                            .replace(VIEW_MODE_URL_TEMPLATE, viewModeUrl);

                    File file = new File(Paths.get(gitServiceConfig.getGitRootPath())
                            .resolve(baseRepoSuffix)
                            .toFile()
                            .toString());
                    FileUtils.writeStringToFile(file, data, "UTF-8", true);

                    // Remove readme.md from the path
                    return file.toPath().getParent();
                })
                .subscribeOn(scheduler);
    }

    @Override
    public Mono<Boolean> deleteLocalRepo(Path baseRepoSuffix) {
        // Remove the complete directory from path: baseRepo/workspaceId/defaultApplicationId
        File file = Paths.get(gitServiceConfig.getGitRootPath())
                .resolve(baseRepoSuffix)
                .getParent()
                .toFile();
        while (file.exists()) {
            FileSystemUtils.deleteRecursively(file);
        }
        return Mono.just(Boolean.TRUE);
    }

    @Override
    public Mono<Boolean> checkIfDirectoryIsEmpty(Path baseRepoSuffix) {
        return Mono.fromCallable(() -> {
            File[] files = Paths.get(gitServiceConfig.getGitRootPath())
                    .resolve(baseRepoSuffix)
                    .toFile()
                    .listFiles();
            for (File file : files) {
                if (!ALLOWED_FILE_EXTENSION_PATTERN.matcher(file.getName()).matches()
                        && !file.getName().equals("LICENSE")) {
                    // Remove the cloned repo from the file system since the repo doesnt satisfy the criteria
                    while (file.exists()) {
                        FileSystemUtils.deleteRecursively(file);
                    }
                    return false;
                }
            }
            return true;
        });
    }

    /**
     * This method is to read the content for action and actionCollection or any nested resources which has the new structure - v3
     * Where the user written JS Object code and the metadata is split into to different files
     *
     * @param directoryPath file path for files on which read operation will be performed
     * @return resources stored in the directory
     */
    private Map<String, Object> readActionCollection(
            Path directoryPath, String keySuffix, Map<String, String> actionCollectionBodyMap) {
        Map<String, Object> resource = new HashMap<>();
        File directory = directoryPath.toFile();
        if (directory.isDirectory()) {
            for (File dirFile : Objects.requireNonNull(directory.listFiles())) {
                String resourceName = dirFile.getName();
                Path resourcePath =
                        directoryPath.resolve(resourceName).resolve(resourceName + CommonConstants.JS_EXTENSION);
                String body = CommonConstants.EMPTY_STRING;
                if (resourcePath.toFile().exists()) {
                    body = fileOperations.readFileAsString(resourcePath);
                }
                Object file = fileOperations.readFile(
                        directoryPath.resolve(resourceName).resolve(CommonConstants.METADATA + JSON_EXTENSION));
                actionCollectionBodyMap.put(resourceName + keySuffix, body);
                resource.put(resourceName + keySuffix, file);
            }
        }
        return resource;
    }

    /**
     * This method is to read the content for action and actionCollection or any nested resources which has the new structure - v4
     * Where the user queries and the metadata is split into to different files
     *
     * @param directoryPath directory path for files on which read operation will be performed
     * @return resources stored in the directory
     */
    private Map<String, Object> readAction(
            Path directoryPath, String keySuffix, Map<String, String> actionCollectionBodyMap) {
        Map<String, Object> resource = new HashMap<>();
        File directory = directoryPath.toFile();
        if (directory.isDirectory()) {
            for (File dirFile : Objects.requireNonNull(directory.listFiles())) {
                String resourceName = dirFile.getName();
                String body = CommonConstants.EMPTY_STRING;
                Path queryPath =
                        directoryPath.resolve(resourceName).resolve(resourceName + CommonConstants.TEXT_FILE_EXTENSION);
                if (queryPath.toFile().exists()) {
                    body = fileOperations.readFileAsString(queryPath);
                }
                Object file = fileOperations.readFile(
                        directoryPath.resolve(resourceName).resolve(CommonConstants.METADATA + JSON_EXTENSION));
                actionCollectionBodyMap.put(resourceName + keySuffix, body);
                resource.put(resourceName + keySuffix, file);
            }
        }
        return resource;
    }

    private Object readPageMetadata(Path directoryPath) {
        return fileOperations.readFile(
                directoryPath.resolve(directoryPath.toFile().getName() + JSON_EXTENSION));
    }

    protected GitResourceMap fetchGitResourceMap(Path baseRepoPath) throws IOException {
        // Extract application metadata from the json
        Object metadata = fileOperations.readFile(baseRepoPath.resolve(CommonConstants.METADATA + JSON_EXTENSION));
        Integer fileFormatVersion = fileOperations.getFileFormatVersion(metadata);
        // Check if fileFormat of the saved files in repo is compatible
        if (!isFileFormatCompatible(fileFormatVersion)) {
            throw new AppsmithPluginException(AppsmithPluginError.INCOMPATIBLE_FILE_FORMAT);
        }

        GitResourceMap gitResourceMap = new GitResourceMap();
        Map<GitResourceIdentity, Object> resourceMap = gitResourceMap.getGitResourceMap();

        Set<String> filesInRepo = getExistingFilesInRepo(baseRepoPath);
        // Remove all files that need not be fetched to the git resource map
        // i.e. ->  README.md
        filesInRepo.remove(README_FILE_NAME);

        filesInRepo.parallelStream()
                .filter(path -> !Files.isDirectory(baseRepoPath.resolve(path)))
                .forEach(filePath -> {
                    Tuple2<GitResourceIdentity, Object> identity = getGitResourceIdentity(baseRepoPath, filePath);

                    resourceMap.put(identity.getT1(), identity.getT2());
                });

        return gitResourceMap;
    }

    protected Tuple2<GitResourceIdentity, Object> getGitResourceIdentity(Path baseRepoPath, String filePath) {
        Path path = baseRepoPath.resolve(filePath);
        GitResourceIdentity identity;
        Object contents = fileOperations.readFile(path);
        if (!filePath.contains("/")) {
            identity = new GitResourceIdentity(GitResourceType.ROOT_CONFIG, filePath, filePath);
        } else if (filePath.matches(DATASOURCE_DIRECTORY + "/.*")) {
            String gitSyncId =
                    objectMapper.valueToTree(contents).get("gitSyncId").asText();
            identity = new GitResourceIdentity(GitResourceType.DATASOURCE_CONFIG, gitSyncId, filePath);
        } else if (filePath.matches(JS_LIB_DIRECTORY + "/.*")) {
            String fileName = FilenameUtils.getBaseName(filePath);
            identity = new GitResourceIdentity(GitResourceType.JSLIB_CONFIG, fileName, filePath);
        } else if (filePath.matches(PAGE_DIRECTORY + "/[^/]*/[^/]*.json")) {
            String gitSyncId =
                    objectMapper.valueToTree(contents).get("gitSyncId").asText();
            identity = new GitResourceIdentity(GitResourceType.CONTEXT_CONFIG, gitSyncId, filePath);
        } else if (filePath.matches(PAGE_DIRECTORY + "/[^/]*/" + ACTION_DIRECTORY + "/.*/metadata.json")) {
            String gitSyncId =
                    objectMapper.valueToTree(contents).get("gitSyncId").asText();
            identity = new GitResourceIdentity(GitResourceType.QUERY_CONFIG, gitSyncId, filePath);
        } else if (filePath.matches(PAGE_DIRECTORY + "/[^/]*/" + ACTION_DIRECTORY + "/.*\\.txt")) {
            Object configContents = fileOperations.readFile(path.getParent().resolve("metadata.json"));
            String gitSyncId =
                    objectMapper.valueToTree(configContents).get("gitSyncId").asText();
            identity = new GitResourceIdentity(GitResourceType.QUERY_DATA, gitSyncId, filePath);
            contents = fileOperations.readFileAsString(path);
        } else if (filePath.matches(PAGE_DIRECTORY + "/[^/]*/" + ACTION_COLLECTION_DIRECTORY + "/.*/metadata.json")) {
            String gitSyncId =
                    objectMapper.valueToTree(contents).get("gitSyncId").asText();
            identity = new GitResourceIdentity(GitResourceType.JSOBJECT_CONFIG, gitSyncId, filePath);
        } else if (filePath.matches(PAGE_DIRECTORY + "/[^/]*/" + ACTION_COLLECTION_DIRECTORY + "/.*\\.js")) {
            Object configContents = fileOperations.readFile(path.getParent().resolve("metadata.json"));
            String gitSyncId =
                    objectMapper.valueToTree(configContents).get("gitSyncId").asText();
            identity = new GitResourceIdentity(GitResourceType.JSOBJECT_DATA, gitSyncId, filePath);
            contents = fileOperations.readFileAsString(path);
        } else if (filePath.matches(PAGE_DIRECTORY + "/[^/]*/widgets/.*\\.json")) {
            Pattern pageDirPattern = Pattern.compile("(" + PAGE_DIRECTORY + "/([^/]*))/widgets/.*\\.json");
            Matcher matcher = pageDirPattern.matcher(filePath);
            matcher.find();
            String pageDirectory = matcher.group(1);
            String pageName = matcher.group(2) + ".json";
            Object configContents =
                    fileOperations.readFile(baseRepoPath.resolve(pageDirectory).resolve(pageName));
            String gitSyncId =
                    objectMapper.valueToTree(configContents).get("gitSyncId").asText();
            String widgetId = objectMapper.valueToTree(contents).get("widgetId").asText();
            identity = new GitResourceIdentity(GitResourceType.WIDGET_CONFIG, gitSyncId + "-" + widgetId, filePath);
        } else return null;

        return Tuples.of(identity, contents);
    }

    private ApplicationGitReference fetchApplicationReference(Path baseRepoPath) {
        ApplicationGitReference applicationGitReference = new ApplicationGitReference();
        // Extract application metadata from the json
        Object metadata = fileOperations.readFile(baseRepoPath.resolve(CommonConstants.METADATA + JSON_EXTENSION));
        Integer fileFormatVersion = fileOperations.getFileFormatVersion(metadata);
        // Check if fileFormat of the saved files in repo is compatible
        if (!isFileFormatCompatible(fileFormatVersion)) {
            throw new AppsmithPluginException(AppsmithPluginError.INCOMPATIBLE_FILE_FORMAT);
        }
        // Extract application data from the json
        applicationGitReference.setApplication(
                fileOperations.readFile(baseRepoPath.resolve(CommonConstants.APPLICATION + JSON_EXTENSION)));
        applicationGitReference.setTheme(
                fileOperations.readFile(baseRepoPath.resolve(CommonConstants.THEME + JSON_EXTENSION)));
        Path pageDirectory = baseRepoPath.resolve(PAGE_DIRECTORY);
        // Reconstruct application from given file format
        switch (fileFormatVersion) {
            case 1:
                // Extract actions
                applicationGitReference.setActions(
                        fileOperations.readFiles(baseRepoPath.resolve(ACTION_DIRECTORY), CommonConstants.EMPTY_STRING));
                // Extract actionCollections
                applicationGitReference.setActionCollections(fileOperations.readFiles(
                        baseRepoPath.resolve(ACTION_COLLECTION_DIRECTORY), CommonConstants.EMPTY_STRING));
                // Extract pages
                applicationGitReference.setPages(fileOperations.readFiles(pageDirectory, CommonConstants.EMPTY_STRING));
                // Extract datasources
                applicationGitReference.setDatasources(fileOperations.readFiles(
                        baseRepoPath.resolve(DATASOURCE_DIRECTORY), CommonConstants.EMPTY_STRING));
                break;

            case 2:
            case 3:
            case 4:
                updateGitApplicationReference(baseRepoPath, applicationGitReference, pageDirectory, fileFormatVersion);
                break;

            case 5:
                updateGitApplicationReferenceV2(
                        baseRepoPath, applicationGitReference, pageDirectory, fileFormatVersion);
                break;

            default:
        }
        applicationGitReference.setMetadata(metadata);

        Path jsLibDirectory = baseRepoPath.resolve(JS_LIB_DIRECTORY);
        Map<String, Object> jsLibrariesMap = fileOperations.readFiles(jsLibDirectory, CommonConstants.EMPTY_STRING);
        applicationGitReference.setJsLibraries(jsLibrariesMap);

        return applicationGitReference;
    }

    @Deprecated
    private void updateGitApplicationReference(
            Path baseRepoPath,
            ApplicationGitReference applicationGitReference,
            Path pageDirectory,
            int fileFormatVersion) {
        // Extract pages and nested actions and actionCollections
        File directory = pageDirectory.toFile();
        Map<String, Object> pageMap = new HashMap<>();
        Map<String, Object> actionMap = new HashMap<>();
        Map<String, String> actionBodyMap = new HashMap<>();
        Map<String, Object> actionCollectionMap = new HashMap<>();
        Map<String, String> actionCollectionBodyMap = new HashMap<>();
        if (directory.isDirectory()) {
            // Loop through all the directories and nested directories inside the pages directory to extract
            // pages, actions and actionCollections from the JSON files
            for (File page : Objects.requireNonNull(directory.listFiles())) {
                pageMap.put(
                        page.getName(),
                        fileOperations.readFile(page.toPath().resolve(CommonConstants.CANVAS + JSON_EXTENSION)));

                if (fileFormatVersion >= 4) {
                    actionMap.putAll(
                            readAction(page.toPath().resolve(ACTION_DIRECTORY), page.getName(), actionBodyMap));
                } else {
                    actionMap.putAll(fileOperations.readFiles(page.toPath().resolve(ACTION_DIRECTORY), page.getName()));
                }

                if (fileFormatVersion >= 3) {
                    actionCollectionMap.putAll(readActionCollection(
                            page.toPath().resolve(ACTION_COLLECTION_DIRECTORY),
                            page.getName(),
                            actionCollectionBodyMap));
                } else {
                    actionCollectionMap.putAll(fileOperations.readFiles(
                            page.toPath().resolve(ACTION_COLLECTION_DIRECTORY), page.getName()));
                }
            }
        }
        applicationGitReference.setActions(actionMap);
        applicationGitReference.setActionBody(actionBodyMap);
        applicationGitReference.setActionCollections(actionCollectionMap);
        applicationGitReference.setActionCollectionBody(actionCollectionBodyMap);
        applicationGitReference.setPages(pageMap);
        // Extract datasources
        applicationGitReference.setDatasources(
                fileOperations.readFiles(baseRepoPath.resolve(DATASOURCE_DIRECTORY), CommonConstants.EMPTY_STRING));
    }

    public static boolean isFileFormatCompatible(int savedFileFormat) {
        return savedFileFormat <= CommonConstants.fileFormatVersion;
    }

    protected void updateGitApplicationReferenceV2(
            Path baseRepoPath,
            ApplicationGitReference applicationGitReference,
            Path pageDirectory,
            int fileFormatVersion) {
        // Extract pages and nested actions and actionCollections
        File directory = pageDirectory.toFile();
        Map<String, Object> pageMap = new HashMap<>();
        Map<String, String> pageDsl = new HashMap<>();
        Map<String, Object> actionMap = new HashMap<>();
        Map<String, String> actionBodyMap = new HashMap<>();
        Map<String, Object> actionCollectionMap = new HashMap<>();
        Map<String, String> actionCollectionBodyMap = new HashMap<>();
        if (directory.isDirectory()) {
            // Loop through all the directories and nested directories inside the pages directory to extract
            // pages, actions and actionCollections from the JSON files
            for (File page : Objects.requireNonNull(directory.listFiles())) {
                if (page.isDirectory()) {
                    pageMap.put(page.getName(), readPageMetadata(page.toPath()));

                    JSONObject mainContainer = fileOperations.getMainContainer(pageMap.get(page.getName()));

                    // Read widgets data recursively from the widgets directory
                    Map<String, JSONObject> widgetsData = readWidgetsData(
                            page.toPath().resolve(CommonConstants.WIDGETS).toString());
                    // Construct the nested DSL from the widgets data
                    Map<String, List<String>> parentDirectories = DSLTransformerHelper.calculateParentDirectories(
                            widgetsData.keySet().stream().toList());
                    JSONObject nestedDSL =
                            DSLTransformerHelper.getNestedDSL(widgetsData, parentDirectories, mainContainer);
                    pageDsl.put(page.getName(), nestedDSL.toString());
                    actionMap.putAll(
                            readAction(page.toPath().resolve(ACTION_DIRECTORY), page.getName(), actionBodyMap));
                    actionCollectionMap.putAll(readActionCollection(
                            page.toPath().resolve(ACTION_COLLECTION_DIRECTORY),
                            page.getName(),
                            actionCollectionBodyMap));
                }
            }
        }
        applicationGitReference.setActions(actionMap);
        applicationGitReference.setActionBody(actionBodyMap);
        applicationGitReference.setActionCollections(actionCollectionMap);
        applicationGitReference.setActionCollectionBody(actionCollectionBodyMap);
        applicationGitReference.setPages(pageMap);
        applicationGitReference.setPageDsl(pageDsl);
        // Extract datasources
        applicationGitReference.setDatasources(
                fileOperations.readFiles(baseRepoPath.resolve(DATASOURCE_DIRECTORY), CommonConstants.EMPTY_STRING));
    }

    private Map<String, JSONObject> readWidgetsData(String directoryPath) {
        Map<String, JSONObject> jsonMap = new HashMap<>();
        File directory = new File(directoryPath);

        if (!directory.isDirectory()) {
            log.error("Error reading directory: {}", directoryPath);
            return jsonMap;
        }

        try {
            readFilesRecursively(directory, jsonMap, directoryPath);
        } catch (IOException exception) {
            log.error("Error reading directory: {}, error message {}", directoryPath, exception.getMessage());
        }

        return jsonMap;
    }

    private void readFilesRecursively(File directory, Map<String, JSONObject> jsonMap, String rootPath)
            throws IOException {
        File[] files = directory.listFiles();
        if (files == null) {
            return;
        }

        for (File file : files) {
            if (file.isFile()) {
                String filePath = file.getAbsolutePath();
                String relativePath = filePath.replace(rootPath, CommonConstants.EMPTY_STRING);
                relativePath = CommonConstants.DELIMITER_PATH
                        + CommonConstants.MAIN_CONTAINER
                        + relativePath.substring(relativePath.indexOf("//") + 1);
                try {
                    String fileContent = new String(Files.readAllBytes(file.toPath()));
                    JSONObject jsonObject = new JSONObject(fileContent);
                    jsonMap.put(relativePath, jsonObject);
                } catch (IOException exception) {
                    log.error("Error reading file: {}, error message {}", filePath, exception.getMessage());
                }
            } else if (file.isDirectory()) {
                readFilesRecursively(file, jsonMap, rootPath);
            }
        }
    }

    private void deleteWidgets(File directory, Map<String, String> validWidgetToParentMap) {
        File[] files = directory.listFiles();
        if (files == null) {
            return;
        }

        for (File file : files) {
            if (file.isDirectory()) {
                deleteWidgets(file, validWidgetToParentMap);
            }

            String name = file.getName().replace(JSON_EXTENSION, CommonConstants.EMPTY_STRING);
            // If input widget was inside a container before, but the user moved it out of the container
            // then we need to delete the widget from the container directory
            // The check here is to validate if the parent is correct or not
            if (!validWidgetToParentMap.containsKey(name)) {
                if (file.isDirectory()) {
                    fileOperations.deleteDirectory(file.toPath());
                } else {
                    fileOperations.deleteFile(file.toPath());
                }
            } else if (!file.getParentFile().getPath().equals(validWidgetToParentMap.get(name))
                    && !file.getPath().equals(validWidgetToParentMap.get(name))) {
                if (file.isDirectory()) {
                    fileOperations.deleteDirectory(file.toPath());
                } else {
                    fileOperations.deleteFile(file.toPath());
                }
            }
        }
    }

    @Override
    public Mono<Long> deleteIndexLockFile(Path path, int validTimeInSeconds) {
        return fileOperations.deleteIndexLockFile(path, validTimeInSeconds);
    }

    @Override
    public void scanAndDeleteFileForDeletedResources(Set<String> validResources, Path resourceDirectory) {
        fileOperations.scanAndDeleteFileForDeletedResources(validResources, resourceDirectory);
    }

    @Override
    public void scanAndDeleteDirectoryForDeletedResources(Set<String> validResources, Path resourceDirectory) {
        fileOperations.scanAndDeleteDirectoryForDeletedResources(validResources, resourceDirectory);
    }

    /**
     * We use UID string for custom js lib. UID strings are in this format: {libname}_{url to the lib src}.
     * This method converts this uid string into a valid file name so that there is no unsupported character in the
     * file name for any OS.
     * This method returns a string in the format: {libname}_{base64 encoded hash of uid string}
     *
     * @param uidString UID string value of a JS lib
     * @return String
     */
    public static String getJsLibFileName(String uidString) {
        int firstUnderscoreIndex = uidString.indexOf('_'); // this finds the first occurrence of "_"
        String prefix;
        if (firstUnderscoreIndex != -1) {
            prefix = uidString.substring(0, firstUnderscoreIndex); // we're getting the prefix from the uidString
        } else {
            prefix = "jslib";
        }

        StringBuilder stringBuilder = new StringBuilder(prefix);
        stringBuilder.append("_");
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(uidString.getBytes(StandardCharsets.UTF_8));
            stringBuilder.append(Base64.getUrlEncoder().withoutPadding().encodeToString(hash));
        } catch (NoSuchAlgorithmException e) {
            throw new RuntimeException("Failed to hash URL string", e);
        }
        return stringBuilder.toString();
    }

    @Override
    public Mono<Object> reconstructMetadataFromGitRepo(
            String workspaceId,
            String baseArtifactId,
            String repoName,
            String branchName,
            Path baseRepoSuffix,
            Boolean isResetToLastCommitRequired) {
        Mono<Object> metadataMono;
        try {
            Mono<Boolean> gitResetMono = Mono.just(Boolean.TRUE);
            if (Boolean.TRUE.equals(isResetToLastCommitRequired)) {
                // instead of checking out to last branch we are first cleaning the git repo,
                // then checking out to the desired branch
                gitResetMono = gitExecutor.resetToLastCommit(baseRepoSuffix, branchName);
            }

            metadataMono = gitResetMono.map(isSwitched -> {
                Path baseRepoPath = Paths.get(gitServiceConfig.getGitRootPath()).resolve(baseRepoSuffix);
                Object metadata =
                        fileOperations.readFile(baseRepoPath.resolve(CommonConstants.METADATA + JSON_EXTENSION));
                return metadata;
            });
        } catch (GitAPIException | IOException exception) {
            metadataMono = Mono.error(exception);
        }

        return metadataMono.subscribeOn(scheduler);
    }

    @Override
    public Mono<Object> reconstructMetadataFromGitRepository(Path repoSuffix) {
        Mono<Object> metadataMono = Mono.fromCallable(() -> {
            Path baseRepoPath = Paths.get(gitServiceConfig.getGitRootPath()).resolve(repoSuffix);
            return fileOperations.readFile(baseRepoPath.resolve(CommonConstants.METADATA + JSON_EXTENSION));
        });

        return metadataMono.subscribeOn(scheduler);
    }

    @Override
    public Mono<Object> reconstructPageFromGitRepo(
            String pageName, String branchName, Path baseRepoSuffixPath, Boolean resetToLastCommitRequired) {
        Mono<Object> pageObjectMono;
        try {
            Mono<Boolean> resetToLastCommit = Mono.just(Boolean.TRUE);

            if (Boolean.TRUE.equals(resetToLastCommitRequired)) {
                // instead of checking out to last branch we are first cleaning the git repo,
                // then checking out to the desired branch
                resetToLastCommit = gitExecutor.resetToLastCommit(baseRepoSuffixPath, branchName);
            }

            pageObjectMono = resetToLastCommit.map(isSwitched -> {
                Path pageSuffix = Paths.get(PAGE_DIRECTORY, pageName);
                Path repoPath = Paths.get(gitServiceConfig.getGitRootPath())
                        .resolve(baseRepoSuffixPath)
                        .resolve(pageSuffix);

                Object pageObject = fileOperations.readFile(repoPath.resolve(pageName + JSON_EXTENSION));

                return pageObject;
            });
        } catch (GitAPIException | IOException exception) {
            pageObjectMono = Mono.error(exception);
        }

        return pageObjectMono.subscribeOn(scheduler);
    }
}
