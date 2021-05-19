package com.appsmith.server.domains;

import com.appsmith.external.models.ActionConfiguration;
import com.appsmith.external.models.BaseDomain;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;
import org.springframework.data.mongodb.core.mapping.Document;

import java.util.List;
import java.util.Map;

/**
 * Each plugin can support multiple action templates depending on the number of methods supported
 * This class tracks the form template and configurations required for each of these templates
 */
@Getter
@Setter
@ToString
@NoArgsConstructor
@Document
public class ActionTemplate extends BaseDomain {

    private String pluginId;

    private String methodName;

    // Represents the configuration that the UI will use to render the action form
    private Map template;

    private ActionConfiguration defaultActionConfiguration;

    // Represents the JOLT specification to convert an Appsmith request into
    // the relevant integration specific JSON
    private Map requestTransformationSpec;

    // Represents the JOLT specification to convert an integration's response into user-friendly JSON
    private Map responseTransformationSpec;

    // Samples of what this action returns to help users understand how to consume this action
    private List<Map> sampleResponses;

    private String documentation; //Documentation for this particular API comes here

    private String documentationUrl; //URL for this particular api's documentation comes here

    private String versionId;
}
