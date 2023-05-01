package com.appsmith.server.controllers.ce;

import com.appsmith.external.models.Datasource;
import com.appsmith.external.views.Views;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.constants.Url;
import com.appsmith.server.dtos.ResponseDTO;
import com.appsmith.server.solutions.AuthenticationService;
import com.fasterxml.jackson.annotation.JsonView;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;
import com.appsmith.external.models.OAuthResponseDTO;

@Slf4j
@RequestMapping(Url.SAAS_URL)
public class SaasControllerCE {

    private final AuthenticationService authenticationService;

    @Autowired
    public SaasControllerCE(AuthenticationService authenticationService) {
        this.authenticationService = authenticationService;
    }

    @JsonView(Views.Public.class)
    @PostMapping("/{datasourceId}/pages/{pageId}/oauth")
    public Mono<ResponseDTO<String>> getAppsmithToken(@PathVariable String datasourceId,
                                                      @PathVariable String pageId,
                                                      @RequestHeader(name = FieldName.BRANCH_NAME, required = false) String branchName,
                                                      @RequestParam(required = false) String importForGit,
                                                      ServerWebExchange serverWebExchange) {

        log.debug("Going to retrieve token request URL for datasource with id: {} and page id: {}", datasourceId, pageId);
        return authenticationService.getAppsmithToken(datasourceId, pageId, branchName, serverWebExchange.getRequest(), importForGit)
                .map(token -> new ResponseDTO<>(HttpStatus.OK.value(), token, null));
    }

    @JsonView(Views.Public.class)
    @PostMapping("/{datasourceId}/token")
    public Mono<ResponseDTO<OAuthResponseDTO>> getAccessToken(@PathVariable String datasourceId, @RequestParam String appsmithToken, ServerWebExchange serverWebExchange) {

        log.debug("Received callback for an OAuth2 authorization request");
        return authenticationService.getAccessTokenFromCloud(datasourceId, appsmithToken)
                .map(datasource -> new ResponseDTO<>(HttpStatus.OK.value(), datasource, null));
    }

}
