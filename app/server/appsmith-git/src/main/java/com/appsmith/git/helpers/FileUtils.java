package com.appsmith.git.helpers;

import com.appsmith.external.git.FileInterface;
import com.appsmith.external.models.ApplicationGitReference;
import com.appsmith.external.models.DatasourceStructure;
import com.google.gson.Gson;
import com.google.gson.GsonBuilder;
import com.google.gson.stream.JsonReader;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Mono;

import java.io.File;
import java.io.FileNotFoundException;
import java.io.FileReader;
import java.io.FileWriter;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.Arrays;
import java.util.HashMap;
import java.util.Map;
import java.util.Objects;

import static com.appsmith.git.constants.GitDirectories.ACTION_DIRECTORY;
import static com.appsmith.git.constants.GitDirectories.DATASOURCE_DIRECTORY;
import static com.appsmith.git.constants.GitDirectories.PAGE_DIRECTORY;


@Slf4j
@Component
public class FileUtils implements FileInterface {

    @Value("${appsmith.git_services.repo:./container-volumes/git-repo}")
    public String GIT_REPO;

    /**
     * This method will save the complete application in the local repo directory. We are going to use the worktree
     * implementation for branching. This decision has been taken considering the case multiple users can checkout
     * different branches at same time API reference for worktree => https://git-scm.com/docs/git-worktree
     * Path to repo will be : ./container-volumes/git-repo/organizationId/defaultApplicationId/branchName/{application_data}
     * @param defaultApplicationId default application equivalent to default branch in git, this will be used for creating
     *                             the path and will be unique for each instance
     * @param organizationId organization from which application needs to dehydrated from the DB
     * @param applicationGitReference application reference object from which entire application can be rehydrated
     * @param branchName name of the branch for the current application
     * @return repo path where the application is stored
     */
    public Mono<String> saveApplicationToGitRepo(String organizationId,
                                                 String defaultApplicationId,
                                                 ApplicationGitReference applicationGitReference,
                                                 String branchName) {

        // The repoPath will contain the actual path of branch as we will be using worktree.
        String baseRepoPath = GIT_REPO + "/" + organizationId + "/" + defaultApplicationId + "/" + branchName;

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

        Gson gson = new GsonBuilder().disableHtmlEscaping().setPrettyPrinting().create();

        // Save application
        saveFile(applicationGitReference.getApplication(), baseRepoPath + "/application.json", gson);

        // Save pages
        for (Map.Entry<String, Object> resource : applicationGitReference.getPages().entrySet()) {
            saveFile(resource.getValue(), baseRepoPath + PAGE_DIRECTORY + resource.getKey() + ".json", gson);
        }

        // Save actions
        for (Map.Entry<String, Object> resource : applicationGitReference.getActions().entrySet()) {
            saveFile(resource.getValue(), baseRepoPath + ACTION_DIRECTORY + resource.getKey() + ".json", gson);
        }

        // Save datasources ref
        for (Map.Entry<String, Object> resource : applicationGitReference.getDatasources().entrySet()) {
            saveFile(resource.getValue(), baseRepoPath + DATASOURCE_DIRECTORY + resource.getKey() + ".json", gson);
        }

        return Mono.just(baseRepoPath);
    }

    private boolean saveFile (Object sourceEntity, String path, Gson gson) {
        File file = new File(path);
        try {
            // Create a file if absent
            org.apache.commons.io.FileUtils.write(file, "", StandardCharsets.UTF_8);
            FileWriter fileWriter = new FileWriter(file);
            gson.toJson(sourceEntity, fileWriter);
            fileWriter.close();
            return file.isFile() && file.length() > 0;
        } catch (IOException e) {
            log.debug(e.getMessage());
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

        String baseRepo = GIT_REPO + "/" + organisationId + "/" + defaultApplicationId + "/" + branchName;
        ApplicationGitReference applicationGitReference = new ApplicationGitReference();

        Gson gson = new GsonBuilder()
            .registerTypeAdapter(DatasourceStructure.Key.class, new DatasourceStructure.KeyInstanceCreator())
            .create();

        // Extract application data from the json
        applicationGitReference.setApplication(
            readFile( baseRepo + "/application.json", gson)
        );

        // Extract actions
        applicationGitReference.setActions(readFiles(baseRepo + ACTION_DIRECTORY, gson));

        // Extract pages
        applicationGitReference.setPages(readFiles(baseRepo + PAGE_DIRECTORY, gson));

        // Extract datasources
        applicationGitReference.setDatasources(readFiles(baseRepo + DATASOURCE_DIRECTORY, gson));

        return applicationGitReference;
    }

    private Object readFile(String filePath, Gson gson) {
        JsonReader reader = null;
        try {
            reader = new JsonReader(new FileReader(filePath));
        } catch (FileNotFoundException e) {
            log.debug(e.getMessage());
        }
        assert reader != null;
        return gson.fromJson(reader, Object.class);
    }

    private Map<String, Object> readFiles(String directoryPath, Gson gson) {
        Map<String, Object> resource = new HashMap<>();
        File directory = new File(directoryPath);
        if (directory.isDirectory()) {
            Arrays.stream(Objects.requireNonNull(directory.listFiles())).forEach(file -> {
                try {
                    resource.put(file.getName(), gson.fromJson(new JsonReader(new FileReader(file)), Object.class));
                } catch (Exception e) {
                    log.debug(e.getMessage());
                }
            });
        }
        return resource;
    }
}
