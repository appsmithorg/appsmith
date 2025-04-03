package com.appsmith.server.helpers.ce;

import com.appsmith.external.constants.AnalyticsEvents;
import com.appsmith.external.services.RTSCaller;
import com.appsmith.server.configurations.CloudServicesConfig;
import com.appsmith.server.configurations.CommonConfig;
import com.appsmith.server.constants.Appsmith;
import com.appsmith.server.constants.ce.FieldNameCE;
import com.appsmith.server.domains.Config;
import com.appsmith.server.dtos.ResponseDTO;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.helpers.LoadShifter;
import com.appsmith.server.helpers.NetworkUtils;
import com.appsmith.server.services.AnalyticsService;
import com.appsmith.server.services.ConfigService;
import com.appsmith.server.services.FeatureFlagService;
import com.appsmith.server.services.OrganizationService;
import com.appsmith.server.solutions.ReleaseNotesService;
import com.appsmith.util.WebClientUtils;
import joptsimple.internal.Strings;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.bson.Document;
import org.springframework.boot.SpringApplication;
import org.springframework.context.ApplicationContext;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.data.mongodb.core.ReactiveMongoTemplate;
import org.springframework.http.HttpHeaders;
import org.springframework.util.StringUtils;
import org.springframework.web.reactive.function.BodyInserters;
import reactor.core.publisher.Mono;

import java.util.HashMap;
import java.util.LinkedList;
import java.util.List;
import java.util.Map;
import java.util.Objects;

import static com.appsmith.server.constants.ce.FieldNameCE.ORGANIZATION_ID;

@RequiredArgsConstructor
@Slf4j
public class InstanceConfigHelperCEImpl implements InstanceConfigHelperCE {

    private final ConfigService configService;

    private final CloudServicesConfig cloudServicesConfig;

    private final CommonConfig commonConfig;

    private final ApplicationContext applicationContext;

    private final ReactiveMongoTemplate reactiveMongoTemplate;

    private final FeatureFlagService featureFlagService;
    private final AnalyticsService analyticsService;
    private final NetworkUtils networkUtils;
    private final ReleaseNotesService releaseNotesService;
    private final RTSCaller rtsCaller;
    private final OrganizationService organizationService;

    private boolean isRtsAccessible = false;

    @Override
    public Mono<? extends Config> registerInstance() {

        final String baseUrl = cloudServicesConfig.getBaseUrl();
        if (baseUrl == null || StringUtils.isEmpty(baseUrl)) {
            return Mono.error(new AppsmithException(
                    AppsmithError.INSTANCE_REGISTRATION_FAILURE, "Unable to find cloud services base URL"));
        }
        Mono<String> instanceIdMono = configService.getInstanceId().cache();

        return instanceIdMono
                .flatMap(instanceId -> {
                    log.debug("Triggering registration of this instance...");

                    return WebClientUtils.create(baseUrl + "/api/v1/installations")
                            .post()
                            .body(BodyInserters.fromValue(Map.of("key", instanceId)))
                            .headers(httpHeaders -> httpHeaders.set(HttpHeaders.CONTENT_TYPE, "application/json"))
                            .exchange();
                })
                .flatMap(clientResponse ->
                        clientResponse.toEntity(new ParameterizedTypeReference<ResponseDTO<String>>() {}))
                .flatMap(responseEntity -> {
                    if (responseEntity.getStatusCode().is2xxSuccessful()) {
                        return Mono.justOrEmpty(
                                Objects.requireNonNull(responseEntity.getBody()).getData());
                    }
                    return Mono.error(new AppsmithException(
                            AppsmithError.INSTANCE_REGISTRATION_FAILURE,
                            Objects.requireNonNull(responseEntity.getBody())
                                    .getResponseMeta()
                                    .getError()
                                    .getMessage()));
                })
                .flatMap(registeredInstanceId -> {
                    log.debug("Registration successful, updating state ...");
                    return instanceIdMono.flatMap(instanceId -> configService
                            .getByName(Appsmith.APPSMITH_REGISTERED)
                            .switchIfEmpty(Mono.defer(() -> {
                                sendServerSetupEvent(instanceId);
                                return Mono.just(new Config());
                            }))
                            .flatMap(config -> {
                                // if instance isn't already marked registered
                                if (config.getConfig() != null
                                        && !(Boolean) config.getConfig().get("value")) {
                                    sendServerSetupEvent(instanceId);
                                }
                                return configService.save(Appsmith.APPSMITH_REGISTERED, Map.of("value", true));
                            }));
                });
    }

