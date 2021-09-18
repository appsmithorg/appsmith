package com.appsmith.git.helpers;

import com.appsmith.external.git.FileInterface;
import com.appsmith.external.models.ApplicationGitReference;
import com.appsmith.external.models.DatasourceStructure;
import com.appsmith.git.configurations.GitServiceConfig;
import com.google.gson.Gson;
import com.google.gson.GsonBuilder;
import com.google.gson.stream.JsonReader;
import lombok.Getter;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.io.FileUtils;
import org.eclipse.jgit.api.Git;
import org.springframework.context.annotation.Import;
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
import java.util.Arrays;
import java.util.HashMap;
import java.util.HashSet;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.stream.Stream;

import static com.appsmith.git.constants.GitDirectories.ACTION_DIRECTORY;
import static com.appsmith.git.constants.GitDirectories.DATASOURCE_DIRECTORY;
import static com.appsmith.git.constants.GitDirectories.PAGE_DIRECTORY;


@Slf4j
@Getter
@RequiredArgsConstructor
@Component
@Import({GitServiceConfig.class})
public class FileUtilsImpl implements FileInterface {

    private final GitServiceConfig gitServiceConfig;

    /**
     * This method will save the complete application in the local repo directory. We are going to use the worktree
     * implementation for branching. This decision has been taken considering the case multiple users can checkout
     * different branches at same time API reference for worktree => https://git-scm.com/docs/git-worktree
     * Path to repo will be : ./container-volumes/git-repo/organizationId/defaultApplicationId/branchName/{application_data}
     * @param baseRepoSuffix path suffix used to create a branch repo path as per worktree implementation
     * @param applicationGitReference application reference object from which entire application can be rehydrated
     * @param branchName name of the branch for the current application
     * @return repo path where the application is stored
     */
    public Mono<Path> saveApplicationToGitRepo(Path baseRepoSuffix,
                                               ApplicationGitReference applicationGitReference,
                                               String branchName,
                                               boolean isDefault) throws IOException {

        Path baseRepo = Paths.get(gitServiceConfig.getGitRootPath()).resolve(baseRepoSuffix);

        // As we are using the worktree path for branches will be like:
        // Children branches : baseRepo/branchName/applicationData
        // Default branch : baseRepo/applicationData
        // baseRepo : root/orgId/defaultAppId/repoName
        Path baseRepoBranchPath = isDefault ? baseRepo : baseRepo.resolve(branchName);

        // Check if this is a valid repo and only then proceed to update the files. We are using the worktrees for each
        // branch present in the local repo so each branch directory will have .git
        Git git = Git.open(baseRepo.toFile());

        Gson gson = new GsonBuilder().disableHtmlEscaping().setPrettyPrinting().create();
        Set<String> validFileNames = new HashSet<>();

        /*
        Application will be stored in the following structure :
        repo
        --Application
        ----Datasource
            --datasource1Name
            --datasource2Name
        ----Actions (Only requirement here is the filename should be unique)
            --action1_page1
            --action2_page2
        ----Pages
            --page1
            --page2
         */

        // Save application
        saveFile(applicationGitReference.getApplication(), baseRepoBranchPath.resolve("application.json"), gson);

        // Save application metadata
        saveFile(applicationGitReference.getMetadata(), baseRepoBranchPath.resolve("metadata.json"), gson);

        // Save pages
        for (Map.Entry<String, Object> resource : applicationGitReference.getPages().entrySet()) {
            saveFile(resource.getValue(), baseRepoBranchPath.resolve(PAGE_DIRECTORY).resolve(resource.getKey() + ".json"), gson);
            validFileNames.add(resource.getKey() + ".json");
        }
        // Scan page directory and delete if any unwanted file if present
        scanAndDeleteFileForDeletedResources(validFileNames, baseRepoBranchPath.resolve(PAGE_DIRECTORY));
        validFileNames.clear();

        // Save actions
        for (Map.Entry<String, Object> resource : applicationGitReference.getActions().entrySet()) {
            saveFile(resource.getValue(), baseRepoBranchPath.resolve(ACTION_DIRECTORY).resolve(resource.getKey() + ".json"), gson);
            validFileNames.add(resource.getKey() + ".json");
        }
        // Scan actions directory and delete if any unwanted file if present
        if (!applicationGitReference.getActions().isEmpty()) {
            scanAndDeleteFileForDeletedResources(validFileNames, baseRepoBranchPath.resolve(ACTION_DIRECTORY));
            validFileNames.clear();
        }

        // Save datasources ref
        for (Map.Entry<String, Object> resource : applicationGitReference.getDatasources().entrySet()) {
            saveFile(resource.getValue(), baseRepoBranchPath.resolve(DATASOURCE_DIRECTORY).resolve(resource.getKey() + ".json"), gson);
            validFileNames.add(resource.getKey() + ".json");
        }
        // Scan page directory and delete if any unwanted file if present
        if (!applicationGitReference.getDatasources().isEmpty()) {
            scanAndDeleteFileForDeletedResources(validFileNames, baseRepoBranchPath.resolve(DATASOURCE_DIRECTORY));
        }
        return Mono.just(baseRepoBranchPath);
    }

