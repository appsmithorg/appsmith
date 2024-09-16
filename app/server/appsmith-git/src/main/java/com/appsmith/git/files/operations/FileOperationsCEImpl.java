package com.appsmith.git.files.operations;

import com.appsmith.external.converters.ISOStringToInstantConverter;
import com.appsmith.external.git.GitExecutor;
import com.appsmith.external.git.constants.GitSpan;
import com.appsmith.external.helpers.ObservationHelper;
import com.appsmith.external.models.ApplicationGitReference;
import com.appsmith.external.models.BaseDomain;
import com.appsmith.external.models.DatasourceStructure;
import com.appsmith.git.configurations.GitServiceConfig;
import com.appsmith.git.constants.CommonConstants;
import com.appsmith.git.converters.GsonDoubleToLongConverter;
import com.appsmith.git.converters.GsonUnorderedToOrderedConverter;
import com.google.gson.Gson;
import com.google.gson.GsonBuilder;
import com.google.gson.JsonElement;
import com.google.gson.JsonObject;
import io.micrometer.tracing.Span;
import lombok.Getter;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.io.FileUtils;
import org.json.JSONArray;
import org.json.JSONObject;
import org.springframework.context.annotation.Import;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Scheduler;
import reactor.core.scheduler.Schedulers;

import java.io.BufferedWriter;
import java.io.File;
import java.io.FileReader;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.DirectoryNotEmptyException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.attribute.BasicFileAttributes;
import java.nio.file.attribute.FileTime;
import java.time.Instant;
import java.util.Arrays;
import java.util.HashMap;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.regex.Pattern;
import java.util.stream.Stream;

import static com.appsmith.external.git.constants.ce.GitConstantsCE.GitMetricConstantsCE.METADATA;
import static com.appsmith.external.git.constants.ce.GitConstantsCE.GitMetricConstantsCE.RESOURCE_TYPE;
import static com.appsmith.external.git.constants.ce.GitConstantsCE.GitMetricConstantsCE.WIDGETS;

@Slf4j
@Getter
@Deprecated(forRemoval = true, since = "v1.42")
@Import({GitServiceConfig.class})
public class FileOperationsCEImpl {

    private final GitServiceConfig gitServiceConfig;
    private final GitExecutor gitExecutor;
    private final Gson gson;

    protected final ObservationHelper observationHelper;

    private static final String EDIT_MODE_URL_TEMPLATE = "{{editModeUrl}}";

    private static final String VIEW_MODE_URL_TEMPLATE = "{{viewModeUrl}}";

    private static final Pattern ALLOWED_FILE_EXTENSION_PATTERN =
            Pattern.compile("(.*?)\\.(md|MD|git|gitignore|github|yml|yaml)$");

    private final Scheduler scheduler = Schedulers.boundedElastic();

    private static final String CANVAS_WIDGET = "(Canvas)[0-9]*.";

    public FileOperationsCEImpl(
            GitServiceConfig gitServiceConfig,
            GitExecutor gitExecutor,
            GsonBuilder gsonBuilder,
            ObservationHelper observationHelper) {
        this.gitServiceConfig = gitServiceConfig;
        this.gitExecutor = gitExecutor;

        // Gson to pretty format JSON file
        // Keep Long type as is by default GSON have behavior to convert to Double
        // Convert unordered set to ordered one
        this.gson = gsonBuilder
                .registerTypeAdapter(Double.class, new GsonDoubleToLongConverter())
                .registerTypeAdapter(Set.class, new GsonUnorderedToOrderedConverter())
                .registerTypeAdapter(Map.class, new GsonUnorderedToOrderedConverter())
                .registerTypeAdapter(Instant.class, new ISOStringToInstantConverter())
                // Instance creator is required while de-serialising using Gson as key instance can't be invoked
                // with no-args constructor
                .registerTypeAdapter(DatasourceStructure.Key.class, new DatasourceStructure.KeyInstanceCreator())
                .disableHtmlEscaping()
                .setPrettyPrinting()
                .create();

        this.observationHelper = observationHelper;
    }

    @Deprecated(forRemoval = true, since = "v1.42")
    public void saveMetadataResource(ApplicationGitReference applicationGitReference, Path baseRepo) {
        JsonObject metadata = gson.fromJson(gson.toJson(applicationGitReference.getMetadata()), JsonObject.class);
        metadata.addProperty(CommonConstants.FILE_FORMAT_VERSION, CommonConstants.fileFormatVersion);
        saveResource(metadata, baseRepo.resolve(CommonConstants.METADATA + CommonConstants.JSON_EXTENSION));
    }

