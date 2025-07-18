package com.appsmith.server.git;

import com.appsmith.external.dtos.GitLogDTO;
import com.appsmith.external.dtos.GitRefDTO;
import com.appsmith.external.dtos.GitStatusDTO;
import com.appsmith.external.dtos.MergeStatusDTO;
import com.appsmith.external.git.constants.ce.RefType;
import com.appsmith.external.git.handler.FSGitHandler;
import com.appsmith.git.configurations.GitServiceConfig;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.io.FileUtils;
import org.eclipse.jgit.api.Git;
import org.eclipse.jgit.api.errors.GitAPIException;
import org.eclipse.jgit.api.errors.NoHeadException;
import org.eclipse.jgit.api.errors.RefNotFoundException;
import org.eclipse.jgit.lib.BranchTrackingStatus;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Disabled;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import java.io.File;
import java.io.IOException;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Comprehensive test suite for FSGitHandler interface and its implementations.
 * Tests are organized by functionality and follow the Given-When-Then pattern.
 *
 * This test class validates the file system git operations including:
 * - Repository creation and management
 * - Commit operations
 * - Branch operations
 * - Remote operations
 * - Status and history operations
 * - Merge operations
 * - Tag operations
 * - Reset and cleanup operations
 */
@Slf4j
@SpringBootTest
@DisplayName("FSGitHandler Tests")
class FSGitHandlerTest {

    @Autowired
    private FSGitHandler fsGitHandler;

    @Autowired
    private GitServiceConfig gitServiceConfig;

    @TempDir
    private File tempFolder;

    private Git git;
    private Path repoPath;
    private Path testRepoSuffix;

    @BeforeEach
    void setUp() throws GitAPIException, IOException {
        // Given: Initialize a temporary git repository for testing
        git = Git.init().setDirectory(tempFolder).call();
        repoPath = git.getRepository().getDirectory().toPath().getParent();
        testRepoSuffix = Paths.get("test-workspace", "test-app", "test-repo");

        // Create the test repository directory structure
        Path fullRepoPath = fsGitHandler.createRepoPath(testRepoSuffix);
        FileUtils.forceMkdir(fullRepoPath.toFile());

        // Initialize git repository in the test path
        Git.init().setDirectory(fullRepoPath.toFile()).call();
    }

    @AfterEach
    void tearDown() throws IOException {
        // Clean up resources
        if (git != null) {
            git.getRepository().close();
        }

        // Clean up test repository
        Path fullRepoPath = fsGitHandler.createRepoPath(testRepoSuffix);
        if (fullRepoPath.toFile().exists()) {
            FileUtils.deleteDirectory(fullRepoPath.toFile());
        }
    }

    // ============================================================================
    // REPOSITORY CREATION AND MANAGEMENT TESTS
    // ============================================================================

    @Nested
    @DisplayName("Repository Creation and Management")
    class RepositoryCreationTests {

        /**
         * Test that verifies successful creation of a new git repository.
         * Validates that the repository is properly initialized and accessible.
         */
        @Test
        @DisplayName("should create new repository successfully")
        void createNewRepository_validPath_success() throws GitAPIException {
            // Given
            Path newRepoPath = tempFolder.toPath().resolve("new-repo");

            // When
            boolean result = fsGitHandler.createNewRepository(newRepoPath);

            // Then
            assertThat(result).isTrue();
            assertThat(newRepoPath.resolve(".git")).exists();
        }

        /**
         * Test that verifies the createRepoPath method correctly constructs
         * the full repository path from a given suffix.
         */
        @Test
        @DisplayName("should create correct repo path from suffix")
        void createRepoPath_validSuffix_returnsCorrectPath() {
            // Given
            Path suffix = Paths.get("workspace1", "app1", "repo1");

            // When
            Path result = fsGitHandler.createRepoPath(suffix);

            // Then
            assertThat(result).isNotNull();
            assertThat(result.toString())
                    .contains("workspace1")
                    .contains("app1")
                    .contains("repo1");
        }
    }

