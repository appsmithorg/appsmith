package com.appsmith.server.solutions.ce;

import com.appsmith.external.models.TriggerRequestDTO;
import com.appsmith.external.models.TriggerResultDTO;
import reactor.core.publisher.Mono;


public interface DatasourceTriggerSolutionCE {

    Mono<TriggerResultDTO> trigger(String datasourceId, TriggerRequestDTO triggerRequestDTO);

}
