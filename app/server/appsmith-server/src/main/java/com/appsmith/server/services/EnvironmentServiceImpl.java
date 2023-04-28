package com.appsmith.server.services;

import com.appsmith.external.dtos.EnvironmentDTO;
import com.appsmith.external.models.Environment;
import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.featureflags.FeatureFlagEnum;
import com.appsmith.server.repositories.EnvironmentRepository;
import com.appsmith.server.services.ce.EnvironmentServiceCEImpl;
import jakarta.validation.Validator;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.mongodb.core.ReactiveMongoTemplate;
import org.springframework.data.mongodb.core.convert.MongoConverter;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Scheduler;

@Service
@Slf4j
public class EnvironmentServiceImpl extends EnvironmentServiceCEImpl implements EnvironmentService {

    private final EnvironmentRepository repository;
    private final FeatureFlagService featureFlagService;

    @Autowired
    public EnvironmentServiceImpl(Scheduler scheduler,
                                  Validator validator,
                                  MongoConverter mongoConverter,
                                  ReactiveMongoTemplate reactiveMongoTemplate,
                                  EnvironmentRepository repository,
                                  AnalyticsService analyticsService,
                                  FeatureFlagService featureFlagService){
        super(scheduler, validator, mongoConverter, reactiveMongoTemplate, repository, analyticsService);
        this.repository = repository;
        this.featureFlagService = featureFlagService;
    }

    @Override
    public Flux<Environment> findByWorkspaceId(String workspaceId, AclPermission aclPermission) {
        return repository.findByWorkspaceId(workspaceId, aclPermission);
    }

    @Override
    public Mono<Environment> findById(String id, AclPermission aclPermission) {
        return repository.findById(id, aclPermission);
    }

    @Override
    public Flux<Environment> findByWorkspaceIdWithoutPermission(String workspaceId) {
        return repository.findByWorkspaceId(workspaceId);
    }

    @Override
    public Mono<EnvironmentDTO> getEnvironmentDTOByEnvironmentId(String envId) {

        return featureFlagService.check(FeatureFlagEnum.DATASOURCE_ENVIRONMENTS)
                .flatMap(isFeatureFlag -> {
                    if (Boolean.FALSE.equals(isFeatureFlag)) {
                        return Mono.error(new AppsmithException(AppsmithError.UNAUTHORIZED_ACCESS));
                    }

                    // This method will be used only for executing environments
                    return findById(envId, AclPermission.EXECUTE_ENVIRONMENTS)
                            .flatMap(this::transformToEnvironmentDTO);
                });
    }

    @Override
    public Flux<EnvironmentDTO> getEnvironmentDTOByWorkspaceId(String workspaceId) {

        return featureFlagService.check(FeatureFlagEnum.DATASOURCE_ENVIRONMENTS)
                .flatMapMany(isFeatureFlag -> {
                    if (Boolean.FALSE.equals(isFeatureFlag)) {
                        return Flux.error(new AppsmithException(AppsmithError.UNAUTHORIZED_ACCESS));
                    }

                    // This method will be used only for executing environments
                    return findByWorkspaceId(workspaceId, AclPermission.EXECUTE_ENVIRONMENTS)
                            .flatMap(this::transformToEnvironmentDTO);
                });
    }

    private Mono<EnvironmentDTO> transformToEnvironmentDTO(Environment environment) {
        return Mono.just(environment).map(this::createEnvironmentDTO);
    }

    @Override
    public EnvironmentDTO createEnvironmentDTO(Environment environment) {
        EnvironmentDTO environmentDTO = new EnvironmentDTO();
        environmentDTO.setId(environment.getId());
        environmentDTO.setName(environment.getName());
        environmentDTO.setWorkspaceId(environment.getWorkspaceId());
        environmentDTO.setUserPermissions(environment.getUserPermissions());
        return environmentDTO;
    }

    @Override
    public Mono<Environment> save(Environment environment) {
        return repository.save(environment);
    }

}
