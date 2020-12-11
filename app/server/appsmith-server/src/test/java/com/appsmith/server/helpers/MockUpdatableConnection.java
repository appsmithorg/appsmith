package com.appsmith.server.helpers;

import com.appsmith.external.models.DatasourceConfiguration;
import com.appsmith.external.models.OAuth2;
import com.appsmith.external.models.UpdatableConnection;

public class MockUpdatableConnection implements UpdatableConnection {
    @Override
    public void updateDatasource(DatasourceConfiguration datasourceConfiguration) {
        if (datasourceConfiguration.getAuthentication() instanceof OAuth2) {
            OAuth2 auth = (OAuth2) datasourceConfiguration.getAuthentication();
            auth.setClientId("mock-auth");
            datasourceConfiguration.setAuthentication(auth);
        }
    }

    @Override
    public boolean isUpdated() {
        return true;
    }
}
