package com.appsmith.server.solutions.ce;

import com.appsmith.caching.annotations.DistributedLock;
import com.appsmith.server.configurations.CommonConfig;
import com.appsmith.server.helpers.NetworkUtils;
import com.appsmith.server.services.ConfigService;
import com.appsmith.server.services.OrganizationService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.scheduling.annotation.Scheduled;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.lang.reflect.Method;
import java.time.Duration;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;

@ExtendWith(MockitoExtension.class)
class ScheduledTaskCEImplTest {

    @Mock
    private OrganizationService organizationService;

    @Mock
    private ConfigService configService;

    @Mock
    private NetworkUtils networkUtils;

    private final CommonConfig commonConfig = new CommonConfig();

    private ScheduledTaskCEImpl scheduledTask;

    @BeforeEach
    void setUp() {
        // Lenient: the guarded paths must return before touching any of these. If the guard regresses, the
        // ping chain assembles against these stubs and the `never()` verifications below fail on the real cause.
        lenient().when(configService.getInstanceId()).thenReturn(Mono.just("instance-id"));
        lenient().when(networkUtils.getExternalAddress()).thenReturn(Mono.just("203.0.113.10"));
        lenient().when(organizationService.retrieveAll()).thenReturn(Flux.empty());

        scheduledTask = new ScheduledTaskCEImpl(
                configService,
                null, // segmentConfig
                commonConfig,
                null, // workspaceRepository
                null, // applicationRepository
                null, // newPageRepository
                null, // newActionRepository
                null, // datasourceRepository
                null, // userRepository
                null, // projectProperties
                null, // deploymentProperties
                networkUtils,
                null, // permissionGroupService
                organizationService,
                null); // featureFlagService
    }

    @Test
    void pingSchedule_cloudHosting_doesNotPingPerOrganization() {
        commonConfig.setIsTelemetryDisabled(false);
        commonConfig.setIsCloudHosting(true);

        scheduledTask.pingSchedule();

        verify(organizationService, never()).retrieveAll();
    }

    @Test
    void pingSchedule_telemetryDisabled_doesNotPingPerOrganization() {
        commonConfig.setIsTelemetryDisabled(true);
        commonConfig.setIsCloudHosting(false);

        scheduledTask.pingSchedule();

        verify(organizationService, never()).retrieveAll();
    }

    @Test
    void pingSchedule_selfHostedWithTelemetry_pingsPerOrganization() {
        commonConfig.setIsTelemetryDisabled(false);
        commonConfig.setIsCloudHosting(false);

        scheduledTask.pingSchedule();

        verify(organizationService, times(1)).retrieveAll();
    }

    @Test
    void pingSchedule_runsOnceADayAndLockExpiresBeforeTheNextRun() throws NoSuchMethodException {
        Method pingSchedule = ScheduledTaskCEImpl.class.getMethod("pingSchedule");
        long fixedRateMillis = pingSchedule.getAnnotation(Scheduled.class).fixedRate();
        long lockTtlSeconds = pingSchedule.getAnnotation(DistributedLock.class).ttl();

        assertEquals(Duration.ofHours(24).toMillis(), fixedRateMillis);
        assertTrue(
                Duration.ofSeconds(lockTtlSeconds).toMillis() < fixedRateMillis,
                "The lock must expire before the next run, or that run is skipped");
    }
}
