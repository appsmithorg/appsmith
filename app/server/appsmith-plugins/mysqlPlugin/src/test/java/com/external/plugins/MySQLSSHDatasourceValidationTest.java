package com.external.plugins;

import com.appsmith.external.models.DBAuth;
import com.appsmith.external.models.DatasourceConfiguration;
import com.appsmith.external.models.Endpoint;
import com.appsmith.external.models.Property;
import com.appsmith.external.models.SSHConnection;
import com.appsmith.external.models.SSHPrivateKey;
import com.appsmith.external.models.UploadedFile;
import lombok.extern.slf4j.Slf4j;
import org.junit.jupiter.api.Test;

import java.util.ArrayList;

@Slf4j
public class MySQLSSHDatasourceValidationTest {
    static MySqlPlugin.MySqlPluginExecutor pluginExecutor = new MySqlPlugin.MySqlPluginExecutor();

    private DatasourceConfiguration getDatasourceConfiguration() {
        DatasourceConfiguration datasourceConfiguration = new DatasourceConfiguration();
        ArrayList<Property> properties = new ArrayList<>();
        properties.add(null);
        properties.add(new Property("Connection method", "SSH"));
        datasourceConfiguration.setProperties(properties);
        ArrayList<Endpoint> mysqlEndpoints = new ArrayList<>();
        mysqlEndpoints.add(new Endpoint("mysqlHost", 3306L));
        datasourceConfiguration.setEndpoints(mysqlEndpoints);
        ArrayList<Endpoint> sshEndpoints = new ArrayList<>();
        sshEndpoints.add(new Endpoint("sshHost", 22L));
        SSHConnection sshConnection = new SSHConnection();
        sshConnection.setEndpoints(sshEndpoints);
        sshConnection.setUsername("sshUser");
        sshConnection.setPrivateKey(new SSHPrivateKey(new UploadedFile("key", "base64Key"), null));
        datasourceConfiguration.setSshProxy(sshConnection);
        datasourceConfiguration.setAuthentication(new DBAuth(null, "username", "password", "dbname"));
    }

    @Test
    public void testDatasourceWithSSHHostMissing() {}
}
