package com.appsmith.server.services.ce_compatible;

import com.appsmith.external.dtos.EnvironmentDTO;
import com.appsmith.external.models.Environment;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.repositories.EnvironmentRepository;
import com.appsmith.server.services.AnalyticsService;
import com.appsmith.server.services.BaseService;
import com.appsmith.server.services.EnvironmentService;
import com.appsmith.server.services.EnvironmentServiceImpl;
import com.appsmith.server.services.WorkspaceService;
import jakarta.validation.Validator;
import org.springframework.context.annotation.Lazy;
import org.springframework.data.mongodb.core.ReactiveMongoTemplate;
import org.springframework.data.mongodb.core.convert.MongoConverter;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Scheduler;

import java.util.Map;

/**
 * This class designed to offer compatibility with custom extensions for the {@link EnvironmentServiceImpl} when the
 * corresponding feature flag is turned off. In essence, this class serves as a "free" version of the
 * {@link EnvironmentService} that provides essential functionality without the additional features available in the
 * full {@link EnvironmentServiceImpl}.
 *
 * <p>By utilizing this class, developers can switch to this simplified version of the environment service
 * when they choose to disable certain advanced features provided by the {@link EnvironmentServiceImpl}.
 * This approach allows for better management of feature toggling, providing greater control over which
 * functionalities are active at any given time, without affecting the core service logic.</p>
 *
 * <p>Furthermore, this design supports enhanced flexibility within the application's architecture. As the
 * development progresses, if the need arises to introduce sub-feature management, developers can extend
 * this class from a custom implementation. This enables the creation of a tailored user experience based on
 * the availability of feature flags. Sub-features can be enabled or disabled dynamically, allowing the
 * application to adapt and offer different functionalities to different user segments.</p>
 *
 * @see EnvironmentService
 * @see EnvironmentServiceImpl
 */
@Service
public class EnvironmentServiceCECompatibleImpl extends BaseService<EnvironmentRepository, Environment, String>
        implements EnvironmentServiceCECompatible {

    private final WorkspaceService workspaceService;

    public EnvironmentServiceCECompatibleImpl(
            Scheduler scheduler,
            Validator validator,
            MongoConverter mongoConverter,
            ReactiveMongoTemplate reactiveMongoTemplate,
            EnvironmentRepository repository,
            AnalyticsService analyticsService,
            @Lazy WorkspaceService workspaceService) {
        super(scheduler, validator, mongoConverter, reactiveMongoTemplate, repository, analyticsService);
        this.workspaceService = workspaceService;
    }

    @Override
    public Flux<EnvironmentDTO> getEnvironmentDTOByWorkspaceId(String workspaceId) {
        return workspaceService.getDefaultEnvironment(workspaceId).map(EnvironmentDTO::createEnvironmentDTO);
    }

    @Override
    public Mono<EnvironmentDTO> getEnvironmentDTOByEnvironmentId(String envId) {
        return Mono.error(new AppsmithException(AppsmithError.UNSUPPORTED_OPERATION));
    }

    @Override
    public Mono<EnvironmentDTO> setEnvironmentToDefault(Map<String, String> defaultEnvironmentMap) {
        return Mono.error(new AppsmithException(AppsmithError.UNSUPPORTED_OPERATION));
    }
}
