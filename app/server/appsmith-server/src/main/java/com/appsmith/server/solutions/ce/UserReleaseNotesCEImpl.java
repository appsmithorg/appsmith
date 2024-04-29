package com.appsmith.server.solutions.ce;

import com.appsmith.server.domains.User;
import com.appsmith.server.domains.UserData;
import com.appsmith.server.dtos.ReleaseItemsDTO;
import com.appsmith.server.dtos.ReleaseNode;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.services.SessionUserService;
import com.appsmith.server.services.UserDataService;
import com.appsmith.server.services.UserService;
import com.appsmith.server.solutions.ReleaseNotesService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import reactor.core.publisher.Mono;

import java.util.Collections;
import java.util.List;

@Slf4j
@RequiredArgsConstructor
public class UserReleaseNotesCEImpl implements UserReleaseNotesCE {

    private final SessionUserService sessionUserService;

    private final UserService userService;
    private final UserDataService userDataService;
    private final ReleaseNotesService releaseNotesService;

    public Mono<ReleaseItemsDTO> getReleaseItems() {
        Mono<User> userMono = sessionUserService
                .getCurrentUser()
                .flatMap(user -> {
                    if (user.isAnonymous()) {
                        return Mono.error(new AppsmithException(AppsmithError.USER_NOT_SIGNED_IN));
                    }
                    return Mono.just(user.getUsername());
                })
                .flatMap(userService::findByEmail)
                .cache();

        Mono<UserData> userDataMono = userDataService
                .getForCurrentUser()
                .defaultIfEmpty(new UserData())
                .cache();

        return Mono.zip(
                        userMono,
                        releaseNotesService
                                .getReleaseNodes()
                                // In case of an error or empty response from CS Server, continue without this data.
                                .onErrorResume(error -> Mono.empty())
                                .defaultIfEmpty(Collections.emptyList()),
                        userDataMono)
                .flatMap(tuple -> {
                    User user = tuple.getT1();
                    final List<ReleaseNode> releaseNodes = tuple.getT2();
                    final UserData userData = tuple.getT3();
                    ReleaseItemsDTO releaseItemsDTO = new ReleaseItemsDTO();
                    releaseItemsDTO.setReleaseItems(releaseNodes);

                    final String count = releaseNotesService.computeNewFrom(userData.getReleaseNotesViewedVersion());
                    releaseItemsDTO.setNewReleasesCount("0".equals(count) ? "" : count);

                    return userDataService
                            .ensureViewedCurrentVersionReleaseNotes(user)
                            .thenReturn(releaseItemsDTO);
                });
    }
}
