package com.appsmith.server.dtos;

import com.appsmith.server.domains.Application;
import lombok.Data;

@Data
public class BuildingBlockImportDTO {

    Application application;

    String widgetDsl;
}
