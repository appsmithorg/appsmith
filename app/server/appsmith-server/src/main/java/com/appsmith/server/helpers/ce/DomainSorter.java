package com.appsmith.server.helpers.ce;

import com.appsmith.external.models.BaseDomain;
import org.springframework.util.CollectionUtils;
import reactor.core.publisher.Flux;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.function.Function;
import java.util.stream.Collectors;

public class DomainSorter {

    /**
     * Sorts a Flux of domains based on the provided list of ordered domain IDs.
     *
     * @param domainFlux       The Flux of domains to be sorted.
     * @param sortedDomainIds  The list of domain IDs used for sorting.
     * @param <Domain>         The type of the domains, must extend BaseDomain.
     * @return A Flux of sorted domains.
     */
    public static <Domain extends BaseDomain> Flux<Domain> sortDomainsBasedOnOrderedDomainIds(
            Flux<Domain> domainFlux, List<String> sortedDomainIds) {
        if (CollectionUtils.isEmpty(sortedDomainIds)) {
            return domainFlux;
        }
        return domainFlux
                .collect(Collectors.toMap(Domain::getId, Function.identity(), (key1, key2) -> key1, LinkedHashMap::new))
                .map(domainMap -> {
                    List<Domain> sortedDomains = new ArrayList<>();
                    for (String id : sortedDomainIds) {
                        if (domainMap.containsKey(id)) {
                            sortedDomains.add(domainMap.get(id));
                            domainMap.remove(id);
                        }
                    }
                    sortedDomains.addAll(domainMap.values());
                    return sortedDomains;
                })
                .flatMapMany(Flux::fromIterable);
    }
}
