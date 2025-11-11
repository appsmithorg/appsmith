package com.appsmith.server.dtos;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WorkspaceDatasourceUsageDTO {

    private String datasourceId;
    private String datasourceName;
    private String pluginId;
    private String pluginName;
    private Integer totalQueryCount;
    private List<ApplicationDatasourceUsageDTO> applications;
}
