package com.appsmith.server.helpers;

import com.appsmith.server.configurations.CloudServicesConfig;
import com.appsmith.server.configurations.CommonConfig;
import com.appsmith.server.configurations.ProjectProperties;
import com.appsmith.server.configurations.SegmentConfig;
import com.appsmith.server.helpers.ce.ReleaseNotesUtilsCEImpl;
import com.appsmith.server.services.ConfigService;
import org.springframework.stereotype.Component;

@Component
public class ReleaseNotesUtilsImpl extends ReleaseNotesUtilsCEImpl implements ReleaseNotesUtils {
    public ReleaseNotesUtilsImpl(
            CloudServicesConfig cloudServicesConfig,
            CommonConfig commonConfig,
            SegmentConfig segmentConfig,
            ConfigService configService,
            ProjectProperties projectProperties) {

        super(cloudServicesConfig, commonConfig, segmentConfig, configService, projectProperties);
    }
}
