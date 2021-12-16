package com.appsmith.server.solutions;

import com.appsmith.server.configurations.CloudServicesConfig;
import com.appsmith.server.configurations.CommonConfig;
import com.appsmith.server.configurations.ProjectProperties;
import com.appsmith.server.configurations.SegmentConfig;
import com.appsmith.server.services.ConfigService;
import com.appsmith.server.solutions.ce.ReleaseNotesServiceCEImpl;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;


@Service
@Slf4j
public class ReleaseNotesServiceImpl extends ReleaseNotesServiceCEImpl implements ReleaseNotesService {

    public ReleaseNotesServiceImpl(CloudServicesConfig cloudServicesConfig,
                                   SegmentConfig segmentConfig,
                                   ConfigService configService,
                                   ProjectProperties projectProperties,
                                   CommonConfig commonConfig) {

        super(cloudServicesConfig, segmentConfig, configService, projectProperties, commonConfig);
    }
}
