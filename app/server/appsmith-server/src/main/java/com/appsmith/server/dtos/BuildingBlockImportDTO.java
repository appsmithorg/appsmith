package com.appsmith.server.dtos;

import com.appsmith.server.domains.Application;
import lombok.Data;

import java.util.Map;

@Data
public class BuildingBlockImportDTO {

    Application application;

    String widgetDsl;

    Map<String, String> refactoredEntityNameMap;
}
