package com.appsmith.server.constants.ce;

import com.appsmith.server.constants.FieldName;

public class EmailConstantsCE {
    public static final String INSTANCE_NAME = "instanceName";
    public static final String RESET_URL = "resetUrl";
    public static final String EMAIL_ROLE_ADMINISTRATOR_TEXT = "an " + FieldName.ADMINISTRATOR.toLowerCase();
    public static final String EMAIL_ROLE_DEVELOPER_TEXT = "a " + FieldName.DEVELOPER.toLowerCase();
    public static final String EMAIL_ROLE_VIEWER_TEXT = "an " + FieldName.VIEWER.toLowerCase();
    public static final String PRIMARY_LINK_URL = "primaryLinkUrl";
    public static final String PRIMARY_LINK_TEXT = "primaryLinkText";
    public static final String PRIMARY_LINK_TEXT_USER_SIGNUP = "Sign up now";
    public static final String PRIMARY_LINK_TEXT_INVITE_TO_INSTANCE_CE = "Join your Appsmith instance";
    public static final String PRIMARY_LINK_TEXT_WORKSPACE_REDIRECTION = "Go to your Appsmith workspace";

    public static final String INVITE_USER_CLIENT_URL_FORMAT = "%s/user/signup?email=%s";
    public static final String INVITE_TO_WORKSPACE_EMAIL_SUBJECT_CE =
            "You’re invited to the Appsmith workspace. \uD83E\uDD73";
    public static final String FORGOT_PASSWORD_EMAIL_SUBJECT = "Reset your Appsmith password";
    public static final String EMAIL_VERIFICATION_EMAIL_SUBJECT = "Verify your account";
    public static final String INSTANCE_ADMIN_INVITE_EMAIL_SUBJECT =
            "You're invited to an Appsmith instance. \uD83E\uDD73";
    public static final String INVITE_WORKSPACE_TEMPLATE_EXISTING_USER_CE =
            "email/ce/inviteWorkspaceExistingUserTemplate.html";
    public static final String INVITE_WORKSPACE_TEMPLATE_NEW_USER_CE = "email/ce/inviteWorkspaceNewUserTemplate.html";
    public static final String FORGOT_PASSWORD_TEMPLATE_CE = "email/ce/forgotPasswordTemplate.html";
    public static final String INSTANCE_ADMIN_INVITE_EMAIL_TEMPLATE = "email/ce/instanceAdminInviteTemplate.html";
    public static final String EMAIL_VERIFICATION_EMAIL_TEMPLATE_CE = "email/ce/emailVerificationTemplate.html";
    public static final String WORKSPACE_URL = "%s/applications#%s";
    public static final String INVITER_FIRST_NAME = "inviterFirstName";
    public static final String INVITER_WORKSPACE_NAME = "inviterWorkspaceName";
    public static final String EMAIL_VERIFICATION_URL = "verificationUrl";
}
