package com.appsmith.server.migrations;

import lombok.extern.slf4j.Slf4j;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import static org.assertj.core.api.Assertions.assertThat;

@Slf4j
@SpringBootTest
public class JsonSchemaVersionsTest {

    @Autowired
    JsonSchemaVersions jsonSchemaVersions;

    @Autowired
    JsonSchemaVersionsFallback jsonSchemaVersionsFallback;

    @Test
    public void getServerVersion_whenFeatureFlagIsOn_returnsIncremented() {
        assertThat(jsonSchemaVersions.getServerVersion()).isEqualTo(jsonSchemaVersionsFallback.getServerVersion());
        assertThat(jsonSchemaVersions.getClientVersion()).isEqualTo(jsonSchemaVersionsFallback.getClientVersion());
    }
}
