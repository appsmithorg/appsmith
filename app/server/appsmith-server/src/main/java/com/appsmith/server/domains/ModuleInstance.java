package com.appsmith.server.domains;

import com.appsmith.external.models.BranchAwareDomain;
import com.appsmith.external.models.ModuleInstanceCreatorType;
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

    @JsonView(Views.Public.class)
    String moduleId;

    // creatorId can be the consuming `pageId` or the consuming `moduleId`
    @JsonView(Views.Public.class)
    String creatorId;

    @JsonView(Views.Public.class)
    ModuleInstanceCreatorType creatorType;

    @JsonView(Views.Public.class)
    ModuleInstanceDTO unpublishedModuleInstance;

    @JsonView(Views.Public.class)
    ModuleInstanceDTO publishedModuleInstance;
}
