package com.appsmith.external.models;

public interface UpdatableConnection {
    void updateDatasource(DatasourceConfiguration datasourceConfiguration);

    default boolean isUpdated() {
        return false;
    }
}
