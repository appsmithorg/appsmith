package com.external.plugins;

import com.fasterxml.jackson.databind.JsonNode;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;
import software.amazon.awssdk.core.SdkField;
import software.amazon.awssdk.core.SdkPojo;
import software.amazon.awssdk.core.protocol.MarshallingType;
import software.amazon.awssdk.core.traits.ListTrait;
import software.amazon.awssdk.core.traits.MapTrait;
import software.amazon.awssdk.utils.builder.SdkBuilder;

import java.lang.reflect.Method;
import java.util.ArrayDeque;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Deque;
import java.util.HashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Stream;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Every nested object a query body can set, in every request the query editor offers, is built from a JSON object.
 * The SDK builders have two setters for each such field, one taking the object and one taking a function of its
 * builder; the plugin must use the first whatever order reflection lists them in.
 */
class DynamoPluginNestedObjectTest {

    private static final String MODEL_PACKAGE = "software.amazon.awssdk.services.dynamodb.model.";

    static Stream<Arguments> nestedObjectFields() throws Exception {
        Deque<Class<?>> pending = new ArrayDeque<>();
        JsonNode editor = CharacterizationGolden.readResource("editor.json");
        for (JsonNode control : editor.findParents("configProperty")) {
            if ("actionConfiguration.path".equals(control.get("configProperty").asText())) {
                for (JsonNode option : control.get("options")) {
                    pending.add(
                            Class.forName(MODEL_PACKAGE + option.get("value").asText() + "Request"));
                }
            }
        }

        Set<Class<?>> visited = new LinkedHashSet<>();
        List<Arguments> fields = new ArrayList<>();
        while (!pending.isEmpty()) {
            Class<?> type = pending.poll();
            if (!visited.add(type)) {
                continue;
            }
            SdkPojo instance =
                    (SdkPojo) ((SdkBuilder<?, ?>) type.getMethod("builder").invoke(null)).build();
            for (SdkField<?> field : instance.sdkFields()) {
                for (SdkField<?> member = memberOf(field); member != null; member = memberOf(member)) {
                    if (member.marshallingType() == MarshallingType.SDK_POJO) {
                        pending.add(build(member).getClass());
                    }
                }
                if (field.marshallingType() == MarshallingType.SDK_POJO) {
                    pending.add(build(field).getClass());
                }
                if (field.marshallingType() == MarshallingType.SDK_POJO && isAddressable(type, field)) {
                    fields.add(Arguments.of(type.getSimpleName() + "." + field.memberName(), type, field));
                }
            }
        }
        return fields.stream();
    }

    @ParameterizedTest(name = "{0}")
    @MethodSource("nestedObjectFields")
    void should_buildNestedObject_when_bodySetsItAsJsonObject(String name, Class<?> owner, SdkField<?> field)
            throws Exception {
        // Given
        Map<String, Object> body = new HashMap<>();
        body.put(field.memberName(), new HashMap<>());

        // When
        Object built = DynamoPlugin.plainToSdk(body, owner);

        // Then
        assertThat(field.getValueOrDefault(built)).isEqualTo(build(field));
    }

    /** The member field of a list, or the value field of a map; null for other fields. */
    private static SdkField<?> memberOf(SdkField<?> field) {
        if (field.marshallingType() == MarshallingType.LIST) {
            return field.getTrait(ListTrait.class).memberFieldInfo();
        }
        if (field.marshallingType() == MarshallingType.MAP) {
            return field.getTrait(MapTrait.class).valueFieldInfo();
        }
        return null;
    }

    /** An empty object of the field's type. */
    private static Object build(SdkField<?> field) {
        return ((SdkBuilder<?, ?>) field.constructor().get()).build();
    }

    /** Whether the plugin's setter name for the field's JSON name, the name with a lower-case first letter, exists. */
    private static boolean isAddressable(Class<?> owner, SdkField<?> field) throws ClassNotFoundException {
        String memberName = field.memberName();
        String setterName = Character.toLowerCase(memberName.charAt(0)) + memberName.substring(1);
        Method[] methods = Class.forName(owner.getName() + "$Builder").getMethods();
        return Arrays.stream(methods).anyMatch(method -> method.getName().equals(setterName));
    }
}
