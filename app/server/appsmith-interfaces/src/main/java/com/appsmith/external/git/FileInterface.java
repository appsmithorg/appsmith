package com.appsmith.external.git;

import com.appsmith.external.git.models.GitResourceMap;
import com.appsmith.external.models.ApplicationGitReference;
import com.appsmith.external.models.ArtifactGitReference;
import org.eclipse.jgit.api.errors.GitAPIException;
import reactor.core.publisher.Mono;

import java.io.IOException;
import java.nio.file.Path;
import java.util.Set;

public interface FileInterface {
    /**
     * This method is use to store the serialised application to git repo, directory path structure we are going to follow :
     * ./container-volumes/git-repo/workspaceId/defaultApplicationId/repoName/{application_data}
     * @param baseRepoSuffix path suffix used to create a repo path
     * @param artifactGitReference application reference object from which entire application can be rehydrated
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
    Mono<Path> saveApplicationToGitRepo(
            Path baseRepoSuffix, ArtifactGitReference artifactGitReference, String branchName)
            throws IOException, GitAPIException;

    Mono<Path> saveArtifactToGitRepo(
            Path baseRepoSuffix, GitResourceMap gitResourceMap, String branchName, boolean keepWorkingDirChanges)
            throws GitAPIException, IOException;

    /**
     * This method will reconstruct the application from the repo
     *
     * @param organisationId To which organisation application needs to be rehydrated
     * @param baseApplicationId Base application needs to be rehydrated
     * @param branchName for which branch the application needs to be rehydrated
     * @param repoName git repo name to access file system
     * @return application reference from which entire application can be rehydrated
     */
    Mono<ApplicationGitReference> reconstructApplicationReferenceFromGitRepo(
            String organisationId, String baseApplicationId, String repoName, String branchName);

    Mono<GitResourceMap> constructGitResourceMapFromGitRepo(Path repositorySuffix, String refName);

    /**
     * This method just reconstructs the metdata of the json from git repo.
     *
     * @param workspaceId
     * @param defaultApplicationId
     * @param repoName
     * @param branchName
     * @param repoSuffixPath
     * @param isResetToLastCommitRequired
     * @return
     */
    Mono<Object> reconstructMetadataFromGitRepo(
            String workspaceId,
            String defaultApplicationId,
            String repoName,
            String branchName,
            Path repoSuffixPath,
            Boolean isResetToLastCommitRequired);

    Mono<Object> reconstructMetadataFromGitRepository(Path repoSuffix);

    Mono<Object> reconstructPageFromGitRepo(
            String pageName, String branchName, Path repoSuffixPath, Boolean checkoutRequired);

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
    Mono<Path> initializeReadme(Path baseRepoSuffix, String viewModeUrl, String editModeUrl) throws IOException;

    /**
     * When the user clicks on detach remote, we need to remove the repo from the file system
     *
     * @param baseRepoSuffix path suffix used to create a branch repo path as per worktree implementation
     * @return success on remove of file system
     */
    Mono<Boolean> deleteLocalRepo(Path baseRepoSuffix);

    /**
     * This will check if the cloned repo is empty. The check excludes files like Readme files
     *
     * @param baseRepoSuffix path suffix used to create a branch repo path as per worktree implementation
     * @return success if the clone repo doesn't contain any files
     */
    Mono<Boolean> checkIfDirectoryIsEmpty(Path baseRepoSuffix) throws IOException;

    Mono<Long> deleteIndexLockFile(Path path, int validTimeInSeconds);

    void scanAndDeleteFileForDeletedResources(Set<String> validResources, Path resourceDirectory);

    void scanAndDeleteDirectoryForDeletedResources(Set<String> validResources, Path resourceDirectory);
}
