package com.appsmith.server.dtos;

import com.appsmith.external.models.RunBehaviourEnum;
import com.appsmith.external.views.Views;
import com.fasterxml.jackson.annotation.JsonView;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
/**
 * This class would be used to send any action updates that have happened as part of update layout. The client should
 * consume this structure to update the actions in its local storage (instead of fetching all the page actions afresh).
 */
public class LayoutExecutableUpdateDTO {
    @JsonView(Views.Public.class)
    String id;

    @JsonView(Views.Public.class)
    String name;

    @JsonView(Views.Public.class)
    String collectionId;

    @Deprecated
    @JsonView(Views.Internal.class)
    Boolean executeOnLoad;

    @JsonView(Views.Public.class)
    RunBehaviourEnum runBehaviour;

    /**
     * Custom getter for runBehaviour that provides fallback to executeOnLoad if runBehaviour is null
     *
     * @return The runBehaviour, or a value derived from executeOnLoad if runBehaviour is null
     */
    public RunBehaviourEnum getRunBehaviour() {
        if (runBehaviour != null) {
            return runBehaviour;
        }
        if (executeOnLoad != null) {
            return Boolean.TRUE.equals(executeOnLoad) ? RunBehaviourEnum.ON_PAGE_LOAD : RunBehaviourEnum.MANUAL;
        }
        return null;
    }
}
