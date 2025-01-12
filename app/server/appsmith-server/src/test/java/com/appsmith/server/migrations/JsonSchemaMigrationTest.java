package com.appsmith.server.migrations;

import com.appsmith.server.dtos.ApplicationJson;
import com.appsmith.server.dtos.ArtifactExchangeJson;
import com.appsmith.server.testhelpers.git.GitFileSystemTestHelper;
import lombok.extern.slf4j.Slf4j;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import java.io.IOException;
import java.net.URISyntaxException;

import static org.assertj.core.api.Assertions.assertThat;

@Slf4j
@SpringBootTest
public class JsonSchemaMigrationTest {

    @Autowired
    JsonSchemaMigration jsonSchemaMigration;

    @Autowired
    JsonSchemaVersions jsonSchemaVersions;

    @Autowired
    JsonSchemaVersionsFallback jsonSchemaVersionsFallback;

    @Autowired
    GitFileSystemTestHelper gitFileSystemTestHelper;

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
}
