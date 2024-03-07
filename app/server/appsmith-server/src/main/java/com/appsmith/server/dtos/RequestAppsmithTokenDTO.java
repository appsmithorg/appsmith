package com.appsmith.server.dtos;

import com.appsmith.external.models.CreatorContextType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * This is used by the SaaS Controller to get a Appsmith token for a Datasource, based on the contextId and contextType.
 * The contextId can be pageId if the contextType is PAGE, or workflowId if the contextType is WORKFLOW or
 * moduleId if the contextType is MODULE.
 * @author nsarupr
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RequestAppsmithTokenDTO {
    String contextId;
    CreatorContextType contextType;
}
