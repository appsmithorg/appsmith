package com.appsmith.server.authentication.handlers;

import com.appsmith.server.domains.User;
import com.appsmith.server.helpers.UserOrganizationHelper;
import com.appsmith.server.repositories.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mockito;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.security.core.userdetails.ReactiveUserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.test.context.junit.jupiter.SpringExtension;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import static org.assertj.core.api.Assertions.assertThat;

@ExtendWith(SpringExtension.class)
public class CustomFormLoginServiceImplUnitTest {
    @MockBean
    private UserRepository repository;

    private ReactiveUserDetailsService reactiveUserDetailsService;

    @MockBean
    UserOrganizationHelper userOrganizationHelper;

    @BeforeEach
    public void setUp() {
        reactiveUserDetailsService = new CustomFormLoginServiceImpl(repository, userOrganizationHelper);
    }

    @Test
    public void findByUsername_WhenUserNameNotFound_ThrowsException() {
        String sampleEmail = "sample-email@example.com";
        Mockito.when(userOrganizationHelper.getCurrentUserOrganizationId()).thenReturn(Mono.just("default-org-id"));
        Mockito.when(repository.findByEmail(sampleEmail)).thenReturn(Mono.empty());
        Mockito.when(repository.findByEmailAndOrganizationId(Mockito.eq(sampleEmail), Mockito.eq("default-org-id")))
                .thenReturn(Mono.empty());
        Mockito.when(repository.findFirstByEmailIgnoreCaseAndOrganizationIdOrderByCreatedAtDesc(
                        Mockito.eq(sampleEmail), Mockito.any()))
                .thenReturn(Mono.empty());

        StepVerifier.create(reactiveUserDetailsService.findByUsername(sampleEmail))
                .expectError(UsernameNotFoundException.class)
                .verify();
    }

    @Test
    public void findByUsername_WhenUserNameExistsWithOtherCase_ReturnsUser() {
        String sampleEmail2 = "sampleEmail@example.com";
        User user = new User();
        user.setPassword("1234");
        user.setEmail(sampleEmail2.toLowerCase());

        Mockito.when(userOrganizationHelper.getCurrentUserOrganizationId()).thenReturn(Mono.just("default-org-id"));
        Mockito.when(repository.findByEmail(sampleEmail2)).thenReturn(Mono.empty());
        Mockito.when(repository.findByEmailAndOrganizationId(Mockito.eq(sampleEmail2), Mockito.eq("default-org-id")))
                .thenReturn(Mono.empty());
        Mockito.when(repository.findFirstByEmailIgnoreCaseAndOrganizationIdOrderByCreatedAtDesc(
                        Mockito.eq(sampleEmail2), Mockito.any()))
                .thenReturn(Mono.just(user));

        StepVerifier.create(reactiveUserDetailsService.findByUsername(sampleEmail2))
                .assertNext(userDetails -> {
                    assertThat(userDetails.getUsername()).isEqualTo(sampleEmail2.toLowerCase());
                    assertThat(userDetails.getPassword()).isEqualTo("1234");
                })
                .verifyComplete();
    }
}
