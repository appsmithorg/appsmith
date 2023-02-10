package com.appsmith.external.helpers;

import com.appsmith.external.models.ActionConfiguration;
import com.appsmith.external.models.Connection;
import com.appsmith.external.models.DatasourceConfiguration;
import com.appsmith.external.models.Endpoint;
import com.appsmith.external.models.MustacheBindingToken;
import com.appsmith.external.models.Property;
import org.assertj.core.api.AbstractCollectionAssert;
import org.assertj.core.api.ObjectAssert;
import org.junit.jupiter.api.Test;

import java.util.Arrays;
import java.util.Collection;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

import static com.appsmith.external.helpers.MustacheHelper.extractMustacheKeys;
import static com.appsmith.external.helpers.MustacheHelper.extractMustacheKeysFromFields;
import static com.appsmith.external.helpers.MustacheHelper.render;
import static com.appsmith.external.helpers.MustacheHelper.renderFieldValues;
import static com.appsmith.external.helpers.MustacheHelper.tokenize;
import static org.assertj.core.api.Assertions.assertThat;

@SuppressWarnings(
        // Disabling this so we may use `Arrays.asList` with single argument, which is easier to refactor, just for tests.
        "ArraysAsListWithZeroOrOneArgument"
)
public class MustacheHelperTest {

    private void checkTokens(String template, List<MustacheBindingToken> expected) {
        assertThat(tokenize(template)).isEqualTo(expected);
    }

    private void checkKeys(String template, Set<MustacheBindingToken> expected) {
        assertThat(extractMustacheKeys(template)).isEqualTo(expected);
    }

    private void check(String template, List<MustacheBindingToken> expectedTokens, Set<MustacheBindingToken> expectedKeys) {
        if (expectedTokens != null) {
            checkTokens(template, expectedTokens);
        }
        if (expectedKeys != null) {
            checkKeys(template, expectedKeys);
        }
    }

    private AbstractCollectionAssert<?, Collection<? extends MustacheBindingToken>, MustacheBindingToken, ObjectAssert<MustacheBindingToken>>
    assertKeys(Object object) {
        return assertThat(extractMustacheKeysFromFields(object));
    }

    @Test
    public void dontSplitNormalTexts() {
        checkKeys("hello there matey!", Set.of());
    }

    @Test
    public void justSingleMustache() {
        checkTokens("{{A}}", Arrays.asList(new MustacheBindingToken("{{A}}", 0, true)));
        checkKeys("{{A}}", Set.of(new MustacheBindingToken("A", 2, false)));
        checkKeys("{{A + B / C}}", Set.of(new MustacheBindingToken("A + B / C", 2, false)));
    }

    @Test
    public void textAndMustache() {
        checkKeys("Hello {{name}}", Set.of(new MustacheBindingToken("name", 8, false)));
        checkKeys("Hello {{url.hash}}", Set.of(new MustacheBindingToken("url.hash", 8, false)));
    }

    @Test
    public void mustacheAndText() {
        checkKeys("{{name}} is approved!", Set.of(new MustacheBindingToken("name", 2, false)));
    }

    @Test
    public void realWorldText1() {
        checkTokens(
                "Hello {{Customer.Name}}, the status for your order id {{orderId}} is {{status}}",
                Arrays.asList(
                        new MustacheBindingToken("Hello ", 0, false),
                        new MustacheBindingToken("{{Customer.Name}}", 6, true),
                        new MustacheBindingToken(", the status for your order id ", 6, false),
                        new MustacheBindingToken("{{orderId}}", 54, true),
                        new MustacheBindingToken(" is ", 54, false),
                        new MustacheBindingToken("{{status}}", 69, true)
                )
        );
        checkKeys(
                "Hello {{Customer.Name}}, the status for your order id {{orderId}} is {{status}}",
                Set.of(
                        new MustacheBindingToken("Customer.Name", 8, false),
                        new MustacheBindingToken("orderId", 56, false),
                        new MustacheBindingToken("status", 71, false)
                )
        );
    }

    @Test
    public void realWorldText2() {
        checkTokens(
                "{{data.map(datum => {return {id: datum}})}}",
                Arrays.asList(new MustacheBindingToken("{{data.map(datum => {return {id: datum}})}}", 0, true))
        );
        checkKeys(
                "{{data.map(datum => {return {id: datum}})}}",
                Set.of(new MustacheBindingToken("data.map(datum => {return {id: datum}})", 2, false))
        );
    }