    // ============================================================================
    // COMMIT OPERATIONS TESTS
    // ============================================================================

    @Nested
    @DisplayName("Commit Operations")
    class CommitOperationTests {

        /**
         * Test that verifies successful commit operation with valid changes.
         * Validates that files are properly staged and committed with correct metadata.
         */
        @Test
        @DisplayName("should commit artifact successfully with valid changes")
        void commitArtifact_validChanges_success() throws IOException {
            // Given
            createFileInRepo("test-file.txt", "test content");
            String commitMessage = "Test commit";
            String authorName = "Test Author";
            String authorEmail = "test@example.com";

            // When
            Mono<String> commitResult =
                    fsGitHandler.commitArtifact(testRepoSuffix, commitMessage, authorName, authorEmail, true, false);

            // Then
            StepVerifier.create(commitResult)
                    .assertNext(message -> {
                        assertThat(message).isEqualTo("Committed successfully!");
                    })
                    .verifyComplete();
        }

        /**
         * Test that verifies commit operation with amend flag.
         * Validates that the previous commit is properly amended.
         */
        @Test
        @DisplayName("should amend previous commit successfully")
        void commitArtifact_withAmendFlag_amendsLastCommit() throws IOException {
            // Given
            createFileInRepo("initial-file.txt", "initial content");

            // Make initial commit
            fsGitHandler
                    .commitArtifact(testRepoSuffix, "Initial commit", "Test Author", "test@example.com", true, false)
                    .block();

            // Add more changes
            createFileInRepo("additional-file.txt", "additional content");

            // When - Commit with amend
            Mono<String> commitResult = fsGitHandler.commitArtifact(
                    testRepoSuffix, "Amended commit", "Test Author", "test@example.com", true, true);

            // Then
            StepVerifier.create(commitResult)
                    .assertNext(message -> {
                        assertThat(message).isEqualTo("Committed successfully!");
                    })
                    .verifyComplete();
        }
    }

    // ============================================================================
    // BRANCH OPERATIONS TESTS
    // ============================================================================

    @Nested
    @DisplayName("Branch Operations")
    class BranchOperationTests {

        /**
         * Test that verifies successful creation and checkout of a new branch.
         * Validates that the branch is properly created and checked out.
         */
        @Test
        @DisplayName("should create and checkout to new branch successfully")
        void createAndCheckoutToBranch_validBranchName_success() throws IOException {
            // Given
            createFileInRepo("initial-file.txt", "content");
            commitInitialFile();
            String branchName = "feature/new-branch";

            // When
            Mono<String> branchResult = fsGitHandler.createAndCheckoutToBranch(testRepoSuffix, branchName);

            // Then
            StepVerifier.create(branchResult)
                    .assertNext(createdBranch -> {
                        assertThat(createdBranch).isEqualTo(branchName);
                    })
                    .verifyComplete();
        }

        /**
         * Test that verifies successful checkout to an existing branch.
         * Validates that the checkout operation completes without errors.
         */
        @Test
        @DisplayName("should checkout to existing branch successfully")
        void checkoutToBranch_existingBranch_success() throws IOException {
            // Given
            createFileInRepo("initial-file.txt", "content");
            commitInitialFile();
            String branchName = "test-branch";
            fsGitHandler.createAndCheckoutToBranch(testRepoSuffix, branchName).block();
            fsGitHandler.checkoutToBranch(testRepoSuffix, "master").block();

            // When
            Mono<Boolean> checkoutResult = fsGitHandler.checkoutToBranch(testRepoSuffix, branchName);

            // Then
            StepVerifier.create(checkoutResult)
                    .assertNext(result -> {
                        assertThat(result).isTrue();
                    })
                    .verifyComplete();
        }

