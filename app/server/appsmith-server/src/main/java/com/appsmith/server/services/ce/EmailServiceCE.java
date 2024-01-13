package com.appsmith.server.services.ce;

import com.appsmith.server.domains.PermissionGroup;
import com.appsmith.server.domains.User;
import com.appsmith.server.domains.Workspace;
import reactor.core.publisher.Mono;

public interface EmailServiceCE {
    Mono<Boolean> sendForgotPasswordEmail(String email, String resetUrl, String originHeader);

    Mono<Boolean> sendInviteUserToWorkspaceEmail(
            User invitingUser,
            User invitedUser,
            Workspace workspaceInvitedTo,
            PermissionGroup assignedPermissionGroup,
            String originHeader,
            boolean isNewUser);

    Mono<Boolean> sendEmailVerificationEmail(User user, String verificationUrl, String originHeader);

    Mono<Boolean> sendInstanceAdminInviteEmail(
            User invitedUser, User invitingUser, String originHeader, boolean isNewUser);
}
