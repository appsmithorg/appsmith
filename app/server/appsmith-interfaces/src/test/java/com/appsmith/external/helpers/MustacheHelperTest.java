package com.appsmith.external.helpers;

import com.appsmith.external.models.ActionConfiguration;
import com.appsmith.external.models.Connection;
import com.appsmith.external.models.DatasourceConfiguration;
import com.appsmith.external.models.Endpoint;
import com.appsmith.external.models.Property;
import org.assertj.core.api.IterableAssert;
import org.junit.Test;

import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

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

    private void checkTokens(String template, List<String> expected) {
        assertThat(tokenize(template)).isEqualTo(expected);
    }

    private void checkKeys(String template, Set<String> expected) {
        assertThat(extractMustacheKeys(template)).isEqualTo(expected);
    }

    private void check(String template, List<String> expectedTokens, Set<String> expectedKeys) {
        if (expectedTokens != null) {
            checkTokens(template, expectedTokens);
        }
        if (expectedKeys != null) {
            checkKeys(template, expectedKeys);
        }
    }

    private IterableAssert<String> assertKeys(Object object) {
        return assertThat(extractMustacheKeysFromFields(object));
    }

    @Test
    public void dontSplitNormalTexts() {
        checkKeys("hello there matey!", Set.of());
    }

    @Test
    public void justSingleMustache() {
        checkTokens("{{A}}", Arrays.asList("{{A}}"));
        checkKeys("{{A}}", Set.of("A"));
        checkKeys("{{A + B / C}}", Set.of("A + B / C"));
    }

    @Test
    public void textAndMustache() {
        checkKeys("Hello {{name}}", Set.of("name"));
        checkKeys("Hello {{url.hash}}", Set.of("url.hash"));
    }

    @Test
    public void mustacheAndText() {
        checkKeys("{{name}} is approved!", Set.of("name"));
    }

    @Test
    public void realWorldText1() {
        checkTokens(
                "Hello {{Customer.Name}}, the status for your order id {{orderId}} is {{status}}",
                Arrays.asList(
                        "Hello ",
                        "{{Customer.Name}}",
                        ", the status for your order id ",
                        "{{orderId}}",
                        " is ",
                        "{{status}}"
                )
        );
        checkKeys(
                "Hello {{Customer.Name}}, the status for your order id {{orderId}} is {{status}}",
                Set.of(
                        "Customer.Name",
                        "orderId",
                        "status"
                )
        );
    }

    @Test
    public void realWorldText2() {
        checkTokens(
                "{{data.map(datum => {return {id: datum}})}}",
                Arrays.asList("{{data.map(datum => {return {id: datum}})}}")
        );
        checkKeys(
                "{{data.map(datum => {return {id: datum}})}}",
                Set.of("data.map(datum => {return {id: datum}})")
        );
    }

    @Test
    public void braceDances1() {
        check(
                "{{}}{{}}}",
                Arrays.asList("{{}}", "{{}}", "}"),
                Set.of("")
        );

        check("{{{}}", Arrays.asList("{{{}}"), Set.of("{"));

        check("{{ {{", Arrays.asList("{{ {{"), Set.of());

        check("}} }}", Arrays.asList("}} }}"), Set.of());

        check("}} {{", Arrays.asList("}} ", "{{"), Set.of());
    }

    @Test
    public void quotedStrings() {
        check(
                "{{ 'abc def'.toUpperCase() }}",
                Arrays.asList("{{ 'abc def'.toUpperCase() }}"),
                Set.of("'abc def'.toUpperCase()")
        );
        check(
                "{{ \"abc def\".toUpperCase() }}",
                Arrays.asList("{{ \"abc def\".toUpperCase() }}"),
                Set.of("\"abc def\".toUpperCase()")
        );
        check(
                "{{ `abc def`.toUpperCase() }}",
                Arrays.asList("{{ `abc def`.toUpperCase() }}"),
                Set.of("`abc def`.toUpperCase()")
        );
    }

    @Test
    public void singleQuotedStringsWithBraces() {
        check(
                "{{ 'The { char is a brace' }}",
                Arrays.asList("{{ 'The { char is a brace' }}"),
                Set.of("'The { char is a brace'")
        );
        check(
                "{{ 'I have {{ two braces' }}",
                Arrays.asList("{{ 'I have {{ two braces' }}"),
                Set.of("'I have {{ two braces'")
        );
        check(
                "{{ 'I have {{{ three braces' }}",
                Arrays.asList("{{ 'I have {{{ three braces' }}"),
                Set.of("'I have {{{ three braces'")
        );
        check(
                "{{ 'The } char is a brace' }}",
                Arrays.asList("{{ 'The } char is a brace' }}"),
                Set.of("'The } char is a brace'")
        );
        check(
                "{{ 'I have }} two braces' }}",
                Arrays.asList("{{ 'I have }} two braces' }}"),
                Set.of("'I have }} two braces'")
        );
        check(
                "{{ 'I have }}} three braces' }}",
                Arrays.asList("{{ 'I have }}} three braces' }}"),
                Set.of("'I have }}} three braces'")
        );
        check(
                "{{ 'Interpolation uses {{ and }} delimiters' }}",
                Arrays.asList("{{ 'Interpolation uses {{ and }} delimiters' }}"),
                Set.of("'Interpolation uses {{ and }} delimiters'")
        );
    }

    @Test
    public void doubleQuotedStringsWithBraces() {
        check(
                "{{ \"The { char is a brace\" }}",
                Arrays.asList("{{ \"The { char is a brace\" }}"),
                Set.of("\"The { char is a brace\"")
        );
        check(
                "{{ \"I have {{ two braces\" }}",
                Arrays.asList("{{ \"I have {{ two braces\" }}"),
                Set.of("\"I have {{ two braces\"")
        );
        check(
                "{{ \"I have {{{ three braces\" }}",
                Arrays.asList("{{ \"I have {{{ three braces\" }}"),
                Set.of("\"I have {{{ three braces\"")
        );
        check(
                "{{ \"The } char is a brace\" }}",
                Arrays.asList("{{ \"The } char is a brace\" }}"),
                Set.of("\"The } char is a brace\"")
        );
        check(
                "{{ \"I have }} two braces\" }}",
                Arrays.asList("{{ \"I have }} two braces\" }}"),
                Set.of("\"I have }} two braces\"")
        );
        check(
                "{{ \"I have }}} three braces\" }}",
                Arrays.asList("{{ \"I have }}} three braces\" }}"),
                Set.of("\"I have }}} three braces\"")
        );
        check(
                "{{ \"Interpolation uses {{ and }} delimiters\" }}",
                Arrays.asList("{{ \"Interpolation uses {{ and }} delimiters\" }}"),
                Set.of("\"Interpolation uses {{ and }} delimiters\"")
        );
    }

    @Test
    public void backQuotedStringsWithBraces() {
        check(
                "{{ `The { char is a brace` }}",
                Arrays.asList("{{ `The { char is a brace` }}"),
                Set.of("`The { char is a brace`")
        );
        check(
                "{{ `I have {{ two braces` }}",
                Arrays.asList("{{ `I have {{ two braces` }}"),
                Set.of("`I have {{ two braces`")
        );
        check(
                "{{ `I have {{{ three braces` }}",
                Arrays.asList("{{ `I have {{{ three braces` }}"),
                Set.of("`I have {{{ three braces`")
        );
        check(
                "{{ `The } char is a brace` }}",
                Arrays.asList("{{ `The } char is a brace` }}"),
                Set.of("`The } char is a brace`")
        );
        check(
                "{{ `I have }} two braces` }}",
                Arrays.asList("{{ `I have }} two braces` }}"),
                Set.of("`I have }} two braces`")
        );
        check(
                "{{ `I have }}} three braces` }}",
                Arrays.asList("{{ `I have }}} three braces` }}"),
                Set.of("`I have }}} three braces`")
        );
        check(
                "{{ `Interpolation uses {{ and }} delimiters` }}",
                Arrays.asList("{{ `Interpolation uses {{ and }} delimiters` }}"),
                Set.of("`Interpolation uses {{ and }} delimiters`")
        );
    }

    @Test
    public void quotedStringsWithExtras() {
        check(
                "{{ 2 + ' hello ' + 3 }}",
                Arrays.asList("{{ 2 + ' hello ' + 3 }}"),
                Set.of("2 + ' hello ' + 3")
        );
        check(
                "{{ 2 + \" hello \" + 3 }}",
                Arrays.asList("{{ 2 + \" hello \" + 3 }}"),
                Set.of("2 + \" hello \" + 3")
        );
        check(
                "{{ 2 + ` hello ` + 3 }}",
                Arrays.asList("{{ 2 + ` hello ` + 3 }}"),
                Set.of("2 + ` hello ` + 3")
        );
    }

    @Test
    public void quotedStringsWithEscapes() {
        check(
                "{{ 'Escaped \\' character' }}",
                Arrays.asList("{{ 'Escaped \\' character' }}"),
                Set.of("'Escaped \\' character'")
        );
        check(
                "{{ \"Escaped \\\" character\" }}",
                Arrays.asList("{{ \"Escaped \\\" character\" }}"),
                Set.of("\"Escaped \\\" character\"")
        );
        check(
                "{{ `Escaped \\` character` }}",
                Arrays.asList("{{ `Escaped \\` character` }}"),
                Set.of("`Escaped \\` character`")
        );
    }

    @Test
    public void conditionalExpression() {
        check(
                "Conditional: {{ 2 + 4 ? trueVal : falseVal }}",
                Arrays.asList("Conditional: ", "{{ 2 + 4 ? trueVal : falseVal }}"),
                Set.of("2 + 4 ? trueVal : falseVal")
        );
    }

    @Test
    public void jsonInMustache() {
        check(
                "{{{\"foo\": \"bar\"}}}",
                Arrays.asList("{{{\"foo\": \"bar\"}}}"),
                Set.of("{\"foo\": \"bar\"}")
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
                new Property("name1", "Hello {{ propertyValue1 }}!"),
                new Property("name2", "Hello {{ propertyValue2 }}!")
        ));

        Map<String, String> context = Map.of(
                "dbName", "rendered dbName",
                "url", "rendered url",
                "headerValue1", "rendered headerValue1",
                "headerValue2", "rendered headerValue2",
                "host1", "rendered host1",
                "host2", "rendered host2",
                "propertyValue1", "rendered propertyValue1",
                "propertyValue2", "rendered propertyValue2"
        );

        assertKeys(configuration).hasSameElementsAs(context.keySet());

        renderFieldValues(configuration, context);

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
                new Property("name1", "Hello rendered propertyValue1!"),
                new Property("name2", "Hello rendered propertyValue2!")
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

        context.putAll(Map.of(
                "pluginSpecifiedProp1", "rendered pluginSpecifiedProp1",
                "pluginSpecifiedProp2", "rendered pluginSpecifiedProp2"
        ));

        assertKeys(configuration).hasSameElementsAs(context.keySet());

        renderFieldValues(configuration, context);

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
        assertKeys(configuration).isEqualTo(Set.of("\"there\""));
    }

    @Test
    public void objectWithJavascriptStringWithBackslashes() {
        DatasourceConfiguration configuration = new DatasourceConfiguration();
        Property property = new Property();
        property.setKey("name");
        property.setValue("Hello {{ \"th\\\\ere\" }}!");
        configuration.setProperties(Arrays.asList(property));
        assertKeys(configuration).isEqualTo(Set.of("\"th\\\\ere\""));
    }

    @Test
    public void objectWithJavascriptStringWithNewline() {
        DatasourceConfiguration configuration = new DatasourceConfiguration();
        Property property = new Property();
        property.setKey("name");
        // The `\n` should be interpreted by Javascript, not Java. So we put an extra `\` before it.
        property.setValue("Hello {{ \"line 1\" + \"\\n\" + \"line 2\" }}!");
        configuration.setProperties(Arrays.asList(property));
        assertKeys(configuration).isEqualTo(Set.of("\"line 1\" + \"\\n\" + \"line 2\""));
    }

    @Test
    public void bodyInMustaches() {
        ActionConfiguration configuration = new ActionConfiguration();
        configuration.setBody("outside {{ab}} outside");
        assertKeys(configuration).isEqualTo(Set.of("ab"));

        renderFieldValues(configuration, Map.of("ab", "rendered"));
        assertThat(configuration.getBody()).isEqualTo("outside rendered outside");
    }

    @Test
    public void bodyWithNewlineInMustaches() {
        ActionConfiguration configuration = new ActionConfiguration();
        configuration.setBody("outside {{a\nb}} outside");
        assertKeys(configuration).isEqualTo(Set.of("a\nb"));

        renderFieldValues(configuration, Map.of("a\nb", "{\"more\": \"json\"}"));
        assertThat(configuration.getBody()).isEqualTo("outside {\"more\": \"json\"} outside");
    }

    @Test
    public void bodyWithTabInMustaches() {
        ActionConfiguration configuration = new ActionConfiguration();
        configuration.setBody("outside {{a\tb}} outside");
        assertKeys(configuration).isEqualTo(Set.of("a\tb"));
    }

    @Test
    public void bodyWithMultilineJavascriptInMustaches() {
        ActionConfiguration configuration = new ActionConfiguration();
        configuration.setBody("outside {{\n\ttrue\n\t\t? \"yes\\n\"\n\t\t: \"no\\n\"\n}} outside");
        assertKeys(configuration).isEqualTo(Set.of("true\n\t\t? \"yes\\n\"\n\t\t: \"no\\n\""));
    }

    @Test
    public void renderBodyWithMultilineJavascriptInMustaches() {
        ActionConfiguration configuration = new ActionConfiguration();
        configuration.setBody("outside {{\n\ttrue\n\t\t \"yes\\n\"\n\t\t \"no\\n\"\n}} outside");
        assertKeys(configuration).isEqualTo(Set.of("true\n\t\t \"yes\\n\"\n\t\t \"no\\n\""));

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
