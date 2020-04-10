package com.appsmith.server.services;

import com.appsmith.external.models.DatasourceConfiguration;
import com.appsmith.external.plugins.PluginExecutor;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.domains.Datasource;
import com.appsmith.server.domains.Organization;
import com.appsmith.server.domains.User;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.helpers.PluginExecutorHelper;
import com.appsmith.server.repositories.DatasourceRepository;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.mongodb.core.ReactiveMongoTemplate;
import org.springframework.data.mongodb.core.convert.MongoConverter;
import org.springframework.stereotype.Service;
import org.springframework.util.MultiValueMap;
import org.springframework.util.StringUtils;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Scheduler;

import javax.validation.Validator;
import javax.validation.constraints.NotNull;
import java.util.HashSet;
import java.util.Set;

import static com.appsmith.server.helpers.BeanCopyUtils.copyNestedNonNullProperties;
import static com.appsmith.server.helpers.MustacheHelper.extractMustacheKeys;

@Slf4j
@Service
public class DatasourceServiceImpl extends BaseService<DatasourceRepository, Datasource, String> implements DatasourceService {

    private final DatasourceRepository repository;
    private final OrganizationService organizationService;
    private final SessionUserService sessionUserService;
    private final ObjectMapper objectMapper;
    private final PluginService pluginService;
    private final PluginExecutorHelper pluginExecutorHelper;

    @Autowired
    public DatasourceServiceImpl(Scheduler scheduler,
                                 Validator validator,
                                 MongoConverter mongoConverter,
                                 ReactiveMongoTemplate reactiveMongoTemplate,
                                 DatasourceRepository repository,
                                 OrganizationService organizationService,
                                 AnalyticsService analyticsService,
                                 SessionUserService sessionUserService,
                                 ObjectMapper objectMapper,
                                 PluginService pluginService,
                                 PluginExecutorHelper pluginExecutorHelper) {
        super(scheduler, validator, mongoConverter, reactiveMongoTemplate, repository, analyticsService);
        this.repository = repository;
        this.organizationService = organizationService;
        this.sessionUserService = sessionUserService;
        this.objectMapper = objectMapper;
        this.pluginService = pluginService;
        this.pluginExecutorHelper = pluginExecutorHelper;
    }

    @Override
    public Mono<Datasource> create(@NotNull Datasource datasource) {

        datasource.setIsValid(true);
        if (datasource.getId() != null) {
            return Mono.error(new AppsmithException(AppsmithError.INVALID_PARAMETER, FieldName.ID));
        }
        return validateAndSaveDatasourceToRepository(datasource);
    }

    @Override
    public Mono<Datasource> update(String id, Datasource datasource) {
        if (id == null) {
            return Mono.error(new AppsmithException(AppsmithError.INVALID_PARAMETER, FieldName.ID));
        }
        Mono<Datasource> datasourceMono = repository.findById(id)
                .switchIfEmpty(Mono.error(new AppsmithException(AppsmithError.NO_RESOURCE_FOUND, FieldName.DATASOURCE, id)));

        return datasourceMono
                .map(dbDatasource -> {
                    copyNestedNonNullProperties(datasource, dbDatasource);
                    return dbDatasource;
                })
                .flatMap(this::validateAndSaveDatasourceToRepository);
    }

    @Override
    public Mono<Datasource> validateDatasource(Datasource datasource) {
        Set<String> invalids = new HashSet<>();

        if (!StringUtils.hasText(datasource.getName())) {
            return Mono.error(new AppsmithException(AppsmithError.INVALID_PARAMETER, FieldName.NAME));
        }

        if (datasource.getPluginId() == null) {
            datasource.setIsValid(false);
            invalids.add(AppsmithError.PLUGIN_ID_NOT_GIVEN.getMessage());
            datasource.setInvalids(invalids);
            return Mono.just(datasource);
        }

        Mono<User> userMono = sessionUserService.getCurrentUser();

        Mono<Organization> organizationMono = userMono
                .flatMap(user -> organizationService.findByIdAndPluginsPluginId(
                        user.getCurrentOrganizationId(), datasource.getPluginId()))
                .switchIfEmpty(Mono.defer(() -> {
                    datasource.setIsValid(false);
                    invalids.add(AppsmithError.PLUGIN_NOT_INSTALLED.getMessage(datasource.getPluginId()));
                    return Mono.just(new Organization());
                }));

        //Add organization id to the datasource.
        Mono<Datasource> updatedDatasourceMono = organizationMono
                .map(organization -> {
                    if (organization.getId() != null) {
                        datasource.setOrganizationId(organization.getId());
                    }
                    return datasource;
                });

        if (datasource.getDatasourceConfiguration() == null) {
            datasource.setIsValid(false);
            invalids.add(AppsmithError.NO_CONFIGURATION_FOUND_IN_DATASOURCE.getMessage());
        }

        Mono<PluginExecutor> pluginExecutorMono = pluginExecutorHelper.getPluginExecutor(pluginService.findById(datasource.getPluginId()))
                .switchIfEmpty(Mono.error(new AppsmithException(AppsmithError.NO_RESOURCE_FOUND, FieldName.PLUGIN, datasource.getPluginId())));

        return Mono.zip(updatedDatasourceMono, pluginExecutorMono)
                .flatMap(tuple -> {
                    Datasource datasource1 = tuple.getT1();
                    PluginExecutor pluginExecutor = tuple.getT2();

                    DatasourceConfiguration datasourceConfiguration = datasource1.getDatasourceConfiguration();
                    if (datasourceConfiguration != null && !pluginExecutor.isDatasourceValid(datasourceConfiguration)) {
                        invalids.addAll(pluginExecutor.validateDatasource(datasourceConfiguration));
                    }

                    datasource1.setInvalids(invalids);
                    if (!invalids.isEmpty()) {
                        datasource1.setIsValid(false);
                    }

                    return Mono.just(datasource1);
                });
    }

    private Mono<Datasource> validateAndSaveDatasourceToRepository(Datasource datasource) {
        return Mono.just(datasource)
                .flatMap(this::validateDatasource)
                .flatMap(repository::save);
    }

    @Override
    public Mono<Datasource> findByName(String name) {
        return repository.findByName(name);
    }

    @Override
    public Mono<Datasource> findById(String id) {
        return repository.findById(id);
    }

    @Override
    public Set<String> extractKeysFromDatasource(Datasource datasource) {
        if (datasource.getDatasourceConfiguration() == null) {
            return new HashSet<>();
        }
        // Convert the object to String as a preparation to send it to mustache extraction
        try {
            String datasourceConfigStr = objectMapper.writeValueAsString(datasource.getDatasourceConfiguration());
            return extractMustacheKeys(datasourceConfigStr);
        } catch (JsonProcessingException e) {
            log.error("Exception caught while extracting mustache keys from action configuration. ", e);
        }
        return new HashSet<>();
    }

    @Override
    public Flux<Datasource> get(MultiValueMap<String, String> params) {

        return sessionUserService
                .getCurrentUser()
                .flatMapMany(user -> repository.findAllByOrganizationId(user.getCurrentOrganizationId()));
    }

    @Override
    public Mono<Datasource> getById(String id) {
        if (id == null) {
            return Mono.error(new AppsmithException(AppsmithError.INVALID_PARAMETER, FieldName.ID));
        }

        return sessionUserService
                .getCurrentUser()
                .flatMap(user -> repository.findByIdAndOrganizationId(id, user.getCurrentOrganizationId()))
                .switchIfEmpty(Mono.error(new AppsmithException(AppsmithError.NO_RESOURCE_FOUND, FieldName.DATASOURCE, id)));
    }

}
