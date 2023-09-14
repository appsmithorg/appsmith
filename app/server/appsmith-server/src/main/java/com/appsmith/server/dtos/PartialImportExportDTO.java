package com.appsmith.server.dtos;

import lombok.Getter;

import java.util.List;

@Getter
public class PartialImportExportDTO {
    List<String> datasourceList;
    List<String> customJSLibList;
    List<String> actionList;
    List<String> actionCollectionList;
}
