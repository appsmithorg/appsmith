package com.appsmith.external.dtos;

import com.appsmith.external.models.ActionConfiguration;
import com.appsmith.external.models.Datasource;
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
    Datasource datasource;
    ActionConfiguration actionConfiguration;
    ExecuteActionDTO executeActionDTO;
}
