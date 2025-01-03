package com.appsmith.git.handler.ce;

import com.appsmith.external.configurations.git.GitConfig;
import com.appsmith.external.constants.AnalyticsEvents;
import com.appsmith.external.constants.ErrorReferenceDocUrl;
import com.appsmith.external.dtos.GitBranchDTO;
import com.appsmith.external.dtos.GitLogDTO;
import com.appsmith.external.dtos.GitRefDTO;
import com.appsmith.external.dtos.GitStatusDTO;
import com.appsmith.external.dtos.MergeStatusDTO;
import com.appsmith.external.git.constants.GitSpan;
import com.appsmith.external.git.constants.ce.RefType;
import com.appsmith.external.git.handler.FSGitHandler;
import com.appsmith.external.helpers.Stopwatch;
import com.appsmith.git.configurations.GitServiceConfig;
import com.appsmith.git.constants.AppsmithBotAsset;
import com.appsmith.git.constants.CommonConstants;
import com.appsmith.git.constants.Constraint;
import com.appsmith.git.constants.GitDirectories;
import com.appsmith.git.helpers.RepositoryHelper;
import com.appsmith.git.helpers.SshTransportConfigCallback;
import com.appsmith.git.helpers.StopwatchHelpers;
import io.micrometer.observation.ObservationRegistry;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.eclipse.jgit.api.CreateBranchCommand;
import org.eclipse.jgit.api.Git;
import org.eclipse.jgit.api.ListBranchCommand;
import org.eclipse.jgit.api.MergeCommand;
import org.eclipse.jgit.api.MergeResult;
import org.eclipse.jgit.api.RebaseCommand;
import org.eclipse.jgit.api.RebaseResult;
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
import org.eclipse.jgit.transport.RefSpec;
import org.eclipse.jgit.util.StringUtils;
import org.springframework.stereotype.Component;
import org.springframework.util.FileSystemUtils;
import reactor.core.observability.micrometer.Micrometer;
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
import java.util.Date;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.function.Function;
import java.util.function.Predicate;
import java.util.stream.Collectors;
import java.util.stream.Stream;

import static com.appsmith.external.git.constants.GitConstants.GitMetricConstants.CHECKOUT_REMOTE;
import static com.appsmith.external.git.constants.GitConstants.GitMetricConstants.HARD_RESET;
import static com.appsmith.git.constants.CommonConstants.FILE_MIGRATION_MESSAGE;
import static java.lang.Boolean.FALSE;
import static java.lang.Boolean.TRUE;

@Slf4j
@Component
@RequiredArgsConstructor
public class FSGitHandlerCEImpl implements FSGitHandler {

    private final RepositoryHelper repositoryHelper = new RepositoryHelper();

    private final GitServiceConfig gitServiceConfig;
    private final GitConfig gitConfig;

    protected final ObservationRegistry observationRegistry;

    public static final DateTimeFormatter ISO_FORMATTER =
            DateTimeFormatter.ISO_INSTANT.withZone(ZoneId.from(ZoneOffset.UTC));

    private final Scheduler scheduler = Schedulers.boundedElastic();

    private static final String SUCCESS_MERGE_STATUS = "This branch has no conflicts with the base branch.";

    /**
     * This method will handle the git-commit functionality. Under the hood it checks if the repo has already been
     * initialised and will be initialised if git repo is not present
     * @param path          parent path to repo
     * @param commitMessage message which will be registered for this commit
     * @param authorName    author details
     * @param authorEmail   author details
     * @param doAmend       To amend with the previous commit
     * @return if the commit was successful
     */
    @Override
    public Mono<String> commitArtifact(
            Path path,
            String commitMessage,
            String authorName,
            String authorEmail,
            boolean isSuffixedPath,
            boolean doAmend) {

        final String finalAuthorName =
                StringUtils.isEmptyOrNull(authorName) ? AppsmithBotAsset.APPSMITH_BOT_USERNAME : authorName;
        final String finalAuthorEmail =
                StringUtils.isEmptyOrNull(authorEmail) ? AppsmithBotAsset.APPSMITH_BOT_EMAIL : authorEmail;
        final Path repoPath = TRUE.equals(isSuffixedPath) ? createRepoPath(path) : path;

        return Mono.using(
                        () -> Git.open(repoPath.toFile()),
                        git -> Mono.fromCallable(() -> {
                                    log.debug("Trying to commit to local repo path, {}", path);

                                    Stopwatch processStopwatch = StopwatchHelpers.startStopwatch(
                                            repoPath, AnalyticsEvents.GIT_COMMIT.getEventName());
                                    // Just need to open a repository here and make a commit
                                    // Stage all the files added and modified
                                    git.add().addFilepattern(".").call();
                                    // Stage modified and deleted files
                                    git.add()
                                            .setUpdate(true)
                                            .addFilepattern(".")
                                            .call();

                                    // Commit the changes
                                    git.commit()
                                            .setMessage(commitMessage)
                                            // Only make a commit if there are any updates
                                            .setAllowEmpty(false)
                                            .setAuthor(finalAuthorName, finalAuthorEmail)
                                            .setCommitter(finalAuthorName, finalAuthorEmail)
                                            .setAmend(doAmend)
                                            .call();
                                    processStopwatch.stopAndLogTimeInMillis();
                                    return "Committed successfully!";
                                })
                                .timeout(Duration.ofMillis(Constraint.TIMEOUT_MILLIS))
                                .name(GitSpan.FS_COMMIT)
                                .tap(Micrometer.observation(observationRegistry)),
                        Git::close)
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
        try (Git ignored = Git.init().setDirectory(repoPath.toFile()).call()) {
            return true;
        }
    }

