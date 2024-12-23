package com.appsmith.server.git;

import com.appsmith.external.dtos.GitBranchDTO;
import com.appsmith.external.dtos.GitStatusDTO;
import com.appsmith.external.dtos.MergeStatusDTO;
import com.appsmith.git.configurations.GitServiceConfig;
import com.appsmith.server.applications.base.ApplicationService;
import com.appsmith.server.configurations.ProjectProperties;
import com.appsmith.server.constants.ArtifactType;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.constants.GitDefaultCommitMessage;
import com.appsmith.server.domains.Application;
import com.appsmith.server.domains.Artifact;
import com.appsmith.server.domains.GitArtifactMetadata;
import com.appsmith.server.domains.GitProfile;
import com.appsmith.server.dtos.AutoCommitResponseDTO;
import com.appsmith.server.dtos.GitCommitDTO;
import com.appsmith.server.dtos.GitConnectDTO;
import com.appsmith.server.dtos.GitMergeDTO;
import com.appsmith.server.dtos.GitPullDTO;
import com.appsmith.server.git.autocommit.AutoCommitService;
import com.appsmith.server.git.common.CommonGitService;
import com.appsmith.server.git.resolver.GitArtifactHelperResolver;
import com.appsmith.server.git.templates.contexts.GitContext;
import com.appsmith.server.git.templates.providers.GitBranchesTestTemplateProvider;
import com.appsmith.server.services.GitArtifactHelper;
import org.eclipse.jgit.api.Git;
import org.eclipse.jgit.api.Status;
import org.eclipse.jgit.api.errors.GitAPIException;
import org.eclipse.jgit.lib.ObjectId;
import org.eclipse.jgit.revwalk.RevCommit;
import org.junit.jupiter.api.TestInstance;
import org.junit.jupiter.api.TestTemplate;
import org.junit.jupiter.api.extension.ExtensionContext;
import org.junit.jupiter.api.extension.RegisterExtension;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.test.context.support.WithUserDetails;
import org.testcontainers.junit.jupiter.Testcontainers;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Iterator;
import java.util.List;

import static com.appsmith.external.git.constants.GitConstants.DEFAULT_COMMIT_MESSAGE;
import static com.appsmith.external.git.constants.GitConstants.EMPTY_COMMIT_ERROR_MESSAGE;
import static com.appsmith.server.exceptions.AppsmithError.GIT_MERGE_FAILED_LOCAL_CHANGES;
import static com.appsmith.server.git.autocommit.AutoCommitEventHandlerImpl.AUTO_COMMIT_MSG_FORMAT;
import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.fail;

