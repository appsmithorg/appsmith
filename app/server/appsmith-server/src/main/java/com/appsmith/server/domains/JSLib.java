package com.appsmith.server.domains;

import com.appsmith.external.models.BaseDomain;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;
import org.springframework.data.annotation.Transient;
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

    /**
     * - A short description of the library.
     * - This info will be fetched from cloud API server. It is not stored locally since this attribute remains
     * constant forever.
     */
    @Transient
    String description;

    /**
     * - URL to find information about the library.
     * - This info will be fetched from cloud API server. It is not stored locally since this attribute remains
     * constant forever.
     */
    @Transient
    String url;

    /**
     * - Namespace string for the library. e.g. if the accessor is "#", then the library methods get accessed like
     * #.concat().
     * - This info will be fetched from cloud API server. It is not stored locally since this attribute remains
     * constant forever.
     */
    @Transient
    String accessor;
}
