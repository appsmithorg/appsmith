package com.appsmith.server.domains;

import com.appsmith.external.models.ActionDTO;
import com.appsmith.external.views.Views;
import com.appsmith.server.domains.ce.NewActionCE;
import com.fasterxml.jackson.annotation.JsonView;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;
import lombok.experimental.FieldNameConstants;
import org.springframework.data.mongodb.core.mapping.Document;

@Getter
@Setter
@ToString(callSuper = true)
@NoArgsConstructor
@Document
@FieldNameConstants
public class NewAction extends NewActionCE {

    // Fields in action that are not allowed to change between published and unpublished versions
    @JsonView(Views.Public.class)
    String packageId;

    @JsonView(Views.Public.class)
    String moduleInstanceId;

    @JsonView(Views.Public.class)
    Boolean isPublic;

    @JsonView(Views.Public.class)
    String rootModuleInstanceId;

    @JsonView(Views.Public.class)
    String workflowId;

    @JsonView(Views.Public.class)
    String originActionId;

    @Override
    public void sanitiseToExportDBObject() {
        super.sanitiseToExportDBObject();
        this.packageId = null;
        if (this.rootModuleInstanceId != null) {
            this.setOriginActionId(null);
            ActionDTO unpublishedAction = this.getUnpublishedAction();
            if (unpublishedAction != null) {
                unpublishedAction.setActionConfiguration(null);
                if (unpublishedAction.getDatasource() != null) {
                    unpublishedAction.getDatasource().setId(null);
                    unpublishedAction.getDatasource().setWorkspaceId(null);
                }
                unpublishedAction.setDynamicBindingPathList(null);
                unpublishedAction.setJsonPathKeys(null);
            }
            ActionDTO publishedAction = this.getPublishedAction();
            if (publishedAction != null) {
                publishedAction.setActionConfiguration(null);
                if (publishedAction.getDatasource() != null) {
                    publishedAction.getDatasource().setId(null);
                    publishedAction.getDatasource().setWorkspaceId(null);
                }
                publishedAction.setDynamicBindingPathList(null);
                publishedAction.setJsonPathKeys(null);
            }
        }
    }

    public static class Fields extends NewActionCE.Fields {}
}
