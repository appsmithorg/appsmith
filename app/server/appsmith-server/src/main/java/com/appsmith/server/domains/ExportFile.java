package com.appsmith.server.domains;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.List;
import java.util.Map;

@Getter
@Setter
@NoArgsConstructor
public class ExportFile {
    Map<String, String> pluginMap;
    Application exportedApplication;
    List<Datasource> datasourceList;
    List<NewPage> pageList;
    List<NewAction> actionList;
}
