package com.appsmith.server.solutions.ce;

import com.appsmith.caching.annotations.DistributedLock;
import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.configurations.CommonConfig;
import com.appsmith.server.configurations.DeploymentProperties;
import com.appsmith.server.configurations.ProjectProperties;
import com.appsmith.server.configurations.SegmentConfig;
import com.appsmith.server.domains.Organization;
import com.appsmith.server.helpers.LoadShifter;
import com.appsmith.server.helpers.NetworkUtils;
import com.appsmith.server.repositories.ApplicationRepository;
import com.appsmith.server.repositories.DatasourceRepository;
import com.appsmith.server.repositories.NewActionRepository;
import com.appsmith.server.repositories.NewPageRepository;
import com.appsmith.server.repositories.UserRepository;
import com.appsmith.server.repositories.WorkspaceRepository;
import com.appsmith.server.services.ConfigService;
import com.appsmith.server.services.FeatureFlagService;
import com.appsmith.server.services.OrganizationService;
import com.appsmith.server.services.PermissionGroupService;
import com.appsmith.util.WebClientUtils;
import io.micrometer.observation.annotation.Observed;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.lang3.StringUtils;
import org.springframework.http.MediaType;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.web.reactive.function.BodyInserters;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Schedulers;
import reactor.util.context.Context;
import reactor.util.function.Tuple7;

import java.time.Duration;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Map;

import static com.appsmith.external.constants.AnalyticsConstants.ADMIN_EMAIL_DOMAIN_HASH;
import static com.appsmith.external.constants.AnalyticsConstants.EMAIL_DOMAIN_HASH;
import static com.appsmith.server.constants.ce.FieldNameCE.ORGANIZATION_ID;
import static java.util.Map.entry;
import static org.apache.commons.lang3.StringUtils.defaultIfEmpty;

/**
 * This class represents a scheduled task that pings a data point indicating that this server installation is live.
 * This ping is only invoked if the Appsmith server is NOT running in Appsmith Cloud & the user has given Appsmith
 * permissions to collect anonymized data
 */
@Slf4j
@RequiredArgsConstructor
public class ScheduledTaskCEImpl implements ScheduledTaskCE {

    private final ConfigService configService;
    private final SegmentConfig segmentConfig;
    private final CommonConfig commonConfig;

    private final WorkspaceRepository workspaceRepository;
    private final ApplicationRepository applicationRepository;
    private final NewPageRepository newPageRepository;
    private final NewActionRepository newActionRepository;
    private final DatasourceRepository datasourceRepository;
    private final UserRepository userRepository;
    private final ProjectProperties projectProperties;
    private final DeploymentProperties deploymentProperties;
    private final NetworkUtils networkUtils;
    private final PermissionGroupService permissionGroupService;
    private final OrganizationService organizationService;
    private final FeatureFlagService featureFlagService;

    // Delay to avoid 429 between the analytics call.
    protected static final Duration DELAY_BETWEEN_PINGS = Duration.ofMillis(200);

    enum UserTrackingType {
        DAU,
        WAU,
        MAU
    }

    /**
     * Gets the external IP address of this server and pings a data point to indicate that this server instance is live.
     * We use an initial delay of two minutes to roughly wait for the application along with the migrations are finished
     * and ready.
     */
    // Number of milliseconds between the start of each scheduled calls to this method.
    @Scheduled(initialDelay = 2 * 60 * 1000 /* two minutes */, fixedRate = 6 * 60 * 60 * 1000 /* six hours */)
    @DistributedLock(
            key = "pingSchedule",
            ttl = 5 * 60 * 60, // 5 hours
            shouldReleaseLock = false)
    @Observed(name = "pingSchedule")
    public void pingSchedule() {
        if (commonConfig.isTelemetryDisabled()) {
            return;
        }

        Mono<String> instanceMono = configService.getInstanceId().cache();
        Mono<String> ipMono = networkUtils.getExternalAddress().cache();
        organizationService
                .retrieveAll()
                .delayElements(DELAY_BETWEEN_PINGS)
                .flatMap(organization -> Mono.zip(Mono.just(organization.getId()), instanceMono, ipMono))
                .flatMap(objects -> doPing(objects.getT1(), objects.getT2(), objects.getT3()))
                .subscribeOn(Schedulers.single())
                .subscribe();
    }

