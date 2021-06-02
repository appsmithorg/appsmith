package com.appsmith.server.services;

import com.appsmith.external.helpers.BeanCopyUtils;
import com.appsmith.external.helpers.MustacheHelper;
import com.appsmith.external.models.DatasourceConfiguration;
import com.appsmith.external.models.DatasourceTestResult;
import com.appsmith.external.models.Endpoint;
import com.appsmith.external.models.Policy;
import com.appsmith.external.plugins.PluginExecutor;
import com.appsmith.external.services.EncryptionService;
import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.acl.PolicyGenerator;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.domains.Datasource;
import com.appsmith.server.domains.Organization;
import com.appsmith.server.domains.Plugin;
import com.appsmith.server.domains.User;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
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
import java.util.Set;
import java.util.stream.Collectors;

import static com.appsmith.external.helpers.BeanCopyUtils.copyNestedNonNullProperties;
import static com.appsmith.server.acl.AclPermission.MANAGE_DATASOURCES;
import static com.appsmith.server.acl.AclPermission.ORGANIZATION_MANAGE_APPLICATIONS;
import static com.appsmith.server.acl.AclPermission.ORGANIZATION_READ_APPLICATIONS;

@Slf4j
@Service
public class DatasourceServiceImpl extends BaseService<DatasourceRepository, Datasource, String> implements DatasourceService {

    private static final String LOCALHOST_STRING = "localhost";
    private static final String LOCALHOST_IP = "127.0.0.1";

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
        String orgId = datasource.getOrganizationId();
        if (orgId == null) {
            return Mono.error(new AppsmithException(AppsmithError.INVALID_PARAMETER, FieldName.ORGANIZATION_ID));
        }
        if (datasource.getId() != null) {
            return Mono.error(new AppsmithException(AppsmithError.INVALID_PARAMETER, FieldName.ID));
        }

        Mono<Datasource> datasourceMono = Mono.just(datasource);
        if (StringUtils.isEmpty(datasource.getName())) {
            datasourceMono = sequenceService
                    .getNextAsSuffix(Datasource.class, " for organization with _id : " + orgId)
                    .zipWith(datasourceMono, (sequenceNumber, datasource1) -> {
                        datasource1.setName(Datasource.DEFAULT_NAME_PREFIX + sequenceNumber);
                        return datasource1;
                    });
        }

        Mono<Datasource> datasourceWithPoliciesMono = datasourceMono
                .flatMap(datasource1 -> {
                    Mono<User> userMono = sessionUserService.getCurrentUser();
                    return generateAndSetDatasourcePolicies(userMono, datasource1);
                });

