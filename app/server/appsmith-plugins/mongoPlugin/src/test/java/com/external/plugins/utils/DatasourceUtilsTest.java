package com.external.plugins.utils;

import com.appsmith.external.models.DBAuth;
import com.appsmith.external.models.DatasourceConfiguration;
import com.appsmith.external.models.Property;
import org.junit.jupiter.api.Test;

import java.util.List;

import static com.external.plugins.utils.DatasourceUtils.buildClientURI;
import static org.junit.jupiter.api.Assertions.assertEquals;

public class DatasourceUtilsTest {

    @Test
    public void testBuildClientURI_withoutDbInfoAndPortsAndParams() {

        final String testUri = "mongodb://user:pass@host";
        final String resultUri = "mongodb://user:newPass@host/?authsource=admin&minpoolsize=0";

        DatasourceConfiguration datasourceConfiguration = new DatasourceConfiguration();
        final DBAuth dbAuth = new DBAuth();
        dbAuth.setPassword("newPass");
        datasourceConfiguration.setAuthentication(dbAuth);
        datasourceConfiguration.setProperties(List.of(new Property("0", "Yes"), new Property("1", testUri)));
        final String clientURI = buildClientURI(datasourceConfiguration);
        assertEquals(resultUri, clientURI);
    }

    @Test
    public void testBuildClientURI_withoutUserInfoAndAuthSource() {

        final String testUri = "mongodb://host:port/db?param";
        final String resultUri = "mongodb://host:port/db?param&authsource=admin&minpoolsize=0";

        DatasourceConfiguration datasourceConfiguration = new DatasourceConfiguration();
        final DBAuth dbAuth = new DBAuth();
        datasourceConfiguration.setAuthentication(dbAuth);
        datasourceConfiguration.setProperties(List.of(new Property("0", "Yes"), new Property("1", testUri)));
        final String clientURI = buildClientURI(datasourceConfiguration);
        assertEquals(resultUri, clientURI);
    }

    @Test
    public void testBuildClientURI_withUserInfoAndAuthSource() {

        final String testUri = "mongodb://user:pass@host:port/db?param&authSource=notAdmin";
        final String resultUri = "mongodb://user:newPass@host:port/db?param&authSource=notAdmin&minpoolsize=0";

        DatasourceConfiguration datasourceConfiguration = new DatasourceConfiguration();
        final DBAuth dbAuth = new DBAuth();
        dbAuth.setPassword("newPass");
        datasourceConfiguration.setAuthentication(dbAuth);
        datasourceConfiguration.setProperties(List.of(new Property("0", "Yes"), new Property("1", testUri)));
        final String clientURI = buildClientURI(datasourceConfiguration);
        assertEquals(resultUri, clientURI);
    }

    @Test
    public void testBuildClientURI_withUpperCaseCharacters_CaseRemainsUnchanged() {

        final String testUri = "mongodb://user:pass@host:port/db?Param&authSource=notAdmin";
        final String resultUri = "mongodb://user:newPass@host:port/db?Param&authSource=notAdmin&minpoolsize=0";

        DatasourceConfiguration datasourceConfiguration = new DatasourceConfiguration();
        final DBAuth dbAuth = new DBAuth();
        dbAuth.setPassword("newPass");
        datasourceConfiguration.setAuthentication(dbAuth);
        datasourceConfiguration.setProperties(List.of(new Property("0", "Yes"), new Property("1", testUri)));
        final String clientURI = buildClientURI(datasourceConfiguration);
        assertEquals(resultUri, clientURI);
    }
}
