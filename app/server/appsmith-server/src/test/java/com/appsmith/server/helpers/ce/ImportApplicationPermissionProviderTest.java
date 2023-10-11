package com.appsmith.server.helpers.ce;

import com.appsmith.external.models.BaseDomain;
import com.appsmith.external.models.Datasource;
import com.appsmith.external.models.Policy;
import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.domains.ActionCollection;
import com.appsmith.server.domains.Application;
import com.appsmith.server.domains.NewAction;
import com.appsmith.server.domains.NewPage;
import com.appsmith.server.domains.Workspace;
import com.appsmith.server.solutions.ActionPermission;
import com.appsmith.server.solutions.ApplicationPermission;
import com.appsmith.server.solutions.DatasourcePermission;
import com.appsmith.server.solutions.DomainPermission;
import com.appsmith.server.solutions.PagePermission;
import com.appsmith.server.solutions.WorkspacePermission;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import reactor.util.function.Tuple2;
import reactor.util.function.Tuples;

import java.util.ArrayList;
import java.util.List;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

@SpringBootTest
class ImportApplicationPermissionProviderTest {
    @Autowired
    ApplicationPermission applicationPermission;

    @Autowired
    PagePermission pagePermission;

    @Autowired
    ActionPermission actionPermission;

    @Autowired
    DatasourcePermission datasourcePermission;

    @Autowired
    WorkspacePermission workspacePermission;

    @Test
    public void testCheckPermissionMethods_WhenNoPermissionProvided_ReturnsTrue() {
        ImportApplicationPermissionProvider importApplicationPermissionProvider =
                ImportApplicationPermissionProvider.builder(
                                applicationPermission,
                                pagePermission,
                                actionPermission,
                                datasourcePermission,
                                workspacePermission)
                        .build();

        assertTrue(importApplicationPermissionProvider.hasEditPermission(new NewPage()));
        assertTrue(importApplicationPermissionProvider.hasEditPermission(new NewAction()));
        assertTrue(importApplicationPermissionProvider.hasEditPermission(new Datasource()));

        assertTrue(importApplicationPermissionProvider.canCreateDatasource(new Workspace()));
        assertTrue(importApplicationPermissionProvider.canCreateAction(new NewPage()));
        assertTrue(importApplicationPermissionProvider.canCreatePage(new Application()));
    }

    @Test
    public void tesHasEditPermissionOnDomains_WhenPermissionGroupDoesNotMatch_ReturnsFalse() {
        // The tests are very similar, just the permission provider and domain changes, using list of tuples
        // to iterate over the domains and related permission
        // we'll create a permission provider for each domain and check if the edit permission is false

        List<Tuple2<BaseDomain, DomainPermission>> domainAndPermissionList = new ArrayList<>();
        domainAndPermissionList.add(Tuples.of(new NewPage(), pagePermission));
        domainAndPermissionList.add(Tuples.of(new NewAction(), actionPermission));
        domainAndPermissionList.add(Tuples.of(new ActionCollection(), actionPermission));
        domainAndPermissionList.add(Tuples.of(new Datasource(), datasourcePermission));

        for (Tuple2<BaseDomain, DomainPermission> domainAndPermission : domainAndPermissionList) {
            BaseDomain domain = domainAndPermission.getT1();
            // create a permission provider that sets edit permission on the domain
            ImportApplicationPermissionProvider provider =
                    createPermissionProviderForDomainEditPermission(domain, domainAndPermission.getT2());

            if (domain instanceof NewPage) {
                assertFalse(provider.hasEditPermission((NewPage) domain));
            } else if (domain instanceof NewAction) {
                assertFalse(provider.hasEditPermission((NewAction) domain));
            } else if (domain instanceof Datasource) {
                assertFalse(provider.hasEditPermission((Datasource) domain));
            }
        }
    }

    @Test
    public void tesHasCreatePermissionOnDomains_WhenPermissionGroupDoesNotMatch_ReturnsFalse() {
        // The tests are very similar, just the permission provider and domain changes, using list of tuples
        // to iterate over the domains and related permission
        // we'll create a permission provider for each domain and check if the create permission is false

        List<Tuple2<BaseDomain, AclPermission>> domainAndPermissionList = new ArrayList<>();
        domainAndPermissionList.add(Tuples.of(new Application(), applicationPermission.getPageCreatePermission()));
        domainAndPermissionList.add(Tuples.of(new NewPage(), pagePermission.getActionCreatePermission()));
        domainAndPermissionList.add(Tuples.of(new Workspace(), workspacePermission.getDatasourceCreatePermission()));

        for (Tuple2<BaseDomain, AclPermission> domainAndPermission : domainAndPermissionList) {
            BaseDomain domain = domainAndPermission.getT1();
            // create a permission provider that sets edit permission on the domain
            ImportApplicationPermissionProvider provider =
                    createPermissionProviderForDomainCreatePermission(domain, domainAndPermission.getT2());

            if (domain instanceof Application) {
                assertFalse(provider.canCreatePage((Application) domain));
            } else if (domain instanceof NewPage) {
                assertFalse(provider.canCreateAction((NewPage) domain));
            } else if (domain instanceof Workspace) {
                assertFalse(provider.canCreateDatasource((Workspace) domain));
            }
        }
    }

