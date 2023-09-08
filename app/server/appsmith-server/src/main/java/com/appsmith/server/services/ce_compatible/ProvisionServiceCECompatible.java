package com.appsmith.server.services.ce_compatible;

import com.appsmith.server.dtos.DisconnectProvisioningDto;
import com.appsmith.server.dtos.ProvisionStatusDTO;
import reactor.core.publisher.Mono;

public interface ProvisionServiceCECompatible {
    Mono<String> generateProvisionToken();

    Mono<ProvisionStatusDTO> getProvisionStatus();

    Mono<Boolean> archiveProvisionToken();

    Mono<Boolean> disconnectProvisioning(DisconnectProvisioningDto disconnectProvisioningDto);
}
