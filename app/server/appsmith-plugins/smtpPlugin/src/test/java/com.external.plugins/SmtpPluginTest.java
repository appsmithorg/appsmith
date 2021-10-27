package com.external.plugins;

import com.appsmith.external.helpers.PluginUtils;
import com.appsmith.external.models.ActionConfiguration;
import com.appsmith.external.models.ActionExecutionResult;
import com.appsmith.external.models.DatasourceConfiguration;
import org.junit.Test;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import java.util.HashMap;
import java.util.Map;

import static org.junit.Assert.assertTrue;

public class SmtpPluginTest {
    private SmtpPlugin.SmtpPluginExecutor pluginExecutor = new SmtpPlugin.SmtpPluginExecutor();

    private DatasourceConfiguration createDatasourceConfiguraion() {
        DatasourceConfiguration dsConfig = new DatasourceConfiguration();
        return dsConfig;
    }

    private ActionConfiguration createActionConfiguration(String fromAddress,
                                                          String toAddress,
                                                          String ccAddress,
                                                          String bccAddress) {
        ActionConfiguration actionConfiguration = new ActionConfiguration();
        Map<String, Object> formData = new HashMap<>();
        PluginUtils.setValueSafelyInFormData(formData, "from", "fromAddress");
        PluginUtils.setValueSafelyInFormData(formData, "to", "toAddress");
        PluginUtils.setValueSafelyInFormData(formData, "cc", "ccAddress");
        PluginUtils.setValueSafelyInFormData(formData, "bcc", "bccAddress");

        actionConfiguration.setFormData(formData);
        return actionConfiguration;
    }

    @Test
    public void test() {

        ActionConfiguration actionConfiguration = createActionConfiguration("fromAddress",
                "toAddress", "ccAddress", "bccAddress");
        PluginUtils.setValueSafelyInFormData(actionConfiguration.getFormData(), "subject", "This is a test subject");
        actionConfiguration.setBody("This is a body");

        Mono<ActionExecutionResult> resultMono = pluginExecutor.execute(null, null, actionConfiguration);
        StepVerifier.create(resultMono)
                .assertNext(result -> assertTrue(result.getIsExecutionSuccess()))
                .verifyComplete();
    }
}