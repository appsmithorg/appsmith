package com.appsmith.git.files.operations;

import com.appsmith.external.annotations.FeatureFlagged;
import com.appsmith.external.enums.FeatureFlagEnum;
import com.appsmith.external.git.GitExecutor;
import com.appsmith.external.git.constants.GitSpan;
import com.appsmith.external.git.operations.FileOperationsCE;
import com.appsmith.external.helpers.ObservationHelper;
import com.appsmith.external.models.ApplicationGitReference;
import com.appsmith.external.models.BaseDomain;
import com.appsmith.external.views.Git;
import com.appsmith.git.configurations.GitServiceConfig;
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
import com.google.gson.GsonBuilder;
import io.micrometer.tracing.Span;
import lombok.Getter;
import lombok.extern.slf4j.Slf4j;
import org.json.JSONObject;
import org.springframework.context.annotation.Import;
import org.springframework.stereotype.Component;

import java.io.BufferedWriter;
import java.io.File;
import java.io.FileReader;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Arrays;
import java.util.HashMap;
import java.util.Map;
import java.util.Objects;

import static com.appsmith.external.git.constants.ce.GitConstantsCE.GitMetricConstantsCE.METADATA;
import static com.appsmith.external.git.constants.ce.GitConstantsCE.GitMetricConstantsCE.RESOURCE_TYPE;
import static com.appsmith.external.git.constants.ce.GitConstantsCE.GitMetricConstantsCE.WIDGETS;

@Slf4j
@Getter
@Component
@Import({GitServiceConfig.class})
public class FileOperationsCEv2Impl extends FileOperationsCEImpl implements FileOperationsCE {

    protected final ObjectMapper objectMapper;
    protected final ObjectReader objectReader;
    protected final ObjectWriter objectWriter;

    private final ObservationHelper observationHelper;

    public FileOperationsCEv2Impl(
            GitServiceConfig gitServiceConfig,
            GitExecutor gitExecutor,
            GsonBuilder gsonBuilder,
            PrettyPrinter prettyPrinter,
            ObservationHelper observationHelper) {
        super(gitServiceConfig, gitExecutor, gsonBuilder, observationHelper);

        this.objectMapper = SerializationUtils.getBasicObjectMapper(prettyPrinter);

        // this is done in order to stop importing float values as int while deserializing
        this.objectReader = objectMapper.readerWithView(Git.class).without(DeserializationFeature.ACCEPT_FLOAT_AS_INT);

        this.objectWriter = objectMapper.writerWithView(Git.class);
        this.observationHelper = observationHelper;
    }

    @FeatureFlagged(featureFlagName = FeatureFlagEnum.release_git_autocommit_feature_enabled)
    @Override
    public void saveMetadataResource(ApplicationGitReference applicationGitReference, Path baseRepo) {
        ObjectNode metadata = objectMapper.valueToTree(applicationGitReference.getMetadata());
        metadata.put(CommonConstants.FILE_FORMAT_VERSION, CommonConstants.fileFormatVersion);
        saveResource(metadata, baseRepo.resolve(CommonConstants.METADATA + CommonConstants.JSON_EXTENSION));
    }

    @FeatureFlagged(featureFlagName = FeatureFlagEnum.release_git_autocommit_feature_enabled)
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

    @FeatureFlagged(featureFlagName = FeatureFlagEnum.release_git_autocommit_feature_enabled)
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
    @FeatureFlagged(featureFlagName = FeatureFlagEnum.release_git_autocommit_feature_enabled)
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
    @FeatureFlagged(featureFlagName = FeatureFlagEnum.release_git_autocommit_feature_enabled)
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

    @FeatureFlagged(featureFlagName = FeatureFlagEnum.release_git_autocommit_feature_enabled)
    @Override
    public Integer getFileFormatVersion(Object metadata) {
        if (metadata == null) {
            return 1;
        }
        JsonNode json = objectMapper.valueToTree(metadata);
        int fileFormatVersion = json.get(CommonConstants.FILE_FORMAT_VERSION).asInt();
        return fileFormatVersion;
    }

    @FeatureFlagged(featureFlagName = FeatureFlagEnum.release_git_autocommit_feature_enabled)
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
}