    /**
     * This method will be used to store the DB resource to JSON file
     * @param sourceEntity resource extracted from DB to be stored in file
     * @param path file path where the resource to be stored
     * @param gson
     * @return if the file operation is successful
     */
    private boolean saveFile(Object sourceEntity, Path path, Gson gson) {
        try {
            Files.createDirectories(path.getParent());
            try (BufferedWriter fileWriter = Files.newBufferedWriter(path, StandardCharsets.UTF_8)) {
                gson.toJson(sourceEntity, fileWriter);
                return true;
            }
        } catch (IOException e) {
            log.debug(e.getMessage());
        }
        return false;
    }

    /**
     * This method will delete the JSON resource available in local git directory on subsequent commit made after the
     * deletion of respective resource from DB
     * @param validResources resources those are still available in DB
     * @param resourceDirectory directory which needs to be scanned for possible file deletion operations
     */
    private void scanAndDeleteFileForDeletedResources(Set<String> validResources, Path resourceDirectory) {
        // Scan resource directory and delete any unwanted file if present
        // unwanted file : corresponding resource from DB has been deleted
        try (Stream<Path> paths = Files.walk(resourceDirectory)) {
            paths
                .filter(path -> Files.isRegularFile(path) && !validResources.contains(path.getFileName().toString()))
                .forEach(path -> deleteFile(path, false));
        } catch (IOException e) {
            log.debug("Error while scanning directory: {}, with error {}", resourceDirectory, e);
        }
    }

    /**
     * This method will delete the file from local repo
     * @param filePath file that needs to be deleted
     * @param isDirectory if the file is directory
     * @return if the deletion operation was successful
     */
    private boolean deleteFile(Path filePath, boolean isDirectory) {
        try
        {
            return Files.deleteIfExists(filePath);
        }
        catch(DirectoryNotEmptyException e)
        {
            log.debug("Unable to delete non-empty directory at {}", filePath);
        }
        catch(IOException e)
        {
            log.debug("Unable to delete file, {}", e.getMessage());
        }
        return false;
    }

