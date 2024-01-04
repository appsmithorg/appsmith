package com.appsmith.server.dtos;

import com.appsmith.server.domains.Module;
import com.appsmith.server.dtos.ce.MappedImportableResourcesCE_DTO;
import lombok.Data;
import lombok.EqualsAndHashCode;

import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@EqualsAndHashCode(callSuper = true)
@Data
public class MappedImportableResourcesDTO extends MappedImportableResourcesCE_DTO {

    // pageName_moduleInstanceName -> moduleInstanceId
    Map<String, String> moduleInstanceRefToIdMap = new HashMap<>();
    // moduleUUID -> module
    Map<String, Module> moduleUUIDToModuleMap = new ConcurrentHashMap<>();
    // moduleUUID -> exportableModule
    Map<String, ExportableModule> moduleUUIDToExportableModuleMap = new ConcurrentHashMap<>();
}
