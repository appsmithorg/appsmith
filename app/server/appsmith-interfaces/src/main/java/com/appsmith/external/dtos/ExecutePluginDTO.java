package com.appsmith.external.dtos;

import com.appsmith.external.models.ActionConfiguration;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ExecutePluginDTO {
    String installationKey;
    String pluginName;
    String pluginVersion;
    String actionTemplateName;
    String datasourceTemplateName;
    DatasourceDTO datasource;
    ActionConfiguration actionConfiguration;
    ExecuteActionDTO executeActionDTO;
}
