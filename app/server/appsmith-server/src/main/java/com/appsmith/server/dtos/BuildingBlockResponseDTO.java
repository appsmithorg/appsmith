package com.appsmith.server.dtos;

import com.appsmith.external.dtos.DslExecutableDTO;
import com.appsmith.external.models.ActionDTO;
import com.appsmith.external.models.Datasource;
import com.appsmith.server.domains.CustomJSLib;
import lombok.Data;

import java.util.List;

@Data
public class BuildingBlockResponseDTO {
    String widgetDsl;

    List<DslExecutableDTO> onPageLoadActions;

    // New actions created in the current flow
    List<ActionDTO> newActionList;

    // All datasource in the workspace
    List<Datasource> datasourceList;

    // All libraries used in the current application
    List<CustomJSLib> customJSLibList;
}
