package com.appsmith.server.dtos;

import com.appsmith.external.models.PluginType;
import jakarta.persistence.Enumerated;
import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class PluginTypeAndCountDTO {
    @Enumerated
    private PluginType pluginType;

    private Long count;
}
