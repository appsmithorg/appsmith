package com.appsmith.server.services;

import com.appsmith.server.constants.FieldName;
import com.appsmith.server.constants.ce.FieldNameCE;
import com.appsmith.server.domains.Application;
import com.appsmith.server.domains.ApplicationMode;
import com.appsmith.server.domains.TenantConfiguration;
import com.appsmith.server.domains.User;
import com.appsmith.server.notifications.EmailSender;
import com.appsmith.server.services.ce.EmailServiceCEImpl;
import org.apache.commons.lang3.StringUtils;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.HashMap;
import java.util.Map;

import static com.appsmith.server.constants.EmailConstants.*;
import static com.appsmith.server.constants.FieldName.INSTANCE_ID;
import static com.appsmith.server.constants.ce.EmailConstantsCE.INVITER_FIRST_NAME;
import static com.appsmith.server.domains.TenantConfiguration.DEFAULT_APPSMITH_LOGO;
import static com.appsmith.server.domains.TenantConfiguration.DEFAULT_BACKGROUND_COLOR;
import static com.appsmith.server.domains.TenantConfiguration.DEFAULT_FONT_COLOR;
import static com.appsmith.server.domains.TenantConfiguration.DEFAULT_PRIMARY_COLOR;
import static org.apache.commons.lang.StringUtils.defaultIfEmpty;

@Service
public class EmailServiceImpl extends EmailServiceCEImpl implements EmailService {

    private final EmailSender emailSender;
    private final TenantService tenantService;

    public EmailServiceImpl(EmailSender emailSender, TenantService tenantService) {
        super(emailSender, tenantService);
        this.emailSender = emailSender;
        this.tenantService = tenantService;
    }

    @Override
    public Mono<Boolean> sendInviteUserToApplicationEmail(
            User invitingUser,
            User invitedUser,
            Application applicationInvitedTo,
            String appRoleType,
            String instanceId,
            String originHeader,
            boolean isNewUser) {

        String inviteUrl = isNewUser
                ? String.format(
                        INVITE_USER_CLIENT_URL_FORMAT,
                        originHeader,
                        URLEncoder.encode(invitedUser.getUsername().toLowerCase(), StandardCharsets.UTF_8))
                : originHeader;

        Map<String, String> params = getApplicationEmailParams(
                invitingUser, applicationInvitedTo, inviteUrl, appRoleType, instanceId, isNewUser);

        String subject = "";

        if (isNewUser) {
            subject = String.format(APPLICATION_EMAIL_SUBJECT_FOR_NEW_USER, params.get(INVITER_APPLICATION_NAME));
        } else {
            subject = String.format(
                    APPLICATION_EMAIL_SUBJECT_FOR_EXISTING_USER,
                    params.get(INVITER_FIRST_NAME),
                    params.get(INVITER_APPLICATION_NAME));
        }

        String finalSubject = subject;

        return enrichWithBrandParams(params, originHeader)
                .flatMap(updatedParams ->
                        emailSender.sendMail(invitedUser.getEmail(), finalSubject, INVITE_APP_TEMPLATE, updatedParams));
    }

    @Override
    public Mono<Boolean> sendInviteUserToInstanceEmail(
            User invitingUser, User invitedUser, String addedRole, String instanceName, String originHeader) {
        String inviteUrl = String.format(
                INVITE_USER_CLIENT_URL_FORMAT,
                originHeader,
                URLEncoder.encode(invitedUser.getUsername().toLowerCase(), StandardCharsets.UTF_8));
        String emailSubject = String.format(INVITE_TO_INSTANCE_EMAIL_SUBJECT, instanceName);
        Map<String, String> params =
                getInstanceEmailParamsForRoleInvite(invitingUser, inviteUrl, addedRole, instanceName);
        return enrichWithBrandParams(params, originHeader)
                .flatMap(updatedParams -> emailSender.sendMail(
                        invitedUser.getEmail(), emailSubject, INVITE_TO_INSTANCE_EMAIL_TEMPLATE, params));
    }

    @Override
    public Mono<Boolean> sendInviteUserToInstanceEmailViaGroupInvite(
            User invitingUser, User invitedUser, String groupAddedTo, String instanceName, String originHeader) {
        String inviteUrl = String.format(
                INVITE_USER_CLIENT_URL_FORMAT,
                originHeader,
                URLEncoder.encode(invitedUser.getUsername().toLowerCase(), StandardCharsets.UTF_8));
        String emailSubject = String.format(INVITE_TO_INSTANCE_EMAIL_SUBJECT_VIA_GROUP, groupAddedTo);
        Map<String, String> params =
                getInstanceEmailParamsForGroupInvite(invitingUser, inviteUrl, groupAddedTo, instanceName);
        return enrichWithBrandParams(params, originHeader)
                .flatMap(updatedParams -> emailSender.sendMail(
                        invitedUser.getEmail(), emailSubject, INVITE_TO_INSTANCE_EMAIL_TEMPLATE_VIA_GROUPS, params));
    }

