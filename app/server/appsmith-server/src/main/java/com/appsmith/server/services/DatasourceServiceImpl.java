package com.appsmith.server.services;

import com.appsmith.external.models.AuthenticationDTO;
import com.appsmith.external.models.DatasourceConfiguration;
import com.appsmith.external.models.DatasourceTestResult;
import com.appsmith.external.models.Endpoint;
import com.appsmith.external.models.Policy;
import com.appsmith.external.plugins.PluginExecutor;
import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.acl.PolicyGenerator;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.domains.Datasource;
import com.appsmith.server.domains.Organization;
import com.appsmith.server.domains.Plugin;
import com.appsmith.server.domains.User;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.helpers.MustacheHelper;
import com.appsmith.server.helpers.PluginExecutorHelper;
import com.appsmith.server.repositories.DatasourceRepository;
import com.appsmith.server.repositories.NewActionRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.mongodb.core.ReactiveMongoTemplate;
import org.springframework.data.mongodb.core.convert.MongoConverter;
import org.springframework.stereotype.Service;
import org.springframework.util.CollectionUtils;
import org.springframework.util.MultiValueMap;
import org.springframework.util.StringUtils;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Scheduler;

import javax.validation.Validator;
import javax.validation.constraints.NotNull;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

import static com.appsmith.server.acl.AclPermission.MANAGE_DATASOURCES;
import static com.appsmith.server.acl.AclPermission.ORGANIZATION_MANAGE_APPLICATIONS;
import static com.appsmith.server.acl.AclPermission.ORGANIZATION_READ_APPLICATIONS;
import static com.appsmith.server.helpers.BeanCopyUtils.copyNestedNonNullProperties;

@Slf4j
@Service
public class DatasourceServiceImpl extends BaseService<DatasourceRepository, Datasource, String> implements DatasourceService {

    private final OrganizationService organizationService;
    private final SessionUserService sessionUserService;
    private final PluginService pluginService;
    private final PluginExecutorHelper pluginExecutorHelper;
    private final PolicyGenerator policyGenerator;
    private final SequenceService sequenceService;
    private final NewActionRepository newActionRepository;
    private final EncryptionService encryptionService;

    @Autowired
    public DatasourceServiceImpl(Scheduler scheduler,
                                 Validator validator,
                                 MongoConverter mongoConverter,
                                 ReactiveMongoTemplate reactiveMongoTemplate,
                                 DatasourceRepository repository,
                                 OrganizationService organizationService,
                                 AnalyticsService analyticsService,
                                 SessionUserService sessionUserService,
                                 PluginService pluginService,
                                 PluginExecutorHelper pluginExecutorHelper,
                                 PolicyGenerator policyGenerator,
                                 SequenceService sequenceService,
                                 NewActionRepository newActionRepository,
                                 EncryptionService encryptionService) {
        super(scheduler, validator, mongoConverter, reactiveMongoTemplate, repository, analyticsService);
        this.organizationService = organizationService;
        this.sessionUserService = sessionUserService;
        this.pluginService = pluginService;
        this.pluginExecutorHelper = pluginExecutorHelper;
        this.policyGenerator = policyGenerator;
        this.sequenceService = sequenceService;
        this.newActionRepository = newActionRepository;
        this.encryptionService = encryptionService;
    }