    /**
     * This will reconstruct the application from the repo
     * @param organisationId To which organisation application needs to be rehydrated
     * @param defaultApplicationId To which organisation application needs to be rehydrated
     * @param branchName for which the application needs to be rehydrate
     * @return application reference from which entire application can be rehydrated
     */
    public ApplicationGitReference reconstructApplicationFromGitRepo(String organisationId,
                                                                     String defaultApplicationId,
                                                                     String branchName) {

        // For implementing a branching model we are using worktree structure so each branch will have the separate
        // directory, this decision has been taken considering multiple users can checkout different branches at same
        // time
        // API reference for worktree : https://git-scm.com/docs/git-worktree

        Path baseRepoPath = Paths.get(gitServiceConfig.getGitRootPath(), organisationId, defaultApplicationId, branchName);
        ApplicationGitReference applicationGitReference = new ApplicationGitReference();


        // Instance creator is required while de-serialising using Gson as key instance can't be invoked with
        // no-args constructor
        Gson gson = new GsonBuilder()
            .registerTypeAdapter(DatasourceStructure.Key.class, new DatasourceStructure.KeyInstanceCreator())
            .create();

        // Extract application data from the json
        applicationGitReference.setApplication(
            readFile( baseRepoPath.resolve("application.json"), gson)
        );

        // Extract application metadata from the json
        applicationGitReference.setMetadata(readFile(baseRepoPath.resolve("metadata.json"), gson));

        // Extract actions
        applicationGitReference.setActions(readFiles(baseRepoPath.resolve(ACTION_DIRECTORY), gson));

        // Extract pages
        applicationGitReference.setPages(readFiles(baseRepoPath.resolve(PAGE_DIRECTORY), gson));

        // Extract datasources
        applicationGitReference.setDatasources(readFiles(baseRepoPath.resolve(DATASOURCE_DIRECTORY), gson));

        return applicationGitReference;
    }

    /** This is used to initialize repo with Readme file when the application is connected to remote repo
     * @param baseRepoSuffix       path suffix used to create a branch repo path as per worktree implementation
     * @param defaultPageId        Used to construct the url of the published app
     * @param applicationId        Used to construct the url of the published app
     * @param baseUrlOfApplication Used to construct the url of the published app
     * @return Path to the base repo
     * @throws IOException
     */
    @Override
    public Mono<Path> initializeGitRepo(Path baseRepoSuffix,
                                        String defaultPageId,
                                        String applicationId,
                                        String baseUrlOfApplication) throws IOException {
        ClassLoader classLoader = getClass().getClassLoader();
        File file = new File(classLoader.getResource(gitServiceConfig.getInitialTemplatePath()).getFile());
        String viewModeUrl = Paths.get(baseUrlOfApplication, applicationId, "application", "pages", defaultPageId).toString();
        String editModeUrl = Paths.get(viewModeUrl, "edit").toString();
        String data = FileUtils.readFileToString(file, "UTF-8").replace("{{viewModeUrl}}", viewModeUrl);
        data = data.replace("{{editModeUrl}}", editModeUrl);

        file = new File(Paths.get(gitServiceConfig.getGitRootPath()).resolve(baseRepoSuffix).toFile().toString());
        FileUtils.writeStringToFile(file, data, "UTF-8", false);

        return Mono.just(baseRepoSuffix);
    }

    /**
     * This method will be used to read and dehydrate the json file present from the local git repo
     * @param filePath file on which the read operation will be performed
     * @param gson
     * @return resource stored in the JSON file
     */
    private Object readFile(Path filePath, Gson gson) {

        Object file;
        try (JsonReader reader = new JsonReader(new FileReader(filePath.toFile()))) {
            file = gson.fromJson(reader, Object.class);
        } catch (Exception e) {
            log.debug(e.getMessage());
            return null;
        }
        return file;
    }

    /**
     * This method will be used to read and dehydrate the json files present from the local git repo
     * @param directoryPath directory path for files on which read operation will be performed
     * @param gson
     * @return resources stored in the directory
     */
    private Map<String, Object> readFiles(Path directoryPath, Gson gson) {
        Map<String, Object> resource = new HashMap<>();
        File directory = directoryPath.toFile();
        if (directory.isDirectory()) {
            Arrays.stream(Objects.requireNonNull(directory.listFiles())).forEach(file -> {
                try (JsonReader reader = new JsonReader(new FileReader(file))) {
                    resource.put(file.getName(), gson.fromJson(reader, Object.class));
                } catch (Exception e) {
                    log.debug(e.getMessage());
                }
            });
        }
        return resource;
    }
}
