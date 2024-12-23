package com.external.plugins.services;

import com.appsmith.external.helpers.restApiUtils.connections.APIConnection;
import com.appsmith.external.models.DatasourceConfiguration;
import com.appsmith.external.models.TriggerRequestDTO;
import com.appsmith.external.models.TriggerResultDTO;
import reactor.core.publisher.Mono;

public class TriggerServiceImpl extends TriggerServiceCEImpl {
    @Override
    public Mono<TriggerResultDTO> executeTrigger(
            APIConnection connection, DatasourceConfiguration datasourceConfiguration, TriggerRequestDTO request) {
        return super.executeTrigger(connection, datasourceConfiguration, request);
    }
}
