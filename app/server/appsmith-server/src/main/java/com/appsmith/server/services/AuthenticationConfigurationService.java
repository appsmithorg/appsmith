package com.appsmith.server.services;

import com.appsmith.server.dtos.AuthenticationConfigurationDTO;
import com.appsmith.server.dtos.EnvChangesResponseDTO;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

public interface AuthenticationConfigurationService {

    Mono<EnvChangesResponseDTO> configure(AuthenticationConfigurationDTO configuration, String origin);

}
