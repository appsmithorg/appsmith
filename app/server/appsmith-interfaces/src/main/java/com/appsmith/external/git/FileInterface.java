package com.appsmith.external.git;

import com.appsmith.external.git.models.GitResourceMap;
import org.eclipse.jgit.api.errors.GitAPIException;
import reactor.core.publisher.Mono;

import java.io.IOException;
import java.nio.file.Path;
import java.util.Set;

public interface FileInterface {

    Mono<Path> saveArtifactToGitRepo(
            Path baseRepoSuffix, GitResourceMap gitResourceMap, String branchName, boolean keepWorkingDirChanges)
            throws GitAPIException, IOException;

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

    Mono<Object> reconstructPackageJsonFromGitRepository(Path repoSuffix);

    Mono<Object> reconstructPageFromGitRepo(
            String pageName,
            String branchName,
            Path repoSuffixPath,
            Boolean checkoutRequired,
            Boolean keepWorkingDirChanges);

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
