package com.external.plugins.exceptions;

public class SMTPErrorMessages {
    private SMTPErrorMessages() {
        //Prevents instantiation
    }

    public static final String RECIPIENT_ADDRESS_NOT_FOUND_ERROR_MSG = "Couldn't find a valid recipient address. Please check your action configuration.";

    public static final String SENDER_ADDRESS_NOT_FOUND_ERROR_MSG = "Couldn't find a valid sender address. Please check your action configuration.";

    public static final String INVALID_ATTACHMENT_ERROR_MSG = "Attachment `%s` contains invalid data. Unable to send email.";

    public static final String MAIL_SENDING_FAILED_ERROR_MSG = "Error occurred while sending mail. To know more about the error please check the error details.";

    public static final String UNPARSABLE_EMAIL_BODY_OR_ATTACHMENT_ERROR_MSG = "Unable to parse the email body/attachments because it was an invalid object.";

    /*
     ************************************************************************************************************************************************
                                        Error messages related to validation of datasource.
     ************************************************************************************************************************************************
     */
    public static final String DS_MISSING_HOST_ADDRESS_ERROR_MSG = "Could not find host address. Please edit the 'Hostname' field to provide the desired endpoint.";

    public static final String DS_NO_SUCH_PROVIDER_ERROR_MSG = "Unable to create underlying SMTP protocol. Please contact support";

    public static final String DS_AUTHENTICATION_FAILED_ERROR_MSG = "Authentication failed with the SMTP server. Please check your username/password settings.";

    public static final String DS_CONNECTION_FAILED_TO_SMTP_SERVER_ERROR_MSG = "Unable to connect to SMTP server. Please check your host/port settings.";
}
