package com.appsmith.server.domains;

import lombok.Getter;
import lombok.Setter;

import java.util.List;

/**
 * A DTO class to hold complete information about an application, which will then be serialized to a file so as to
 * export that application into a file.
 */
@Getter
@Setter
public class ApplicationJson {

    Application exportedApplication;
    
    List<Datasource> datasourceList;
    
    List<NewPage> pageList;
    
    List<NewAction> actionList;
    
    ApplicationMetadata metadata;
}
