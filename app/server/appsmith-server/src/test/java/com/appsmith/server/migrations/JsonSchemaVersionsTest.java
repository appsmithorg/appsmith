package com.appsmith.server.migrations;

import com.appsmith.external.enums.FeatureFlagEnum;
import com.appsmith.server.featureflags.CachedFeatures;
import com.appsmith.server.services.FeatureFlagService;
import lombok.extern.slf4j.Slf4j;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.mockito.stubbing.Answer;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;

import java.util.Map;

import static java.lang.Boolean.FALSE;
import static java.lang.Boolean.TRUE;
import static org.assertj.core.api.Assertions.assertThat;

@Slf4j
@SpringBootTest
public class JsonSchemaVersionsTest {

    @MockBean
    FeatureFlagService featureFlagService;

    @Autowired
    JsonSchemaVersions jsonSchemaVersions;

    @Autowired
    JsonSchemaVersionsFallback jsonSchemaVersionsFallback;

    @Test
    public void getServerVersion_whenFeatureFlagIsOff_returnsFallbackValue() {
        CachedFeatures cachedFeatures = new CachedFeatures();
        cachedFeatures.setFeatures(Map.of(FeatureFlagEnum.release_git_autocommit_feature_enabled.name(), FALSE));

        Mockito.when(featureFlagService.getCachedTenantFeatureFlags())
                .thenAnswer((Answer<CachedFeatures>) invocations -> cachedFeatures);

        assertThat(jsonSchemaVersions.getServerVersion()).isEqualTo(jsonSchemaVersionsFallback.getServerVersion());
        assertThat(jsonSchemaVersions.getClientVersion()).isEqualTo(jsonSchemaVersionsFallback.getClientVersion());
    }

    @Test
    public void getServerVersion_whenFeatureFlagIsOn_returnsIncremented() {
        CachedFeatures cachedFeatures = new CachedFeatures();
        cachedFeatures.setFeatures(Map.of(FeatureFlagEnum.release_git_autocommit_feature_enabled.name(), TRUE));

        Mockito.when(featureFlagService.getCachedTenantFeatureFlags())
                .thenAnswer((Answer<CachedFeatures>) invocations -> cachedFeatures);

        assertThat(jsonSchemaVersions.getServerVersion()).isEqualTo(jsonSchemaVersionsFallback.getServerVersion());
        assertThat(jsonSchemaVersions.getClientVersion()).isEqualTo(jsonSchemaVersionsFallback.getClientVersion());
    }
}
