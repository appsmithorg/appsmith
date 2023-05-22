/* Copyright 2019-2023 Appsmith */
package com.appsmith.server.services.ce;

import com.appsmith.external.models.ActionDTO;
import com.appsmith.server.domains.Collection;
import com.appsmith.server.domains.NewAction;
import com.appsmith.server.services.CrudService;
import java.util.List;
import reactor.core.publisher.Mono;

public interface CollectionServiceCE extends CrudService<Collection, String> {

  Mono<Collection> findById(String id);

  Mono<Collection> addActionsToCollection(Collection collection, List<NewAction> actions);

  Mono<ActionDTO> addSingleActionToCollection(String collectionId, ActionDTO action);

  Mono<NewAction> removeSingleActionFromCollection(String collectionId, Mono<NewAction> action);
}
