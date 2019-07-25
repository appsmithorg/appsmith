package com.mobtools.server.services;

import com.mobtools.server.domains.Setting;
import com.mobtools.server.domains.Tenant;
import com.mobtools.server.domains.TenantSetting;
import com.mobtools.server.repositories.TenantRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.mongodb.core.ReactiveMongoTemplate;
import org.springframework.data.mongodb.core.convert.MongoConverter;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Scheduler;

import javax.validation.constraints.NotNull;
import java.util.stream.Stream;

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

    @Override
    public Mono<Tenant> create(@NotNull Tenant tenant) {

        //Embed the setting object into tenantSetting. This is done only for settings for which the values deviate from the default.
        //It is assumed that the tenant create API body would only contain the settings for which the default value and
        //true value are different.
        if (tenant.getTenantSettings() != null) {

            try (Stream<TenantSetting> stream = tenant.getTenantSettings().stream()) {
                Flux<TenantSetting> tenantSettingFlux = Flux.fromStream(stream);
                tenantSettingFlux.map(this::getAndStoreSettingObjectInTenantSetting).subscribe();
            }
        }

        return repository.save(tenant);

    }

    private Object getAndStoreSettingObjectInTenantSetting(TenantSetting tenantSetting) {
        String key = tenantSetting.getSetting().getKey();
        Mono<Setting> setting = settingService.getByKey(key);
        return setting.doOnNext(set -> tenantSetting.setSetting(set))
                .thenReturn(tenantSetting)
                .subscribe();
    }
}