    @Test
    public void tesBuilderIsSettingTheCorrectParametersToPermissionProvider() {
        ImportApplicationPermissionProvider.Builder builder = ImportApplicationPermissionProvider.builder(
                applicationPermission, pagePermission, actionPermission, datasourcePermission, workspacePermission);

        assertThat(builder.requiredPermissionOnTargetApplication(applicationPermission.getEditPermission())
                        .build()
                        .getRequiredPermissionOnTargetApplication())
                .isEqualTo(applicationPermission.getEditPermission());

        assertThat(builder.requiredPermissionOnTargetWorkspace(workspacePermission.getReadPermission())
                        .build()
                        .getRequiredPermissionOnTargetWorkspace())
                .isEqualTo(workspacePermission.getReadPermission());

        assertTrue(builder.permissionRequiredToCreateDatasource(true).build().isPermissionRequiredToCreateDatasource());
        assertTrue(builder.permissionRequiredToCreatePage(true).build().isPermissionRequiredToCreatePage());
        assertTrue(builder.permissionRequiredToCreateAction(true).build().isPermissionRequiredToCreateAction());

        assertTrue(builder.permissionRequiredToEditDatasource(true).build().isPermissionRequiredToEditDatasource());
        assertTrue(builder.permissionRequiredToEditPage(true).build().isPermissionRequiredToEditPage());
        assertTrue(builder.permissionRequiredToEditAction(true).build().isPermissionRequiredToEditAction());
    }

    @Test
    public void testAllPermissionsRequiredIsSettingAllPermissionsAsRequired() {
        ImportApplicationPermissionProvider provider = ImportApplicationPermissionProvider.builder(
                        applicationPermission,
                        pagePermission,
                        actionPermission,
                        datasourcePermission,
                        workspacePermission)
                .allPermissionsRequired()
                .build();

        assertTrue(provider.isPermissionRequiredToCreateDatasource());
        assertTrue(provider.isPermissionRequiredToCreatePage());
        assertTrue(provider.isPermissionRequiredToCreateAction());
        assertTrue(provider.isPermissionRequiredToEditDatasource());
        assertTrue(provider.isPermissionRequiredToEditPage());
        assertTrue(provider.isPermissionRequiredToEditAction());
    }

    /**
     * Prepares the domain and creates a permission provider to test edit permission check on domain.
     * The method does the following:
     * 1. Adds a policy with the edit permission and dummy groups to the domain.
     * 2. Creates a permission provider with corresponding edit permission as required
     * 3. Returns the permission provider.
     * The permission group in the domain policy and the permission provider are different.
     * Hence, the edit permission check should fail.
     * @param baseDomain
     * @param domainPermission
     * @return
     */
    private ImportApplicationPermissionProvider createPermissionProviderForDomainEditPermission(
            BaseDomain baseDomain, DomainPermission domainPermission) {
        setPoliciesToDomain(baseDomain, domainPermission.getEditPermission());

        ImportApplicationPermissionProvider.Builder builder = ImportApplicationPermissionProvider.builder(
                        applicationPermission,
                        pagePermission,
                        actionPermission,
                        datasourcePermission,
                        workspacePermission)
                .currentUserPermissionGroups(Set.of());

        if (baseDomain instanceof NewPage) {
            builder.permissionRequiredToEditPage(true);
        } else if (baseDomain instanceof NewAction) {
            builder.permissionRequiredToEditAction(true);
        } else if (baseDomain instanceof Datasource) {
            builder.permissionRequiredToEditDatasource(true);
        }
        return builder.build();
    }

    /**
     * Prepares the domain and creates a permission provider to test create resource permission check on domain.
     * The method does the following:
     * 1. Adds a policy with the edit permission and dummy groups to the domain.
     * 2. Creates a permission provider with the corresponding permission as required.
     * 3. Returns the permission provider.
     * The permission group in the domain policy and the permission provider are different.
     * Hence, the create resource permission check should fail.
     * @param baseDomain
     * @param permission
     * @return
     */
    private ImportApplicationPermissionProvider createPermissionProviderForDomainCreatePermission(
            BaseDomain baseDomain, AclPermission permission) {
        setPoliciesToDomain(baseDomain, permission);

        ImportApplicationPermissionProvider.Builder builder = ImportApplicationPermissionProvider.builder(
                        applicationPermission,
                        pagePermission,
                        actionPermission,
                        datasourcePermission,
                        workspacePermission)
                .currentUserPermissionGroups(Set.of());

        if (baseDomain instanceof Application) {
            builder.permissionRequiredToCreatePage(true);
        } else if (baseDomain instanceof NewPage) {
            builder.permissionRequiredToCreateAction(true);
        } else if (baseDomain instanceof Workspace) {
            builder.permissionRequiredToCreateDatasource(true);
        }
        return builder.build();
    }

    private void setPoliciesToDomain(BaseDomain baseDomain, AclPermission aclPermission) {
        Set<String> permissionGroups = Set.of("group1", "group2");

        Policy policy = new Policy();
        policy.setPermission(aclPermission.getValue());
        policy.getPermissionGroups().addAll(permissionGroups);

        Set<Policy> policies = Set.of(policy);
        baseDomain.setPolicies(policies);
    }
}
