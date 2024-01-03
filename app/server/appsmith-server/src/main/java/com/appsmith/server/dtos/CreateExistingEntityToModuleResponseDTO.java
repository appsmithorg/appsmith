package com.appsmith.server.dtos;

import lombok.Data;
import lombok.ToString;

@Data
@ToString
public class CreateExistingEntityToModuleResponseDTO {
    CreateModuleInstanceResponseDTO moduleInstanceData;
    ModuleDTO module;
    PackageDTO packageData;
    String originPackageId;
    String originModuleId;
}
