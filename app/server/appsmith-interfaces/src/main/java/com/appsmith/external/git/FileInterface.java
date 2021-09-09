package com.appsmith.external.git;

import com.appsmith.external.models.ApplicationGitReference;
import reactor.core.publisher.Mono;

import java.nio.file.Path;

public interface FileInterface {
    /**
     * This method is use to store the serialised application to git repo, directory path structure we are going to follow :
     * ./container-volumes/git-repo/organizationId/defaultApplicationId/branchName/{application_data}
     * @param organizationId from which organization application is serialised and will be use for directory path to store the application
     * @param defaultApplicationId this is equivalent to default branch in git and will be used for creating the path
     * @param applicationGitReference application reference object from which entire application can be rehydrated
     * @param branchName git branch for current application in context, we will be mapping each branch with separate application in DB
     * @return Path to where the application is stored
     *
     *   Application will be stored in the following structure :
     *   repo
     *   --Application
     *   ----Datasource
     *       --datasource1Name
     *       --datasource2Name
     *   ----Actions (Only requirement here is the filename should be unique)
     *       --action1_page1
     *       --action2_page2
     *   ----Pages
     *       --page1
     *       --page2
     */
    Mono<Path> saveApplicationToGitRepo(String organizationId,
                                        String defaultApplicationId,
                                        ApplicationGitReference applicationGitReference,
                                        String branchName);

    /**
     * This method will reconstruct the application from the repo
     * @param organisationId To which organisation application needs to be rehydrated
     * @param defaultApplicationId To which organisation application needs to be rehydrated
     * @param branchName for which the application needs to be rehydrate
     * @return application reference from which entire application can be rehydrated
     */
    ApplicationGitReference reconstructApplicationFromGitRepo(String organisationId,
                                                              String defaultApplicationId,
                                                              String branchName);
}
