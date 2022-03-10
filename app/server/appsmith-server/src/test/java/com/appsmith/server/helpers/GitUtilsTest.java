package com.appsmith.server.helpers;

import org.junit.Test;
import org.junit.runner.RunWith;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.junit4.SpringRunner;

import java.io.IOException;

import static org.assertj.core.api.Assertions.assertThat;

@RunWith(SpringRunner.class)
@SpringBootTest
public class GitUtilsTest {


    @Test
    public void convertSshUrlToBrowserSupportedUrl() {
        assertThat(GitUtils.convertSshUrlToBrowserSupportedUrl("git@github.test.net:user/test/tests/testRepo.git"))
                .isEqualTo("https://github.test.net/user/test/tests/testRepo.git");
        assertThat(GitUtils.convertSshUrlToBrowserSupportedUrl("git@github.com:test/testRepo.git"))
                .isEqualTo("https://github.com/test/testRepo.git");
        assertThat(GitUtils.convertSshUrlToBrowserSupportedUrl("git@gitlab.org:test/testRepo.git"))
                .isEqualTo("https://gitlab.org/test/testRepo.git");
        assertThat(GitUtils.convertSshUrlToBrowserSupportedUrl("git@bitbucket.in:test/testRepo.git"))
                .isEqualTo("https://bitbucket.in/test/testRepo.git");
    }
    @Test
    public void isRepoPrivate() throws IOException {
        assertThat(GitUtils.isRepoPrivate(GitUtils.convertSshUrlToBrowserSupportedUrl("git@github.com:test/testRepo.git")))
                .isEqualTo(Boolean.TRUE);
        assertThat(GitUtils.isRepoPrivate(GitUtils.convertSshUrlToBrowserSupportedUrl("git@gitlab.com:test/testRepo.git")))
                .isEqualTo(Boolean.TRUE);
        assertThat(GitUtils.isRepoPrivate(GitUtils.convertSshUrlToBrowserSupportedUrl("git@bitbucket.org:test/testRepo.git")))
                .isEqualTo(Boolean.TRUE);
    }

    @Test
    public void getRepoName() {
        assertThat(GitUtils.getRepoName("git@github.test.net:user/test/tests/testRepo.git"))
                .isEqualTo("testRepo");
        assertThat(GitUtils.getRepoName("git@github.com:test/testRepo.git"))
                .isEqualTo("testRepo");
        assertThat(GitUtils.getRepoName("git@gitlab.org:test/testRepo.git"))
                .isEqualTo("testRepo");
        assertThat(GitUtils.getRepoName("git@bitbucket.in:test/testRepo.git"))
                .isEqualTo("testRepo");
    }

    @Test
    public void getGitProviderName() {
        assertThat(GitUtils.getGitProviderName("git@github.test.net:user/test/tests/testRepo.git"))
                .isEqualTo("github");
        assertThat(GitUtils.getGitProviderName("git@github.com:test/testRepo.git"))
                .isEqualTo("github");
        assertThat(GitUtils.getGitProviderName("git@gitlab.org:test/testRepo.git"))
                .isEqualTo("gitlab");
        assertThat(GitUtils.getGitProviderName("git@bitbucket.in:test/testRepo.git"))
                .isEqualTo("bitbucket");
    }
}