    @Override
    public Mono<Datasource> create(@NotNull Datasource datasource) {
        if (datasource.getId() != null) {
            return Mono.error(new AppsmithException(AppsmithError.INVALID_PARAMETER, FieldName.ID));
        }
        if (datasource.getOrganizationId() == null) {
            return Mono.error(new AppsmithException(AppsmithError.INVALID_PARAMETER, FieldName.ORGANIZATION_ID));
        }

        // If Authentication Details are present in the datasource, encrypt the details before saving
        if (datasource.getDatasourceConfiguration() != null) {
            datasource.getDatasourceConfiguration().setAuthentication(encryptAuthenticationFields(datasource.getDatasourceConfiguration().getAuthentication()));
        }

        Mono<Datasource> datasourceMono = Mono.just(datasource);

        if (StringUtils.isEmpty(datasource.getName())) {
            datasourceMono = sequenceService
                    .getNextAsSuffix(Datasource.class)
                    .zipWith(datasourceMono, (sequenceNumber, datasource1) -> {
                        datasource1.setName(Datasource.DEFAULT_NAME_PREFIX + sequenceNumber);
                        return datasource1;
                    });
        }

        return datasourceMono
                .flatMap(datasource1 ->
                        sessionUserService.getCurrentUser()
                                .flatMap(user -> {
                                    // Create policies for this datasource -> This datasource should inherit its permissions and policies from
                                    // the organization and this datasource should also allow the current user to crud this datasource.
                                    return organizationService.findById(datasource1.getOrganizationId(), AclPermission.ORGANIZATION_MANAGE_APPLICATIONS)
                                            .switchIfEmpty(Mono.error(new AppsmithException(AppsmithError.NO_RESOURCE_FOUND, FieldName.ORGANIZATION, datasource1.getOrganizationId())))
                                            .map(org -> {
                                                Set<Policy> policySet = org.getPolicies().stream()
                                                        .filter(policy ->
                                                                policy.getPermission().equals(ORGANIZATION_MANAGE_APPLICATIONS.getValue()) ||
                                                                        policy.getPermission().equals(ORGANIZATION_READ_APPLICATIONS.getValue())
                                                        ).collect(Collectors.toSet());

                                                Set<Policy> documentPolicies = policyGenerator.getAllChildPolicies(policySet, Organization.class, Datasource.class);
                                                datasource1.setPolicies(documentPolicies);
                                                return datasource1;
                                            });
                                })
                )
                .flatMap(this::validateAndSaveDatasourceToRepository);
    }

