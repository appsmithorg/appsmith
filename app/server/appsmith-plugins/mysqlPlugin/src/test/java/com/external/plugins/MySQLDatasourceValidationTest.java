package com.external.plugins;

import com.appsmith.external.models.Connection;
import com.appsmith.external.models.DBAuth;
import com.appsmith.external.models.DatasourceConfiguration;
import com.appsmith.external.models.Endpoint;
import com.appsmith.external.models.Property;
import com.appsmith.external.models.SSHConnection;
import com.appsmith.external.models.SSHPrivateKey;
import com.appsmith.external.models.SSLDetails;
import com.appsmith.external.models.UploadedFile;
import org.junit.jupiter.api.Test;

import java.util.ArrayList;
import java.util.Set;

import static com.appsmith.external.exceptions.pluginExceptions.BasePluginErrorMessages.DS_INVALID_SSH_HOSTNAME_ERROR_MSG;
import static com.appsmith.external.exceptions.pluginExceptions.BasePluginErrorMessages.DS_MISSING_SSH_HOSTNAME_ERROR_MSG;
import static com.appsmith.external.exceptions.pluginExceptions.BasePluginErrorMessages.DS_MISSING_SSH_KEY_ERROR_MSG;
import static com.appsmith.external.exceptions.pluginExceptions.BasePluginErrorMessages.DS_MISSING_SSH_USERNAME_ERROR_MSG;
import static com.appsmith.external.models.Connection.Mode.READ_WRITE;
import static org.junit.jupiter.api.Assertions.assertTrue;

public class MySQLDatasourceValidationTest {
    static MySqlPlugin.MySqlPluginExecutor pluginExecutor = new MySqlPlugin.MySqlPluginExecutor();

    private DatasourceConfiguration getDatasourceConfigurationWithSSHConnectionMethod() {
        DatasourceConfiguration datasourceConfiguration = new DatasourceConfiguration();

        /* Set connection method toggle */
        ArrayList<Property> properties = new ArrayList<>();
        properties.add(null);
        properties.add(new Property("Connection method", "SSH"));
        datasourceConfiguration.setProperties(properties);

        /* Set connection mode */
        datasourceConfiguration.setConnection(new Connection());
        datasourceConfiguration.getConnection().setMode(READ_WRITE);

        /* Set MySQL endpoints */
        ArrayList<Endpoint> mysqlEndpoints = new ArrayList<>();
        mysqlEndpoints.add(new Endpoint("mysqlHost", 3306L));
        datasourceConfiguration.setEndpoints(mysqlEndpoints);

        /* Set SSH endpoints */
        ArrayList<Endpoint> sshEndpoints = new ArrayList<>();
        sshEndpoints.add(new Endpoint("sshHost", 22L));
        SSHConnection sshConnection = new SSHConnection();
        sshConnection.setEndpoints(sshEndpoints);

        /* Set SSH username and key */
        sshConnection.setUsername("sshUser");
        sshConnection.setPrivateKey(new SSHPrivateKey(new UploadedFile("key", "base64Key"), null));
        datasourceConfiguration.setSshProxy(sshConnection);

        /* Set DB username and password */
        datasourceConfiguration.setAuthentication(new DBAuth(null, "username", "password", "dbname"));

        /* Set ssl mode */
        datasourceConfiguration.getConnection().setSsl(new SSLDetails());
        datasourceConfiguration.getConnection().getSsl().setAuthType(SSLDetails.AuthType.DEFAULT);

        return datasourceConfiguration;
    }

    /* Test error message for empty SSH host */
    @Test
    public void testErrorMessageOnEmptySSHHost() {
        DatasourceConfiguration sshDatasourceConfiguration = getDatasourceConfigurationWithSSHConnectionMethod();
        sshDatasourceConfiguration.getSshProxy().setHost("");
        Set<String> validationErrors = pluginExecutor.validateDatasource(sshDatasourceConfiguration);
        assertTrue(validationErrors.size() > 0);
        assertTrue(validationErrors.contains(DS_MISSING_SSH_HOSTNAME_ERROR_MSG), validationErrors::toString);
    }

    /* Test error message for bad SSH host */
    @Test
    public void testErrorMessageOnBadSSHHost() {
        DatasourceConfiguration sshDatasourceConfiguration = getDatasourceConfigurationWithSSHConnectionMethod();
        sshDatasourceConfiguration.getSshProxy().setHost("hostname:port");
        Set<String> validationErrors = pluginExecutor.validateDatasource(sshDatasourceConfiguration);
        assertTrue(validationErrors.size() > 0);
        assertTrue(validationErrors.contains(DS_INVALID_SSH_HOSTNAME_ERROR_MSG), validationErrors::toString);
    }

    /* Test no error message for empty SSH port */
    @Test
    public void testErrorMessageOnEmptySSHPort() {
        DatasourceConfiguration sshDatasourceConfiguration = getDatasourceConfigurationWithSSHConnectionMethod();
        sshDatasourceConfiguration.getSshProxy().setPort(null);
        Set<String> validationErrors = pluginExecutor.validateDatasource(sshDatasourceConfiguration);
        assertTrue(validationErrors.isEmpty(), validationErrors::toString);
    }

    /* Test error message for empty SSH username */
    @Test
    public void testErrorMessageOnEmptySSHUsername() {
        DatasourceConfiguration sshDatasourceConfiguration = getDatasourceConfigurationWithSSHConnectionMethod();
        sshDatasourceConfiguration.getSshProxy().setUsername("");
        Set<String> validationErrors = pluginExecutor.validateDatasource(sshDatasourceConfiguration);
        assertTrue(validationErrors.size() > 0);
        assertTrue(validationErrors.contains(DS_MISSING_SSH_USERNAME_ERROR_MSG), validationErrors::toString);
    }

    /* Test error message for empty SSH key */
    @Test
    public void testErrorMessageOnEmptySSHKey() {
        DatasourceConfiguration sshDatasourceConfiguration = getDatasourceConfigurationWithSSHConnectionMethod();
        sshDatasourceConfiguration.getSshProxy().getPrivateKey().getKeyFile().setBase64Content("");
        Set<String> validationErrors = pluginExecutor.validateDatasource(sshDatasourceConfiguration);
        assertTrue(validationErrors.size() > 0);
        assertTrue(validationErrors.contains(DS_MISSING_SSH_KEY_ERROR_MSG), validationErrors::toString);
    }
}
