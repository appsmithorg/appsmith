package com.appsmith.server.helpers;

import com.appsmith.external.models.DatasourceConfiguration;
import com.appsmith.external.models.Property;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.junit4.SpringRunner;

import java.util.Arrays;
import java.util.List;
import java.util.Set;

import static com.appsmith.server.helpers.MustacheHelper.extractMustacheKeys;
import static com.appsmith.server.helpers.MustacheHelper.extractMustacheKeysFromJson;
import static com.appsmith.server.helpers.MustacheHelper.tokenize;
import static org.assertj.core.api.Assertions.assertThat;

@SuppressWarnings(
        // Disabling this so we may use `Arrays.asList` with single argument, which is easier to refactor, just for tests.
        "ArraysAsListWithZeroOrOneArgument"
)
@RunWith(SpringRunner.class)
@SpringBootTest
public class MustacheHelperTest {

    @Autowired
    private ObjectMapper objectMapper;

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

    private void checkKeysJson(String template, Set<String> expected) {
        assertThat(extractMustacheKeysFromJson(template)).isEqualTo(expected);
    }

    private void checkJson(String template, Set<String> expectedKeys) {
        if (expectedKeys != null) {
            checkKeysJson(template, expectedKeys);
        }
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
    public void objectWithJavascriptString() throws JsonProcessingException {
        DatasourceConfiguration configuration = new DatasourceConfiguration();
        Property property = new Property();
        property.setKey("name");
        property.setValue("Hello {{ \"there\" }}!");
        configuration.setProperties(Arrays.asList(property));
        checkJson(
                objectMapper.writeValueAsString(configuration),
                Set.of("\"there\"")
        );
    }

    @Test
    public void objectWithJavascriptStringWithBackslashes() throws JsonProcessingException {
        DatasourceConfiguration configuration = new DatasourceConfiguration();
        Property property = new Property();
        property.setKey("name");
        property.setValue("Hello {{ \"th\\\\ere\" }}!");
        configuration.setProperties(Arrays.asList(property));
        checkJson(
                objectMapper.writeValueAsString(configuration),
                Set.of("\"th\\\\ere\"")
        );
    }

    @Test
    public void objectWithJavascriptStringWithNewline() throws JsonProcessingException {
        DatasourceConfiguration configuration = new DatasourceConfiguration();
        Property property = new Property();
        property.setKey("name");
        // The `\n` should be interpreted by Javascript, not Java. So we put an extra `\` before it.
        property.setValue("Hello {{ \"line 1\" + \"\\n\" + \"line 2\" }}!");
        configuration.setProperties(Arrays.asList(property));
        checkJson(
                objectMapper.writeValueAsString(configuration),
                Set.of("\"line 1\" + \"\\n\" + \"line 2\"")
        );
    }

}
