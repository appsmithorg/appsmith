package com.external.plugins;

import com.appsmith.external.datatypes.ClientDataType;
import com.appsmith.external.dtos.ExecuteActionDTO;
import com.appsmith.external.exceptions.pluginExceptions.AppsmithPluginError;
import com.appsmith.external.exceptions.pluginExceptions.AppsmithPluginException;
import com.appsmith.external.exceptions.pluginExceptions.StaleConnectionException;
import com.appsmith.external.models.ActionConfiguration;
import com.appsmith.external.models.DatasourceConfiguration;
import com.appsmith.external.models.Param;
import io.micrometer.observation.ObservationRegistry;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;
import org.junit.jupiter.params.provider.ValueSource;
import reactor.core.publisher.Mono;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Stream;

import static com.appsmith.external.helpers.PluginUtils.STRING_TYPE;
import static com.appsmith.external.helpers.PluginUtils.getDataValueSafelyFromFormData;
import static com.appsmith.external.helpers.PluginUtils.setDataValueSafelyInFormData;
import static com.external.plugins.constants.FieldName.BODY;
import static com.external.plugins.constants.FieldName.COLLECTION;
import static com.external.plugins.constants.FieldName.COMMAND;
import static com.external.plugins.constants.FieldName.FIND_QUERY;
import static com.external.plugins.constants.FieldName.SMART_SUBSTITUTION;
import static com.external.plugins.constants.FieldName.STRICT_VALUES;
import static org.assertj.core.api.Assertions.assertThat;

/**
 * Strict values: refuse operator keys and raw BSON in substituted values. These tests do not need a database.
 *
 * <p>A null Mongo client fails with StaleConnectionException after smart substitution. That exception shows the
 * substitution finished and the query reached the client. Any other outcome is a refusal before the client.
 */
class MongoPluginStrictValuesTest {

    private static final String RAW_FIND_BODY = "{ \"find\": \"users\", \"filter\": { \"name\": {{Input1.text}} } }";

    private final MongoPlugin.MongoPluginExecutor pluginExecutor =
            new MongoPlugin.MongoPluginExecutor(ObservationRegistry.NOOP);

    private static Map<String, Object> rawFormData(String body, Object smartSubstitution, Object strictValues) {
        Map<String, Object> formData = new HashMap<>();
        setDataValueSafelyInFormData(formData, SMART_SUBSTITUTION, smartSubstitution);
        if (strictValues != null) {
            setDataValueSafelyInFormData(formData, STRICT_VALUES, strictValues);
        }
        setDataValueSafelyInFormData(formData, COMMAND, "RAW");
        setDataValueSafelyInFormData(formData, BODY, body);
        return formData;
    }

    private static ExecuteActionDTO executeRequest(String value, ClientDataType clientDataType) {
        Param param = new Param("Input1.text", value);
        param.setClientDataType(clientDataType);
        ExecuteActionDTO executeActionDTO = new ExecuteActionDTO();
        executeActionDTO.setParams(new ArrayList<>(List.of(param)));
        return executeActionDTO;
    }

    private Throwable execute(Map<String, Object> formData, ExecuteActionDTO executeActionDTO) {
        ActionConfiguration actionConfiguration = new ActionConfiguration();
        actionConfiguration.setFormData(formData);
        try {
            Mono.defer(() -> pluginExecutor.executeParameterized(
                            null, executeActionDTO, new DatasourceConfiguration(), actionConfiguration))
                    .block();
        } catch (Throwable t) {
            return t;
        }
        return null;
    }

    static Stream<Arguments> refusedValues() {
        return Stream.of(
                // A BSON object that is not strict JSON: unquoted key and single quotes.
                Arguments.of("{ name: 'a' }", ClientDataType.OBJECT),
                // A JSON object whose key starts with "$".
                Arguments.of("{\"$custom\": 1}", ClientDataType.OBJECT),
                // A "$" key nested inside an array.
                Arguments.of("[{\"a\": {\"b\": {\"$custom\": 1}}}]", ClientDataType.ARRAY),
                // A quoted Mongo special type, which the plugin would otherwise write as raw BSON.
                Arguments.of("\"ObjectId('507f1f77bcf86cd799439011')\"", ClientDataType.STRING));
    }

