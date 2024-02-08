package com.appsmith.server.helpers.ce;

import com.appsmith.external.models.BaseDomain;
import org.junit.jupiter.api.Test;
import reactor.core.publisher.Flux;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

import static com.appsmith.server.helpers.ce.DomainSorter.sortDomainsBasedOnOrderedDomainIds;
import static org.junit.jupiter.api.Assertions.assertEquals;

class DomainSorterTest {

    @Test
    void sortDomainsBasedOnOrderedDomainIds_withValidDomainIds_revertWithSameOrder() {
        TestDomain testDomain1 = new TestDomain();
        testDomain1.setId("1");

        TestDomain testDomain2 = new TestDomain();
        testDomain2.setId("2");

        TestDomain testDomain3 = new TestDomain();
        testDomain3.setId("3");

        Flux<TestDomain> domainFlux = Flux.just(testDomain1, testDomain2, testDomain3);

        // List of ordered domain IDs
        List<String> sortedDomainIds = new ArrayList<>(List.of(new String[] {"3", "2", "1"}));

        Flux<TestDomain> resultFlux = sortDomainsBasedOnOrderedDomainIds(domainFlux, sortedDomainIds);

        // Assert
        List<TestDomain> resultList = resultFlux.collectList().block();

        // Ensure the order is as expected
        assert resultList != null;
        List<String> resultIds = resultList.stream().map(TestDomain::getId).collect(Collectors.toList());
        assertEquals(sortedDomainIds, resultIds);
    }

    @Test
    void sortDomainsBasedOnOrderedDomainIds_emptyDomainIds_preserveOriginalOrder() {
        TestDomain testDomain1 = new TestDomain();
        testDomain1.setId("1");

        TestDomain testDomain2 = new TestDomain();
        testDomain2.setId("2");

        TestDomain testDomain3 = new TestDomain();
        testDomain3.setId("3");

        Flux<TestDomain> domainFlux = Flux.just(testDomain1, testDomain3, testDomain2);

        // List of ordered domain IDs
        List<String> sortedDomainIds = new ArrayList<>();

        Flux<TestDomain> resultFlux = sortDomainsBasedOnOrderedDomainIds(domainFlux, sortedDomainIds);

        // Assert
        List<TestDomain> resultList = resultFlux.collectList().block();

        // Ensure the order is as expected
        assert resultList != null;
        List<String> resultIds = resultList.stream().map(TestDomain::getId).collect(Collectors.toList());
        assertEquals(List.of("1", "3", "2"), resultIds);
    }

    private static class TestDomain extends BaseDomain {}
}
