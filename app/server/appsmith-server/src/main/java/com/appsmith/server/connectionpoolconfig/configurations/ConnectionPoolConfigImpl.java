package com.appsmith.server.connectionpoolconfig.configurations;

import com.appsmith.external.connectionpoolconfig.configurations.ConnectionPoolConfig;
import org.springframework.stereotype.Component;

@Component
public class ConnectionPoolConfigImpl extends ConnectionPoolConfigCECompatibleImpl implements ConnectionPoolConfig {

    private static final Integer MAXIMUM_CONFIGURABLE_POOL_SIZE = 50;

    public ConnectionPoolConfigImpl() {}
}
