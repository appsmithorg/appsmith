package com.appsmith.server.services;

import com.appsmith.server.domains.Resource;
import com.appsmith.server.domains.Tenant;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.repositories.ResourceRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
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

    @Value("${tenant.id}")
    private String tenantId;

    private final ResourceRepository repository;
    private final TenantService tenantService;
    private final PluginService pluginService;

    @Autowired
    public ResourceServiceImpl(Scheduler scheduler, Validator validator, MongoConverter mongoConverter, ReactiveMongoTemplate reactiveMongoTemplate, ResourceRepository repository, TenantService tenantService, PluginService pluginService) {
        super(scheduler, validator, mongoConverter, reactiveMongoTemplate, repository);
        this.repository = repository;
        this.tenantService = tenantService;
        this.pluginService = pluginService;
    }

    @Override
    public Mono<Resource> create(@NotNull Resource resource) {
        if (resource.getId() != null) {
            return Mono.error(new AppsmithException(AppsmithError.INVALID_PARAMETER, "id"));
        } else if (resource.getPluginId() == null) {
            return Mono.error(new AppsmithException(AppsmithError.PLUGIN_ID_NOT_GIVEN));
        }

        Mono<Tenant> tenantMono = tenantService.findByIdAndPluginsPluginId(tenantId, resource.getPluginId());

        //Add tenant id to the resource.
        Mono<Resource> updatedResourceMono = Mono.just(resource)
                .map(updatedResource -> {
                    updatedResource.setTenantId(tenantId);
                    return updatedResource;
                });

        return tenantMono
                .switchIfEmpty(Mono.error(new AppsmithException(AppsmithError.PLUGIN_NOT_INSTALLED, tenantId)))
                .then(updatedResourceMono)
                .flatMap(repository::save);
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
