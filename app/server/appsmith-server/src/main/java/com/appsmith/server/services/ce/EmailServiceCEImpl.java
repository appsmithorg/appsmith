package com.appsmith.server.services.ce;

import com.appsmith.server.constants.FieldName;
import com.appsmith.server.domains.PermissionGroup;
import com.appsmith.server.domains.User;
import com.appsmith.server.domains.Workspace;
import com.appsmith.server.helpers.EmailServiceHelper;
import com.appsmith.server.helpers.ReactiveContextUtils;
import com.appsmith.server.notifications.EmailSender;
import com.appsmith.server.services.OrganizationService;
import org.apache.commons.lang3.StringUtils;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Mono;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.HashMap;
import java.util.Map;

import static com.appsmith.server.constants.ce.EmailConstantsCE.*;

@Component
public class EmailServiceCEImpl implements EmailServiceCE {
    private final EmailSender emailSender;
    private final EmailServiceHelper emailServiceHelper;
    private final OrganizationService organizationService;

    public EmailServiceCEImpl(
            EmailSender emailSender, EmailServiceHelper emailServiceHelper, OrganizationService organizationService) {
        this.emailSender = emailSender;
        this.emailServiceHelper = emailServiceHelper;
        this.organizationService = organizationService;
    }

    @Override
    public Mono<Boolean> sendForgotPasswordEmail(String email, String resetUrl, String originHeader) {
        Map<String, String> params = new HashMap<>();
        params.put(RESET_URL, resetUrl);
        // TODO @CloudBilling: Considering there won't be a active session for the user, we can't get the
        //  organizationId from the session. We need to get the orgId based on the hostname, for now resorting to
        //  default org id till then.
        return emailServiceHelper
                .enrichWithBrandParams(params, originHeader)
                .zipWith(organizationService.getDefaultOrganizationId())
                .flatMap(tuple2 -> {
                    Map<String, String> updatedParams = tuple2.getT1();
                    String organizationId = tuple2.getT2();
                    return emailSender.sendMail(
                            email,
                            String.format(FORGOT_PASSWORD_EMAIL_SUBJECT, updatedParams.get(INSTANCE_NAME)),
                            emailServiceHelper.getForgotPasswordTemplate(organizationId),
                            updatedParams);
                });
    }

    @Override
    public Mono<Boolean> sendInviteUserToWorkspaceEmail(
            User invitingUser,
            User invitedUser,
            Workspace workspaceInvitedTo,
            PermissionGroup assignedPermissionGroup,
            String originHeader,
            boolean isNewUser) {
        String inviteUrl = isNewUser
                ? String.format(
                        INVITE_USER_CLIENT_URL_FORMAT,
                        originHeader,
                        URLEncoder.encode(invitedUser.getUsername().toLowerCase(), StandardCharsets.UTF_8))
                : originHeader;
        Map<String, String> params = getInviteToWorkspaceEmailParams(
                workspaceInvitedTo, invitingUser, inviteUrl, assignedPermissionGroup.getName(), isNewUser);
        return emailServiceHelper
                .enrichWithBrandParams(params, originHeader)
                .zipWith(ReactiveContextUtils.getCurrentUser())
                .flatMap(tuple2 -> {
                    Map<String, String> updatedParams = tuple2.getT1();
                    String organizationId = tuple2.getT2().getOrganizationId();
                    String emailSubject =
                            emailServiceHelper.getSubjectJoinWorkspace(workspaceInvitedTo.getName(), organizationId);
                    return emailSender.sendMail(
                            invitedUser.getEmail(),
                            emailSubject,
                            emailServiceHelper.getWorkspaceInviteTemplate(isNewUser, organizationId),
                            updatedParams);
                });
    }

    @Override
    public Mono<Boolean> sendEmailVerificationEmail(User user, String verificationURL, String originHeader) {
        Map<String, String> params = new HashMap<>();
        params.put(EMAIL_VERIFICATION_URL, verificationURL);
        return emailServiceHelper
                .enrichWithBrandParams(params, originHeader)
                .flatMap(updatedParams -> emailSender.sendMail(
                        user.getEmail(),
                        EMAIL_VERIFICATION_EMAIL_SUBJECT,
                        emailServiceHelper.getEmailVerificationTemplate(user.getOrganizationId()),
                        updatedParams));
    }

    @Override
    public Mono<Boolean> sendInstanceAdminInviteEmail(
            User invitedUser, User invitingUser, String originHeader, boolean isNewUser) {
        Map<String, String> params = new HashMap<>();
        String inviteUrl = isNewUser
                ? String.format(
                        INVITE_USER_CLIENT_URL_FORMAT,
                        originHeader,
                        URLEncoder.encode(invitedUser.getUsername().toLowerCase(), StandardCharsets.UTF_8))
                : originHeader;
        params.put(PRIMARY_LINK_URL, inviteUrl);

        // In what scenario will the inviting user be null?
        if (invitingUser != null) {
            params.put(INVITER_FIRST_NAME, StringUtils.defaultIfEmpty(invitingUser.getName(), invitingUser.getEmail()));
        }
        return emailServiceHelper
                .enrichWithBrandParams(params, originHeader)
                .zipWith(ReactiveContextUtils.getCurrentUser())
                .flatMap(tuple2 -> {
                    Map<String, String> updatedParams = tuple2.getT1();
                    String organizationId = tuple2.getT2().getOrganizationId();
                    String instanceName = updatedParams.get(INSTANCE_NAME);
                    String subject = emailServiceHelper.getSubjectJoinInstanceAsAdmin(instanceName, organizationId);
                    String primaryLinkText = emailServiceHelper.getJoinInstanceCtaPrimaryText(organizationId);
                    params.put(PRIMARY_LINK_TEXT, primaryLinkText);
                    return emailSender.sendMail(
                            invitedUser.getEmail(),
                            subject,
                            emailServiceHelper.getAdminInstanceInviteTemplate(organizationId),
                            updatedParams);
                });
    }

    private Map<String, String> getInviteToWorkspaceEmailParams(
            Workspace workspace, User inviter, String inviteUrl, String roleType, boolean isNewUser) {
        Map<String, String> params = new HashMap<>();
        if (workspace != null) {
            params.put(INVITER_WORKSPACE_NAME, workspace.getName());
        }
        // In what scenario will the inviter be null?
        if (inviter != null) {
            params.put(INVITER_FIRST_NAME, StringUtils.defaultIfEmpty(inviter.getName(), inviter.getEmail()));
        }
        if (roleType != null) {
            if (roleType.startsWith(FieldName.ADMINISTRATOR)) {
                params.put(FieldName.ROLE, EMAIL_ROLE_ADMINISTRATOR_TEXT);
            } else if (roleType.startsWith(FieldName.DEVELOPER)) {
                params.put(FieldName.ROLE, EMAIL_ROLE_DEVELOPER_TEXT);
            } else if (roleType.startsWith(FieldName.VIEWER)) {
                params.put(FieldName.ROLE, EMAIL_ROLE_VIEWER_TEXT);
            }
        }
        if (isNewUser) {
            params.put(PRIMARY_LINK_URL, inviteUrl);
            params.put(PRIMARY_LINK_TEXT, PRIMARY_LINK_TEXT_USER_SIGNUP);
        } else {
            if (workspace != null) {
                params.put(PRIMARY_LINK_URL, String.format(WORKSPACE_URL, inviteUrl, workspace.getId()));
            }
            params.put(PRIMARY_LINK_TEXT, PRIMARY_LINK_TEXT_WORKSPACE_REDIRECTION);
        }
        return params;
    }
}
