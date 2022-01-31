package com.appsmith.server.controllers.ce;

import com.appsmith.external.models.ActionExecutionResult;
import com.appsmith.external.models.Datasource;
import com.appsmith.external.models.DatasourceStructure;
import com.appsmith.external.models.DatasourceTestResult;
import com.appsmith.external.models.Property;
import com.appsmith.external.models.TriggerResultDTO;
import com.appsmith.server.constants.Url;
import com.appsmith.server.dtos.AuthorizationCodeCallbackDTO;
import com.appsmith.server.dtos.MockDataSet;
import com.appsmith.server.dtos.MockDataSource;
import com.appsmith.server.dtos.ResponseDTO;
import com.appsmith.server.services.DatasourceService;
import com.appsmith.server.services.MockDataService;
import com.appsmith.server.solutions.AuthenticationService;
import com.appsmith.server.solutions.DatasourceStructureSolution;
import com.appsmith.server.solutions.DatasourceTriggerSolution;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.lang3.BooleanUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.util.MultiValueMap;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

import javax.validation.Valid;
import java.net.URI;
import java.util.List;

@Slf4j
@RequestMapping(Url.DATASOURCE_URL)
public class DatasourceControllerCE extends BaseController<DatasourceService, Datasource, String> {

    private final DatasourceStructureSolution datasourceStructureSolution;
    private final AuthenticationService authenticationService;
    private final MockDataService mockDataService;
    private final DatasourceTriggerSolution datasourceTriggerSolution;

    @Autowired
    public DatasourceControllerCE(DatasourceService service,
                                  DatasourceStructureSolution datasourceStructureSolution,
                                  AuthenticationService authenticationService,
                                  MockDataService datasourceService,
                                  DatasourceTriggerSolution datasourceTriggerSolution) {
        super(service);
        this.datasourceStructureSolution = datasourceStructureSolution;
        this.authenticationService = authenticationService;
        this.mockDataService = datasourceService;
        this.datasourceTriggerSolution = datasourceTriggerSolution;
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

    @GetMapping("/{datasourceId}/pages/{pageId}/code")
    public Mono<Void> getTokenRequestUrl(@PathVariable String datasourceId, @PathVariable String pageId, ServerWebExchange serverWebExchange) {
        log.debug("Going to retrieve token request URL for datasource with id: {} and page id: {}", datasourceId, pageId);
        return authenticationService.getAuthorizationCodeURLForGenericOauth2(datasourceId, pageId, serverWebExchange.getRequest())
                .flatMap(url -> {
                    serverWebExchange.getResponse().setStatusCode(HttpStatus.FOUND);
                    serverWebExchange.getResponse().getHeaders().setLocation(URI.create(url));
                    return serverWebExchange.getResponse().setComplete();
                });
    }

    @GetMapping("/authorize")
    public Mono<Void> getAccessToken(AuthorizationCodeCallbackDTO callbackDTO, ServerWebExchange serverWebExchange) {
        log.debug("Received callback for an OAuth2 authorization request");
        return authenticationService.getAccessTokenForGenericOAuth2(callbackDTO)
                .flatMap(url -> {
                    serverWebExchange.getResponse().setStatusCode(HttpStatus.FOUND);
                    serverWebExchange.getResponse().getHeaders().setLocation(URI.create(url));
                    return serverWebExchange.getResponse().setComplete();
                });
    }

    @GetMapping("/mocks")
    public Mono<ResponseDTO<List<MockDataSet>>> getMockDataSets() {
        return mockDataService.getMockDataSet()
                .map(config -> new ResponseDTO<>(HttpStatus.OK.value(), config.getMockdbs(), null));
    }

    @PostMapping("/mocks")
    public Mono<ResponseDTO<Datasource>> createMockDataSet(@RequestBody MockDataSource mockDataSource) {
        return mockDataService.createMockDataSet(mockDataSource)
                .map(datasource -> new ResponseDTO<>(HttpStatus.OK.value(), datasource, null));
    }

    @PutMapping("/datasource-query/{datasourceId}")
    public Mono<ResponseDTO<ActionExecutionResult>> runQueryOnDatasource(@PathVariable String datasourceId,
                                                                    @Valid @RequestBody List<Property> pluginSpecifiedTemplates) {
        log.debug("Getting datasource metadata");
        return datasourceStructureSolution.getDatasourceMetadata(datasourceId, pluginSpecifiedTemplates)
            .map(metadata -> new ResponseDTO<>(HttpStatus.OK.value(), metadata, null));
    }

    @GetMapping("/{datasourceId}/trigger")
    public Mono<ResponseDTO<TriggerResultDTO>> trigger(@PathVariable String datasourceId,
                                                       @RequestParam MultiValueMap<String, Object> params) {
        log.debug("Trigger received for datasource {}", datasourceId);
        return datasourceTriggerSolution.trigger(datasourceId, params)
                .map(triggerResultDTO -> new ResponseDTO<>(HttpStatus.OK.value(), triggerResultDTO, null));
    }

}
