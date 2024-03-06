package com.appsmith.server.services;

import com.appsmith.server.dtos.DisconnectProvisioningDto;
import com.appsmith.server.services.ce_compatible.ProvisionServiceCECompatible;
import reactor.core.publisher.Mono;

public interface ProvisionService extends ProvisionServiceCECompatible {
    Mono<Boolean> disconnectProvisioningWithoutUserContext(DisconnectProvisioningDto disconnectProvisioningDto);
}
