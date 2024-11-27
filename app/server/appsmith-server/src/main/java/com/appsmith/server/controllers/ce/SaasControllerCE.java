package com.appsmith.server.controllers.ce;

import com.appsmith.external.models.OAuth2ResponseDTO;
import com.appsmith.external.views.Views;
import com.appsmith.server.configurations.CloudServicesConfig;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.constants.Url;
import com.appsmith.server.dtos.RequestAppsmithTokenDTO;
import com.appsmith.server.dtos.ResponseDTO;
import com.appsmith.server.solutions.AuthenticationService;
import com.fasterxml.jackson.annotation.JsonView;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.server.reactive.ServerHttpResponse;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;

@Slf4j
@RequestMapping(Url.SAAS_URL)
@RequiredArgsConstructor
public class SaasControllerCE {

    private final AuthenticationService authenticationService;

    private final CloudServicesConfig cloudServicesConfig;

    @JsonView(Views.Public.class)
    @PostMapping("/{datasourceId}/oauth")
    public Mono<ResponseDTO<String>> getAppsmithToken(
            @PathVariable String datasourceId,
            @RequestBody RequestAppsmithTokenDTO requestAppsmithTokenDTO,
            @RequestHeader(name = FieldName.HEADER_ENVIRONMENT_ID, required = false) String environmentId,
            @RequestParam(required = false) String importForGit,
            ServerWebExchange serverWebExchange) {

        log.debug("Going to retrieve token request URL for datasource with id: {}", datasourceId);
        return authenticationService
                .getAppsmithToken(
                        datasourceId,
                        environmentId,
                        requestAppsmithTokenDTO,
                        serverWebExchange.getRequest().getHeaders(),
                        importForGit)
                .map(token -> new ResponseDTO<>(HttpStatus.OK.value(), token, null));
    }

    @JsonView(Views.Public.class)
    @PostMapping("/{datasourceId}/token")
    public Mono<ResponseDTO<OAuth2ResponseDTO>> getAccessToken(
            @PathVariable String datasourceId,
            @RequestParam String appsmithToken,
            @RequestHeader(name = FieldName.HEADER_ENVIRONMENT_ID, required = false) String environmentId) {

        log.debug("Received callback for an OAuth2 authorization request");
        return authenticationService
                .getAccessTokenFromCloud(datasourceId, environmentId, appsmithToken)
                .map(datasource -> new ResponseDTO<>(HttpStatus.OK.value(), datasource, null));
    }

    @GetMapping("authorize")
    public Mono<Void> redirectForAuthorize(ServerWebExchange exchange, @RequestParam String appsmithToken) {
        if (appsmithToken == null || appsmithToken.isEmpty()) {
            exchange.getResponse().setStatusCode(HttpStatus.BAD_REQUEST);
            return exchange.getResponse().setComplete();
        }

        final String url = cloudServicesConfig.getBaseUrl() + "/api/v1/integrations/oauth/authorize?appsmithToken="
                + URLEncoder.encode(appsmithToken, StandardCharsets.UTF_8);

        ServerHttpResponse response = exchange.getResponse();
        response.setStatusCode(HttpStatus.TEMPORARY_REDIRECT);
        response.getHeaders().set("Location", url);

        return response.setComplete();
    }
}
