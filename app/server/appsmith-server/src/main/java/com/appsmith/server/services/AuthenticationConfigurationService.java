package com.appsmith.server.services;

import com.appsmith.server.dtos.AuthenticationConfigurationDTO;
import reactor.core.publisher.Mono;

public interface AuthenticationConfigurationService {

    Mono<Void> configure(AuthenticationConfigurationDTO configuration, String origin);
}
