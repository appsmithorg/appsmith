package com.appsmith.server.controllers;

import com.appsmith.server.constants.Url;
import com.appsmith.server.dtos.DisconnectProvisioningDto;
import com.appsmith.server.dtos.ProvisionStatusDTO;
import com.appsmith.server.dtos.ResponseDTO;
import com.appsmith.server.services.ProvisionService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import reactor.core.publisher.Mono;

@RestController
@RequestMapping(Url.PROVISION_URL)
@Slf4j
public class ProvisionController {
    private final ProvisionService provisionService;

    public ProvisionController(ProvisionService provisionService) {
        this.provisionService = provisionService;
    }

    @GetMapping("/status")
    Mono<ResponseDTO<ProvisionStatusDTO>> getProvisionStatus() {
        log.debug("Getting provisioning status");
        return provisionService
                .getProvisionStatus()
                .map(provisionStatusDTO -> new ResponseDTO<>(HttpStatus.OK.value(), provisionStatusDTO, null));
    }

    @PostMapping("/disconnect")
    public Mono<ResponseDTO<Boolean>> disconnectProvisioning(
            @RequestBody DisconnectProvisioningDto disconnectProvisioningDto) {
        log.debug("Disconnecting Provisioning.");
        return provisionService
                .disconnectProvisioning(disconnectProvisioningDto)
                .map(disconnected -> new ResponseDTO<>(HttpStatus.OK.value(), disconnected, null));
    }
}
