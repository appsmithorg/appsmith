package com.appsmith.server.services;

import com.appsmith.external.models.Policy;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.domains.Organization;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import org.junit.Before;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.security.test.context.support.WithUserDetails;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.context.junit4.SpringJUnit4ClassRunner;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import java.util.Set;

import static com.appsmith.server.acl.AclPermission.MANAGE_APPLICATIONS;
import static com.appsmith.server.acl.AclPermission.MANAGE_ORGANIZATIONS;
import static com.appsmith.server.acl.AclPermission.ORGANIZATION_MANAGE_APPLICATIONS;
import static org.assertj.core.api.Assertions.assertThat;

@RunWith(SpringJUnit4ClassRunner.class)
@SpringBootTest
@DirtiesContext
public class OrganizationServiceTest {

    @Autowired
    OrganizationService organizationService;

    Organization organization;

    @Before
    public void setup() {
        organization = new Organization();
        organization.setName("Test Name");
        organization.setDomain("example.com");
        organization.setWebsite("https://example.com");
        organization.setSlug("test-name");
    }

    /* Tests for the Create Organization Flow */

    @Test
    @WithUserDetails(value = "api_user")
    public void nullCreateOrganization() {
        Mono<Organization> organizationResponse = organizationService.create(null);
        StepVerifier.create(organizationResponse)
                .expectErrorMatches(throwable -> throwable instanceof AppsmithException &&
                        throwable.getMessage().equals(AppsmithError.INVALID_PARAMETER.getMessage(FieldName.ORGANIZATION)))
                .verify();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void nullName() {
        organization.setName(null);
        Mono<Organization> organizationResponse = organizationService.create(organization);
        StepVerifier.create(organizationResponse)
                .expectErrorMatches(throwable -> throwable instanceof AppsmithException &&
                        throwable.getMessage().equals(AppsmithError.INVALID_PARAMETER.getMessage(FieldName.NAME)))
                .verify();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void validCreateOrganizationTest() {
        Policy manageOrgAppPolicy = Policy.builder().permission(ORGANIZATION_MANAGE_APPLICATIONS.getValue())
                .users(Set.of("api_user"))
                .build();

        Policy manageOrgPolicy = Policy.builder().permission(MANAGE_ORGANIZATIONS.getValue())
                .users(Set.of("api_user"))
                .build();

        Mono<Organization> organizationResponse = organizationService.create(organization)
                .switchIfEmpty(Mono.error(new Exception("create is returning empty!!")));
        StepVerifier.create(organizationResponse)
                .assertNext(organization1 -> {
                    assertThat(organization1.getName()).isEqualTo("Test Name");
                    assertThat(organization1.getPolicies()).isNotEmpty();
                    assertThat(organization1.getPolicies()).containsAll(Set.of(manageOrgAppPolicy, manageOrgPolicy));
                })
                .verifyComplete();
    }

    /* Tests for Get Organization Flow */

    @Test
    @WithUserDetails(value = "api_user")
    public void getOrganizationInvalidId() {
        Mono<Organization> organizationMono = organizationService.getById("random-id");
        StepVerifier.create(organizationMono)
                .expectErrorMatches(throwable -> throwable instanceof AppsmithException &&
                        throwable.getMessage().equals(AppsmithError.NO_RESOURCE_FOUND.getMessage("resource", "random-id")))
                .verify();
    }

    @Test
    @WithMockUser(username = "api_user")
    public void getOrganizationNullId() {
        Mono<Organization> organizationMono = organizationService.getById(null);
        StepVerifier.create(organizationMono)
                .expectErrorMatches(throwable -> throwable instanceof AppsmithException &&
                        throwable.getMessage().equals(AppsmithError.INVALID_PARAMETER.getMessage(FieldName.ID)))
                .verify();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void validGetOrganizationByName() {
        Organization organization = new Organization();
        organization.setName("Test For Get Name");
        organization.setDomain("example.com");
        organization.setWebsite("https://example.com");
        organization.setSlug("test-for-get-name");
        Mono<Organization> createOrganization = organizationService.create(organization);
        Mono<Organization> getOrganization = createOrganization.flatMap(t -> organizationService.findById(t.getId()));
        StepVerifier.create(getOrganization)
                .assertNext(t -> {
                    assertThat(t).isNotNull();
                    assertThat(t.getName()).isEqualTo("Test For Get Name");
                })
                .verifyComplete();
    }

    /* Tests for Update Organization Flow */
    @Test
    @WithUserDetails(value = "api_user")
    public void validUpdateOrganization() {
        Organization organization = new Organization();
        organization.setName("Test Update Name");
        organization.setDomain("example.com");
        organization.setWebsite("https://example.com");
        organization.setSlug("test-update-name");

        Mono<Organization> createOrganization = organizationService.create(organization);
        Mono<Organization> updateOrganization = createOrganization
                .map(t -> {
                    t.setDomain("abc.com");
                    return t;
                })
                .flatMap(t -> organizationService.update(t.getId(), t))
                .flatMap(t -> organizationService.findById(t.getId()));

        StepVerifier.create(updateOrganization)
                .assertNext(t -> {
                    assertThat(t).isNotNull();
                    assertThat(t.getName()).isEqualTo(organization.getName());
                    assertThat(t.getId()).isEqualTo(organization.getId());
                    assertThat(t.getDomain()).isEqualTo("abc.com");
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void uniqueSlugs() {
        Organization organization = new Organization();
        organization.setName("First slug org");
        organization.setDomain("example.com");
        organization.setWebsite("https://example.com");

        Mono<String> uniqueSlug = organizationService.getNextUniqueSlug("slug-org")
            .map(slug -> {
                organization.setSlug(slug);
                return organization;
            })
            .flatMap(organizationService::create)
            .then(organizationService.getNextUniqueSlug("slug-org"));

        StepVerifier.create(uniqueSlug)
                .assertNext(slug -> {
                    assertThat(slug).isNotEqualTo("slug-org");
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void createDuplicateNameOrganization() {
        Organization firstOrg = new Organization();
        firstOrg.setName("Really good org");
        firstOrg.setDomain("example.com");
        firstOrg.setWebsite("https://example.com");

        Organization secondOrg = new Organization();
        secondOrg.setName(firstOrg.getName());
        secondOrg.setDomain(firstOrg.getDomain());
        secondOrg.setWebsite(firstOrg.getWebsite());

        Mono<Organization> firstOrgCreation = organizationService.create(firstOrg).cache();
        Mono<Organization> secondOrgCreation = firstOrgCreation.then(organizationService.create(secondOrg));

        StepVerifier.create(Mono.zip(firstOrgCreation, secondOrgCreation))
                .assertNext(orgsTuple -> {
                    assertThat(orgsTuple.getT1().getSlug()).isEqualTo("really-good-org");
                    assertThat(orgsTuple.getT2().getSlug()).isEqualTo("really-good-org2");
                })
                .verifyComplete();
    }
}
