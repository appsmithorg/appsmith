package com.appsmith.server.controllers;


import com.appsmith.server.constants.Url;
import com.appsmith.server.controllers.ce.EnvironmentControllerCE;
import com.appsmith.server.dtos.EnvironmentDTO;
import com.appsmith.server.dtos.ResponseDTO;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.featureflags.FeatureFlagEnum;
import com.appsmith.server.services.EnvironmentService;
import com.appsmith.server.services.FeatureFlagService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.PathVariable;
import reactor.core.publisher.Mono;

import java.util.List;
import javax.validation.Valid;

@RestController
@Slf4j
@RequestMapping(Url.ENVIRONMENT_URL)
public class EnvironmentController extends EnvironmentControllerCE {

    private final EnvironmentService environmentService;

    private final FeatureFlagService featureFlagService;

    @Autowired
    public EnvironmentController(EnvironmentService environmentService, FeatureFlagService featureFlagService) {
        super(environmentService);
        this.environmentService = environmentService;
        this.featureFlagService = featureFlagService;
    }

    @GetMapping("/{envId}")
    public Mono<ResponseDTO<EnvironmentDTO>> getEnvironmentById(@PathVariable String envId) {
        log.debug("Going to fetch environment from environment controller with environment id {}", envId);

        return featureFlagService.check(FeatureFlagEnum.DATASOURCE_ENVIRONMENTS)
                .flatMap(truth -> {
                    if (truth) {
                        return environmentService.findEnvironmentByEnvironmentId(envId);
                    }
                    return Mono.error(new AppsmithException(AppsmithError.UNAUTHORIZED_ACCESS));
                })
                .map(environmentDTO -> {
                    return new ResponseDTO<>(HttpStatus.OK.value(), environmentDTO, null);
                });
    }


    @GetMapping("/workspaces/{workspaceId}")
    public Mono<ResponseDTO<List<EnvironmentDTO>>> getEnvironmentByWorkspaceId(@PathVariable String workspaceId) {
        log.debug("Going to fetch environments from environment controller with workspace id {}", workspaceId);

        return featureFlagService.check(FeatureFlagEnum.DATASOURCE_ENVIRONMENTS)
                .flatMap(truth -> {
                    if (truth) {
                        return environmentService.findEnvironmentByWorkspaceId(workspaceId)
                                .collectList();
                    }
                    return Mono.error(new AppsmithException(AppsmithError.UNAUTHORIZED_ACCESS));
                })
                .map(environmentDTOList -> {
                    return new ResponseDTO<>(HttpStatus.OK.value(), environmentDTOList, null);
                });
    }

    @PostMapping("/update")
    public Mono<ResponseDTO<List<EnvironmentDTO>>> saveEnvironmentChanges(@RequestBody @Valid List<EnvironmentDTO> environmentDTOList) {

        return featureFlagService.check(FeatureFlagEnum.DATASOURCE_ENVIRONMENTS)
                .flatMap(truth -> {
                    if (truth) {
                        return environmentService.updateEnvironment(environmentDTOList)
                                .collectList();
                    }
                    return Mono.error(new AppsmithException(AppsmithError.UNAUTHORIZED_ACCESS));
                })
                .map(environmentDTOList1 -> {
                    return new ResponseDTO<>(HttpStatus.OK.value(), environmentDTOList1, null);
                });
    }
}
