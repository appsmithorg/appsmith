package com.appsmith.server.applications.imports;

import com.appsmith.external.models.Datasource;
import com.appsmith.server.domains.Application;
import com.appsmith.server.dtos.ApplicationImportDTO;
import com.appsmith.server.dtos.ApplicationJson;
import com.appsmith.server.imports.internal.ContextBasedImportService;
import reactor.core.publisher.Mono;

import java.util.List;

public interface ApplicationImportServiceCE
        extends ContextBasedImportService<Application, ApplicationImportDTO, ApplicationJson> {

    Mono<List<Datasource>> findDatasourceByApplicationId(String applicationId, String orgId);
}