    @Override
    public Mono<Datasource> update(String id, Datasource datasource) {
        if (id == null) {
            return Mono.error(new AppsmithException(AppsmithError.INVALID_PARAMETER, FieldName.ID));
        }

        // If Authentication Details are present in the datasource, encrypt the details before saving
        if (datasource.getDatasourceConfiguration() != null) {
            datasource.getDatasourceConfiguration().setAuthentication(encryptAuthenticationFields(datasource.getDatasourceConfiguration().getAuthentication()));
        }

        // Since policies are a server only concept, first set the empty set (set by constructor) to null
        datasource.setPolicies(null);

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
    public AuthenticationDTO encryptAuthenticationFields(AuthenticationDTO authentication) {
        if (authentication != null
                && !authentication.isEncrypted()) {
            Map<String, String> encryptedFields = authentication.getEncryptionFields().entrySet().stream()
                    .filter(e -> e.getValue() != null)
                    .collect(Collectors.toMap(
                            Map.Entry::getKey,
                            e -> encryptionService.encryptString(e.getValue())));
            if (!encryptedFields.isEmpty()) {
                authentication.setEncryptionFields(encryptedFields);
                authentication.setIsEncrypted(true);
            }
        }
        return authentication;
    }

    @Override
    public Mono<Datasource> validateDatasource(Datasource datasource) {
        Set<String> invalids = new HashSet<>();
        datasource.setInvalids(invalids);

        if (!StringUtils.hasText(datasource.getName())) {
            return Mono.error(new AppsmithException(AppsmithError.INVALID_PARAMETER, FieldName.NAME));
        }

        if (datasource.getPluginId() == null) {
            invalids.add(AppsmithError.PLUGIN_ID_NOT_GIVEN.getMessage());
            return Mono.just(datasource);
        }

        if (datasource.getOrganizationId() == null) {
            invalids.add(AppsmithError.ORGANIZATION_ID_NOT_GIVEN.getMessage());
            return Mono.just(datasource);
        }

        Mono<Organization> checkPluginInstallationAndThenReturnOrganizationMono = organizationService
                .findByIdAndPluginsPluginId(datasource.getOrganizationId(), datasource.getPluginId())
                .switchIfEmpty(Mono.defer(() -> {
                    invalids.add(AppsmithError.PLUGIN_NOT_INSTALLED.getMessage(datasource.getPluginId()));
                    return Mono.just(new Organization());
                }));

        if (datasource.getDatasourceConfiguration() == null) {
            invalids.add(AppsmithError.NO_CONFIGURATION_FOUND_IN_DATASOURCE.getMessage());
        }

        final Mono<Plugin> pluginMono = pluginService.findById(datasource.getPluginId()).cache();
        Mono<PluginExecutor> pluginExecutorMono = pluginExecutorHelper.getPluginExecutor(pluginMono)
                .switchIfEmpty(Mono.error(new AppsmithException(AppsmithError.NO_RESOURCE_FOUND, FieldName.PLUGIN, datasource.getPluginId())));

        return checkPluginInstallationAndThenReturnOrganizationMono
                .then(pluginExecutorMono)
                .flatMap(pluginExecutor -> {
                    DatasourceConfiguration datasourceConfiguration = datasource.getDatasourceConfiguration();
                    if (datasourceConfiguration != null && !pluginExecutor.isDatasourceValid(datasourceConfiguration)) {
                        invalids.addAll(pluginExecutor.validateDatasource(datasourceConfiguration));
                    }

                    return Mono.just(datasource);
                });
    }

    @Override
    public Mono<Datasource> save(Datasource datasource) {
        return repository.save(datasource);
    }

    private Datasource sanitizeDatasource(Datasource datasource) {
        if (datasource.getDatasourceConfiguration() != null
                && !CollectionUtils.isEmpty(datasource.getDatasourceConfiguration().getEndpoints())) {
            for (final Endpoint endpoint : datasource.getDatasourceConfiguration().getEndpoints()) {
                endpoint.setHost(endpoint.getHost().trim());
            }
        }

        return datasource;
    }

    private Mono<Datasource> validateAndSaveDatasourceToRepository(Datasource datasource) {

        Mono<User> currentUserMono = sessionUserService.getCurrentUser();

        return Mono.just(datasource)
                .map(this::sanitizeDatasource)
                .flatMap(this::validateDatasource)
                .zipWith(currentUserMono)
                .flatMap(tuple -> {
                    Datasource savedDatasource = tuple.getT1();
                    User user = tuple.getT2();
                    Datasource userPermissionsInDatasource = repository.setUserPermissionsInObject(savedDatasource, user);
                    return repository.save(userPermissionsInDatasource);
                });
    }

    /**
     * This function can now only be used if you send the entire datasource object and not just id inside the datasource object. We only fetch
     * the password from the db if its a saved datasource before testing.
     */
    @Override
    public Mono<DatasourceTestResult> testDatasource(Datasource datasource) {
        Mono<Datasource> datasourceMono = null;
        // Fetch any fields that maybe encrypted from the db if the datasource being tested does not have those fields set.
        // This scenario would happen whenever an existing datasource is being tested and no changes are present in the
        // encrypted field (because encrypted fields are not sent over the network after encryption back to the client
        if (datasource.getId() != null && datasource.getDatasourceConfiguration() != null &&
                datasource.getDatasourceConfiguration().getAuthentication() != null) {
            Set<String> emptyFields = datasource.getDatasourceConfiguration().getAuthentication().getEmptyEncryptionFields();
            if (emptyFields != null && !emptyFields.isEmpty()) {

                datasourceMono = getById(datasource.getId())
                        // If datasource has encrypted fields, decrypt and set it in the datasource which is being tested
                        .map(datasourceFromRepo -> {
                            if (datasourceFromRepo.getDatasourceConfiguration() != null && datasourceFromRepo.getDatasourceConfiguration().getAuthentication() != null) {
                                AuthenticationDTO authentication = datasourceFromRepo.getDatasourceConfiguration().getAuthentication();

                                if (!authentication.getEncryptionFields().isEmpty()) {
                                    Map<String, String> decryptedFields = authentication.getEncryptionFields();
                                    decryptedFields = decryptedFields.entrySet().stream()
                                            .collect(Collectors.toMap(
                                                    Map.Entry::getKey,
                                                    e -> encryptionService.decryptString(e.getValue())));
                                    datasource.getDatasourceConfiguration().getAuthentication().setEncryptionFields(decryptedFields);
                                    datasource.getDatasourceConfiguration().getAuthentication().setIsEncrypted(false);
                                }

                            }
                            return datasource;
                        })
                        .switchIfEmpty(Mono.just(datasource));
            }
        }

        if (datasourceMono == null) {
            datasourceMono = Mono.just(datasource);
        }

        return datasourceMono
                .flatMap(this::validateDatasource)
                .flatMap(datasource1 -> {
                    if (CollectionUtils.isEmpty(datasource1.getInvalids())) {
                        return testDatasourceViaPlugin(datasource1);
                    } else {
                        return Mono.just(new DatasourceTestResult(datasource1.getInvalids()));
                    }
                });
    }

    private Mono<DatasourceTestResult> testDatasourceViaPlugin(Datasource datasource) {
        Mono<PluginExecutor> pluginExecutorMono = pluginExecutorHelper.getPluginExecutor(pluginService.findById(datasource.getPluginId()))
                .switchIfEmpty(Mono.error(new AppsmithException(AppsmithError.NO_RESOURCE_FOUND, FieldName.PLUGIN, datasource.getPluginId())));

        return pluginExecutorMono
                .flatMap(pluginExecutor -> pluginExecutor.testDatasource(datasource.getDatasourceConfiguration()));
    }

    @Override
    public Mono<Datasource> findByName(String name, AclPermission permission) {
        return repository.findByName(name, permission);
    }

    @Override
    public Mono<Datasource> findById(String id, AclPermission aclPermission) {
        return repository.findById(id, aclPermission);
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

        return MustacheHelper.extractMustacheKeysFromFields(datasource.getDatasourceConfiguration());
    }

    @Override
    public Flux<Datasource> get(MultiValueMap<String, String> params) {
        /**
         * Note : Currently this API is ONLY used to fetch datasources for an organization.
         */
        if (params.getFirst(FieldName.ORGANIZATION_ID) != null) {
            return findAllByOrganizationId(params.getFirst(FieldName.ORGANIZATION_ID), AclPermission.READ_DATASOURCES);
        }

        return Flux.error(new AppsmithException(AppsmithError.INVALID_PARAMETER, FieldName.ORGANIZATION_ID));
    }

    @Override
    public Flux<Datasource> findAllByOrganizationId(String organizationId, AclPermission permission) {
        return repository.findAllByOrganizationId(organizationId, permission);
    }

    @Override
    public Flux<Datasource> saveAll(List<Datasource> datasourceList) {
        return repository.saveAll(datasourceList);
    }

    @Override
    public Mono<Datasource> delete(String id) {
        return repository
                .findById(id, MANAGE_DATASOURCES)
                .switchIfEmpty(Mono.error(new AppsmithException(AppsmithError.NO_RESOURCE_FOUND, FieldName.DATASOURCE, id)))
                .zipWhen(datasource -> newActionRepository.countByDatasourceId(datasource.getId()))
                .flatMap(objects -> {
                    final Long actionsCount = objects.getT2();
                    if (actionsCount > 0) {
                        return Mono.error(new AppsmithException(AppsmithError.DATASOURCE_HAS_ACTIONS, actionsCount));
                    }
                    return Mono.just(objects.getT1());
                })
                .flatMap(toDelete -> repository.archive(toDelete).thenReturn(toDelete))
                .flatMap(analyticsService::sendDeleteEvent);
    }

}
