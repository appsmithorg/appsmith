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
    @JsonView(Views.Public.class)
    String packageId; // this refers to the `packageUniqueIdentifier` field of the Package domain

    @JsonView(Views.Public.class)
    ModuleType type;

    @JsonView(Views.Public.class)
    String moduleUniqueIdentifier; // ModuleInstance refers to this id

    @JsonView(Views.Public.class)
    ModuleDTO unpublishedModule;

    @JsonView(Views.Public.class)
    ModuleDTO publishedModule;
}
