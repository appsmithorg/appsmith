package com.appsmith.external.git;

import com.appsmith.external.dtos.GitApplicationDTO;
import com.appsmith.external.dtos.GitLogDTO;
import org.eclipse.jgit.api.errors.GitAPIException;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.net.URISyntaxException;
import java.nio.file.Path;
import java.util.List;

@Component
public interface GitExecutor {

    /**
     * This method will handle the git-commit functionality. Under the hood it checks if the repo has already been
     * initialised
     * @param repoPath parent path to repo
     * @param commitMessage message which will be registered for this commit
     * @param authorName author details
     * @param authorEmail author details
     * @return if the commit was successful
     * @throws IOException Exceptions due to file operations
     * @throws GitAPIException exceptions due to git commands
     */
    String commitApplication(Path repoPath, String commitMessage, String authorName, String authorEmail) throws IOException, GitAPIException;

    /**
     * Method to get the commit history
     * @param gitApplicationDTO DTO object used to generate the repo url specific to the application which needs to committed
     * @return list of git commits
     * @throws IOException
     * @throws GitAPIException
     */
    List<GitLogDTO> getCommitHistory(GitApplicationDTO gitApplicationDTO) throws IOException, GitAPIException;

    /**
     * Method to create a new repository to provided path
     * @param repoPath path where new repo needs to be created
     * @return if the operation was successful
     */
    boolean createNewRepository(Path repoPath) throws IOException, GitAPIException;

    /**
     * Method to push changes to remote repo
     * @param gitApplicationDTO DTO object used to generate the repo url specific to the application which needs to committed
     * @param remoteUrl remote repo url
     * @param publicKey
     * @param privateKey
     * @return Success message
     * @throws IOException exception thrown if git open repo failed
     * @throws GitAPIException git exceptions
     * @throws URISyntaxException exception thrown while constructing the remote url
     */
    // TODO create a separate applicationGit DTO class in executor instead of passing the different fields
    String pushApplication(GitApplicationDTO gitApplicationDTO, String remoteUrl, String publicKey, String privateKey) throws IOException, GitAPIException, URISyntaxException;

}