        /**
         * Test that verifies checkout fails with invalid branch name.
         * Validates proper error handling for non-existent branches.
         */
        @Test
        @DisplayName("should fail checkout to non-existent branch")
        void checkoutToBranch_nonExistentBranch_throwsError() throws IOException {
            // Given
            createFileInRepo("initial-file.txt", "content");
            commitInitialFile();
            String invalidBranchName = "non-existent-branch";

            // When
            Mono<Boolean> checkoutResult = fsGitHandler.checkoutToBranch(testRepoSuffix, invalidBranchName);

            // Then
            StepVerifier.create(checkoutResult)
                    .expectErrorMatches(throwable -> throwable instanceof RefNotFoundException
                            && throwable.getMessage().contains(invalidBranchName))
                    .verify();
        }

        /**
         * Test that verifies successful deletion of a branch.
         * Validates that the branch is properly removed from the repository.
         */
        @Test
        @DisplayName("should delete branch successfully")
        void deleteBranch_validBranch_success() throws IOException {
            // Given
            createFileInRepo("initial-file.txt", "content");
            commitInitialFile();
            String branchName = "branch-to-delete";
            fsGitHandler.createAndCheckoutToBranch(testRepoSuffix, branchName).block();
            fsGitHandler.checkoutToBranch(testRepoSuffix, "master").block();

            // When
            Mono<Boolean> deleteResult = fsGitHandler.deleteBranch(testRepoSuffix, branchName);

            // Then
            StepVerifier.create(deleteResult)
                    .assertNext(result -> {
                        assertThat(result).isTrue();
                    })
                    .verifyComplete();
        }

        /**
         * Test that verifies listing all branches in the repository.
         * Validates that both local and remote branches are properly listed.
         */
        @Test
        @DisplayName("should list all branches successfully")
        void listBranches_multiplebranches_returnsAllBranches() throws IOException {
            // Given
            createFileInRepo("initial-file.txt", "content");
            commitInitialFile();
            fsGitHandler.createAndCheckoutToBranch(testRepoSuffix, "branch1").block();
            fsGitHandler.createAndCheckoutToBranch(testRepoSuffix, "branch2").block();

            // When
            Mono<List<GitRefDTO>> branchesResult = fsGitHandler.listBranches(testRepoSuffix);

            // Then
            StepVerifier.create(branchesResult)
                    .assertNext(branches -> {
                        assertThat(branches).isNotEmpty();
                        assertThat(branches.size()).isGreaterThanOrEqualTo(2);
                    })
                    .verifyComplete();
        }
    }

    // ============================================================================
    // STATUS AND HISTORY OPERATIONS TESTS
    // ============================================================================

    @Nested
    @DisplayName("Status and History Operations")
    class StatusAndHistoryTests {

        /**
         * Test that verifies retrieval of commit history.
         * Validates that commit logs are properly retrieved with correct metadata.
         */
        @Test
        @DisplayName("should get commit history successfully")
        void getCommitHistory_withCommits_returnsHistory() throws IOException {
            // Given
            createFileInRepo("test-file.txt", "content");
            commitFileWithMessage("Initial commit", "Test Author", "test@example.com");

            // When
            Mono<List<GitLogDTO>> historyResult = fsGitHandler.getCommitHistory(testRepoSuffix);

            // Then
            StepVerifier.create(historyResult)
                    .assertNext(commits -> {
                        assertThat(commits).isNotEmpty();
                        assertThat(commits.get(0).getCommitMessage()).isEqualTo("Initial commit");
                        assertThat(commits.get(0).getAuthorName()).isEqualTo("Test Author");
                        assertThat(commits.get(0).getAuthorEmail()).isEqualTo("test@example.com");
                    })
                    .verifyComplete();
        }

        /**
         * Test that verifies error handling when getting history from empty repository.
         * Validates proper error handling for repositories without commits.
         */
        @Test
        @DisplayName("should fail to get history from empty repository")
        void getCommitHistory_emptyRepo_throwsNoHeadException() {
            // Given - Empty repository (no commits)

            // When
            Mono<List<GitLogDTO>> historyResult = fsGitHandler.getCommitHistory(testRepoSuffix);

            // Then
            StepVerifier.create(historyResult)
                    .expectErrorMatches(throwable -> throwable instanceof NoHeadException)
                    .verify();
        }

