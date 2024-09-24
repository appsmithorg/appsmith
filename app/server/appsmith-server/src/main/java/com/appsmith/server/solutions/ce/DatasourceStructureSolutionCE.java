package com.appsmith.server.solutions.ce;

import com.appsmith.external.models.ActionExecutionResult;
import com.appsmith.external.models.DatasourceStorage;
import com.appsmith.external.models.DatasourceStructure;
import com.appsmith.external.models.DatasourceStructure.Template;
import reactor.core.publisher.Mono;

public interface DatasourceStructureSolutionCE {

    Mono<DatasourceStructure> getStructure(String datasourceId, boolean ignoreCache, String environmentId);

    Mono<DatasourceStructure> getStructure(DatasourceStorage datasourceStorage, boolean ignoreCache);

    Mono<ActionExecutionResult> getSchemaPreviewData(
            String datasourceId, String environmentName, Template queryTemplate);
}
