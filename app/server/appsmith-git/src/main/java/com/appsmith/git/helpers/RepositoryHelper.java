package com.appsmith.git.helpers;

import org.eclipse.jgit.api.Git;
import org.eclipse.jgit.lib.StoredConfig;
import org.eclipse.jgit.storage.file.FileRepositoryBuilder;

import java.io.IOException;
import java.nio.file.Path;

/**
 * This class provides the handy methods concerned with the repository operation like if the given directory is already
 * initialised with git etc
 */

public class RepositoryHelper {

    public static boolean isRepositoryExists(Path repoPath) {

        FileRepositoryBuilder repositoryBuilder = new FileRepositoryBuilder();
        repositoryBuilder.findGitDir(repoPath.toFile());
        return repositoryBuilder.getGitDir() != null;
    }

    public static void updateRemoteBranchTrackingConfig(String branchName, Git git) throws IOException {
        StoredConfig config = git.getRepository().getConfig();
        config.setString("branch", branchName, "remote", "origin");
        config.setString("branch", branchName, "merge", "refs/heads/" + branchName);
        config.save();
    }
}
