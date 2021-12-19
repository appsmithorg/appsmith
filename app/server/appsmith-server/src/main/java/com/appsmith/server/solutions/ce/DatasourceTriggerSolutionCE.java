package com.appsmith.server.solutions.ce;

import com.appsmith.external.models.TriggerResultDTO;
import org.springframework.util.MultiValueMap;
import reactor.core.publisher.Mono;


public interface DatasourceTriggerSolutionCE {

    Mono<TriggerResultDTO> trigger(String datasourceId, MultiValueMap<String, Object> params);

}
