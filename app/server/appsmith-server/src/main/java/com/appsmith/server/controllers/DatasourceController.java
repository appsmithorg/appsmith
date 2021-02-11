package com.appsmith.server.controllers;

import com.appsmith.external.models.DatasourceStructure;
import com.appsmith.external.models.DatasourceTestResult;
import com.appsmith.server.constants.Url;
import com.appsmith.server.domains.Datasource;
import com.appsmith.server.dtos.AuthorizationCodeCallbackDTO;
import com.appsmith.server.dtos.ResponseDTO;
import com.appsmith.server.services.DatasourceService;
import com.appsmith.server.solutions.AuthenticationService;
import com.appsmith.server.solutions.DatasourceStructureSolution;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.lang3.BooleanUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

import java.net.URI;

@Slf4j
@RestController
@RequestMapping(Url.DATASOURCE_URL)
public class DatasourceController extends BaseController<DatasourceService, Datasource, String> {

    private final DatasourceStructureSolution datasourceStructureSolution;
    private final AuthenticationService authenticationService;

    @Autowired
    public DatasourceController(DatasourceService service,
                                DatasourceStructureSolution datasourceStructureSolution,
                                AuthenticationService authenticationService) {
        super(service);
        this.datasourceStructureSolution = datasourceStructureSolution;
        this.authenticationService = authenticationService;
    }

    @PostMapping("/test")
    public Mono<ResponseDTO<DatasourceTestResult>> testDatasource(@RequestBody Datasource datasource) {
        log.debug("Going to test the datasource with name: {} and id: {}", datasource.getName(), datasource.getId());
        return service.testDatasource(datasource)
                .map(testResult -> new ResponseDTO<>(HttpStatus.OK.value(), testResult, null));
    }

    @GetMapping("/{datasourceId}/structure")
    public Mono<ResponseDTO<DatasourceStructure>> getStructure(@PathVariable String datasourceId,
                                                               @RequestParam(required = false, defaultValue = "false") Boolean ignoreCache) {
        log.debug("Going to get structure for datasource with id: '{}'.", datasourceId);
        return datasourceStructureSolution.getStructure(datasourceId, BooleanUtils.isTrue(ignoreCache))
                .map(structure -> new ResponseDTO<>(HttpStatus.OK.value(), structure, null));
    }

    @GetMapping("/{datasourceId}/code")
    public Mono<Void> getTokenRequestUrl(@PathVariable String datasourceId, ServerWebExchange serverWebExchange) {
        log.debug("Going to retrieve token request URL for datasource with id: {}", datasourceId);
        return authenticationService.getAuthorizationCodeURL(datasourceId, serverWebExchange)
                .flatMap(url -> {
                    serverWebExchange.getResponse().setStatusCode(HttpStatus.FOUND);
                    serverWebExchange.getResponse().getHeaders().setLocation(URI.create(url));
                    return serverWebExchange.getResponse().setComplete();
                });
    }

    @GetMapping("/authorize")
    public Mono<Void> getAccessToken(AuthorizationCodeCallbackDTO callbackDTO, ServerWebExchange serverWebExchange) {
        log.debug("Received callback for an OAuth2 authorization request");
        return authenticationService.getAccessToken(callbackDTO)
                .flatMap(url -> {
                    serverWebExchange.getResponse().setStatusCode(HttpStatus.FOUND);
                    serverWebExchange.getResponse().getHeaders().setLocation(URI.create(url));
                    return serverWebExchange.getResponse().setComplete();
                });
    }

}