    @Test
    public void braceDances1() {
        check(
                "{{}}{{}}}",
                Arrays.asList(
                        new MustacheBindingToken("{{}}", 0, true),
                        new MustacheBindingToken("{{}}", 4, true),
                        new MustacheBindingToken("}", 4, false)),
                Set.of(new MustacheBindingToken("", 2, false),
                        new MustacheBindingToken("", 6, false))
        );

        check("{{{}}", Arrays.asList(new MustacheBindingToken("{{{}}", 0, false)), Set.of(new MustacheBindingToken("{", 2, false)));

        check("{{ {{", Arrays.asList(new MustacheBindingToken("{{ {{", 0, false)), Set.of());

        check("}} }}", Arrays.asList(new MustacheBindingToken("}} }}", 0, false)), Set.of());

        check("}} {{", Arrays.asList(new MustacheBindingToken("}} ", 0, false), new MustacheBindingToken("{{", 3, false)), Set.of());
    }

    @Test
    public void quotedStrings() {
        check(
                "{{ 'abc def'.toUpperCase() }}",
                Arrays.asList(new MustacheBindingToken("{{ 'abc def'.toUpperCase() }}", 0, true)),
                Set.of(new MustacheBindingToken(" 'abc def'.toUpperCase() ", 2, false))
        );
        check(
                "{{ \"abc def\".toUpperCase() }}",
                Arrays.asList(new MustacheBindingToken("{{ \"abc def\".toUpperCase() }}", 0, true)),
                Set.of(new MustacheBindingToken(" \"abc def\".toUpperCase() ", 2, false))
        );
        check(
                "{{ `abc def`.toUpperCase() }}",
                Arrays.asList(new MustacheBindingToken("{{ `abc def`.toUpperCase() }}", 0, true)),
                Set.of(new MustacheBindingToken(" `abc def`.toUpperCase() ", 2, false))
        );
    }

    @Test
    public void singleQuotedStringsWithBraces() {
        check(
                "{{ 'The { char is a brace' }}",
                Arrays.asList(new MustacheBindingToken("{{ 'The { char is a brace' }}", 0, true)),
                Set.of(new MustacheBindingToken(" 'The { char is a brace' ", 2, false))
        );
        check(
                "{{ 'I have {{ two braces' }}",
                Arrays.asList(new MustacheBindingToken("{{ 'I have {{ two braces' }}", 0, true)),
                Set.of(new MustacheBindingToken(" 'I have {{ two braces' ", 2, false))
        );
        check(
                "{{ 'I have {{{ three braces' }}",
                Arrays.asList(new MustacheBindingToken("{{ 'I have {{{ three braces' }}", 0, true)),
                Set.of(new MustacheBindingToken(" 'I have {{{ three braces' ", 2, false))
        );
        check(
                "{{ 'The } char is a brace' }}",
                Arrays.asList(new MustacheBindingToken("{{ 'The } char is a brace' }}", 0, true)),
                Set.of(new MustacheBindingToken(" 'The } char is a brace' ", 2, false))
        );
        check(
                "{{ 'I have }} two braces' }}",
                Arrays.asList(new MustacheBindingToken("{{ 'I have }} two braces' }}", 0, true)),
                Set.of(new MustacheBindingToken(" 'I have }} two braces' ", 2, false))
        );
        check(
                "{{ 'I have }}} three braces' }}",
                Arrays.asList(new MustacheBindingToken("{{ 'I have }}} three braces' }}", 0, true)),
                Set.of(new MustacheBindingToken(" 'I have }}} three braces' ", 2, false))
        );
        check(
                "{{ 'Interpolation uses {{ and }} delimiters' }}",
                Arrays.asList(new MustacheBindingToken("{{ 'Interpolation uses {{ and }} delimiters' }}", 0, true)),
                Set.of(new MustacheBindingToken(" 'Interpolation uses {{ and }} delimiters' ", 2, false))
        );
    }

