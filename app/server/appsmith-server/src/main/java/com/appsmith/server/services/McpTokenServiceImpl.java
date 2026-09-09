package com.appsmith.server.services;

import com.appsmith.server.helpers.McpTokenCache;
import com.appsmith.server.repositories.McpKeyRepository;
import com.appsmith.server.repositories.McpTokenRepository;
import com.appsmith.server.repositories.UserRepository;
import com.appsmith.server.services.ce.McpTokenServiceCEImpl;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.reactive.TransactionalOperator;

@Slf4j
@Service
public class McpTokenServiceImpl extends McpTokenServiceCEImpl implements McpTokenService {

    @Autowired
    public McpTokenServiceImpl(
            OrganizationService organizationService,
            UserRepository userRepository,
            AnalyticsService analyticsService,
            McpKeyRepository mcpKeyRepository,
            McpTokenRepository mcpTokenRepository,
            McpTokenCache mcpTokenCache,
            TransactionalOperator transactionalOperator) {
        super(
                organizationService,
                userRepository,
                analyticsService,
                mcpKeyRepository,
                mcpTokenRepository,
                mcpTokenCache,
                transactionalOperator);
    }
}
