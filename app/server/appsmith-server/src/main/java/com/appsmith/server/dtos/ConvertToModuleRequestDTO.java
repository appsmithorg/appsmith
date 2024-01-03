package com.appsmith.server.dtos;

import com.appsmith.external.models.ModuleType;
import lombok.Data;

@Data
public class ConvertToModuleRequestDTO {
    String packageId;
    String publicEntityId;
    ModuleType moduleType;
}
