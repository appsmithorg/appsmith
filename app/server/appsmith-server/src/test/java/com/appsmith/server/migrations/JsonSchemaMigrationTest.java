package com.appsmith.server.migrations;

import com.appsmith.external.git.constants.ce.RefType;
import com.appsmith.server.dtos.ApplicationJson;
import com.appsmith.server.dtos.ArtifactExchangeJson;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.migrations.utils.JsonSchemaMigrationHelper;
import com.appsmith.server.testhelpers.git.GitFileSystemTestHelper;
import lombok.extern.slf4j.Slf4j;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.bean.override.mockito.MockitoSpyBean;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import java.io.IOException;
import java.net.URISyntaxException;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doReturn;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;

@Slf4j
@SpringBootTest
public class JsonSchemaMigrationTest {

    private static final String BASE_APPLICATION_ID = "base-application-id";

    @Autowired
    JsonSchemaMigration jsonSchemaMigration;

    @Autowired
    JsonSchemaVersions jsonSchemaVersions;

    @Autowired
    JsonSchemaVersionsFallback jsonSchemaVersionsFallback;

    @Autowired
    GitFileSystemTestHelper gitFileSystemTestHelper;

    @MockitoSpyBean
    JsonSchemaMigrationHelper jsonSchemaMigrationHelper;

    @Test
    public void migrateArtifactToLatestSchema_whenFeatureFlagIsOn_returnsIncrementedValue()
            throws URISyntaxException, IOException {

        ApplicationJson applicationJson =
                gitFileSystemTestHelper.getApplicationJson(this.getClass().getResource("application.json"));

        ArtifactExchangeJson artifactExchangeJson = jsonSchemaMigration
                .migrateArtifactExchangeJsonToLatestSchema(applicationJson, null, null, null)
                .block();
        assertThat(artifactExchangeJson.getServerSchemaVersion()).isEqualTo(jsonSchemaVersions.getServerVersion());
        assertThat(artifactExchangeJson.getClientSchemaVersion()).isEqualTo(jsonSchemaVersions.getClientVersion());
        assertThat(artifactExchangeJson.getClientSchemaVersion())
                .isEqualTo(jsonSchemaVersionsFallback.getClientVersion());
    }

    @Test
    public void migrateApplicationJsonToLatestSchema_whenFeatureFlagIsOn_returnsIncrementedValue()
            throws URISyntaxException, IOException {

        ApplicationJson applicationJson =
                gitFileSystemTestHelper.getApplicationJson(this.getClass().getResource("application.json"));

        Mono<ApplicationJson> applicationJsonMono =
                jsonSchemaMigration.migrateApplicationJsonToLatestSchema(applicationJson, null, null, null);
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
    void migrateApplicationJsonToLatestSchema_fromServerVersionTwelve_rewritesActionReferencesOfBaseApplication() {
        ApplicationJson applicationJson = applicationJsonAtServerVersion(12);

        StepVerifier.create(jsonSchemaMigration.migrateApplicationJsonToLatestSchema(
                        applicationJson, BASE_APPLICATION_ID, "main", RefType.branch))
                .assertNext(migrated ->
                        assertThat(migrated.getServerSchemaVersion()).isEqualTo(jsonSchemaVersions.getServerVersion()))
                .verifyComplete();

        verify(jsonSchemaMigrationHelper).migrateActionReferencesToPortableForm(BASE_APPLICATION_ID, applicationJson);
    }

    @Test
    void migrateApplicationJsonToLatestSchema_whenActionReferenceRewriteFails_propagatesError() {
        ApplicationJson applicationJson = applicationJsonAtServerVersion(12);
        AppsmithException failure = new AppsmithException(AppsmithError.INTERNAL_SERVER_ERROR);
        doReturn(Mono.error(failure))
                .when(jsonSchemaMigrationHelper)
                .migrateActionReferencesToPortableForm(any(), any());

        StepVerifier.create(jsonSchemaMigration.migrateApplicationJsonToLatestSchema(
                        applicationJson, BASE_APPLICATION_ID, "main", RefType.branch))
                .expectErrorSatisfies(error -> assertThat(error).isSameAs(failure))
                .verify();
    }

    @Test
    void migrateApplicationJsonToLatestSchema_atCurrentServerVersion_skipsActionReferenceRewrite() {
        ApplicationJson applicationJson = applicationJsonAtServerVersion(jsonSchemaVersions.getServerVersion());

        StepVerifier.create(jsonSchemaMigration.migrateApplicationJsonToLatestSchema(
                        applicationJson, BASE_APPLICATION_ID, "main", RefType.branch))
                .expectNextCount(1)
                .verifyComplete();

        verify(jsonSchemaMigrationHelper, never()).migrateActionReferencesToPortableForm(any(), any());
    }

    private ApplicationJson applicationJsonAtServerVersion(int serverSchemaVersion) {
        ApplicationJson applicationJson = new ApplicationJson();
        applicationJson.setServerSchemaVersion(serverSchemaVersion);
        applicationJson.setClientSchemaVersion(jsonSchemaVersions.getClientVersion());
        return applicationJson;
    }
}
