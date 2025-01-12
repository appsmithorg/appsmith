package com.appsmith.server.helpers;

import com.appsmith.server.domains.Application;
import com.appsmith.server.domains.AutoCommitConfig;
import com.appsmith.server.domains.GitArtifactMetadata;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import net.minidev.json.JSONObject;
import org.junit.jupiter.api.Test;
import reactor.test.StepVerifier;

import java.util.UUID;

import static com.appsmith.server.helpers.GitUtils.isArtifactConnectedToGit;
import static com.appsmith.server.helpers.GitUtils.isDefaultBranchedArtifact;
import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
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
                        "ssh://git@example.test.net/user/test/tests/testRepo.git"))
                .isEqualTo("https://example.test.net/user/test/tests/testRepo");
        assertThat(GitUtils.convertSshUrlToBrowserSupportedUrl(
                        "git@tim.tam.example.com:v3/sladeping/pyhe/SpaceJunk.git"))
                .isEqualTo("https://tim.tam.example.com/v3/sladeping/pyhe/SpaceJunk");
        assertThat(GitUtils.convertSshUrlToBrowserSupportedUrl("git@tim.tam.example.com:v3/sladeping/pyhe/SpaceJunk"))
                .isEqualTo("https://tim.tam.example.com/v3/sladeping/pyhe/SpaceJunk");
        assertThat(GitUtils.convertSshUrlToBrowserSupportedUrl(
                        "ssh://git@tim.tam.example.com/v3/sladeping/pyhe/SpaceJunk.git"))
                .isEqualTo("https://tim.tam.example.com/v3/sladeping/pyhe/SpaceJunk");
        assertThat(GitUtils.convertSshUrlToBrowserSupportedUrl(
                        "ssh://git@tim.tam.example.com/v3/sladeping/pyhe/SpaceJunk"))
                .isEqualTo("https://tim.tam.example.com/v3/sladeping/pyhe/SpaceJunk");
        assertThat(GitUtils.convertSshUrlToBrowserSupportedUrl("git@127.0.0.1:test/newRepo.git"))
                .isEqualTo("https://127.0.0.1/test/newRepo");
        assertThat(GitUtils.convertSshUrlToBrowserSupportedUrl("git@localhost:test/newRepo.git"))
                .isEqualTo("https://localhost/test/newRepo");
        assertThat(GitUtils.convertSshUrlToBrowserSupportedUrl("git@absolute.path.com:/test/newRepo.git"))
                .isEqualTo("https://absolute.path.com/test/newRepo");

        // Custom SSH port:
        assertThat(GitUtils.convertSshUrlToBrowserSupportedUrl(
                        "ssh://git@example.test.net:1234/user/test/tests/testRepo.git"))
                .isEqualTo("https://example.test.net/user/test/tests/testRepo");
        assertThat(GitUtils.convertSshUrlToBrowserSupportedUrl(
                        "ssh://git@tim.tam.example.com:5678/v3/sladeping/pyhe/SpaceJunk.git"))
                .isEqualTo("https://tim.tam.example.com/v3/sladeping/pyhe/SpaceJunk");
        assertThat(GitUtils.convertSshUrlToBrowserSupportedUrl(
                        "ssh://git@tim.tam.example.com:9876/v3/sladeping/pyhe/SpaceJunk"))
                .isEqualTo("https://tim.tam.example.com/v3/sladeping/pyhe/SpaceJunk");

        // custom ssh username:
        assertThat(GitUtils.convertSshUrlToBrowserSupportedUrl("abc-xy@vs-ssh.visualstudio.com:v3/newJet/ai/zilla"))
                .isEqualTo("https://vs-ssh.visualstudio.com/v3/newJet/ai/zilla");

        assertThat(GitUtils.convertSshUrlToBrowserSupportedUrl(
                        "ssh://cust-om@vs-ssh.visualstudio.com:/v3/newJet/ai/zilla.git"))
                .isEqualTo("https://vs-ssh.visualstudio.com/v3/newJet/ai/zilla");

        assertThat(GitUtils.convertSshUrlToBrowserSupportedUrl("ssh://xy-ab@sub.domain.xy:/v3/xy-ab/path/path.git"))
                .isEqualTo("https://sub.domain.xy/v3/xy-ab/path/path");

        assertThat(GitUtils.convertSshUrlToBrowserSupportedUrl("ssh://domain.xy:/path/path.git"))
                .isEqualTo("https://domain.xy/path/path");

        assertThat(GitUtils.convertSshUrlToBrowserSupportedUrl("ssh://user@domain.com/repopath.git"))
                .isEqualTo("https://domain.com/repopath");

        AppsmithException exception = assertThrows(
                AppsmithException.class,
                () -> GitUtils.convertSshUrlToBrowserSupportedUrl(
                        "ssh://cust-om@vs-ssh.visualstudio.com:v3/newJet/ai/zilla.git"));
        assertThat(exception.getAppErrorCode()).isEqualTo(AppsmithError.INVALID_GIT_CONFIGURATION.getAppErrorCode());
    }

    @Test
    public void isRepoPrivate() {

        StepVerifier.create(GitUtils.isRepoPrivate(
                        GitUtils.convertSshUrlToBrowserSupportedUrl("git@github.com:test/testRepo.git")))
                .assertNext(isRepoPrivate -> assertThat(isRepoPrivate).isEqualTo(Boolean.TRUE))
                .verifyComplete();

        StepVerifier.create(GitUtils.isRepoPrivate(GitUtils.convertSshUrlToBrowserSupportedUrl(
                        "ssh://git@example.test.net/user/test/tests/testRepo.git")))
                .assertNext(isRepoPrivate -> assertThat(isRepoPrivate).isEqualTo(Boolean.TRUE))
                .verifyComplete();

        StepVerifier.create(GitUtils.isRepoPrivate(
                        GitUtils.convertSshUrlToBrowserSupportedUrl("git@github.com:appsmithorg/appsmith.git")))
                .assertNext(isRepoPrivate -> assertThat(isRepoPrivate).isEqualTo(Boolean.FALSE))
                .verifyComplete();
    }

    @Test
    public void getRepoName_WhenUrlIsValid_RepoNameReturned() {
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

        assertThat(GitUtils.getRepoName("git@github.com:user/project.git")).isEqualTo("project");
        assertThat(GitUtils.getRepoName("git://a@b:c/d.git")).isEqualTo("d");
        assertThat(GitUtils.getRepoName("git@192.168.101.127:user/project.git")).isEqualTo("project");
        assertThat(GitUtils.getRepoName("ssh://user@host.xz:port/path/to/repo.git"))
                .isEqualTo("repo");
        assertThat(GitUtils.getRepoName("ssh://user@host.xz/path/to/repo.git")).isEqualTo("repo");
        assertThat(GitUtils.getRepoName("ssh://host.xz:port/path/to/repo.git")).isEqualTo("repo");
        assertThat(GitUtils.getRepoName("ssh://host.xz/path/to/repo.git")).isEqualTo("repo");
        assertThat(GitUtils.getRepoName("ssh://user@host.xz/path/to/repo.git")).isEqualTo("repo");
        assertThat(GitUtils.getRepoName("ssh://host.xz/path/to/repo.git")).isEqualTo("repo");
        assertThat(GitUtils.getRepoName("ssh://user@host.xz/~user/path/to/repo.git"))
                .isEqualTo("repo");
        assertThat(GitUtils.getRepoName("ssh://host.xz/~user/path/to/repo.git")).isEqualTo("repo");
        assertThat(GitUtils.getRepoName("ssh://user@host.xz/~/path/to/repo.git"))
                .isEqualTo("repo");
        assertThat(GitUtils.getRepoName("ssh://host.xz/~/path/to/repo.git")).isEqualTo("repo");
        assertThat(GitUtils.getRepoName("git@ssh.dev.azure.com:v3/something/other/thing.git"))
                .isEqualTo("thing");
        assertThat(GitUtils.getRepoName("git@ssh.dev.azure.com:v3/something/other/(thing).git"))
                .isEqualTo("(thing)");
        assertThat(GitUtils.getRepoName("git@ssh.dev.azure.com:v3/(((something)/(other)/(thing).git"))
                .isEqualTo("(thing)");
        assertThat(GitUtils.getRepoName("git@abcd.org:org__v3/(((something)/(other)/(thing).git"))
                .isEqualTo("(thing)");
        assertThat(GitUtils.getRepoName("git@gitlab-abcd.test.org:org__org/repoName.git"))
                .isEqualTo("repoName");
        assertThat(GitUtils.getRepoName("git@gitlab__abcd.test.org:org__org/repoName.git"))
                .isEqualTo("repoName");
        assertThat(GitUtils.getRepoName("git@ssh.dev.azure.com:v3/something/with%20space%20(some)/geo-mantis"))
                .isEqualTo("geo-mantis");
        assertThat(GitUtils.getRepoName("git@ssh.dev.azure.com:v3/something/with%20space%20some/geo-mantis"))
                .isEqualTo("geo-mantis");
        assertThat(GitUtils.getRepoName("user@host.xz:path/to/repo.git")).isEqualTo("repo");
        assertThat(GitUtils.getRepoName("org-987654321@github.com:org_name/repository_name.git"))
                .isEqualTo("repository_name");

        // custom ssh username:
        assertThat(GitUtils.getRepoName("custom@vs-ssh.visualstudio.com:v3/newJet/ai/zilla"))
                .isEqualTo("zilla");

        assertThat(GitUtils.getRepoName("ssh://custom@vs-ssh.visualstudio.com:/v3/newJet/ai/zilla"))
                .isEqualTo("zilla");

        assertThat(GitUtils.getRepoName("ssh://xy-ab@sub.domain.xy:/v3/xy-ab/path/path.git"))
                .isEqualTo("path");

        assertThat(GitUtils.getRepoName("ssh://domain.xy:/path/path.git")).isEqualTo("path");
    }

    @Test
    public void getRepoName_WhenURLIsInvalid_ThrowsException() {
        String[] invalidUrls = {
            "https://github.com/user/project.git",
            "http://github.com/user/project.git",
            "https://192.168.101.127/user/project.git",
            "http://192.168.101.127/user/project.git",
            "git@ssh.dev.azure.(com):v3/(((something)/(other)/(thing).git",
            "http://host.xz/path/to/repo.git/",
            "https://host.xz/path/to/repo.git/",
            "/path/to/repo.git/",
            "path/to/repo.git/",
            "~/path/to/repo.git",
            "file:///path/to/repo.git/",
            "file://~/path/to/repo.git/",
            "host.xz:/path/to/repo.git/",
            "host.xz:~user/path/to/repo.git/",
            "host.xz:path/to/repo.git",
            "rsync://host.xz/path/to/repo.git/"
        };

        for (String url : invalidUrls) {
            assertThrows(AppsmithException.class, () -> GitUtils.getRepoName(url), url + " is not invalid");
        }
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
        GitArtifactMetadata gitMetadata = new GitArtifactMetadata();
        gitMetadata.setRemoteUrl("https://git.example.com/repo.git");
        gitMetadata.setDefaultApplicationId(UUID.randomUUID().toString());
        connectedApplication.setGitApplicationMetadata(gitMetadata);

        assertTrue(isArtifactConnectedToGit(connectedApplication.getGitArtifactMetadata()));
    }

    @Test
    public void testIsApplicationConnectedToGit_NotConnected_NullMetadata() {
        // Create a mock Application with null Git metadata
        Application notConnectedApplication = new Application();

        assertFalse(isArtifactConnectedToGit(notConnectedApplication.getGitArtifactMetadata()));
    }

    @Test
    public void testIsApplicationConnectedToGit_NotConnected_NullDefaultApplicationId() {
        // Create a mock Application with Git metadata and null defaultApplicationId
        Application notConnectedApplication = new Application();
        GitArtifactMetadata gitMetadata = new GitArtifactMetadata();
        gitMetadata.setRemoteUrl("https://git.example.com/repo.git");
        notConnectedApplication.setGitApplicationMetadata(gitMetadata);

        assertFalse(isArtifactConnectedToGit(notConnectedApplication.getGitArtifactMetadata()));
    }

    @Test
    public void testIsApplicationConnectedToGit_NotConnected_NullRemoteUrl() {
        // Create a mock Application with Git metadata and null remoteUrl
        Application notConnectedApplication = new Application();
        GitArtifactMetadata gitMetadata = new GitArtifactMetadata();
        gitMetadata.setDefaultApplicationId(UUID.randomUUID().toString());
        notConnectedApplication.setGitApplicationMetadata(gitMetadata);

        assertFalse(isArtifactConnectedToGit(notConnectedApplication.getGitArtifactMetadata()));
    }

    @Test
    public void testIsApplicationConnectedToGit_NotConnected_EmptyMetadata() {
        // Create a mock Application with empty Git metadata
        Application notConnectedApplication = new Application();
        GitArtifactMetadata gitMetadata = new GitArtifactMetadata();
        gitMetadata.setDefaultApplicationId("");
        gitMetadata.setRemoteUrl("");
        notConnectedApplication.setGitApplicationMetadata(gitMetadata);

        assertFalse(isArtifactConnectedToGit(notConnectedApplication.getGitArtifactMetadata()));
    }

    @Test
    public void testIsDefaultBranchedApplication_DefaultBranch() {
        // Create a mock Application with connected Git metadata and default branch
        Application defaultBranchApplication = new Application();
        GitArtifactMetadata metadata = new GitArtifactMetadata();
        metadata.setDefaultApplicationId(UUID.randomUUID().toString());
        metadata.setRemoteUrl("https://git.example.com/repo.git");
        metadata.setRefName("main");
        metadata.setDefaultBranchName("main");
        defaultBranchApplication.setGitApplicationMetadata(metadata);

        assertTrue(isDefaultBranchedArtifact(defaultBranchApplication.getGitArtifactMetadata()));
    }

    @Test
    public void testIsDefaultBranchedApplication_NotDefaultBranch() {
        // Create a mock Application with connected Git metadata and non-default branch
        Application nonDefaultBranchApplication = new Application();
        GitArtifactMetadata metadata = new GitArtifactMetadata();
        metadata.setDefaultApplicationId(UUID.randomUUID().toString());
        metadata.setRemoteUrl("https://git.example.com/repo.git");
        metadata.setRefName("feature-branch");
        metadata.setDefaultBranchName("main");
        nonDefaultBranchApplication.setGitApplicationMetadata(metadata);

        assertFalse(isDefaultBranchedArtifact(nonDefaultBranchApplication.getGitArtifactMetadata()));
    }

    @Test
    public void testIsDefaultBranchedApplication_NotConnected() {
        // Create a mock Application without connected Git metadata
        Application notConnectedApplication = new Application();

        assertFalse(isDefaultBranchedArtifact(notConnectedApplication.getGitArtifactMetadata()));
    }

    @Test
    public void testIsDefaultBranchedApplication_NullMetadata() {
        // Create a mock Application with null Git metadata
        Application nullMetadataApplication = new Application();
        nullMetadataApplication.setGitApplicationMetadata(null);

        assertFalse(isDefaultBranchedArtifact(nullMetadataApplication.getGitArtifactMetadata()));
    }

    @Test
    public void testIsDefaultBranchedApplication_NullBranchName() {
        // Create a mock Application with connected Git metadata and null branch name
        Application nullBranchNameApplication = new Application();
        GitArtifactMetadata metadata = new GitArtifactMetadata();
        metadata.setDefaultApplicationId(UUID.randomUUID().toString());
        metadata.setRemoteUrl("https://git.example.com/repo.git");
        metadata.setRefName(null);
        metadata.setDefaultBranchName("main");
        nullBranchNameApplication.setGitApplicationMetadata(metadata);

        assertFalse(isDefaultBranchedArtifact(nullBranchNameApplication.getGitArtifactMetadata()));
    }

    @Test
    public void testIsDefaultBranchedApplication_NullDefaultBranchName() {
        // Create a mock Application with connected Git metadata and null default branch name
        Application nullDefaultBranchNameApplication = new Application();
        GitArtifactMetadata metadata = new GitArtifactMetadata();
        metadata.setDefaultApplicationId(UUID.randomUUID().toString());
        metadata.setRemoteUrl("https://git.example.com/repo.git");
        metadata.setRefName("main");
        metadata.setDefaultBranchName(null);
        nullDefaultBranchNameApplication.setGitApplicationMetadata(metadata);

        assertFalse(isDefaultBranchedArtifact(nullDefaultBranchNameApplication.getGitArtifactMetadata()));
    }

    @Test
    public void isMigrationRequired() {
        int latestDslVersion = 87;
        JSONObject jsonObject = new JSONObject();

        // if the version is not present in dsl, migration should be required
        assertThat(GitUtils.isMigrationRequired(jsonObject, latestDslVersion)).isTrue();

        jsonObject.put("version", 86);
        // version less than latest, migration should be required
        assertThat(GitUtils.isMigrationRequired(jsonObject, latestDslVersion)).isTrue();

        jsonObject.put("version", 87);
        // version same as latest, migration should not be required
        assertThat(GitUtils.isMigrationRequired(jsonObject, latestDslVersion)).isFalse();

        jsonObject.put("version", 88);
        // version greater than latest, migration should not be required
        assertThat(GitUtils.isMigrationRequired(jsonObject, latestDslVersion)).isFalse();
    }

    @Test
    public void isAutoCommitEnabled() {
        GitArtifactMetadata metadata = new GitArtifactMetadata();
        // should be true when auto commit config is null
        assertThat(GitUtils.isAutoCommitEnabled(metadata)).isTrue();

        metadata.setAutoCommitConfig(new AutoCommitConfig());
        // should be true when auto commit config has enabled=null
        assertThat(GitUtils.isAutoCommitEnabled(metadata)).isTrue();

        metadata.getAutoCommitConfig().setEnabled(true);
        // should be true when auto commit config has enabled=true
        assertThat(GitUtils.isAutoCommitEnabled(metadata)).isTrue();

        metadata.getAutoCommitConfig().setEnabled(false);
        // should be true when auto commit config has enabled=false
        assertThat(GitUtils.isAutoCommitEnabled(metadata)).isFalse();
    }
}
