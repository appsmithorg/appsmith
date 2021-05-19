package com.appsmith.server.domains;

import com.appsmith.external.models.DecryptedSensitiveFields;
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

    Map<String, DecryptedSensitiveFields> decryptedFields;

    /**
     *Mapping mongoEscapedWidgets with layoutId
     */
    Map<String, Set<String>> mongoEscapedWidgets;
}
