package com.appsmith.server.dtos.ce;

import com.appsmith.external.models.Datasource;
import com.appsmith.external.models.DatasourceStorage;
import com.appsmith.server.domains.Application;
import com.appsmith.server.domains.Context;
import com.appsmith.server.domains.Theme;
import com.appsmith.server.dtos.CustomJSLibContextDTO;
import com.appsmith.server.dtos.ImportActionCollectionResultDTO;
import com.appsmith.server.dtos.ImportActionResultDTO;
import com.appsmith.server.dtos.ImportedActionAndCollectionMapsDTO;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@NoArgsConstructor
@Data
public class MappedImportableResourcesCE_DTO {

    // Artifacts independent entities
    Map<String, String> pluginMap = new HashMap<>();
    Map<String, String> datasourceNameToIdMap = new HashMap<>();

    // Artifact dependent
    // This attribute is re-usable across artifacts according to the needs
    Map<String, String> contextNewNameToOldName;

    // Artifact independent, used in PartialImport
    // This attribute contain set of names used/existing in page such as widgetName, action and actionCollection names
    Map<String, String> refactoringNameReference;

    /**
     * Attribute used to carry objects specific to the context of the Artifacts.
     * In case of application it carries the NewPage entity
     * In case of packages it would carry modules
     */
    Map<String, ? extends Context> contextMap;

    // Artifact dependent and common
    List<CustomJSLibContextDTO> installedJsLibsList;
    ImportActionResultDTO actionResultDTO;
    ImportActionCollectionResultDTO actionCollectionResultDTO;
    ImportedActionAndCollectionMapsDTO actionAndCollectionMapsDTO = new ImportedActionAndCollectionMapsDTO();

    // This is being used to carry the resources from ArtifactExchangeJson
    Map<String, Object> resourceStoreFromArtifactExchangeJson = new HashMap<>();

    // Dry ops queries
    Map<String, List<Datasource>> datasourceDryRunQueries = new HashMap<>();

    Map<String, List<DatasourceStorage>> datasourceStorageDryRunQueries = new HashMap<>();

    Map<String, List<Theme>> themeDryRunQueries = new HashMap<>();

    Map<String, List<Application>> applicationDryRunQueries = new HashMap<>();
}
