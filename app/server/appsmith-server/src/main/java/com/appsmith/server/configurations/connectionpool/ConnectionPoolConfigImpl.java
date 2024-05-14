package com.appsmith.server.configurations.connectionpool;

import com.appsmith.external.configurations.connectionpool.ConnectionPoolConfig;
import org.springframework.stereotype.Component;

@Component
public class ConnectionPoolConfigImpl extends ConnectionPoolConfigCECompatibleImpl implements ConnectionPoolConfig {
    public ConnectionPoolConfigImpl() {}
}