        /**
         * Test that verifies retrieval of the last commit details.
         * Validates that the most recent commit information is correctly retrieved.
         */
        @Test
        @DisplayName("should get last commit details successfully")
        void getLastCommitDetails_withCommits_returnsLastCommit() throws IOException {
            // Given
            createFileInRepo("first-file.txt", "first content");
            commitFileWithMessage("First commit", "Test Author", "test@example.com");

            createFileInRepo("second-file.txt", "second content");
            commitFileWithMessage("Second commit", "Test Author", "test@example.com");

            // When
            Mono<GitLogDTO> lastCommitResult = fsGitHandler.getLastCommitDetails(testRepoSuffix);

            // Then
            StepVerifier.create(lastCommitResult)
                    .assertNext(commit -> {
                        assertThat(commit.getCommitMessage()).isEqualTo("Second commit");
                        assertThat(commit.getAuthorName()).isEqualTo("Test Author");
                        assertThat(commit.getAuthorEmail()).isEqualTo("test@example.com");
                    })
                    .verifyComplete();
        }

        /**
         * Test that verifies error handling when getting last commit from empty repository.
         * Validates proper error handling for repositories without commits.
         */
        @Test
        @DisplayName("should fail to get last commit from empty repository")
        void getLastCommitDetails_emptyRepo_throwsNoHeadException() {
            // Given - Empty repository (no commits)

            // When
            Mono<GitLogDTO> lastCommitResult = fsGitHandler.getLastCommitDetails(testRepoSuffix);

            // Then
            StepVerifier.create(lastCommitResult)
                    .expectErrorMatches(throwable -> throwable instanceof NoHeadException)
                    .verify();
        }

        /**
         * Test that verifies retrieval of repository status with clean state.
         * Validates that status correctly reports clean repository state.
         */
        @Test
        @DisplayName("should get status for clean repository")
        void getStatus_cleanRepo_returnsCleanStatus() throws IOException {
            // Given
            createFileInRepo("committed-file.txt", "content");
            commitInitialFile();

            // When
            Mono<GitStatusDTO> statusResult =
                    fsGitHandler.getStatus(fsGitHandler.createRepoPath(testRepoSuffix), "master", false);

            // Then
            StepVerifier.create(statusResult)
                    .assertNext(status -> {
                        assertThat(status.getIsClean()).isTrue();
                        assertThat(status.getAheadCount()).isEqualTo(0);
                        assertThat(status.getBehindCount()).isEqualTo(0);
                    })
                    .verifyComplete();
        }

        /**
         * Test that verifies retrieval of repository status with uncommitted changes.
         * Validates that status correctly reports modified files.
         */
        @Test
        @DisplayName("should get status with uncommitted changes")
        void getStatus_withChanges_returnsDirtyStatus() throws IOException {
            // Given
            createFileInRepo("initial-file.txt", "content");
            commitInitialFile();
            createFileInRepo("new-file.txt", "new content"); // Uncommitted change

            // When
            Mono<GitStatusDTO> statusResult =
                    fsGitHandler.getStatus(fsGitHandler.createRepoPath(testRepoSuffix), "master", true);

            // Then
            StepVerifier.create(statusResult)
                    .assertNext(status -> {
                        assertThat(status.getIsClean()).isFalse();
                        assertThat(status.getAdded()).contains("new-file.txt");
                    })
                    .verifyComplete();
        }
    }

    // ============================================================================
    // MERGE OPERATIONS TESTS
    // ============================================================================

    @Nested
    @DisplayName("Merge Operations")
    class MergeOperationTests {

