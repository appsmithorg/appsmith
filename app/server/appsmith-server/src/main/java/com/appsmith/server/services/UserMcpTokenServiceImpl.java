package com.appsmith.server.services;

import com.appsmith.server.repositories.UserMcpTokenRepository;
import com.appsmith.server.repositories.UserRepository;
import com.appsmith.server.services.ce.UserMcpTokenServiceCEImpl;
import org.springframework.stereotype.Service;

@Service
public class UserMcpTokenServiceImpl extends UserMcpTokenServiceCEImpl implements UserMcpTokenService {

    public UserMcpTokenServiceImpl(
            UserMcpTokenRepository userMcpTokenRepository,
            UserRepository userRepository,
            AnalyticsService analyticsService) {
        super(userMcpTokenRepository, userRepository, analyticsService);
    }
}