    /**
     * Given a unique ID (called a `userId` here), this method hits the Segment API to save a data point on this server
     * instance being live.
     *
     * @param instanceId A unique identifier for this server instance, usually generated at the server's first start.
     * @param ipAddress  The external IP address of this instance's machine.
     * @return A publisher that yields the string response of recording the data point.
     */
    private Mono<String> doPing(String organizationId, String instanceId, String ipAddress) {
        // Note: Hard-coding Segment auth header and the event name intentionally. These are not intended to be
        // environment specific values, instead, they are common values for all self-hosted environments. As such, they
        // are not intended to be configurable.
        final String ceKey = segmentConfig.getCeKey();
        if (StringUtils.isEmpty(ceKey)) {
            log.error("The segment ce key is null");
            return Mono.empty();
        }

        return WebClientUtils.create("https://api.segment.io")
                .post()
                .uri("/v1/track")
                .headers(headers -> headers.setBasicAuth(ceKey, ""))
                .contentType(MediaType.APPLICATION_JSON)
                .body(BodyInserters.fromValue(Map.of(
                        "userId",
                        instanceId,
                        "context",
                        Map.of("ip", ipAddress),
                        "properties",
                        Map.of("instanceId", instanceId, "organizationId", organizationId),
                        "event",
                        "Instance Active")))
                .retrieve()
                .bodyToMono(String.class);
    }

    // Number of milliseconds between the start of each scheduled calls to this method.
    @Scheduled(initialDelay = 2 * 60 * 1000 /* two minutes */, fixedRate = 24 * 60 * 60 * 1000 /* a day */)
    @DistributedLock(key = "pingStats", ttl = 12 * 60 * 60, shouldReleaseLock = false)
    @Observed(name = "pingStats")
    public void pingStats() {
        // TODO @CloudBilling remove cloud hosting check and migrate the cron to report organization level stats
        if (commonConfig.isTelemetryDisabled() || commonConfig.isCloudHosting()) {
            return;
        }

        final String ceKey = segmentConfig.getCeKey();
        if (StringUtils.isEmpty(ceKey)) {
            log.error("The segment ce key is null");
            return;
        }

        Mono<String> publicPermissionGroupIdMono = permissionGroupService.getPublicPermissionGroupId();

        // Get the non-system generated active user count
        Mono<Long> userCountMono = userRepository
                .countByDeletedAtIsNullAndIsSystemGeneratedIsNot(true)
                .defaultIfEmpty(0L);

        Mono<Tuple7<Long, Long, Long, Long, Long, Long, Map<String, Long>>> nonDeletedObjectsCountMono = Mono.zip(
                workspaceRepository.countByDeletedAtNull().defaultIfEmpty(0L),
                applicationRepository.countByDeletedAtNull().defaultIfEmpty(0L),
                newPageRepository.countByDeletedAtNull().defaultIfEmpty(0L),
                newActionRepository.countByDeletedAtNull().defaultIfEmpty(0L),
                datasourceRepository.countByDeletedAtNull().defaultIfEmpty(0L),
                userCountMono,
                getUserTrackingDetails());

        organizationService
                .retrieveAll()
                .delayElements(DELAY_BETWEEN_PINGS)
                .map(Organization::getId)
                .zipWith(publicPermissionGroupIdMono)
                .flatMap(tuple2 -> {
                    final String organizationId = tuple2.getT1();
                    final String publicPermissionGroupId = tuple2.getT2();
                    return Mono.zip(
                            configService.getInstanceId().defaultIfEmpty("null"),
                            Mono.just(organizationId),
                            networkUtils.getExternalAddress(),
                            nonDeletedObjectsCountMono,
                            applicationRepository.getAllApplicationsCountAccessibleToARoleWithPermission(
                                    AclPermission.READ_APPLICATIONS, publicPermissionGroupId));
                })
                .flatMap(statsData -> {
                    Map<String, Object> propertiesMap = new java.util.HashMap<>(Map.ofEntries(
                            entry("instanceId", statsData.getT1()),
                            entry("organizationId", statsData.getT2()),
                            entry("numOrgs", statsData.getT4().getT1()),
                            entry("numApps", statsData.getT4().getT2()),
                            entry("numPages", statsData.getT4().getT3()),
                            entry("numActions", statsData.getT4().getT4()),
                            entry("numDatasources", statsData.getT4().getT5()),
                            entry("numUsers", statsData.getT4().getT6()),
                            entry("numPublicApps", statsData.getT5()),
                            entry("version", projectProperties.getVersion()),
                            entry("edition", deploymentProperties.getEdition()),
                            entry("cloudProvider", defaultIfEmpty(deploymentProperties.getCloudProvider(), "")),
                            entry("efs", defaultIfEmpty(deploymentProperties.getEfs(), "")),
                            entry("tool", defaultIfEmpty(deploymentProperties.getTool(), "")),
                            entry("hostname", defaultIfEmpty(deploymentProperties.getHostname(), "")),
                            entry("deployedAt", defaultIfEmpty(deploymentProperties.getDeployedAt(), "")),
                            entry(ADMIN_EMAIL_DOMAIN_HASH, commonConfig.getAdminEmailDomainHash()),
                            entry(EMAIL_DOMAIN_HASH, commonConfig.getAdminEmailDomainHash())));

                    propertiesMap.putAll(statsData.getT4().getT7());

                    final String ipAddress = statsData.getT3();
                    return WebClientUtils.create("https://api.segment.io")
                            .post()
                            .uri("/v1/track")
                            .headers(headers -> headers.setBasicAuth(ceKey, ""))
                            .contentType(MediaType.APPLICATION_JSON)
                            .body(BodyInserters.fromValue(Map.of(
                                    "userId",
                                    statsData.getT1(),
                                    "context",
                                    Map.of("ip", ipAddress),
                                    "properties",
                                    propertiesMap,
                                    "event",
                                    "instance_stats")))
                            .retrieve()
                            .bodyToMono(String.class);
                })
                .doOnError(error -> log.error("Error sending anonymous counts {0}", error))
                .subscribeOn(Schedulers.boundedElastic())
                .subscribe();
    }

