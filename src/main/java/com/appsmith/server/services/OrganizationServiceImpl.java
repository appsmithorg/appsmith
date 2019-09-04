package com.appsmith.server.services;

import com.appsmith.server.constants.FieldName;
import com.appsmith.server.domains.Organization;
import com.appsmith.server.domains.OrganizationSetting;
import com.appsmith.server.domains.Setting;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.repositories.OrganizationRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.mongodb.core.ReactiveMongoTemplate;
import org.springframework.data.mongodb.core.convert.MongoConverter;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Scheduler;

import javax.validation.Validator;
import java.util.ArrayList;
import java.util.List;

@Slf4j
@Service
public class OrganizationServiceImpl extends BaseService<OrganizationRepository, Organization, String> implements OrganizationService {

    private final OrganizationRepository repository;
    private final SettingService settingService;

    @Autowired
    public OrganizationServiceImpl(Scheduler scheduler,
                                   Validator validator,
                                   MongoConverter mongoConverter,
                                   ReactiveMongoTemplate reactiveMongoTemplate,
                                   OrganizationRepository repository,
                                   SettingService settingService) {
        super(scheduler, validator, mongoConverter, reactiveMongoTemplate, repository);
        this.repository = repository;
        this.settingService = settingService;
    }

    @Override
    public Mono<Organization> getByName(String name) {
        return repository.findByName(name);
    }

    /*
     * Create needs to first fetch and embed Setting in OrganizationSetting
     * for the settings that have diverged from the default. Once the
     * settings has been embedded in all the organization settings, the library
     * function is called to store the enhanced organization object.
     */
    @Override
    public Mono<Organization> create(Organization organization) {
        if (organization == null) {
            return Mono.error(new AppsmithException(AppsmithError.INVALID_PARAMETER, FieldName.ORGANIZATION));
        }

        log.debug("Going to create the organization {}", organization.getName());
        return Mono.just(organization)
                .flatMap(this::validateObject)
                //transform the organization data to embed setting object in each object in organizationSetting list.
                .flatMap(this::enhanceOrganizationSettingList)
                //Call the library function to save the updated organization
                .flatMap(repository::save);
    }

    private Mono<Organization> enhanceOrganizationSettingList(Organization organization) {

        if (organization.getOrganizationSettings() == null) {
            organization.setOrganizationSettings(new ArrayList<>());
        }

        Flux<OrganizationSetting> organizationSettingFlux = Flux.fromIterable(organization.getOrganizationSettings());
        // For each organization setting, fetch and embed the setting, and once all the organization setting are done, collect it
        // back into a single list of organization settings.
        Mono<List<OrganizationSetting>> listMono = organizationSettingFlux.flatMap(this::fetchAndEmbedSetting).collectList();
        return listMono.map(list -> {
            organization.setOrganizationSettings(list);
            return list;
        }).thenReturn(organization);
    }

    private Mono<OrganizationSetting> fetchAndEmbedSetting(OrganizationSetting organizationSetting) {

        String key = organizationSetting.getSetting().getKey();
        Mono<Setting> setting = settingService.getByKey(key);
        return setting.map(setting1 -> {
            organizationSetting.setSetting(setting1);
            return organizationSetting;
        });
    }

    @Override
    public Mono<Organization> findById(String id) {
        return repository.findById(id);
    }

    @Override
    public Mono<Organization> save(Organization organization) {
        return repository.save(organization);
    }

    @Override
    public Mono<Organization> findByIdAndPluginsPluginId(String organizationId, String pluginId) {
        return repository.findByIdAndPluginsPluginId(organizationId, pluginId);
    }

}

