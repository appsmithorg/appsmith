package com.appsmith.server.migrations;

import com.appsmith.external.enums.FeatureFlagEnum;
import com.appsmith.server.dtos.ApplicationJson;
import com.appsmith.server.dtos.ArtifactExchangeJson;
import com.appsmith.server.featureflags.CachedFeatures;
import com.appsmith.server.services.FeatureFlagService;
import com.appsmith.server.testhelpers.git.GitFileSystemTestHelper;
import lombok.extern.slf4j.Slf4j;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.mockito.stubbing.Answer;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import java.io.IOException;
import java.net.URISyntaxException;
import java.util.Map;

import static java.lang.Boolean.FALSE;
import static java.lang.Boolean.TRUE;
import static org.assertj.core.api.Assertions.assertThat;

@Slf4j
@SpringBootTest
public class JsonSchemaMigrationTest {

    @MockBean
    FeatureFlagService featureFlagService;

    @Autowired
    JsonSchemaMigration jsonSchemaMigration;

    @Autowired
    JsonSchemaVersions jsonSchemaVersions;

    @Autowired
    JsonSchemaVersionsFallback jsonSchemaVersionsFallback;

    @Autowired
    GitFileSystemTestHelper gitFileSystemTestHelper;

    @Test
    public void migrateArtifactToLatestSchema_whenFeatureFlagIsOff_returnsFallbackValue()
            throws URISyntaxException, IOException {
        CachedFeatures cachedFeatures = new CachedFeatures();
        cachedFeatures.setFeatures(Map.of(FeatureFlagEnum.release_git_autocommit_feature_enabled.name(), FALSE));

        Mockito.when(featureFlagService.getCachedTenantFeatureFlags())
                .thenAnswer((Answer<CachedFeatures>) invocations -> cachedFeatures);

        ApplicationJson applicationJson =
                gitFileSystemTestHelper.getApplicationJson(this.getClass().getResource("application.json"));

        ArtifactExchangeJson artifactExchangeJson = jsonSchemaMigration.migrateArtifactToLatestSchema(applicationJson);

        assertThat(artifactExchangeJson.getServerSchemaVersion())
                .isEqualTo(jsonSchemaVersionsFallback.getServerVersion());
        assertThat(artifactExchangeJson.getServerSchemaVersion()).isEqualTo(jsonSchemaVersions.getServerVersion());
        assertThat(artifactExchangeJson.getClientSchemaVersion()).isEqualTo(jsonSchemaVersions.getClientVersion());
        assertThat(artifactExchangeJson.getClientSchemaVersion())
                .isEqualTo(jsonSchemaVersionsFallback.getClientVersion());
    }

    @Test
    public void migrateArtifactToLatestSchema_whenFeatureFlagIsOn_returnsIncrementedValue()
            throws URISyntaxException, IOException {
        CachedFeatures cachedFeatures = new CachedFeatures();
        cachedFeatures.setFeatures(Map.of(FeatureFlagEnum.release_git_autocommit_feature_enabled.name(), TRUE));

        Mockito.when(featureFlagService.getCachedTenantFeatureFlags())
                .thenAnswer((Answer<CachedFeatures>) invocations -> cachedFeatures);

        ApplicationJson applicationJson =
                gitFileSystemTestHelper.getApplicationJson(this.getClass().getResource("application.json"));

        ArtifactExchangeJson artifactExchangeJson = jsonSchemaMigration.migrateArtifactToLatestSchema(applicationJson);
        assertThat(artifactExchangeJson.getServerSchemaVersion()).isEqualTo(jsonSchemaVersions.getServerVersion());
        assertThat(artifactExchangeJson.getClientSchemaVersion()).isEqualTo(jsonSchemaVersions.getClientVersion());
        assertThat(artifactExchangeJson.getClientSchemaVersion())
                .isEqualTo(jsonSchemaVersionsFallback.getClientVersion());
    }

    @Test
    public void migrateApplicationJsonToLatestSchema_whenFeatureFlagIsOn_returnsIncrementedValue()
            throws URISyntaxException, IOException {
        CachedFeatures cachedFeatures = new CachedFeatures();
        cachedFeatures.setFeatures(Map.of(FeatureFlagEnum.release_git_autocommit_feature_enabled.name(), TRUE));

        Mockito.when(featureFlagService.getCachedTenantFeatureFlags())
                .thenAnswer((Answer<CachedFeatures>) invocations -> cachedFeatures);

        ApplicationJson applicationJson =
                gitFileSystemTestHelper.getApplicationJson(this.getClass().getResource("application.json"));

        Mono<ApplicationJson> applicationJsonMono =
                jsonSchemaMigration.migrateApplicationJsonToLatestSchema(applicationJson, null, null);
        StepVerifier.create(applicationJsonMono)
                .assertNext(appJson -> {
                    assertThat(appJson.getServerSchemaVersion()).isEqualTo(jsonSchemaVersions.getServerVersion());
                    assertThat(appJson.getClientSchemaVersion()).isEqualTo(jsonSchemaVersions.getClientVersion());
                    assertThat(appJson.getClientSchemaVersion())
                            .isEqualTo(jsonSchemaVersionsFallback.getClientVersion());
                })
                .verifyComplete();
    }

    @Test
    public void migrateApplicationJsonToLatestSchema_whenFeatureFlagIsOff_returnsFallbackValue()
            throws URISyntaxException, IOException {
        CachedFeatures cachedFeatures = new CachedFeatures();
        cachedFeatures.setFeatures(Map.of(FeatureFlagEnum.release_git_autocommit_feature_enabled.name(), FALSE));

        Mockito.when(featureFlagService.getCachedTenantFeatureFlags())
                .thenAnswer((Answer<CachedFeatures>) invocations -> cachedFeatures);

        ApplicationJson applicationJson =
                gitFileSystemTestHelper.getApplicationJson(this.getClass().getResource("application.json"));

        Mono<ApplicationJson> applicationJsonMono =
                jsonSchemaMigration.migrateApplicationJsonToLatestSchema(applicationJson, null, null);
        StepVerifier.create(applicationJsonMono)
                .assertNext(appJson -> {
                    assertThat(appJson.getClientSchemaVersion()).isEqualTo(jsonSchemaVersions.getClientVersion());
                    assertThat(appJson.getClientSchemaVersion())
                            .isEqualTo(jsonSchemaVersionsFallback.getClientVersion());
                    assertThat(appJson.getServerSchemaVersion())
                            .isEqualTo(jsonSchemaVersionsFallback.getServerVersion());
                    assertThat(appJson.getServerSchemaVersion()).isEqualTo(jsonSchemaVersions.getServerVersion());
                })
                .verifyComplete();
    }
}
