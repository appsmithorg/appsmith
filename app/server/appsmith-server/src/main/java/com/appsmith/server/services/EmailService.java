package com.appsmith.server.services;

import com.appsmith.server.domains.Application;
import com.appsmith.server.domains.User;
import com.appsmith.server.services.ce.EmailServiceCE;
import reactor.core.publisher.Mono;

public interface EmailService extends EmailServiceCE {

    Mono<Boolean> sendInviteUserToApplicationEmail(
            User invitingUser,
            User invitedUser,
            Application applicationInvitedTo,
            String appRoleType,
            String instanceId,
            String originHeader,
            boolean isNewUser);

    Mono<Boolean> sendInviteUserToInstanceEmail(
            User invitingUser, User invitedUser, String appRoleType, String instanceName, String originHeader);

    Mono<Boolean> sendInviteUserToInstanceEmailViaGroupInvite(
            User invitingUser, User invitedUser, String groupAddedTo, String instanceName, String originHeader);
}
