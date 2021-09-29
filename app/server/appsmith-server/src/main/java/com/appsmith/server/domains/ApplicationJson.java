package com.appsmith.server.domains;

import com.appsmith.external.models.Datasource;
import com.appsmith.external.models.DecryptedSensitiveFields;
import lombok.Getter;
import lombok.Setter;

import java.util.List;
import java.util.Map;
import java.util.Set;

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

    String publishedDefaultPageName;

    String unpublishedDefaultPageName;

    List<NewAction> actionList;

    List<ActionCollection> actionCollectionList;

    Map<String, DecryptedSensitiveFields> decryptedFields;

    /**
     * Mapping mongoEscapedWidgets with layoutId
     */
    Map<String, Set<String>> publishedLayoutmongoEscapedWidgets;
    Map<String, Set<String>> unpublishedLayoutmongoEscapedWidgets;
}