    @Override
    protected Mono<Map<String, String>> enrichWithBrandParams(Map<String, String> params, String origin) {
        return tenantService.getDefaultTenant().map(tenant -> {
            final TenantConfiguration tenantConfiguration = tenant.getTenantConfiguration();
            String primaryColor = DEFAULT_PRIMARY_COLOR;
            String backgroundColor = DEFAULT_BACKGROUND_COLOR;
            String fontColor = DEFAULT_FONT_COLOR;
            String logoUrl = StringUtils.isNotEmpty(origin) ? origin + tenantConfiguration.getBrandLogoUrl() : null;

            if (tenantConfiguration.isWhitelabelEnabled()) {
                final TenantConfiguration.BrandColors brandColors = tenantConfiguration.getBrandColors();
                if (brandColors != null) {
                    primaryColor = StringUtils.defaultIfEmpty(brandColors.getPrimary(), primaryColor);
                    backgroundColor = StringUtils.defaultIfEmpty(brandColors.getBackground(), backgroundColor);
                    fontColor = defaultIfEmpty(brandColors.getFont(), fontColor);
                }
            }

            params.put(INSTANCE_NAME, StringUtils.defaultIfEmpty(tenantConfiguration.getInstanceName(), "Appsmith"));
            params.put(LOGO_URL, StringUtils.defaultIfEmpty(logoUrl, DEFAULT_APPSMITH_LOGO));
            params.put(BRAND_PRIMARY_COLOR, primaryColor);
            params.put(BRAND_BACKGROUND_COLOR, backgroundColor);
            params.put(BRAND_FONT_COLOR, fontColor);
            return params;
        });
    }

    @Override
    protected String getForgotPasswordTemplate() {
        return FORGOT_PASSWORD_TEMPLATE_EE;
    }

    @Override
    protected String getWorkspaceInviteTemplate(boolean isNewUser) {
        if (isNewUser) {
            return INVITE_TO_WORKSPACE_NEW_USER_TEMPLATE_EE;
        }

        return INVITE_TO_WORKSPACE_EXISTING_USER_TEMPLATE_EE;
    }

    @Override
    protected String getAdminInstanceInviteTemplate() {
        return INVITE_TO_INSTANCE_ADMIN_EMAIL_TEMPLATE;
    }

    private Map<String, String> getApplicationEmailParams(
            User inviter,
            Application application,
            String inviteUrl,
            String roleType,
            String instanceId,
            boolean isNewUser) {
        Map<String, String> params = new HashMap<>();

        // Set inviters name or email
        if (inviter != null) {
            params.put(INVITER_FIRST_NAME, defaultIfEmpty(inviter.getName(), inviter.getEmail()));
        }

        // Set application name
        if (application != null) {
            params.put(INVITER_APPLICATION_NAME, application.getName());
        }

        // Set role type and application access
        String applicationAccess = "";
        if (roleType != null) {
            if (roleType.startsWith(FieldNameCE.DEVELOPER)) {
                params.put(FieldName.ROLE, EMAIL_ROLE_DEVELOPER_TEXT);
                applicationAccess = ApplicationMode.EDIT.name().toLowerCase();
            } else if (roleType.startsWith(FieldNameCE.VIEWER)) {
                params.put(FieldName.ROLE, EMAIL_ROLE_VIEWER_TEXT);
            }
        }

        // Set instance ID
        if (instanceId != null) {
            params.put(INSTANCE_ID, instanceId);
        }

        // Set primary link URL based on conditions
        if (isNewUser) {
            params.put(PRIMARY_LINK_TEXT, PRIMARY_LINK_TEXT_USER_SIGNUP_APPLICATION_INVITE);
        } else {
            params.put(PRIMARY_LINK_TEXT, PRIMARY_LINK_TEXT_APPLICATION_REDIRECTION);
        }

        params.put(PRIMARY_LINK_URL, inviteUrl);

        return params;
    }

    private Map<String, String> getInstanceEmailParamsForGroupInvite(
            User invitingUser, String inviteUrl, String groupName, String instanceName) {
        Map<String, String> params = new HashMap<>();
        if (invitingUser != null) {
            params.put(
                    INVITER_FIRST_NAME,
                    invitingUser.getName() != null ? invitingUser.getName() : invitingUser.getEmail());
        }

        params.put(GROUP_NAME, groupName);

        if (invitingUser != null) {
            params.put(PRIMARY_LINK_URL, inviteUrl);
            params.put(PRIMARY_LINK_TEXT, PRIMARY_LINK_TEXT_INSTANCE_INVITE);
        }

        params.put(INSTANCE_NAME, instanceName);

        return params;
    }

    private Map<String, String> getInstanceEmailParamsForRoleInvite(
            User invitingUser, String inviteUrl, String roleName, String instanceName) {
        Map<String, String> params = new HashMap<>();
        if (invitingUser != null) {
            params.put(
                    INVITER_FIRST_NAME,
                    invitingUser.getName() != null ? invitingUser.getName() : invitingUser.getEmail());
        }

        params.put(ROLE_NAME, roleName);

        if (invitingUser != null) {
            params.put(PRIMARY_LINK_URL, inviteUrl);
            params.put(PRIMARY_LINK_TEXT, PRIMARY_LINK_TEXT_INSTANCE_INVITE);
        }

        params.put(INSTANCE_NAME, instanceName);

        return params;
    }
}
