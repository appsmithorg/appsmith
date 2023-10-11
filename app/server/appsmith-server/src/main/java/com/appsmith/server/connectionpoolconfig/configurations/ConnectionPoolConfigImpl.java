package com.appsmith.server.connectionpoolconfig.configurations;

import com.appsmith.external.connectionpoolconfig.configurations.ConnectionPoolConfig;
import org.springframework.stereotype.Component;

@Component
public class ConnectionPoolConfigImpl extends ConnectionPoolConfigCECompatibleImpl implements ConnectionPoolConfig {
    public ConnectionPoolConfigImpl() {}
}
