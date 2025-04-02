package com.appsmith.server.solutions;

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
import com.appsmith.server.services.FeatureFlagService;
import com.appsmith.server.services.OrganizationService;
import com.appsmith.server.services.PermissionGroupService;
import com.appsmith.server.solutions.ce.ScheduledTaskCEImpl;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;

/**
 * This class represents a scheduled task that pings a data point indicating that this server installation is live.
 * This ping is only invoked if the Appsmith server is NOT running in Appsmith Clouud & the user has given Appsmith
 * permissions to collect anonymized data
 */
@Slf4j
@Component
@Profile("!test")
public class ScheduledTaskImpl extends ScheduledTaskCEImpl implements ScheduledTask {

    public ScheduledTaskImpl(
        ConfigService configService,
        SegmentConfig segmentConfig,
        CommonConfig commonConfig,
        WorkspaceRepository workspaceRepository,
        ApplicationRepository applicationRepository,
        NewPageRepository newPageRepository,
        NewActionRepository newActionRepository,
        DatasourceRepository datasourceRepository,
        UserRepository userRepository,
        ProjectProperties projectProperties,
        DeploymentProperties deploymentProperties,
        NetworkUtils networkUtils,
        PermissionGroupService permissionGroupService,
        OrganizationService organizationService,
        FeatureFlagService featureFlagService) {
        super(
                configService,
                segmentConfig,
                commonConfig,
                workspaceRepository,
                applicationRepository,
                newPageRepository,
                newActionRepository,
                datasourceRepository,
                userRepository,
                projectProperties,
                deploymentProperties,
                networkUtils,
                permissionGroupService,
                organizationService,
                featureFlagService);
    }
}
