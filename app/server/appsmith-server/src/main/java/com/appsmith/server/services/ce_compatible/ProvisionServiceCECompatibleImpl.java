package com.appsmith.server.services.ce_compatible;

import com.appsmith.server.dtos.DisconnectProvisioningDto;
import com.appsmith.server.dtos.ProvisionStatusDTO;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;

@Service
public class ProvisionServiceCECompatibleImpl implements ProvisionServiceCECompatible {
    @Override
    public Mono<String> generateProvisionToken() {
        return Mono.error(new AppsmithException(AppsmithError.UNSUPPORTED_OPERATION));
    }

    @Override
    public Mono<ProvisionStatusDTO> getProvisionStatus() {
        return Mono.error(new AppsmithException(AppsmithError.UNSUPPORTED_OPERATION));
    }

    @Override
    public Mono<Boolean> archiveProvisionToken() {
        return Mono.error(new AppsmithException(AppsmithError.UNSUPPORTED_OPERATION));
    }

    @Override
    public Mono<Boolean> disconnectProvisioning(DisconnectProvisioningDto disconnectProvisioningDto) {
        return Mono.error(new AppsmithException(AppsmithError.UNSUPPORTED_OPERATION));
    }
}
