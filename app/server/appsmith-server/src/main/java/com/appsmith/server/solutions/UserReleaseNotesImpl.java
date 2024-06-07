package com.appsmith.server.solutions;

import com.appsmith.server.services.SessionUserService;
import com.appsmith.server.services.UserDataService;
import com.appsmith.server.services.UserService;
import com.appsmith.server.solutions.ce.UserReleaseNotesCEImpl;
import org.springframework.stereotype.Component;

@Component
public class UserReleaseNotesImpl extends UserReleaseNotesCEImpl implements UserReleaseNotes {

    public UserReleaseNotesImpl(
            SessionUserService sessionUserService,
            UserService userService,
            UserDataService userDataService,
            ReleaseNotesService releaseNotesService) {

        super(sessionUserService, userService, userDataService, releaseNotesService);
    }
}
