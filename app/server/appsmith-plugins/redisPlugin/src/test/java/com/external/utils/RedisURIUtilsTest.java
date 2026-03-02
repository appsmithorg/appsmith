package com.external.utils;

import com.appsmith.external.models.DBAuth;
import com.appsmith.external.models.DatasourceConfiguration;
import com.appsmith.external.models.Endpoint;
import org.junit.jupiter.api.Test;

import java.net.URI;
import java.net.URISyntaxException;
import java.util.Collections;

import static org.junit.jupiter.api.Assertions.assertEquals;

public class RedisURIUtilsTest {

    private DatasourceConfiguration createDatasourceConfiguration() {
        Endpoint endpoint = new Endpoint();
        endpoint.setHost("localhost");
        endpoint.setPort(6379L);

        DBAuth auth = new DBAuth();
        auth.setUsername("user");
        auth.setPassword("password");
        auth.setDatabaseName("2");

        DatasourceConfiguration datasourceConfiguration = new DatasourceConfiguration();
        datasourceConfiguration.setEndpoints(Collections.singletonList(endpoint));
        datasourceConfiguration.setAuthentication(auth);

        return datasourceConfiguration;
    }

    @Test
    public void itShouldBuildRedisUriWhenTlsDisabled() throws URISyntaxException {
        URI uri = RedisURIUtils.getURI(createDatasourceConfiguration(), false);

        assertEquals("redis://user:password@localhost:6379/2", uri.toString());
    }

    @Test
    public void itShouldBuildRedissUriWhenTlsEnabled() throws URISyntaxException {
        URI uri = RedisURIUtils.getURI(createDatasourceConfiguration(), true);

        assertEquals("rediss://user:password@localhost:6379/2", uri.toString());
    }
}
