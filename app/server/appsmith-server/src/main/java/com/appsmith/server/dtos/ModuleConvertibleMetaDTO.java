package com.appsmith.server.dtos;

import com.appsmith.external.helpers.Reusable;
import com.appsmith.external.models.ModuleType;
import lombok.Data;
import reactor.core.publisher.Mono;

import java.util.HashMap;
import java.util.Map;

@Data
public class ModuleConvertibleMetaDTO {
    Mono<Reusable> publicEntityMono;
    Mono<PackageDTO> originPackageMono;
    PackageDTO originPackageDTO;
    String publicEntityId;
    ModuleType moduleType;
    String branchName;
    // Output
    CreateModuleInstanceResponseDTO moduleInstanceData;
    ModuleDTO moduleDTO;
    PackageDTO packageDTO;
    String originPackageId;
    String originModuleId;
    Map<String, String> inputNameToDefaultValueMap = new HashMap<>();
}
