package com.appsmith.server.services;

import com.appsmith.server.domains.Setting;
import com.appsmith.server.domains.Tenant;
import com.appsmith.server.domains.TenantSetting;
import com.appsmith.server.repositories.TenantRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.mongodb.core.ReactiveMongoTemplate;
import org.springframework.data.mongodb.core.convert.MongoConverter;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Scheduler;

import java.util.ArrayList;
import java.util.List;

@Slf4j
@Service
public class TenantServiceImpl extends BaseService<TenantRepository, Tenant, String> implements TenantService {

    private final TenantRepository repository;
    private final SettingService settingService;

    @Autowired
    public TenantServiceImpl(Scheduler scheduler,
                             MongoConverter mongoConverter,
                             ReactiveMongoTemplate reactiveMongoTemplate,
                             TenantRepository repository,
                             SettingService settingService) {
        super(scheduler, mongoConverter, reactiveMongoTemplate, repository);
        this.repository = repository;
        this.settingService = settingService;
    }

    @Override
    public Mono<Tenant> getByName(String name) {
        return repository.findByName(name);
    }

    /*
     * Create needs to first fetch and embed Setting in TenantSetting
     * for the settings that have diverged from the default. Once the
     * settings has been embedded in all the tenant settings, the library
     * function is called to store the enhanced tenant object.
     */
    @Override
    public Mono<Tenant> create(Tenant tenant) {

        log.debug("Going to create the tenant");
        return Mono.just(tenant)
                //transform the tenant data to embed setting object in each object in tenantSetting list.
                .flatMap(this::enhanceTenantSettingList)
                //Call the library function to save the updated tenant
                .flatMap(tenantUpdated -> repository.save(tenantUpdated))
                .subscribeOn(scheduler);
    }

    private Mono<Tenant> enhanceTenantSettingList(Tenant tenant) {

        if (tenant.getTenantSettings() == null) tenant.setTenantSettings(new ArrayList<>());

        Flux<TenantSetting> tenantSettingFlux = Flux.fromIterable(tenant.getTenantSettings());
        // For each tenant setting, fetch and embed the setting, and once all the tenant setting are done, collect it
        // back into a single list of tenant settings.
        Mono<List<TenantSetting>> listMono = tenantSettingFlux.flatMap(this::fetchAndEmbedSetting).collectList();
        return listMono.map(list -> {
            tenant.setTenantSettings(list);
            return list;
        }).thenReturn(tenant);
    }

    private Mono<TenantSetting> fetchAndEmbedSetting(TenantSetting tenantSetting) {

        String key = tenantSetting.getSetting().getKey();
        Mono<Setting> setting = settingService.getByKey(key);
        return setting.map(setting1 -> {
            tenantSetting.setSetting(setting1);
            return tenantSetting;
        });
    }

    @Override
    public Mono<Tenant> findById(String id) {
        return repository.findById(id);
    }

    @Override
    public Mono<Tenant> save(Tenant tenant) {
        return repository.save(tenant);
    }

    @Override
    public Mono<Tenant> findByIdAndPluginsPluginId(String tenantId, String pluginId) {
        return repository.findByIdAndPluginsPluginId(tenantId, pluginId);
    }

}

