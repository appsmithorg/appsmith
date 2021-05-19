package com.appsmith.server.domains;

import com.appsmith.external.models.BaseDomain;
import com.appsmith.external.models.DatasourceConfiguration;
import com.fasterxml.jackson.databind.JsonNode;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;
import org.springframework.data.mongodb.core.mapping.Document;

/**
 * Each plugin can support multiple datasource templates depending on the authentication mechanism used
 * This class tracks the form template and configurations required for each of these templates
 */
@Getter
@Setter
@ToString
@NoArgsConstructor
@Document
public class DatasourceTemplate extends BaseDomain {

    private String pluginId;

    private Map template;

    private DatasourceConfiguration defaultDatasourceConfiguration;

    // TODO Is this appropriate? Entry: <MethodName, TemplateId>
    // private Map<String, String> actionTemplateIds;
}
