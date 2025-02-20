package com.appsmith.server.services;

import com.appsmith.server.configurations.CommonConfig;
import com.appsmith.server.repositories.UsagePulseRepository;
import com.appsmith.server.repositories.cakes.UsagePulseRepositoryCake;
import com.appsmith.server.services.ce.UsagePulseServiceCEImpl;
import org.springframework.stereotype.Service;

@Service
public class UsagePulseServiceImpl extends UsagePulseServiceCEImpl implements UsagePulseService {

    public UsagePulseServiceImpl(
            UsagePulseRepository repositoryDirect,
            UsagePulseRepositoryCake repository,
            SessionUserService sessionUserService,
            UserService userService,
            OrganizationService organizationService,
            ConfigService configService,
            CommonConfig commonConfig) {
        super(repository, sessionUserService, userService, organizationService, configService, commonConfig);
    }
}
