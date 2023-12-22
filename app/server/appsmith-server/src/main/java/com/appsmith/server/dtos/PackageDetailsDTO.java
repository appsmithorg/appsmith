package com.appsmith.server.dtos;

import lombok.Data;
import lombok.ToString;

import java.util.List;

@Data
@ToString
public class PackageDetailsDTO {
    PackageDTO packageData;
    List<ModuleDTO> modules;
    List<ModuleMetadata> modulesMetadata;
}
