package com.appsmith.server.dtos;

import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
public class PartialImportExportDTO {
    List<String> datasourceList;
    List<String> customJSLibList;
    List<String> actionList;
    List<String> actionCollectionList;
}
