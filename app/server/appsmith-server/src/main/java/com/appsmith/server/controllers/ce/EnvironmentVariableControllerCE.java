package com.appsmith.server.controllers.ce;

import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.constants.Url;
import com.appsmith.server.domains.ApplicationMode;
import com.appsmith.server.domains.EnvironmentVariable;
import com.appsmith.server.dtos.ApplicationPagesDTO;
import com.appsmith.server.dtos.CRUDPageResourceDTO;
import com.appsmith.server.dtos.CRUDPageResponseDTO;
import com.appsmith.server.dtos.EnvironmentVariableDTO;
import com.appsmith.server.dtos.ResponseDTO;

import lombok.NonNull;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.server.ServerWebExchange;
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
