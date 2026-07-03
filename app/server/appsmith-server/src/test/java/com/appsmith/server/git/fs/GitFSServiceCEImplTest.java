package com.appsmith.server.git.fs;

import org.eclipse.jgit.api.errors.TransportException;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class GitFSServiceCEImplTest {

    @Test
    void isRemoteDefaultBranchMissing_returnsTrue_forJGitNoDefaultBranchMessage() {
        Throwable error = new TransportException("Remote branch 'HEAD' not found in upstream origin");
        assertThat(GitFSServiceCEImpl.isRemoteDefaultBranchMissing(error)).isTrue();
    }

    @Test
    void isRemoteDefaultBranchMissing_returnsTrue_whenMessageIsInCausalChain() {
        Throwable cause = new TransportException("Remote branch 'HEAD' not found in upstream origin");
        Throwable error = new RuntimeException("clone failed", cause);
        assertThat(GitFSServiceCEImpl.isRemoteDefaultBranchMissing(error)).isTrue();
    }

    @Test
    void isRemoteDefaultBranchMissing_returnsFalse_forAuthFailure() {
        Throwable error = new TransportException("Auth fail");
        assertThat(GitFSServiceCEImpl.isRemoteDefaultBranchMissing(error)).isFalse();
    }

    @Test
    void isRemoteDefaultBranchMissing_returnsFalse_forNullMessage() {
        Throwable error = new RuntimeException();
        assertThat(GitFSServiceCEImpl.isRemoteDefaultBranchMissing(error)).isFalse();
    }

    @Test
    void isRemoteDefaultBranchMissing_isCaseInsensitive() {
        Throwable error = new TransportException("Remote branch 'HEAD' NOT FOUND IN UPSTREAM origin");
        assertThat(GitFSServiceCEImpl.isRemoteDefaultBranchMissing(error)).isTrue();
    }

    @Test
    void isRemoteDefaultBranchMissing_returnsFalse_forOtherNotFoundMessage() {
        Throwable error = new TransportException("Repository not found");
        assertThat(GitFSServiceCEImpl.isRemoteDefaultBranchMissing(error)).isFalse();
    }

    @Test
    void isRemoteDefaultBranchMissing_returnsFalse_forMissingNamedBranch() {
        Throwable error = new TransportException("Remote branch 'feature-x' not found in upstream origin");
        assertThat(GitFSServiceCEImpl.isRemoteDefaultBranchMissing(error)).isFalse();
    }
}