        return datasourceWithPoliciesMono
                .flatMap(this::validateAndSaveDatasourceToRepository)
                .flatMap(this::populateHintMessages); // For REST API datasource create flow.
    }

    private Mono<Datasource> generateAndSetDatasourcePolicies(Mono<User> userMono, Datasource datasource) {
        return userMono
                .flatMap(user -> {
                    Mono<Organization> orgMono = organizationService.findById(datasource.getOrganizationId(), ORGANIZATION_MANAGE_APPLICATIONS)
                            .switchIfEmpty(Mono.error(new AppsmithException(AppsmithError.NO_RESOURCE_FOUND, FieldName.ORGANIZATION, datasource.getOrganizationId())));

                    return orgMono.map(org -> {
                        Set<Policy> policySet = org.getPolicies().stream()
                                .filter(policy ->
                                        policy.getPermission().equals(ORGANIZATION_MANAGE_APPLICATIONS.getValue()) ||
                                                policy.getPermission().equals(ORGANIZATION_READ_APPLICATIONS.getValue())
                                ).collect(Collectors.toSet());

                        Set<Policy> documentPolicies = policyGenerator.getAllChildPolicies(policySet, Organization.class, Datasource.class);
                        datasource.setPolicies(documentPolicies);
                        return datasource;
                    });
                });
    }

    private boolean endpointContainsLocalhost(Endpoint endpoint) {
        if (endpoint == null || StringUtils.isEmpty(endpoint.getHost())) {
            return false;
        }

        String host = endpoint.getHost().toLowerCase();
        if (host.contains(LOCALHOST_STRING) || host.contains(LOCALHOST_IP)) {
            return true;
        }

        return false;
    }

    public Mono<Datasource> populateHintMessages(Datasource datasource) {

        if(datasource == null) {
            /*
             * - Not throwing an exception here because we do not throw an error in case of missing datasource.
             *   We try not to fail as much as possible during create and update actions.
             */
            return Mono.just(new Datasource());
        }

        Set<String> messages = new HashSet<>();

        if (datasource.getDatasourceConfiguration() != null) {
            boolean usingLocalhostUrl = false;

            if(!StringUtils.isEmpty(datasource.getDatasourceConfiguration().getUrl())) {
                usingLocalhostUrl = datasource.getDatasourceConfiguration().getUrl().contains("localhost");
            }
            else if(!CollectionUtils.isEmpty(datasource.getDatasourceConfiguration().getEndpoints())) {
                usingLocalhostUrl = datasource
                        .getDatasourceConfiguration()
                        .getEndpoints()
                        .stream()
                        .anyMatch(endpoint -> endpointContainsLocalhost(endpoint));
            }

            if(usingLocalhostUrl) {
                messages.add("You may not be able to access your localhost if Appsmith is running inside a docker " +
                        "container or on the cloud. To enable access to your localhost you may use ngrok to expose " +
                        "your local endpoint to the internet. Please check out Appsmith's documentation to understand more" +
                        ".");
            }
        }

        datasource.setMessages(messages);

        return Mono.just(datasource);
    }

    @Override
    public Mono<Datasource> update(String id, Datasource datasource) {
        if (id == null) {
            return Mono.error(new AppsmithException(AppsmithError.INVALID_PARAMETER, FieldName.ID));
        }

        // Since policies are a server only concept, first set the empty set (set by constructor) to null
        datasource.setPolicies(null);

        Mono<Datasource> datasourceMono = repository.findById(id)
                .switchIfEmpty(Mono.error(new AppsmithException(AppsmithError.NO_RESOURCE_FOUND, FieldName.DATASOURCE, id)));

        return datasourceMono
                .map(dbDatasource -> {
                    copyNestedNonNullProperties(datasource, dbDatasource);
                    if (datasource.getDatasourceConfiguration() != null && datasource.getDatasourceConfiguration().getAuthentication() == null) {
                        if (dbDatasource.getDatasourceConfiguration() != null) {
                            dbDatasource.getDatasourceConfiguration().setAuthentication(null);
                        }
                    }
                    return dbDatasource;
                })
                .flatMap(this::validateAndSaveDatasourceToRepository)
                .flatMap(this::populateHintMessages);
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
                if (endpoint != null && endpoint.getHost() != null) {
                    endpoint.setHost(endpoint.getHost().trim());
                }
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
        Mono<Datasource> datasourceMono = Mono.just(datasource);
        // Fetch any fields that maybe encrypted from the db if the datasource being tested does not have those fields set.
        // This scenario would happen whenever an existing datasource is being tested and no changes are present in the
        // encrypted field (because encrypted fields are not sent over the network after encryption back to the client
        if (datasource.getId() != null && datasource.getDatasourceConfiguration() != null &&
                datasource.getDatasourceConfiguration().getAuthentication() != null) {
            datasourceMono = getById(datasource.getId())
                    .map(datasource1 -> {
                        BeanCopyUtils.copyNestedNonNullProperties(datasource, datasource1);
                        return datasource1;
                    })
                    .switchIfEmpty(Mono.just(datasource));
        }

        return datasourceMono
                .flatMap(this::validateDatasource)
                .flatMap(this::populateHintMessages)
                .flatMap(datasource1 -> {
                    Mono<DatasourceTestResult> datasourceTestResultMono;
                    if (CollectionUtils.isEmpty(datasource1.getInvalids())) {
                        datasourceTestResultMono = testDatasourceViaPlugin(datasource1);
                    } else {
                        datasourceTestResultMono = Mono.just(new DatasourceTestResult(datasource1.getInvalids()));
                    }

                    return datasourceTestResultMono
                            .map(datasourceTestResult -> {
                                datasourceTestResult.setMessages(datasource1.getMessages());
                                return datasourceTestResult;
                            });
                });
    }

    private Mono<DatasourceTestResult> testDatasourceViaPlugin(Datasource datasource) {
        Mono<PluginExecutor> pluginExecutorMono = pluginExecutorHelper.getPluginExecutor(pluginService.findById(datasource.getPluginId()))
                .switchIfEmpty(Mono.error(new AppsmithException(AppsmithError.NO_RESOURCE_FOUND, FieldName.PLUGIN, datasource.getPluginId())));

        return pluginExecutorMono
                .flatMap(pluginExecutor -> pluginExecutor.testDatasource(datasource.getDatasourceConfiguration()));
    }

    @Override
    public Mono<Datasource> findByNameAndOrganizationId(String name, String organizationId, AclPermission permission) {
        return repository.findByNameAndOrganizationId(name, organizationId, permission);
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
        return repository.findAllByOrganizationId(organizationId, permission)
                .flatMap(this::populateHintMessages);
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
