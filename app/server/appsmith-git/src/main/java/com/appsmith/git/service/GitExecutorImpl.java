package com.appsmith.git.service;

import com.appsmith.external.dtos.GitLogDTO;
import com.appsmith.external.git.GitExecutor;
import com.appsmith.git.configurations.GitServiceConfig;
import com.appsmith.git.constants.Constraint;
import com.appsmith.git.helpers.RepositoryHelper;
import com.appsmith.git.helpers.SshTransportConfigCallback;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.eclipse.jgit.api.CreateBranchCommand;
import org.eclipse.jgit.api.Git;
import org.eclipse.jgit.api.MergeCommand;
import org.eclipse.jgit.api.MergeResult;
import org.eclipse.jgit.api.Status;
import org.eclipse.jgit.api.TransportConfigCallback;
import org.eclipse.jgit.api.errors.GitAPIException;
import org.eclipse.jgit.errors.NotSupportedException;
import org.eclipse.jgit.lib.BranchTrackingStatus;
import org.eclipse.jgit.lib.PersonIdent;
import org.eclipse.jgit.lib.Ref;
import org.eclipse.jgit.revwalk.RevCommit;
import org.eclipse.jgit.util.StringUtils;
import org.springframework.stereotype.Component;
import org.springframework.util.FileSystemUtils;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Scheduler;
import reactor.core.scheduler.Schedulers;

import java.io.File;
import java.io.IOException;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.ZoneId;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Date;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RequiredArgsConstructor
@Component
@Slf4j
public class GitExecutorImpl implements GitExecutor {

    private final RepositoryHelper repositoryHelper = new RepositoryHelper();

    private final GitServiceConfig gitServiceConfig;

    public static final DateTimeFormatter ISO_FORMATTER = DateTimeFormatter.ISO_INSTANT.withZone(ZoneId.from(ZoneOffset.UTC));

