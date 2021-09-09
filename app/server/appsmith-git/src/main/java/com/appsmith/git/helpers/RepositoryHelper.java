package com.appsmith.git.helpers;

import org.eclipse.jgit.storage.file.FileRepositoryBuilder;

import java.nio.file.Path;

/**
 * This class provides the handy methods concerned with the repository operation like if the given directory is already
 * initialised with git etc
 */
public class RepositoryHelper {

    public boolean repositoryExists(Path repoPath) {

        FileRepositoryBuilder repositoryBuilder = new FileRepositoryBuilder();
        repositoryBuilder.findGitDir(repoPath.toFile());

        return repositoryBuilder.getGitDir() != null;
    }
}