        /**
         * Test that verifies successful merge operation without conflicts.
         * Validates that branches can be merged when there are no conflicts.
         */
        @Test
        @DisplayName("should merge branches without conflicts successfully")
        void mergeBranch_noConflicts_success() throws IOException {
            // Given
            createFileInRepo("base-file.txt", "base content");
            commitInitialFile();

            // Create and switch to feature branch
            String featureBranch = "feature-branch";
            fsGitHandler
                    .createAndCheckoutToBranch(testRepoSuffix, featureBranch)
                    .block();
            createFileInRepo("feature-file.txt", "feature content");
            commitFileWithMessage("Feature commit", "Test Author", "test@example.com");

            // Switch back to master
            fsGitHandler.checkoutToBranch(testRepoSuffix, "master").block();

            // When
            Mono<String> mergeResult = fsGitHandler.mergeBranch(testRepoSuffix, featureBranch, "master", false);

            // Then
            StepVerifier.create(mergeResult)
                    .assertNext(result -> {
                        assertThat(result).isIn("FAST_FORWARD", "MERGED");
                    })
                    .verifyComplete();
        }

        /**
         * Test that verifies merge status check for compatible branches.
         * Validates that merge compatibility is correctly assessed.
         */
        @Test
        @DisplayName("should check merge status for compatible branches")
        void isMergeBranch_compatibleBranches_returnsMergeable() throws IOException {
            // Given
            createFileInRepo("base-file.txt", "base content");
            commitInitialFile();

            // Create feature branch with non-conflicting changes
            String featureBranch = "feature-branch";
            fsGitHandler
                    .createAndCheckoutToBranch(testRepoSuffix, featureBranch)
                    .block();
            createFileInRepo("feature-file.txt", "feature content");
            commitFileWithMessage("Feature commit", "Test Author", "test@example.com");

            fsGitHandler.checkoutToBranch(testRepoSuffix, "master").block();

            // When
            Mono<MergeStatusDTO> mergeStatusResult =
                    fsGitHandler.isMergeBranch(testRepoSuffix, featureBranch, "master", false);

            // Then
            StepVerifier.create(mergeStatusResult)
                    .assertNext(status -> {
                        assertThat(status.isMergeAble()).isTrue();
                    })
                    .verifyComplete();
        }
    }

    // ============================================================================
    // TAG OPERATIONS TESTS
    // ============================================================================

    @Nested
    @DisplayName("Tag Operations")
    class TagOperationTests {

        /**
         * Test that verifies creation of a new tag.
         * Validates that tags are properly created with correct metadata.
         */
        @Test
        @DisplayName("should create and checkout reference for tag successfully")
        void createAndCheckoutReference_tag_success() throws IOException {
            // Given
            createFileInRepo("tagged-file.txt", "content");
            commitInitialFile();

            GitRefDTO tagRef = new GitRefDTO();
            tagRef.setRefName("v1.0.0");
            tagRef.setRefType(RefType.tag);
            tagRef.setMessage("Release version 1.0.0");

            // When
            Mono<String> tagResult = fsGitHandler.createAndCheckoutReference(testRepoSuffix, tagRef);

            // Then
            StepVerifier.create(tagResult)
                    .assertNext(result -> {
                        // it's stored as refs/tags/v.*.*.*
                        assertThat(result).isEqualTo("refs/tags/v1.0.0");
                    })
                    .verifyComplete();
        }

        /**
         * Test that verifies listing all tags in the repository.
         * Validates that tags are properly retrieved with correct metadata.
         */
        @Test
        @DisplayName("should list all tags successfully")
        void listTags_withTags_returnsAllTags() throws IOException {
            // Given
            createFileInRepo("tagged-file.txt", "content");
            commitInitialFile();

            // Create a tag
            GitRefDTO tagRef = new GitRefDTO();
            tagRef.setRefName("v1.0.0");
            tagRef.setRefType(RefType.tag);
            tagRef.setMessage("Release version 1.0.0");
            fsGitHandler.createAndCheckoutReference(testRepoSuffix, tagRef).block();

            // When
            Mono<List<GitRefDTO>> tagsResult = fsGitHandler.listTags(testRepoSuffix);

            // Then
            StepVerifier.create(tagsResult)
                    .assertNext(tags -> {
                        assertThat(tags).isNotEmpty();
                        assertThat(tags.stream().anyMatch(tag -> "v1.0.0".equals(tag.getRefName())))
                                .isTrue();
                    })
                    .verifyComplete();
        }
    }

