package com.external.plugins;

import com.appsmith.external.dtos.MultipartFormDataDTO;
import com.appsmith.external.exceptions.pluginExceptions.AppsmithPluginError;
import com.appsmith.external.exceptions.pluginExceptions.AppsmithPluginException;
import com.appsmith.external.helpers.PluginUtils;
import com.appsmith.external.models.ActionConfiguration;
import com.appsmith.external.models.ActionExecutionResult;
import com.appsmith.external.models.DBAuth;
import com.appsmith.external.models.DatasourceConfiguration;
import com.appsmith.external.models.DatasourceTestResult;
import com.appsmith.external.models.Endpoint;
import com.appsmith.external.plugins.BasePlugin;
import com.appsmith.external.plugins.PluginExecutor;
import com.external.plugins.exceptions.SMTPErrorMessages;
import com.external.plugins.exceptions.SMTPPluginError;
import jakarta.mail.AuthenticationFailedException;
import jakarta.mail.Authenticator;
import jakarta.mail.Message;
import jakarta.mail.MessagingException;
import jakarta.mail.Multipart;
import jakarta.mail.NoSuchProviderException;
import jakarta.mail.Part;
import jakarta.mail.PasswordAuthentication;
import jakarta.mail.Session;
import jakarta.mail.Transport;
import jakarta.mail.internet.InternetAddress;
import jakarta.mail.internet.MimeBodyPart;
import jakarta.mail.internet.MimeMessage;
import jakarta.mail.internet.MimeMultipart;
import jakarta.mail.util.ByteArrayDataSource;
import lombok.extern.slf4j.Slf4j;
import org.jetbrains.annotations.NotNull;
import org.pf4j.Extension;
import org.pf4j.PluginWrapper;
import org.springframework.util.CollectionUtils;
import org.springframework.util.StringUtils;
import reactor.core.publisher.Mono;

import jakarta.activation.DataHandler;
import jakarta.activation.DataSource;

import java.io.IOException;
import java.util.Base64;
import java.util.HashMap;
import java.util.HashSet;
import java.util.Map;
import java.util.Properties;
import java.util.Set;

@Slf4j
public class SmtpPlugin extends BasePlugin {
    private static final String BASE64_DELIMITER = ";base64,";

    public SmtpPlugin(PluginWrapper wrapper) {
        super(wrapper);
    }

    @Extension
    public static class SmtpPluginExecutor implements PluginExecutor<Session> {

        private static final String ENCODING = "UTF-8";

