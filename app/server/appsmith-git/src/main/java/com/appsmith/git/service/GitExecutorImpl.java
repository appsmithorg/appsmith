package com.appsmith.git.service;

import com.appsmith.external.constants.ErrorReferenceDocUrl;
import com.appsmith.external.dtos.GitBranchDTO;
import com.appsmith.external.dtos.GitLogDTO;
import com.appsmith.external.dtos.GitStatusDTO;
import com.appsmith.external.dtos.MergeStatusDTO;
import com.appsmith.external.git.GitExecutor;
import com.appsmith.external.helpers.Stopwatch;
import com.appsmith.git.configurations.GitServiceConfig;
import com.appsmith.git.constants.AppsmithBotAsset;
import com.appsmith.git.constants.Constraint;
import com.appsmith.git.constants.GitDirectories;
import com.appsmith.git.helpers.RepositoryHelper;
import com.appsmith.git.helpers.SshTransportConfigCallback;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.eclipse.jgit.api.CreateBranchCommand;
import org.eclipse.jgit.api.Git;
import org.eclipse.jgit.api.ListBranchCommand;
import org.eclipse.jgit.api.MergeCommand;
import org.eclipse.jgit.api.MergeResult;
import org.eclipse.jgit.api.ResetCommand;
import org.eclipse.jgit.api.Status;
import org.eclipse.jgit.api.TransportConfigCallback;
import org.eclipse.jgit.api.errors.CheckoutConflictException;
import org.eclipse.jgit.api.errors.GitAPIException;
import org.eclipse.jgit.lib.BranchTrackingStatus;
import org.eclipse.jgit.lib.PersonIdent;
import org.eclipse.jgit.lib.Ref;
import org.eclipse.jgit.lib.StoredConfig;
import org.eclipse.jgit.merge.MergeStrategy;
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
import java.time.Duration;
import java.time.ZoneId;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collection;
import java.util.Date;
import java.util.HashSet;
import java.util.List;
import java.util.Optional;
import java.util.Set;

@RequiredArgsConstructor
@Component
@Slf4j
public class GitExecutorImpl implements GitExecutor {

    private final RepositoryHelper repositoryHelper = new RepositoryHelper();

    private final GitServiceConfig gitServiceConfig;

    public static final DateTimeFormatter ISO_FORMATTER = DateTimeFormatter.ISO_INSTANT.withZone(ZoneId.from(ZoneOffset.UTC));

    private final Scheduler scheduler = Schedulers.boundedElastic();

    private static final String SUCCESS_MERGE_STATUS = "This branch has no conflict with the base branch.";

