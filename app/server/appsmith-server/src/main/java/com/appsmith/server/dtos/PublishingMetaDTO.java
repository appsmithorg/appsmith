package com.appsmith.server.dtos;

import com.appsmith.server.domains.Module;
import com.appsmith.server.domains.Package;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

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
}