    /**
     * Method to get the commit history
     * @param repoSuffix Path used to generate the repo url specific to the application for which the commit history is requested
     * @return list of git commits
     */
    @Override
    public Mono<List<GitLogDTO>> getCommitHistory(Path repoSuffix) {
        Path repoPath = createRepoPath(repoSuffix);
        return Mono.using(
                        () -> Git.open(repoPath.toFile()),
                        git -> Mono.fromCallable(() -> {
                                    log.debug(Thread.currentThread().getName() + ": get commit history for  "
                                            + repoSuffix);
                                    List<GitLogDTO> commitLogs = new ArrayList<>();
                                    Stopwatch processStopwatch = StopwatchHelpers.startStopwatch(
                                            repoPath, AnalyticsEvents.GIT_COMMIT_HISTORY.getEventName());
                                    Iterable<RevCommit> gitLogs = git.log()
                                            .setMaxCount(Constraint.MAX_COMMIT_LOGS)
                                            .call();
                                    gitLogs.forEach(revCommit -> {
                                        PersonIdent author = revCommit.getAuthorIdent();
                                        GitLogDTO gitLog = new GitLogDTO(
                                                revCommit.getName(),
                                                author.getName(),
                                                author.getEmailAddress(),
                                                revCommit.getFullMessage(),
                                                ISO_FORMATTER.format(
                                                        new Date(revCommit.getCommitTime() * 1000L).toInstant()));
                                        processStopwatch.stopAndLogTimeInMillis();
                                        commitLogs.add(gitLog);
                                    });
                                    return commitLogs;
                                })
                                .timeout(Duration.ofMillis(Constraint.TIMEOUT_MILLIS)),
                        Git::close)
                .subscribeOn(scheduler);
    }

