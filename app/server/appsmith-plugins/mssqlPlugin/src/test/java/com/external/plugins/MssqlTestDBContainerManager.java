package com.external.plugins;

import com.appsmith.external.models.DBAuth;
import com.appsmith.external.models.DatasourceConfiguration;
import com.appsmith.external.models.Endpoint;
import com.appsmith.external.models.SSLDetails;
import com.external.plugins.utils.MssqlDatasourceUtils;
import com.zaxxer.hikari.HikariDataSource;
import org.testcontainers.containers.MSSQLServerContainer;
import org.testcontainers.utility.DockerImageName;

import java.sql.SQLException;
import java.sql.Statement;
import java.util.List;

import static com.appsmith.external.constants.PluginConstants.PluginName.MSSQL_PLUGIN_NAME;
import static com.external.plugins.utils.MssqlExecuteUtils.closeConnectionPostExecution;

public class MssqlTestDBContainerManager {

    static MssqlPlugin.MssqlPluginExecutor mssqlPluginExecutor = new MssqlPlugin.MssqlPluginExecutor();

    public static MssqlDatasourceUtils mssqlDatasourceUtils = new MssqlDatasourceUtils();

    @SuppressWarnings("rawtypes")
    public static MSSQLServerContainer getMssqlDBForTest() {
        return new MSSQLServerContainer<>(DockerImageName.parse("mcr.microsoft.com/azure-sql-edge:1.0.7")
                        .asCompatibleSubstituteFor("mcr.microsoft.com/mssql/server:2017-latest"))
                .acceptLicense()
                .withExposedPorts(1433)
                .withPassword("Mssql12;3");
    }

    static DatasourceConfiguration createDatasourceConfiguration(MSSQLServerContainer container) {
        String address = container.getHost();
        Integer port = container.getMappedPort(1433);
        String username = container.getUsername();
        String password = container.getPassword();

        DBAuth authDTO = new DBAuth();
        authDTO.setAuthType(DBAuth.Type.USERNAME_PASSWORD);
        authDTO.setUsername(username);
        authDTO.setPassword(password);

        Endpoint endpoint = new Endpoint();
        endpoint.setHost(address);
        endpoint.setPort(port.longValue());

        DatasourceConfiguration dsConfig = new DatasourceConfiguration();
        dsConfig.setAuthentication(authDTO);
        dsConfig.setEndpoints(List.of(endpoint));

        /* set ssl mode */
        dsConfig.setConnection(new com.appsmith.external.models.Connection());
        dsConfig.getConnection().setSsl(new SSLDetails());
        dsConfig.getConnection().getSsl().setAuthType(SSLDetails.AuthType.NO_VERIFY);

        return dsConfig;
    }

    static void runSQLQueryOnMssqlTestDB(String sqlQuery, HikariDataSource sharedConnectionPool) throws SQLException {
        java.sql.Connection connectionFromPool =
                mssqlDatasourceUtils.getConnectionFromHikariConnectionPool(sharedConnectionPool, MSSQL_PLUGIN_NAME);
        Statement statement = connectionFromPool.createStatement();
        statement.execute(sqlQuery);
        closeConnectionPostExecution(null, statement, null, connectionFromPool);
    }
}
