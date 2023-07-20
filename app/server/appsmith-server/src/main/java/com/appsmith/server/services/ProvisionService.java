package com.appsmith.server.services;

import com.appsmith.server.dtos.DisconnectProvisioningDto;
import com.appsmith.server.dtos.ProvisionStatusDTO;
import reactor.core.publisher.Mono;

public interface ProvisionService {
    Mono<String> generateProvisionToken();

    Mono<ProvisionStatusDTO> getProvisionStatus();

    Mono<Boolean> archiveProvisionToken();

    Mono<Boolean> disconnectProvisioning(DisconnectProvisioningDto disconnectProvisioningDto);
}