    @ParameterizedTest
    @MethodSource("refusedValues")
    void should_refuseQuery_when_strictValuesOnAndValueIsNotPlainJson(String value, ClientDataType clientDataType) {
        // Given
        Map<String, Object> formData = rawFormData(RAW_FIND_BODY, Boolean.TRUE, Boolean.TRUE);

        // When
        Throwable error = execute(formData, executeRequest(value, clientDataType));

        // Then
        assertThat(error).isInstanceOf(AppsmithPluginException.class);
        AppsmithPluginException pluginException = (AppsmithPluginException) error;
        assertThat(pluginException.getError()).isEqualTo(AppsmithPluginError.PLUGIN_EXECUTE_ARGUMENT_ERROR);
        assertThat(pluginException.getMessage()).contains("{{Input1.text}}");
        // The query keeps its placeholder: nothing from the value reached it.
        assertThat(getDataValueSafelyFromFormData(formData, BODY, STRING_TYPE)).isEqualTo(RAW_FIND_BODY);
    }

    @Test
    void should_writePlainJsonAsData_when_strictValuesOn() {
        // Given
        String body = "{ \"insert\": \"users\", \"documents\": [{{Input1.text}}] }";
        Map<String, Object> formData = rawFormData(body, Boolean.TRUE, Boolean.TRUE);
        // A quoted special type inside a plain object stays a string.
        String value =
                "{\"name\": \"a\", \"tags\": [\"x\", {\"k\": 1}], \"ref\": \"ObjectId('507f1f77bcf86cd799439011')\"}";

        // When
        Throwable error = execute(formData, executeRequest(value, ClientDataType.OBJECT));

        // Then
        assertThat(error).isInstanceOf(StaleConnectionException.class);
        String substituted = getDataValueSafelyFromFormData(formData, BODY, STRING_TYPE);
        assertThat(substituted).contains("\"ref\":\"ObjectId('507f1f77bcf86cd799439011')\"");
        assertThat(substituted).contains("\"tags\":[\"x\",{\"k\":1}]");
        assertThat(substituted).doesNotContain("ObjectId(\"");
    }

    @Test
    void should_writeArrayOfPlainObjects_when_strictValuesOn() {
        // Given
        String body = "{ \"insert\": \"users\", \"documents\": {{Input1.text}} }";
        Map<String, Object> formData = rawFormData(body, Boolean.TRUE, Boolean.TRUE);

        // When
        Throwable error =
                execute(formData, executeRequest("[{\"name\": \"a\"}, {\"name\": \"b\"}]", ClientDataType.ARRAY));

        // Then
        assertThat(error).isInstanceOf(StaleConnectionException.class);
        assertThat(getDataValueSafelyFromFormData(formData, BODY, STRING_TYPE))
                .isEqualTo("{ \"insert\": \"users\", \"documents\": [{\"name\":\"a\"},{\"name\":\"b\"}] }");
    }

    @Test
    void should_substitutePlainValue_when_strictValuesOff() {
        // Given
        Map<String, Object> formData = rawFormData(RAW_FIND_BODY, Boolean.TRUE, null);

        // When
        Throwable error = execute(formData, executeRequest("{\"city\": \"Pune\"}", ClientDataType.OBJECT));

        // Then
        assertThat(error).isInstanceOf(StaleConnectionException.class);
        assertThat(getDataValueSafelyFromFormData(formData, BODY, STRING_TYPE))
                .isEqualTo("{ \"find\": \"users\", \"filter\": { \"name\": {\"city\":\"Pune\"} } }");
    }

    @Test
    void should_refuseQuery_when_strictValuesOnAndSmartSubstitutionOff() {
        // Given
        Map<String, Object> formData = rawFormData(RAW_FIND_BODY, Boolean.FALSE, Boolean.TRUE);

        // When
        Throwable error = execute(formData, executeRequest("30", ClientDataType.NUMBER));

        // Then
        assertThat(error).isInstanceOf(AppsmithPluginException.class);
        assertThat(((AppsmithPluginException) error).getError())
                .isEqualTo(AppsmithPluginError.PLUGIN_EXECUTE_ARGUMENT_ERROR);
    }

