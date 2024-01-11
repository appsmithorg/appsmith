package com.appsmith.git.helpers;

import com.appsmith.external.git.FileInterface;
import com.appsmith.external.git.GitExecutor;
import com.appsmith.external.models.ApplicationGitReference;
import com.appsmith.git.configurations.GitServiceConfig;
import com.appsmith.git.constants.CommonConstants;
import com.appsmith.git.helpers.ce.FileUtilsCEImpl;
import com.google.gson.Gson;
import lombok.Getter;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Import;
import org.springframework.stereotype.Component;
import org.springframework.util.CollectionUtils;
import org.springframework.util.StringUtils;

import java.io.File;
import java.nio.file.Path;
import java.util.HashMap;
import java.util.HashSet;
import java.util.Map;
import java.util.Objects;
import java.util.Set;

import static com.appsmith.external.constants.GitConstants.MODULE_INSTANCE_LIST;
import static com.appsmith.external.constants.GitConstants.NAME_SEPARATOR;
import static com.appsmith.git.constants.GitDirectories.MODULES_DIRECTORY;
import static com.appsmith.git.constants.GitDirectories.MODULE_INSTANCES_DIRECTORY;
import static com.appsmith.git.constants.GitDirectories.PAGE_DIRECTORY;

@Slf4j
@Getter
@Component
@Import({GitServiceConfig.class})
public class FileUtilsImpl extends FileUtilsCEImpl implements FileInterface {

    public FileUtilsImpl(GitServiceConfig gitServiceConfig, GitExecutor gitExecutor) {
        super(gitServiceConfig, gitExecutor);
    }

    @Override
    protected Set<String> updateEntitiesInRepo(
            ApplicationGitReference applicationGitReference, Path baseRepo, Gson gson) {

        Set<String> validPages = super.updateEntitiesInRepo(applicationGitReference, baseRepo, gson);

        Map<String, Set<String>> updatedResources = applicationGitReference.getUpdatedResources();
        Path pageDirectory = baseRepo.resolve(PAGE_DIRECTORY);

        // Create HashMap for valid module instances
        HashMap<String, Set<String>> validModuleInstancesMap = new HashMap<>();
        validPages.forEach(validPage -> {
            validModuleInstancesMap.put(validPage, new HashSet<>());
        });

        // Save module instances ref, if they exist
        Set<String> validModuleInstanceFileNames = new HashSet<>();
        if (applicationGitReference.getModuleInstances() != null
                && !applicationGitReference.getModuleInstances().isEmpty()) {
            for (Map.Entry<String, Object> resource :
                    applicationGitReference.getModuleInstances().entrySet()) {

                String[] names = resource.getKey().split(NAME_SEPARATOR);
                if (names.length > 1 && StringUtils.hasLength(names[1])) {
                    final String moduleInstanceName = names[0];
                    final String pageName = names[1];
                    Path pageSpecificDirectory = pageDirectory.resolve(pageName);
                    Path moduleInstanceSpecificDirectory = pageSpecificDirectory.resolve(MODULE_INSTANCES_DIRECTORY);

                    if (!validModuleInstancesMap.containsKey(pageName)) {
                        validModuleInstancesMap.put(pageName, new HashSet<>());
                    }
                    validModuleInstancesMap.get(pageName).add(moduleInstanceName + CommonConstants.JSON_EXTENSION);
                    Boolean isResourceUpdated = !CollectionUtils.isEmpty(updatedResources.get(MODULE_INSTANCE_LIST))
                            ? updatedResources.get(MODULE_INSTANCE_LIST).contains(resource.getKey())
                            : Boolean.FALSE;
                    if (Boolean.TRUE.equals(isResourceUpdated)) {
                        saveResource(
                                resource.getValue(),
                                moduleInstanceSpecificDirectory.resolve(
                                        moduleInstanceName + CommonConstants.JSON_EXTENSION),
                                gson);
                        validModuleInstanceFileNames.add(moduleInstanceName + CommonConstants.JSON_EXTENSION);
                    }
                }
            }
        }

        // Scan module instances directory and delete any unwanted files if present
        validModuleInstancesMap.forEach((pageName, validModuleInstanceNames) -> {
            Path pageSpecificDirectory = pageDirectory.resolve(pageName);
            scanAndDeleteFileForDeletedResources(
                    validModuleInstanceNames, pageSpecificDirectory.resolve(MODULE_INSTANCES_DIRECTORY));
        });

        // Save modules ref, if they exist
        Set<String> validModuleFileNames = new HashSet<>();
        if (applicationGitReference.getModules() != null
                && !applicationGitReference.getModules().isEmpty()) {
            for (Map.Entry<String, Object> resource :
                    applicationGitReference.getModules().entrySet()) {
                String[] names = resource.getKey().split(NAME_SEPARATOR);
                if (names.length > 1 && StringUtils.hasLength(names[1])) {
                    final String moduleName = names[0];

                    saveResource(
                            resource.getValue(),
                            baseRepo.resolve(MODULES_DIRECTORY).resolve(moduleName + CommonConstants.JSON_EXTENSION),
                            gson);
                    validModuleFileNames.add(moduleName + CommonConstants.JSON_EXTENSION);
                }
            }
        }
        // Scan modules directory and delete any unwanted files if present
        scanAndDeleteFileForDeletedResources(validModuleFileNames, baseRepo.resolve(MODULES_DIRECTORY));

        return validPages;
    }

    @Override
    protected void updateGitApplicationReferenceV2(
            Path baseRepoPath,
            Gson gson,
            ApplicationGitReference applicationGitReference,
            Path pageDirectory,
            int fileFormatVersion) {

        super.updateGitApplicationReferenceV2(
                baseRepoPath, gson, applicationGitReference, pageDirectory, fileFormatVersion);

        // Extract module instances
        File directory = pageDirectory.toFile();
        Map<String, Object> moduleInstanceMap = new HashMap<>();
        if (directory.isDirectory()) {
            // Loop through all the directories and nested directories inside the pages directory to extract
            // pages, actions and actionCollections from the JSON files
            for (File page : Objects.requireNonNull(directory.listFiles())) {
                if (page.isDirectory()) {
                    moduleInstanceMap.putAll(readFiles(
                            page.toPath().resolve(MODULE_INSTANCES_DIRECTORY), gson, CommonConstants.EMPTY_STRING));
                }
            }
        }
        applicationGitReference.setModuleInstances(moduleInstanceMap);

        // Extract modules
        applicationGitReference.setModules(
                readFiles(baseRepoPath.resolve(MODULES_DIRECTORY), gson, CommonConstants.EMPTY_STRING));
    }
}
