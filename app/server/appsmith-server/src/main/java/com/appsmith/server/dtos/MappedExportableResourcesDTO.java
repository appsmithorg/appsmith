package com.appsmith.server.dtos;

import com.appsmith.server.dtos.ce.MappedExportableResourcesCE_DTO;
import lombok.Getter;
import lombok.Setter;

import java.util.HashMap;
import java.util.Map;

@Getter
@Setter
public class MappedExportableResourcesDTO extends MappedExportableResourcesCE_DTO {

    Map<String, String> moduleInstanceIdToNameMap = new HashMap<>();
}
