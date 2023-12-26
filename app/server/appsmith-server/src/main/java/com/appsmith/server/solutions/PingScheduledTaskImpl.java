package com.appsmith.server.solutions;

import com.appsmith.server.configurations.CommonConfig;
import com.appsmith.server.configurations.ProjectProperties;
import com.appsmith.server.configurations.SegmentConfig;
import com.appsmith.server.helpers.NetworkUtils;
import com.appsmith.server.repositories.cakes.ApplicationRepositoryCake;
import com.appsmith.server.repositories.cakes.DatasourceRepositoryCake;
import com.appsmith.server.repositories.cakes.NewActionRepositoryCake;
import com.appsmith.server.repositories.cakes.NewPageRepositoryCake;
import com.appsmith.server.repositories.cakes.UserRepositoryCake;
import com.appsmith.server.repositories.cakes.WorkspaceRepositoryCake;
import com.appsmith.server.services.ConfigService;
import com.appsmith.server.services.PermissionGroupService;
import com.appsmith.server.solutions.ce.PingScheduledTaskCEImpl;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnExpression;
import org.springframework.stereotype.Component;

/**
 * This class represents a scheduled task that pings a data point indicating that this server installation is live.
 * This ping is only invoked if the Appsmith server is NOT running in Appsmith Clouud & the user has given Appsmith
 * permissions to collect anonymized data
 */
@ConditionalOnExpression("!${is.cloud-hosting:false}")
@Slf4j
@Component
public class PingScheduledTaskImpl extends PingScheduledTaskCEImpl implements PingScheduledTask {

    public PingScheduledTaskImpl(
            ConfigService configService,
            SegmentConfig segmentConfig,
            CommonConfig commonConfig,
            WorkspaceRepositoryCake workspaceRepository,
            ApplicationRepositoryCake applicationRepository,
            NewPageRepositoryCake newPageRepository,
            NewActionRepositoryCake newActionRepository,
            DatasourceRepositoryCake datasourceRepository,
            UserRepositoryCake userRepository,
            ProjectProperties projectProperties,
            NetworkUtils networkUtils,
            PermissionGroupService permissionGroupService) {

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
                networkUtils,
                permissionGroupService);
    }
}
