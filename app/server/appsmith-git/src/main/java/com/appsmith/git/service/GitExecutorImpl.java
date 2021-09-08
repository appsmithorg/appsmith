package com.appsmith.git.service;

import com.appsmith.external.git.GitExecutor;
import com.appsmith.git.helpers.RepositoryHelper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.eclipse.jgit.api.Git;
import org.eclipse.jgit.api.errors.GitAPIException;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.nio.file.Path;

@RequiredArgsConstructor
@Component
@Slf4j
public class GitExecutorImpl implements GitExecutor {

    private final RepositoryHelper repositoryHelper = new RepositoryHelper();

    @Override
    public String commitApplication(Path repoPath, String commitMessage, String authorName, String authorEmail) throws IOException, GitAPIException {
        // Check if the repo has been already initialised
        if (!repositoryHelper.repositoryExists(repoPath)) {
            // Not present or not a Git repository
            createNewRepository(repoPath);
        }
        // Just need to open a repository here and make a commit
        Git git = Git.open(repoPath.toFile());
        git.add().addFilepattern(".").call();

        // Commit the changes
        git.commit()
            .setMessage(commitMessage)
            .setAuthor(authorName, authorEmail)
            .call();
        return "Committed successfully!";
    }

    @Override
    public boolean createNewRepository(Path repoPath) throws GitAPIException {
        // create new repo to the mentioned path
        log.debug("Trying to create new repository: " + repoPath);
        Git.init().setDirectory(repoPath.toFile()).call();
        return true;
    }
}
