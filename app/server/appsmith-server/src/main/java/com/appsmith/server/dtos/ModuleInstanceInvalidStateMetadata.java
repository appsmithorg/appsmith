package com.appsmith.server.dtos;

import lombok.Data;
import lombok.NoArgsConstructor;

@NoArgsConstructor
@Data
public class ModuleInstanceInvalidStateMetadata {
    String packageName;
    String moduleName;
    String originPackageId;
}
