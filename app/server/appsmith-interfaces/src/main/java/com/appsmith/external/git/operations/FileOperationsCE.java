package com.appsmith.external.git.operations;

import com.appsmith.external.models.ApplicationGitReference;
import org.json.JSONObject;
import reactor.core.publisher.Mono;

import java.io.IOException;
import java.nio.file.Path;
import java.util.Map;
import java.util.Set;

public interface FileOperationsCE {
    void saveMetadataResource(ApplicationGitReference applicationGitReference, Path baseRepo);

    boolean saveResource(Object sourceEntity, Path path);

    void saveWidgets(JSONObject sourceEntity, String resourceName, Path path);

    boolean writeToFile(Object sourceEntity, Path path) throws IOException;

    void scanAndDeleteFileForDeletedResources(Set<String> validResources, Path resourceDirectory);

    void scanAndDeleteDirectoryForDeletedResources(Set<String> validResources, Path resourceDirectory);

    void deleteDirectory(Path directory);

    void deleteFile(Path filePath);

    Object readFile(Path filePath);

    Map<String, Object> readFiles(Path directoryPath, String keySuffix);

    String readFileAsString(Path filePath);

    Integer getFileFormatVersion(Object metadata);

    JSONObject getMainContainer(Object pageJson);

    Mono<Long> deleteIndexLockFile(Path path, int validTimeInSeconds);
}
