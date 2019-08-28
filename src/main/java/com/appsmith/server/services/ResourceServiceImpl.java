package com.appsmith.server.services;

import com.appsmith.server.domains.Plugin;
import com.appsmith.server.domains.Resource;
import com.appsmith.server.domains.Tenant;
import com.appsmith.server.domains.TenantPlugin;
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

import javax.validation.constraints.NotNull;
import java.util.List;
import java.util.concurrent.atomic.AtomicReference;

@Slf4j
@Service
public class ResourceServiceImpl extends BaseService<ResourceRepository, Resource, String> implements ResourceService {

    @Value("${tenant.id}")
    private String tenantId;

    private final ResourceRepository repository;
    private final TenantService tenantService;
    private final PluginService pluginService;

    @Autowired
    public ResourceServiceImpl(Scheduler scheduler, MongoConverter mongoConverter, ReactiveMongoTemplate reactiveMongoTemplate, ResourceRepository repository, TenantService tenantService, PluginService pluginService) {
        super(scheduler, mongoConverter, reactiveMongoTemplate, repository);
        this.repository = repository;
        this.tenantService = tenantService;
        this.pluginService = pluginService;
    }

    @Override
    public Mono<Resource> create(@NotNull Resource resource) throws AppsmithException {
        if (resource.getId() != null) {
            throw new AppsmithException(AppsmithError.INVALID_PARAMETER, "id");
        }

        Mono<Tenant> tenantMono = tenantService.findById(tenantId);
        Mono<Plugin> pluginMono = pluginService.findByName(resource.getPlugin().getName());
        Mono<Resource> updatedResourceMono = Mono.zip(tenantMono, pluginMono, (tenant, plugin) -> {
            resource.setTenant(tenant);
            resource.setPlugin(plugin);
            return resource;
        });

        return updatedResourceMono
                .filter(updatedResource -> {
                    AtomicReference<Boolean> temp = new AtomicReference<>(false);
                    tenantMono.map(tenant -> {
                        List<TenantPlugin> tenantPlugins = tenant.getPlugins();
                        if (tenantPlugins == null || tenantPlugins.isEmpty()) {
                            temp.set(false);
                            return temp;
                        }
                        for (TenantPlugin tenantPlugin : tenantPlugins) {
                            if (tenantPlugin.getPlugin().getName().equals(resource.getPlugin().getName())) {
                                temp.set(true);
                                return temp;
                            }
                        }
                        temp.set(false);
                        return temp;
                    }).block();
                    return temp.get();
                })
                .flatMap(repository::save);
    }

    @Override
    public Mono<Resource> findByName(String name) {
        return repository.findByName(name);
    }
}
