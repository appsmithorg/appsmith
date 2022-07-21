package com.appsmith.server.domains;

import com.appsmith.external.models.BaseDomain;
import lombok.Getter;
import lombok.Setter;
import lombok.ToString;
import org.springframework.data.mongodb.core.mapping.Document;

import java.util.Map;

@Getter
@Setter
@ToString
@Document
public class AuditLog extends BaseDomain {
    String name;

    String userId;

    String pageId;

    String newActionId;

    String appId;

    String appName;

    String workspaceId;

    String datasourceId;

    // This field will store all the extra details about the event like instance version
    Map<String, Object> metadata;
}
