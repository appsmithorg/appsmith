package com.appsmith.server.domains;

import com.appsmith.external.models.ActionDTO;
import com.appsmith.external.views.Views;
import com.appsmith.server.domains.ce.NewActionCE;
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

        if (Boolean.TRUE.equals(this.getIsPublic())) {
            ActionDTO unpublishedAction = this.getUnpublishedAction();
            if (unpublishedAction != null) {
                unpublishedAction.setActionConfiguration(null);
            }
            ActionDTO publishedAction = this.getPublishedAction();
            if (publishedAction != null) {
                publishedAction.setActionConfiguration(null);
            }
        }
    }
}
