package com.external.plugins.services;

import com.appsmith.external.helpers.restApiUtils.connections.APIConnection;
import com.appsmith.external.models.DatasourceConfiguration;
import com.appsmith.external.models.TriggerRequestDTO;
import com.appsmith.external.models.TriggerResultDTO;
import com.fasterxml.jackson.databind.ObjectMapper;
import reactor.core.publisher.Mono;

public class TriggerServiceImpl extends TriggerServiceCEImpl {

    public TriggerServiceImpl(AiServerService aiServerService, ObjectMapper objectMapper) {
        super(aiServerService, objectMapper);
    }

    @Override
    public Mono<TriggerResultDTO> executeTrigger(
            APIConnection connection, DatasourceConfiguration datasourceConfiguration, TriggerRequestDTO request) {
        return super.executeTrigger(connection, datasourceConfiguration, request);
    }
}
