

package com.appsmith.server.repositories;

import com.appsmith.server.domains.NewAction;
import com.appsmith.server.repositories.ce.CustomNewActionRepositoryCE;
import reactor.core.publisher.Flux;

import java.util.List;

public interface CustomNewActionRepository extends CustomNewActionRepositoryCE {

    Flux<NewAction> findAllNonJSActionsByApplicationIds(List<String> applicationIds, List<String> includeFields);

    Flux<NewAction> findAllByApplicationIdsWithoutPermission(List<String> applicationIds, List<String> includeFields);

    Flux<NewAction> findAllByActionCollectionIdWithoutPermissions(
            List<String> collectionIds, List<String> includeFields);
}
