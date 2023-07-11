package com.appsmith.server.services;

import com.appsmith.server.dtos.DisconnectProvisioningDto;
import reactor.core.publisher.Mono;

public interface ProvisionService {
    Mono<String> generateProvisionToken();

    Mono<Boolean> archiveProvisionToken();

    Mono<Boolean> disconnectProvisioning(DisconnectProvisioningDto disconnectProvisioningDto);
}
