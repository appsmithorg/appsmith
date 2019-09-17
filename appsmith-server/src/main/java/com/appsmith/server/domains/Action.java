package com.appsmith.server.domains;

import com.appsmith.external.models.ActionConfiguration;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

@Getter
@Setter
@ToString
@NoArgsConstructor
@Document
public class Action extends BaseDomain {

    String name;

    String resourceId;

    String pluginId;

    String pageId;

    ActionConfiguration actionConfiguration;
}
