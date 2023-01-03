package com.appsmith.server.controllers;

import com.appsmith.server.constants.Url;
import com.appsmith.server.controllers.ce.InstanceAdminControllerCE;
import com.appsmith.server.dtos.AuthenticationConfigurationDTO;
import com.appsmith.server.dtos.EnvChangesResponseDTO;
import com.appsmith.server.dtos.ResponseDTO;
import com.appsmith.server.services.SamlConfigurationService;
import com.appsmith.server.solutions.EnvManager;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

@RestController
@RequestMapping(Url.INSTANCE_ADMIN_URL)
@Slf4j
public class InstanceAdminController extends InstanceAdminControllerCE {

    private final SamlConfigurationService samlConfigurationService;

    public InstanceAdminController(EnvManager envManager,
                                   SamlConfigurationService samlConfigurationService) {
        super(envManager);
        this.samlConfigurationService = samlConfigurationService;
    }

    @PutMapping("/sso/saml")
    public Mono<ResponseDTO<EnvChangesResponseDTO>> configureSaml(
            @RequestBody AuthenticationConfigurationDTO config,
            @RequestHeader(name = "Origin") String origin
        )
    {
        log.debug("Configuring SAML SSO {}", config);
        return samlConfigurationService.configure(config, origin)
                .map(res -> new ResponseDTO<>(HttpStatus.OK.value(), res, null));
    }

}
