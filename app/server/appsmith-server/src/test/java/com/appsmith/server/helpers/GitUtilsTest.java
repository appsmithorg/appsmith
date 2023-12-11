package com.appsmith.server.helpers;

import com.appsmith.server.domains.Application;
import com.appsmith.server.domains.GitApplicationMetadata;
import org.junit.jupiter.api.Test;
import reactor.test.StepVerifier;

import java.util.UUID;

import static com.appsmith.server.helpers.GitUtils.isApplicationConnectedToGit;
import static com.appsmith.server.helpers.GitUtils.isDefaultBranchedApplication;
import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

public class GitUtilsTest {

    @Test
    public void convertSshUrlToBrowserSupportedUrl() {
        assertThat(GitUtils.convertSshUrlToBrowserSupportedUrl("git@example.test.net:user/test/tests/testRepo.git"))
                .isEqualTo("https://example.test.net/user/test/tests/testRepo");
        assertThat(GitUtils.convertSshUrlToBrowserSupportedUrl("git@example.com:test/testRepo.git"))
                .isEqualTo("https://example.com/test/testRepo");
        assertThat(GitUtils.convertSshUrlToBrowserSupportedUrl("git@example.org:test/testRepo.git"))
                .isEqualTo("https://example.org/test/testRepo");
        assertThat(GitUtils.convertSshUrlToBrowserSupportedUrl("git@example.in:test/testRepo.git"))
                .isEqualTo("https://example.in/test/testRepo");
        assertThat(GitUtils.convertSshUrlToBrowserSupportedUrl(
                        "ssh://git@example.test.net:user/test/tests/testRepo.git"))
                .isEqualTo("https://example.test.net/user/test/tests/testRepo");
        assertThat(GitUtils.convertSshUrlToBrowserSupportedUrl(
                        "git@tim.tam.example.com:v3/sladeping/pyhe/SpaceJunk.git"))
                .isEqualTo("https://tim.tam.example.com/v3/sladeping/pyhe/SpaceJunk");
        assertThat(GitUtils.convertSshUrlToBrowserSupportedUrl("git@tim.tam.example.com:v3/sladeping/pyhe/SpaceJunk"))
                .isEqualTo("https://tim.tam.example.com/v3/sladeping/pyhe/SpaceJunk");
        assertThat(GitUtils.convertSshUrlToBrowserSupportedUrl(
                        "ssh://git@tim.tam.example.com:v3/sladeping/pyhe/SpaceJunk.git"))
                .isEqualTo("https://tim.tam.example.com/v3/sladeping/pyhe/SpaceJunk");
        assertThat(GitUtils.convertSshUrlToBrowserSupportedUrl(
                        "ssh://git@tim.tam.example.com:v3/sladeping/pyhe/SpaceJunk"))
                .isEqualTo("https://tim.tam.example.com/v3/sladeping/pyhe/SpaceJunk");
        assertThat(GitUtils.convertSshUrlToBrowserSupportedUrl("git@127.0.0.1:test/newRepo.git"))
                .isEqualTo("https://127.0.0.1/test/newRepo");
    }

    @Test
    public void isRepoPrivate() {

        StepVerifier.create(GitUtils.isRepoPrivate(
                        GitUtils.convertSshUrlToBrowserSupportedUrl("git@github.com:test/testRepo.git")))
                .assertNext(isRepoPrivate -> assertThat(isRepoPrivate).isEqualTo(Boolean.TRUE))
                .verifyComplete();

        StepVerifier.create(GitUtils.isRepoPrivate(GitUtils.convertSshUrlToBrowserSupportedUrl(
                        "ssh://git@example.test.net:user/test/tests/testRepo.git")))
                .assertNext(isRepoPrivate -> assertThat(isRepoPrivate).isEqualTo(Boolean.TRUE))
                .verifyComplete();

        StepVerifier.create(GitUtils.isRepoPrivate(
                        GitUtils.convertSshUrlToBrowserSupportedUrl("git@github.com:appsmithorg/appsmith.git")))
                .assertNext(isRepoPrivate -> assertThat(isRepoPrivate).isEqualTo(Boolean.FALSE))
                .verifyComplete();
    }

    @Test
    public void getRepoName() {
        assertThat(GitUtils.getRepoName("git@example.test.net:user/test/tests/lakechope.git"))
                .isEqualTo("lakechope");
        assertThat(GitUtils.getRepoName("git@example.com:test/ParkMyrtlows.git"))
                .isEqualTo("ParkMyrtlows");
        assertThat(GitUtils.getRepoName("git@example.org:test/Lergaf_Wells.git"))
                .isEqualTo("Lergaf_Wells");
        assertThat(GitUtils.getRepoName("git@example.in:test/fort-cheporder.git"))
                .isEqualTo("fort-cheporder");
        assertThat(GitUtils.getRepoName("git@tim.tam.example.com:v3/sladeping/pyhe/SpaceJunk"))
                .isEqualTo("SpaceJunk");
        assertThat(GitUtils.getRepoName("git@examplelab-abcd.test.org:org_org/testNewRepo.git"))
                .isEqualTo("testNewRepo");
    }

    @Test
    public void getGitProviderName() {
        assertThat(GitUtils.getGitProviderName("git@example.test.net:user/test/tests/testRepo.git"))
                .isEqualTo("example");
        assertThat(GitUtils.getGitProviderName("git@example.com:test/testRepo.git"))
                .isEqualTo("example");
        assertThat(GitUtils.getGitProviderName("git@example.org:test/testRepo.git"))
                .isEqualTo("example");
        assertThat(GitUtils.getGitProviderName("git@example.in:test/testRepo.git"))
                .isEqualTo("example");
    }

