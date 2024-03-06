package com.appsmith.server.controllers;

import com.appsmith.external.dtos.EnvironmentDTO;
import com.appsmith.server.constants.Url;
import com.appsmith.server.controllers.ce.EnvironmentControllerCE;
import com.appsmith.server.dtos.ResponseDTO;
import com.appsmith.server.services.EnvironmentService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import reactor.core.publisher.Mono;

import java.util.List;
import java.util.Map;

@RestController
@Slf4j
@RequestMapping(Url.ENVIRONMENT_URL)
public class EnvironmentController extends EnvironmentControllerCE {

    private final EnvironmentService environmentService;

    @Autowired
    public EnvironmentController(EnvironmentService environmentService) {
        super(environmentService);
        this.environmentService = environmentService;
    }

    @GetMapping("/{environmentId}")
    public Mono<ResponseDTO<EnvironmentDTO>> getEnvironmentById(@PathVariable String environmentId) {
        log.debug("Going to fetch environment from environment controller with environment id {}", environmentId);

        return environmentService
                .getEnvironmentDTOByEnvironmentId(environmentId)
                .map(environmentDTO -> {
                    return new ResponseDTO<>(HttpStatus.OK.value(), environmentDTO, null);
                });
    }

    @GetMapping("/workspaces/{workspaceId}")
    public Mono<ResponseDTO<List<EnvironmentDTO>>> getEnvironmentByWorkspaceId(
            @PathVariable String workspaceId,
            @RequestParam(required = false, defaultValue = "false") Boolean fetchDatasourceMeta) {
        log.debug("Going to fetch environments from environment controller with workspace id {}", workspaceId);

        return environmentService
                .getOrderedEnvironmentDTOsByWorkspaceId(workspaceId, fetchDatasourceMeta)
                .collectList()
                .map(environmentDTOList -> new ResponseDTO<>(HttpStatus.OK.value(), environmentDTOList, null));
    }

    @PutMapping("/default-environment")
    public Mono<ResponseDTO<EnvironmentDTO>> setDefaultEnvironment(
            @RequestBody Map<String, String> defaultEnvironmentDetails) {

        log.debug("Going to set default environment from environment controller");

        return environmentService
                .setEnvironmentToDefault(defaultEnvironmentDetails)
                .map(environmentDTOList -> {
                    return new ResponseDTO<>(HttpStatus.OK.value(), environmentDTOList, null);
                });
    }

    @PostMapping("")
    public Mono<ResponseDTO<EnvironmentDTO>> createCustomEnvironment(
            @RequestBody Map<String, String> customEnvironmentDetails) {

        log.debug("Going to create a custom environment from environment controller");

        return environmentService
                .createCustomEnvironment(customEnvironmentDetails)
                .map(environmentDTO -> new ResponseDTO<>(HttpStatus.CREATED.value(), environmentDTO, null));
    }

    @DeleteMapping("/{customEnvironmentId}")
    public Mono<ResponseDTO<EnvironmentDTO>> deleteCustomEnvironment(@PathVariable String customEnvironmentId) {

        log.debug("Going to delete a custom environment from environment controller");

        return environmentService
                .deleteCustomEnvironment(customEnvironmentId)
                .map(environmentDTO -> new ResponseDTO<>(HttpStatus.OK.value(), environmentDTO, null));
    }

    @PutMapping("/{customEnvironmentId}")
    public Mono<ResponseDTO<EnvironmentDTO>> updateCustomEnvironment(
            @PathVariable String customEnvironmentId, @RequestBody EnvironmentDTO environmentDTO) {

        log.debug("Going to update a custom environment from environment controller");

        return environmentService
                .updateCustomEnvironment(customEnvironmentId, environmentDTO)
                .map(resultenvironmentDTO -> new ResponseDTO<>(HttpStatus.OK.value(), resultenvironmentDTO, null));
    }
}
