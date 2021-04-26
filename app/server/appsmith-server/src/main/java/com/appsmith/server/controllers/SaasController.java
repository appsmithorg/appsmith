package com.appsmith.server.controllers;

import com.appsmith.server.constants.Url;
import com.appsmith.server.domains.Datasource;
import com.appsmith.server.dtos.ResponseDTO;
import com.appsmith.server.solutions.AuthenticationService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

@Slf4j
@RestController
@RequestMapping(Url.SAAS_URL)
public class SaasController {

    private final AuthenticationService authenticationService;

    @Autowired
    public SaasController(AuthenticationService authenticationService) {
        this.authenticationService = authenticationService;
    }

    @PostMapping("/{datasourceId}/pages/{pageId}/oauth")
    public Mono<ResponseDTO<String>> getAppsmithToken(@PathVariable String datasourceId, @PathVariable String pageId, ServerWebExchange serverWebExchange) {

        log.debug("Going to retrieve token request URL for datasource with id: {} and page id: {}", datasourceId, pageId);
        return authenticationService.getAppsmithToken(datasourceId, pageId, serverWebExchange.getRequest())
                .map(token -> new ResponseDTO<>(HttpStatus.OK.value(), token, null));
    }

    @PostMapping("/{datasourceId}/token")
    public Mono<ResponseDTO<Datasource>> getAccessToken(@PathVariable String datasourceId, @RequestParam String appsmithToken, ServerWebExchange serverWebExchange) {

        log.debug("Received callback for an OAuth2 authorization request");
        return authenticationService.getAccessTokenFromCloud(datasourceId, appsmithToken)
                .map(datasource -> new ResponseDTO<>(HttpStatus.OK.value(), datasource, null));
    }

}
