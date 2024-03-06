package com.appsmith.server.dtos;

import com.appsmith.external.models.PluginType;
import com.appsmith.server.domains.Plugin;
import com.appsmith.server.exceptions.AppsmithException;
import lombok.Getter;
import lombok.Setter;
import lombok.extern.slf4j.Slf4j;

import static com.appsmith.server.exceptions.AppsmithError.INTERNAL_SERVER_ERROR;

@Getter
@Setter
@Slf4j
public class PluginDTO {
    String id;
    String name;
    PluginType type;
    String executorClass;
    String jarLocation;
    String iconLocation;

    public void populateTransientFields(Plugin plugin) {
        if (plugin == null) {
            log.error("Plugin object can't be null");
            throw new AppsmithException(INTERNAL_SERVER_ERROR);
        }
        this.setId(plugin.getId());
        this.setIconLocation(plugin.getIconLocation());
    }
}
