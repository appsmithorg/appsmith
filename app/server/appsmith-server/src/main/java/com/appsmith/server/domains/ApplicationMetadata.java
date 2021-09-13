package com.appsmith.server.domains;

import com.appsmith.external.models.DecryptedSensitiveFields;
import lombok.Data;

import java.util.Map;
import java.util.Set;

@Data
public class ApplicationMetadata {

    String publishedDefaultPageName;

    String unpublishedDefaultPageName;

    Map<String, DecryptedSensitiveFields> decryptedFields;

    /**
     * Mapping mongoEscapedWidgets with layoutId
     */
    Map<String, Set<String>> publishedLayoutmongoEscapedWidgets;
    Map<String, Set<String>> unpublishedLayoutmongoEscapedWidgets;

}
