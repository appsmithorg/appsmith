package com.appsmith.server.dtos.ce;

import com.appsmith.server.constants.ArtifactJsonType;
import com.appsmith.server.domains.CustomJSLib;
import com.appsmith.server.domains.ImportableContext;

import java.util.List;

public interface ImportableContextJsonCE {

    Integer getClientSchemaVersion();

    void setClientSchemaVersion(Integer clientSchemaVersion);

    Integer getServerSchemaVersion();

    void setServerSchemaVersion(Integer serverSchemaVersion);

    ArtifactJsonType getImportableJsonType();

    ImportableContext getImportableContext();

    List<CustomJSLib> getCustomJsLibFromContext();
}
