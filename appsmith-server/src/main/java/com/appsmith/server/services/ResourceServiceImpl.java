package com.appsmith.server.services;

import com.appsmith.server.domains.Organization;
import com.appsmith.server.domains.Resource;
import com.appsmith.server.domains.User;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.repositories.ResourceRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.mongodb.core.ReactiveMongoTemplate;
import org.springframework.data.mongodb.core.convert.MongoConverter;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Scheduler;

import javax.validation.Validator;
import javax.validation.constraints.NotNull;

@Slf4j
@Service
public class ResourceServiceImpl extends BaseService<ResourceRepository, Resource, String> implements ResourceService {

    private final ResourceRepository repository;
    private final OrganizationService organizationService;
    private final SessionUserService sessionUserService;

    @Autowired
    public ResourceServiceImpl(Scheduler scheduler,
                               Validator validator,
                               MongoConverter mongoConverter,
                               ReactiveMongoTemplate reactiveMongoTemplate,
                               ResourceRepository repository,
                               OrganizationService organizationService,
                               AnalyticsService analyticsService,
                               SessionUserService sessionUserService) {
        super(scheduler, validator, mongoConverter, reactiveMongoTemplate, repository, analyticsService);
        this.repository = repository;
        this.organizationService = organizationService;
        this.sessionUserService = sessionUserService;
    }

    @Override
    public Mono<Resource> create(@NotNull Resource resource) {
        if (resource.getId() != null) {
            return Mono.error(new AppsmithException(AppsmithError.INVALID_PARAMETER, "id"));
        } else if (resource.getPluginId() == null) {
            return Mono.error(new AppsmithException(AppsmithError.PLUGIN_ID_NOT_GIVEN));
        }

        Mono<User> userMono = sessionUserService.getCurrentUser();

        Mono<Organization> organizationMono = userMono.flatMap(user -> organizationService.findByIdAndPluginsPluginId(user.getOrganizationId(), resource.getPluginId()));

        //Add organization id to the resource.
        Mono<Resource> updatedResourceMono = organizationMono
                .map(organization -> {
                    resource.setOrganizationId(organization.getId());
                    return resource;
                });

        return organizationMono
                .switchIfEmpty(Mono.error(new AppsmithException(AppsmithError.PLUGIN_NOT_INSTALLED, resource.getPluginId())))
                .then(updatedResourceMono)
                .flatMap(super::create);
    }

    @Override
    public Mono<Resource> findByName(String name) {
        return repository.findByName(name);
    }

    @Override
    public Mono<Resource> findById(String id) {
        return repository.findById(id);
    }
}