    @Test
    public void testIsApplicationConnectedToGit_Connected() {
        // Create a mock Application with connected Git metadata
        Application connectedApplication = new Application();
        GitApplicationMetadata gitMetadata = new GitApplicationMetadata();
        gitMetadata.setRemoteUrl("https://git.example.com/repo.git");
        gitMetadata.setDefaultApplicationId(UUID.randomUUID().toString());
        connectedApplication.setGitApplicationMetadata(gitMetadata);

        assertTrue(isApplicationConnectedToGit(connectedApplication));
    }

    @Test
    public void testIsApplicationConnectedToGit_NotConnected_NullMetadata() {
        // Create a mock Application with null Git metadata
        Application notConnectedApplication = new Application();

        assertFalse(isApplicationConnectedToGit(notConnectedApplication));
    }

    @Test
    public void testIsApplicationConnectedToGit_NotConnected_NullDefaultApplicationId() {
        // Create a mock Application with Git metadata and null defaultApplicationId
        Application notConnectedApplication = new Application();
        GitApplicationMetadata gitMetadata = new GitApplicationMetadata();
        gitMetadata.setRemoteUrl("https://git.example.com/repo.git");
        notConnectedApplication.setGitApplicationMetadata(gitMetadata);

        assertFalse(isApplicationConnectedToGit(notConnectedApplication));
    }

    @Test
    public void testIsApplicationConnectedToGit_NotConnected_NullRemoteUrl() {
        // Create a mock Application with Git metadata and null remoteUrl
        Application notConnectedApplication = new Application();
        GitApplicationMetadata gitMetadata = new GitApplicationMetadata();
        gitMetadata.setDefaultApplicationId(UUID.randomUUID().toString());
        notConnectedApplication.setGitApplicationMetadata(gitMetadata);

        assertFalse(isApplicationConnectedToGit(notConnectedApplication));
    }

    @Test
    public void testIsApplicationConnectedToGit_NotConnected_EmptyMetadata() {
        // Create a mock Application with empty Git metadata
        Application notConnectedApplication = new Application();
        GitApplicationMetadata gitMetadata = new GitApplicationMetadata();
        gitMetadata.setDefaultApplicationId("");
        gitMetadata.setRemoteUrl("");
        notConnectedApplication.setGitApplicationMetadata(gitMetadata);

        assertFalse(isApplicationConnectedToGit(notConnectedApplication));
    }

    @Test
    public void testIsDefaultBranchedApplication_DefaultBranch() {
        // Create a mock Application with connected Git metadata and default branch
        Application defaultBranchApplication = new Application();
        GitApplicationMetadata metadata = new GitApplicationMetadata();
        metadata.setDefaultApplicationId(UUID.randomUUID().toString());
        metadata.setRemoteUrl("https://git.example.com/repo.git");
        metadata.setBranchName("main");
        metadata.setDefaultBranchName("main");
        defaultBranchApplication.setGitApplicationMetadata(metadata);

        assertTrue(isDefaultBranchedApplication(defaultBranchApplication));
    }

    @Test
    public void testIsDefaultBranchedApplication_NotDefaultBranch() {
        // Create a mock Application with connected Git metadata and non-default branch
        Application nonDefaultBranchApplication = new Application();
        GitApplicationMetadata metadata = new GitApplicationMetadata();
        metadata.setDefaultApplicationId(UUID.randomUUID().toString());
        metadata.setRemoteUrl("https://git.example.com/repo.git");
        metadata.setBranchName("feature-branch");
        metadata.setDefaultBranchName("main");
        nonDefaultBranchApplication.setGitApplicationMetadata(metadata);

        assertFalse(isDefaultBranchedApplication(nonDefaultBranchApplication));
    }

    @Test
    public void testIsDefaultBranchedApplication_NotConnected() {
        // Create a mock Application without connected Git metadata
        Application notConnectedApplication = new Application();

        assertFalse(isDefaultBranchedApplication(notConnectedApplication));
    }

    @Test
    public void testIsDefaultBranchedApplication_NullMetadata() {
        // Create a mock Application with null Git metadata
        Application nullMetadataApplication = new Application();
        nullMetadataApplication.setGitApplicationMetadata(null);

        assertFalse(isDefaultBranchedApplication(nullMetadataApplication));
    }

    @Test
    public void testIsDefaultBranchedApplication_NullBranchName() {
        // Create a mock Application with connected Git metadata and null branch name
        Application nullBranchNameApplication = new Application();
        GitApplicationMetadata metadata = new GitApplicationMetadata();
        metadata.setDefaultApplicationId(UUID.randomUUID().toString());
        metadata.setRemoteUrl("https://git.example.com/repo.git");
        metadata.setBranchName(null);
        metadata.setDefaultBranchName("main");
        nullBranchNameApplication.setGitApplicationMetadata(metadata);

        assertFalse(isDefaultBranchedApplication(nullBranchNameApplication));
    }

    @Test
    public void testIsDefaultBranchedApplication_NullDefaultBranchName() {
        // Create a mock Application with connected Git metadata and null default branch name
        Application nullDefaultBranchNameApplication = new Application();
        GitApplicationMetadata metadata = new GitApplicationMetadata();
        metadata.setDefaultApplicationId(UUID.randomUUID().toString());
        metadata.setRemoteUrl("https://git.example.com/repo.git");
        metadata.setBranchName("main");
        metadata.setDefaultBranchName(null);
        nullDefaultBranchNameApplication.setGitApplicationMetadata(metadata);

        assertFalse(isDefaultBranchedApplication(nullDefaultBranchNameApplication));
    }
}
