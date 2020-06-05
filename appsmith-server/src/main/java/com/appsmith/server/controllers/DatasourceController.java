package com.appsmith.server.controllers;

import com.appsmith.external.models.DatasourceTestResult;
import com.appsmith.server.constants.Url;
import com.appsmith.server.domains.Datasource;
import com.appsmith.server.dtos.ResponseDTO;
import com.appsmith.server.services.DatasourceService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import reactor.core.publisher.Mono;

@Slf4j
@RestController
@RequestMapping(Url.DATASOURCE_URL)
public class DatasourceController extends BaseController<DatasourceService, Datasource, String> {

    @Autowired
    public DatasourceController(DatasourceService service) {
        super(service);
    }

    @PostMapping("/test")
    public Mono<ResponseDTO<DatasourceTestResult>> testDatasource(@RequestBody Datasource datasource) {
        log.debug("Going to test the datasource with name: {} and id: {}", datasource.getName(), datasource.getId());
        return service.testDatasource(datasource)
                .map(testResult -> new ResponseDTO<>(HttpStatus.OK.value(), testResult, null));
    }
}
