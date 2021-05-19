package com.appsmith.server.domains;

import com.appsmith.external.models.BaseDomain;
import com.appsmith.external.models.DatasourceConfiguration;
import com.fasterxml.jackson.databind.JsonNode;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;
import org.springframework.data.mongodb.core.mapping.Document;

import java.util.Map;

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

    private DatasourceConfiguration defaultDatasourceConfiguration;

    // Entry: <MethodName, TemplateId>
    private Map<String, String> actionTemplateIds;
}
