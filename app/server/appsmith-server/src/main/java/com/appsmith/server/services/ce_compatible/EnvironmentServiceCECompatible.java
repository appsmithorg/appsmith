package com.appsmith.server.services.ce_compatible;

import com.appsmith.external.dtos.EnvironmentDTO;
import com.appsmith.external.models.Environment;
import com.appsmith.server.services.CrudService;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.Map;

public interface EnvironmentServiceCECompatible extends CrudService<Environment, String> {

    Mono<EnvironmentDTO> getEnvironmentDTOByEnvironmentId(String envId);

    Flux<EnvironmentDTO> getEnvironmentDTOByWorkspaceId(String workspaceId);

    Mono<EnvironmentDTO> setEnvironmentToDefault(Map<String, String> defaultEnvironmentMap);
}
