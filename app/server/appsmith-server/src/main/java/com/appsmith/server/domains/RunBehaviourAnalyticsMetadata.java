package com.appsmith.server.domains;

import com.appsmith.external.models.ActionDTO;
import com.appsmith.external.models.CreatorContextType;
import com.appsmith.external.models.RunBehaviourEnum;
import com.appsmith.server.enums.RunBehaviourUpdateSource;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class RunBehaviourAnalyticsMetadata {
    private ActionDTO actionDTO;
    private RunBehaviourEnum oldRunBehaviour;
    private CreatorContextType creatorContextType;
    private RunBehaviourUpdateSource wasChangedBy;
    private boolean isActionPartOfModuleInstance;
}