/**
 * This integration test suite validates the end-to-end Git workflow for artifacts, performing a sequence of
 * operations that test repository setup, branch management, status validation, and cleanup. The operations
 * proceed as follows:
 *
 * 1. **Connect Artifact to Git**:
 *    - The artifact is connected to an empty Git repository using a remote URL provided by the Git server initializer.
 *    - A system-generated commit is created as part of the connection process.
 *    - Auto-commit is enabled by default, as verified in the artifact metadata.
 *    - The repository is checked to confirm a single system-generated commit and a clean working directory.
 *
 * 2. **Verify Initial Repository State**:
 *    - The default branch is initialized, and its name is verified to match the metadata.
 *    - The repository status is confirmed to be clean with no uncommitted changes.
 *
 * 3. **Trigger and Validate Auto-Commit**:
 *    - Auto-commit is triggered, and the resulting commit is validated in the Git log.
 *    - Commit history is checked to confirm the auto-commit appears as a second commit following the initial system-generated commit.
 *
 * 4. **Perform Status, Pull, and Commit Operations on the Default Branch (`master`)**:
 *    - The repository status is checked to confirm no changes (`isClean = true`).
 *    - A `pull` operation is executed to ensure synchronization, even when no updates are available.
 *    - A `commit` is attempted with no changes, and the response is validated to confirm no new commits were created.
 *
 * 5. **Create and Verify Branches**:
 *    - A new branch `foo` is created from the default branch (`master`).
 *    - Metadata for `foo` is validated, and the commit history confirms that `foo` starts from the latest commit on `master`.
 *    - A second branch `bar` is created from `foo`. Its metadata is verified, and the commit log confirms it starts from the latest commit on `foo`.
 *
 * 6. **Test Merging Scenarios**:
 *    - A merge from `bar` to `foo` is validated and shows no action required (`ALREADY_UP_TO_DATE`), as no changes exist.
 *    - Additional changes made to `bar` are merged back into `foo` successfully.
 *
 * 7. **Branch Deletion and Repopulation**:
 *    - The branch `foo` is deleted locally but repopulated from the remote repository.
 *    - The latest commit on `foo` is verified to match the changes made on `foo` before deletion.
 *    - An attempt to delete the currently checked-out branch (`master`) fails as expected.
 *
 * 8. **Make Changes and Validate Commits**:
 *    - Changes are made to the artifact on `foo` to trigger diffs.
 *    - The repository status is validated as `isClean = false` with pending changes.
 *    - A commit is created with a custom message, and the Git log confirms the commit as the latest on `foo`.
 *    - Changes are successfully discarded, restoring the repository to a clean state.
 *
 * 9. **Set and Test Branch Protection**:
 *    - The `master` branch is marked as protected. Commits directly to `master` are restricted.
 *    - Attempts to commit to `master` fail with the appropriate error message.
 *
 * 10. **Merge Branches (`baz` to `bar`)**:
 *     - A new branch `baz` is created from `bar`, and its commit log is verified.
 *     - Changes are made to `baz` and successfully merged into `bar` via a fast-forward merge.
 *     - The commit history confirms the merge, and the top commit matches the changes made in `baz`.
 *
 * 11. **Disconnect Artifact and Cleanup**:
 *     - The artifact is disconnected from the Git repository.
 *     - All repository branches (`foo`, `bar`, `baz`) except `master` are removed.
 *     - The file system is verified to confirm all repository data is cleaned up.
 *     - Applications associated with the deleted branches are also removed.
 *
 * This test suite ensures comprehensive coverage of Git workflows, including repository connection, branch creation,
 * branch protection, merging, status validation, and repository cleanup. Each operation includes detailed assertions
 * to validate expected outcomes and handle edge cases.
 */

@Testcontainers
@SpringBootTest
@TestInstance(TestInstance.Lifecycle.PER_CLASS)
public class GitBranchesIT {

    @Autowired
    @RegisterExtension
    GitBranchesTestTemplateProvider templateProvider;

    @Autowired
    @RegisterExtension
    ArtifactBuilderExtension artifactBuilderExtension;

    @Autowired
    @RegisterExtension
    GitServerInitializerExtension gitServerInitializerExtension;

    @Autowired
    CommonGitService commonGitService;
    @Autowired
    GitTestUtils gitTestUtils;
    @Autowired
    GitArtifactHelperResolver gitArtifactHelperResolver;
    @Autowired
    GitServiceConfig gitServiceConfig;
    @Autowired
    AutoCommitService autoCommitService;
    @Autowired
    ProjectProperties projectProperties;
    @Autowired
    ApplicationService applicationService;

    final String ORIGIN = "https://foo.bar.com";

