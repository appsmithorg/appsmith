package com.appsmith.server.controllers.ce;

import com.appsmith.external.models.ActionExecutionResult;
import com.appsmith.external.models.Datasource;
import com.appsmith.external.models.DatasourceStorageDTO;
import com.appsmith.external.models.DatasourceStructure;
import com.appsmith.external.models.DatasourceStructure.Template;
import com.appsmith.external.models.DatasourceTestResult;
import com.appsmith.external.models.TriggerRequestDTO;
import com.appsmith.external.models.TriggerResultDTO;
import com.appsmith.external.views.FromRequest;
import com.appsmith.external.views.Views;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.constants.Url;
import com.appsmith.server.datasources.base.DatasourceService;
import com.appsmith.server.dtos.AuthorizationCodeCallbackDTO;
import com.appsmith.server.dtos.MockDataSet;
import com.appsmith.server.dtos.MockDataSource;
import com.appsmith.server.dtos.ResponseDTO;
import com.appsmith.server.services.MockDataService;
import com.appsmith.server.solutions.AuthenticationService;
import com.appsmith.server.solutions.DatasourceStructureSolution;
import com.appsmith.server.solutions.DatasourceTriggerSolution;
import com.fasterxml.jackson.annotation.JsonView;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.lang3.BooleanUtils;
import org.springframework.http.HttpStatus;
import org.springframework.util.MultiValueMap;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

import java.net.URI;
import java.util.List;

@Slf4j
@RequestMapping(Url.DATASOURCE_URL)
@RequiredArgsConstructor
public class DatasourceControllerCE {

    private final DatasourceService datasourceService;
    private final DatasourceStructureSolution datasourceStructureSolution;
    private final AuthenticationService authenticationService;
    private final MockDataService mockDataService;
    private final DatasourceTriggerSolution datasourceTriggerSolution;

    @JsonView(Views.Public.class)
    @GetMapping
    public Mono<ResponseDTO<List<Datasource>>> getAll(@RequestParam MultiValueMap<String, String> params) {
        log.debug("Going to get all resources from datasource controller {}", params);
        return datasourceService
                .getAllWithStorages(params)
                .collectList()
                .map(resources -> new ResponseDTO<>(HttpStatus.OK, resources));
    }

    @JsonView(Views.Public.class)
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Mono<ResponseDTO<Datasource>> create(@Valid @RequestBody @JsonView(FromRequest.class) Datasource resource) {
        log.debug("Going to create resource from datasource controller");
        return datasourceService.create(resource).map(created -> new ResponseDTO<>(HttpStatus.CREATED, created));
    }

    @JsonView(Views.Public.class)
    @PutMapping("/{id}")
    public Mono<ResponseDTO<Datasource>> update(
            @PathVariable String id,
            @RequestBody @JsonView(FromRequest.class) Datasource datasource,
            @RequestHeader(name = FieldName.HEADER_ENVIRONMENT_ID, required = false) String environmentId) {
        log.debug("Going to update resource from datasource controller with id: {}", id);
        return datasourceService
                .updateDatasource(id, datasource, environmentId, Boolean.TRUE)
                .map(updatedResource -> new ResponseDTO<>(HttpStatus.OK, updatedResource));
    }

    @JsonView(Views.Public.class)
    @PutMapping("/datasource-storages")
    public Mono<ResponseDTO<Datasource>> updateDatasourceStorages(
            @RequestBody DatasourceStorageDTO datasourceStorageDTO,
            @RequestHeader(name = FieldName.HEADER_ENVIRONMENT_ID, required = false) String activeEnvironmentId) {
        log.debug(
                "Going to update datasource from datasource controller with id: {} and environmentId: {}",
                datasourceStorageDTO.getDatasourceId(),
                datasourceStorageDTO.getEnvironmentId());

        return datasourceService
                .updateDatasourceStorage(datasourceStorageDTO, activeEnvironmentId, Boolean.TRUE)
                .map(updatedResource -> new ResponseDTO<>(HttpStatus.OK, updatedResource));
    }

    @JsonView(Views.Public.class)
    @DeleteMapping("/{id}")
    public Mono<ResponseDTO<Datasource>> delete(@PathVariable String id) {
        log.debug("Going to delete resource from datasource controller with id: {}", id);
        return datasourceService
                .archiveById(id)
                .map(deletedResource -> new ResponseDTO<>(HttpStatus.OK, deletedResource));
    }

