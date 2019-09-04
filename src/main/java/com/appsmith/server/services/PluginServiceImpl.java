package com.appsmith.server.services;

import com.appsmith.server.configurations.ClientUserRepository;
import com.appsmith.server.domains.Organization;
import com.appsmith.server.domains.OrganizationPlugin;
import com.appsmith.server.domains.Plugin;
import com.appsmith.server.domains.PluginType;
import com.appsmith.server.dtos.OrganizationPluginStatus;
import com.appsmith.server.dtos.PluginOrgDTO;
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

import javax.validation.Validator;
import java.util.ArrayList;
import java.util.List;

@Slf4j
@Service
public class PluginServiceImpl extends BaseService<PluginRepository, Plugin, String> implements PluginService {

    private final PluginRepository pluginRepository;
    private final UserRepository userRepository;
    private final ApplicationContext applicationContext;
    private final ClientUserRepository clientUserRepository;
    private final OrganizationService organizationService;

    @Value("${organization.id}")
    private String organizationId;

    @Autowired
    public PluginServiceImpl(Scheduler scheduler,
                             Validator validator,
                             MongoConverter mongoConverter,
                             ReactiveMongoTemplate reactiveMongoTemplate,
                             PluginRepository repository,
                             UserRepository userRepository,
                             ApplicationContext applicationContext,
                             ClientUserRepository clientUserRepository,
                             OrganizationService organizationService) {
        super(scheduler, validator, mongoConverter, reactiveMongoTemplate, repository);
        this.userRepository = userRepository;
        this.applicationContext = applicationContext;
        pluginRepository = repository;
        this.clientUserRepository = clientUserRepository;
        this.organizationService = organizationService;
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
    public Mono<Plugin> create(Plugin plugin) {
        if (plugin.getId() != null) {
            return Mono.error(new AppsmithException(AppsmithError.INVALID_PARAMETER, "id"));
        }

        plugin.setDeleted(false);
        return pluginRepository.save(plugin);
    }

    @Override
    public Mono<Organization> installPlugin(PluginOrgDTO pluginOrgDTO) {
        if (pluginOrgDTO.getPluginId() == null) {
            return Mono.error(new AppsmithException(AppsmithError.PLUGIN_ID_NOT_GIVEN));
        }

        return Mono.just(pluginOrgDTO)
                .flatMap(plugin -> storeOrganizationPlugin(plugin, pluginOrgDTO.getStatus()))
                .switchIfEmpty(Mono.empty());
    }

    @Override
    public Mono<Organization> uninstallPlugin(PluginOrgDTO pluginDTO) {
        /*TODO
         * Organization & user association is being mocked here by forcefully
         * only using a hardcoded organization. This needs to be replaced by
         * a user-organization association flow. The Organization needs to be picked
         * up from a user object. This is being used in install/uninstall
         * plugin from a organization flow. Instead, the current user should be read
         * using the following :
         * ReactiveSecurityContextHolder.getContext()
         *         .map(SecurityContext::getAuthentication)
         *         .map(Authentication::getPrincipal);
         * Once the user has been pulled using this, organization should already
         * be stored as part of user and this organization should be used to store
         * the installed plugin or to delete plugin during uninstallation.
         */
        if (pluginDTO.getPluginId() == null) {
            return Mono.error(new AppsmithException(AppsmithError.PLUGIN_ID_NOT_GIVEN));
        }

        //Find the organization using id and plugin id -> This is to find if the organization has the plugin installed
        Mono<Organization> organizationMono = organizationService.findByIdAndPluginsPluginId(organizationId, pluginDTO.getPluginId());

        return organizationMono
                .switchIfEmpty(Mono.error(new AppsmithException(AppsmithError.PLUGIN_NOT_INSTALLED, organizationId)))
                //In case the plugin is not found for the organization, the organizationMono would not emit and the rest of the flow would stop
                //i.e. the rest of the code flow would only happen when there is a plugin found for the organization that can
                //be uninstalled.
                .map(organization -> {
                    List<OrganizationPlugin> organizationPluginList = organization.getPlugins();
                    organizationPluginList.removeIf(listPlugin -> listPlugin.getPluginId().equals(pluginDTO.getPluginId()));
                    organization.setPlugins(organizationPluginList);
                    return organization;
                })
                .flatMap(organizationService::save);
    }

    private Mono<Organization> storeOrganizationPlugin(PluginOrgDTO pluginDTO, OrganizationPluginStatus status) {
        /*TODO
         * Organization & user association is being mocked here by forcefully
         * only using a hardcoded organization. This needs to be replaced by
         * a user-organization association flow. The Organization needs to be picked
         * up from a user object. This is being used in install/uninstall
         * plugin from a organization flow. Instead, the current user should be read
         * using the following :
         * ReactiveSecurityContextHolder.getContext()
         *         .map(SecurityContext::getAuthentication)
         *         .map(Authentication::getPrincipal);
         * Once the user has been pulled using this, organization should already
         * be stored as part of user and this organization should be used to store
         * the installed plugin or to delete plugin during uninstalling.
         */

        //Find the organization using id and plugin id -> This is to find if the organization already has the plugin installed
        Mono<Organization> organizationMono = organizationService.findByIdAndPluginsPluginId(organizationId, pluginDTO.getPluginId());

        return organizationMono
                .switchIfEmpty(Mono.defer(() -> {
                    //If the plugin is not found in the organization, its not already installed. Install now.
                    return organizationService.findById(organizationId).map(organization -> {
                        List<OrganizationPlugin> organizationPluginList = organization.getPlugins();
                        if (organizationPluginList == null) {
                            organizationPluginList = new ArrayList<OrganizationPlugin>();
                        }
                        log.debug("Installing plugin {} for organization {}", pluginDTO.getPluginId(), organization.getName());
                        OrganizationPlugin organizationPlugin = new OrganizationPlugin();
                        organizationPlugin.setPluginId(pluginDTO.getPluginId());
                        organizationPlugin.setStatus(status);
                        organizationPluginList.add(organizationPlugin);
                        organization.setPlugins(organizationPluginList);
                        return organization;
                    }).flatMap(organizationService::save);
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
