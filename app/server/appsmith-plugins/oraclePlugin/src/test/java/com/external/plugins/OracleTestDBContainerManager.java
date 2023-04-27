package com.external.plugins;

import com.appsmith.external.models.Connection;
import com.appsmith.external.models.DBAuth;
import com.appsmith.external.models.DatasourceConfiguration;
import com.appsmith.external.models.Endpoint;
import com.appsmith.external.models.SSLDetails;
import org.testcontainers.containers.OracleContainer;

import java.util.ArrayList;

public class OracleTestDBContainerManager {
    public static final String ORACLE_USERNAME = "testUser";
    public static final String ORACLE_PASSWORD = "testPassword";
    public static final String ORACLE_DB_NAME = "testDB";
    public static final String ORACLE_DOCKER_HUB_CONTAINER = "gvenzl/oracle-xe:21-slim-faststart";

    public static OracleContainer getOracleDBForTest() {
        return new OracleContainer(ORACLE_DOCKER_HUB_CONTAINER)
                .withDatabaseName(ORACLE_DB_NAME)
                .withUsername(ORACLE_USERNAME)
                .withPassword(ORACLE_PASSWORD);
    }

    public static DatasourceConfiguration getDefaultDatasourceConfig(OracleContainer oracleDB) {
        DatasourceConfiguration dsConfig = new DatasourceConfiguration();
        dsConfig.setAuthentication(new DBAuth());
        ((DBAuth)dsConfig.getAuthentication()).setUsername(OracleTestDBContainerManager.ORACLE_USERNAME);
        ((DBAuth)dsConfig.getAuthentication()).setPassword(OracleTestDBContainerManager.ORACLE_PASSWORD);
        ((DBAuth)dsConfig.getAuthentication()).setDatabaseName(OracleTestDBContainerManager.ORACLE_DB_NAME);

        dsConfig.setEndpoints(new ArrayList<>());
        String host = oracleDB == null ? "host" : oracleDB.getHost();
        long port = oracleDB == null ? 1521L : (long)oracleDB.getOraclePort();
        dsConfig.getEndpoints().add(new Endpoint(host, port));

        dsConfig.setConnection(new Connection());
        dsConfig.getConnection().setSsl(new SSLDetails());
        dsConfig.getConnection().getSsl().setAuthType(SSLDetails.AuthType.DISABLE);

        return dsConfig;
    }
}