    private Mono<Map<String, Long>> getUserTrackingDetails() {

        Mono<Long> dauCountMono = userRepository
                .countByDeletedAtIsNullAndLastActiveAtGreaterThanAndIsSystemGeneratedIsNot(
                        Instant.now().minus(1, ChronoUnit.DAYS), true)
                .defaultIfEmpty(0L);
        Mono<Long> wauCountMono = userRepository
                .countByDeletedAtIsNullAndLastActiveAtGreaterThanAndIsSystemGeneratedIsNot(
                        Instant.now().minus(7, ChronoUnit.DAYS), true)
                .defaultIfEmpty(0L);
        Mono<Long> mauCountMono = userRepository
                .countByDeletedAtIsNullAndLastActiveAtGreaterThanAndIsSystemGeneratedIsNot(
                        Instant.now().minus(30, ChronoUnit.DAYS), true)
                .defaultIfEmpty(0L);

        return Mono.zip(dauCountMono, wauCountMono, mauCountMono)
                .map(tuple -> Map.of(
                        UserTrackingType.DAU.name(), tuple.getT1(),
                        UserTrackingType.WAU.name(), tuple.getT2(),
                        UserTrackingType.MAU.name(), tuple.getT3()));
    }

    @Scheduled(initialDelay = 10 * 1000 /* ten seconds */, fixedRate = 30 * 60 * 1000 /* thirty minutes */)
    @DistributedLock(
            key = "fetchFeatures",
            ttl = 20 * 60, // 20 minutes
            shouldReleaseLock = false) // Ensure only one pod executes this
    @Observed(name = "fetchFeatures")
    public void fetchFeatures() {
        log.info("Fetching features for organizations");
        organizationService
                .retrieveAll()
                .delayElements(DELAY_BETWEEN_PINGS)
                .flatMap(organization -> featureFlagService
                        .getAllRemoteFeaturesForOrganizationAndUpdateFeatureFlagsWithPendingMigrations(organization)
                        .flatMap(featureFlagService::checkAndExecuteMigrationsForOrganizationFeatureFlags)
                        .onErrorResume(error -> {
                            log.error("Error while fetching organization feature flags", error);
                            return Mono.empty();
                        })
                        .contextWrite(Context.of(ORGANIZATION_ID, organization.getId())))
                .subscribeOn(LoadShifter.elasticScheduler)
                .subscribe();
    }
}
