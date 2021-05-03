package com.appsmith.server.domains;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
@NoArgsConstructor
public class ApplicationJSONFile {
    Application exportedApplication;
    List<Datasource> datasourceList;
    List<NewPage> pageList;
    List<NewAction> actionList;
}
