package com.appsmith.server.controllers;

import com.appsmith.server.constants.Url;
import com.appsmith.server.controllers.ce.McpTokenControllerCE;
import com.appsmith.server.services.McpTokenService;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping(Url.MCP_TOKEN_URL)
public class McpTokenController extends McpTokenControllerCE {

    public McpTokenController(McpTokenService mcpTokenService) {
        super(mcpTokenService);
    }
}