    @Test
    public void doubleQuotedStringsWithBraces() {
        check(
                "{{ \"The { char is a brace\" }}",
                Arrays.asList(new MustacheBindingToken("{{ \"The { char is a brace\" }}", 0, true)),
                Set.of(new MustacheBindingToken(" \"The { char is a brace\" ", 2, false))
        );
        check(
                "{{ \"I have {{ two braces\" }}",
                Arrays.asList(new MustacheBindingToken("{{ \"I have {{ two braces\" }}", 0, true)),
                Set.of(new MustacheBindingToken(" \"I have {{ two braces\" ", 2, false))
        );
        check(
                "{{ \"I have {{{ three braces\" }}",
                Arrays.asList(new MustacheBindingToken("{{ \"I have {{{ three braces\" }}", 0, true)),
                Set.of(new MustacheBindingToken(" \"I have {{{ three braces\" ", 2, false))
        );
        check(
                "{{ \"The } char is a brace\" }}",
                Arrays.asList(new MustacheBindingToken("{{ \"The } char is a brace\" }}", 0, true)),
                Set.of(new MustacheBindingToken(" \"The } char is a brace\" ", 2, false))
        );
        check(
                "{{ \"I have }} two braces\" }}",
                Arrays.asList(new MustacheBindingToken("{{ \"I have }} two braces\" }}", 0, true)),
                Set.of(new MustacheBindingToken(" \"I have }} two braces\" ", 2, false))
        );
        check(
                "{{ \"I have }}} three braces\" }}",
                Arrays.asList(new MustacheBindingToken("{{ \"I have }}} three braces\" }}", 0, true)),
                Set.of(new MustacheBindingToken(" \"I have }}} three braces\" ", 2, false))
        );
        check(
                "{{ \"Interpolation uses {{ and }} delimiters\" }}",
                Arrays.asList(new MustacheBindingToken("{{ \"Interpolation uses {{ and }} delimiters\" }}", 0, true)),
                Set.of(new MustacheBindingToken(" \"Interpolation uses {{ and }} delimiters\" ", 2, false))
        );
    }

    @Test
    public void backQuotedStringsWithBraces() {
        check(
                "{{ `The { char is a brace` }}",
                Arrays.asList(new MustacheBindingToken("{{ `The { char is a brace` }}", 0, true)),
                Set.of(new MustacheBindingToken(" `The { char is a brace` ", 2, false))
        );
        check(
                "{{ `I have {{ two braces` }}",
                Arrays.asList(new MustacheBindingToken("{{ `I have {{ two braces` }}", 0, true)),
                Set.of(new MustacheBindingToken(" `I have {{ two braces` ", 2, false))
        );
        check(
                "{{ `I have {{{ three braces` }}",
                Arrays.asList(new MustacheBindingToken("{{ `I have {{{ three braces` }}", 0, true)),
                Set.of(new MustacheBindingToken(" `I have {{{ three braces` ", 2, false))
        );
        check(
                "{{ `The } char is a brace` }}",
                Arrays.asList(new MustacheBindingToken("{{ `The } char is a brace` }}", 0, true)),
                Set.of(new MustacheBindingToken(" `The } char is a brace` ", 2, false))
        );
        check(
                "{{ `I have }} two braces` }}",
                Arrays.asList(new MustacheBindingToken("{{ `I have }} two braces` }}", 0, true)),
                Set.of(new MustacheBindingToken(" `I have }} two braces` ", 2, false))
        );
        check(
                "{{ `I have }}} three braces` }}",
                Arrays.asList(new MustacheBindingToken("{{ `I have }}} three braces` }}", 0, true)),
                Set.of(new MustacheBindingToken(" `I have }}} three braces` ", 2, false))
        );
        check(
                "{{ `Interpolation uses {{ and }} delimiters` }}",
                Arrays.asList(new MustacheBindingToken("{{ `Interpolation uses {{ and }} delimiters` }}", 0, true)),
                Set.of(new MustacheBindingToken(" `Interpolation uses {{ and }} delimiters` ", 2, false))
        );
    }

    @Test
    public void quotedStringsWithExtras() {
        check(
                "{{ 2 + ' hello ' + 3 }}",
                Arrays.asList(new MustacheBindingToken("{{ 2 + ' hello ' + 3 }}", 0, true)),
                Set.of(new MustacheBindingToken(" 2 + ' hello ' + 3 ", 2, false))
        );
        check(
                "{{ 2 + \" hello \" + 3 }}",
                Arrays.asList(new MustacheBindingToken("{{ 2 + \" hello \" + 3 }}", 0, true)),
                Set.of(new MustacheBindingToken(" 2 + \" hello \" + 3 ", 2, false))
        );
        check(
                "{{ 2 + ` hello ` + 3 }}",
                Arrays.asList(new MustacheBindingToken("{{ 2 + ` hello ` + 3 }}", 0, true)),
                Set.of(new MustacheBindingToken(" 2 + ` hello ` + 3 ", 2, false))
        );
    }

