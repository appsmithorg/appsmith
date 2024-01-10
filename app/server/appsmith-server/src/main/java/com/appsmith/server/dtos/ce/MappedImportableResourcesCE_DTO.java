package com.appsmith.server.dtos.ce;

import com.appsmith.server.domains.ApplicationPage;
import com.appsmith.server.domains.NewPage;
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

    List<CustomJSLibContextDTO> installedJsLibsList;

    // Artifact dependent
    Map<String, String> newPageNameToOldPageNameMap;
    Map<String, NewPage> pageNameMap;
    ImportActionResultDTO actionResultDTO;
    ImportActionCollectionResultDTO actionCollectionResultDTO;
    ImportedActionAndCollectionMapsDTO actionAndCollectionMapsDTO = new ImportedActionAndCollectionMapsDTO();

    // This is being used to carry the list of published and unpublished pages in application.
    Map<String, List<ApplicationPage>> applicationToBeImportedApplicationPagesMap = new HashMap<>();
}
