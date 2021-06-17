package com.external.plugins;

import com.appsmith.external.models.DBAuth;
import com.appsmith.external.models.DatasourceConfiguration;
import com.appsmith.external.models.Property;
import lombok.extern.log4j.Log4j;
import org.junit.Test;

import java.util.List;
import java.util.Set;

import static org.junit.Assert.assertTrue;

@Log4j
public class SnowflakePluginTest {

    SnowflakePlugin.SnowflakePluginExecutor pluginExecutor = new SnowflakePlugin.SnowflakePluginExecutor();

    @Test
    public void testValidateDatasource_InvalidCredentials_returnsInvalids() {
        DatasourceConfiguration datasourceConfiguration = new DatasourceConfiguration();
        DBAuth auth = new DBAuth();
        auth.setUsername(null);
        auth.setPassword(null);
        datasourceConfiguration.setAuthentication(auth);
        datasourceConfiguration.setProperties(List.of(new Property(), new Property()));
        Set<String> output = pluginExecutor.validateDatasource(datasourceConfiguration);
        assertTrue(output.contains("Missing username for authentication."));
        assertTrue(output.contains("Missing password for authentication."));
        assertTrue(output.contains("Missing Snowflake URL."));
        assertTrue(output.contains("Missing warehouse name."));
        assertTrue(output.contains("Missing database name."));
    }

}
