package com.appsmith.server.repositories.ce;

import com.appsmith.server.domains.CustomJSLib;
import com.appsmith.server.dtos.CustomJSLibContextDTO;
import com.appsmith.server.helpers.ce.bridge.Bridge;
import com.appsmith.server.helpers.ce.bridge.BridgeQuery;
import com.appsmith.server.repositories.BaseAppsmithRepositoryImpl;
import jakarta.persistence.EntityManager;

import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

public class CustomJSLibRepositoryCEImpl extends BaseAppsmithRepositoryImpl<CustomJSLib>
        implements CustomJSLibRepositoryCE {

    @Override
    public Optional<CustomJSLib> findUniqueCustomJsLib(CustomJSLib customJSLib, EntityManager entityManager) {
        BridgeQuery<CustomJSLib> bridgeQuery = Bridge.equal(CustomJSLib.Fields.uidString, customJSLib.getUidString());

        return queryBuilder().criteria(bridgeQuery).entityManager(entityManager).one();
    }

    @Override
    public List<CustomJSLib> findCustomJsLibsInContext(
            Set<CustomJSLibContextDTO> customJSLibContextDTOS, EntityManager entityManager) {

        Set<String> uidStrings = customJSLibContextDTOS.stream()
                .map(CustomJSLibContextDTO::getUidString)
                .collect(Collectors.toSet());

        BridgeQuery<CustomJSLib> bridgeQuery = Bridge.in(CustomJSLib.Fields.uidString, uidStrings);

        return queryBuilder().criteria(bridgeQuery).entityManager(entityManager).all();
    }
}
