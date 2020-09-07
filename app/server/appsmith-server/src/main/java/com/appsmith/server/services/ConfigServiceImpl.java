package com.appsmith.server.services;

import com.appsmith.server.constants.FieldName;
import com.appsmith.server.domains.Application;
import com.appsmith.server.domains.Config;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.repositories.ApplicationRepository;
import com.appsmith.server.repositories.ConfigRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.mongodb.core.ReactiveMongoTemplate;
import org.springframework.data.mongodb.core.convert.MongoConverter;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Scheduler;

import javax.validation.Validator;
import java.util.Collections;
import java.util.List;

@Slf4j
@Service
public class ConfigServiceImpl extends BaseService<ConfigRepository, Config, String> implements ConfigService {

    private static final String TEMPLATE_ORGANIZATION_CONFIG_NAME = "template-organization";

    private final ApplicationRepository applicationRepository;

    public ConfigServiceImpl(Scheduler scheduler,
                             Validator validator,
                             MongoConverter mongoConverter,
                             ReactiveMongoTemplate reactiveMongoTemplate,
                             ConfigRepository repository,
                             AnalyticsService analyticsService,
                             ApplicationRepository applicationRepository) {
        super(scheduler, validator, mongoConverter, reactiveMongoTemplate, repository, analyticsService);
        this.applicationRepository = applicationRepository;
    }

    @Override
    public Mono<Config> getByName(String name) {
        return repository.findByName(name)
                .switchIfEmpty(Mono.error(new AppsmithException(AppsmithError.NO_RESOURCE_FOUND, FieldName.CONFIG, name)));
    }

    @Override
    public Mono<Config> updateByName(String name, Config config) {
        return repository.findByName(name)
                .switchIfEmpty(Mono.error(new AppsmithException(AppsmithError.NO_RESOURCE_FOUND, FieldName.CONFIG, name)))
                .flatMap(dbConfig -> {
                    log.debug("Found config with name: {} and id: {}", name, dbConfig.getId());
                    dbConfig.setConfig(config.getConfig());
                    return repository.save(dbConfig);
                });
    }

    @Override
    public Mono<String> getTemplateOrganizationId() {
        return repository.findByName(TEMPLATE_ORGANIZATION_CONFIG_NAME)
                .map(config -> config.getConfig().getAsString(FieldName.ORGANIZATION_ID));
    }

    @Override
    public Flux<Application> getTemplateApplications() {
        return repository.findByName(TEMPLATE_ORGANIZATION_CONFIG_NAME)
                .map(config -> config.getConfig().getOrDefault("applicationIds", Collections.emptyList()))
                .cast(List.class)
                .flatMapMany(applicationRepository::findByIdIn);
    }
}
