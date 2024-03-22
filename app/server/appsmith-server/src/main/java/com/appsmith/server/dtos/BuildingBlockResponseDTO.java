package com.appsmith.server.dtos;

import com.appsmith.external.dtos.DslExecutableDTO;
import lombok.Data;

import java.util.List;

@Data
public class BuildingBlockResponseDTO {
    String widgetDsl;

    List<DslExecutableDTO> onPageLoadActions;
}