    /**
     * This method will be used to store the DB resource to JSON file
     *
     * @param sourceEntity resource extracted from DB to be stored in file
     * @param path         file path where the resource to be stored
     * @return if the file operation is successful
     */
    @Deprecated(forRemoval = true, since = "v1.42")
    public boolean saveResource(Object sourceEntity, Path path) {
        try {
            Files.createDirectories(path.getParent());
            return writeToFile(sourceEntity, path);
        } catch (IOException e) {
            log.error("Error while writing resource to file {} with {}", path, e.getMessage());
            log.debug(e.getMessage());
        }
        return false;
    }

    @Deprecated(forRemoval = true, since = "v1.42")
    public void saveWidgets(JSONObject sourceEntity, String resourceName, Path path) {
        Span span = observationHelper.createSpan(GitSpan.FILE_WRITE);
        try {
            Files.createDirectories(path);
            String resourceType = WIDGETS;
            span.tag(RESOURCE_TYPE, resourceType);
            observationHelper.startSpan(span, true);

            writeStringToFile(sourceEntity.toString(4), path.resolve(resourceName + CommonConstants.JSON_EXTENSION));
        } catch (IOException e) {
            log.debug("Error while writings widgets data to file, {}", e.getMessage());
        } finally {
            observationHelper.endSpan(span, true);
        }
    }

    @Deprecated(forRemoval = true, since = "v1.42")
    public void writeStringToFile(String sourceEntity, Path path) throws IOException {
        try (BufferedWriter fileWriter = Files.newBufferedWriter(path, StandardCharsets.UTF_8)) {
            fileWriter.write(sourceEntity);
        }
    }

    @Deprecated(forRemoval = true, since = "v1.42")
    public boolean writeToFile(Object sourceEntity, Path path) throws IOException {
        Span span = observationHelper.createSpan(GitSpan.FILE_WRITE);
        String resourceType = sourceEntity.getClass().getSimpleName();
        if (!(sourceEntity instanceof BaseDomain)) {
            resourceType = METADATA;
        }
        span.tag(RESOURCE_TYPE, resourceType);
        observationHelper.startSpan(span, true);

        try (BufferedWriter fileWriter = Files.newBufferedWriter(path, StandardCharsets.UTF_8)) {
            gson.toJson(sourceEntity, fileWriter);
            return true;
        } finally {
            observationHelper.endSpan(span, true);
        }
    }

    /**
     * This method will delete the JSON resource available in local git directory on subsequent commit made after the
     * deletion of respective resource from DB
     *
     * @param validResources    resources those are still available in DB
     * @param resourceDirectory directory which needs to be scanned for possible file deletion operations
     */
    @Deprecated(forRemoval = true, since = "v1.42")
    public void scanAndDeleteFileForDeletedResources(Set<String> validResources, Path resourceDirectory) {
        // Scan resource directory and delete any unwanted file if present
        // unwanted file : corresponding resource from DB has been deleted
        if (resourceDirectory.toFile().exists()) {
            try (Stream<Path> paths = Files.walk(resourceDirectory)) {
                paths.filter(pathLocal -> Files.isRegularFile(pathLocal)
                                && !validResources.contains(
                                        pathLocal.getFileName().toString()))
                        .forEach(this::deleteFile);
            } catch (IOException e) {
                log.error("Error while scanning directory: {}, with error {}", resourceDirectory, e.getMessage());
            }
        }
    }

    /**
     * This method will delete the JSON resource directory available in local git directory on subsequent commit made after the
     * deletion of respective resource from DB
     *
     * @param validResources    resources those are still available in DB
     * @param resourceDirectory directory which needs to be scanned for possible file deletion operations
     */
    @Deprecated(forRemoval = true, since = "v1.42")
    public void scanAndDeleteDirectoryForDeletedResources(Set<String> validResources, Path resourceDirectory) {
        // Scan resource directory and delete any unwanted directory if present
        // unwanted directory : corresponding resource from DB has been deleted
        if (resourceDirectory.toFile().exists()) {
            try (Stream<Path> paths = Files.walk(resourceDirectory, 1)) {
                paths.filter(path -> Files.isDirectory(path)
                                && !path.equals(resourceDirectory)
                                && !validResources.contains(path.getFileName().toString()))
                        .forEach(this::deleteDirectory);
            } catch (IOException e) {
                log.error("Error while scanning directory {} with error {}", resourceDirectory, e.getMessage());
            }
        }
    }

    /**
     * This method will delete the directory and all its contents
     *
     * @param directory
     */
    @Deprecated(forRemoval = true, since = "v1.42")
    public void deleteDirectory(Path directory) {
        if (directory.toFile().exists()) {
            try {
                FileUtils.deleteDirectory(directory.toFile());
            } catch (IOException e) {
                log.error("Unable to delete directory for path {} with message {}", directory, e.getMessage());
            }
        }
    }