        @Override
        public Mono<ActionExecutionResult> execute(Session connection, DatasourceConfiguration datasourceConfiguration, ActionConfiguration actionConfiguration) {

            MimeMessage message = getMimeMessage(connection);
            ActionExecutionResult result = new ActionExecutionResult();
            try {
                String fromAddress = (String) PluginUtils.getValueSafelyFromFormData(actionConfiguration.getFormData(), "send.from");
                String toAddress = (String) PluginUtils.getValueSafelyFromFormData(actionConfiguration.getFormData(), "send.to");
                String ccAddress = (String) PluginUtils.getValueSafelyFromFormData(actionConfiguration.getFormData(), "send.cc");
                String bccAddress = (String) PluginUtils.getValueSafelyFromFormData(actionConfiguration.getFormData(), "send.bcc");
                String subject = (String) PluginUtils.getValueSafelyFromFormData(actionConfiguration.getFormData(), "send.subject");
                Boolean isReplyTo = (Boolean) PluginUtils.getValueSafelyFromFormData(actionConfiguration.getFormData(), "send.isReplyTo");
                String replyTo = Boolean.TRUE.equals(isReplyTo) ?
                        (String) PluginUtils.getValueSafelyFromFormData(actionConfiguration.getFormData(), "send.replyTo") : null;

                if (!StringUtils.hasText(toAddress)) {
                    return Mono.error(new AppsmithPluginException(AppsmithPluginError.PLUGIN_EXECUTE_ARGUMENT_ERROR,
                            SMTPErrorMessages.RECIPIENT_ADDRESS_NOT_FOUND_ERROR_MSG));
                }
                if (!StringUtils.hasText(fromAddress)) {
                    return Mono.error(new AppsmithPluginException(AppsmithPluginError.PLUGIN_EXECUTE_ARGUMENT_ERROR,
                            SMTPErrorMessages.SENDER_ADDRESS_NOT_FOUND_ERROR_MSG));
                }
                message.setRecipients(Message.RecipientType.TO, InternetAddress.parse(toAddress, false));
                message.setFrom(new InternetAddress(fromAddress));

                if (StringUtils.hasText(ccAddress)) {
                    message.setRecipients(Message.RecipientType.CC, InternetAddress.parse(ccAddress, false));
                }
                if (StringUtils.hasText(bccAddress)) {
                    message.setRecipients(Message.RecipientType.BCC, InternetAddress.parse(bccAddress, false));
                }
                if (StringUtils.hasText(replyTo)) {
                    message.setReplyTo(InternetAddress.parse(replyTo, false));
                }

                message.setSubject(subject, ENCODING);

                String msg = StringUtils.hasText(actionConfiguration.getBody()) ? actionConfiguration.getBody() : "";

                MimeBodyPart mimeBodyPart = getMimeBodyPart();

                // By default, all emails sent will be of type HTML. This can be parameterized. For simplification reasons,
                // use the text/html mime type right now.
                mimeBodyPart.setContent(msg, "text/html; charset=" + ENCODING);
                Multipart multipart = new MimeMultipart();
                multipart.addBodyPart(mimeBodyPart);
                message.setContent(multipart);

                // Look for any attachments that need to be sent along with this email
                String attachmentsStr = (String) PluginUtils.getValueSafelyFromFormData(actionConfiguration.getFormData(), "send.attachments");

                if (StringUtils.hasText(attachmentsStr)) {
                    MultipartFormDataDTO[] attachmentData = objectMapper.readValue(
                            attachmentsStr,
                            MultipartFormDataDTO[].class
                    );

                    // Iterate over each attachment and add it to the main multipart body of the email
                    for (MultipartFormDataDTO attachment : attachmentData) {
                        MimeBodyPart attachBodyPart = getMimeBodyPart();

                        // Decode the base64 data received in the input by first removing the sequence data:image/png;base64,
                        // from the start of the string.
                        Base64.Decoder decoder = Base64.getDecoder();
                        String attachmentStr = String.valueOf(attachment.getData());
                        if (!attachmentStr.contains(BASE64_DELIMITER)) {
                            return Mono.error(new AppsmithPluginException(SMTPPluginError.MAIL_SENDING_FAILED,
                                    String.format(SMTPErrorMessages.INVALID_ATTACHMENT_ERROR_MSG, attachment.getName())));
                        }
                        byte[] bytes = decoder.decode(attachmentStr.split(BASE64_DELIMITER)[1]);
                        DataSource emailDatasource = new ByteArrayDataSource(bytes, attachment.getType());

                        attachBodyPart.setDataHandler(new DataHandler(emailDatasource));
                        attachBodyPart.setDisposition(Part.ATTACHMENT);
                        attachBodyPart.setFileName(attachment.getName());
                        // Add the attachment body part to the multipart body
                        multipart.addBodyPart(attachBodyPart);
                    }
                }

                // Send the email now
                log.debug("Going to send the email");
                Transport.send(message);

                result.setIsExecutionSuccess(true);
                Map<String, String> responseBody = new HashMap<>();
                responseBody.put("message", "Sent the email successfully");
                result.setBody(objectMapper.valueToTree(responseBody));

                log.debug("Sent the email successfully");
            } catch (MessagingException e) {
                return Mono.error(new AppsmithPluginException(SMTPPluginError.MAIL_SENDING_FAILED,
                        SMTPErrorMessages.MAIL_SENDING_FAILED_ERROR_MSG, e.getMessage()));
            } catch (IOException e) {
                return Mono.error(new AppsmithPluginException(SMTPPluginError.MAIL_SENDING_FAILED,
                        SMTPErrorMessages.UNPARSABLE_EMAIL_BODY_OR_ATTACHMENT_ERROR_MSG, e.getMessage()));
            }

            return Mono.just(result);
        }

