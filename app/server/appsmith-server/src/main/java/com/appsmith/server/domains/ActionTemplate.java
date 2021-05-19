package com.appsmith.server.domains;

import com.appsmith.external.models.ActionConfiguration;
import com.appsmith.external.models.BaseDomain;
import com.fasterxml.jackson.databind.JsonNode;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;
import org.springframework.data.mongodb.core.mapping.Document;

import java.util.List;
import java.util.Map;

/**
 * An action template
 */
@Getter
@Setter
@ToString
@NoArgsConstructor
@Document
public class ActionTemplate extends BaseDomain {

    private String pluginId;

    private String methodName;

    private JsonNode template;

    private ActionConfiguration defaultActionConfiguration;

    private JsonNode requestTransformationSpec;

    private Map responseTransformationSpec;

    private List<JsonNode> sampleResponses;

    private String documentation; //Documentation for this particular API comes here

    private String documentationUrl; //URL for this particular api's documentation comes here

    private String versionId;
}
