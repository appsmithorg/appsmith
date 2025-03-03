package com.appsmith.server.services;

import com.appsmith.server.constants.FieldName;
import com.appsmith.server.constants.ce.FieldNameCE;
import com.appsmith.server.domains.Application;
import com.appsmith.server.domains.ApplicationMode;
import com.appsmith.server.domains.User;
import com.appsmith.server.helpers.EmailServiceHelper;
import com.appsmith.server.notifications.EmailSender;
import com.appsmith.server.services.ce.EmailServiceCEImpl;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.HashMap;
import java.util.Map;

import static com.appsmith.server.constants.EmailConstants.APPLICATION_EMAIL_SUBJECT_FOR_NEW_USER;
import static com.appsmith.server.constants.EmailConstants.EMAIL_ROLE_DEVELOPER_TEXT;
import static com.appsmith.server.constants.EmailConstants.EMAIL_ROLE_VIEWER_TEXT;
import static com.appsmith.server.constants.EmailConstants.GROUP_NAME;
import static com.appsmith.server.constants.EmailConstants.INSTANCE_NAME;
import static com.appsmith.server.constants.EmailConstants.INVITER_APPLICATION_NAME;
import static com.appsmith.server.constants.EmailConstants.INVITE_APP_TEMPLATE;
import static com.appsmith.server.constants.EmailConstants.INVITE_TO_INSTANCE_EMAIL_SUBJECT;
import static com.appsmith.server.constants.EmailConstants.INVITE_TO_INSTANCE_EMAIL_SUBJECT_VIA_GROUP;
import static com.appsmith.server.constants.EmailConstants.INVITE_TO_INSTANCE_EMAIL_TEMPLATE;
import static com.appsmith.server.constants.EmailConstants.INVITE_TO_INSTANCE_EMAIL_TEMPLATE_VIA_GROUPS;
import static com.appsmith.server.constants.EmailConstants.INVITE_USER_CLIENT_URL_FORMAT;
import static com.appsmith.server.constants.EmailConstants.PRIMARY_LINK_TEXT;
import static com.appsmith.server.constants.EmailConstants.PRIMARY_LINK_TEXT_GET_ACCESS;
import static com.appsmith.server.constants.EmailConstants.PRIMARY_LINK_TEXT_GO_TO_YOUR_INSTANCE;
import static com.appsmith.server.constants.EmailConstants.PRIMARY_LINK_TEXT_JOIN_YOUR_INSTANCE;
import static com.appsmith.server.constants.EmailConstants.PRIMARY_LINK_URL;
import static com.appsmith.server.constants.EmailConstants.ROLE_NAME;
import static com.appsmith.server.constants.FieldName.INSTANCE_ID;
import static com.appsmith.server.constants.ce.EmailConstantsCE.INVITER_FIRST_NAME;
import static org.apache.commons.lang.StringUtils.defaultIfEmpty;

@Service
public class EmailServiceImpl extends EmailServiceCEImpl implements EmailService {

    private final EmailSender emailSender;

    private final EmailServiceHelper emailServiceHelper;

    public EmailServiceImpl(
            EmailSender emailSender, EmailServiceHelper emailServiceHelper, OrganizationService organizationService) {
        super(emailSender, emailServiceHelper, organizationService);
        this.emailSender = emailSender;
        this.emailServiceHelper = emailServiceHelper;
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

        String subject = String.format(APPLICATION_EMAIL_SUBJECT_FOR_NEW_USER, params.get(INVITER_APPLICATION_NAME));

        return emailServiceHelper
                .enrichWithBrandParams(params, originHeader)
                .flatMap(updatedParams ->
                        emailSender.sendMail(invitedUser.getEmail(), subject, INVITE_APP_TEMPLATE, updatedParams));
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
        return emailServiceHelper
                .enrichWithBrandParams(params, originHeader)
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
                getInstanceEmailParamsForGroupInvite(invitingUser, invitedUser, inviteUrl, groupAddedTo, instanceName);
        return emailServiceHelper
                .enrichWithBrandParams(params, originHeader)
                .flatMap(updatedParams -> emailSender.sendMail(
                        invitedUser.getEmail(), emailSubject, INVITE_TO_INSTANCE_EMAIL_TEMPLATE_VIA_GROUPS, params));
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
        params.put(PRIMARY_LINK_TEXT, PRIMARY_LINK_TEXT_GET_ACCESS);
        params.put(PRIMARY_LINK_URL, inviteUrl);

        return params;
    }

    private Map<String, String> getInstanceEmailParamsForGroupInvite(
            User invitingUser, User invitedUser, String inviteUrl, String groupName, String instanceName) {
        Map<String, String> params = new HashMap<>();
        if (invitingUser != null) {
            params.put(
                    INVITER_FIRST_NAME,
                    invitingUser.getName() != null ? invitingUser.getName() : invitingUser.getEmail());
        }

        params.put(GROUP_NAME, groupName);

        if (invitingUser != null) {
            params.put(PRIMARY_LINK_URL, inviteUrl);
            if (!invitedUser.isEnabled()) {
                params.put(PRIMARY_LINK_TEXT, PRIMARY_LINK_TEXT_JOIN_YOUR_INSTANCE);
            } else {
                params.put(PRIMARY_LINK_TEXT, PRIMARY_LINK_TEXT_GO_TO_YOUR_INSTANCE);
            }
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
            params.put(PRIMARY_LINK_TEXT, PRIMARY_LINK_TEXT_JOIN_YOUR_INSTANCE);
        }

        params.put(INSTANCE_NAME, instanceName);

        return params;
    }
}
