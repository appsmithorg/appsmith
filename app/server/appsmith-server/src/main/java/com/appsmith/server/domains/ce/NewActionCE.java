package com.appsmith.server.domains.ce;

import com.appsmith.external.helpers.CustomJsonType;
import com.appsmith.external.models.ActionConfiguration;
import com.appsmith.external.models.ActionDTO;
import com.appsmith.external.models.Datasource;
import com.appsmith.external.models.Documentation;
import com.appsmith.external.models.PluginType;
import com.appsmith.external.models.RefAwareDomain;
import com.appsmith.external.views.Git;
import com.appsmith.external.views.Views;
import com.fasterxml.jackson.annotation.JsonView;
import jakarta.persistence.Column;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.MappedSuperclass;
import lombok.Getter;
import lombok.Setter;
import lombok.ToString;
import lombok.experimental.FieldNameConstants;
import org.hibernate.annotations.Type;

import static com.appsmith.external.helpers.StringUtils.dotted;

@Getter
@Setter
@ToString
@MappedSuperclass
@FieldNameConstants
public class NewActionCE extends RefAwareDomain {

    // Fields in action that are not allowed to change between published and unpublished versions
    @JsonView(Views.Public.class)
    String applicationId;

    @JsonView(Views.Public.class)
    String workspaceId;

    @JsonView({Views.Public.class, Git.class})
    @Enumerated(EnumType.STRING)
    PluginType pluginType;

    @JsonView({Views.Public.class, Git.class})
    String pluginId;

    @JsonView(Views.Public.class)
    @Type(CustomJsonType.class)
    @Column(columnDefinition = "jsonb")
    Documentation documentation; // Documentation for the template using which this action was created

    // Action specific fields that are allowed to change between published and unpublished versions
    @Type(CustomJsonType.class)
    @Column(columnDefinition = "jsonb")
    @JsonView({Views.Public.class, Git.class})
    ActionDTO unpublishedAction;

    @JsonView(Views.Public.class)
    @Type(CustomJsonType.class)
    @Column(columnDefinition = "jsonb")
    ActionDTO publishedAction;

    @Override
    public void sanitiseToExportDBObject() {
        this.setApplicationId(null);
        this.setWorkspaceId(null);
        this.setDocumentation(null);
        ActionDTO unpublishedAction = this.getUnpublishedAction();
        if (unpublishedAction != null) {
            unpublishedAction.sanitiseToExportDBObject();
        }
        ActionDTO publishedAction = this.getPublishedAction();
        if (publishedAction != null) {
            publishedAction.sanitiseToExportDBObject();
        }
        super.sanitiseToExportDBObject();
    }

    public static class Fields extends RefAwareDomain.Fields {
        public static final String unpublishedAction_datasource_id =
                dotted(unpublishedAction, ActionDTO.Fields.datasource, Datasource.Fields.id);
        public static final String unpublishedAction_name = dotted(unpublishedAction, ActionDTO.Fields.name);
        public static final String unpublishedAction_pageId = dotted(unpublishedAction, ActionDTO.Fields.pageId);
        public static final String unpublishedAction_deletedAt = dotted(unpublishedAction, ActionDTO.Fields.deletedAt);
        public static final String unpublishedAction_contextType =
                dotted(unpublishedAction, ActionDTO.Fields.contextType);
        public static final String unpublishedAction_userSetOnLoad =
                dotted(unpublishedAction, ActionDTO.Fields.userSetOnLoad);
        public static final String unpublishedAction_executeOnLoad =
                dotted(unpublishedAction, ActionDTO.Fields.executeOnLoad);
        public static final String unpublishedAction_fullyQualifiedName =
                dotted(unpublishedAction, ActionDTO.Fields.fullyQualifiedName);
        public static final String unpublishedAction_actionConfiguration_httpMethod =
                dotted(unpublishedAction, ActionDTO.Fields.actionConfiguration, ActionConfiguration.Fields.httpMethod);

        public static final String publishedAction_datasource_id =
                dotted(publishedAction, ActionDTO.Fields.datasource, Datasource.Fields.id);
        public static final String publishedAction_name = dotted(publishedAction, ActionDTO.Fields.name);
        public static final String publishedAction_pageId = dotted(publishedAction, ActionDTO.Fields.pageId);
        public static final String publishedAction_contextType = dotted(publishedAction, ActionDTO.Fields.contextType);

        public static final String unpublishedAction_collectionId =
                dotted(unpublishedAction, ActionDTO.Fields.collectionId);
        public static final String publishedAction_collectionId =
                dotted(publishedAction, ActionDTO.Fields.collectionId);
    }
}
