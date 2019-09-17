package com.appsmith.server.domains;

import com.appsmith.external.models.ResourceConfiguration;
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
public class Resource extends BaseDomain {
    @Indexed(unique = true)
    String name;

    String pluginId;

    String organizationId;

    ResourceConfiguration resourceConfiguration;

}
