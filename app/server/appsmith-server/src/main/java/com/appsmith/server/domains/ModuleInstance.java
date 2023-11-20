package com.appsmith.server.domains;

import com.appsmith.external.models.BranchAwareDomain;
import com.appsmith.external.models.CreatorContextType;
import com.appsmith.external.models.ModuleInstanceDTO;
import com.appsmith.external.views.Views;
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
public class ModuleInstance extends BranchAwareDomain {

    @JsonView(Views.Export.class)
    String moduleUUID; // this refers to the `moduleUUID` field of the Module domain

    @JsonView(Views.Public.class)
    String sourceModuleId; // this is the id of the original module from where it's derived

    @JsonView(Views.Public.class)
    CreatorContextType contextType;

    @JsonView(Views.Public.class)
    String moduleId; // if module is instantiated in the context of MODULE then this moduleId will have the id of that
    // module

    @JsonView(Views.Public.class)
    String pageId; // if module is instantiated in the context of PAGE then this moduleId will have the id of that page

    @JsonView(Views.Public.class)
    ModuleInstanceDTO unpublishedModuleInstance;

    @JsonView(Views.Public.class)
    ModuleInstanceDTO publishedModuleInstance;
}
