package com.appsmith.server;

import com.appsmith.external.models.FDatasource;
import com.appsmith.server.domains.FApplication;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

public class FClassTests {

    @Test
    public void testFielder() {
        assertThat(FApplication.gitApplicationMetadata.gitAuth.getPath()).isEqualTo("gitApplicationMetadata.gitAuth");
        assertThat(FDatasource.datasourceConfiguration.authentication.authenticationResponse.expiresAt.getPath())
                .isEqualTo("datasourceConfiguration.authentication.authenticationResponse.expiresAt");
    }
}