    @JsonView(Views.Public.class)
    @PostMapping("/test")
    public Mono<ResponseDTO<DatasourceTestResult>> testDatasource(
            @RequestBody DatasourceStorageDTO datasourceStorageDTO,
            @RequestHeader(name = FieldName.HEADER_ENVIRONMENT_ID, required = false) String activeEnvironmentId) {

        log.debug("Going to test the datasource with id: {}", datasourceStorageDTO.getDatasourceId());
        return datasourceService
                .testDatasource(datasourceStorageDTO, activeEnvironmentId)
                .map(testResult -> new ResponseDTO<>(HttpStatus.OK, testResult));
    }

    @JsonView(Views.Public.class)
    @GetMapping("/{datasourceId}/structure")
    public Mono<ResponseDTO<DatasourceStructure>> getStructure(
            @PathVariable String datasourceId,
            @RequestParam(required = false, defaultValue = "false") Boolean ignoreCache,
            @RequestHeader(name = FieldName.HEADER_ENVIRONMENT_ID, required = false) String environmentId) {
        log.debug("Going to get structure for datasource with id: '{}'.", datasourceId);
        return datasourceStructureSolution
                .getStructure(datasourceId, BooleanUtils.isTrue(ignoreCache), environmentId)
                .map(structure -> new ResponseDTO<>(HttpStatus.OK, structure));
    }

    @JsonView(Views.Public.class)
    @GetMapping("/{datasourceId}/pages/{pageId}/code")
    public Mono<Void> getTokenRequestUrl(
            @PathVariable String datasourceId,
            @PathVariable String pageId,
            @RequestParam String environmentId,
            @RequestParam(name = FieldName.BRANCH_NAME, required = false) String branchName,
            ServerWebExchange serverWebExchange) {
        log.debug(
                "Going to retrieve token request URL for datasource with id: {} and page id: {}", datasourceId, pageId);
        return authenticationService
                .getAuthorizationCodeURLForGenericOAuth2(
                        datasourceId, environmentId, pageId, serverWebExchange.getRequest())
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
        return authenticationService.getAccessTokenForGenericOAuth2(callbackDTO).flatMap(url -> {
            serverWebExchange.getResponse().setStatusCode(HttpStatus.FOUND);
            serverWebExchange.getResponse().getHeaders().setLocation(URI.create(url));
            return serverWebExchange.getResponse().setComplete();
        });
    }

    @JsonView(Views.Public.class)
    @GetMapping(Url.MOCKS)
    public Mono<ResponseDTO<List<MockDataSet>>> getMockDataSets() {
        return mockDataService.getMockDataSet().map(config -> new ResponseDTO<>(HttpStatus.OK, config.getMockdbs()));
    }

    @JsonView(Views.Public.class)
    @PostMapping(Url.MOCKS)
    public Mono<ResponseDTO<Datasource>> createMockDataSet(
            @RequestBody MockDataSource mockDataSource,
            @RequestHeader(name = FieldName.HEADER_ENVIRONMENT_ID, required = false) String environmentId) {
        return mockDataService
                .createMockDataSet(mockDataSource, environmentId)
                .map(datasource -> new ResponseDTO<>(HttpStatus.OK, datasource));
    }

    @JsonView(Views.Public.class)
    @PostMapping(value = "/{datasourceId}/trigger")
    public Mono<ResponseDTO<TriggerResultDTO>> trigger(
            @PathVariable String datasourceId,
            @RequestBody TriggerRequestDTO triggerRequestDTO,
            @RequestHeader(name = FieldName.HEADER_ENVIRONMENT_ID, required = false) String environmentId) {
        log.debug("Trigger received for datasource {}", datasourceId);
        return datasourceTriggerSolution
                .trigger(datasourceId, environmentId, triggerRequestDTO)
                .map(triggerResultDTO -> new ResponseDTO<>(HttpStatus.OK, triggerResultDTO));
    }

    @JsonView(Views.Public.class)
    @PostMapping("/{datasourceId}/schema-preview")
    public Mono<ResponseDTO<ActionExecutionResult>> getSchemaPreviewData(
            @PathVariable String datasourceId,
            @RequestBody Template template,
            @RequestHeader(name = FieldName.HEADER_ENVIRONMENT_ID, required = false) String environmentId) {
        log.debug("Going to get schema preview data for datasource with id: '{}'.", datasourceId);
        return datasourceStructureSolution
                .getSchemaPreviewData(datasourceId, environmentId, template)
                .map(actionExecutionResult -> new ResponseDTO<>(HttpStatus.OK, actionExecutionResult));
    }
}
