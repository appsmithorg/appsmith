package com.appsmith.server.services;

import com.appsmith.server.configurations.ClientUserRepository;
import com.appsmith.server.domains.Plugin;
import com.appsmith.server.domains.PluginType;
import com.appsmith.server.domains.Tenant;
import com.appsmith.server.domains.TenantPlugin;
import com.appsmith.server.dtos.PluginTenantDTO;
import com.appsmith.server.dtos.TenantPluginStatus;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.repositories.PluginRepository;
import com.appsmith.server.repositories.UserRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.ApplicationContext;
import org.springframework.data.mongodb.core.ReactiveMongoTemplate;
import org.springframework.data.mongodb.core.convert.MongoConverter;
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

    @Value("${tenant.id}")
    private String tenantId;

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
    public Mono<Plugin> create(Plugin plugin) throws AppsmithException {
        if (plugin.getId() != null) {
            throw new AppsmithException(AppsmithError.INVALID_PARAMETER, "id");
        }
        plugin.setDeleted(false);
        return pluginRepository.save(plugin);
    }

    @Override
    public Mono<Tenant> installPlugin(PluginTenantDTO pluginTenantDTO) {
        if (pluginTenantDTO.getPluginId() == null) {
            return Mono.error(new AppsmithException(AppsmithError.PLUGIN_ID_NOT_GIVEN));
        }

        return Mono.just(pluginTenantDTO)
                .flatMap(plugin -> storeTenantPlugin(plugin, pluginTenantDTO.getStatus()))
                .switchIfEmpty(Mono.empty());
    }

    @Override
    public Mono<Tenant> uninstallPlugin(PluginTenantDTO pluginDTO) {
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
        if (pluginDTO.getPluginId() == null) {
            return Mono.error(new AppsmithException(AppsmithError.PLUGIN_ID_NOT_GIVEN));
        }

        //Find the tenant using id and plugin id -> This is to find if the tenant has the plugin installed
        Mono<Tenant> tenantMono = tenantService.findByIdAndPluginsPluginId(tenantId, pluginDTO.getPluginId());

        return tenantMono
                .switchIfEmpty(Mono.error(new AppsmithException(AppsmithError.PLUGIN_NOT_INSTALLED, tenantId)))
                //In case the plugin is not found for the tenant, the tenantMono would not emit and the rest of the flow would stop
                //i.e. the rest of the code flow would only happen when there is a plugin found for the tenant that can
                //be uninstalled.
                .map(tenant -> {
                    List<TenantPlugin> tenantPluginList = tenant.getPlugins();
                    tenantPluginList.removeIf(listPlugin -> listPlugin.getPluginId().equals(pluginDTO.getPluginId()));
                    tenant.setPlugins(tenantPluginList);
                    return tenant;
                })
                .flatMap(tenantService::save);
    }

    private Mono<Tenant> storeTenantPlugin(PluginTenantDTO pluginDTO, TenantPluginStatus status) {
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
         * the installed plugin or to delete plugin during uninstalling.
         */

        //Find the tenant using id and plugin id -> This is to find if the tenant already has the plugin installed
        Mono<Tenant> tenantMono = tenantService.findByIdAndPluginsPluginId(tenantId, pluginDTO.getPluginId());

        return tenantMono
                .switchIfEmpty(Mono.defer(() -> {
                    //If the plugin is not found in the tenant, its not already installed. Install now.
                    return tenantService.findById(tenantId).map(tenant -> {
                        List<TenantPlugin> tenantPluginList = tenant.getPlugins();
                        if (tenantPluginList == null) {
                            tenantPluginList = new ArrayList<TenantPlugin>();
                        }
                        log.debug("Installing plugin {} for tenant {}", pluginDTO.getPluginId(), tenant.getName());
                        TenantPlugin tenantPlugin = new TenantPlugin();
                        tenantPlugin.setPluginId(pluginDTO.getPluginId());
                        tenantPlugin.setStatus(status);
                        tenantPluginList.add(tenantPlugin);
                        tenant.setPlugins(tenantPluginList);
                        return tenant;
                    }).flatMap(tenantService::save);
                }));
    }

    public Mono<Plugin> findByName(String name) {
        return repository.findByName(name);
    }

    @Override
    public Mono<Plugin> findById(String id) {
        return repository.findById(id);
    }
}
