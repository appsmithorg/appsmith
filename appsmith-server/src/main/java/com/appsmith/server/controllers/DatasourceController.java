package com.appsmith.server.controllers;

import com.appsmith.external.models.DatasourceTestResult;
import com.appsmith.server.constants.Url;
import com.appsmith.server.domains.Datasource;
import com.appsmith.server.dtos.ResponseDTO;
import com.appsmith.server.services.DatasourceService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.util.CollectionUtils;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import reactor.core.publisher.Mono;

@RestController
@RequestMapping(Url.DATASOURCE_URL)
public class DatasourceController extends BaseController<DatasourceService, Datasource, String> {

    @Autowired
    public DatasourceController(DatasourceService service) {
        super(service);
    }

    @PostMapping("/test")
    public Mono<ResponseDTO<DatasourceTestResult>> testDatasource(@RequestBody Datasource datasource) {
        Mono<Datasource> datasourceMono;

        if (datasource.getId() != null) {
            datasourceMono = service.getById(datasource.getId());
        } else {
            datasourceMono = Mono.just(datasource);
        }

        return datasourceMono
                .flatMap(service::validateDatasource)
                .flatMap(datasource1 -> {
                    if (CollectionUtils.isEmpty(datasource1.getInvalids())) {
                        return service.testDatasource(datasource1);
                    } else {
                        return Mono.just(new DatasourceTestResult(datasource1.getInvalids()));
                    }
                })
                .map(testResult -> new ResponseDTO<>(HttpStatus.OK.value(), testResult, null));
    }
}