    /**
     * This method will handle the git-commit functionality. Under the hood it checks if the repo has already been
     * initialised and will be initialised if git repo is not present
     * @param path parent path to repo
     * @param commitMessage message which will be registered for this commit
     * @param authorName author details
     * @param authorEmail author details
     * @return if the commit was successful
     */
    @Override
    public Mono<String> commitApplication(Path path,
                                          String commitMessage,
                                          String authorName,
                                          String authorEmail,
                                          boolean isSuffixedPath) {

        final String finalAuthorName = StringUtils.isEmptyOrNull(authorName) ? AppsmithBotAsset.APPSMITH_BOT_USERNAME : authorName;
        final String finalAuthorEmail = StringUtils.isEmptyOrNull(authorEmail) ? AppsmithBotAsset.APPSMITH_BOT_EMAIL : authorEmail;
        Stopwatch processStopwatch = new Stopwatch("JGIT commit");
        return Mono.fromCallable(() -> {
            log.debug("Trying to commit to local repo path, {}", path);
            Path repoPath = path;
            if (Boolean.TRUE.equals(isSuffixedPath)) {
                repoPath = createRepoPath(repoPath);
            }
            // Just need to open a repository here and make a commit
            try (Git git = Git.open(repoPath.toFile())) {
                // Stage all the files added and modified
                git.add().addFilepattern(".").call();
                // Stage modified and deleted files
                git.add().setUpdate(true).addFilepattern(".").call();

                // Commit the changes
                git.commit()
                        .setMessage(commitMessage)
                        // Only make a commit if there are any updates
                        .setAllowEmpty(false)
                        .setAuthor(finalAuthorName, finalAuthorEmail)
                        .setCommitter(finalAuthorName, finalAuthorEmail)
                        .call();
                processStopwatch.stopAndLogTimeInMillis();
                return "Committed successfully!";
            }
        })
        .timeout(Duration.ofMillis(Constraint.LOCAL_TIMEOUT_MILLIS))
        .subscribeOn(scheduler);

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
     */
    @Override
    public Mono<List<GitLogDTO>> getCommitHistory(Path repoSuffix) {
        Stopwatch processStopwatch = new Stopwatch("JGIT commit history");
        return Mono.fromCallable(() -> {
            log.debug(Thread.currentThread().getName() + ": get commit history for  " + repoSuffix);
            List<GitLogDTO> commitLogs = new ArrayList<>();
            Path repoPath = createRepoPath(repoSuffix);
            try (Git git = Git.open(repoPath.toFile())) {
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
                    processStopwatch.stopAndLogTimeInMillis();
                    commitLogs.add(gitLog);
                });

                return commitLogs;
            }
        })
        .timeout(Duration.ofMillis(Constraint.LOCAL_TIMEOUT_MILLIS))
        .subscribeOn(scheduler);
    }

    private Path createRepoPath(Path suffix) {
        return Paths.get(gitServiceConfig.getGitRootPath()).resolve(suffix);
    }

    /**
     * Method to push changes to remote repo
     * @param repoSuffix Path used to generate the repo url specific to the application which needs to be pushed to remote
     * @param remoteUrl remote repo url
     * @param publicKey
     * @param privateKey
     * @return Success message
     */
    @Override
    public Mono<String> pushApplication(Path repoSuffix,
                                        String remoteUrl,
                                        String publicKey,
                                        String privateKey,
                                        String branchName) {
        // We can safely assume that repo has been already initialised either in commit or clone flow and can directly
        // open the repo
        Stopwatch processStopwatch = new Stopwatch("JGIT push");
        return Mono.fromCallable(() -> {
            log.debug(Thread.currentThread().getName() + ": pushing changes to remote " + remoteUrl);
            // open the repo
            Path baseRepoPath = createRepoPath(repoSuffix);
            try (Git git = Git.open(baseRepoPath.toFile())) {
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
                processStopwatch.stopAndLogTimeInMillis();
                return result.substring(0, result.length() - 1);
            }
        })
        .timeout(Duration.ofMillis(Constraint.REMOTE_TIMEOUT_MILLIS))
        .subscribeOn(scheduler);
    }

    /** Clone the repo to the file path : container-volume/orgId/defaultAppId/repo/applicationData
     *
     *  @param repoSuffix combination of orgId, defaultId and repoName
     *  @param remoteUrl ssh url of the git repo(we support cloning via ssh url only with deploy key)
     *  @param privateKey generated by us and specific to the defaultApplication
     *  @param publicKey generated by us and specific to the defaultApplication
     *  @return defaultBranchName of the repo
     * */
    @Override
    public Mono<String> cloneApplication(Path repoSuffix,
                           String remoteUrl,
                           String privateKey,
                           String publicKey) {

        Stopwatch processStopwatch = new Stopwatch("JGIT clone");
        return Mono.fromCallable(() -> {
            log.debug(Thread.currentThread().getName() + ": Cloning the repo from the remote " + remoteUrl);
            final TransportConfigCallback transportConfigCallback = new SshTransportConfigCallback(privateKey, publicKey);
            File file = Paths.get(gitServiceConfig.getGitRootPath()).resolve(repoSuffix).toFile();
            while (file.exists()) {
                FileSystemUtils.deleteRecursively(file);
            }

            Git git = Git.cloneRepository()
                    .setURI(remoteUrl)
                    .setTransportConfigCallback(transportConfigCallback)
                    .setDirectory(file)
                    .call();
            String branchName = git.getRepository().getBranch();

            repositoryHelper.updateRemoteBranchTrackingConfig(branchName, git);
            git.close();
            processStopwatch.stopAndLogTimeInMillis();
            return branchName;
        })
        .timeout(Duration.ofMillis(Constraint.REMOTE_TIMEOUT_MILLIS))
        .subscribeOn(scheduler);
    }

    @Override
    public Mono<String> createAndCheckoutToBranch(Path repoSuffix, String branchName) {
        // We can safely assume that repo has been already initialised either in commit or clone flow and can directly
        // open the repo
        Stopwatch processStopwatch = new Stopwatch("JGIT createBranch");
        return Mono.fromCallable(() -> {
            log.debug(Thread.currentThread().getName() + ": Creating branch  " + branchName + "for the repo " + repoSuffix);
            // open the repo
            Path baseRepoPath = createRepoPath(repoSuffix);
            try (Git git = Git.open(baseRepoPath.toFile())) {
                // Create and checkout to new branch
                git.checkout()
                        .setCreateBranch(Boolean.TRUE)
                        .setName(branchName)
                        .setUpstreamMode(CreateBranchCommand.SetupUpstreamMode.TRACK)
                        .call();

                repositoryHelper.updateRemoteBranchTrackingConfig(branchName, git);
                processStopwatch.stopAndLogTimeInMillis();
                return git.getRepository().getBranch();
            }
        })
        .timeout(Duration.ofMillis(Constraint.LOCAL_TIMEOUT_MILLIS))
        .subscribeOn(scheduler);
    }

    @Override
    public Mono<Boolean> deleteBranch(Path repoSuffix, String branchName) {
        // We can safely assume that repo has been already initialised either in commit or clone flow and can directly
        // open the repo
        Stopwatch processStopwatch = new Stopwatch("JGIT deleteBranch");
        return Mono.fromCallable(() -> {
            log.debug(Thread.currentThread().getName() + ": Deleting branch  " + branchName + "for the repo " + repoSuffix);
            // open the repo
            Path baseRepoPath = createRepoPath(repoSuffix);
            try (Git git = Git.open(baseRepoPath.toFile())) {
                // Create and checkout to new branch
                List<String> deleteBranchList =git.branchDelete()
                        .setBranchNames(branchName)
                        .setForce(Boolean.TRUE)
                        .call();
                processStopwatch.stopAndLogTimeInMillis();
                if(deleteBranchList.isEmpty()) {
                    return Boolean.FALSE;
                }
                return Boolean.TRUE;
            }
        })
        .timeout(Duration.ofMillis(Constraint.LOCAL_TIMEOUT_MILLIS))
        .subscribeOn(scheduler);
    }

    @Override
    public Mono<Boolean> checkoutToBranch(Path repoSuffix, String branchName) {

        Stopwatch processStopwatch = new Stopwatch("JGIT checkoutBranch");
        return Mono.fromCallable(() -> {
            log.debug(Thread.currentThread().getName() + ": Switching to the branch " + branchName);
            // We can safely assume that repo has been already initialised either in commit or clone flow and can directly
            // open the repo
            Path baseRepoPath = createRepoPath(repoSuffix);
            try (Git git = Git.open(baseRepoPath.toFile())) {
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
                processStopwatch.stopAndLogTimeInMillis();
                return StringUtils.equalsIgnoreCase(checkedOutBranch, "refs/heads/"+branchName);
            }
        })
        .timeout(Duration.ofMillis(Constraint.LOCAL_TIMEOUT_MILLIS))
        .subscribeOn(scheduler);
    }

    @Override
    public Mono<MergeStatusDTO> pullApplication(Path repoSuffix,
                                                String remoteUrl,
                                                String branchName,
                                                String privateKey,
                                                String publicKey) throws IOException {

        Stopwatch processStopwatch = new Stopwatch("JGIT pull");
        TransportConfigCallback transportConfigCallback = new SshTransportConfigCallback(privateKey, publicKey);

        try (Git git = Git.open(createRepoPath(repoSuffix).toFile())) {
            return Mono.fromCallable(() -> {
                log.debug(Thread.currentThread().getName() + ": Pull changes from remote  " + remoteUrl + " for the branch "+ branchName);
                    //checkout the branch on which the merge command is run
                    git.checkout().setName(branchName).setCreateBranch(false).call();
                    MergeResult mergeResult = git
                            .pull()
                            .setRemoteBranchName(branchName)
                            .setTransportConfigCallback(transportConfigCallback)
                            .setFastForward(MergeCommand.FastForwardMode.FF)
                            .call()
                            .getMergeResult();
                    MergeStatusDTO mergeStatus = new MergeStatusDTO();
                    Long count = Arrays.stream(mergeResult.getMergedCommits()).count();
                    if (mergeResult.getMergeStatus().isSuccessful()) {
                        mergeStatus.setMergeAble(true);
                        mergeStatus.setStatus(count + " commits merged from origin/" + branchName);
                    } else {
                        //If there are conflicts add the conflicting file names to the response structure
                        mergeStatus.setMergeAble(false);
                        List<String> mergeConflictFiles = new ArrayList<>();
                        if(!Optional.ofNullable(mergeResult.getConflicts()).isEmpty()) {
                            mergeConflictFiles.addAll(mergeResult.getConflicts().keySet());
                        }
                        mergeStatus.setConflictingFiles(mergeConflictFiles);
                        //On merge conflicts abort the merge => git merge --abort
                        git.getRepository().writeMergeCommitMsg(null);
                        git.getRepository().writeMergeHeads(null);
                        processStopwatch.stopAndLogTimeInMillis();
                        throw new org.eclipse.jgit.errors.CheckoutConflictException(mergeConflictFiles.toString());
                    }
                    processStopwatch.stopAndLogTimeInMillis();
                    return mergeStatus;
            })
            .onErrorResume(error -> {
                try {
                    return resetToLastCommit(git)
                            .flatMap(ignore -> Mono.error(error));
                } catch (GitAPIException e) {
                    log.error("Error for hard resetting to latest commit {0}", e);
                    return Mono.error(e);
                }
            })
            .timeout(Duration.ofMillis(Constraint.REMOTE_TIMEOUT_MILLIS))
            .subscribeOn(scheduler);
        }
    }

    @Override
    public Mono<List<GitBranchDTO>> listBranches(Path repoSuffix,
                                                 String remoteUrl,
                                                 String privateKey,
                                                 String publicKey,
                                                 Boolean refreshBranches) {
        Stopwatch processStopwatch = new Stopwatch("JGIT listBranches, refreshBranch: " + refreshBranches);
        Path baseRepoPath = createRepoPath(repoSuffix);
        return Mono.fromCallable(() -> {
            log.debug(Thread.currentThread().getName() + ": Get branches for the application " + repoSuffix);
            TransportConfigCallback transportConfigCallback = new SshTransportConfigCallback(privateKey, publicKey);
            Git git = Git.open(baseRepoPath.toFile());
            List<Ref> refList = git.branchList().setListMode(ListBranchCommand.ListMode.ALL).call();
            String defaultBranch = null;

            if (Boolean.TRUE.equals(refreshBranches)) {
                // Get default branch name from the remote
                defaultBranch = git.lsRemote().setRemote(remoteUrl).setTransportConfigCallback(transportConfigCallback).callAsMap().get("HEAD").getTarget().getName();
            }

            List<GitBranchDTO> branchList = new ArrayList<>();
            GitBranchDTO gitBranchDTO = new GitBranchDTO();
            if(refList.isEmpty()) {
                gitBranchDTO.setBranchName(git.getRepository().getBranch());
                gitBranchDTO.setDefault(true);
                branchList.add(gitBranchDTO);
            } else {
                if (Boolean.TRUE.equals(refreshBranches)) {
                    gitBranchDTO.setBranchName(defaultBranch.replace("refs/heads/",""));
                    gitBranchDTO.setDefault(true);
                    branchList.add(gitBranchDTO);
                }

                for(Ref ref : refList) {
                    if(!ref.getName().equals(defaultBranch)) {
                        gitBranchDTO = new GitBranchDTO();
                        gitBranchDTO.setBranchName(ref.getName()
                                .replace("refs/","").replace("heads/", "").replace("remotes/", ""));
                        gitBranchDTO.setDefault(false);
                        branchList.add(gitBranchDTO);
                    }
                }
            }
            git.close();
            processStopwatch.stopAndLogTimeInMillis();
            return branchList;
        })
        .timeout(Duration.ofMillis(Constraint.REMOTE_TIMEOUT_MILLIS))
        .subscribeOn(scheduler);
    }

    /**
     * This method will handle the git-status functionality
     *
     * @param repoPath Path to actual repo
     * @param branchName branch name for which the status is required
     * @return Map of file names those are modified, conflicted etc.
     */
    @Override
    public Mono<GitStatusDTO> getStatus(Path repoPath, String branchName) {
        Stopwatch processStopwatch = new Stopwatch("JGIT status");
        return Mono.fromCallable(() -> {
            try (Git git = Git.open(repoPath.toFile())) {
                log.debug(Thread.currentThread().getName() + ": Get status for repo  " + repoPath + ", branch " + branchName);
                Status status = git.status().call();
                GitStatusDTO response = new GitStatusDTO();
                Set<String> modifiedAssets = new HashSet<>();
                modifiedAssets.addAll(status.getModified());
                modifiedAssets.addAll(status.getAdded());
                modifiedAssets.addAll(status.getRemoved());
                modifiedAssets.addAll(status.getUncommittedChanges());
                modifiedAssets.addAll(status.getUntracked());
                response.setAdded(status.getAdded());
                response.setRemoved(status.getRemoved());

                long modifiedPages = 0L;
                long modifiedQueries = 0L;
                long modifiedJSObjects = 0L;
                long modifiedDatasources = 0L;
                for (String x : modifiedAssets) {
                    if (x.contains(GitDirectories.PAGE_DIRECTORY + "/")) {
                        modifiedPages++;
                    } else if (x.contains(GitDirectories.ACTION_DIRECTORY + "/")) {
                        modifiedQueries++;
                    } else if (x.contains(GitDirectories.ACTION_COLLECTION_DIRECTORY + "/")) {
                        modifiedJSObjects++;
                    } else if (x.contains(GitDirectories.DATASOURCE_DIRECTORY + "/")) {
                        modifiedDatasources++;
                    }
                }
                response.setModified(modifiedAssets);
                response.setConflicting(status.getConflicting());
                response.setIsClean(status.isClean());
                response.setModifiedPages(modifiedPages);
                response.setModifiedQueries(modifiedQueries);
                response.setModifiedJSObjects(modifiedJSObjects);
                response.setModifiedDatasources(modifiedDatasources);

                BranchTrackingStatus trackingStatus = BranchTrackingStatus.of(git.getRepository(), branchName);
                if (trackingStatus != null) {
                    response.setAheadCount(trackingStatus.getAheadCount());
                    response.setBehindCount(trackingStatus.getBehindCount());
                    response.setRemoteBranch(trackingStatus.getRemoteTrackingBranch());
                } else {
                    log.debug("Remote tracking details not present for branch: {}, repo: {}", branchName, repoPath);
                    response.setAheadCount(0);
                    response.setBehindCount(0);
                    response.setRemoteBranch("untracked");
                }

                // Remove modified changes from current branch so that checkout to other branches will be possible
                if (!status.isClean()) {
                    return resetToLastCommit(git)
                            .map(ref -> {
                                processStopwatch.stopAndLogTimeInMillis();
                                return response;
                            });
                }
                processStopwatch.stopAndLogTimeInMillis();
                return Mono.just(response);
            }
        })
        .flatMap(response -> response)
        .timeout(Duration.ofMillis(Constraint.LOCAL_TIMEOUT_MILLIS))
        .subscribeOn(scheduler);
    }

    @Override
    public Mono<String> mergeBranch(Path repoSuffix, String sourceBranch, String destinationBranch) {
        return Mono.fromCallable(() -> {
            Stopwatch processStopwatch = new Stopwatch("JGIT merge");
            log.debug(Thread.currentThread().getName() + ": Merge branch  " + sourceBranch + " on " + destinationBranch);
            try (Git git = Git.open(createRepoPath(repoSuffix).toFile())) {
                try {
                    //checkout the branch on which the merge command is run
                    git.checkout().setName(destinationBranch).setCreateBranch(false).call();

                    MergeResult mergeResult = git.merge().include(git.getRepository().findRef(sourceBranch)).setStrategy(MergeStrategy.RECURSIVE).call();
                    processStopwatch.stopAndLogTimeInMillis();
                    return mergeResult.getMergeStatus().name();
                } catch (GitAPIException e) {
                    //On merge conflicts abort the merge => git merge --abort
                    git.getRepository().writeMergeCommitMsg(null);
                    git.getRepository().writeMergeHeads(null);
                    processStopwatch.stopAndLogTimeInMillis();
                    throw new Exception(e);
                }
            }
        })
        .onErrorResume(error -> {
            try {
                return resetToLastCommit(repoSuffix, destinationBranch)
                        .thenReturn(error.getMessage());
            } catch (GitAPIException | IOException e) {
                log.error("Error while hard resetting to latest commit {0}", e);
                return Mono.error(e);
            }
        })
        .timeout(Duration.ofMillis(Constraint.LOCAL_TIMEOUT_MILLIS))
        .subscribeOn(scheduler);
    }

    @Override
    public Mono<String> fetchRemote(Path repoSuffix, String publicKey, String privateKey, boolean isRepoPath) {
        Stopwatch processStopwatch = new Stopwatch("JGIT fetch");
        Path repoPath = Boolean.TRUE.equals(isRepoPath) ? repoSuffix : createRepoPath(repoSuffix);
        return Mono.fromCallable(() -> {
            TransportConfigCallback config = new SshTransportConfigCallback(privateKey, publicKey);
            try (Git git = Git.open(repoPath.toFile())) {
                log.debug(Thread.currentThread().getName() + ": fetch remote repo " + git.getRepository());
                String fetchMessages = git.fetch()
                        .setRemoveDeletedRefs(true)
                        .setTransportConfigCallback(config)
                        .call()
                        .getMessages();
                processStopwatch.stopAndLogTimeInMillis();
                return fetchMessages;
            }
        })
        .onErrorResume(error -> {
            log.error(error.getMessage());
            return Mono.error(error);
        })
        .timeout(Duration.ofMillis(Constraint.REMOTE_TIMEOUT_MILLIS))
        .subscribeOn(scheduler);
    }

    @Override
    public Mono<MergeStatusDTO> isMergeBranch(Path repoSuffix, String sourceBranch, String destinationBranch) {
        Stopwatch processStopwatch = new Stopwatch("JGIT mergeablityCheck");
        return Mono.fromCallable(() -> {
            log.debug(Thread.currentThread().getName() + ": Check mergeability for repo {} with src: {}, dest: {}", repoSuffix, sourceBranch, destinationBranch);

            try (Git git = Git.open(createRepoPath(repoSuffix).toFile())) {

                //checkout the branch on which the merge command is run
                try{
                    git.checkout().setName(destinationBranch).setCreateBranch(false).call();
                } catch (GitAPIException e) {
                    if(e instanceof CheckoutConflictException) {
                        MergeStatusDTO mergeStatus = new MergeStatusDTO();
                        mergeStatus.setMergeAble(false);
                        mergeStatus.setConflictingFiles(((CheckoutConflictException) e).getConflictingPaths());
                        git.close();
                        processStopwatch.stopAndLogTimeInMillis();
                        return mergeStatus;
                    }
                }

                MergeResult mergeResult = git.merge()
                        .include(git.getRepository().findRef(sourceBranch))
                        .setFastForward(MergeCommand.FastForwardMode.NO_FF)
                        .setCommit(false)
                        .call();

                MergeStatusDTO mergeStatus = new MergeStatusDTO();
                if(mergeResult.getMergeStatus().isSuccessful()) {
                    mergeStatus.setMergeAble(true);
                    mergeStatus.setMessage(SUCCESS_MERGE_STATUS);
                } else {
                    //If there aer conflicts add the conflicting file names to the response structure
                    mergeStatus.setMergeAble(false);
                    List<String> mergeConflictFiles = new ArrayList<>(mergeResult.getConflicts().keySet());
                    mergeStatus.setConflictingFiles(mergeConflictFiles);
                    StringBuilder errorMessage = new StringBuilder();
                    if (mergeResult.getMergeStatus().equals(MergeResult.MergeStatus.CONFLICTING)) {
                        errorMessage.append("Conflicts");
                    } else {
                        errorMessage.append(mergeResult.getMergeStatus().toString());
                    }
                    errorMessage.append(" while merging branch: ").append(destinationBranch).append(" <= ").append(sourceBranch);
                    mergeStatus.setMessage(errorMessage.toString());
                    mergeStatus.setReferenceDoc(ErrorReferenceDocUrl.GIT_MERGE_CONFLICT);
                }
                mergeStatus.setStatus(mergeResult.getMergeStatus().name());
                return mergeStatus;
            }
        })
        .flatMap(status -> {
            try {
                // Revert uncommitted changes if any
                return resetToLastCommit(repoSuffix, destinationBranch)
                        .map(ignore -> {
                            processStopwatch.stopAndLogTimeInMillis();
                            return status;
                        });
            } catch (GitAPIException | IOException e) {
                log.error("Error for hard resetting to latest commit {0}", e);
                return Mono.error(e);
            }
        })
        .timeout(Duration.ofMillis(Constraint.LOCAL_TIMEOUT_MILLIS))
        .subscribeOn(scheduler);
    }

    public Mono<String> checkoutRemoteBranch(Path repoSuffix, String branchName) {
        // We can safely assume that repo has been already initialised either in commit or clone flow and can directly
        // open the repo
        return Mono.fromCallable(() -> {
            log.debug(Thread.currentThread().getName() + ": Checking out remote branch origin/" + branchName + " for the repo " + repoSuffix);
            // open the repo
            Path baseRepoPath = createRepoPath(repoSuffix);
            try (Git git = Git.open(baseRepoPath.toFile())) {
                // Create and checkout to new branch
                git.checkout()
                        .setCreateBranch(Boolean.TRUE)
                        .setName(branchName)
                        .setUpstreamMode(CreateBranchCommand.SetupUpstreamMode.TRACK)
                        .setStartPoint("origin/" + branchName)
                        .call();

                StoredConfig config = git.getRepository().getConfig();
                config.setString("branch", branchName, "remote", "origin");
                config.setString("branch", branchName, "merge", "refs/heads/" + branchName);
                config.save();
                return git.getRepository().getBranch();
            }
        }).subscribeOn(scheduler);
    }

    @Override
    public Mono<Boolean> testConnection(String publicKey, String privateKey, String remoteUrl) {
        return Mono.fromCallable(() -> {
            TransportConfigCallback transportConfigCallback = new SshTransportConfigCallback(privateKey, publicKey);
            Git.lsRemoteRepository()
                    .setTransportConfigCallback(transportConfigCallback)
                    .setRemote(remoteUrl)
                    .setHeads(true)
                    .setTags(true)
                    .call();
            return true;
        }).timeout(Duration.ofMillis(Constraint.REMOTE_TIMEOUT_MILLIS))
                .subscribeOn(scheduler);
    }


    private Mono<Ref> resetToLastCommit(Git git) throws GitAPIException {
        return Mono.fromCallable(() -> {
            Ref ref = git.reset().setMode(ResetCommand.ResetType.HARD).call();
            return ref;
        })
        .timeout(Duration.ofMillis(Constraint.LOCAL_TIMEOUT_MILLIS))
        .subscribeOn(scheduler);
    }

    public Mono<Boolean> resetToLastCommit(Path repoSuffix, String branchName) throws GitAPIException, IOException {
        try (Git git = Git.open(createRepoPath(repoSuffix).toFile())){
            return this.resetToLastCommit(git)
                    .flatMap(ref -> checkoutToBranch(repoSuffix, branchName))
                    .flatMap(checkedOut -> {
                        try {
                            return resetToLastCommit(git)
                                    .thenReturn(true);
                        } catch (GitAPIException e) {
                            log.error(e.getMessage());
                            return Mono.error(e);
                        }
                    });
        }
    }
}
