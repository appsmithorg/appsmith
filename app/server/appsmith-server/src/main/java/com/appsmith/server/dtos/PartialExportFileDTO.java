package com.appsmith.server.dtos;

import lombok.Data;

import java.util.ArrayList;
import java.util.List;

@Data
public class PartialExportFileDTO {

    List<String> actionList = new ArrayList<>();

    List<String> actionCollectionList = new ArrayList<>();

    List<String> customJsLib = new ArrayList<>();

    List<String> datasourceList = new ArrayList<>();

    String widget = "";
}
