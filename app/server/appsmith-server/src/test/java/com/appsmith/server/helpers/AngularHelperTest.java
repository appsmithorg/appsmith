package com.appsmith.server.helpers;

import com.appsmith.external.models.ActionConfiguration;
import com.appsmith.external.models.Property;
import org.junit.Test;

import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

public class AngularHelperTest {

    @Test
    public void testRenderFieldValues_withProperReplacement_returnsWithReplacedValue() {
        ActionConfiguration configuration = new ActionConfiguration();

        configuration.setBody("<< body >>");
        configuration.setPath("<< path >>");
        configuration.setNext("<< next >>");

        configuration.setHeaders(List.of(
                new Property("Authorization", "Bearer << headerValue1 >>"),
                new Property("header2", "<< headerValue2 >>")
        ));

        configuration.setBodyFormData(List.of(
                new Property("param1", "<< bodyParam1 >>"),
                new Property("param2", "<< bodyParam2 >>")
        ));

        configuration.setQueryParameters(List.of(
                new Property("param1", "<< queryParam1 >>"),
                new Property("param2", "<< queryParam2 >>")
        ));

        configuration.setPluginSpecifiedTemplates(Arrays.asList(
                null,
                new Property("prop1", "<< pluginSpecifiedProp1 >>"),
                null,
                new Property("prop2", "<< pluginSpecifiedProp2 >>")
        ));

        final Map<String, String> context = new HashMap<>(Map.of(
                "body", "rendered body",
                "path", "rendered path",
                "next", "rendered next",
                "headerValue2", "rendered headerValue2",
                "headerValue1", "access_token",
                "bodyParam1", "rendered bodyParam1",
                "bodyParam2", "rendered bodyParam2",
                "queryParam1", "rendered queryParam1",
                "queryParam2", "rendered queryParam2"
        ));

        context.putAll(Map.of(
                "pluginSpecifiedProp1", "rendered pluginSpecifiedProp1",
                "pluginSpecifiedProp2", "rendered pluginSpecifiedProp2"
        ));

        AngularHelper.renderFieldValues(configuration, context);

        assertThat(configuration.getBody()).isEqualTo("rendered body");
        assertThat(configuration.getPath()).isEqualTo("rendered path");
        assertThat(configuration.getNext()).isEqualTo("rendered next");

        assertThat(configuration.getHeaders()).containsOnly(
                new Property("Authorization", "Bearer access_token"),
                new Property("header2", "rendered headerValue2")
        );

        assertThat(configuration.getBodyFormData()).containsOnly(
                new Property("param1", "rendered bodyParam1"),
                new Property("param2", "rendered bodyParam2")
        );

        assertThat(configuration.getQueryParameters()).containsOnly(
                new Property("param1", "rendered queryParam1"),
                new Property("param2", "rendered queryParam2")
        );

        assertThat(configuration.getPluginSpecifiedTemplates()).containsExactly(
                null,
                new Property("prop1", "rendered pluginSpecifiedProp1"),
                null,
                new Property("prop2", "rendered pluginSpecifiedProp2")
        );
    }

    @Test
    public void testRenderFieldValues_withoutProperReplacement_returnsAngularBindingWithoutReplacement() {
        ActionConfiguration configuration = new ActionConfiguration();
        configuration.setBody("outside <<ab>> outside");

        AngularHelper.renderFieldValues(configuration, Map.of());
        assertThat(configuration.getBody()).isEqualTo("outside <<ab>> outside");
    }

}
