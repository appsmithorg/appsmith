package com.appsmith.server.dtos;

import com.appsmith.server.domains.PluginType;
import org.springframework.data.annotation.Transient;

public class ActionDTO {

    @Transient
    String applicationId;

    @Transient
    String organizationId;

    @Transient
    PluginType pluginType;

    @Transient
    String pluginId;
}
