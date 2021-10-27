package com.external.plugins;

import com.appsmith.external.exceptions.pluginExceptions.AppsmithPluginError;
import com.appsmith.external.exceptions.pluginExceptions.AppsmithPluginException;
import com.appsmith.external.helpers.PluginUtils;
import com.appsmith.external.models.ActionConfiguration;
import com.appsmith.external.models.ActionExecutionResult;
import com.appsmith.external.models.AuthenticationDTO;
import com.appsmith.external.models.BasicAuth;
import com.appsmith.external.models.DatasourceConfiguration;
import com.appsmith.external.models.DatasourceStructure;
import com.appsmith.external.models.DatasourceTestResult;
import com.appsmith.external.models.Endpoint;
import com.appsmith.external.plugins.BasePlugin;
import com.appsmith.external.plugins.PluginExecutor;
import org.pf4j.Extension;
import org.pf4j.PluginWrapper;
import org.springframework.util.StringUtils;
import reactor.core.publisher.Mono;

import javax.mail.Authenticator;
import javax.mail.Message;
import javax.mail.MessagingException;
import javax.mail.Multipart;
import javax.mail.PasswordAuthentication;
import javax.mail.Session;
import javax.mail.Transport;
import javax.mail.internet.InternetAddress;
import javax.mail.internet.MimeBodyPart;
import javax.mail.internet.MimeMessage;
import javax.mail.internet.MimeMultipart;
import java.util.Properties;
import java.util.Set;

public class SmtpPlugin extends BasePlugin {
    public SmtpPlugin(PluginWrapper wrapper) {
        super(wrapper);
    }

    @Extension
    public static class SmtpPluginExecutor implements PluginExecutor<Object> {


        @Override
        public Mono<ActionExecutionResult> execute(Object connection, DatasourceConfiguration datasourceConfiguration, ActionConfiguration actionConfiguration) {

            Properties prop = new Properties();
            prop.put("mail.smtp.auth", true);
            prop.put("mail.smtp.starttls.enable", "false");
            prop.put("mail.smtp.host", "smtp.mailtrap.io");
            prop.put("mail.smtp.port", "2525");
            prop.put("mail.smtp.ssl.trust", "smtp.mailtrap.io");
            String username = "dfc7da10622c73";
            String password = "7624b2118ec602";

            Session session = Session.getInstance(prop, new Authenticator() {
                @Override
                protected PasswordAuthentication getPasswordAuthentication() {
                    return new PasswordAuthentication(username, password);
                }
            });


            Message message = new MimeMessage(session);
            ActionExecutionResult result = new ActionExecutionResult();
            try {
                String fromAddress = (String) PluginUtils.getValueSafelyFromFormData(actionConfiguration.getFormData(), "from");
                message.setFrom(new InternetAddress(fromAddress));

                String toAddress = (String) actionConfiguration.getFormData().get("to");
                String ccAddress = (String) actionConfiguration.getFormData().get("cc");
                String bccAddress = (String) actionConfiguration.getFormData().get("bcc");
                String subject = (String) actionConfiguration.getFormData().get("subject");
                message.setRecipients(Message.RecipientType.TO, InternetAddress.parse(toAddress));

                if (StringUtils.hasText(ccAddress)) {
                    message.setRecipients(Message.RecipientType.CC, InternetAddress.parse(ccAddress));
                }
                if (StringUtils.hasText(bccAddress)) {
                    message.setRecipients(Message.RecipientType.BCC, InternetAddress.parse(bccAddress));
                }

                message.setSubject(subject);

                String msg = actionConfiguration.getBody();

                MimeBodyPart mimeBodyPart = new MimeBodyPart();
                mimeBodyPart.setContent(msg, "text/html");

                Multipart multipart = new MimeMultipart();
                multipart.addBodyPart(mimeBodyPart);
                message.setContent(multipart);

                System.out.println("Going to send the email");
                Transport.send(message);
                System.out.println("Sent the email");
                result.setIsExecutionSuccess(true);
                result.setBody("Sent email successfully");
            } catch (MessagingException e) {
                e.printStackTrace();
                result.setIsExecutionSuccess(false);
                result.setBody("Sending email failed");
            }

            return Mono.just(result);
//            return Mono.error(new AppsmithPluginException(AppsmithPluginError.PLUGIN_ERROR, "Please implement"));
        }

        @Override
        public Mono datasourceCreate(DatasourceConfiguration datasourceConfiguration) {

            Properties prop = new Properties();
            prop.put("mail.smtp.auth", true);
            prop.put("mail.smtp.starttls.enable", "true");
            if (datasourceConfiguration.getEndpoints() == null ||
                    datasourceConfiguration.getEndpoints().isEmpty() ||
                    datasourceConfiguration.getEndpoints().get(0) == null
            ) {
                return Mono.error(new AppsmithPluginException(AppsmithPluginError.PLUGIN_DATASOURCE_ARGUMENT_ERROR,
                        "Required endpoint configuration is missing"));
            }
            Endpoint endpoint = datasourceConfiguration.getEndpoints().get(0);
            if (!StringUtils.hasText(endpoint.getHost())) {
                return Mono.error(new AppsmithPluginException(AppsmithPluginError.PLUGIN_DATASOURCE_ARGUMENT_ERROR,
                        "Required hostname is missing"));
            }
            if (endpoint.getPort() == null) {
                return Mono.error(new AppsmithPluginException(AppsmithPluginError.PLUGIN_DATASOURCE_ARGUMENT_ERROR,
                        "Required port is missing"));
            }

            BasicAuth authentication = (BasicAuth) datasourceConfiguration.getAuthentication();
            if (authentication == null || !StringUtils.hasText(authentication.getUsername()) || !StringUtils.hasText(authentication.getPassword()) )
            prop.put("mail.smtp.host", endpoint.getHost());
            prop.put("mail.smtp.port", endpoint.getPort());
            prop.put("mail.smtp.ssl.trust", endpoint.getHost());
            String username = authentication.getUsername();
            String password = authentication.getPassword();

            return Mono.error(new AppsmithPluginException(AppsmithPluginError.PLUGIN_ERROR, "Please implement"));
        }

        @Override
        public void datasourceDestroy(Object connection) {
            throw new AppsmithPluginException(AppsmithPluginError.PLUGIN_ERROR, "Please implement");
        }

        @Override
        public Set<String> validateDatasource(DatasourceConfiguration datasourceConfiguration) {
            throw new AppsmithPluginException(AppsmithPluginError.PLUGIN_ERROR, "Please implement");
        }

        @Override
        public Mono<DatasourceTestResult> testDatasource(DatasourceConfiguration datasourceConfiguration) {
            return Mono.error(new AppsmithPluginException(AppsmithPluginError.PLUGIN_ERROR, "Please implement"));
        }

        @Override
        public Mono<DatasourceStructure> getStructure(Object connection, DatasourceConfiguration datasourceConfiguration) {
            return Mono.error(new AppsmithPluginException(AppsmithPluginError.PLUGIN_ERROR, "Please implement"));
        }
    }
}