    @Test
    public void quotedStringsWithEscapes() {
        check(
                "{{ 'Escaped \\' character' }}",
                Arrays.asList(new MustacheBindingToken("{{ 'Escaped \\' character' }}", 0, true)),
                Set.of(new MustacheBindingToken(" 'Escaped \\' character' ", 2, false))
        );
        check(
                "{{ \"Escaped \\\" character\" }}",
                Arrays.asList(new MustacheBindingToken("{{ \"Escaped \\\" character\" }}", 0, true)),
                Set.of(new MustacheBindingToken(" \"Escaped \\\" character\" ", 2, false))
        );
        check(
                "{{ `Escaped \\` character` }}",
                Arrays.asList(new MustacheBindingToken("{{ `Escaped \\` character` }}", 0, true)),
                Set.of(new MustacheBindingToken(" `Escaped \\` character` ", 2, false))
        );
    }

    @Test
    public void conditionalExpression() {
        check(
                "Conditional: {{ 2 + 4 ? trueVal : falseVal }}",
                Arrays.asList(
                        new MustacheBindingToken("Conditional: ", 0, false),
                        new MustacheBindingToken("{{ 2 + 4 ? trueVal : falseVal }}", 13, true)),
                Set.of(new MustacheBindingToken(" 2 + 4 ? trueVal : falseVal ", 15, false))
        );
    }

    @Test
    public void jsonInMustache() {
        check(
                "{{{\"foo\": \"bar\"}}}",
                Arrays.asList(new MustacheBindingToken("{{{\"foo\": \"bar\"}}}", 0, true)),
                Set.of(new MustacheBindingToken("{\"foo\": \"bar\"}", 2, false))
        );
    }

    @Test
    public void allDatasourceConfigurationFields() {
        DatasourceConfiguration configuration = new DatasourceConfiguration();

        Connection connection = new Connection();
        connection.setDefaultDatabaseName("{{ dbName }}");
        configuration.setConnection(connection);

        configuration.setUrl("{{ url }}");

        configuration.setHeaders(List.of(
                new Property("header1", "{{ headerValue1 }}"),
                new Property("header2", "{{ headerValue2 }}")
        ));

        configuration.setEndpoints(List.of(
                new Endpoint("{{ host1 }}", 2000L),
                new Endpoint("{{ host2 }}", 2000L)
        ));

        configuration.setProperties(Arrays.asList(
                new Property("name1", "{{   propertyValue1   }}!"),
                new Property("name2", "{{ propertyValue2 }}!")
        ));

        Map<String, String> context = Map.of(
                " dbName ", "rendered dbName",
                " url ", "rendered url",
                " headerValue1 ", "rendered headerValue1",
                " headerValue2 ", "rendered headerValue2",
                " host1 ", "rendered host1",
                " host2 ", "rendered host2",
                "   propertyValue1   ", "rendered propertyValue1",
                " propertyValue2 ", "rendered propertyValue2"
        );

        assertKeys(configuration).hasSameElementsAs(context.keySet().stream().map(keys -> new MustacheBindingToken(keys, 2, false)).collect(Collectors.toSet()));

        Map<String, String> context2 = Map.of(
                "dbName", "rendered dbName",
                "url", "rendered url",
                "headerValue1", "rendered headerValue1",
                "headerValue2", "rendered headerValue2",
                "host1", "rendered host1",
                "host2", "rendered host2",
                "propertyValue1", "rendered propertyValue1",
                "propertyValue2", "rendered propertyValue2"
        );

        renderFieldValues(configuration, context2);

        assertThat(configuration.getConnection().getDefaultDatabaseName()).isEqualTo("rendered dbName");
        assertThat(configuration.getUrl()).isEqualTo("rendered url");

        assertThat(configuration.getHeaders()).containsOnly(
                new Property("header1", "rendered headerValue1"),
                new Property("header2", "rendered headerValue2")
        );

        assertThat(configuration.getEndpoints()).containsOnly(
                new Endpoint("rendered host1", 2000L),
                new Endpoint("rendered host2", 2000L)
        );

        assertThat(configuration.getProperties()).containsOnly(
                new Property("name1", "rendered propertyValue1!"),
                new Property("name2", "rendered propertyValue2!")
        );
    }

