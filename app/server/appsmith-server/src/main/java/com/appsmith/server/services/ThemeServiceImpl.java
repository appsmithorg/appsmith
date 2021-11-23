package com.appsmith.server.services;

import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.domains.Theme;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.repositories.ApplicationRepository;
import com.appsmith.server.repositories.ThemeRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.mongodb.core.ReactiveMongoTemplate;
import org.springframework.data.mongodb.core.convert.MongoConverter;
import org.springframework.stereotype.Service;
import org.springframework.util.MultiValueMap;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Scheduler;

import javax.validation.Validator;
import java.util.List;

@Slf4j
@Service
public class ThemeServiceImpl extends BaseService<ThemeRepository, Theme, String> implements ThemeService {

    private final ApplicationRepository applicationRepository;

    public ThemeServiceImpl(Scheduler scheduler, Validator validator, MongoConverter mongoConverter, ReactiveMongoTemplate reactiveMongoTemplate, ThemeRepository repository, AnalyticsService analyticsService, ApplicationRepository applicationRepository) {
        super(scheduler, validator, mongoConverter, reactiveMongoTemplate, repository, analyticsService);
        this.applicationRepository = applicationRepository;
    }

    @Override
    public Flux<Theme> get(MultiValueMap<String, String> params) {
        // user can get the list of themes under an application only
        throw new UnsupportedOperationException();
    }

    @Override
    public Mono<Theme> create(Theme resource) {
        return applicationRepository.findById(resource.getApplicationId(), AclPermission.MANAGE_APPLICATIONS)
                .flatMap(application ->
                    repository.save(resource)
                );
    }

    @Override
    public Mono<Theme> update(String s, Theme resource) {
        // we don't allow to update a theme by id, user can only update a theme under their application
        throw new UnsupportedOperationException();
    }

    @Override
    public Mono<Theme> getById(String s) {
        return repository.findById(s);
    }

    @Override
    public Mono<List<Theme>> getApplicationThemes(String applicationId) {
        return applicationRepository.findById(applicationId, AclPermission.MANAGE_APPLICATIONS)
                .switchIfEmpty(Mono.error(
                        new AppsmithException(AppsmithError.NO_RESOURCE_FOUND, FieldName.APPLICATION, applicationId))
                )
                .flatMap(application -> repository.getApplicationThemes(applicationId).collectList());
    }
}