    @ParameterizedTest
    @ValueSource(strings = {"true", "TRUE"})
    void should_readStrictValues_when_flagIsStoredAsString(String storedFlag) {
        // Given
        Map<String, Object> formData = rawFormData(RAW_FIND_BODY, Boolean.TRUE, storedFlag);

        // When
        Throwable error = execute(formData, executeRequest("{\"$custom\": 1}", ClientDataType.OBJECT));

        // Then
        assertThat(error).isInstanceOf(AppsmithPluginException.class);
    }

    @Test
    void should_ignoreExecuteRequest_when_itTriesToTurnOffStrictValues() {
        // Given
        Map<String, Object> formData = rawFormData(RAW_FIND_BODY, Boolean.TRUE, Boolean.TRUE);
        ExecuteActionDTO executeActionDTO = executeRequest("{\"$custom\": 1}", ClientDataType.OBJECT);
        // The execute request carries only bound values. A value named like the flag does not change it.
        Param flagLookalike = new Param("strictValues", "false");
        flagLookalike.setClientDataType(ClientDataType.BOOLEAN);
        executeActionDTO.getParams().add(flagLookalike);
        executeActionDTO.setViewMode(true);

        // When
        Throwable error = execute(formData, executeActionDTO);

        // Then
        assertThat(error).isInstanceOf(AppsmithPluginException.class);
        assertThat(((AppsmithPluginException) error).getError())
                .isEqualTo(AppsmithPluginError.PLUGIN_EXECUTE_ARGUMENT_ERROR);
    }

    @Test
    void should_refuseFormCommandValue_when_strictValuesOn() {
        // Given
        Map<String, Object> formData = new HashMap<>();
        setDataValueSafelyInFormData(formData, SMART_SUBSTITUTION, Boolean.TRUE);
        setDataValueSafelyInFormData(formData, STRICT_VALUES, Boolean.TRUE);
        setDataValueSafelyInFormData(formData, COMMAND, "FIND");
        setDataValueSafelyInFormData(formData, COLLECTION, "users");
        setDataValueSafelyInFormData(formData, FIND_QUERY, "{ \"name\": {{Input1.text}} }");

        // When
        Throwable error = execute(formData, executeRequest("{\"$custom\": null}", ClientDataType.OBJECT));

        // Then
        assertThat(error).isInstanceOf(AppsmithPluginException.class);
        assertThat(((AppsmithPluginException) error).getError())
                .isEqualTo(AppsmithPluginError.PLUGIN_EXECUTE_ARGUMENT_ERROR);
        assertThat(getDataValueSafelyFromFormData(formData, FIND_QUERY, STRING_TYPE))
                .isEqualTo("{ \"name\": {{Input1.text}} }");
    }

    @Test
    void should_keepSpecialTypeTextAsString_when_strictValuesOn() {
        // Given
        String body = "{ \"find\": \"users\", \"filter\": { \"_id\": {{Input1.text}} } }";
        Map<String, Object> formData = rawFormData(body, Boolean.TRUE, Boolean.TRUE);

        // When
        Throwable error =
                execute(formData, executeRequest("ObjectId('507f1f77bcf86cd799439011')", ClientDataType.STRING));

        // Then
        assertThat(error).isInstanceOf(StaleConnectionException.class);
        assertThat(getDataValueSafelyFromFormData(formData, BODY, STRING_TYPE))
                .isEqualTo(
                        "{ \"find\": \"users\", \"filter\": { \"_id\": \"ObjectId('507f1f77bcf86cd799439011')\" } }");
    }

    @Test
    void should_acceptScalarValues_when_strictValuesOn() {
        // Given
        String body = "{ \"find\": \"users\", \"filter\": { \"name\": {{Input1.text}}, \"age\": {{Input2.text}} } }";
        Map<String, Object> formData = rawFormData(body, Boolean.TRUE, Boolean.TRUE);
        ExecuteActionDTO executeActionDTO = executeRequest("$5 off", ClientDataType.STRING);
        Param age = new Param("Input2.text", "30");
        age.setClientDataType(ClientDataType.NUMBER);
        executeActionDTO.getParams().add(age);

        // When
        Throwable error = execute(formData, executeActionDTO);

        // Then
        assertThat(error).isInstanceOf(StaleConnectionException.class);
        assertThat(getDataValueSafelyFromFormData(formData, BODY, STRING_TYPE))
                .isEqualTo("{ \"find\": \"users\", \"filter\": { \"name\": \"$5 off\", \"age\": 30 } }");
    }
}