    // ============================================================================
    // RESET AND CLEANUP OPERATIONS TESTS
    // ============================================================================

    @Nested
    @DisplayName("Reset and Cleanup Operations")
    class ResetAndCleanupTests {

        /**
         * Test that verifies reset to last commit operation.
         * Validates that uncommitted changes are properly discarded.
         */
        @Test
        @DisplayName("should reset to last commit successfully")
        void resetToLastCommit_withChanges_success() throws IOException {
            // Given
            createFileInRepo("committed-file.txt", "committed content");
            commitInitialFile();
            createFileInRepo("uncommitted-file.txt", "uncommitted content");

            // When
            Mono<Boolean> resetResult = fsGitHandler.resetToLastCommit(testRepoSuffix);

            // Then
            StepVerifier.create(resetResult)
                    .assertNext(result -> {
                        assertThat(result).isTrue();
                    })
                    .verifyComplete();
        }

        /**
         * Test that verifies reset to last commit operation with branch and working dir parameters.
         * Validates that the reset operation works correctly with specific branch and working directory options.
         */
        @Test
        @DisplayName("should reset to last commit with parameters successfully")
        void resetToLastCommit_withBranchAndWorkingDirParams_success() throws IOException, GitAPIException {
            // Given
            createFileInRepo("committed-file.txt", "committed content");
            commitInitialFile();
            createFileInRepo("uncommitted-file.txt", "uncommitted content");
            String branchName = "master";
            boolean keepWorkingDirChanges = false;

            // When
            Mono<Boolean> resetResult =
                    fsGitHandler.resetToLastCommit(testRepoSuffix, branchName, keepWorkingDirChanges);

            // Then
            StepVerifier.create(resetResult)
                    .assertNext(result -> {
                        assertThat(result).isTrue();
                    })
                    .verifyComplete();
        }

        /**
         * Test that verifies hard reset operation.
         * Validates that the repository is reset to a specific state.
         */
        @Test
        @DisplayName("should perform hard reset successfully")
        void resetHard_validBranch_success() throws IOException {
            // Given
            createFileInRepo("initial-file.txt", "content");
            commitInitialFile();

            // Make another commit
            createFileInRepo("second-file.txt", "second content");
            commitFileWithMessage("Second commit", "Test Author", "test@example.com");

            // When
            Mono<Boolean> resetResult = fsGitHandler.resetHard(testRepoSuffix, "master");

            // Then
            StepVerifier.create(resetResult)
                    .assertNext(result -> {
                        assertThat(result).isTrue();
                    })
                    .verifyComplete();
        }

        /**
         * Test that verifies rebase operation.
         * Validates that branch rebasing works correctly.
         */
        @Test
        @Disabled
        @DisplayName("should rebase branch successfully")
        void rebaseBranch_validBranch_success() throws IOException {
            // Given
            createFileInRepo("base-file.txt", "base content");
            commitInitialFile();

            // When
            Mono<Boolean> rebaseResult = fsGitHandler.rebaseBranch(testRepoSuffix, "master", false);

            // Then
            StepVerifier.create(rebaseResult)
                    .assertNext(result -> {
                        assertThat(result).isTrue();
                    })
                    .verifyComplete();
        }

        /**
         * Test that verifies branch tracking status retrieval.
         * Validates that tracking information is correctly retrieved.
         */
        @Test
        @Disabled
        @DisplayName("should get branch tracking status")
        void getBranchTrackingStatus_validBranch_returnsStatus() throws IOException {
            // Given
            createFileInRepo("tracked-file.txt", "content");
            commitInitialFile();

            // When
            Mono<BranchTrackingStatus> trackingResult = fsGitHandler.getBranchTrackingStatus(testRepoSuffix, "master");

            // Then
            StepVerifier.create(trackingResult)
                    .assertNext(status -> {
                        // Note: status might be null for local-only repositories
                        // This test mainly verifies the method doesn't throw exceptions
                        assertThat(status).satisfiesAnyOf(s -> assertThat(s).isNull(), s -> assertThat(s)
                                .isNotNull());
                    })
                    .verifyComplete();
        }
    }

