package com.external.connections;

import org.junit.Test;

import java.time.Duration;

import static org.assertj.core.api.Assertions.assertThat;

public class OAuth2ConnectionTest {

    @Test
    public void testNullConnection() {
        APIConnection connection = OAuth2Connection.create(null).block(Duration.ofMillis(100));
        assertThat(connection).isNull();
    }

}
