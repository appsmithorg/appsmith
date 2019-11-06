package com.appsmith.server.services;

import com.appsmith.server.constants.FieldName;
import com.appsmith.server.domains.Datasource;
import com.appsmith.server.domains.Organization;
import com.appsmith.server.domains.User;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.repositories.DatasourceRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.mongodb.core.ReactiveMongoTemplate;
import org.springframework.data.mongodb.core.convert.MongoConverter;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Scheduler;

import javax.validation.Validator;
import javax.validation.constraints.NotNull;

@Slf4j
@Service
public class DatasourceServiceImpl extends BaseService<DatasourceRepository, Datasource, String> implements DatasourceService {

    private final DatasourceRepository repository;
    private final OrganizationService organizationService;
    private final SessionUserService sessionUserService;

    @Autowired
    public DatasourceServiceImpl(Scheduler scheduler,
                                 Validator validator,
                                 MongoConverter mongoConverter,
                                 ReactiveMongoTemplate reactiveMongoTemplate,
                                 DatasourceRepository repository,
                                 OrganizationService organizationService,
                                 AnalyticsService analyticsService,
                                 SessionUserService sessionUserService) {
        super(scheduler, validator, mongoConverter, reactiveMongoTemplate, repository, analyticsService);
        this.repository = repository;
        this.organizationService = organizationService;
        this.sessionUserService = sessionUserService;
    }

    @Override
    public Mono<Datasource> create(@NotNull Datasource datasource) {
        if (datasource.getId() != null) {
            return Mono.error(new AppsmithException(AppsmithError.INVALID_PARAMETER, FieldName.ID));
        } else if (datasource.getPluginId() == null) {
            return Mono.error(new AppsmithException(AppsmithError.PLUGIN_ID_NOT_GIVEN));
        }

        Mono<User> userMono = sessionUserService.getCurrentUser();

        Mono<Organization> organizationMono = userMono.flatMap(user -> organizationService.findByIdAndPluginsPluginId(user.getOrganizationId(), datasource.getPluginId()));

        //Add organization id to the datasource.
        Mono<Datasource> updatedDatasourceMono = organizationMono
                .map(organization -> {
                    datasource.setOrganizationId(organization.getId());
                    return datasource;
                });

        return organizationMono
                .switchIfEmpty(Mono.error(new AppsmithException(AppsmithError.PLUGIN_NOT_INSTALLED, datasource.getPluginId())))
                .then(updatedDatasourceMono)
                .flatMap(super::create);
    }

    @Override
    public Mono<Datasource> findByName(String name) {
        return repository.findByName(name);
    }

    @Override
    public Mono<Datasource> findById(String id) {
        return repository.findById(id);
    }
}
