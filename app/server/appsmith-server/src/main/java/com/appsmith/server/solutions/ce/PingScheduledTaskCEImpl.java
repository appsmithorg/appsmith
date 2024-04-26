package com.appsmith.server.solutions.ce;

import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.configurations.CommonConfig;
import com.appsmith.server.configurations.DeploymentProperties;
import com.appsmith.server.configurations.ProjectProperties;
import com.appsmith.server.configurations.SegmentConfig;
import com.appsmith.server.helpers.NetworkUtils;
import com.appsmith.server.repositories.ApplicationRepository;
import com.appsmith.server.repositories.DatasourceRepository;
import com.appsmith.server.repositories.NewActionRepository;
import com.appsmith.server.repositories.NewPageRepository;
import com.appsmith.server.repositories.UserRepository;
import com.appsmith.server.repositories.WorkspaceRepository;
import com.appsmith.server.services.ConfigService;
import com.appsmith.server.services.PermissionGroupService;
import com.appsmith.util.WebClientUtils;
import io.micrometer.observation.annotation.Observed;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.lang3.StringUtils;
import org.springframework.boot.autoconfigure.condition.ConditionalOnExpression;
import org.springframework.http.MediaType;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.web.reactive.function.BodyInserters;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Schedulers;
import reactor.util.function.Tuple6;

import java.util.Map;

import static java.util.Map.entry;

/**
 * This class represents a scheduled task that pings a data point indicating that this server installation is live.
 * This ping is only invoked if the Appsmith server is NOT running in Appsmith Cloud & the user has given Appsmith
 * permissions to collect anonymized data
 */
@Slf4j
@RequiredArgsConstructor
@ConditionalOnExpression("!${is.cloud-hosting:false}")
public class PingScheduledTaskCEImpl implements PingScheduledTaskCE {

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

    /**
     * Gets the external IP address of this server and pings a data point to indicate that this server instance is live.
     * We use an initial delay of two minutes to roughly wait for the application along with the migrations are finished
     * and ready.
     */
    // Number of milliseconds between the start of each scheduled calls to this method.
    @Scheduled(initialDelay = 2 * 60 * 1000 /* two minutes */, fixedRate = 6 * 60 * 60 * 1000 /* six hours */)
    @Observed(name = "pingSchedule")
    public void pingSchedule() {
        if (commonConfig.isTelemetryDisabled()) {
            return;
        }

        Mono.zip(configService.getInstanceId(), networkUtils.getExternalAddress())
                .flatMap(tuple -> doPing(tuple.getT1(), tuple.getT2()))
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
    private Mono<String> doPing(String instanceId, String ipAddress) {
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
                        Map.of("instanceId", instanceId),
                        "event",
                        "Instance Active")))
                .retrieve()
                .bodyToMono(String.class);
    }

    // Number of milliseconds between the start of each scheduled calls to this method.
    @Scheduled(initialDelay = 2 * 60 * 1000 /* two minutes */, fixedRate = 24 * 60 * 60 * 1000 /* a day */)
    @Observed(name = "pingStats")
    public void pingStats() {
        if (commonConfig.isTelemetryDisabled()) {
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

        Mono<Tuple6<Long, Long, Long, Long, Long, Long>> nonDeletedObjectsCountMono = Mono.zip(
                workspaceRepository.countByDeletedAtNull().defaultIfEmpty(0L),
                applicationRepository.countByDeletedAtNull().defaultIfEmpty(0L),
                newPageRepository.countByDeletedAtNull().defaultIfEmpty(0L),
                newActionRepository.countByDeletedAtNull().defaultIfEmpty(0L),
                datasourceRepository.countByDeletedAtNull().defaultIfEmpty(0L),
                userCountMono);

        publicPermissionGroupIdMono
                .flatMap(publicPermissionGroupId -> Mono.zip(
                        configService.getInstanceId().defaultIfEmpty("null"),
                        networkUtils.getExternalAddress(),
                        nonDeletedObjectsCountMono,
                        applicationRepository.getAllApplicationsCountAccessibleToARoleWithPermission(
                                AclPermission.READ_APPLICATIONS, publicPermissionGroupId)))
                .flatMap(statsData -> {
                    Map<String, String> propertiesMap = Map.ofEntries(
                            entry("instanceId", statsData.getT1()),
                            entry("numOrgs", statsData.getT3().getT1().toString()),
                            entry("numApps", statsData.getT3().getT2().toString()),
                            entry("numPages", statsData.getT3().getT3().toString()),
                            entry("numActions", statsData.getT3().getT4().toString()),
                            entry("numDatasources", statsData.getT3().getT5().toString()),
                            entry("numUsers", statsData.getT3().getT6().toString()),
                            entry("numPublicApps", statsData.getT4().toString()),
                            entry("version", projectProperties.getVersion()),
                            entry("edition", deploymentProperties.getEdition()),
                            entry("cloudProvider", deploymentProperties.getCloudProvider()),
                            entry("efs", deploymentProperties.getEfs()),
                            entry("tool", deploymentProperties.getTool()),
                            entry("hostname", deploymentProperties.getHostname()),
                            entry("deployedAt", deploymentProperties.getDeployedAt()));

                    final String ipAddress = statsData.getT2();
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
}
