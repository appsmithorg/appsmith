package com.appsmith.external.git;

import com.appsmith.external.models.ApplicationGitReference;
import org.eclipse.jgit.api.errors.GitAPIException;
import reactor.core.publisher.Mono;

import java.io.IOException;
import java.nio.file.Path;

public interface FileInterface {
    /**
     * This method is use to store the serialised application to git repo, directory path structure we are going to follow :
     * ./container-volumes/git-repo/organizationId/defaultApplicationId/repoName/{application_data}
     * @param baseRepoSuffix path suffix used to create a repo path
     * @param applicationGitReference application reference object from which entire application can be rehydrated
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
    Mono<Path> saveApplicationToGitRepo(Path baseRepoSuffix,
                                        ApplicationGitReference applicationGitReference,
                                        String branchName) throws IOException, GitAPIException;

    /**
     * This method will reconstruct the application from the repo
     *
     * @param organisationId To which organisation application needs to be rehydrated
     * @param defaultApplicationId Default application needs to be rehydrated
     * @param branchName for which branch the application needs to be rehydrated
     * @param repoName git repo name to access file system
     * @return application reference from which entire application can be rehydrated
     */
    Mono<ApplicationGitReference> reconstructApplicationReferenceFromGitRepo(String organisationId,
                                                                             String defaultApplicationId,
                                                                             String repoName,
                                                                             String branchName);

    /**
     * Once the user connects the existing application to a remote repo, we will initialize the repo with Readme.md -
     * Url to the deployed app(view and edit mode)
     * Link to discord channel for support
     * Link to appsmith documentation for Git related operations
     * Welcome message
     *
     * @param baseRepoSuffix path suffix used to create a branch repo path as per worktree implementation
     * @param viewModeUrl    URL to deployed version of the application view only mode
     * @param editModeUrl    URL to deployed version of the application edit mode
     * @return Path where the Application is stored
     */
    Mono<Path> initializeGitRepo(Path baseRepoSuffix, String viewModeUrl, String editModeUrl) throws IOException;

    /**
     * When the user clicks on detach remote, we need to remove the repo from the file system
     *
     * @param baseRepoSuffix path suffix used to create a branch repo path as per worktree implementation
     * @return success on remove of file system
     */
    Mono<Boolean> detachRemote(Path baseRepoSuffix);

    /**
     * This will check if the cloned repo is empty. The check excludes files like Readme files
     *
     * @param baseRepoSuffix path suffix used to create a branch repo path as per worktree implementation
     * @return success if the clone repo doesnt contain any files
     */
    Mono<Boolean> checkIfDirectoryIsEmpty(Path baseRepoSuffix) throws IOException;
}
