package com.appsmith.server.controllers.ce;

import com.appsmith.external.models.ActionExecutionResult;
import com.appsmith.external.models.Datasource;
import com.appsmith.external.models.DatasourceStructure;
import com.appsmith.external.models.DatasourceTestResult;
import com.appsmith.external.models.Property;
import com.appsmith.external.models.TriggerRequestDTO;
import com.appsmith.external.models.TriggerResultDTO;
import com.appsmith.external.views.Views;
import com.appsmith.server.constants.FieldName;
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
import com.fasterxml.jackson.annotation.JsonView;

import lombok.extern.slf4j.Slf4j;
import org.apache.commons.lang3.BooleanUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

import jakarta.validation.Valid;
import java.net.URI;
import java.util.List;

@Slf4j
@RequestMapping(Url.DATASOURCE_URL)
public class DatasourceControllerCE extends BaseController<DatasourceService, Datasource, String> {

    private final DatasourceStructureSolution datasourceStructureSolution;
    private final AuthenticationService authenticationService;
    private final MockDataService mockDataService;
    private final DatasourceTriggerSolution datasourceTriggerSolution;
    private final DatasourceService datasourceService;

    @Autowired
    public DatasourceControllerCE(DatasourceService service,
                                  DatasourceStructureSolution datasourceStructureSolution,
                                  AuthenticationService authenticationService,
                                  MockDataService datasourceService,
                                  DatasourceTriggerSolution datasourceTriggerSolution) {
        super(service);
        this.datasourceService = service;
        this.datasourceStructureSolution = datasourceStructureSolution;
        this.authenticationService = authenticationService;
        this.mockDataService = datasourceService;
        this.datasourceTriggerSolution = datasourceTriggerSolution;
    }

    @JsonView(Views.Public.class)
    @PostMapping("/test")
    public Mono<ResponseDTO<DatasourceTestResult>> testDatasource(@RequestBody Datasource datasource,
                                                                  @RequestHeader(name = FieldName.ENVIRONMENT_NAME, required = false)
                                                                  String environmentName) {

        log.debug("Going to test the datasource with name: {} and id: {}", datasource.getName(), datasource.getId());
        return service.testDatasource(datasource, environmentName)
                .map(testResult -> new ResponseDTO<>(HttpStatus.OK.value(), testResult, null));
    }

    @JsonView(Views.Public.class)
    @GetMapping("/{datasourceId}/structure")
    public Mono<ResponseDTO<DatasourceStructure>> getStructure(@PathVariable String datasourceId,
                                                               @RequestParam(required = false, defaultValue = "false") Boolean ignoreCache,
                                                               @RequestHeader(name = FieldName.ENVIRONMENT_NAME, required = false) String environmentName) {
        log.debug("Going to get structure for datasource with id: '{}'.", datasourceId);
        return datasourceStructureSolution.getStructure(datasourceId, BooleanUtils.isTrue(ignoreCache), environmentName)
                .map(structure -> new ResponseDTO<>(HttpStatus.OK.value(), structure, null));
    }

    @JsonView(Views.Public.class)
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

    @JsonView(Views.Public.class)
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

    @JsonView(Views.Public.class)
    @GetMapping(Url.MOCKS)
    public Mono<ResponseDTO<List<MockDataSet>>> getMockDataSets() {
        return mockDataService.getMockDataSet()
                .map(config -> new ResponseDTO<>(HttpStatus.OK.value(), config.getMockdbs(), null));
    }

    @JsonView(Views.Public.class)
    @PostMapping(Url.MOCKS)
    public Mono<ResponseDTO<Datasource>> createMockDataSet(@RequestBody MockDataSource mockDataSource) {
        return mockDataService.createMockDataSet(mockDataSource)
                .map(datasource -> new ResponseDTO<>(HttpStatus.OK.value(), datasource, null));
    }

    @JsonView(Views.Public.class)
    @PutMapping("/datasource-query/{datasourceId}")
    public Mono<ResponseDTO<ActionExecutionResult>> runQueryOnDatasource(@PathVariable String datasourceId,
                                                                         @Valid @RequestBody List<Property> pluginSpecifiedTemplates) {
        log.debug("Getting datasource metadata");
        return datasourceStructureSolution.getDatasourceMetadata(datasourceId, pluginSpecifiedTemplates)
                .map(metadata -> new ResponseDTO<>(HttpStatus.OK.value(), metadata, null));
    }

    @JsonView(Views.Public.class)
    @PostMapping("/{datasourceId}/trigger")
    public Mono<ResponseDTO<TriggerResultDTO>> trigger(@PathVariable String datasourceId,
                                                       @RequestBody TriggerRequestDTO triggerRequestDTO,
                                                       @RequestHeader(name = FieldName.ENVIRONMENT_NAME, required = false) String environmentName) {
        log.debug("Trigger received for datasource {}", datasourceId);
        return datasourceTriggerSolution.trigger(datasourceId, triggerRequestDTO, environmentName)
                .map(triggerResultDTO -> new ResponseDTO<>(HttpStatus.OK.value(), triggerResultDTO, null));
    }

    @Override
    @JsonView(Views.Public.class)
    @PutMapping("/{id}")
    public Mono<ResponseDTO<Datasource>> update(@PathVariable String id,
                                                @RequestBody Datasource resource,
                                                @RequestHeader(name = FieldName.BRANCH_NAME, required = false) String branchName) {
        log.debug("Going to update datasource from datasource controller with id: {}", id);
        return datasourceService.update(id, resource, Boolean.TRUE)
                .map(updatedResource -> new ResponseDTO<>(HttpStatus.OK.value(), updatedResource, null));
    }

}
