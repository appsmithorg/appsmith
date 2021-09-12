package com.appsmith.git.service;

import com.appsmith.external.dtos.GitApplicationDTO;
import com.appsmith.external.dtos.GitLogDTO;
import com.appsmith.external.git.GitExecutor;
import com.appsmith.git.helpers.FileUtilsImpl;
import com.appsmith.git.helpers.RepositoryHelper;
import com.appsmith.git.helpers.SshTransportConfigCallback;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.eclipse.jgit.api.Git;
import org.eclipse.jgit.api.RemoteAddCommand;
import org.eclipse.jgit.api.TransportConfigCallback;
import org.eclipse.jgit.api.errors.GitAPIException;
import org.eclipse.jgit.lib.PersonIdent;
import org.eclipse.jgit.revwalk.RevCommit;
import org.eclipse.jgit.transport.URIish;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.util.FileSystemUtils;

import java.io.File;
import java.io.IOException;
import java.net.URISyntaxException;
import java.nio.file.Files;
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

    private final static String DEFAULT_REMOTE = "origin";

    /**
     * This method will handle the git-commit functionality. Under the hood it checks if the repo has already been
     * initialised and will be initialised if git repo is not present
     * @param repoPath parent path to repo
     * @param commitMessage message which will be registered for this commit
     * @param authorName author details
     * @param authorEmail author details
     * @return if the commit was successful
     * @throws IOException Exceptions due to file operations
     * @throws GitAPIException exceptions due to git commands
     */
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
     * @param gitApplicationDTO DTO object used to generate the repo url specific to the application which needs to committed
     * @return list of git commits
     * @throws IOException
     * @throws GitAPIException
     */
    @Override
    public List<GitLogDTO> getCommitHistory(GitApplicationDTO gitApplicationDTO) throws IOException, GitAPIException {
        List<GitLogDTO> commitLogs = new ArrayList<>();
        Path repoPath = createRepoPath(gitApplicationDTO.getOrganizationId(), gitApplicationDTO.getDefaultApplicationId());
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
    @Override
    public String pushApplication(GitApplicationDTO gitApplicationDTO,
                                  String remoteUrl,
                                  String publicKey,
                                  String privateKey) throws IOException, GitAPIException, URISyntaxException {
        // We can safely assume that repo has been already initialised either in commit or clone flow and can directly
        // open the repo
        Path baseRepoPath = createRepoPath(gitApplicationDTO.getOrganizationId(), gitApplicationDTO.getDefaultApplicationId());
        Git git = Git.open(baseRepoPath.toFile());
        // Set remote
        RemoteAddCommand remoteAddCommand = git.remoteAdd();
        remoteAddCommand
                .setName(DEFAULT_REMOTE)
                .setUri(new URIish(remoteUrl));
        // you can add more settings here if needed
        remoteAddCommand.call();
        TransportConfigCallback transportConfigCallback = new SshTransportConfigCallback(privateKey, publicKey);

        StringBuilder result = new StringBuilder();
        git.push()
                .setTransportConfigCallback(transportConfigCallback)
                .call()
                .forEach(pushResult ->
                        pushResult.getRemoteUpdates().forEach(remoteRefUpdate -> result.append(remoteRefUpdate.getMessage()))
                );
        // We can support username and password if needed
        // pushCommand.setCredentialsProvider(new UsernamePasswordCredentialsProvider("username", "password"));
        git.close();
        return result.toString();
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
    private File getFilePath(String repoPath, String repoName) throws IOException {
        Path filePath = Paths.get(gitRootPath, repoPath, repoName);
        File file = new File(String.valueOf(filePath));
        while(file.exists()) {
            FileSystemUtils.deleteRecursively(file);
        }
        file.mkdir();
        return file;
    }
}
