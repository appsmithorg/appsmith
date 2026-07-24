package com.appsmith.git.files;

import com.appsmith.external.dtos.ModifiedResources;
import com.appsmith.external.exceptions.pluginExceptions.AppsmithPluginError;
import com.appsmith.external.exceptions.pluginExceptions.AppsmithPluginException;
import com.appsmith.external.git.FileInterface;
import com.appsmith.external.git.constants.GitSpan;
import com.appsmith.external.git.handler.FSGitHandler;
import com.appsmith.external.git.models.GitResourceIdentity;
import com.appsmith.external.git.models.GitResourceMap;
import com.appsmith.external.git.models.GitResourceType;
import com.appsmith.external.git.operations.FileOperations;
import com.appsmith.external.helpers.ObservationHelper;
import com.appsmith.git.configurations.GitServiceConfig;
import com.appsmith.git.constants.CommonConstants;
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
import java.nio.file.LinkOption;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.Base64;
import java.util.HashMap;
import java.util.HashSet;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;
import java.util.stream.Stream;

import static com.appsmith.external.git.constants.GitConstants.GitMetricConstants.ACTION_COLLECTION_BODY;
import static com.appsmith.external.git.constants.GitConstants.GitMetricConstants.NEW_ACTION_BODY;
import static com.appsmith.external.git.constants.GitConstants.GitMetricConstants.RESOURCE_TYPE;
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

    protected final GitServiceConfig gitServiceConfig;
    protected final FSGitHandler fsGitHandler;
    protected final FileOperations fileOperations;
    private final ObservationHelper observationHelper;
    protected final ObjectMapper objectMapper;

    private static final String EDIT_MODE_URL_TEMPLATE = "{{editModeUrl}}";

    private static final String VIEW_MODE_URL_TEMPLATE = "{{viewModeUrl}}";

    private static final Pattern ALLOWED_FILE_EXTENSION_PATTERN =
            Pattern.compile("(.*?)\\.(md|MD|git|gitignore|github|yml|yaml)$");

    protected final Scheduler scheduler = Schedulers.boundedElastic();

    private static final String CANVAS_WIDGET = "(Canvas)[0-9]*.";

    public FileUtilsCEImpl(
            GitServiceConfig gitServiceConfig,
            FSGitHandler fsGitHandler,
            FileOperations fileOperations,
            ObservationHelper observationHelper,
            ObjectMapper objectMapper) {
        this.gitServiceConfig = gitServiceConfig;
        this.fsGitHandler = fsGitHandler;
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

    @Override
    public Mono<Path> saveArtifactToGitRepo(
            Path baseRepoSuffix, GitResourceMap gitResourceMapFromDB, String branchName, boolean keepWorkingDirChanges)
            throws GitAPIException, IOException {

        // Repo path will be:
        // baseRepo : root/workspaceId/defaultAppId/repoName/{applicationData}
        // Checkout to mentioned branch if not already checked-out
        return fsGitHandler
                .resetToLastCommit(baseRepoSuffix, branchName, keepWorkingDirChanges)
                .flatMap(isSwitched -> {
                    Path baseRepo = Paths.get(gitServiceConfig.getGitRootPath()).resolve(baseRepoSuffix);
                    Mono<GitResourceMap> gitResourceMapFromFSMono = constructGitResourceMapFromGitRepo(
                                    baseRepoSuffix, branchName)
                            .name("constructGitResourceMapFromGitRepo");

                    return gitResourceMapFromFSMono
                            .flatMap(gitResourceMapFromFS -> {
                                try {
                                    updateEntitiesInRepo(gitResourceMapFromDB, baseRepo, gitResourceMapFromFS);
                                } catch (IOException e) {
                                    return Mono.error(e);
                                }
                                return Mono.just(baseRepo);
                            })
                            .onErrorResume(error -> {
                                return Mono.defer(() -> {
                                    return Mono.just(baseRepo).flatMap(baseRepo1 -> {
                                        try {
                                            updateEntitiesInRepoFallback(gitResourceMapFromDB, baseRepo);
                                            return Mono.just(baseRepo1);
                                        } catch (IOException e) {
                                            return Mono.error(e);
                                        }
                                    });
                                });
                            });
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

    protected Set<String> updateEntitiesInRepo(
            GitResourceMap gitResourceMapFromDB, Path baseRepo, GitResourceMap gitResourceMapFromFS)
            throws IOException {
        Map<GitResourceIdentity, Object> resourceMapFromDB = gitResourceMapFromDB.getGitResourceMap();

        Set<String> filesPathsFromDB = resourceMapFromDB.keySet().parallelStream()
                .map(gitResourceIdentity -> gitResourceIdentity.getFilePath())
                .collect(Collectors.toSet());

        Map<String, Object> filePathToObjectsFromFS =
                gitResourceMapFromFS.getGitResourceMap().entrySet().parallelStream()
                        .collect(Collectors.toMap(entry -> entry.getKey().getFilePath(), entry -> entry.getValue()));

        Set<String> filePathsFromFS = new HashSet<>(filePathToObjectsFromFS.keySet());

        // Readme files shouldn't be modified/deleted/or updated.
        filePathsFromFS.remove(README_FILE_NAME);
        filePathsFromFS.removeAll(filesPathsFromDB);

        // Delete all the files because they are no longer needed
        // This covers both older structures of storing files and,
        // legitimate changes in the artifact that might cause deletions
        filePathsFromFS.stream().parallel().forEach(filePath -> {
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
        Set<String> newAndUpdatedFilePaths = resourceMapFromDB.entrySet().parallelStream()
                .map(entry -> {
                    GitResourceIdentity key = entry.getKey();
                    boolean resourceUpdated = true;
                    try {
                        resourceUpdated = fileOperations.hasFileChanged(
                                entry.getValue(), filePathToObjectsFromFS.get(key.getFilePath()));
                    } catch (IOException e) {
                        log.error("Error while checking if file has changed", e);
                    }

                    if (resourceUpdated) {
                        log.info("Resource updated: {}", key.getFilePath());
                        String filePath = key.getFilePath();
                        saveResourceCommon(entry.getValue(), baseRepo.resolve(filePath));

                        return filePath;
                    }

                    return null;
                })
                .filter(Objects::nonNull)
                .collect(Collectors.toSet());

        Set<String> allFileChanges = new HashSet<>();
        allFileChanges.addAll(newAndUpdatedFilePaths);
        allFileChanges.addAll(filePathsFromFS);
        return allFileChanges;
    }

    protected Set<String> updateEntitiesInRepoFallback(GitResourceMap gitResourceMap, Path baseRepo)
            throws IOException {
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

    /**
     * Validates that the given target path, after normalization, is still contained within
     * the configured Git root directory. This is a defense-in-depth measure to prevent
     * path traversal attacks where crafted resource names could cause file operations outside
     * the repository.
     *
     * @param targetPath the resolved path intended for a file operation
     * @throws AppsmithPluginException if the path escapes the Git root directory
     */
    protected void validatePathIsWithinGitRoot(Path targetPath) {
        Path gitRoot =
                Paths.get(gitServiceConfig.getGitRootPath()).toAbsolutePath().normalize();

        // 1. Lexical containment check — blocks "../" traversal in crafted resource names.
        Path normalizedTarget = targetPath.toAbsolutePath().normalize();
        if (!normalizedTarget.startsWith(gitRoot)) {
            throwPathTraversal(normalizedTarget, gitRoot);
        }

        // 2. Symlink-aware containment check (GHSA-fqwc-g9wm-5895) — blocks symbolic links committed
        // inside a repository that point outside the Git root. Path.normalize() above is purely
        // lexical and does NOT resolve symlinks, whereas every downstream file I/O sink follows
        // them. Resolve the real (symlink-free) path before comparing. Fails closed on I/O error.
        try {
            Path realGitRoot = toRealPathResolvingExistingPrefix(gitRoot);
            Path realTarget = toRealPathResolvingExistingPrefix(normalizedTarget);
            if (!realTarget.startsWith(realGitRoot)) {
                throwPathTraversal(realTarget, realGitRoot);
            }
        } catch (IOException e) {
            String errorMessage = "SECURITY: Unable to resolve real path for " + normalizedTarget
                    + " while validating Git root containment";
            log.error(errorMessage, e);
            throw new AppsmithPluginException(AppsmithPluginError.PLUGIN_ERROR, errorMessage);
        }
    }

    private void throwPathTraversal(Path attemptedPath, Path gitRoot) {
        String errorMessage = "SECURITY: Path traversal detected. Attempted to access " + attemptedPath
                + " which is outside the Git root " + gitRoot;
        log.error(errorMessage);
        throw new AppsmithPluginException(AppsmithPluginError.PLUGIN_ERROR, errorMessage);
    }

    /**
     * Resolves symbolic links in the longest existing prefix of {@code path} and re-appends the
     * remaining (not-yet-created) path segments lexically. {@link Path#toRealPath} cannot be used
     * directly because it requires the whole path to exist, while file writes legitimately target
     * paths that do not exist yet. By resolving the deepest existing ancestor we still detect any
     * symlink along the existing portion (including when {@code path} itself is a symlink) while
     * supporting yet-to-be-created files.
     */
    private Path toRealPathResolvingExistingPrefix(Path path) throws IOException {
        Path absolute = path.toAbsolutePath().normalize();
        Path existing = absolute;
        while (existing != null && !Files.exists(existing, LinkOption.NOFOLLOW_LINKS)) {
            existing = existing.getParent();
        }
        if (existing == null) {
            // No component of the path exists; no symlink can be involved.
            return absolute;
        }
        Path realExisting = existing.toRealPath();
        if (existing.equals(absolute)) {
            return realExisting;
        }
        return realExisting.resolve(existing.relativize(absolute)).normalize();
    }

    protected Object readFileValidated(Path filePath) {
        validatePathIsWithinGitRoot(filePath);
        return fileOperations.readFile(filePath);
    }

    protected Map<String, Object> readFilesValidated(Path directoryPath, String keySuffix) {
        validatePathIsWithinGitRoot(directoryPath);
        return fileOperations.readFiles(directoryPath, keySuffix);
    }

    protected String readFileAsStringValidated(Path filePath) {
        validatePathIsWithinGitRoot(filePath);
        return fileOperations.readFileAsString(filePath);
    }

    protected void deleteFileValidated(Path filePath) {
        validatePathIsWithinGitRoot(filePath);
        fileOperations.deleteFile(filePath);
    }

    protected void deleteDirectoryValidated(Path directory) {
        validatePathIsWithinGitRoot(directory);
        fileOperations.deleteDirectory(directory);
    }

    /**
     * This method will be used to store the DB resource to JSON file
     *
     * @param sourceEntity resource extracted from DB to be stored in file
     * @param path         file path where the resource to be stored
     * @return if the file operation is successful
     */
    protected boolean saveResource(Object sourceEntity, Path path) {
        validatePathIsWithinGitRoot(path);
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
        validatePathIsWithinGitRoot(path);
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
        validatePathIsWithinGitRoot(path);
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

            // Write metadata for the jsObject — validate the concrete file path so a symlink
            // at metadata.json pointing outside the Git root is rejected (GHSA-fqwc-g9wm-5895).
            Path metadataPath = path.resolve(CommonConstants.METADATA + JSON_EXTENSION);
            validatePathIsWithinGitRoot(metadataPath);
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
        validatePathIsWithinGitRoot(path);
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

            // Write metadata for the actions — validate the concrete file path so a symlink
            // at metadata.json pointing outside the Git root is rejected (GHSA-fqwc-g9wm-5895).
            Path metadataPath = path.resolve(CommonConstants.METADATA + JSON_EXTENSION);
            validatePathIsWithinGitRoot(metadataPath);
            return fileOperations.writeToFile(sourceEntity, metadataPath);
        } catch (IOException e) {
            log.error("Error while reading file {} with message {} with cause", path, e.getMessage(), e.getCause());
        } finally {
            observationHelper.endSpan(span);
        }
        return false;
    }

    private void writeStringToFile(String sourceEntity, Path path) throws IOException {
        // Validate the concrete file path (not just its parent directory) so that a symlink at this
        // path pointing outside the Git root is rejected before any write follows it
        // (GHSA-fqwc-g9wm-5895).
        validatePathIsWithinGitRoot(path);
        try (BufferedWriter fileWriter = Files.newBufferedWriter(path, StandardCharsets.UTF_8)) {
            fileWriter.write(sourceEntity);
        }
    }

    @Override
    public Mono<GitResourceMap> constructGitResourceMapFromGitRepo(Path repositorySuffix, String refName) {
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
                    String data;
                    try (InputStream inputStream =
                            classLoader.getResourceAsStream(gitServiceConfig.getReadmeTemplatePath())) {
                        if (inputStream == null) {
                            throw new IOException(
                                    "Readme template not found at: " + gitServiceConfig.getReadmeTemplatePath());
                        }
                        StringWriter stringWriter = new StringWriter();
                        IOUtils.copy(inputStream, stringWriter, "UTF-8");
                        data = stringWriter.toString();
                    }
                    data = data.replace(EDIT_MODE_URL_TEMPLATE, editModeUrl)
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
                    body = readFileAsStringValidated(resourcePath);
                }
                Object file = readFileValidated(
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
                    body = readFileAsStringValidated(queryPath);
                }
                Object file = readFileValidated(
                        directoryPath.resolve(resourceName).resolve(CommonConstants.METADATA + JSON_EXTENSION));
                actionCollectionBodyMap.put(resourceName + keySuffix, body);
                resource.put(resourceName + keySuffix, file);
            }
        }
        return resource;
    }

    private Object readPageMetadata(Path directoryPath) {
        return readFileValidated(directoryPath.resolve(directoryPath.toFile().getName() + JSON_EXTENSION));
    }

    protected GitResourceMap fetchGitResourceMap(Path baseRepoPath) throws IOException {
        // Extract application metadata from the json
        Object metadata = readFileValidated(baseRepoPath.resolve(CommonConstants.METADATA + JSON_EXTENSION));
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
        Object contents = null;

        if (filePath.endsWith(JSON_EXTENSION)) {
            contents = readFileValidated(path);
        }

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
            Object configContents = readFileValidated(path.getParent().resolve("metadata.json"));
            String gitSyncId =
                    objectMapper.valueToTree(configContents).get("gitSyncId").asText();
            identity = new GitResourceIdentity(GitResourceType.QUERY_DATA, gitSyncId, filePath);
            contents = readFileAsStringValidated(path);
        } else if (filePath.matches(PAGE_DIRECTORY + "/[^/]*/" + ACTION_COLLECTION_DIRECTORY + "/.*/metadata.json")) {
            String gitSyncId =
                    objectMapper.valueToTree(contents).get("gitSyncId").asText();
            identity = new GitResourceIdentity(GitResourceType.JSOBJECT_CONFIG, gitSyncId, filePath);
        } else if (filePath.matches(PAGE_DIRECTORY + "/[^/]*/" + ACTION_COLLECTION_DIRECTORY + "/.*\\.js")) {
            Object configContents = readFileValidated(path.getParent().resolve("metadata.json"));
            String gitSyncId =
                    objectMapper.valueToTree(configContents).get("gitSyncId").asText();
            identity = new GitResourceIdentity(GitResourceType.JSOBJECT_DATA, gitSyncId, filePath);
            contents = readFileAsStringValidated(path);
        } else if (filePath.matches(PAGE_DIRECTORY + "/[^/]*/widgets/.*\\.json")) {
            Pattern pageDirPattern = Pattern.compile("(" + PAGE_DIRECTORY + "/([^/]*))/widgets/.*\\.json");
            Matcher matcher = pageDirPattern.matcher(filePath);
            matcher.find();
            String pageDirectory = matcher.group(1);
            String pageName = matcher.group(2) + ".json";
            Object configContents =
                    readFileValidated(baseRepoPath.resolve(pageDirectory).resolve(pageName));
            String gitSyncId =
                    objectMapper.valueToTree(configContents).get("gitSyncId").asText();
            String widgetId = objectMapper.valueToTree(contents).get("widgetId").asText();
            identity = new GitResourceIdentity(GitResourceType.WIDGET_CONFIG, gitSyncId + "-" + widgetId, filePath);
        } else return null;

        return Tuples.of(identity, contents);
    }

    public static boolean isFileFormatCompatible(int savedFileFormat) {
        return savedFileFormat <= CommonConstants.fileFormatVersion;
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
                gitResetMono = fsGitHandler.resetToLastCommit(baseRepoSuffix, branchName, false);
            }

            metadataMono = gitResetMono.map(isSwitched -> {
                Path baseRepoPath = Paths.get(gitServiceConfig.getGitRootPath()).resolve(baseRepoSuffix);
                Object metadata = readFileValidated(baseRepoPath.resolve(CommonConstants.METADATA + JSON_EXTENSION));
                return metadata;
            });
        } catch (GitAPIException | IOException exception) {
            metadataMono = Mono.error(exception);
        }

        return metadataMono.subscribeOn(scheduler);
    }

    @Override
    public Mono<Object> reconstructPackageJsonFromGitRepository(Path repoSuffix) {
        return Mono.error(
                new AppsmithPluginException(AppsmithPluginError.PLUGIN_UNSUPPORTED_OPERATION, "package json creation"));
    }

    @Override
    public Mono<Object> reconstructMetadataFromGitRepository(Path repoSuffix) {
        Mono<Object> metadataMono = Mono.fromCallable(() -> {
            Path baseRepoPath = Paths.get(gitServiceConfig.getGitRootPath()).resolve(repoSuffix);
            return readFileValidated(baseRepoPath.resolve(CommonConstants.METADATA + JSON_EXTENSION));
        });

        return metadataMono.subscribeOn(scheduler);
    }

    @Override
    public Mono<Object> reconstructPageFromGitRepo(
            String pageName,
            String branchName,
            Path baseRepoSuffixPath,
            Boolean resetToLastCommitRequired,
            Boolean keepWorkingDirChanges) {
        Mono<Object> pageObjectMono;
        try {
            Mono<Boolean> resetToLastCommit = Mono.just(Boolean.TRUE);

            if (Boolean.TRUE.equals(resetToLastCommitRequired)) {
                // instead of checking out to last branch we are first cleaning the git repo,
                // then checking out to the desired branch
                resetToLastCommit =
                        fsGitHandler.resetToLastCommit(baseRepoSuffixPath, branchName, keepWorkingDirChanges);
            }

            pageObjectMono = resetToLastCommit.map(isSwitched -> {
                Path pageSuffix = Paths.get(PAGE_DIRECTORY, pageName);
                Path repoPath = Paths.get(gitServiceConfig.getGitRootPath())
                        .resolve(baseRepoSuffixPath)
                        .resolve(pageSuffix);

                Object pageObject = readFileValidated(repoPath.resolve(pageName + JSON_EXTENSION));

                return pageObject;
            });
        } catch (GitAPIException | IOException exception) {
            pageObjectMono = Mono.error(exception);
        }

        return pageObjectMono.subscribeOn(scheduler);
    }
}
