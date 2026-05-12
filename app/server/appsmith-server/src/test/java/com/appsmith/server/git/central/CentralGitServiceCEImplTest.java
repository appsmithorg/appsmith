package com.appsmith.server.git.central;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class CentralGitServiceCEImplTest {

    @Test
    void stripOriginPrefix_stripsOnlyLeadingOriginSegment() {
        assertThat(CentralGitServiceCEImpl.stripOriginPrefix("origin/main")).isEqualTo("main");
        assertThat(CentralGitServiceCEImpl.stripOriginPrefix("feature/origin/main"))
                .isEqualTo("feature/origin/main");
        assertThat(CentralGitServiceCEImpl.stripOriginPrefix("origin/feature/origin/main"))
                .isEqualTo("feature/origin/main");
        assertThat(CentralGitServiceCEImpl.stripOriginPrefix(null)).isEmpty();
    }
}
