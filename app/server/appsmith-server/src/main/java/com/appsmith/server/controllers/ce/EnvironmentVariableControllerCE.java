package com.appsmith.server.controllers.ce;

import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.constants.Url;
import com.appsmith.server.dtos.EnvironmentVariableDTO;
import com.appsmith.server.dtos.ResponseDTO;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;

import reactor.core.publisher.Mono;

import com.appsmith.server.services.EnvironmentVariableService;

@Slf4j
@RequestMapping(Url.BASE_URL+Url.VERSION+"/environment-variable") // will be added to the url post discussion
public class EnvironmentVariableControllerCE {

    private EnvironmentVariableService environmentVariableService;

    @Autowired
    public EnvironmentVariableControllerCE(EnvironmentVariableService environmentVariableService) {
        this.environmentVariableService = environmentVariableService;
    }

    @GetMapping("/{envVarId}")
    public Mono<ResponseDTO<EnvironmentVariableDTO>> getEnvVarById(@PathVariable String envVarId) {
        return  environmentVariableService.findById(envVarId,  AclPermission.MANAGE_ENVIRONMENT_VARIABLE)
                .map(envVar -> new ResponseDTO<>(HttpStatus.OK.value(), EnvironmentVariableDTO.createDTOFromEnvironmentVariable(envVar), null ) );
    }

}
