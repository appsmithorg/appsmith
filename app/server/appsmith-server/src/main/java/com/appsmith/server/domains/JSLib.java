package com.appsmith.server.domains;

import com.appsmith.external.models.BaseDomain;
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
public class JSLib extends BaseDomain {
    /* Application ID of the application where the lib gets installed. */
    String applicationId;

    /* Name of the installed library. */
    String name;

    /* Library version. */
    String version;

    /* A short description of the library. */
    String description;

    /* URL to find information about the library. */
    String url;

    /**
     * - Namespace string for the library. e.g. if the accessor is "#", then the library methods get accessed like
     * #.concat().
     */
    String accessor;

    /* JSON type definition to be used by the Tern server to provide auto-complete feature for the JS library. */
    String jsonTypeDefinition;
}
