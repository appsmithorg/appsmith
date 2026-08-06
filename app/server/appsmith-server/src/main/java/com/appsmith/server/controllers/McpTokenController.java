package com.appsmith.server.controllers;

import com.appsmith.server.constants.Url;
import com.appsmith.server.controllers.ce.McpTokenControllerCE;
import com.appsmith.server.services.UserMcpTokenService;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping(Url.USER_URL + "/mcp-tokens")
public class McpTokenController extends McpTokenControllerCE {

    public McpTokenController(UserMcpTokenService userMcpTokenService) {
        super(userMcpTokenService);
    }
}
