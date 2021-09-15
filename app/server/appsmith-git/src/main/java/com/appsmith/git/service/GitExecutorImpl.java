package com.appsmith.git.service;

import com.appsmith.external.dtos.GitLogDTO;
import com.appsmith.external.git.GitExecutor;
import com.appsmith.git.configurations.GitServiceConfig;
import com.appsmith.git.helpers.RepositoryHelper;
import com.appsmith.git.helpers.SshTransportConfigCallback;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.eclipse.jgit.api.Git;
import org.eclipse.jgit.api.MergeResult;
import org.eclipse.jgit.api.TransportConfigCallback;
import org.eclipse.jgit.api.errors.GitAPIException;
import org.eclipse.jgit.lib.PersonIdent;
import org.eclipse.jgit.lib.Ref;
import org.eclipse.jgit.revwalk.RevCommit;
import org.springframework.stereotype.Component;
import org.springframework.util.FileSystemUtils;

import java.io.File;
import java.io.IOException;
import java.net.URISyntaxException;
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

    private final RepositoryHelper repositoryHelper = new RepositoryHelper();

    private final GitServiceConfig gitServiceConfig;

    public static final DateTimeFormatter ISO_FORMATTER = DateTimeFormatter.ISO_INSTANT.withZone(ZoneId.from(ZoneOffset.UTC));

    /**
     * This method will handle the git-commit functionality. Under the hood it checks if the repo has already been
     * initialised and will be initialised if git repo is not present
     *
     * @param repoPath parent path to repo
     * @param commitMessage message which will be registered for this commit
     * @param authorName author details
     * @param authorEmail author details
     * @return if the commit was successful
     * @throws IOException Exceptions due to file operations
     * @throws GitAPIException exceptions due to git commands
     */
    @Override
    public String commitApplication(Path repoPath,
                                    String commitMessage,
                                    String authorName,
                                    String authorEmail) throws IOException, GitAPIException {
        log.debug("Trying to commit to local repo path, {}", repoPath);
        // Check if the repo has been already initialised
        if (!repositoryHelper.repositoryExists(repoPath)) {
            // Not present or not a Git repository
            createNewRepository(repoPath);
        }
        // Just need to open a repository here and make a commit
        Git git = Git.open(repoPath.toFile());
        // Stage all the files
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

    /**
     * Method to create a new repository to provided path
     * @param repoPath path where new repo needs to be created
     * @return if the operation was successful
     */
    @Override
    public boolean createNewRepository(Path repoPath) throws GitAPIException {
        // create new repo to the mentioned path
        log.debug("Trying to create new repository: {}", repoPath);
        Git.init().setDirectory(repoPath.toFile()).call();
        return true;
    }

    /**
     * Method to get the commit history
     * @param repoSuffix Path used to generate the repo url specific to the application for which the commit history is requested
     * @return list of git commits
     * @throws IOException
     * @throws GitAPIException
     */
    @Override
    public List<GitLogDTO> getCommitHistory(Path repoSuffix) throws IOException, GitAPIException {
        List<GitLogDTO> commitLogs = new ArrayList<>();
        Path repoPath = createRepoPath(repoSuffix);
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

    private Path createRepoPath(Path suffix) {
        return Paths.get(gitServiceConfig.getGitRootPath()).resolve(suffix);
    }

    /**
     * Method to push changes to remote repo
     *
     * @param branchSuffix Path used to generate the repo url specific to the application which needs to be pushed to remote
     * @param remoteUrl remote repo url
     * @param publicKey
     * @param privateKey
     * @return Success message
     * @throws IOException exception thrown if git open repo failed
     * @throws GitAPIException git exceptions
     */
    @Override
    public String pushApplication(Path branchSuffix,
                                  String remoteUrl,
                                  String publicKey,
                                  String privateKey) throws IOException, GitAPIException, URISyntaxException {
        // We can safely assume that repo has been already initialised either in commit or clone flow and can directly
        // open the repo
        Path baseRepoPath = createRepoPath(branchSuffix);
        Git git = Git.open(baseRepoPath.toFile());

        TransportConfigCallback transportConfigCallback = new SshTransportConfigCallback(privateKey, publicKey);

        StringBuilder result = new StringBuilder("Pushed successfully with status : ");
        git.push()
                .setTransportConfigCallback(transportConfigCallback)
                .setRemote(remoteUrl)
                .call()
                .forEach(pushResult ->
                        pushResult.getRemoteUpdates()
                                .forEach(remoteRefUpdate -> result.append(remoteRefUpdate.getStatus().name()).append(","))
                );
        // We can support username and password in future if needed
        // pushCommand.setCredentialsProvider(new UsernamePasswordCredentialsProvider("username", "password"));
        git.close();
        return result.substring(0, result.length() - 1);
    }

    @Override
    public String cloneApp(Path repoSuffix,
                           String remoteUrl,
                           String privateSshKey,
                           String publicSshKey) throws GitAPIException, IOException {

        final TransportConfigCallback transportConfigCallback = new SshTransportConfigCallback(privateSshKey, publicSshKey);

        File file = Paths.get(gitServiceConfig.getGitRootPath()).resolve(repoSuffix).toFile();
        while (file.exists()) {
            FileSystemUtils.deleteRecursively(file);
        }

        Git result = Git.cloneRepository()
                .setURI(remoteUrl)
                .setTransportConfigCallback(transportConfigCallback)
                .setDirectory(file)
                .call();
        String branchName = result.getRepository().getBranch();
        result.close();
        return branchName;
    }

    @Override
    public String createWorktree(Path repoSuffix, String branchName) throws IOException, GitAPIException {
        // We can safely assume that repo has been already initialised either in commit or clone flow and can directly
        // open the repo
        Path baseRepoPath = createRepoPath(repoSuffix);
        Git git = Git.open(baseRepoPath.toFile());

        Ref ref = git.branchCreate().setName(branchName).call();
        git.close();
        return ref.getName();
    }

    @Override
    public String pullApp(Path repoPath,
                          String remoteUrl,
                          String branchName,
                          String privateKey,
                          String publicKey) throws GitAPIException, IOException {

        //TODO Check out the branchName, check if file exists for the path without branchName,else update the file to new path
        //TODO SHow number of commits fetched or Already upto date
        Git git = Git.open(Paths.get(gitServiceConfig.getGitRootPath()).resolve(repoPath).toFile());
        TransportConfigCallback transportConfigCallback = new SshTransportConfigCallback(privateKey, publicKey);
        MergeResult mergeResult = git.pull()
                .setRemoteBranchName(branchName)
                .setTransportConfigCallback(transportConfigCallback)
                .call()
                .getMergeResult();
        if (mergeResult.getMergeStatus().isSuccessful()) {
            return mergeResult.getMergeStatus().name();
        }
        log.error("Git merge from remote branch failed, {}", branchName, mergeResult.getMergeStatus());
        return "Merge from remote failed";
    }
}
