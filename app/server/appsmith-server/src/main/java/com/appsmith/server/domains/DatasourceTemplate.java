package com.appsmith.server.domains;

import com.appsmith.external.models.BaseDomain;
import com.fasterxml.jackson.databind.JsonNode;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;
import org.springframework.data.mongodb.core.mapping.Document;

/**
 * A datasource template
 */
@Getter
@Setter
@ToString
@NoArgsConstructor
@Document
public class DatasourceTemplate extends BaseDomain {

    private String pluginId;

    private JsonNode template;
}
