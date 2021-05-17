package com.appsmith.server.domains;

import lombok.Getter;
import lombok.Setter;

import java.util.List;
import java.util.Map;
import java.util.Set;

@Getter
@Setter
public class ApplicationJson {

    Application exportedApplication;
    List<Datasource> datasourceList;
    List<NewPage> pageList;
    List<NewAction> actionList;

    Map<String, String> decryptedFields;

    /**
     *Mapping mongoEscapedWidgets with layoutId
     */
    Map<String, Set<String>> mongoEscapedWidgets;
}
