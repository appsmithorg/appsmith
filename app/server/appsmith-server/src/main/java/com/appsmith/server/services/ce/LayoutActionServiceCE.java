package com.appsmith.server.services.ce;

import com.appsmith.external.models.ActionDTO;
import com.appsmith.external.models.RunBehaviourEnum;
import com.appsmith.server.dtos.ActionMoveDTO;
import com.appsmith.server.dtos.CreateActionMetaDTO;
import reactor.core.publisher.Mono;

public interface LayoutActionServiceCE {

    Mono<ActionDTO> moveAction(ActionMoveDTO actionMoveDTO);

    Mono<ActionDTO> updateAction(String id, ActionDTO actionDTO);

    Mono<ActionDTO> updateSingleAction(String id, ActionDTO actionDTO);

    Mono<ActionDTO> updateNewActionByBranchedId(String branchedId, ActionDTO actionDTO);

    Mono<ActionDTO> setExecuteOnLoad(String id, Boolean isExecuteOnLoad);

    Mono<ActionDTO> setRunBehaviour(String id, RunBehaviourEnum behaviour);

    Mono<ActionDTO> createAction(ActionDTO actionDTO);

    Mono<ActionDTO> createSingleAction(ActionDTO actionDTO);

    Mono<ActionDTO> createSingleAction(ActionDTO actionDTO, Boolean isJsAction);

    Mono<ActionDTO> createAction(ActionDTO actionDTO, CreateActionMetaDTO actionMetaDTO);

    Mono<ActionDTO> deleteUnpublishedAction(String id);
}