    /**
     * This method will delete the file from local repo
     *
     * @param filePath file that needs to be deleted
     */
    @Deprecated(forRemoval = true, since = "v1.42")
    public void deleteFile(Path filePath) {
        try {
            Files.deleteIfExists(filePath);
        } catch (DirectoryNotEmptyException e) {
            log.error("Unable to delete non-empty directory at {} with cause", filePath, e.getMessage());
        } catch (IOException e) {
            log.error("Unable to delete file {} with {}", filePath, e.getMessage());
        }
    }

    /**
     * This method will be used to read and dehydrate the json file present from the local git repo
     *
     * @param filePath file on which the read operation will be performed
     * @return resource stored in the JSON file
     */
    @Deprecated(forRemoval = true, since = "v1.42")
    public Object readFile(Path filePath) {
        Span span = observationHelper.createSpan(GitSpan.FILE_READ);
        observationHelper.startSpan(span, true);

        Object file;
        try (FileReader reader = new FileReader(filePath.toFile())) {
            file = gson.fromJson(reader, Object.class);
        } catch (Exception e) {
            log.error("Error while reading file {} with message {} with cause", filePath, e.getMessage(), e.getCause());
            return null;
        } finally {
            observationHelper.endSpan(span, true);
        }
        return file;
    }

    /**
     * This method will be used to read and dehydrate the json files present from the local git repo
     *
     * @param directoryPath directory path for files on which read operation will be performed
     * @return resources stored in the directory
     */
    @Deprecated(forRemoval = true, since = "v1.42")
    public Map<String, Object> readFiles(Path directoryPath, String keySuffix) {
        Map<String, Object> resource = new HashMap<>();
        File directory = directoryPath.toFile();
        if (directory.isDirectory()) {
            Arrays.stream(Objects.requireNonNull(directory.listFiles())).forEach(file -> {
                try (FileReader reader = new FileReader(file)) {
                    resource.put(file.getName() + keySuffix, gson.fromJson(reader, Object.class));
                } catch (Exception e) {
                    log.error(
                            "Error while reading file {} with message {} with cause",
                            file.toPath(),
                            e.getMessage(),
                            e.getCause());
                }
            });
        }
        return resource;
    }

    /**
     * This method will read the content of the file as a plain text and does not apply the gson to json transformation
     *
     * @param filePath file path for files on which read operation will be performed
     * @return content of the file in the path
     */
    @Deprecated(forRemoval = true, since = "v1.42")
    public String readFileAsString(Path filePath) {
        Span span = observationHelper.createSpan(GitSpan.FILE_READ);
        observationHelper.startSpan(span, true);
        String data = CommonConstants.EMPTY_STRING;
        try {
            data = FileUtils.readFileToString(filePath.toFile(), "UTF-8");
        } catch (IOException e) {
            log.error("Error while reading the file from git repo {} ", e.getMessage());
        } finally {
            observationHelper.endSpan(span, true);
        }
        return data;
    }

    @Deprecated(forRemoval = true, since = "v1.42")
    public Integer getFileFormatVersion(Object metadata) {
        if (metadata == null) {
            return 1;
        }
        JsonObject json = gson.fromJson(gson.toJson(metadata), JsonObject.class);
        JsonElement fileFormatVersion = json.get(CommonConstants.FILE_FORMAT_VERSION);
        return fileFormatVersion.getAsInt();
    }

    @Deprecated(forRemoval = true, since = "v1.42")
    public JSONObject getMainContainer(Object pageJson) {
        JSONObject pageJSON = new JSONObject(gson.toJson(pageJson));
        JSONArray layouts = pageJSON.getJSONObject("unpublishedPage").getJSONArray("layouts");
        return layouts.getJSONObject(0).getJSONObject("dsl");
    }

    @Deprecated(forRemoval = true, since = "v1.42")
    public Mono<Long> deleteIndexLockFile(Path path, int validTimeInSeconds) {
        // Check the time created of the index.lock file
        // If the File is stale for more than validTime, then delete the file
        try {
            BasicFileAttributes attr = Files.readAttributes(path, BasicFileAttributes.class);
            FileTime fileTime = attr.creationTime();
            Instant now = Instant.now();
            Instant validCreateTime = now.minusSeconds(validTimeInSeconds);
            if (fileTime.toInstant().isBefore(validCreateTime)) {
                // Add base repo path
                path = Paths.get(path + ".lock");
                deleteFile(path);
                return Mono.just(now.minusMillis(fileTime.toMillis()).getEpochSecond());
            } else {
                return Mono.just(0L);
            }
        } catch (IOException ex) {
            log.error("Error reading index.lock file: {}", ex.getMessage());
            return Mono.just(0L);
        }
    }
}