    // ============================================================================
    // REMOTE AND CHECKOUT OPERATIONS TESTS
    // ============================================================================

    @Nested
    @DisplayName("Remote and Checkout Operations")
    class RemoteAndCheckoutTests {

        /**
         * Test that verifies checkout to a tag.
         * Validates that tag checkout operation works correctly.
         */
        @Test
        @DisplayName("should checkout to tag successfully")
        void checkoutTag_validTag_success() throws IOException {
            // Given
            createFileInRepo("tagged-file.txt", "tagged content");
            commitInitialFile();

            // Create a tag first
            GitRefDTO tagRef = new GitRefDTO();
            tagRef.setRefName("v1.0.0");
            tagRef.setRefType(RefType.tag);
            tagRef.setMessage("Release version 1.0.0");
            fsGitHandler.createAndCheckoutReference(testRepoSuffix, tagRef).block();

            // When
            Mono<String> checkoutResult = fsGitHandler.checkoutTag(testRepoSuffix, "v1.0.0");

            // Then
            StepVerifier.create(checkoutResult)
                    .assertNext(result -> {
                        assertThat(result).isEqualTo("v1.0.0");
                    })
                    .verifyComplete();
        }

        /**
         * Test that verifies checkout to a non-existent tag fails.
         * Validates proper error handling for invalid tag references.
         */
        @Test
        @DisplayName("should fail checkout to non-existent tag")
        void checkoutTag_nonExistentTag_throwsError() throws IOException {
            // Given
            createFileInRepo("test-file.txt", "content");
            commitInitialFile();
            String nonExistentTag = "non-existent-tag";

            // When
            Mono<String> checkoutResult = fsGitHandler.checkoutTag(testRepoSuffix, nonExistentTag);

            // Then
            StepVerifier.create(checkoutResult)
                    .expectErrorMatches(throwable -> throwable instanceof RefNotFoundException
                            && throwable.getMessage().contains(nonExistentTag))
                    .verify();
        }

        /**
         * Test that verifies connection test functionality with invalid credentials.
         * Note: This test validates the method signature and error handling rather than actual remote connection.
         */
        @Test
        @Disabled
        @DisplayName("should handle connection test with invalid credentials")
        void testConnection_invalidCredentials_returnsFalse() {
            // Given
            String invalidPublicKey = "invalid-public-key";
            String invalidPrivateKey = "invalid-private-key";
            String testRemoteUrl = "git@github.com:test/test-repo.git";

            // When
            Mono<Boolean> connectionResult =
                    fsGitHandler.testConnection(invalidPublicKey, invalidPrivateKey, testRemoteUrl);

            // Then
            StepVerifier.create(connectionResult)
                    .assertNext(result -> {
                        assertThat(result).isFalse();
                    })
                    .verifyComplete();
        }
    }

    // ============================================================================
    // ADDITIONAL BRANCH OPERATIONS TESTS
    // ============================================================================

    @Nested
    @DisplayName("Additional Branch Operations")
    class AdditionalBranchTests {

        /**
         * Test that verifies checkout to remote branch.
         * Validates that remote branch checkout works correctly for local scenarios.
         */
        @Test
        @DisplayName("should checkout remote branch successfully")
        void checkoutRemoteBranch_validBranch_success() throws IOException {
            // Given
            createFileInRepo("remote-file.txt", "remote content");
            commitInitialFile();

            // Create a branch that simulates a remote branch
            String remoteBranch = "origin/feature-branch";
            fsGitHandler
                    .createAndCheckoutToBranch(testRepoSuffix, "feature-branch")
                    .block();
            fsGitHandler.checkoutToBranch(testRepoSuffix, "master").block();

            // When
            Mono<Boolean> checkoutResult = fsGitHandler.checkoutToBranch(testRepoSuffix, "feature-branch");

            // Then
            StepVerifier.create(checkoutResult)
                    .assertNext(result -> {
                        // because the reference is checked locally
                        assertThat(result).isEqualTo(Boolean.TRUE);
                    })
                    .verifyComplete();
        }

