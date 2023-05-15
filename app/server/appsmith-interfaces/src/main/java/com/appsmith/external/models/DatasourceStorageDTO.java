package com.appsmith.external.models;

import lombok.Data;

import java.util.Set;

@Data
public class DatasourceStorageDTO {

    String id;
    String datasourceId;
    String environmentId;
    DatasourceConfiguration datasourceConfiguration;
    Set<String> invalids;
    Set<String> messages;

    public DatasourceStorageDTO(DatasourceStorage datasourceStorage) {
        this.id = datasourceStorage.getId();
        this.datasourceId = datasourceStorage.getDatasourceId();
        this.environmentId = datasourceStorage.getEnvironmentId();
        this.datasourceConfiguration = datasourceStorage.getDatasourceConfiguration();
        this.invalids = datasourceStorage.getInvalids();
        this.messages = datasourceStorage.getMessages() ;
    }

    public DatasourceStorageDTO(DatasourceDTO datasource, String environmentId) {
        this.id = datasource.getId();
        this.datasourceId = datasource.getId();
        this.environmentId = environmentId;
        this.datasourceConfiguration = datasource.getDatasourceConfiguration();
        this.invalids = datasource.getInvalids();
        this.messages = datasource.getMessages() ;
    }
}
