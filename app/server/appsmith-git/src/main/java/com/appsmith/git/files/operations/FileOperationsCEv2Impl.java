package com.appsmith.git.files.operations;

import com.appsmith.external.git.constants.GitSpan;
import com.appsmith.external.git.operations.FileOperationsCE;
import com.appsmith.external.helpers.ObservationHelper;
import com.appsmith.external.models.ApplicationGitReference;
import com.appsmith.external.models.BaseDomain;
import com.appsmith.external.views.Git;
import com.appsmith.git.constants.CommonConstants;
import com.appsmith.util.SerializationUtils;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.PrettyPrinter;
import com.fasterxml.jackson.databind.DeserializationFeature;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.ObjectReader;
import com.fasterxml.jackson.databind.ObjectWriter;
import com.fasterxml.jackson.databind.node.ObjectNode;
import io.micrometer.tracing.Span;
import lombok.Getter;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.io.FileUtils;
import org.json.JSONObject;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Mono;

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
import java.util.stream.Stream;

import static com.appsmith.external.git.constants.ce.GitConstantsCE.GitMetricConstantsCE.METADATA;
import static com.appsmith.external.git.constants.ce.GitConstantsCE.GitMetricConstantsCE.RESOURCE_TYPE;
import static com.appsmith.external.git.constants.ce.GitConstantsCE.GitMetricConstantsCE.WIDGETS;

@Slf4j
@Getter
@Component
public class FileOperationsCEv2Impl implements FileOperationsCE {

    protected final ObjectMapper objectMapper;
    protected final ObjectReader objectReader;
    protected final ObjectWriter objectWriter;

    private final ObservationHelper observationHelper;

    public FileOperationsCEv2Impl(PrettyPrinter prettyPrinter, ObservationHelper observationHelper) {

        this.objectMapper = SerializationUtils.getBasicObjectMapper(prettyPrinter);

        // this is done in order to stop importing float values as int while deserializing
        this.objectReader = objectMapper.readerWithView(Git.class).without(DeserializationFeature.ACCEPT_FLOAT_AS_INT);

        this.objectWriter = objectMapper.writerWithView(Git.class);
        this.observationHelper = observationHelper;
    }

    @Override
    public void saveMetadataResource(ApplicationGitReference applicationGitReference, Path baseRepo) {
        ObjectNode metadata = objectMapper.valueToTree(applicationGitReference.getMetadata());
        metadata.put(CommonConstants.FILE_FORMAT_VERSION, CommonConstants.fileFormatVersion);
        saveResource(metadata, baseRepo.resolve(CommonConstants.METADATA + CommonConstants.JSON_EXTENSION));
    }

    @Override
    public void saveWidgets(JSONObject sourceEntity, String resourceName, Path path) {
        Span span = observationHelper.createSpan(GitSpan.FILE_WRITE);
        try {
            Files.createDirectories(path);
            String resourceType = WIDGETS;
            span.tag(RESOURCE_TYPE, resourceType);
            observationHelper.startSpan(span, true);

            writeToFile(
                    objectReader.readTree(sourceEntity.toString()),
                    path.resolve(resourceName + CommonConstants.JSON_EXTENSION));
        } catch (IOException e) {
            log.debug("Error while writings widgets data to file, {}", e.getMessage());
        } finally {
            observationHelper.endSpan(span, true);
        }
    }

    @Override
    public boolean writeToFile(Object sourceEntity, Path path) throws IOException {
        Span span = observationHelper.createSpan(GitSpan.FILE_WRITE);
        String resourceType = sourceEntity.getClass().getSimpleName();
        if (!(sourceEntity instanceof BaseDomain)) {
            resourceType = METADATA;
        }
        span.tag(RESOURCE_TYPE, resourceType);
        observationHelper.startSpan(span, true);

        try (BufferedWriter fileWriter = Files.newBufferedWriter(path, StandardCharsets.UTF_8)) {
            objectWriter.writeValue(fileWriter, sourceEntity);
            return true;
        } finally {
            observationHelper.endSpan(span, true);
        }
    }

    /**
     * This method will be used to read and dehydrate the json file present from the local git repo
     *
     * @param filePath file on which the read operation will be performed
     * @return resource stored in the JSON file
     */
    @Override
    public Object readFile(Path filePath) {
        Span span = observationHelper.createSpan(GitSpan.FILE_READ);
        observationHelper.startSpan(span, true);

        Object file;
        try (FileReader reader = new FileReader(filePath.toFile())) {
            file = objectReader.readValue(reader, Object.class);
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
    @Override
    public Map<String, Object> readFiles(Path directoryPath, String keySuffix) {
        Map<String, Object> resource = new HashMap<>();
        File directory = directoryPath.toFile();
        if (directory.isDirectory()) {
            Arrays.stream(Objects.requireNonNull(directory.listFiles())).forEach(file -> {
                try (FileReader reader = new FileReader(file)) {
                    resource.put(file.getName() + keySuffix, objectReader.readValue(reader, Object.class));
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

    @Override
    public Integer getFileFormatVersion(Object metadata) {
        if (metadata == null) {
            return 1;
        }
        JsonNode json = objectMapper.valueToTree(metadata);
        int fileFormatVersion = json.get(CommonConstants.FILE_FORMAT_VERSION).asInt();
        return fileFormatVersion;
    }

    @Override
    public JSONObject getMainContainer(Object pageJson) {
        JsonNode pageJSON = objectMapper.valueToTree(pageJson);
        try {
            return new JSONObject(objectMapper.writeValueAsString(
                    pageJSON.get("unpublishedPage").get("layouts").get(0).get("dsl")));
        } catch (JsonProcessingException e) {
            throw new RuntimeException(e);
        }
    }

    /**
     * This method will be used to store the DB resource to JSON file
     *
     * @param sourceEntity resource extracted from DB to be stored in file
     * @param path         file path where the resource to be stored
     * @return if the file operation is successful
     */
    @Override
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

    /**
     * This method will delete the JSON resource available in local git directory on subsequent commit made after the
     * deletion of respective resource from DB
     *
     * @param validResources    resources those are still available in DB
     * @param resourceDirectory directory which needs to be scanned for possible file deletion operations
     */
    @Override
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
    @Override
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
    @Override
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
    @Override
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
     * This method will read the content of the file as a plain text and does not apply the gson to json transformation
     *
     * @param filePath file path for files on which read operation will be performed
     * @return content of the file in the path
     */
    @Override
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

    @Override
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