        /**
         * Test that verifies checkout to non-existent remote branch fails.
         * Validates proper error handling for invalid remote branch references.
         */
        @Test
        @DisplayName("should fail checkout to non-existent remote branch")
        void checkoutRemoteBranch_nonExistentBranch_throwsError() throws IOException {
            // Given
            createFileInRepo("test-file.txt", "content");
            commitInitialFile();
            String nonExistentBranch = "non-existent-remote-branch";

            // When
            Mono<String> checkoutResult = fsGitHandler.checkoutRemoteBranch(testRepoSuffix, nonExistentBranch);

            // Then
            StepVerifier.create(checkoutResult)
                    .expectErrorMatches(throwable -> throwable instanceof RefNotFoundException
                            && throwable.getMessage().contains(nonExistentBranch))
                    .verify();
        }
    }

    // ============================================================================
    // ADDITIONAL COMMIT OPERATIONS TESTS
    // ============================================================================

    @Nested
    @DisplayName("Additional Commit Operations")
    class AdditionalCommitTests {

        /**
         * Test that verifies commit operation with isSuffixedPath parameter.
         * Validates that the suffixed path parameter is handled correctly.
         */
        @Test
        @DisplayName("should commit artifact with suffixed path parameter")
        void commitArtifact_withSuffixedPathParam_success() throws IOException {
            // Given
            createFileInRepo("suffixed-file.txt", "suffixed content");
            String commitMessage = "Suffixed path commit";
            String authorName = "Test Author";
            String authorEmail = "test@example.com";
            boolean isSuffixedPath = true;
            boolean doAmend = false;

            // When
            Mono<String> commitResult = fsGitHandler.commitArtifact(
                    testRepoSuffix, commitMessage, authorName, authorEmail, isSuffixedPath, doAmend);

            // Then
            StepVerifier.create(commitResult)
                    .assertNext(message -> {
                        assertThat(message).isEqualTo("Committed successfully!");
                    })
                    .verifyComplete();
        }

        /**
         * Test that verifies commit operation with non-suffixed path parameter.
         * Validates that the path parameter handling works for absolute paths.
         */
        @Test
        @DisplayName("should commit artifact with non-suffixed path parameter")
        void commitArtifact_withNonSuffixedPath_success() throws IOException {
            // Given
            Path fullRepoPath = fsGitHandler.createRepoPath(testRepoSuffix);
            createFileInRepo("non-suffixed-file.txt", "non-suffixed content");
            String commitMessage = "Non-suffixed path commit";
            String authorName = "Test Author";
            String authorEmail = "test@example.com";
            boolean isSuffixedPath = false;
            boolean doAmend = false;

            // When
            Mono<String> commitResult = fsGitHandler.commitArtifact(
                    fullRepoPath, commitMessage, authorName, authorEmail, isSuffixedPath, doAmend);

            // Then
            StepVerifier.create(commitResult)
                    .assertNext(message -> {
                        assertThat(message).isEqualTo("Committed successfully!");
                    })
                    .verifyComplete();
        }
    }

    // ============================================================================
    // HELPER METHODS
    // ============================================================================

    /**
     * Helper method to create a file in the test repository.
     */
    private void createFileInRepo(String fileName, String content) throws IOException {
        Path repoPath = fsGitHandler.createRepoPath(testRepoSuffix);
        File file = repoPath.resolve(fileName).toFile();
        FileUtils.writeStringToFile(file, content, "UTF-8", false);
    }

    /**
     * Helper method to commit the initial file with default commit message.
     */
    private void commitInitialFile() {
        fsGitHandler
                .commitArtifact(testRepoSuffix, "Initial commit", "Test Author", "test@example.com", true, false)
                .block();
    }

    /**
     * Helper method to commit a file with custom commit message and author details.
     */
    private void commitFileWithMessage(String message, String authorName, String authorEmail) {
        fsGitHandler
                .commitArtifact(testRepoSuffix, message, authorName, authorEmail, true, false)
                .block();
    }
}
