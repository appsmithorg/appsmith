package com.appsmith.server.domains;

import com.appsmith.external.models.BranchAwareDomain;
import com.appsmith.external.models.ModuleType;
import com.appsmith.external.views.Views;
import com.appsmith.server.dtos.ModuleInstanceDTO;
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

    // Fields in module instance that are not allowed to change between published and unpublished versions
    @JsonView(Views.Export.class)
    String moduleUUID; // this refers to the `moduleUUID` field of the Module domain

    // TODO: Figure out if we really need `sourceModuleId`
    @JsonView(Views.Public.class)
    String sourceModuleId; // this is the id of the original module from where it's derived

    @JsonView(Views.Public.class)
    ModuleType type;

    @JsonView(Views.Public.class)
    String applicationId;

    // TODO: Identify if there is any use case of workspaceId. If there is any use case found then we should add
    // `workspaceId` field here otherwise we should remove `workspaceId` from other entities too to achieve uniformity

    @JsonView(Views.Public.class)
    String rootModuleInstanceId;

    @JsonView(Views.Public.class)
    ModuleInstanceDTO unpublishedModuleInstance;

    @JsonView(Views.Public.class)
    ModuleInstanceDTO publishedModuleInstance;

    @Override
    public void sanitiseToExportDBObject() {
        this.setApplicationId(null);
        this.setSourceModuleId(null);
        ModuleInstanceDTO unpublishedModuleInstance = this.getUnpublishedModuleInstance();
        if (unpublishedModuleInstance != null) {
            unpublishedModuleInstance.sanitiseForExport();
        }
        ModuleInstanceDTO publishedModuleInstance = this.getPublishedModuleInstance();
        if (publishedModuleInstance != null) {
            publishedModuleInstance.sanitiseForExport();
        }
        super.sanitiseToExportDBObject();
    }
}
