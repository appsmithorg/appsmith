package com.appsmith.server.services;

import com.appsmith.server.configurations.CommonConfig;
import com.appsmith.server.repositories.UsagePulseRepository;
import com.appsmith.server.services.ce.UsagePulseServiceCEImpl;
import org.springframework.stereotype.Service;

@Service
public class UsagePulseServiceImpl extends UsagePulseServiceCEImpl implements UsagePulseService {

    public UsagePulseServiceImpl(UsagePulseRepository repository,
                                 SessionUserService sessionUserService,
                                 UserService userService,
                                 TenantService tenantService,
                                 ConfigService configService,
                                 CommonConfig commonConfig) {
        super(repository, sessionUserService, userService, tenantService, configService, commonConfig);
    }

}