    @Override
    public Path createRepoPath(Path suffix) {
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
    public Mono<String> pushApplication(
            Path repoSuffix, String remoteUrl, String publicKey, String privateKey, String branchName) {
        // We can safely assume that repo has been already initialised either in commit or clone flow and can directly
        // open the repo
        Path baseRepoPath = createRepoPath(repoSuffix);

        return gitConfig.getIsAtomicPushAllowed().flatMap(isAtomicPushAllowed -> {
            return Mono.using(
                            () -> Git.open(baseRepoPath.toFile()),
                            git -> Mono.fromCallable(() -> {
                                        log.debug(Thread.currentThread().getName() + ": pushing changes to remote "
                                                + remoteUrl);
                                        // open the repo
                                        Stopwatch processStopwatch = StopwatchHelpers.startStopwatch(
                                                baseRepoPath, AnalyticsEvents.GIT_PUSH.getEventName());
                                        TransportConfigCallback transportConfigCallback =
                                                new SshTransportConfigCallback(privateKey, publicKey);

                                        StringBuilder result = new StringBuilder("Pushed successfully with status : ");
                                        git.push()
                                                .setAtomic(isAtomicPushAllowed)
                                                .setTransportConfigCallback(transportConfigCallback)
                                                .setRemote(remoteUrl)
                                                .call()
                                                .forEach(pushResult -> pushResult
                                                        .getRemoteUpdates()
                                                        .forEach(remoteRefUpdate -> {
                                                            result.append(remoteRefUpdate.getStatus())
                                                                    .append(",");
                                                            if (!StringUtils.isEmptyOrNull(
                                                                    remoteRefUpdate.getMessage())) {
                                                                result.append(remoteRefUpdate.getMessage())
                                                                        .append(",");
                                                            }
                                                        }));
                                        // We can support username and password in future if needed
                                        // pushCommand.setCredentialsProvider(new
                                        // UsernamePasswordCredentialsProvider("username",
                                        // "password"));
                                        processStopwatch.stopAndLogTimeInMillis();
                                        return result.substring(0, result.length() - 1);
                                    })
                                    .timeout(Duration.ofMillis(Constraint.TIMEOUT_MILLIS))
                                    .name(GitSpan.FS_PUSH)
                                    .tap(Micrometer.observation(observationRegistry)),
                            Git::close)
                    // this subscribeOn on is required because Mono.using
                    // is not deferring the execution of push and for that reason it runs on the
                    // lettuce-nioEventLoop thread instead of boundedElastic
                    .subscribeOn(scheduler);
        });
    }

    /** Clone the repo to the file path : container-volume/orgId/defaultAppId/repo/<Data>
     *
     *  @param repoSuffix combination of orgId, defaultId and repoName
     *  @param remoteUrl ssh url of the git repo(we support cloning via ssh url only with deploy key)
     *  @param privateKey generated by us and specific to the defaultApplication
     *  @param publicKey generated by us and specific to the defaultApplication
     *  @return defaultBranchName of the repo
     * */
    @Override
    public Mono<String> cloneRemoteIntoArtifactRepo(
            Path repoSuffix, String remoteUrl, String privateKey, String publicKey) {

        Stopwatch processStopwatch =
                StopwatchHelpers.startStopwatch(repoSuffix, AnalyticsEvents.GIT_CLONE.getEventName());
        return Mono.fromCallable(() -> {
                    log.debug(Thread.currentThread().getName() + ": Cloning the repo from the remote " + remoteUrl);
                    final TransportConfigCallback transportConfigCallback =
                            new SshTransportConfigCallback(privateKey, publicKey);
                    File file = Paths.get(gitServiceConfig.getGitRootPath())
                            .resolve(repoSuffix)
                            .toFile();
                    while (file.exists()) {
                        FileSystemUtils.deleteRecursively(file);
                    }
                    String branchName;
                    try (Git git = Git.cloneRepository()
                            .setURI(remoteUrl)
                            .setTransportConfigCallback(transportConfigCallback)
                            .setDirectory(file)
                            .call()) {
                        branchName = git.getRepository().getBranch();

                        repositoryHelper.updateRemoteBranchTrackingConfig(branchName, git);
                    }
                    processStopwatch.stopAndLogTimeInMillis();
                    return branchName;
                })
                .timeout(Duration.ofMillis(Constraint.TIMEOUT_MILLIS))
                .name(GitSpan.FS_CLONE_REPO)
                .tap(Micrometer.observation(observationRegistry))
                .subscribeOn(scheduler);
    }

    @Override
    public Mono<String> createAndCheckoutToBranch(Path repoSuffix, String branchName) {
        // We can safely assume that repo has been already initialised either in commit or clone flow and can directly
        // open the repo
        Stopwatch processStopwatch =
                StopwatchHelpers.startStopwatch(repoSuffix, AnalyticsEvents.GIT_CREATE_BRANCH.getEventName());
        return Mono.using(
                        () -> Git.open(createRepoPath(repoSuffix).toFile()),
                        git -> Mono.fromCallable(() -> {
                                    log.debug(Thread.currentThread().getName() + ": Creating branch  " + branchName
                                            + "for the repo " + repoSuffix);
                                    // open the repo
                                    // Create and checkout to new branch
                                    git.checkout()
                                            .setCreateBranch(TRUE)
                                            .setName(branchName)
                                            .setUpstreamMode(CreateBranchCommand.SetupUpstreamMode.TRACK)
                                            .call();

                                    repositoryHelper.updateRemoteBranchTrackingConfig(branchName, git);
                                    processStopwatch.stopAndLogTimeInMillis();
                                    return git.getRepository().getBranch();
                                })
                                .timeout(Duration.ofMillis(Constraint.TIMEOUT_MILLIS))
                                .name(GitSpan.FS_CREATE_BRANCH)
                                .tap(Micrometer.observation(observationRegistry)),
                        Git::close)
                .subscribeOn(scheduler);
    }

    private String createAndCheckoutBranch(Git git, GitRefDTO gitRefDTO) throws GitAPIException, IOException {
        String branchName = gitRefDTO.getRefName();
        git.checkout()
                .setCreateBranch(TRUE)
                .setName(branchName)
                .setUpstreamMode(CreateBranchCommand.SetupUpstreamMode.TRACK)
                .call();

        repositoryHelper.updateRemoteBranchTrackingConfig(branchName, git);
        return git.getRepository().getBranch();
    }

    private String createTag(Git git, GitRefDTO gitRefDTO) throws GitAPIException {
        String tagName = gitRefDTO.getRefName();
        String message = gitRefDTO.getMessage();
        return git.tag().setName(tagName).setMessage(message).call().getName();
    }

    @Override
    public Mono<String> createAndCheckoutReference(Path repoSuffix, GitRefDTO gitRefDTO) {
        RefType refType = gitRefDTO.getRefType();
        String refName = gitRefDTO.getRefName();

        return Mono.using(
                        () -> Git.open(createRepoPath(repoSuffix).toFile()),
                        git -> Mono.fromCallable(() -> {
                                    log.info(
                                            "{} : Creating reference of type {} and name {} for the repo {}",
                                            Thread.currentThread().getName(),
                                            refType.name(),
                                            refName,
                                            repoSuffix);

                                    if (RefType.tag.equals(refType)) {
                                        return createTag(git, gitRefDTO);
                                    }

                                    return createAndCheckoutBranch(git, gitRefDTO);
                                })
                                .timeout(Duration.ofMillis(Constraint.TIMEOUT_MILLIS))
                                .name(GitSpan.FS_CREATE_BRANCH)
                                .tap(Micrometer.observation(observationRegistry)),
                        Git::close)
                .subscribeOn(scheduler);
    }

    @Override
    public Mono<Boolean> deleteBranch(Path repoSuffix, String branchName) {
        // We can safely assume that repo has been already initialised either in commit or clone flow and can directly
        // open the repo
        Stopwatch processStopwatch =
                StopwatchHelpers.startStopwatch(repoSuffix, AnalyticsEvents.GIT_DELETE_BRANCH.getEventName());
        return Mono.using(
                        () -> Git.open(createRepoPath(repoSuffix).toFile()),
                        git -> Mono.fromCallable(() -> {
                                    log.debug(Thread.currentThread().getName() + ": Deleting branch  " + branchName
                                            + "for the repo " + repoSuffix);
                                    // open the repo
                                    // Create and checkout to new branch
                                    List<String> deleteBranchList = git.branchDelete()
                                            .setBranchNames(branchName)
                                            .setForce(TRUE)
                                            .call();
                                    processStopwatch.stopAndLogTimeInMillis();
                                    if (deleteBranchList.isEmpty()) {
                                        return Boolean.FALSE;
                                    }
                                    return TRUE;
                                })
                                .timeout(Duration.ofMillis(Constraint.TIMEOUT_MILLIS))
                                .name(GitSpan.FS_DELETE_BRANCH)
                                .tap(Micrometer.observation(observationRegistry)),
                        Git::close)
                .subscribeOn(scheduler);
    }

    @Override
    public Mono<Boolean> checkoutToBranch(Path repoSuffix, String branchName) {

        Stopwatch processStopwatch =
                StopwatchHelpers.startStopwatch(repoSuffix, AnalyticsEvents.GIT_CHECKOUT.getEventName());
        return Mono.using(
                        () -> Git.open(createRepoPath(repoSuffix).toFile()),
                        git -> Mono.fromCallable(() -> {
                                    log.debug(Thread.currentThread().getName() + ": Switching to the branch "
                                            + branchName);
                                    // We can safely assume that repo has been already initialised either in commit or
                                    // clone flow and
                                    // can directly
                                    // open the repo
                                    if (StringUtils.equalsIgnoreCase(
                                            branchName, git.getRepository().getBranch())) {
                                        return TRUE;
                                    }
                                    // Create and checkout to new branch
                                    String checkedOutBranch = git.checkout()
                                            .setCreateBranch(Boolean.FALSE)
                                            .setName(branchName)
                                            .setUpstreamMode(CreateBranchCommand.SetupUpstreamMode.SET_UPSTREAM)
                                            .call()
                                            .getName();
                                    processStopwatch.stopAndLogTimeInMillis();
                                    return StringUtils.equalsIgnoreCase(checkedOutBranch, "refs/heads/" + branchName);
                                })
                                .timeout(Duration.ofMillis(Constraint.TIMEOUT_MILLIS))
                                .tag(CHECKOUT_REMOTE, FALSE.toString())
                                .name(GitSpan.FS_CHECKOUT_BRANCH)
                                .tap(Micrometer.observation(observationRegistry)),
                        Git::close)
                .subscribeOn(scheduler);
    }

    @Override
    public Mono<MergeStatusDTO> pullApplication(
            Path repoSuffix, String remoteUrl, String branchName, String privateKey, String publicKey)
            throws IOException {

        Stopwatch processStopwatch =
                StopwatchHelpers.startStopwatch(repoSuffix, AnalyticsEvents.GIT_PULL.getEventName());
        TransportConfigCallback transportConfigCallback = new SshTransportConfigCallback(privateKey, publicKey);

        return Mono.using(
                        () -> Git.open(createRepoPath(repoSuffix).toFile()),
                        git -> Mono.fromCallable(() -> {
                                    log.debug(Thread.currentThread().getName() + ": Pull changes from remote  "
                                            + remoteUrl + " for the branch " + branchName);
                                    // checkout the branch on which the merge command is run
                                    MergeResult mergeResult;
                                    try {
                                        git.checkout()
                                                .setName(branchName)
                                                .setCreateBranch(false)
                                                .call();
                                        mergeResult = git.pull()
                                                .setRemoteBranchName(branchName)
                                                .setTransportConfigCallback(transportConfigCallback)
                                                .setFastForward(MergeCommand.FastForwardMode.FF)
                                                .call()
                                                .getMergeResult();
                                    } catch (GitAPIException e) {
                                        throw e;
                                    }
                                    MergeStatusDTO mergeStatus = new MergeStatusDTO();
                                    Long count = Arrays.stream(mergeResult.getMergedCommits())
                                            .count();
                                    if (mergeResult.getMergeStatus().isSuccessful()) {
                                        mergeStatus.setMergeAble(true);
                                        mergeStatus.setStatus(count + " commits merged from origin/" + branchName);
                                        processStopwatch.stopAndLogTimeInMillis();
                                        return mergeStatus;
                                    } else {
                                        // If there are conflicts add the conflicting file names to the response
                                        // structure
                                        mergeStatus.setMergeAble(false);
                                        List<String> mergeConflictFiles = new ArrayList<>();
                                        if (!Optional.ofNullable(mergeResult.getConflicts())
                                                .isEmpty()) {
                                            mergeConflictFiles.addAll(
                                                    mergeResult.getConflicts().keySet());
                                        }
                                        mergeStatus.setConflictingFiles(mergeConflictFiles);
                                        try {
                                            // On merge conflicts abort the merge => git merge --abort
                                            git.getRepository().writeMergeCommitMsg(null);
                                            git.getRepository().writeMergeHeads(null);
                                            throw new org.eclipse.jgit.errors.CheckoutConflictException(
                                                    mergeConflictFiles.toString());
                                        } catch (IOException e) {
                                            log.debug("Encountered error while aborting merge", e);
                                            throw new org.eclipse.jgit.errors.CheckoutConflictException(
                                                    mergeConflictFiles.toString());
                                        } finally {
                                            processStopwatch.stopAndLogTimeInMillis();
                                        }
                                    }
                                })
                                .onErrorResume(error -> resetToLastCommit(git).flatMap(ignore -> Mono.error(error)))
                                .timeout(Duration.ofMillis(Constraint.TIMEOUT_MILLIS))
                                .name(GitSpan.FS_PULL)
                                .tap(Micrometer.observation(observationRegistry)),
                        Git::close)
                .subscribeOn(scheduler);
    }

    @Override
    public Mono<List<GitBranchDTO>> listBranches(Path repoSuffix) {
        Path baseRepoPath = createRepoPath(repoSuffix);

        return Mono.using(
                        () -> Git.open(baseRepoPath.toFile()),
                        git -> Mono.fromCallable(() -> {
                                    log.debug(Thread.currentThread().getName() + ": Get branches for the application "
                                            + repoSuffix);

                                    List<Ref> refList = git.branchList()
                                            .setListMode(ListBranchCommand.ListMode.ALL)
                                            .call();

                                    List<GitBranchDTO> branchList = new ArrayList<>();
                                    GitBranchDTO gitBranchDTO = new GitBranchDTO();
                                    if (refList.isEmpty()) {
                                        gitBranchDTO.setBranchName(
                                                git.getRepository().getBranch());
                                        branchList.add(gitBranchDTO);
                                    } else {
                                        for (Ref ref : refList) {
                                            // if (!ref.getName().equals(defaultBranch)) {
                                            gitBranchDTO = new GitBranchDTO();
                                            gitBranchDTO.setBranchName(ref.getName()
                                                    .replace("refs/", "")
                                                    .replace("heads/", "")
                                                    .replace("remotes/", ""));
                                            branchList.add(gitBranchDTO);
                                        }
                                    }
                                    return branchList;
                                })
                                .timeout(Duration.ofMillis(Constraint.TIMEOUT_MILLIS)),
                        Git::close)
                .subscribeOn(scheduler);
    }

    @Override
    public Mono<String> getRemoteDefaultBranch(Path repoSuffix, String remoteUrl, String privateKey, String publicKey) {
        Path baseRepoPath = createRepoPath(repoSuffix);
        return Mono.using(
                        () -> Git.open(baseRepoPath.toFile()),
                        git -> Mono.fromCallable(() -> {
                                    TransportConfigCallback transportConfigCallback =
                                            new SshTransportConfigCallback(privateKey, publicKey);

                                    return git.lsRemote()
                                            .setRemote(remoteUrl)
                                            .setTransportConfigCallback(transportConfigCallback)
                                            .callAsMap()
                                            .get("HEAD")
                                            .getTarget()
                                            .getName()
                                            .replace("refs/heads/", "");
                                })
                                .timeout(Duration.ofMillis(Constraint.TIMEOUT_MILLIS)),
                        Git::close)
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
        Stopwatch processStopwatch =
                StopwatchHelpers.startStopwatch(repoPath, AnalyticsEvents.GIT_STATUS.getEventName());
        return Mono.using(
                        () -> Git.open(repoPath.toFile()),
                        git -> Mono.fromCallable(() -> {
                                    log.debug(Thread.currentThread().getName() + ": Get status for repo  " + repoPath
                                            + ", branch " + branchName);
                                    Status status = git.status().call();
                                    GitStatusDTO response = new GitStatusDTO();

                                    // resource changes
                                    Set<String> modified = Stream.concat(
                                                    status.getChanged().stream(), status.getModified().stream())
                                            .collect(Collectors.toSet());
                                    Set<String> added = Stream.concat(
                                                    status.getAdded().stream(), status.getUntracked().stream())
                                            .collect(Collectors.toSet());
                                    Set<String> removed = Stream.concat(
                                                    status.getRemoved().stream(), status.getMissing().stream())
                                            .collect(Collectors.toSet());

                                    response.setModified(modified);
                                    response.setAdded(added);
                                    response.setRemoved(removed);

                                    populateModifiedEntities(response);

                                    // conflicts changes
                                    response.setConflicting(status.getConflicting());
                                    response.setIsClean(status.isClean());

                                    // remote status changes
                                    BranchTrackingStatus trackingStatus =
                                            BranchTrackingStatus.of(git.getRepository(), branchName);
                                    if (trackingStatus != null) {
                                        response.setAheadCount(trackingStatus.getAheadCount());
                                        response.setBehindCount(trackingStatus.getBehindCount());
                                        response.setRemoteBranch(trackingStatus.getRemoteTrackingBranch());
                                    } else {
                                        log.debug(
                                                "Remote tracking details not present for branch: {}, repo: {}",
                                                branchName,
                                                repoPath);
                                        response.setAheadCount(0);
                                        response.setBehindCount(0);
                                        response.setRemoteBranch("untracked");
                                    }

                                    // Remove modified changes from current branch so that checkout to other branches
                                    // will be possible
                                    if (!status.isClean()) {
                                        return resetToLastCommit(git).map(ref -> {
                                            processStopwatch.stopAndLogTimeInMillis();
                                            return response;
                                        });
                                    }
                                    processStopwatch.stopAndLogTimeInMillis();
                                    return Mono.just(response);
                                })
                                .timeout(Duration.ofMillis(Constraint.TIMEOUT_MILLIS))
                                .flatMap(response -> response)
                                .name(GitSpan.FS_STATUS)
                                .tap(Micrometer.observation(observationRegistry)),
                        Git::close)
                .subscribeOn(scheduler);
    }

    protected void populateModifiedEntities(GitStatusDTO response) {
        populatePageChanges(response);
        populateQueryChanges(response);
        populateJsObjectChanges(response);
        populateDatasourceChanges(response);
        populateJsLibsChanges(response);
        legacyPopulateJsLibMigrationMessage(response);
    }

    protected boolean isAModifiedPage(String x) {
        return x.startsWith(GitDirectories.PAGE_DIRECTORY)
                && !x.contains(GitDirectories.ACTION_DIRECTORY)
                && !x.contains(GitDirectories.ACTION_COLLECTION_DIRECTORY);
    }

    protected void populatePageChanges(GitStatusDTO response) {

        Predicate<String> isPageAddedOrRemoved = x -> {
            if (isAModifiedPage(x)) {
                String[] pageNameArray = x.split(CommonConstants.DELIMITER_PATH);
                String folderName = pageNameArray[1];
                String fileName =
                        pageNameArray[2].replace(CommonConstants.JSON_EXTENSION, CommonConstants.EMPTY_STRING);
                return folderName.equals(fileName);
            }
            return false;
        };

        Function<String, String> getName = x -> x.split(CommonConstants.DELIMITER_PATH)[1];

        Set<String> pagesAdded = response.getAdded().stream()
                .filter(isPageAddedOrRemoved)
                .map(getName)
                .collect(Collectors.toSet());
        Set<String> pagesRemoved = response.getRemoved().stream()
                .filter(isPageAddedOrRemoved)
                .map(getName)
                .collect(Collectors.toSet());
        Set<String> pagesModified = Stream.concat(
                        response.getModified().stream(),
                        Stream.concat(response.getAdded().stream(), response.getRemoved().stream()))
                .filter(this::isAModifiedPage)
                .map(getName)
                .filter(x -> !pagesAdded.contains(x))
                .filter(x -> !pagesRemoved.contains(x))
                .collect(Collectors.toSet());

        response.setPagesModified(pagesModified);
        response.setPagesAdded(pagesAdded);
        response.setPagesRemoved(pagesRemoved);
        response.setModifiedPages(pagesModified.size() + pagesAdded.size() + pagesRemoved.size());
    }

    protected void populateQueryChanges(GitStatusDTO response) {
        Predicate<String> condition = x -> {
            if (x.contains(GitDirectories.ACTION_DIRECTORY + CommonConstants.DELIMITER_PATH)) {
                String queryName = x.split(CommonConstants.DELIMITER_PATH)[3];
                return !queryName.contains(CommonConstants.DELIMITER_HYPHEN);
            }
            return false;
        };

        Function<String, String> getName = x -> {
            String pageName = x.split(CommonConstants.DELIMITER_PATH)[1];
            String queryName = x.split(CommonConstants.DELIMITER_PATH)[3];
            return pageName + CommonConstants.DELIMITER_PATH + queryName;
        };

        Set<String> queriesModified =
                response.getModified().stream().filter(condition).map(getName).collect(Collectors.toSet());
        Set<String> queriesAdded =
                response.getAdded().stream().filter(condition).map(getName).collect(Collectors.toSet());
        Set<String> queriesRemoved =
                response.getRemoved().stream().filter(condition).map(getName).collect(Collectors.toSet());

        response.setQueriesModified(queriesModified);
        response.setQueriesAdded(queriesAdded);
        response.setQueriesRemoved(queriesRemoved);
        response.setModifiedQueries(queriesModified.size() + queriesAdded.size() + queriesRemoved.size());
    }

    protected void populateJsObjectChanges(GitStatusDTO response) {
        Predicate<String> condition =
                x -> x.contains(GitDirectories.ACTION_COLLECTION_DIRECTORY + CommonConstants.DELIMITER_PATH)
                        && !x.contains(CommonConstants.METADATA + CommonConstants.JSON_EXTENSION);

        Function<String, String> getName = x -> {
            String pageName = x.split(CommonConstants.DELIMITER_PATH)[1];
            String jsObjectName = x.substring(
                    x.lastIndexOf(CommonConstants.DELIMITER_PATH) + 1, x.lastIndexOf(CommonConstants.DELIMITER_POINT));
            return pageName + CommonConstants.DELIMITER_PATH + jsObjectName;
        };

        Set<String> jsObjectsModified =
                response.getModified().stream().filter(condition).map(getName).collect(Collectors.toSet());
        Set<String> jsObjectsAdded =
                response.getAdded().stream().filter(condition).map(getName).collect(Collectors.toSet());
        Set<String> jsObjectsRemoved =
                response.getRemoved().stream().filter(condition).map(getName).collect(Collectors.toSet());

        response.setJsObjectsModified(jsObjectsModified);
        response.setJsObjectsAdded(jsObjectsAdded);
        response.setJsObjectsRemoved(jsObjectsRemoved);
        response.setModifiedJSObjects(jsObjectsModified.size() + jsObjectsAdded.size() + jsObjectsRemoved.size());
    }

    protected void populateDatasourceChanges(GitStatusDTO response) {
        Predicate<String> condition =
                x -> x.contains(GitDirectories.DATASOURCE_DIRECTORY + CommonConstants.DELIMITER_PATH);

        Function<String, String> getName = x -> x.substring(
                x.lastIndexOf(CommonConstants.DELIMITER_PATH) + 1, x.lastIndexOf(CommonConstants.DELIMITER_POINT));

        Set<String> datasourcesModified =
                response.getModified().stream().filter(condition).map(getName).collect(Collectors.toSet());
        Set<String> datasourcesAdded =
                response.getAdded().stream().filter(condition).map(getName).collect(Collectors.toSet());
        Set<String> datasourcesRemoved =
                response.getRemoved().stream().filter(condition).map(getName).collect(Collectors.toSet());

        response.setDatasourcesModified(datasourcesModified);
        response.setDatasourcesAdded(datasourcesAdded);
        response.setDatasourcesRemoved(datasourcesRemoved);
        response.setModifiedDatasources(
                datasourcesModified.size() + datasourcesAdded.size() + datasourcesRemoved.size());
    }

    protected void populateJsLibsChanges(GitStatusDTO response) {
        Predicate<String> condition = x -> x.contains(GitDirectories.JS_LIB_DIRECTORY + CommonConstants.DELIMITER_PATH);

        Function<String, String> getName = x -> {
            String filename = x.split(CommonConstants.DELIMITER_PATH)[1];
            return filename.substring(0, filename.lastIndexOf(CommonConstants.SEPARATOR_UNDERSCORE));
        };
        Set<String> jsLibsModified =
                response.getModified().stream().filter(condition).map(getName).collect(Collectors.toSet());
        Set<String> jsLibsAdded =
                response.getAdded().stream().filter(condition).map(getName).collect(Collectors.toSet());
        Set<String> jsLibsRemoved =
                response.getRemoved().stream().filter(condition).map(getName).collect(Collectors.toSet());

        response.setJsLibsModified(jsLibsModified);
        response.setJsLibsAdded(jsLibsAdded);
        response.setJsLibsRemoved(jsLibsRemoved);
        response.setModifiedJSLibs(jsLibsModified.size() + jsLibsAdded.size() + jsLibsRemoved.size());
    }

    protected void legacyPopulateJsLibMigrationMessage(GitStatusDTO response) {
        /*
           LEGACY: Remove this code in future when all the older format js libs are migrated to new format

           As this updated filename has color, it means this is the older format js
           lib file that we're going to rename with the format without colon.
           Hence, we need to show a message to user saying this might be a system level change.
        */
        Predicate<String> condition = x ->
                x.contains(GitDirectories.JS_LIB_DIRECTORY + CommonConstants.DELIMITER_PATH) && x.contains("js.json");

        Boolean isModified = response.getModified().stream().anyMatch(condition);
        Boolean isAdded = response.getAdded().stream().anyMatch(condition);
        Boolean isRemoved = response.getAdded().stream().anyMatch(condition);

        if (isModified || isAdded || isRemoved) {
            response.setMigrationMessage(FILE_MIGRATION_MESSAGE);
        }
    }

    private String getPageName(String path) {
        String[] pathArray = path.split(CommonConstants.DELIMITER_PATH);
        return pathArray[1];
    }

    @Override
    public Mono<String> mergeBranch(Path repoSuffix, String sourceBranch, String destinationBranch) {
        return Mono.using(
                        () -> Git.open(createRepoPath(repoSuffix).toFile()),
                        git -> Mono.fromCallable(() -> {
                                    Stopwatch processStopwatch = StopwatchHelpers.startStopwatch(
                                            repoSuffix, AnalyticsEvents.GIT_MERGE.getEventName());
                                    log.debug(Thread.currentThread().getName() + ": Merge branch  " + sourceBranch
                                            + " on " + destinationBranch);
                                    try {
                                        // checkout the branch on which the merge command is run
                                        git.checkout()
                                                .setName(destinationBranch)
                                                .setCreateBranch(false)
                                                .call();

                                        MergeResult mergeResult = git.merge()
                                                .include(git.getRepository().findRef(sourceBranch))
                                                .setStrategy(MergeStrategy.RECURSIVE)
                                                .call();
                                        processStopwatch.stopAndLogTimeInMillis();
                                        return mergeResult.getMergeStatus().name();
                                    } catch (GitAPIException e) {
                                        // On merge conflicts abort the merge => git merge --abort
                                        git.getRepository().writeMergeCommitMsg(null);
                                        git.getRepository().writeMergeHeads(null);
                                        processStopwatch.stopAndLogTimeInMillis();
                                        throw new Exception(e);
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
                                .timeout(Duration.ofMillis(Constraint.TIMEOUT_MILLIS))
                                .name(GitSpan.FS_MERGE)
                                .tap(Micrometer.observation(observationRegistry)),
                        Git::close)
                .subscribeOn(scheduler);
    }

    @Override
    public Mono<String> fetchRemote(
            Path repoSuffix,
            String publicKey,
            String privateKey,
            boolean isRepoPath,
            String branchName,
            boolean isFetchAll) {
        Stopwatch processStopwatch =
                StopwatchHelpers.startStopwatch(repoSuffix, AnalyticsEvents.GIT_FETCH.getEventName());
        Path repoPath = TRUE.equals(isRepoPath) ? repoSuffix : createRepoPath(repoSuffix);
        return Mono.using(
                        () -> Git.open(repoPath.toFile()),
                        git -> Mono.fromCallable(() -> {
                                    TransportConfigCallback config =
                                            new SshTransportConfigCallback(privateKey, publicKey);
                                    String fetchMessages;
                                    if (TRUE.equals(isFetchAll)) {
                                        fetchMessages = git.fetch()
                                                .setRemoveDeletedRefs(true)
                                                .setTransportConfigCallback(config)
                                                .call()
                                                .getMessages();
                                    } else {
                                        RefSpec ref = new RefSpec(
                                                "refs/heads/" + branchName + ":refs/remotes/origin/" + branchName);
                                        fetchMessages = git.fetch()
                                                .setRefSpecs(ref)
                                                .setRemoveDeletedRefs(true)
                                                .setTransportConfigCallback(config)
                                                .call()
                                                .getMessages();
                                    }
                                    processStopwatch.stopAndLogTimeInMillis();
                                    return fetchMessages;
                                })
                                .onErrorResume(error -> {
                                    log.error(error.getMessage());
                                    return Mono.error(error);
                                })
                                .timeout(Duration.ofMillis(Constraint.TIMEOUT_MILLIS))
                                .name(GitSpan.FS_FETCH_REMOTE)
                                .tap(Micrometer.observation(observationRegistry)),
                        Git::close)
                .subscribeOn(scheduler);
    }

    @Override
    public Mono<String> fetchRemote(
            Path repoSuffix, String publicKey, String privateKey, boolean isRepoPath, String... branchNames) {
        Stopwatch processStopwatch =
                StopwatchHelpers.startStopwatch(repoSuffix, AnalyticsEvents.GIT_FETCH.getEventName());
        Path repoPath = TRUE.equals(isRepoPath) ? repoSuffix : createRepoPath(repoSuffix);
        return Mono.using(
                        () -> Git.open(repoPath.toFile()),
                        git -> Mono.fromCallable(() -> {
                                    TransportConfigCallback config =
                                            new SshTransportConfigCallback(privateKey, publicKey);
                                    String fetchMessages;

                                    List<RefSpec> refSpecs = new ArrayList<>();
                                    for (String branchName : branchNames) {
                                        RefSpec ref = new RefSpec(
                                                "refs/heads/" + branchName + ":refs/remotes/origin/" + branchName);
                                        refSpecs.add(ref);
                                    }

                                    fetchMessages = git.fetch()
                                            .setRefSpecs(refSpecs.toArray(new RefSpec[0]))
                                            .setRemoveDeletedRefs(true)
                                            .setTransportConfigCallback(config)
                                            .call()
                                            .getMessages();

                                    processStopwatch.stopAndLogTimeInMillis();
                                    return fetchMessages;
                                })
                                .onErrorResume(error -> {
                                    log.error(error.getMessage());
                                    return Mono.error(error);
                                })
                                .timeout(Duration.ofMillis(Constraint.TIMEOUT_MILLIS))
                                .name(GitSpan.FS_FETCH_REMOTE)
                                .tap(Micrometer.observation(observationRegistry)),
                        Git::close)
                .subscribeOn(scheduler);
    }

    @Override
    public Mono<MergeStatusDTO> isMergeBranch(Path repoSuffix, String sourceBranch, String destinationBranch) {
        Stopwatch processStopwatch =
                StopwatchHelpers.startStopwatch(repoSuffix, AnalyticsEvents.GIT_MERGE_CHECK.getEventName());
        return Mono.using(
                        () -> Git.open(createRepoPath(repoSuffix).toFile()),
                        git -> Mono.fromCallable(() -> {
                                    log.debug(
                                            Thread.currentThread().getName()
                                                    + ": Check mergeability for repo {} with src: {}, dest: {}",
                                            repoSuffix,
                                            sourceBranch,
                                            destinationBranch);

                                    // checkout the branch on which the merge command is run
                                    try {
                                        git.checkout()
                                                .setName(destinationBranch)
                                                .setCreateBranch(false)
                                                .call();
                                    } catch (GitAPIException e) {
                                        if (e instanceof CheckoutConflictException) {
                                            MergeStatusDTO mergeStatus = new MergeStatusDTO();
                                            mergeStatus.setMergeAble(false);
                                            mergeStatus.setConflictingFiles(
                                                    ((CheckoutConflictException) e).getConflictingPaths());
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
                                    if (mergeResult.getMergeStatus().isSuccessful()) {
                                        mergeStatus.setMergeAble(true);
                                        mergeStatus.setMessage(SUCCESS_MERGE_STATUS);
                                    } else {
                                        // If there aer conflicts add the conflicting file names to the response
                                        // structure
                                        mergeStatus.setMergeAble(false);
                                        List<String> mergeConflictFiles = new ArrayList<>(
                                                mergeResult.getConflicts().keySet());
                                        mergeStatus.setConflictingFiles(mergeConflictFiles);
                                        StringBuilder errorMessage = new StringBuilder();
                                        if (mergeResult.getMergeStatus().equals(MergeResult.MergeStatus.CONFLICTING)) {
                                            errorMessage.append("Conflicts");
                                        } else {
                                            errorMessage.append(
                                                    mergeResult.getMergeStatus().toString());
                                        }
                                        errorMessage
                                                .append(" while merging branch: ")
                                                .append(destinationBranch)
                                                .append(" <= ")
                                                .append(sourceBranch);
                                        mergeStatus.setMessage(errorMessage.toString());
                                        mergeStatus.setReferenceDoc(
                                                ErrorReferenceDocUrl.GIT_MERGE_CONFLICT.getDocUrl());
                                    }
                                    mergeStatus.setStatus(
                                            mergeResult.getMergeStatus().name());
                                    return mergeStatus;
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
                                .timeout(Duration.ofMillis(Constraint.TIMEOUT_MILLIS)),
                        Git::close)
                .subscribeOn(scheduler);
    }

    public Mono<String> checkoutRemoteBranch(Path repoSuffix, String branchName) {
        // We can safely assume that repo has been already initialised either in commit or clone flow and can directly
        // open the repo
        return Mono.using(
                        () -> Git.open(createRepoPath(repoSuffix).toFile()),
                        git -> Mono.fromCallable(() -> {
                                    log.debug(Thread.currentThread().getName() + ": Checking out remote branch origin/"
                                            + branchName + " for the repo " + repoSuffix);
                                    // open the repo
                                    Path baseRepoPath = createRepoPath(repoSuffix);
                                    // Create and checkout to new branch
                                    git.checkout()
                                            .setCreateBranch(TRUE)
                                            .setName(branchName)
                                            .setUpstreamMode(CreateBranchCommand.SetupUpstreamMode.TRACK)
                                            .setStartPoint("origin/" + branchName)
                                            .call();

                                    StoredConfig config = git.getRepository().getConfig();
                                    config.setString("branch", branchName, "remote", "origin");
                                    config.setString("branch", branchName, "merge", "refs/heads/" + branchName);
                                    config.save();
                                    return git.getRepository().getBranch();
                                })
                                .timeout(Duration.ofMillis(Constraint.TIMEOUT_MILLIS))
                                .tag(CHECKOUT_REMOTE, TRUE.toString())
                                .name(GitSpan.FS_CHECKOUT_BRANCH)
                                .tap(Micrometer.observation(observationRegistry)),
                        Git::close)
                .subscribeOn(scheduler);
    }

    @Override
    public Mono<Boolean> testConnection(String publicKey, String privateKey, String remoteUrl) {
        return Mono.fromCallable(() -> {
                    TransportConfigCallback transportConfigCallback =
                            new SshTransportConfigCallback(privateKey, publicKey);
                    Git.lsRemoteRepository()
                            .setTransportConfigCallback(transportConfigCallback)
                            .setRemote(remoteUrl)
                            .setHeads(true)
                            .setTags(true)
                            .call();
                    return true;
                })
                .timeout(Duration.ofMillis(Constraint.TIMEOUT_MILLIS))
                .subscribeOn(scheduler);
    }

    private Mono<Ref> resetToLastCommit(Git git) {
        Stopwatch processStopwatch = StopwatchHelpers.startStopwatch(
                git.getRepository().getDirectory().toPath().getParent(), AnalyticsEvents.GIT_RESET.getEventName());
        return Mono.fromCallable(() -> {
                    // Remove tracked files
                    Ref ref = git.reset().setMode(ResetCommand.ResetType.HARD).call();
                    // Remove untracked files
                    git.clean().setForce(true).setCleanDirectories(true).call();
                    processStopwatch.stopAndLogTimeInMillis();
                    return ref;
                })
                .timeout(Duration.ofMillis(Constraint.TIMEOUT_MILLIS))
                .tag(HARD_RESET, Boolean.FALSE.toString())
                .name(GitSpan.FS_RESET)
                .tap(Micrometer.observation(observationRegistry))
                .subscribeOn(scheduler);
    }

    public Mono<Boolean> resetToLastCommit(Path repoSuffix, String branchName) throws GitAPIException, IOException {
        return Mono.using(
                () -> Git.open(createRepoPath(repoSuffix).toFile()),
                git -> this.resetToLastCommit(git)
                        .flatMap(ref -> checkoutToBranch(repoSuffix, branchName))
                        .flatMap(checkedOut -> resetToLastCommit(git).thenReturn(true)),
                Git::close);
    }

    public Mono<Boolean> resetHard(Path repoSuffix, String branchName) {
        return this.checkoutToBranch(repoSuffix, branchName)
                .flatMap(aBoolean -> Mono.using(
                        () -> Git.open(createRepoPath(repoSuffix).toFile()),
                        git -> Mono.fromCallable(() -> {
                                    git.reset()
                                            .setMode(ResetCommand.ResetType.HARD)
                                            .setRef("HEAD~1")
                                            .call();
                                    return true;
                                })
                                .onErrorResume(e -> {
                                    log.error("Error while resetting the commit, {}", e.getMessage());
                                    return Mono.just(false);
                                })
                                .timeout(Duration.ofMillis(Constraint.TIMEOUT_MILLIS))
                                .tag(HARD_RESET, TRUE.toString())
                                .name(GitSpan.FS_RESET)
                                .tap(Micrometer.observation(observationRegistry)),
                        Git::close))
                .subscribeOn(scheduler);
    }

    public Mono<Boolean> rebaseBranch(Path repoSuffix, String branchName) {
        return this.checkoutToBranch(repoSuffix, branchName).flatMap(isCheckedOut -> Mono.using(
                        () -> Git.open(createRepoPath(repoSuffix).toFile()),
                        git -> Mono.fromCallable(() -> {
                                    RebaseResult result = git.rebase()
                                            .setUpstream("origin/" + branchName)
                                            .call();
                                    if (result.getStatus().isSuccessful()) {
                                        return true;
                                    } else {
                                        log.error(
                                                "Error while rebasing the branch, {}, {}",
                                                result.getStatus().name(),
                                                result.getConflicts());
                                        git.rebase()
                                                .setUpstream("origin/" + branchName)
                                                .setOperation(RebaseCommand.Operation.ABORT)
                                                .call();
                                        throw new Exception("Error while rebasing the branch, "
                                                + result.getStatus().name());
                                    }
                                })
                                .onErrorMap(e -> {
                                    log.error("Error while rebasing the branch, {}", e.getMessage());
                                    return e;
                                })
                                .timeout(Duration.ofMillis(Constraint.TIMEOUT_MILLIS))
                                .name(GitSpan.FS_REBASE)
                                .tap(Micrometer.observation(observationRegistry)),
                        Git::close)
                .subscribeOn(scheduler));
    }

    @Override
    public Mono<BranchTrackingStatus> getBranchTrackingStatus(Path repoPath, String branchName) {
        return Mono.using(
                        () -> Git.open(repoPath.toFile()),
                        git -> Mono.fromCallable(() -> BranchTrackingStatus.of(git.getRepository(), branchName))
                                .timeout(Duration.ofMillis(Constraint.TIMEOUT_MILLIS))
                                .name(GitSpan.FS_BRANCH_TRACK)
                                .tap(Micrometer.observation(observationRegistry)),
                        Git::close)
                .subscribeOn(scheduler);
    }
}
