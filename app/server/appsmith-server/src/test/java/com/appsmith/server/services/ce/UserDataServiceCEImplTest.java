package com.appsmith.server.services.ce;

import com.appsmith.external.enums.WorkspaceResourceContext;
import com.appsmith.server.domains.User;
import com.appsmith.server.domains.UserData;
import com.appsmith.server.dtos.RecentlyUsedEntityDTO;
import com.appsmith.server.repositories.UserDataRepository;
import com.appsmith.server.services.AnalyticsService;
import com.appsmith.server.services.SessionUserService;
import jakarta.validation.Validator;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import java.util.ArrayList;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class UserDataServiceCEImplTest {

    @Mock
    private Validator validator;

    @Mock
    private UserDataRepository userDataRepository;

    @Mock
    private AnalyticsService analyticsService;

    @Mock
    private SessionUserService sessionUserService;

    private UserDataServiceCEImpl userDataService;

    private final User user = new User();
    private final UserData userData = new UserData("user-1");

    @BeforeEach
    void setUp() {
        user.setId("user-1");
        user.setEmail("builder@example.com");
        when(sessionUserService.getCurrentUser()).thenReturn(Mono.just(user));
        when(userDataRepository.findByUserId("user-1")).thenReturn(Mono.just(userData));
        when(userDataRepository.save(any(UserData.class)))
                .thenAnswer(invocation -> Mono.just(invocation.getArgument(0)));
        // Lenient: the unchanged-workspace path must not reach this stub at all.
        lenient()
                .when(analyticsService.identifyUser(any(User.class), any(UserData.class), anyString()))
                .thenReturn(Mono.just(user));

        userDataService = new UserDataServiceCEImpl(
                validator,
                userDataRepository,
                analyticsService,
                null, // userRepository
                sessionUserService,
                null, // assetService
                null, // releaseNotesService
                null, // featureFlagService
                null, // applicationRepository
                null, // applicationPermission
                null); // organizationService
    }

    private static List<RecentlyUsedEntityDTO> recentlyUsed(String... workspaceIds) {
        List<RecentlyUsedEntityDTO> entities = new ArrayList<>();
        for (String workspaceId : workspaceIds) {
            RecentlyUsedEntityDTO entity = new RecentlyUsedEntityDTO();
            entity.setWorkspaceId(workspaceId);
            entity.setApplicationIds(new ArrayList<>(List.of("app-in-" + workspaceId)));
            entities.add(entity);
        }
        return entities;
    }

    @Test
    void updateLastUsedResource_sameWorkspaceAsMostRecent_savesWithoutIdentifying() {
        userData.setRecentlyUsedEntityIds(recentlyUsed("ws-1", "ws-2"));

        StepVerifier.create(userDataService.updateLastUsedResourceAndWorkspaceList(
                        "app-2", "ws-1", WorkspaceResourceContext.APPLICATIONS))
                .assertNext(saved -> {
                    assertEquals("ws-1", saved.getRecentlyUsedEntityIds().get(0).getWorkspaceId());
                    assertEquals(
                            List.of("app-2", "app-in-ws-1"),
                            saved.getRecentlyUsedEntityIds().get(0).getApplicationIds());
                })
                .verifyComplete();

        verify(userDataRepository, times(1)).save(userData);
        verify(analyticsService, never()).identifyUser(any(), any(), anyString());
    }

    @Test
    void updateLastUsedResource_differentWorkspace_identifiesWithNewWorkspace() {
        userData.setRecentlyUsedEntityIds(recentlyUsed("ws-1", "ws-2"));

        StepVerifier.create(userDataService.updateLastUsedResourceAndWorkspaceList(
                        "app-9", "ws-2", WorkspaceResourceContext.APPLICATIONS))
                .assertNext(saved -> assertEquals(
                        "ws-2", saved.getRecentlyUsedEntityIds().get(0).getWorkspaceId()))
                .verifyComplete();

        verify(userDataRepository, times(1)).save(userData);
        verify(analyticsService, times(1)).identifyUser(eq(user), eq(userData), eq("ws-2"));
    }

    @Test
    void updateLastUsedResource_noHistory_identifies() {
        userData.setRecentlyUsedEntityIds(null);

        StepVerifier.create(userDataService.updateLastUsedResourceAndWorkspaceList(
                        "app-1", "ws-1", WorkspaceResourceContext.APPLICATIONS))
                .assertNext(saved -> assertEquals(
                        "ws-1", saved.getRecentlyUsedEntityIds().get(0).getWorkspaceId()))
                .verifyComplete();

        verify(analyticsService, times(1)).identifyUser(eq(user), eq(userData), eq("ws-1"));
    }
}
