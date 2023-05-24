package com.appsmith.server.helpers.ce;

import com.appsmith.external.models.BaseDomain;
import com.appsmith.external.models.Datasource;
import com.appsmith.external.models.Policy;
import com.appsmith.server.domains.ActionCollection;
import com.appsmith.server.domains.Application;
import com.appsmith.server.domains.NewAction;
import com.appsmith.server.domains.NewPage;
import com.appsmith.server.domains.Workspace;
import com.appsmith.server.solutions.ActionPermission;
import com.appsmith.server.solutions.ActionPermissionImpl;
import com.appsmith.server.solutions.ApplicationPermission;
import com.appsmith.server.solutions.ApplicationPermissionImpl;
import com.appsmith.server.solutions.DatasourcePermission;
import com.appsmith.server.solutions.DatasourcePermissionImpl;
import com.appsmith.server.solutions.DomainPermission;
import com.appsmith.server.solutions.PagePermission;
import com.appsmith.server.solutions.PagePermissionImpl;
import org.junit.jupiter.api.Test;
import reactor.util.function.Tuple2;
import reactor.util.function.Tuples;

import java.util.ArrayList;
import java.util.List;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class ImportApplicationPermissionProviderTest {
    ApplicationPermission applicationPermission = new ApplicationPermissionImpl();
    PagePermission pagePermission = new PagePermissionImpl();
    ActionPermission actionPermission = new ActionPermissionImpl();
    DatasourcePermission datasourcePermission = new DatasourcePermissionImpl();

    @Test
    public void testCheckPermissionMethods_WhenNoPermissionProvided_ReturnsTrue() {
        ImportApplicationPermissionProvider importApplicationPermissionProvider = ImportApplicationPermissionProvider
                .builder()
                .build();

        assertTrue(importApplicationPermissionProvider.hasEditPermission(new NewPage()));
        assertTrue(importApplicationPermissionProvider.hasEditPermission(new NewAction()));
        assertTrue(importApplicationPermissionProvider.hasEditPermission(new ActionCollection()));
        assertTrue(importApplicationPermissionProvider.hasEditPermission(new Datasource()));

        assertTrue(importApplicationPermissionProvider.canCreateDatasource(new Workspace()));
        assertTrue(importApplicationPermissionProvider.canCreateAction(new NewPage()));
        assertTrue(importApplicationPermissionProvider.canCreateActionCollection(new NewPage()));
        assertTrue(importApplicationPermissionProvider.canCreatePage(new Application()));
    }

    @Test
    public void tesHasEditPermissionDomains_WhenPermissionGroupDoesNotMatch_ReturnsFalse() {
        List<Tuple2<BaseDomain, DomainPermission>> domainAndPermissionList = new ArrayList<>();
        domainAndPermissionList.add(Tuples.of(new NewPage(), pagePermission));
        domainAndPermissionList.add(Tuples.of(new NewAction(), actionPermission));
        domainAndPermissionList.add(Tuples.of(new ActionCollection(), actionPermission));
        domainAndPermissionList.add(Tuples.of(new Datasource(), datasourcePermission));

        for(Tuple2<BaseDomain, DomainPermission> domainAndPermission : domainAndPermissionList) {
            BaseDomain domain = domainAndPermission.getT1();
            ImportApplicationPermissionProvider provider = createPermissionProviderForDomainEditPermission(domain, domainAndPermission.getT2());
            if(domain instanceof NewPage) {
                assertFalse(provider.hasEditPermission((NewPage) domain));
            } else if (domain instanceof NewAction) {
                assertFalse(provider.hasEditPermission((NewAction) domain));
            } else if (domain instanceof ActionCollection) {
                assertFalse(provider.hasEditPermission((ActionCollection) domain));
            } else if (domain instanceof Datasource) {
                assertFalse(provider.hasEditPermission((Datasource) domain));
            }
        }
        NewAction domain = new NewAction();
        ImportApplicationPermissionProvider provider = createPermissionProviderForDomainEditPermission(domain, actionPermission);
        assertFalse(provider.hasEditPermission(domain));
    }

    /**
     * Prepares the domain and creates a permission provider to test edit permission check on domain.
     * The method does the following:
     * 1. Adds a policy with the edit permission and dummy groups to the domain.
     * 2. Creates a permission provider with the edit permission on the domain and another permission groups.
     * 3. Returns the permission provider.
     * The permission group in the domain policy and the permission provider are different.
     * Hence, the edit permission check should fail.
     * @param baseDomain
     * @param domainPermission
     * @return
     */
    private ImportApplicationPermissionProvider createPermissionProviderForDomainEditPermission(BaseDomain baseDomain, DomainPermission domainPermission) {
        Set<String> permissionGroups = Set.of("group1", "group2");

        Policy policy = new Policy();
        policy.setPermission(domainPermission.getEditPermission().getValue());
        policy.getPermissionGroups().addAll(permissionGroups);

        Set<Policy> policies = Set.of(policy);
        baseDomain.setPolicies(policies);

        ImportApplicationPermissionProvider.Builder builder = ImportApplicationPermissionProvider
                .builder()
                .userPermissionGroups(Set.of());

        if(baseDomain instanceof NewPage) {
            builder.editPagePermission(domainPermission.getEditPermission());
        } else if(baseDomain instanceof NewAction) {
            builder.editActionPermission(domainPermission.getEditPermission());
        } else if(baseDomain instanceof ActionCollection) {
            builder.editActionCollectionPermission(domainPermission.getEditPermission());
        } else if(baseDomain instanceof Datasource) {
            builder.editDatasourcePermission(domainPermission.getEditPermission());
        }
        return builder.build();
    }
}