package com.appsmith.server.controllers;

import com.appsmith.server.constants.Url;
import com.appsmith.server.controllers.ce.ServerSideExecutionControllerCE;
import com.appsmith.server.services.ServerSideEndpointExecution;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping(Url.SERVER_JS_EXECUTE_URL)
public class ServerSideExecutionController extends ServerSideExecutionControllerCE {
    public ServerSideExecutionController(ServerSideEndpointExecution serverSideEndpointExecution) {
        super(serverSideEndpointExecution);
    }
}
