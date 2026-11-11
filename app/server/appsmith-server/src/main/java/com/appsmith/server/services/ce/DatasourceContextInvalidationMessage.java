package com.appsmith.server.services.ce;

import com.appsmith.external.models.DatasourceStorage;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import org.springframework.util.StringUtils;

/**
 * Payload of a {@link DatasourceContextInvalidationChannel} message. Carries just what
 * {@code DatasourceContextService#deleteDatasourceContext} needs to find and destroy the cached connection:
 * the context key (datasource id and environment id) and the plugin that owns the connection.
 */
@JsonIgnoreProperties(ignoreUnknown = true)
public record DatasourceContextInvalidationMessage(String datasourceId, String environmentId, String pluginId) {

    public static DatasourceContextInvalidationMessage from(DatasourceStorage datasourceStorage) {
        return new DatasourceContextInvalidationMessage(
                datasourceStorage.getDatasourceId(),
                datasourceStorage.getEnvironmentId(),
                datasourceStorage.getPluginId());
    }

    public boolean hasAllIds() {
        return StringUtils.hasText(datasourceId) && StringUtils.hasText(environmentId) && StringUtils.hasText(pluginId);
    }

    public DatasourceStorage toDatasourceStorage() {
        DatasourceStorage datasourceStorage = new DatasourceStorage();
        datasourceStorage.setDatasourceId(datasourceId);
        datasourceStorage.setEnvironmentId(environmentId);
        datasourceStorage.setPluginId(pluginId);
        return datasourceStorage;
    }
}
