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
        assertThat(GitUtils.convertSshUrlToBrowserSupportedUrl("git@example.test.net:user/test/tests/testRepo.git"))
                .isEqualTo("https://example.test.net/user/test/tests/testRepo");
        assertThat(GitUtils.convertSshUrlToBrowserSupportedUrl("git@example.com:test/testRepo.git"))
                .isEqualTo("https://example.com/test/testRepo");
        assertThat(GitUtils.convertSshUrlToBrowserSupportedUrl("git@example.org:test/testRepo.git"))
                .isEqualTo("https://example.org/test/testRepo");
        assertThat(GitUtils.convertSshUrlToBrowserSupportedUrl("git@example.in:test/testRepo.git"))
                .isEqualTo("https://example.in/test/testRepo");
        assertThat(GitUtils.convertSshUrlToBrowserSupportedUrl("ssh://git@example.test.net:user/test/tests/testRepo.git"))
                .isEqualTo("https://example.test.net/user/test/tests/testRepo");
    }
    @Test
    public void isRepoPrivate() throws IOException {
        assertThat(GitUtils.isRepoPrivate(GitUtils.convertSshUrlToBrowserSupportedUrl("git@example.com:test/testRepo.git")))
                .isEqualTo(Boolean.TRUE);
        assertThat(GitUtils.isRepoPrivate(GitUtils.convertSshUrlToBrowserSupportedUrl("git@example.com:test/testRepo.git")))
                .isEqualTo(Boolean.TRUE);
        assertThat(GitUtils.isRepoPrivate(GitUtils.convertSshUrlToBrowserSupportedUrl("git@example.org:test/testRepo.git")))
                .isEqualTo(Boolean.TRUE);
        assertThat(GitUtils.isRepoPrivate(GitUtils.convertSshUrlToBrowserSupportedUrl("ssh://git@appsmith.com.git")))
                .isEqualTo(Boolean.FALSE);
    }

    @Test
    public void getRepoName() {
        assertThat(GitUtils.getRepoName("git@example.test.net:user/test/tests/testRepo.git"))
                .isEqualTo("testRepo");
        assertThat(GitUtils.getRepoName("git@example.com:test/testRepo.git"))
                .isEqualTo("testRepo");
        assertThat(GitUtils.getRepoName("git@example.org:test/testRepo.git"))
                .isEqualTo("testRepo");
        assertThat(GitUtils.getRepoName("git@example.in:test/testRepo.git"))
                .isEqualTo("testRepo");
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
}
