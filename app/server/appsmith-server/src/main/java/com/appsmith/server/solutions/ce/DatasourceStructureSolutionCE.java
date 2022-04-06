package com.appsmith.server.solutions.ce;

import com.appsmith.external.models.ActionExecutionResult;
import com.appsmith.external.models.Datasource;
import com.appsmith.external.models.DatasourceStructure;
import com.appsmith.external.models.Property;
import reactor.core.publisher.Mono;

import java.util.List;

public interface DatasourceStructureSolutionCE {

    Mono<DatasourceStructure> getStructure(String datasourceId, boolean ignoreCache);

    Mono<DatasourceStructure> getStructure(Datasource datasource, boolean ignoreCache);

    Mono<ActionExecutionResult> getDatasourceMetadata(String datasourceId, List<Property> pluginSpecifiedTemplates);

}
