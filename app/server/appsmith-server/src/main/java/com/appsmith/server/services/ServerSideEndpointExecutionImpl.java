package com.appsmith.server.services;

import com.appsmith.server.services.ce.ServerSideEndpointExecutionCEImpl;
import org.springframework.stereotype.Service;

@Service
public class ServerSideEndpointExecutionImpl extends ServerSideEndpointExecutionCEImpl
        implements ServerSideEndpointExecution {
    public ServerSideEndpointExecutionImpl(NewActionService newActionService) {
        super(newActionService);
    }
}
