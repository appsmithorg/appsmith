package com.appsmith.server.configurations.connectionpool;

import com.appsmith.external.configurations.connectionpool.ConnectionPoolConfigCECompatible;
import org.springframework.stereotype.Component;

@Component
public class ConnectionPoolConfigCECompatibleImpl extends ConnectionPoolConfigCEImpl
        implements ConnectionPoolConfigCECompatible {}
