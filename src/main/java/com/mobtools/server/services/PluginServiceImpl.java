package com.mobtools.server.services;

import com.mobtools.server.configurations.ClientUserRepository;
import com.mobtools.server.domains.Plugin;
import com.mobtools.server.domains.PluginType;
import com.mobtools.server.domains.Tenant;
import com.mobtools.server.domains.TenantPlugin;
import com.mobtools.server.dtos.PluginTenantDTO;
import com.mobtools.server.dtos.TenantPluginStatus;
import com.mobtools.server.exceptions.MobtoolsException;
import com.mobtools.server.repositories.PluginRepository;
import com.mobtools.server.repositories.UserRepository;
import lombok.extern.slf4j.Slf4j;
import org.bson.types.ObjectId;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.ApplicationContext;
import org.springframework.data.mongodb.core.ReactiveMongoTemplate;
import org.springframework.data.mongodb.core.convert.MongoConverter;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.ReactiveSecurityContextHolder;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Scheduler;

import java.util.ArrayList;
import java.util.List;

@Slf4j
@Service
public class PluginServiceImpl extends BaseService<PluginRepository, Plugin, String> implements PluginService {

    private final PluginRepository pluginRepository;
    private final UserRepository userRepository;
    private final ApplicationContext applicationContext;
    private final ClientUserRepository clientUserRepository;
    private final TenantService tenantService;

    @Autowired
    public PluginServiceImpl(Scheduler scheduler,
                             MongoConverter mongoConverter,
                             ReactiveMongoTemplate reactiveMongoTemplate,
                             PluginRepository repository,
                             UserRepository userRepository,
                             ApplicationContext applicationContext,
                             ClientUserRepository clientUserRepository,
                             TenantService tenantService) {
        super(scheduler, mongoConverter, reactiveMongoTemplate, repository);
        this.userRepository = userRepository;
        this.applicationContext = applicationContext;
        pluginRepository = repository;
        this.clientUserRepository = clientUserRepository;
        this.tenantService = tenantService;
    }

    public PluginExecutor getPluginExecutor(PluginType pluginType, String className) {
        Class<?> clazz;
        try {
            clazz = Class.forName(className);
            return (PluginExecutor) applicationContext.getBean(clazz);
        } catch (ClassNotFoundException e) {
            log.error("Unable to find class {}. ", className, e);
        }
        return null;
    }

    @Override
    public Mono<Plugin> create(Plugin plugin) throws MobtoolsException {
        if (plugin.getId() != null) {
            throw new MobtoolsException("During create plugin, Id is not null. Can't create new plugin.");
        }
        plugin.setDeleted(false);
        return pluginRepository.save(plugin);
    }

    @Override
    public Mono<Tenant> installPlugin(PluginTenantDTO pluginTenantDTO) {
        return pluginRepository
                .findByName(pluginTenantDTO.getName())
                .flatMap(plugin1 -> storeTenantPlugin(plugin1, pluginTenantDTO.getStatus()))
                .switchIfEmpty(Mono.empty());
    }

    @Override
    public Mono<Tenant> uninstallPlugin(PluginTenantDTO plugin) {
        /*TODO
         * Tenant & user association is being mocked here by forcefully
         * only using a hardcoded tenant. This needs to be replaced by
         * a user-tenant association flow. The Tenant needs to be picked
         * up from a user object. This is being used in install/uninstall
         * plugin from a tenant flow. Instead, the current user should be read
         * using the following :
         * ReactiveSecurityContextHolder.getContext()
         *         .map(SecurityContext::getAuthentication)
         *         .map(Authentication::getPrincipal);
         * Once the user has been pulled using this, tenant should already
         * be stored as part of user and this tenant should be used to store
         * the installed plugin or to delete plugin during uninstallation.
         */
        Mono<Tenant> tenantMono = tenantService.findById("5d3e90a2dfec7c00047a81ea");

        return tenantMono
                .map(tenant -> {
                    List<TenantPlugin> tenantPluginList = tenant.getPlugins();
                    if (tenantPluginList == null || tenantPluginList.isEmpty()) {
                        return tenant;
                    }
                    for (TenantPlugin listPlugin : tenantPluginList) {
                        if (listPlugin.getPlugin().getName().equals(plugin.getName())) {
                            log.debug("Plugin {} found. Uninstalling now from Tenant {}.",
                                    plugin.getName(), tenant.getName());
                            tenantPluginList.remove(listPlugin);
                            tenant.setPlugins(tenantPluginList);
                            return tenant;
                        }
                    }
                    log.debug("Plugin {} not found. Can't uninstall a plugin which is not installed",
                            plugin.getName());
                    return tenant;
                })
                /* TODO
                 * Extra save is happening below in the edge case scenario of a plugin
                 * which needs to be removed from the installed list, didnt exist in this list
                 * to be begin with. Small optimization opportunity.
                 */
                .flatMap(tenantService::save);
    }

    private Mono<Tenant> storeTenantPlugin(Plugin plugin, TenantPluginStatus status) {
        /*TODO
         * Tenant & user association is being mocked here by forcefully
         * only using a hardcoded tenant. This needs to be replaced by
         * a user-tenant association flow. The Tenant needs to be picked
         * up from a user object. This is being used in install/uninstall
         * plugin from a tenant flow. Instead, the current user should be read
         * using the following :
         * ReactiveSecurityContextHolder.getContext()
         *         .map(SecurityContext::getAuthentication)
         *         .map(Authentication::getPrincipal);
         * Once the user has been pulled using this, tenant should already
         * be stored as part of user and this tenant should be used to store
         * the installed plugin or to delete plugin during uninstallation.
         */
        Mono<Tenant> tenantMono = tenantService.findById("5d3e90a2dfec7c00047a81ea");

        Mono<Object> userObjectMono = ReactiveSecurityContextHolder.getContext()
                .map(SecurityContext::getAuthentication)
                .map(Authentication::getPrincipal);

        return Mono.zip(tenantMono, userObjectMono, (tenant, user) -> {
            List<TenantPlugin> tenantPluginList = tenant.getPlugins();
            if (tenantPluginList == null) {
                tenantPluginList = new ArrayList<TenantPlugin>();
            }

            for (TenantPlugin listPlugin : tenantPluginList) {
                if (listPlugin.getPlugin().getName().equals(plugin.getName())) {
                    log.debug("Plugin {} is already installed for Tenant {}. Don't add again.",
                     plugin.getName(), tenant.getName());
                    return tenant;
                }
            }
            TenantPlugin tenantPlugin = new TenantPlugin();
            //Set an ID in the nested document so that installed plugins can be referred to uniquely using IDs
            ObjectId objectId = new ObjectId();
            tenantPlugin.setId(objectId.toString());
            tenantPlugin.setPlugin(plugin);
            tenantPlugin.setStatus(status);
            tenantPluginList.add(tenantPlugin);
            tenant.setPlugins(tenantPluginList);
            return tenant;
        }).flatMap(tenantService::save);
    }
}
