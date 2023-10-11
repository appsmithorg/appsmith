package com.appsmith.server.connectionpoolconfig.configurations;

import com.appsmith.external.connectionpoolconfig.configurations.ConnectionPoolConfigCECompatible;
import org.springframework.stereotype.Component;

@Component
public class ConnectionPoolConfigCECompatibleImpl extends ConnectionPoolConfigCEImpl
        implements ConnectionPoolConfigCECompatible {}