    @Test
    public void allActionConfigurationFields() {
        ActionConfiguration configuration = new ActionConfiguration();

        configuration.setBody("{{ body }}");
        configuration.setPath("{{ path }}");
        configuration.setNext("{{ next }}");

        configuration.setHeaders(List.of(
                new Property("header1", "{{ headerValue1 }}"),
                new Property("header2", "{{ headerValue2 }}")
        ));

        configuration.setBodyFormData(List.of(
                new Property("param1", "{{ bodyParam1 }}"),
                new Property("param2", "{{ bodyParam2 }}")
        ));

        configuration.setQueryParameters(List.of(
                new Property("param1", "{{ queryParam1 }}"),
                new Property("param2", "{{ queryParam2 }}")
        ));

        configuration.setPluginSpecifiedTemplates(Arrays.asList(
                null,
                new Property("prop1", "{{ pluginSpecifiedProp1 }}"),
                null,
                new Property("prop2", "{{ pluginSpecifiedProp2 }}")
        ));

        final Map<String, String> context = new HashMap<>(Map.of(
                " body ", "rendered body",
                " path ", "rendered path",
                " next ", "rendered next",
                " headerValue2 ", "rendered headerValue2",
                " headerValue1 ", "rendered headerValue1",
                " bodyParam1 ", "rendered bodyParam1",
                " bodyParam2 ", "rendered bodyParam2",
                " queryParam1 ", "rendered queryParam1",
                " queryParam2 ", "rendered queryParam2"
        ));

        context.putAll(Map.of(
                " pluginSpecifiedProp1 ", "rendered pluginSpecifiedProp1",
                " pluginSpecifiedProp2 ", "rendered pluginSpecifiedProp2"
        ));

        assertKeys(configuration)
                .hasSameElementsAs(context
                        .keySet()
                        .stream()
                        .map(keys -> new MustacheBindingToken(keys, 2, false))
                        .collect(Collectors.toSet()));

        final Map<String, String> context2 = new HashMap<>(Map.of(
                "body", "rendered body",
                "path", "rendered path",
                "next", "rendered next",
                "headerValue2", "rendered headerValue2",
                "headerValue1", "rendered headerValue1",
                "bodyParam1", "rendered bodyParam1",
                "bodyParam2", "rendered bodyParam2",
                "queryParam1", "rendered queryParam1",
                "queryParam2", "rendered queryParam2"
        ));
        context2.putAll(Map.of(
                "pluginSpecifiedProp1", "rendered pluginSpecifiedProp1",
                "pluginSpecifiedProp2", "rendered pluginSpecifiedProp2"
        ));
        renderFieldValues(configuration, context2);

        assertThat(configuration.getBody()).isEqualTo("rendered body");
        assertThat(configuration.getPath()).isEqualTo("rendered path");
        assertThat(configuration.getNext()).isEqualTo("rendered next");

        assertThat(configuration.getHeaders()).containsOnly(
                new Property("header1", "rendered headerValue1"),
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
    public void objectWithJavascriptString() {
        DatasourceConfiguration configuration = new DatasourceConfiguration();
        Property property = new Property();
        property.setKey("name");
        property.setValue("Hello {{ \"there\" }}!");
        configuration.setProperties(Arrays.asList(property));
        assertKeys(configuration).containsExactlyInAnyOrder(new MustacheBindingToken(" \"there\" ", 8, false));
    }

    @Test
    public void objectWithJavascriptStringWithBackslashes() {
        DatasourceConfiguration configuration = new DatasourceConfiguration();
        Property property = new Property();
        property.setKey("name");
        property.setValue("Hello {{ \"th\\\\ere\" }}!");
        configuration.setProperties(Arrays.asList(property));
        assertKeys(configuration).containsExactlyInAnyOrder(new MustacheBindingToken(" \"th\\\\ere\" ", 8, false));
    }

    @Test
    public void objectWithJavascriptStringWithNewline() {
        DatasourceConfiguration configuration = new DatasourceConfiguration();
        Property property = new Property();
        property.setKey("name");
        // The `\n` should be interpreted by Javascript, not Java. So we put an extra `\` before it.
        property.setValue("Hello {{ \"line 1\" + \"\\n\" + \"line 2\" }}!");
        configuration.setProperties(Arrays.asList(property));
        assertKeys(configuration).containsExactlyInAnyOrder(new MustacheBindingToken(" \"line 1\" + \"\\n\" + \"line 2\" ", 8, false));
    }

    @Test
    public void bodyInMustaches() {
        ActionConfiguration configuration = new ActionConfiguration();
        configuration.setBody("outside {{ ab }} outside");
        assertKeys(configuration).containsExactlyInAnyOrder(new MustacheBindingToken(" ab ", 10, false));

        renderFieldValues(configuration, Map.of("ab", "rendered"));
        assertThat(configuration.getBody()).isEqualTo("outside rendered outside");
    }

    @Test
    public void bodyWithNewlineInMustaches() {
        ActionConfiguration configuration = new ActionConfiguration();
        configuration.setBody("outside {{a\nb}} outside");
        assertKeys(configuration).isEqualTo(Set.of(new MustacheBindingToken("a\nb", 10, false)));

        renderFieldValues(configuration, Map.of("a\nb", "{\"more\": \"json\"}"));
        assertThat(configuration.getBody()).isEqualTo("outside {\"more\": \"json\"} outside");
    }

    @Test
    public void bodyWithTabInMustaches() {
        ActionConfiguration configuration = new ActionConfiguration();
        configuration.setBody("outside {{a\tb}} outside");
        assertKeys(configuration).containsExactlyInAnyOrder(new MustacheBindingToken("a\tb", 10, false));
    }

    @Test
    public void bodyWithMultilineJavascriptInMustaches() {
        ActionConfiguration configuration = new ActionConfiguration();
        configuration.setBody("outside {{\n\ttrue\n\t\t? \"yes\\n\"\n\t\t: \"no\\n\"\n}} outside");
        assertKeys(configuration).containsExactlyInAnyOrder(new MustacheBindingToken("\n\ttrue\n\t\t? \"yes\\n\"\n\t\t: \"no\\n\"\n", 10, false));
    }

    @Test
    public void renderBodyWithMultilineJavascriptInMustaches() {
        ActionConfiguration configuration = new ActionConfiguration();
        configuration.setBody("outside {{\n\ttrue\n\t\t \"yes\\n\"\n\t\t \"no\\n\"\n}} outside");
        assertKeys(configuration).containsExactlyInAnyOrder(new MustacheBindingToken("\n\ttrue\n\t\t \"yes\\n\"\n\t\t \"no\\n\"\n", 10, false));

        renderFieldValues(configuration, Map.of("true\n\t\t \"yes\\n\"\n\t\t \"no\\n\"", "{\"more\": \"json\"}"));
        assertThat(configuration.getBody()).isEqualTo("outside {\"more\": \"json\"} outside");
    }

    @Test
    public void renderSingleKey() {
        final String rendered = render(
                "{{key1}}",
                Map.of(
                        "key1", "value1"
                )
        );
        assertThat(rendered).isEqualTo("value1");
    }

    @Test
    public void renderSingleKeyWithLeading() {
        final String rendered = render(
                "leading content {{key1}}",
                Map.of(
                        "key1", "value1"
                )
        );
        assertThat(rendered).isEqualTo("leading content value1");
    }

    @Test
    public void renderSingleKeyWithTailing() {
        final String rendered = render(
                "{{key1}} tailing content",
                Map.of(
                        "key1", "value1"
                )
        );
        assertThat(rendered).isEqualTo("value1 tailing content");
    }

    @Test
    public void renderSingleKeyWithLeadingAndTailing() {
        final String rendered = render(
                "leading content {{key1}} tailing content",
                Map.of(
                        "key1", "value1"
                )
        );
        assertThat(rendered).isEqualTo("leading content value1 tailing content");
    }

    @Test
    public void renderMustacheComment() {
        final String rendered = render(
                "leading content {{!key1}} tailing content",
                Map.of(
                        "!key1", "value1"
                )
        );
        assertThat(rendered).isEqualTo("leading content value1 tailing content");
    }

    @Test
    public void renderMustacheCondition() {
        final String rendered = render(
                "leading content {{#key1}} tailing content",
                Map.of(
                        "#key1", "value1"
                )
        );
        assertThat(rendered).isEqualTo("leading content value1 tailing content");
    }

    @Test
    public void renderMustacheSubSection() {
        final String rendered = render(
                "leading content {{>key1}} tailing content",
                Map.of(
                        ">key1", "value1"
                )
        );
        assertThat(rendered).isEqualTo("leading content value1 tailing content");
    }

    @Test
    public void renderMultipleKeys() {
        final String rendered = render(
                "leading {{key1}} and then {{key2}} tailing.",
                Map.of(
                        "key1", "value1",
                        "key2", "value2"
                )
        );
        assertThat(rendered).isEqualTo("leading value1 and then value2 tailing.");
    }

    @Test
    public void renderMultipleKeysWithSpaces() {
        final String rendered = render(
                "leading {{ key1 }} and then {{ key2 }} tailing.",
                Map.of(
                        "key1", "value1",
                        "key2", "value2"
                )
        );
        assertThat(rendered).isEqualTo("leading value1 and then value2 tailing.");
    }

}