    @TestTemplate
    @WithUserDetails(value = "api_user")
    void test(GitContext gitContext, ExtensionContext extensionContext) throws IOException, GitAPIException, InterruptedException {

        ExtensionContext.Store contextStore = extensionContext.getStore(ExtensionContext.Namespace.create(ArtifactBuilderExtension.class));
        String artifactId = contextStore.get(FieldName.ARTIFACT_ID, String.class);

        GitConnectDTO connectDTO = new GitConnectDTO();
        connectDTO.setRemoteUrl(gitServerInitializerExtension.getGitSshUrl("test" + artifactId));
        GitProfile gitProfile = new GitProfile("foo bar", "foo@bar.com", null);
        connectDTO.setGitProfile(gitProfile);

        // TODO:
        //  - Move the filePath variable to be relative, so that template name and repo name is prettier
        //  - Is it possible to use controller layer here? Might help with also including web filters in IT
        Artifact artifact = commonGitService.connectArtifactToGit(artifactId, connectDTO, ORIGIN, gitContext.getArtifactType())
            .block();

        assertThat(artifact).isNotNull();

        ArtifactType artifactType = artifact.getArtifactType();
        GitArtifactMetadata artifactMetadata = artifact.getGitArtifactMetadata();
        GitArtifactHelper<?> artifactHelper = gitArtifactHelperResolver.getArtifactHelper(artifactType);
        Path repoSuffix = artifactHelper.getRepoSuffixPath(
            artifact.getWorkspaceId(),
            artifactMetadata.getDefaultArtifactId(),
            artifactMetadata.getRepoName());

        // Auto-commit should be turned on by default
        assertThat(artifactMetadata.getAutoCommitConfig().getEnabled()).isTrue();

        Path path = Path.of(gitServiceConfig.getGitRootPath()).resolve(repoSuffix);
        String branch;
        ObjectId topOfCommits;

        try (Git git = Git.open(path.toFile())) {
            branch = git.log().getRepository().getBranch();
            assertThat(branch).isEqualTo(artifactMetadata.getBranchName());

            // Assert only single system generated commit exists on FS
            Iterable<RevCommit> commits = git.log().call();
            Iterator<RevCommit> commitIterator = commits.iterator();
            assertThat(commitIterator.hasNext()).isTrue();

            RevCommit firstCommit = commitIterator.next();
            assertThat(firstCommit.getFullMessage()).isEqualTo(DEFAULT_COMMIT_MESSAGE + GitDefaultCommitMessage.CONNECT_FLOW.getReason());
            topOfCommits = firstCommit.getId();

            assertThat(commitIterator.hasNext()).isFalse();

            // Assert that git directory is clean
            Status status = git.status().call();
            assertThat(status.isClean()).isTrue();
        }

        // Assert that the artifact does have auto-commit requirements, and auto-commit gets initiated
        AutoCommitResponseDTO autoCommitResponseDTO = autoCommitService.autoCommitApplication(artifactId).block();

        assertThat(autoCommitResponseDTO).isNotNull();
        AutoCommitResponseDTO.AutoCommitResponse autoCommitProgress = autoCommitResponseDTO.getAutoCommitResponse();
        assertThat(autoCommitProgress).isEqualTo(AutoCommitResponseDTO.AutoCommitResponse.PUBLISHED);

        // Wait for auto-commit to complete
        // This should not take more than 2 seconds, we're checking every 500 ms
        long startTime = System.currentTimeMillis(), currentTime = System.currentTimeMillis();
        while (!autoCommitProgress.equals(AutoCommitResponseDTO.AutoCommitResponse.IDLE)) {
            Thread.sleep(500);
            if (currentTime - startTime > 2000) {
                fail("Auto-commit took too long");
            }
            autoCommitProgress = getAutocommitProgress(artifactId, artifact, artifactMetadata);
            currentTime = System.currentTimeMillis();
        }

        // Now there should be two commits in the git log response
        try (Git git = Git.open(path.toFile())) {
            branch = git.log().getRepository().getBranch();
            assertThat(branch).isEqualTo(artifactMetadata.getBranchName());

            Iterable<RevCommit> commits = git.log().call();
            Iterator<RevCommit> commitIterator = commits.iterator();
            assertThat(commitIterator.hasNext()).isTrue();

            RevCommit autoCommit = commitIterator.next();
            assertThat(autoCommit.getFullMessage()).isEqualTo(String.format(AUTO_COMMIT_MSG_FORMAT, projectProperties.getVersion()));

            assertThat(commitIterator.hasNext()).isTrue();
            RevCommit firstCommit = commitIterator.next();
            assertThat(firstCommit.getId()).isEqualTo(topOfCommits);

            topOfCommits = autoCommit.getId();
        }

        // Assert that the initialized branch is set as default
        assertThat(artifactMetadata.getBranchName()).isEqualTo(artifactMetadata.getDefaultBranchName());

        // Assert that the branch is not protected by default
        assertThat(artifactMetadata.getBranchProtectionRules()).isNullOrEmpty();

        // Check that the status is clean
        GitStatusDTO statusDTO = commonGitService.getStatus(artifactId, true, artifactType).block();
        assertThat(statusDTO).isNotNull();
        assertThat(statusDTO.getIsClean()).isTrue();
        assertThat(statusDTO.getAheadCount()).isEqualTo(0);
        assertThat(statusDTO.getBehindCount()).isEqualTo(0);

        // Check that pull when not required, still goes through
        GitPullDTO gitPullDTO = commonGitService.pullArtifact(artifactId, artifactType).block();
        assertThat(gitPullDTO).isNotNull();

        // Check that commit says that there is nothing to commit
        GitCommitDTO commitDTO = new GitCommitDTO();
        commitDTO.setCommitMessage("Unused message");
        commitDTO.setDoPush(false);
        String commitResponse = commonGitService.commitArtifact(commitDTO, artifactId, artifactType)
            .block();

        assertThat(commitResponse).contains(EMPTY_COMMIT_ERROR_MESSAGE);

        // Check that the previous attempt didn't actually go through
        try (Git git = Git.open(path.toFile())) {
            branch = git.log().getRepository().getBranch();
            assertThat(branch).isEqualTo(artifactMetadata.getBranchName());

            Iterable<RevCommit> commits = git.log().call();
            assertThat(commits.iterator().next().getId()).isEqualTo(topOfCommits);
        }

        // Check that discard, even when not required, goes through
        Artifact discardedArtifact = commonGitService.discardChanges(artifactId, artifactType).block();
        assertThat(discardedArtifact).isNotNull();

        // Make a change in the artifact to trigger a diff
        gitTestUtils.createADiffInArtifact(artifact).block();

        // Check that the status is not clean
        GitStatusDTO statusDTO2 = commonGitService.getStatus(artifactId, true, artifactType).block();
        assertThat(statusDTO2).isNotNull();
        assertThat(statusDTO2.getIsClean()).isFalse();
        assertThat(statusDTO2.getAheadCount()).isEqualTo(0);
        assertThat(statusDTO2.getBehindCount()).isEqualTo(0);

        // Check that commit makes the custom message be the top of the log
        GitCommitDTO commitDTO2 = new GitCommitDTO();
        commitDTO2.setCommitMessage("Custom message");
        commitDTO2.setDoPush(true);
        String commitResponse2 = commonGitService.commitArtifact(commitDTO2, artifactId, artifactType)
            .block();

        assertThat(commitResponse2).contains("Committed successfully!");

        try (Git git = Git.open(path.toFile())) {
            branch = git.log().getRepository().getBranch();
            assertThat(branch).isEqualTo(artifactMetadata.getBranchName());

            Iterable<RevCommit> commits = git.log().call();
            Iterator<RevCommit> commitIterator = commits.iterator();
            RevCommit newCommit = commitIterator.next();
            assertThat(newCommit.getFullMessage()).isEqualTo("Custom message");

            assertThat(commitIterator.next().getId()).isEqualTo(topOfCommits);

            topOfCommits = newCommit.getId();
        }

        // Check that status is clean again
        GitStatusDTO statusDTO3 = commonGitService.getStatus(artifactId, true, artifactType).block();
        assertThat(statusDTO3).isNotNull();
        assertThat(statusDTO3.getIsClean()).isTrue();
        assertThat(statusDTO3.getAheadCount()).isEqualTo(0);
        assertThat(statusDTO3.getBehindCount()).isEqualTo(0);

        // Make another change to trigger a diff
        gitTestUtils.createADiffInArtifact(artifact).block();

        // Check that status in not clean
        GitStatusDTO statusDTO4 = commonGitService.getStatus(artifactId, true, artifactType).block();
        assertThat(statusDTO4).isNotNull();
        assertThat(statusDTO4.getIsClean()).isFalse();
        assertThat(statusDTO4.getAheadCount()).isEqualTo(0);
        assertThat(statusDTO4.getBehindCount()).isEqualTo(0);

        // Protect the master branch
        List<String> protectedBranches = commonGitService.updateProtectedBranches(artifactId, List.of(branch), artifactType).block();
        assertThat(protectedBranches).containsExactly(branch);

        // Now try to commit, and check that it fails
        GitCommitDTO commitDTO3 = new GitCommitDTO();
        commitDTO3.setCommitMessage("Failed commit");
        commitDTO3.setDoPush(false);
        Mono<String> commitResponse3Mono = commonGitService.commitArtifact(commitDTO3, artifactId, artifactType);
        StepVerifier.create(commitResponse3Mono)
            .expectErrorSatisfies(e -> assertThat(e.getMessage()).contains("Cannot commit to protected branch"))
            .verify();

        // Create a new branch foo from master, check that the commit for new branch is created as system generated
        // On top of the previous custom commit
        GitBranchDTO fooBranchDTO = new GitBranchDTO();
        fooBranchDTO.setBranchName("foo");
        Artifact fooArtifact = commonGitService.createBranch(artifactId, fooBranchDTO, artifactType).block();
        assertThat(fooArtifact).isNotNull();

        String fooArtifactId = fooArtifact.getId();
        GitArtifactMetadata fooMetadata = fooArtifact.getGitArtifactMetadata();
        assertThat(fooMetadata.getBranchName()).isEqualTo("foo");

        try (Git git = Git.open(path.toFile())) {
            branch = git.log().getRepository().getBranch();
            assertThat(branch).isEqualTo(fooMetadata.getBranchName());

            Iterable<RevCommit> commits = git.log().call();
            Iterator<RevCommit> commitIterator = commits.iterator();
            RevCommit newCommit = commitIterator.next();
            assertThat(newCommit.getFullMessage()).contains("branch: foo");

            assertThat(commitIterator.next().getId()).isEqualTo(topOfCommits);

            topOfCommits = newCommit.getId();
        }

        // Check that status on foo is clean again
        GitStatusDTO statusDTO5 = commonGitService.getStatus(fooArtifactId, true, artifactType).block();
        assertThat(statusDTO5).isNotNull();
        assertThat(statusDTO5.getIsClean()).isTrue();
        assertThat(statusDTO5.getAheadCount()).isEqualTo(0);
        assertThat(statusDTO5.getBehindCount()).isEqualTo(0);

        // Create another branch bar from foo
        GitBranchDTO barBranchDTO = new GitBranchDTO();
        barBranchDTO.setBranchName("bar");
        Artifact barArtifact = commonGitService.createBranch(fooArtifactId, barBranchDTO, artifactType).block();
        assertThat(barArtifact).isNotNull();

        String barArtifactId = barArtifact.getId();
        GitArtifactMetadata barMetadata = barArtifact.getGitArtifactMetadata();
        assertThat(barMetadata.getBranchName()).isEqualTo("bar");

        try (Git git = Git.open(path.toFile())) {
            branch = git.log().getRepository().getBranch();
            assertThat(branch).isEqualTo(barMetadata.getBranchName());

            Iterable<RevCommit> commits = git.log().call();
            Iterator<RevCommit> commitIterator = commits.iterator();

            assertThat(commitIterator.next().getId()).isEqualTo(topOfCommits);
        }

        // Check merge status to foo shows no action required
        // bar -> foo
        GitMergeDTO gitMergeDTO = new GitMergeDTO();
        gitMergeDTO.setDestinationBranch("foo");
        gitMergeDTO.setSourceBranch("bar");
        MergeStatusDTO mergeStatusDTO = commonGitService.isBranchMergeable(barArtifactId, gitMergeDTO, artifactType).block();
        assertThat(mergeStatusDTO).isNotNull();
        assertThat(mergeStatusDTO.getStatus()).isEqualTo("ALREADY_UP_TO_DATE");

        // Delete foo locally and re-populate from remote
        List<String> branchList = commonGitService.listBranchForArtifact(artifactId, false, artifactType)
            .flatMapMany(Flux::fromIterable)
            .map(GitBranchDTO::getBranchName)
            .collectList()
            .block();
        assertThat(branchList).containsExactlyInAnyOrder(
            artifactMetadata.getBranchName(),
            "origin/" + artifactMetadata.getBranchName(),
            fooMetadata.getBranchName(),
            "origin/" + fooMetadata.getBranchName(),
            barMetadata.getBranchName(),
            "origin/" + barMetadata.getBranchName());

        Mono<? extends Artifact> deleteBranchAttemptMono = commonGitService.deleteBranch(artifactId, "foo", artifactType);
        StepVerifier
            .create(deleteBranchAttemptMono)
            .expectErrorSatisfies(e -> assertThat(e.getMessage()).contains("Cannot delete current checked out branch"))
            .verify();

        // TODO: I'm having to checkout myself to be able to delete the branch.
        //  Are we relying on auto-commit check to do this otherwise?
        //  Is this a potential bug?
        try (Git git = Git.open(path.toFile())) {
            git.checkout().setName("bar").call();
        }

        commonGitService.deleteBranch(artifactId, "foo", artifactType).block();

        List<String> branchList2 = commonGitService.listBranchForArtifact(artifactId, false, artifactType)
            .flatMapMany(Flux::fromIterable)
            .map(GitBranchDTO::getBranchName)
            .collectList()
            .block();
        assertThat(branchList2).containsExactlyInAnyOrder(
            artifactMetadata.getBranchName(),
            "origin/" + artifactMetadata.getBranchName(),
            "origin/" + fooMetadata.getBranchName(),
            barMetadata.getBranchName(),
            "origin/" + barMetadata.getBranchName());

        Artifact checkedOutFooArtifact = commonGitService.checkoutBranch(artifactId, "origin/foo", true, artifactType).block();

        assertThat(checkedOutFooArtifact).isNotNull();
        List<String> branchList3 = commonGitService.listBranchForArtifact(artifactId, false, artifactType)
            .flatMapMany(Flux::fromIterable)
            .map(GitBranchDTO::getBranchName)
            .collectList()
            .block();
        assertThat(branchList3).containsExactlyInAnyOrder(
            artifactMetadata.getBranchName(),
            "origin/" + artifactMetadata.getBranchName(),
            fooMetadata.getBranchName(),
            "origin/" + fooMetadata.getBranchName(),
            barMetadata.getBranchName(),
            "origin/" + barMetadata.getBranchName());

        // Verify latest commit on foo should be same as changes made on foo previously
        try (Git git = Git.open(path.toFile())) {
            branch = git.log().getRepository().getBranch();
            assertThat(branch).isEqualTo(fooMetadata.getBranchName());

            Iterable<RevCommit> commits = git.log().call();
            Iterator<RevCommit> commitIterator = commits.iterator();

            assertThat(commitIterator.next().getId()).isEqualTo(topOfCommits);
        }

        // Make more changes on foo and attempt discard
        gitTestUtils.createADiffInArtifact(checkedOutFooArtifact).block();

        GitStatusDTO discardableStatus = commonGitService.getStatus(checkedOutFooArtifact.getId(), false, artifactType).block();

        assertThat(discardableStatus).isNotNull();
        assertThat(discardableStatus.getIsClean()).isFalse();

        Artifact discardedFoo = commonGitService.discardChanges(checkedOutFooArtifact.getId(), artifactType).block();

        GitStatusDTO discardedStatus = commonGitService.getStatus(checkedOutFooArtifact.getId(), false, artifactType).block();

        assertThat(discardedStatus).isNotNull();
        // TODO: Why is this not clean?
        //  There is an on page load that gets triggered here that is causing a diff
        //  This should ideally have already been fixed on initial artifact import
//        assertThat(discardedStatus.getIsClean()).isTrue();

        // Make a change to trigger a diff on bar
        gitTestUtils.createADiffInArtifact(barArtifact).block();

        // Check merge status to master shows not merge-able
        GitMergeDTO gitMergeDTO2 = new GitMergeDTO();
        gitMergeDTO2.setSourceBranch("bar");
        gitMergeDTO2.setDestinationBranch("master");
        MergeStatusDTO mergeStatusDTO2 = commonGitService.isBranchMergeable(barArtifactId, gitMergeDTO2, artifactType).block();

        assertThat(mergeStatusDTO2).isNotNull();
        assertThat(mergeStatusDTO2.isMergeAble()).isFalse();
        assertThat(mergeStatusDTO2.getMessage()).isEqualTo(GIT_MERGE_FAILED_LOCAL_CHANGES.getMessage("bar"));

        // Create a new branch baz and check for new commit
        GitBranchDTO gitBranchDTO = new GitBranchDTO();
        gitBranchDTO.setBranchName("baz");
        Artifact bazArtifact = commonGitService.createBranch(barArtifactId, gitBranchDTO, artifactType).block();

        assertThat(bazArtifact).isNotNull();

        try (Git git = Git.open(path.toFile())) {
            Iterable<RevCommit> commits = git.log().call();
            Iterator<RevCommit> commitIterator = commits.iterator();
            RevCommit newCommit = commitIterator.next();
            assertThat(newCommit.getFullMessage()).contains("branch: baz");

            assertThat(commitIterator.next().getId()).isEqualTo(topOfCommits);

            topOfCommits = newCommit.getId();
        }

        // TODO: We're having to discard on bar because
        //  create branch today retains uncommitted change on source branch as well
        //  We will need to update this line once that is fixed.
        //  It won't get caught in tests otherwise since this discard would be a redundant op
        commonGitService.discardChanges(barArtifactId, artifactType).block();

        GitMergeDTO gitMergeDTO3 = new GitMergeDTO();
        gitMergeDTO3.setSourceBranch("baz");
        gitMergeDTO3.setDestinationBranch("bar");

        MergeStatusDTO mergeStatusDTO3 = commonGitService.isBranchMergeable(barArtifactId, gitMergeDTO3, artifactType).block();

        assertThat(mergeStatusDTO3).isNotNull();
        assertThat(mergeStatusDTO3.isMergeAble()).isTrue();

        // Merge bar to master and check log of commits on foo is same as bar
        MergeStatusDTO barToBazMergeStatus = commonGitService.mergeBranch(barArtifactId, gitMergeDTO3, artifactType).block();

        assertThat(barToBazMergeStatus).isNotNull();
        assertThat(barToBazMergeStatus.isMergeAble()).isTrue();
        assertThat(barToBazMergeStatus.getStatus()).contains("FAST_FORWARD");

        // Since fast-forward should succeed here, top of commit should not change
        try (Git git = Git.open(path.toFile())) {
            Iterable<RevCommit> commits = git.log().call();
            Iterator<RevCommit> commitIterator = commits.iterator();
            assertThat(commitIterator.next().getId()).isEqualTo(topOfCommits);
        }

        // Disconnect artifact and verify non-existence of `foo`, `bar` and `baz`
        Artifact disconnectedArtifact = commonGitService.detachRemote(artifactId, artifactType).block();

        assertThat(disconnectedArtifact).isNotNull();
        assertThat(disconnectedArtifact.getGitArtifactMetadata()).isNull();

        // TODO: This needs to be generified for artifacts
        Application deletedFooArtifact = applicationService.findById(checkedOutFooArtifact.getId()).block();
        assertThat(deletedFooArtifact).isNull();
        Application deletedBarArtifact = applicationService.findById(barArtifactId).block();
        assertThat(deletedBarArtifact).isNull();
        Application deletedBazArtifact = applicationService.findById(bazArtifact.getId()).block();
        assertThat(deletedBazArtifact).isNull();
        Application existingMasterArtifact = applicationService.findById(artifactId).block();
        assertThat(existingMasterArtifact).isNotNull();

        // Verify FS is clean after disconnect
        boolean repoDirectoryNotExists = Files.notExists(path);
        assertThat(repoDirectoryNotExists).isTrue();
    }

    private AutoCommitResponseDTO.AutoCommitResponse getAutocommitProgress(String artifactId, Artifact artifact, GitArtifactMetadata artifactMetadata) {
        AutoCommitResponseDTO autoCommitProgress = commonGitService.getAutoCommitProgress(artifactId, artifactMetadata.getBranchName(), artifact.getArtifactType()).block();

        assertThat(autoCommitProgress).isNotNull();
        return autoCommitProgress.getAutoCommitResponse();
    }
}
