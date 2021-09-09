package com.appsmith.git.service;

import com.appsmith.external.dtos.GitLogDTO;
import com.appsmith.external.git.GitExecutor;
import com.appsmith.git.helpers.FileUtilsImpl;
import com.appsmith.git.helpers.RepositoryHelper;
import com.appsmith.git.helpers.SshTransportConfigCallback;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.eclipse.jgit.api.Git;
import org.eclipse.jgit.api.TransportConfigCallback;
import org.eclipse.jgit.api.errors.GitAPIException;
import org.eclipse.jgit.lib.PersonIdent;
import org.eclipse.jgit.revwalk.RevCommit;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.io.File;
import java.io.IOException;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.ZoneId;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Date;
import java.util.List;

@RequiredArgsConstructor
@Component
@Slf4j
public class GitExecutorImpl implements GitExecutor {

    @Value("${appsmith.git.root:./container-volumes/git-storage}")
    private String gitRootPath;

    private final RepositoryHelper repositoryHelper = new RepositoryHelper();

    private final FileUtilsImpl fileUtils;

    public static final DateTimeFormatter ISO_FORMATTER = DateTimeFormatter.ISO_INSTANT.withZone(ZoneId.from(ZoneOffset.UTC));

    @Override
    public String commitApplication(Path repoPath, String commitMessage, String authorName, String authorEmail) throws IOException, GitAPIException {
        log.debug("Trying to commit to local repo path, {}", repoPath);
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
            // Only make a commit if there are any updates
            .setAllowEmpty(false)
            .setAuthor(authorName, authorEmail)
            .call();
        // Close the repo once the operation is successful
        git.close();
        return "Committed successfully!";
    }

    @Override
    public boolean createNewRepository(Path repoPath) throws GitAPIException {
        // create new repo to the mentioned path
        log.debug("Trying to create new repository: {}", repoPath);
        Git.init().setDirectory(repoPath.toFile()).call();
        return true;
    }

    @Override
    public List<GitLogDTO> getCommitHistory(String organizationId, String defaultApplicationId, String branchName) throws IOException, GitAPIException {
        List<GitLogDTO> commitLogs = new ArrayList<>();
        Path repoPath = createRepoPath(organizationId, defaultApplicationId);
        Git git = Git.open(repoPath.toFile());
        Iterable<RevCommit> gitLogs = git.log().call();
        gitLogs.forEach(revCommit -> {
            PersonIdent author = revCommit.getAuthorIdent();
            GitLogDTO gitLog = new GitLogDTO(
                revCommit.getName(),
                author.getName(),
                author.getEmailAddress(),
                revCommit.getFullMessage(),
                ISO_FORMATTER.format(new Date(revCommit.getCommitTime() * 1000L).toInstant())
            );
            commitLogs.add(gitLog);
        });
        git.close();
        return commitLogs;
    }

    private Path createRepoPath(String organizationId, String defaultApplicationId) {
        return Paths.get(fileUtils.getGitRootPath(), organizationId, defaultApplicationId);
    }

    @Override
    public String cloneApp(String repoPath,
                           String repoName,
                           String remoteUrl,
                           String privateSshKey,
                           String publicSshKey) throws GitAPIException, IOException {
        File file = getFilePath(repoPath, repoName);
        final TransportConfigCallback transportConfigCallback = new SshTransportConfigCallback(privateSshKey, publicSshKey);
        Git result = Git.cloneRepository()
                .setURI(remoteUrl)
                .setTransportConfigCallback(transportConfigCallback)
                .setDirectory(file)
                .call();
        return result.getRepository().getBranch();
    }

    /* There might be a case where the name conflicts can occur while creating the file.
     *  This function creates the directory and handles the name conflicts by appending the number to the repoName
     *  @param repoPath - combination of orgId, defaultApplicationId
     *  @param repoName - the git repo name
     *  @return file reference. Folder created Ex - gitRootPath/orgId/defaultApplicationId/repoName
     * */
    private File getFilePath(String repoPath, String repoName) {
        Path filePath = Paths.get(gitRootPath, repoPath, repoName);
        File file = new File(String.valueOf(filePath));
        if (file.exists()) {
            file.delete();
        }
        file.mkdir();
        return file;
    }

}
