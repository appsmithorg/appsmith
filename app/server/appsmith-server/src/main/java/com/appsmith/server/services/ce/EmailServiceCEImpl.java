package com.appsmith.server.services.ce;

import com.appsmith.server.constants.FieldName;
import com.appsmith.server.domains.PermissionGroup;
import com.appsmith.server.domains.TenantConfiguration;
import com.appsmith.server.domains.User;
import com.appsmith.server.domains.Workspace;
import com.appsmith.server.notifications.EmailSender;
import com.appsmith.server.services.TenantService;
import org.apache.commons.lang3.StringUtils;
import reactor.core.publisher.Mono;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.HashMap;
import java.util.Map;

import static com.appsmith.server.constants.ce.EmailConstantsCE.*;

public class EmailServiceCEImpl implements EmailServiceCE {
    private final EmailSender emailSender;
    private final TenantService tenantService;

    public EmailServiceCEImpl(EmailSender emailSender, TenantService tenantService) {
        this.emailSender = emailSender;
        this.tenantService = tenantService;
    }

    @Override
    public Mono<Boolean> sendForgotPasswordEmail(String email, String resetUrl, String originHeader) {
        Map<String, String> params = new HashMap<>();
        params.put(RESET_URL, resetUrl);
        return this.enrichParams(params)
                .flatMap(enrichedParams -> this.enrichWithBrandParams(enrichedParams, originHeader)
                        .flatMap(updatedParams -> emailSender.sendMail(
                                email,
                                String.format(FORGOT_PASSWORD_EMAIL_SUBJECT, updatedParams.get(INSTANCE_NAME)),
                                getForgotPasswordTemplate(),
                                updatedParams)));
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
        String emailSubject = String.format(WORKSPACE_EMAIL_SUBJECT_FOR_NEW_USER, workspaceInvitedTo.getName());
        Map<String, String> params = getInviteToWorkspaceEmailParams(
                workspaceInvitedTo, invitingUser, inviteUrl, assignedPermissionGroup.getName(), isNewUser);
        return this.enrichParams(params).flatMap(enrichedParams -> this.enrichWithBrandParams(
                        enrichedParams, originHeader)
                .flatMap(updatedParams -> emailSender.sendMail(
                        invitedUser.getEmail(), emailSubject, getWorkspaceInviteTemplate(isNewUser), updatedParams)));
    }

    @Override
    public Mono<Boolean> sendEmailVerificationEmail(User user, String verificationURL) {
        Map<String, String> params = new HashMap<>();
        params.put(EMAIL_VERIFICATION_URL, verificationURL);
        return this.enrichParams(params).flatMap(enrichedParams -> this.enrichWithBrandParams(enrichedParams, null)
                .flatMap(updatedParams -> emailSender.sendMail(
                        user.getEmail(),
                        EMAIL_VERIFICATION_EMAIL_SUBJECT,
                        EMAIL_VERIFICATION_EMAIL_TEMPLATE,
                        updatedParams)));
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

        String primaryLinkText = isNewUser ? PRIMARY_LINK_TEXT_USER_SIGNUP : PRIMARY_LINK_TEXT_INVITE_TO_INSTANCE;
        params.put(PRIMARY_LINK_TEXT, primaryLinkText);

        if (invitingUser != null) {
            params.put(INVITER_FIRST_NAME, StringUtils.defaultIfEmpty(invitingUser.getName(), invitingUser.getEmail()));
        }
        return this.enrichParams(params)
                .flatMap(enrichedParams -> this.enrichWithBrandParams(enrichedParams, originHeader))
                .flatMap(updatedParams -> emailSender.sendMail(
                        invitedUser.getEmail(),
                        String.format(INSTANCE_ADMIN_INVITE_EMAIL_SUBJECT),
                        getAdminInstanceInviteTemplate(),
                        updatedParams));
    }

    protected Mono<Map<String, String>> enrichParams(Map<String, String> params) {
        return tenantService.getDefaultTenant().map(tenant -> {
            final TenantConfiguration tenantConfiguration = tenant.getTenantConfiguration();
            params.put(INSTANCE_NAME, StringUtils.defaultIfEmpty(tenantConfiguration.getInstanceName(), "Appsmith"));
            return params;
        });
    }

    protected Mono<Map<String, String>> enrichWithBrandParams(Map<String, String> params, String origin) {
        return Mono.just(params);
    }

    protected String getForgotPasswordTemplate() {
        return FORGOT_PASSWORD_TEMPLATE_CE;
    }

    protected String getWorkspaceInviteTemplate(boolean isNewUser) {
        if (isNewUser) return INVITE_WORKSPACE_TEMPLATE_NEW_USER_CE;

        return INVITE_WORKSPACE_TEMPLATE_EXISTING_USER_CE;
    }

    protected String getAdminInstanceInviteTemplate() {
        return INSTANCE_ADMIN_INVITE_EMAIL_TEMPLATE;
    }

    private Map<String, String> getInviteToWorkspaceEmailParams(
            Workspace workspace, User inviter, String inviteUrl, String roleType, boolean isNewUser) {
        Map<String, String> params = new HashMap<>();
        if (workspace != null) {
            params.put(INVITER_WORKSPACE_NAME, workspace.getName());
        }
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
