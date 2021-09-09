package com.appsmith.external.git;

import com.appsmith.external.dtos.GitLogDTO;
import org.eclipse.jgit.api.errors.GitAPIException;
import org.springframework.stereotype.Component;

import java.io.IOException;
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

    List<GitLogDTO> getCommitHistory(String organizationId, String defaultApplicationId, String branchName) throws IOException, GitAPIException;

    /**
     * THis method will create a new repository to provided path
     * @param repoPath
     * @return
     */
    boolean createNewRepository(Path repoPath) throws IOException, GitAPIException;

    String cloneApp(String repoPath, String repoName,  String remoteUrl, String privateSshKey, String publicSshKey) throws GitAPIException, IOException;


}
