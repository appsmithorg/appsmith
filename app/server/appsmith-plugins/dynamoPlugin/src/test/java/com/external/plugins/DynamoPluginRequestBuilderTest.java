package com.external.plugins;

import com.appsmith.external.exceptions.pluginExceptions.AppsmithPluginErrorCode;
import com.appsmith.external.models.ActionConfiguration;
import com.appsmith.external.models.ActionExecutionResult;
import com.appsmith.external.models.DatasourceConfiguration;
import com.external.plugins.exceptions.DynamoErrorMessages;
import org.junit.jupiter.api.Test;
import software.amazon.awssdk.services.dynamodb.DynamoDbClient;

import java.lang.reflect.Method;
import java.lang.reflect.ParameterizedType;
import java.lang.reflect.Type;
import java.lang.reflect.WildcardType;
import java.time.Duration;
import java.util.ArrayDeque;
import java.util.Collection;
import java.util.Deque;
import java.util.HashSet;
import java.util.Map;
import java.util.Set;
import java.util.TreeSet;
import java.util.function.Consumer;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verifyNoInteractions;

/** How query bodies map onto the SDK's request builders, across the requests of every allowed action. */
class DynamoPluginRequestBuilderTest {

    /**
     * Every request builder also has a zero-argument {@code overrideConfiguration()} getter next to its one-argument
     * setters of that name; a body field of that name is an invalid attribute.
     */
    @Test
    void should_reportInvalidAttribute_when_bodyFieldNamesAZeroArgumentBuilderMethod() {
        // Given
        DynamoDbClient client = mock(DynamoDbClient.class);
        ActionConfiguration configuration = new ActionConfiguration();
        configuration.setPath("GetItem");
        configuration.setBody("{\"TableName\":\"Music\",\"OverrideConfiguration\":\"value\"}");

        // When
        ActionExecutionResult result = new DynamoPlugin.DynamoPluginExecutor()
                .execute(client, new DatasourceConfiguration(), configuration)
                .block(Duration.ofSeconds(30));

        // Then
        assertThat(result.getIsExecutionSuccess()).isFalse();
        assertThat(result.getStatusCode()).isEqualTo(AppsmithPluginErrorCode.PLUGIN_EXECUTE_ARGUMENT_ERROR.getCode());
        assertThat(result.getPluginErrorDetails().getAppsmithErrorMessage())
                .isEqualTo(String.format(DynamoErrorMessages.INVALID_ATTRIBUTE_ERROR_MSG, "OverrideConfiguration"));
        verifyNoInteractions(client);
    }

    /**
     * The plugin reads binary values as base64 in the lists of a map of lists of model objects, and as UTF-8 text
     * everywhere else. That map is BatchWriteItem's RequestItems; a builder setter of the same shape anywhere else
     * would get base64 binary too, so it must be decided on before it is accepted here.
     */
    @Test
    void should_findOnlyBatchWriteItemRequestItems_when_listingMapOfModelListSetters() throws Exception {
        // Given
        Deque<Class<?>> pending = new ArrayDeque<>();
        for (String action : DynamoPlugin.ACTIONS) {
            pending.add(Class.forName(DynamoPlugin.MODEL_PACKAGE + action + "Request"));
        }

        // When
        Set<String> mapOfModelListSetters = new TreeSet<>();
        Set<Class<?>> visited = new HashSet<>();
        while (!pending.isEmpty()) {
            Class<?> type = pending.poll();
            if (!visited.add(type)) {
                continue;
            }
            for (Method method : Class.forName(type.getName() + "$Builder").getMethods()) {
                if (method.getParameterCount() != 1) {
                    continue;
                }
                Type parameter = method.getGenericParameterTypes()[0];
                if (isMapOfModelLists(parameter)) {
                    mapOfModelListSetters.add(type.getSimpleName() + "." + method.getName());
                }
                collectModelTypes(parameter, pending);
            }
        }

        // Then
        assertThat(visited).hasSizeGreaterThan(DynamoPlugin.ACTIONS.size());
        assertThat(mapOfModelListSetters).containsExactly("BatchWriteItemRequest.requestItems");
    }

    private static boolean isMapOfModelLists(Type type) {
        if (!(type instanceof ParameterizedType map) || !Map.class.equals(map.getRawType())) {
            return false;
        }
        Type value = upperBound(map.getActualTypeArguments()[1]);
        return value instanceof ParameterizedType list
                && Collection.class.isAssignableFrom((Class<?>) list.getRawType())
                && isModelClass(upperBound(list.getActualTypeArguments()[0]));
    }

    /** Adds the model classes a parameter type mentions, other than through a Consumer of a builder. */
    private static void collectModelTypes(Type type, Deque<Class<?>> pending) {
        Type bound = upperBound(type);
        if (bound instanceof Class<?> clazz) {
            Class<?> component = clazz.isArray() ? clazz.getComponentType() : clazz;
            if (isModelClass(component)) {
                pending.add(component);
            }
        } else if (bound instanceof ParameterizedType parameterized
                && !Consumer.class.equals(parameterized.getRawType())) {
            for (Type argument : parameterized.getActualTypeArguments()) {
                collectModelTypes(argument, pending);
            }
        }
    }

    private static boolean isModelClass(Type type) {
        if (!(type instanceof Class<?> clazz)
                || !clazz.getName().startsWith(DynamoPlugin.MODEL_PACKAGE)
                || clazz.isEnum()
                || clazz.isInterface()) {
            return false;
        }
        try {
            Class.forName(clazz.getName() + "$Builder");
            return true;
        } catch (ClassNotFoundException e) {
            return false;
        }
    }

    private static Type upperBound(Type type) {
        return type instanceof WildcardType wildcard ? wildcard.getUpperBounds()[0] : type;
    }
}
