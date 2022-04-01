package com.appsmith.server.solutions;

import com.appsmith.server.configurations.CommonConfig;
import com.appsmith.server.configurations.SegmentConfig;
import com.appsmith.server.repositories.ApplicationRepository;
import com.appsmith.server.repositories.DatasourceRepository;
import com.appsmith.server.repositories.NewActionRepository;
import com.appsmith.server.repositories.NewPageRepository;
import com.appsmith.server.repositories.OrganizationRepository;
import com.appsmith.server.repositories.UserRepository;
import com.appsmith.server.services.ConfigService;
import com.appsmith.server.solutions.ce.PingScheduledTaskCEImpl;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnExpression;
import org.springframework.stereotype.Component;

/**
 * This class represents a scheduled task that pings a data point indicating that this server installation is live.
 * This ping is only invoked if the Appsmith server is NOT running in Appsmith Clouud & the user has given Appsmith
 * permissions to collect anonymized data
 */
@ConditionalOnExpression("!${is.cloud-hosted:false}")
@Slf4j
@Component
public class PingScheduledTaskImpl extends PingScheduledTaskCEImpl implements PingScheduledTask {

    public PingScheduledTaskImpl(
            ConfigService configService,
            SegmentConfig segmentConfig,
            CommonConfig commonConfig,
            OrganizationRepository organizationRepository,
            ApplicationRepository applicationRepository,
            NewPageRepository newPageRepository,
            NewActionRepository newActionRepository,
            DatasourceRepository datasourceRepository,
            UserRepository userRepository
    ) {

        super(
                configService,
                segmentConfig,
                commonConfig,
                organizationRepository,
                applicationRepository,
                newPageRepository,
                newActionRepository,
                datasourceRepository,
                userRepository
        );
    }
}
