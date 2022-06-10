package com.appsmith.server.domains;

import com.appsmith.external.models.Datasource;
import com.appsmith.external.models.InvisibleActionFields;
import com.appsmith.external.models.DecryptedSensitiveFields;
import com.fasterxml.jackson.annotation.JsonIgnore;
import lombok.Getter;
import lombok.Setter;
import org.springframework.data.annotation.Transient;

import java.util.ArrayList;
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

    // To convey the schema version of the client and will be used to check if the imported file is compatible with
    // current DSL schema
    @Transient
    Integer clientSchemaVersion;

    // To convey the schema version of the server and will be used to check if the imported file is compatible with
    // current DB schema
    @Transient
    Integer serverSchemaVersion;

    Application exportedApplication;

    List<Datasource> datasourceList;

    List<NewPage> pageList;

    List<String> pageOrder = new ArrayList<>();

    List<String> publishedPageOrder = new ArrayList<>();

    String publishedDefaultPageName;
    
    String unpublishedDefaultPageName;
    
    List<NewAction> actionList;

    List<ActionCollection> actionCollectionList;

    /**
     * This field will be used to store map of files to be updated in local file system by comparing the recent
     * changes in database and the last local git commit.
     * This field can be used while saving resources to local file system and only update the resource files which
     * are updated in the database.
     */
    @JsonIgnore
    Map<String, Set<String>> updatedResources;

    Map<String, DecryptedSensitiveFields> decryptedFields;

    Map<String, InvisibleActionFields> invisibleActionFields;

    Theme editModeTheme;
    Theme publishedTheme;

    /**
     * Mapping mongoEscapedWidgets with layoutId
     */
    Map<String, Set<String>> publishedLayoutmongoEscapedWidgets;
    Map<String, Set<String>> unpublishedLayoutmongoEscapedWidgets;
}
