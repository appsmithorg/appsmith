package com.external.plugins;

import com.appsmith.external.models.DBAuth;
import com.appsmith.external.models.DatasourceConfiguration;
import org.junit.jupiter.api.Test;

import java.util.ArrayList;
import java.util.Set;

import static com.external.plugins.OracleTestDBContainerManager.getDefaultDatasourceConfig;
import static com.external.plugins.exceptions.OracleErrorMessages.DS_MISSING_ENDPOINT_ERROR_MSG;
import static com.external.plugins.exceptions.OracleErrorMessages.DS_MISSING_HOSTNAME_ERROR_MSG;
import static com.external.plugins.exceptions.OracleErrorMessages.DS_MISSING_PASSWORD_ERROR_MSG;
import static com.external.plugins.exceptions.OracleErrorMessages.DS_MISSING_USERNAME_ERROR_MSG;
import static org.junit.jupiter.api.Assertions.assertTrue;

public class OraclePluginDatasourceValidityErrorsTest {

    OraclePlugin.OraclePluginExecutor oraclePluginExecutor = new OraclePlugin.OraclePluginExecutor();

    @Test
    public void testErrorOnMissingUsername() {
        DatasourceConfiguration dsConfigWithMissingUsername = getDefaultDatasourceConfig(null);
        ((DBAuth) dsConfigWithMissingUsername.getAuthentication()).setUsername("");

        Set<String> dsValidateResult = oraclePluginExecutor.validateDatasource(dsConfigWithMissingUsername);
        boolean isExpectedErrorReceived = dsValidateResult.stream()
                .anyMatch(errorString -> DS_MISSING_USERNAME_ERROR_MSG.equals(errorString.trim()));
        assertTrue(isExpectedErrorReceived);
    }

    @Test
    public void testErrorOnMissingPassword() {
        DatasourceConfiguration dsConfigWithMissingPassword = getDefaultDatasourceConfig(null);
        ((DBAuth) dsConfigWithMissingPassword.getAuthentication()).setPassword("");

        Set<String> dsValidateResult = oraclePluginExecutor.validateDatasource(dsConfigWithMissingPassword);
        boolean isExpectedErrorReceived = dsValidateResult.stream()
                .anyMatch(errorString -> DS_MISSING_PASSWORD_ERROR_MSG.equals(errorString.trim()));
        assertTrue(isExpectedErrorReceived);
    }

    @Test
    public void testErrorOnMissingEndpoint() {
        DatasourceConfiguration dsConfigWithMissingEndpoint = getDefaultDatasourceConfig(null);
        dsConfigWithMissingEndpoint.setEndpoints(new ArrayList<>());

        Set<String> dsValidateResult = oraclePluginExecutor.validateDatasource(dsConfigWithMissingEndpoint);
        boolean isExpectedErrorReceived = dsValidateResult.stream()
                .anyMatch(errorString -> DS_MISSING_ENDPOINT_ERROR_MSG.equals(errorString.trim()));
        assertTrue(isExpectedErrorReceived);
    }

    @Test
    public void testErrorOnMissingHost() {
        DatasourceConfiguration dsConfigWithMissingHost = getDefaultDatasourceConfig(null);
        dsConfigWithMissingHost.getEndpoints().get(0).setHost("");

        Set<String> dsValidateResult = oraclePluginExecutor.validateDatasource(dsConfigWithMissingHost);
        boolean isExpectedErrorReceived = dsValidateResult.stream()
                .anyMatch(errorString -> DS_MISSING_HOSTNAME_ERROR_MSG.equals(errorString.trim()));
        assertTrue(isExpectedErrorReceived);
    }
}
