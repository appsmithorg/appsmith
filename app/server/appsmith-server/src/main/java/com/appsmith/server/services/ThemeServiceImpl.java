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
import org.springframework.util.StringUtils;
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
        // user can get the list of themes under an application only
        throw new UnsupportedOperationException();
    }

    @Override
    public Mono<Theme> update(String s, Theme resource) {
        // we don't allow to update a theme by id, user can only update a theme under their application
        throw new UnsupportedOperationException();
    }

    @Override
    public Mono<Theme> getById(String s) {
        // TODO: better to add permission check
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

    @Override
    public Mono<Theme> updateTheme(String themeId, String applicationId, Theme resource) {
        // get the theme by id and application id
        return applicationRepository.findById(applicationId, AclPermission.MANAGE_APPLICATIONS).then(
                // makes sure user has permission to edit application and an application exists by this applicationId
                repository.findByIdAndApplicationId(themeId, applicationId)
                        // create a new theme when not found e.g. system theme that have no applicationId
                        .defaultIfEmpty(new Theme())
                        .flatMap(theme -> {
                            if(!StringUtils.isEmpty(resource.getName())) {
                                theme.setName(resource.getName());
                            }
                            if(resource.getProperties() != null) {
                                theme.setProperties(resource.getProperties());
                            }
                            theme.setApplicationId(applicationId);
                            return repository.save(theme);
                        })
        );
    }

    @Override
    public Mono<Theme> createTheme(String applicationId, Theme resource) {
        return applicationRepository.findById(applicationId, AclPermission.MANAGE_APPLICATIONS)
                .flatMap(application -> {
                    // makes sure user has permission to edit application and an application exists by this applicationId
                    Theme theme = new Theme();
                    theme.setName(resource.getName());
                    theme.setProperties(resource.getProperties());
                    theme.setApplicationId(applicationId);
                    return repository.save(theme);
                });
    }
}
