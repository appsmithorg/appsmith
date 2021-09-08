package com.appsmith.external.git;

import org.eclipse.jgit.api.errors.GitAPIException;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.nio.file.Path;

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
     *
     * @param repoPath
     * @return
     */
    boolean createNewRepository(Path repoPath) throws IOException, GitAPIException;

}
