package com.appsmith.server.dtos;

import com.appsmith.external.models.ActionDTO;
import com.appsmith.server.domains.Module;
import com.appsmith.server.domains.Package;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder(toBuilder = true)
public class PublishingMetaDTO {
    String sourcePackageId;
    Package publishedPackage;
    Map<String, String> oldModuleIdToNewModuleIdMap;
    List<Module> publishedModules;

    final Map<String, ActionDTO> oldPublicActionMap = new HashMap<>();
    final Map<String, ActionDTO> newPublicActionMap = new HashMap<>();
}
