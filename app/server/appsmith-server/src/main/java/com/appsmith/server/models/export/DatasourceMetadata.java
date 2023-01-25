package com.appsmith.server.models.export;

import lombok.Data;

@Data
public class DatasourceMetadata {
    private String name;
    private String pluginId;
    private String gitSyncId;
}