        @NotNull
        MimeBodyPart getMimeBodyPart() {
            return new MimeBodyPart();
        }

        MimeMessage getMimeMessage(Session connection) {
            return new MimeMessage(connection);
        }

        @Override
        public Mono<Session> datasourceCreate(DatasourceConfiguration datasourceConfiguration) {

            Endpoint endpoint = datasourceConfiguration.getEndpoints().get(0);
            DBAuth authentication = (DBAuth) datasourceConfiguration.getAuthentication();

            Properties prop = new Properties();
            prop.put("mail.transport.protocol", "smtp");
            prop.put("mail.smtp.auth", true);
            prop.put("mail.smtp.starttls.enable", "true");
            prop.put("mail.smtp.host", endpoint.getHost());
            Long port = (endpoint.getPort() == null || endpoint.getPort() < 0) ? 25 : endpoint.getPort();
            prop.put("mail.smtp.port", String.valueOf(port));
            prop.put("mail.smtp.ssl.trust", endpoint.getHost());

            String username = authentication.getUsername();
            String password = authentication.getPassword();

            Session session = Session.getInstance(prop, new Authenticator() {
                @Override
                protected PasswordAuthentication getPasswordAuthentication() {
                    return new PasswordAuthentication(username, password);
                }
            });
            return Mono.just(session);
        }

        @Override
        public void datasourceDestroy(Session session) {
            log.debug("Going to destroy email datasource");
            try {
                if (session != null && session.getTransport() != null) {
                    session.getTransport().close();
                }
            } catch (MessagingException e) {
                e.printStackTrace();
            }
        }

        @Override
        public Set<String> validateDatasource(DatasourceConfiguration datasourceConfiguration) {
            log.debug("Going to validate email datasource");
            Set<String> invalids = new HashSet<>();
            if (CollectionUtils.isEmpty(datasourceConfiguration.getEndpoints())) {
                invalids.add(SMTPErrorMessages.DS_MISSING_HOST_ADDRESS_ERROR_MSG);
            } else {
                Endpoint endpoint = datasourceConfiguration.getEndpoints().get(0);
                if (!StringUtils.hasText(endpoint.getHost())) {
                    invalids.add(SMTPErrorMessages.DS_MISSING_HOST_ADDRESS_ERROR_MSG);
                }
            }

            DBAuth authentication = (DBAuth) datasourceConfiguration.getAuthentication();
            if (authentication == null || !StringUtils.hasText(authentication.getUsername()) ||
                    !StringUtils.hasText(authentication.getPassword())
            ) {
                invalids.add(new AppsmithPluginException(AppsmithPluginError.PLUGIN_AUTHENTICATION_ERROR).getMessage());
            }

            return invalids;
        }

        @Override
        public Mono<DatasourceTestResult> testDatasource(Session connection) {
            log.debug("Going to test email datasource");
            return Mono.fromCallable(() -> {
                        Set<String> invalids = new HashSet<>();
                        try {
                            Transport transport = connection.getTransport();
                            if (transport != null) {
                                transport.connect();
                            }
                            return invalids;
                        } catch (NoSuchProviderException e) {
                            invalids.add(SMTPErrorMessages.DS_NO_SUCH_PROVIDER_ERROR_MSG);
                        } catch (AuthenticationFailedException e) {
                            invalids.add(SMTPErrorMessages.DS_AUTHENTICATION_FAILED_ERROR_MSG);
                        } catch (MessagingException e) {
                            log.debug(e.getMessage());
                            invalids.add(SMTPErrorMessages.DS_CONNECTION_FAILED_TO_SMTP_SERVER_ERROR_MSG);
                        }
                        return invalids;
                    })
                    .map(DatasourceTestResult::new);
        }

    }
}