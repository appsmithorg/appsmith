package com.appsmith.server.domains;

import com.appsmith.external.models.*;
import com.appsmith.external.views.Views;
import com.appsmith.server.dtos.ModuleDTO;
import com.fasterxml.jackson.annotation.JsonView;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;
import org.springframework.data.mongodb.core.mapping.Document;

@Getter
@Setter
@ToString
@NoArgsConstructor
@Document
public class Module extends BranchAwareDomain {

    // Fields in module that are not allowed to change between published and unpublished versions
    @JsonView(Views.Export.class)
    String packageUUID; // this refers to the `packageUUID` field of the Package domain

    @JsonView(Views.Public.class)
    String packageId; // this refers to the `id` field of the Package domain

    @JsonView(Views.Public.class)
    ModuleType type;

    @JsonView(Views.Public.class)
    String moduleUUID; // `moduleUUID` is not globally unique but within the workspace

    @JsonView(Views.Internal.class)
    String originModuleId;

    // `unpublishedModule` will be empty in case of published version of the module document.
    @JsonView(Views.Public.class)
    ModuleDTO unpublishedModule;

    // `publishedModule` will be empty in case of unpublished version aka DEV version of the module document.
    @JsonView(Views.Public.class)
    ModuleDTO publishedModule;
}
