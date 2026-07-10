package com.appsmith.server.services;

import com.appsmith.server.domains.User;
import com.appsmith.server.domains.UserMcpToken;
import com.appsmith.server.dtos.McpTokenResponseDTO;
import com.appsmith.server.repositories.UserMcpTokenRepository;
import com.appsmith.server.repositories.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Captor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class UserMcpTokenServiceImplTest {

    @Mock
    private UserMcpTokenRepository userMcpTokenRepository;

    @Mock
    private UserRepository userRepository;

    @Captor
    private ArgumentCaptor<UserMcpToken> userMcpTokenCaptor;

    private UserMcpTokenServiceImpl service;
    private User user;
    private UserMcpToken persistedToken;

    @BeforeEach
    void setUp() {
        service = new UserMcpTokenServiceImpl(userMcpTokenRepository, userRepository, new BCryptPasswordEncoder());
        user = new User();
        user.setId("user-id");
        user.setIsEnabled(true);
    }

    @Test
    void create_generatesOneTimeTokenAndStoresOnlyHash() {
        when(userMcpTokenRepository.countByUserIdAndDeletedAtIsNull(user.getId()))
                .thenReturn(Mono.just(0L));
        when(userMcpTokenRepository.save(any(UserMcpToken.class)))
                .thenAnswer(invocation -> Mono.just(invocation.getArgument(0)));

        StepVerifier.create(service.create(user))
                .assertNext(response -> {
                    assertThat(response.id()).isNotBlank();
                    assertThat(response.token()).startsWith("mcp_" + response.id() + ".");
                })
                .verifyComplete();

        verify(userMcpTokenRepository).save(userMcpTokenCaptor.capture());
        UserMcpToken storedToken = userMcpTokenCaptor.getValue();
        assertThat(storedToken.getUserId()).isEqualTo(user.getId());
        assertThat(storedToken.getTokenHash()).doesNotStartWith("mcp_");
    }

    @Test
    void create_rejectsWhenUserHasMaximumActiveTokens() {
        when(userMcpTokenRepository.countByUserIdAndDeletedAtIsNull(user.getId()))
                .thenReturn(Mono.just(10L));

        StepVerifier.create(service.create(user)).expectError().verify();
    }

    @Test
    void authenticate_matchesStoredHashAndReturnsOwner() {
        McpTokenResponseDTO generated = createToken();
        when(userMcpTokenRepository.findByTokenIdAndDeletedAtIsNull(persistedToken.getTokenId()))
                .thenReturn(Mono.just(persistedToken));
        when(userRepository.findById(user.getId())).thenReturn(Mono.just(user));

        StepVerifier.create(service.authenticate(generated.token()))
                .expectNext(user)
                .verifyComplete();
    }

    @Test
    void revoke_onlyArchivesTokenOwnedByCurrentUser() {
        UserMcpToken storedToken = new UserMcpToken();
        storedToken.setId("mongo-id");
        storedToken.setTokenId("token-id");
        storedToken.setUserId(user.getId());
        when(userMcpTokenRepository.findByTokenIdAndUserIdAndDeletedAtIsNull("token-id", user.getId()))
                .thenReturn(Mono.just(storedToken));
        when(userMcpTokenRepository.archiveById("mongo-id")).thenReturn(Mono.just(true));

        StepVerifier.create(service.revoke(user, "token-id")).expectNext(true).verifyComplete();

        verify(userMcpTokenRepository).findByTokenIdAndUserIdAndDeletedAtIsNull(eq("token-id"), eq(user.getId()));
        verify(userMcpTokenRepository).archiveById("mongo-id");
    }

    private McpTokenResponseDTO createToken() {
        when(userMcpTokenRepository.countByUserIdAndDeletedAtIsNull(user.getId()))
                .thenReturn(Mono.just(0L));
        when(userMcpTokenRepository.save(any(UserMcpToken.class))).thenAnswer(invocation -> {
            persistedToken = invocation.getArgument(0);
            return Mono.just(persistedToken);
        });

        return service.create(user).block();
    }
}
