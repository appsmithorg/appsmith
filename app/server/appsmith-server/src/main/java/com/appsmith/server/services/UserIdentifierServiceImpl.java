package com.appsmith.server.services;

import com.appsmith.server.configurations.CommonConfig;
import com.appsmith.server.services.ce.UserIdentifierServiceCEImpl;
import org.springframework.stereotype.Service;

@Service
public class UserIdentifierServiceImpl extends UserIdentifierServiceCEImpl implements UserIdentifierService {
    public UserIdentifierServiceImpl(CommonConfig commonConfig) {
        super(commonConfig);
    }
}
