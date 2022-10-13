package com.appsmith.server.controllers.ce;

import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.constants.Url;
import com.appsmith.server.dtos.EnvironmentVariableDTO;
import com.appsmith.server.domains.EnvironmentVariable;
import com.appsmith.server.dtos.ResponseDTO;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;

import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.List;

import com.appsmith.server.services.EnvironmentVariableService;

@Slf4j
@RequestMapping(Url.ENVIRONMENT_VARIABLE_URL) // will be added to the url post discussion
public class EnvironmentVariableControllerCE {

    private final EnvironmentVariableService environmentVariableService;

    @Autowired
    public EnvironmentVariableControllerCE(EnvironmentVariableService environmentVariableService) {
        this.environmentVariableService = environmentVariableService;
    }

    @GetMapping("/{envVarId}")
    public Mono<ResponseDTO<EnvironmentVariableDTO>> getEnvVarById(@PathVariable String envVarId) {
        return environmentVariableService.findById(envVarId, AclPermission.MANAGE_ENVIRONMENT_VARIABLES)
                .map(envVar -> new ResponseDTO<>(HttpStatus.OK.value(), EnvironmentVariableDTO.createDTOFromEnvironmentVariable(envVar), null));
    }

    @GetMapping("/workspace/{workspaceId}")
    public Mono<ResponseDTO<List<EnvironmentVariable>>> getEnvVarByWorkspaceId(@PathVariable String workspaceId) {
        return environmentVariableService.findEnvironmentVariableByWorkspaceId(workspaceId, AclPermission.READ_ENVIRONMENT_VARIABLES)
                .collectList()
                .map(envVarList -> new ResponseDTO(HttpStatus.OK.value(), envVarList, null));
    }

}
