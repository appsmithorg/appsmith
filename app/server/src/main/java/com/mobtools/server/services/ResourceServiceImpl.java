package com.mobtools.server.services;

import com.mobtools.server.domains.Plugin;
import com.mobtools.server.domains.Resource;
import com.mobtools.server.domains.Tenant;
import com.mobtools.server.domains.TenantPlugin;
import com.mobtools.server.exceptions.MobtoolsException;
import com.mobtools.server.repositories.ResourceRepository;
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
    public Mono<Resource> create(@NotNull Resource resource) throws MobtoolsException {
        if (resource.getId() != null) {
            throw new MobtoolsException("During create resource, Id is not null. Can't create new resource.");
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
}
