package com.appsmith.server.dtos;

import lombok.Data;
import lombok.ToString;

import java.util.List;

@ToString
@Data
public class ConsumablePackagesAndModulesDTO {
    List<PackageDTO> packages;
    List<ModuleDTO> modules;
}