    private void sendServerSetupEvent(String instanceId) {
        Map<String, Object> analyticsProperties = new HashMap<>();
        analyticsProperties.put(FieldNameCE.INSTANCE_ID, instanceId);
        networkUtils
                .getExternalAddress()
                .flatMap(ipAddress -> {
                    analyticsProperties.put(FieldNameCE.IP_ADDRESS, ipAddress);
                    analyticsProperties.put(FieldNameCE.VERSION, releaseNotesService.getRunningVersion());
                    return analyticsService.sendEvent(
                            AnalyticsEvents.SERVER_SETUP_COMPLETE.getEventName(),
                            instanceId,
                            analyticsProperties,
                            false);
                })
                .subscribeOn(LoadShifter.elasticScheduler)
                .subscribe();
    }

    @Override
    public Mono<Config> checkInstanceSchemaVersion() {
        return configService
                .getByName(Appsmith.INSTANCE_SCHEMA_VERSION)
                .switchIfEmpty(Mono.error(new AppsmithException(AppsmithError.SCHEMA_VERSION_NOT_FOUND_ERROR)))
                .onErrorMap(
                        AppsmithException.class,
                        e -> new AppsmithException(AppsmithError.SCHEMA_VERSION_NOT_FOUND_ERROR))
                .flatMap(config -> {
                    if (CommonConfig.LATEST_INSTANCE_SCHEMA_VERSION
                            == config.getConfig().get("value")) {
                        return Mono.just(config);
                    }
                    return Mono.error(populateSchemaMismatchError(
                            (Integer) config.getConfig().get("value")));
                })
                .doOnError(errorSignal -> {
                    log.error(
                            """

                                    ################################################
                                    Error while trying to start up Appsmith instance:\s
                                    {}
                                    ################################################
                                    """,
                            errorSignal.getMessage());

                    SpringApplication.exit(applicationContext, () -> 1);
                    System.exit(1);
                });
    }

    private AppsmithException populateSchemaMismatchError(Integer currentInstanceSchemaVersion) {

        List<String> versions = new LinkedList<>();
        List<String> docs = new LinkedList<>();

        // Keep adding version numbers that brought in breaking instance schema migrations here
        switch (currentInstanceSchemaVersion) {
                // Example, we expect that in v1.9.2, all instances will have been migrated to instanceSchemaVer 2
            case 1:
                versions.add("v1.9.2");
                docs.add(
                        "https://docs.appsmith.com/help-and-support/troubleshooting-guide/deployment-errors#server-shuts-down-with-schema-mismatch-error");
            default:
        }

        return new AppsmithException(AppsmithError.SCHEMA_MISMATCH_ERROR, versions, docs);
    }

    public Mono<Void> performRtsHealthCheck() {
        log.debug("Performing RTS health check of this instance...");

        return rtsCaller
                .get("/rts-api/v1/health-check")
                .flatMap((spec) -> spec.retrieve().toBodilessEntity())
                .doOnNext(nextSignal -> {
                    log.debug("RTS health check succeeded");
                    this.isRtsAccessible = true;
                })
                .onErrorResume(errorSignal -> {
                    log.debug("RTS health check failed with error: \n{}", errorSignal.getMessage());
                    return Mono.empty();
                })
                .then();
    }

    @Override
    public boolean getIsRtsAccessible() {
        return this.isRtsAccessible;
    }

    @Override
    public Mono<Boolean> isLicenseValid() {
        // As CE edition doesn't require license, default state should be valid
        return Mono.just(true);
    }

    @Override
    public Mono<String> checkMongoDBVersion() {
        return reactiveMongoTemplate
                .executeCommand(new Document("buildInfo", 1))
                .map(buildInfo -> {
                    commonConfig.setMongoDBVersion(buildInfo.getString("version"));
                    log.info("Fetched and set conenncted mongo db version as: {}", commonConfig.getMongoDBVersion());
                    return commonConfig.getMongoDBVersion();
                })
                .onErrorResume(error -> {
                    log.error(
                            "Error while getting mongo db version. Hence current mongo db version will remain unavailable in context",
                            error);
                    return Mono.just(Strings.EMPTY);
                });
    }

    /**
     * Method to trigger update for the organization feature flags. This method is called during the startup of
     * the application. It's required at the startup to ensure that the feature flags are up-to-date which will then be
     * consumed by {@link com.appsmith.server.aspect.FeatureFlaggedMethodInvokerAspect} in a non-reactive manner.
     * In case the user tries to fetch the feature flags before the cache is updated, the aspect will fallback to the
     * earlier cached data i.e. disabled state.
     * @return  Empty Mono
     */
    @Override
    public Mono<Void> updateCacheForOrganizationFeatureFlags() {
        // TODO @CloudBilling: Fix this to update feature flags for all organizations and also should not affect the
        //  startup
        return organizationService
                .retrieveAll()
                .flatMap(org -> featureFlagService
                        .getOrganizationFeatures(org.getId())
                        .contextWrite(ctx -> ctx.put(ORGANIZATION_ID, org.getId())))
                .onErrorResume(error -> {
                    log.error("Error while updating cache for org feature flags", error);
                    return Mono.empty();
                })
                .then();
    }
}
