package com.appsmith.server.dtos.ce;

import com.appsmith.external.views.Views;
import com.appsmith.server.constants.ImportableJsonType;
import com.appsmith.server.domains.CustomJSLib;
import com.appsmith.server.domains.ImportableContext;
import com.fasterxml.jackson.annotation.JsonView;
import lombok.Getter;
import lombok.Setter;
import org.springframework.data.annotation.Transient;

import java.util.List;

@Getter
@Setter
public abstract class ImportableContextJsonCE {

    // To convey the schema version of the client and will be used to check if the imported file is compatible with
    // current DSL schema
    @Transient
    @JsonView({Views.Public.class, Views.Export.class})
    Integer clientSchemaVersion;

    // To convey the schema version of the server and will be used to check if the imported file is compatible with
    // current DB schema
    @Transient
    @JsonView({Views.Public.class, Views.Export.class})
    Integer serverSchemaVersion;

    public abstract ImportableJsonType getImportableJsonType();

    public abstract ImportableContext getImportableContext();

    public abstract List<CustomJSLib> getCustomJsLibFromContext();
}