    private final Scheduler scheduler = Schedulers.elastic();

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
    public Mono<String> commitApplication(Path repoPath,
                                          String commitMessage,
                                          String authorName,
                                          String authorEmail) {
        return Mono.fromCallable(() -> {
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
        }).subscribeOn(scheduler);

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
    public Mono<List<GitLogDTO>> getCommitHistory(Path repoSuffix) {
        return Mono.fromCallable(() -> {
            System.out.println(Thread.currentThread().getName() + ": get commit history for  " + repoSuffix);
            List<GitLogDTO> commitLogs = new ArrayList<>();
            Path repoPath = createRepoPath(repoSuffix);
            Git git = Git.open(repoPath.toFile());
            Iterable<RevCommit> gitLogs = git.log().setMaxCount(Constraint.MAX_COMMIT_LOGS).call();
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
        }).subscribeOn(scheduler);
    }

    private Path createRepoPath(Path suffix) {
        return Paths.get(gitServiceConfig.getGitRootPath()).resolve(suffix);
    }

    /**
     * Method to push changes to remote repo
     * @param branchSuffix Path used to generate the repo url specific to the application which needs to be pushed to remote
     * @param remoteUrl remote repo url
     * @param publicKey
     * @param privateKey
     * @return Success message
     * @throws IOException exception thrown if git open repo failed
     * @throws GitAPIException git exceptions
     */
    @Override
    public Mono<String> pushApplication(Path branchSuffix,
                                        String remoteUrl,
                                        String publicKey,
                                        String privateKey,
                                        String branchName) {
        // We can safely assume that repo has been already initialised either in commit or clone flow and can directly
        return Mono.fromCallable(() -> {
            System.out.println(Thread.currentThread().getName() + ": pushing changes to remote " + remoteUrl);
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
        }).subscribeOn(scheduler);
    }

    @Override
    public Mono<String> cloneApplication(Path repoSuffix,
                           String remoteUrl,
                           String privateSshKey,
                           String publicSshKey) {

        return Mono.fromCallable(() -> {
            System.out.println(Thread.currentThread().getName() + ": Cloning the repo from the remote " + remoteUrl);
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
        }).subscribeOn(scheduler);
    }

    @Override
    public Mono<String> createAndCheckoutToBranch(Path repoSuffix, String branchName) {
        // We can safely assume that repo has been already initialised either in commit or clone flow and can directly
        return Mono.fromCallable(() -> {
            System.out.println(Thread.currentThread().getName() + ": Creating branch  " + branchName + "for the repo "+repoSuffix);
            // open the repo
            Path baseRepoPath = createRepoPath(repoSuffix);
            Git git = Git.open(baseRepoPath.toFile());
            // Create and checkout to new branch
            git.checkout()
                    .setCreateBranch(Boolean.TRUE)
                    .setName(branchName)
                    .setUpstreamMode(CreateBranchCommand.SetupUpstreamMode.TRACK)
                    .call();

            return git.getRepository().getBranch();
        }).subscribeOn(scheduler);
    }

    @Override
    public Mono<Boolean> checkoutToBranch(Path repoSuffix, String branchName) {

        return Mono.fromCallable(() -> {
            System.out.println(Thread.currentThread().getName() + ": Switching to the branch " + branchName);
            // We can safely assume that repo has been already initialised either in commit or clone flow and can directly
            // open the repo
            Path baseRepoPath = createRepoPath(repoSuffix);
            Git git = Git.open(baseRepoPath.toFile());
            if (StringUtils.equalsIgnoreCase(branchName, git.getRepository().getBranch())) {
                return Boolean.TRUE;
            }
            // Create and checkout to new branch
            String checkedOutBranch =  git.checkout()
                    .setCreateBranch(Boolean.FALSE)
                    .setName(branchName)
                    .setUpstreamMode(CreateBranchCommand.SetupUpstreamMode.SET_UPSTREAM)
                    .call()
                    .getName();
            return StringUtils.equalsIgnoreCase(checkedOutBranch, branchName);
        }).subscribeOn(scheduler);
    }

    @Override
    public Mono<String> pullApplication(Path repoPath,
                                        String remoteUrl,
                                        String branchName,
                                        String privateKey,
                                        String publicKey) {
        TransportConfigCallback transportConfigCallback = new SshTransportConfigCallback(privateKey, publicKey);
        return Mono.fromCallable(() -> {
            Git git = Git.open(repoPath.toFile());
            long count = Arrays.stream(git
                    .pull()
                    .setRemoteBranchName(branchName)
                    .setTransportConfigCallback(transportConfigCallback)
                    .setFastForward(MergeCommand.FastForwardMode.FF)
                    .call()
                    .getMergeResult()
                    .getMergedCommits())
                    .count();
            git.close();
            if (count > 0) {
                return count + " commits merged from origin/" + branchName;
            }
            return "Your branch is up-to-date with latest commits";
        }).subscribeOn(scheduler);
    }

    @Override
    public Mono<List<String>> getBranches(Path repoSuffix) {
        Path baseRepoPath = createRepoPath(repoSuffix);
        return Mono.fromCallable(() -> {
            System.out.println(Thread.currentThread().getName() + ": Get branches for the application " + repoSuffix);
            Git git = Git.open(baseRepoPath.toFile());
            // Only show local branches
            List<Ref> refList = git.branchList().call();
            List<String> branchList = new ArrayList<>();

            if(refList.isEmpty()) {
                branchList.add(git.getRepository().getBranch());
            } else {
                for(Ref ref : refList) {
                    branchList.add(ref.getName()
                            .replace("refs/heads/",""));
                }
            }
            git.close();
            return branchList;
        }).subscribeOn(scheduler);
    }

    /**
     * This method will handle the git-status functionality
     *
     * @param repoPath Path to actual repo
     * @param branchName branch name for which the status is required
     * @return Map of file names those are added, removed, modified
     * @throws GitAPIException exceptions due to git commands
     * @throws IOException Exceptions due to file operations
     */
    @Override
    public Mono<Map<String, Object>> getStatus(Path repoPath, String branchName) {
        return Mono.fromCallable(() -> {
            System.out.println(Thread.currentThread().getName() + ": Get status for repo  " + repoPath + ", branch " + branchName);
            Git git = Git.open(repoPath.toFile());
            Status status = git.status().call();
            Map<String, Object> response = new HashMap<>();
            response.put("added", status.getAdded());
            response.put("modified", status.getModified());
            response.put("conflicting", status.getConflicting());
            response.put("removed", status.getRemoved());
            response.put("uncommitted", status.getUncommittedChanges());
            response.put("untracked", status.getUntracked());
            response.put("isClean", status.isClean());

            BranchTrackingStatus trackingStatus = BranchTrackingStatus.of(git.getRepository(), branchName);
            if (trackingStatus != null) {
                response.put("aheadCount", trackingStatus.getAheadCount());
                response.put("behindCount", trackingStatus.getBehindCount());
                response.put("remoteBranch", trackingStatus.getRemoteTrackingBranch());
            } else {
                log.debug("Remote tracking details not present for branch: {}, repo: {}", branchName, repoPath);
                response.put("aheadCount", 0);
                response.put("behindCount", 0);
                response.put("remoteBranch", null);
            }
            git.close();
            return response;
        }).subscribeOn(scheduler);
    }

    @Override
    public Mono<String> mergeBranch(Path repoPath, String sourceBranch, String destinationBranch) {
        return Mono.fromCallable(() -> {
            System.out.println(Thread.currentThread().getName() + ": Merge branch  " + sourceBranch + " on " + destinationBranch);
            Git git = Git.open(Paths.get(gitServiceConfig.getGitRootPath()).resolve(repoPath).toFile());
            try {
                //checkout the branch on which the merge command is run
                git.checkout().setName(destinationBranch).setCreateBranch(false).call();

                MergeResult mergeResult = git.merge().include(git.getRepository().findRef(sourceBranch)).call();
                git.close();
                return mergeResult.getMergeStatus().name();
            } catch (GitAPIException e) {
                return e.getMessage();
            }
        }).subscribeOn(scheduler);
    }
}
