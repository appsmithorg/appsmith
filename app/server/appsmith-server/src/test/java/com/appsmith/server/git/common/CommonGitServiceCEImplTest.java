package com.appsmith.server.git.common;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class CommonGitServiceCEImplTest {

    @Test
    void stripOriginPrefix_stripsOnlyLeadingOriginSegment() {
        assertThat(CommonGitServiceCEImpl.stripOriginPrefix("origin/main")).isEqualTo("main");
        assertThat(CommonGitServiceCEImpl.stripOriginPrefix("feature/origin/main"))
                .isEqualTo("feature/origin/main");
        assertThat(CommonGitServiceCEImpl.stripOriginPrefix("origin/feature/origin/main"))
                .isEqualTo("feature/origin/main");
        assertThat(CommonGitServiceCEImpl.stripOriginPrefix(null)).isEmpty();
    }
}
