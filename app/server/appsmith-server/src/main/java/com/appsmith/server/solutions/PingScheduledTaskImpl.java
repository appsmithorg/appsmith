package com.appsmith.server.solutions;

import com.appsmith.server.configurations.CommonConfig;
import com.appsmith.server.configurations.LicenseConfig;
import com.appsmith.server.configurations.SegmentConfig;
import com.appsmith.server.repositories.ApplicationRepository;
import com.appsmith.server.repositories.DatasourceRepository;
import com.appsmith.server.repositories.NewActionRepository;
import com.appsmith.server.repositories.NewPageRepository;
import com.appsmith.server.repositories.UserRepository;
import com.appsmith.server.repositories.WorkspaceRepository;
import com.appsmith.server.services.ConfigService;
import com.appsmith.server.services.TenantService;
import com.appsmith.server.solutions.ce.PingScheduledTaskCEImpl;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnExpression;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import reactor.core.scheduler.Schedulers;

/**
 * This class represents a scheduled task that pings a data point indicating that this server installation is live.
 * This ping is only invoked if the Appsmith server is NOT running in Appsmith Cloud
 */
@ConditionalOnExpression("!${is.cloud-hosting:false}")
@Slf4j
@Component
public class PingScheduledTaskImpl extends PingScheduledTaskCEImpl implements PingScheduledTask {

    private final LicenseValidator licenseValidator;
    private final TenantService tenantService;
    private final LicenseConfig licenseConfig;

    public PingScheduledTaskImpl(
            ConfigService configService,
            SegmentConfig segmentConfig,
            CommonConfig commonConfig,
            WorkspaceRepository workspaceRepository,
            ApplicationRepository applicationRepository,
            NewPageRepository newPageRepository,
            NewActionRepository newActionRepository,
            DatasourceRepository datasourceRepository,
            UserRepository userRepository,
            LicenseValidator licenseValidator,
            TenantService tenantService, LicenseConfig licenseConfig) {

        super(
                configService,
                segmentConfig,
                commonConfig,
                workspaceRepository,
                applicationRepository,
                newPageRepository,
                newActionRepository,
                datasourceRepository,
                userRepository
        );
        this.licenseValidator = licenseValidator;
        this.tenantService = tenantService;
        this.licenseConfig = licenseConfig;
    }

    @Scheduled(initialDelay = 2 * 60 * 1000 /* two minutes */, fixedRate = 12 * 60 * 60 * 1000 /* twelve hours */)
    public void licenseCheck() {
        licenseValidator.check();
    }

    @Scheduled(initialDelay =  3 * 60 * 1000 /* three minutes */, fixedRate = 1 * 60 * 60 * 1000 /* one hour */)
    public void newLicenseCheck() {
        // Only run scheduled tasks with feature flag
        // TODO: Remove this check when usage and billing feature is ready to ship
        Boolean licenseDbEnabled = licenseConfig.getLicenseDbEnabled();
        if (licenseDbEnabled) {
            log.debug("Initiating Periodic License Check");
            tenantService.checkAndUpdateDefaultTenantLicense()
                    .subscribeOn(Schedulers.boundedElastic())
                    .block();
        }
    }
}
