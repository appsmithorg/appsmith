package com.external.plugins;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.JsonNodeFactory;
import com.fasterxml.jackson.databind.node.ObjectNode;
import software.amazon.awssdk.services.lambda.model.AliasConfiguration;
import software.amazon.awssdk.services.lambda.model.AliasRoutingConfiguration;
import software.amazon.awssdk.services.lambda.model.DeadLetterConfig;
import software.amazon.awssdk.services.lambda.model.EnvironmentError;
import software.amazon.awssdk.services.lambda.model.EnvironmentResponse;
import software.amazon.awssdk.services.lambda.model.EphemeralStorage;
import software.amazon.awssdk.services.lambda.model.FileSystemConfig;
import software.amazon.awssdk.services.lambda.model.FunctionConfiguration;
import software.amazon.awssdk.services.lambda.model.ImageConfig;
import software.amazon.awssdk.services.lambda.model.ImageConfigError;
import software.amazon.awssdk.services.lambda.model.ImageConfigResponse;
import software.amazon.awssdk.services.lambda.model.Layer;
import software.amazon.awssdk.services.lambda.model.LoggingConfig;
import software.amazon.awssdk.services.lambda.model.RuntimeVersionConfig;
import software.amazon.awssdk.services.lambda.model.RuntimeVersionError;
import software.amazon.awssdk.services.lambda.model.SnapStartResponse;
import software.amazon.awssdk.services.lambda.model.TracingConfigResponse;
import software.amazon.awssdk.services.lambda.model.VpcConfigResponse;

import java.util.List;
import java.util.Map;
import java.util.function.Function;

/**
 * Converts Lambda list responses to the JSON returned to users. Apps bind to these keys, so the shape is a fixed
 * contract: the key names, their order, nulls for unset scalars and nested objects, and empty arrays/objects for unset
 * collections. Fields Lambda adds in future SDK versions are not emitted until they are added here deliberately.
 */
final class AwsLambdaResponseMapper {

    private static final JsonNodeFactory NODES = JsonNodeFactory.instance;

    // Lambda environment variables routinely hold credentials and API tokens. The value of each variable is a secret
    // that is unrelated to function metadata, so the names are exposed but every value is redacted rather than copied
    // into the user-visible response.
    private static final String REDACTED_VALUE = "[REDACTED]";

    private AwsLambdaResponseMapper() {}

    static ArrayNode functionConfigurations(List<FunctionConfiguration> functions) {
        return array(functions, AwsLambdaResponseMapper::functionConfiguration);
    }

    static ArrayNode aliasConfigurations(List<AliasConfiguration> aliases) {
        return array(aliases, AwsLambdaResponseMapper::aliasConfiguration);
    }

    private static ObjectNode functionConfiguration(FunctionConfiguration function) {
        ObjectNode node = NODES.objectNode();
        node.put("functionName", function.functionName());
        node.put("functionArn", function.functionArn());
        node.put("runtime", function.runtimeAsString());
        node.put("role", function.role());
        node.put("handler", function.handler());
        node.put("codeSize", function.codeSize());
        node.put("description", function.description());
        node.put("timeout", function.timeout());
        node.put("memorySize", function.memorySize());
        node.put("lastModified", function.lastModified());
        node.put("codeSha256", function.codeSha256());
        node.put("version", function.version());
        node.set("vpcConfig", object(function.vpcConfig(), AwsLambdaResponseMapper::vpcConfig));
        node.set("deadLetterConfig", object(function.deadLetterConfig(), AwsLambdaResponseMapper::deadLetterConfig));
        node.set("environment", object(function.environment(), AwsLambdaResponseMapper::environment));
        node.set("tracingConfig", object(function.tracingConfig(), AwsLambdaResponseMapper::tracingConfig));
        node.put("masterArn", function.masterArn());
        node.put("revisionId", function.revisionId());
        node.set("layers", array(function.layers(), AwsLambdaResponseMapper::layer));
        node.put("state", function.stateAsString());
        node.put("stateReason", function.stateReason());
        node.put("stateReasonCode", function.stateReasonCodeAsString());
        node.put("lastUpdateStatus", function.lastUpdateStatusAsString());
        node.put("lastUpdateStatusReason", function.lastUpdateStatusReason());
        node.put("lastUpdateStatusReasonCode", function.lastUpdateStatusReasonCodeAsString());
        node.set("fileSystemConfigs", array(function.fileSystemConfigs(), AwsLambdaResponseMapper::fileSystemConfig));
        node.put("packageType", function.packageTypeAsString());
        node.set(
                "imageConfigResponse",
                object(function.imageConfigResponse(), AwsLambdaResponseMapper::imageConfigResponse));
        node.put("signingProfileVersionArn", function.signingProfileVersionArn());
        node.put("signingJobArn", function.signingJobArn());
        node.set("architectures", strings(function.architecturesAsStrings()));
        node.set("ephemeralStorage", object(function.ephemeralStorage(), AwsLambdaResponseMapper::ephemeralStorage));
        node.set("snapStart", object(function.snapStart(), AwsLambdaResponseMapper::snapStart));
        node.set(
                "runtimeVersionConfig",
                object(function.runtimeVersionConfig(), AwsLambdaResponseMapper::runtimeVersionConfig));
        node.set("loggingConfig", object(function.loggingConfig(), AwsLambdaResponseMapper::loggingConfig));
        // The key's casing and its position as the last key are part of the response contract.
        node.put("kmskeyArn", function.kmsKeyArn());
        return node;
    }

    private static ObjectNode aliasConfiguration(AliasConfiguration alias) {
        ObjectNode node = NODES.objectNode();
        node.put("aliasArn", alias.aliasArn());
        node.put("name", alias.name());
        node.put("functionVersion", alias.functionVersion());
        node.put("description", alias.description());
        node.set("routingConfig", object(alias.routingConfig(), AwsLambdaResponseMapper::aliasRoutingConfiguration));
        node.put("revisionId", alias.revisionId());
        return node;
    }

    private static ObjectNode aliasRoutingConfiguration(AliasRoutingConfiguration routingConfig) {
        ObjectNode node = NODES.objectNode();
        ObjectNode weights = NODES.objectNode();
        Map<String, Double> additionalVersionWeights = routingConfig.additionalVersionWeights();
        if (additionalVersionWeights != null) {
            additionalVersionWeights.forEach(weights::put);
        }
        node.set("additionalVersionWeights", weights);
        return node;
    }

    private static ObjectNode vpcConfig(VpcConfigResponse vpcConfig) {
        ObjectNode node = NODES.objectNode();
        node.set("subnetIds", strings(vpcConfig.subnetIds()));
        node.set("securityGroupIds", strings(vpcConfig.securityGroupIds()));
        node.put("vpcId", vpcConfig.vpcId());
        node.put("ipv6AllowedForDualStack", vpcConfig.ipv6AllowedForDualStack());
        return node;
    }

    private static ObjectNode deadLetterConfig(DeadLetterConfig deadLetterConfig) {
        ObjectNode node = NODES.objectNode();
        node.put("targetArn", deadLetterConfig.targetArn());
        return node;
    }

    private static ObjectNode environment(EnvironmentResponse environment) {
        ObjectNode node = NODES.objectNode();
        ObjectNode variables = NODES.objectNode();
        Map<String, String> environmentVariables = environment.variables();
        if (environmentVariables != null) {
            environmentVariables.keySet().forEach(name -> variables.put(name, REDACTED_VALUE));
        }
        node.set("variables", variables);
        node.set("error", object(environment.error(), AwsLambdaResponseMapper::environmentError));
        return node;
    }

    private static ObjectNode environmentError(EnvironmentError error) {
        return errorNode(error.errorCode(), error.message());
    }

    private static ObjectNode tracingConfig(TracingConfigResponse tracingConfig) {
        ObjectNode node = NODES.objectNode();
        node.put("mode", tracingConfig.modeAsString());
        return node;
    }

    private static ObjectNode layer(Layer layer) {
        ObjectNode node = NODES.objectNode();
        node.put("arn", layer.arn());
        node.put("codeSize", layer.codeSize());
        node.put("signingProfileVersionArn", layer.signingProfileVersionArn());
        node.put("signingJobArn", layer.signingJobArn());
        return node;
    }

    private static ObjectNode fileSystemConfig(FileSystemConfig fileSystemConfig) {
        ObjectNode node = NODES.objectNode();
        node.put("arn", fileSystemConfig.arn());
        node.put("localMountPath", fileSystemConfig.localMountPath());
        return node;
    }

    private static ObjectNode imageConfigResponse(ImageConfigResponse imageConfigResponse) {
        ObjectNode node = NODES.objectNode();
        node.set("imageConfig", object(imageConfigResponse.imageConfig(), AwsLambdaResponseMapper::imageConfig));
        node.set("error", object(imageConfigResponse.error(), AwsLambdaResponseMapper::imageConfigError));
        return node;
    }

    private static ObjectNode imageConfig(ImageConfig imageConfig) {
        ObjectNode node = NODES.objectNode();
        node.set("entryPoint", strings(imageConfig.entryPoint()));
        node.set("command", strings(imageConfig.command()));
        node.put("workingDirectory", imageConfig.workingDirectory());
        return node;
    }

    private static ObjectNode imageConfigError(ImageConfigError error) {
        return errorNode(error.errorCode(), error.message());
    }

    private static ObjectNode ephemeralStorage(EphemeralStorage ephemeralStorage) {
        ObjectNode node = NODES.objectNode();
        node.put("size", ephemeralStorage.size());
        return node;
    }

    private static ObjectNode snapStart(SnapStartResponse snapStart) {
        ObjectNode node = NODES.objectNode();
        node.put("applyOn", snapStart.applyOnAsString());
        node.put("optimizationStatus", snapStart.optimizationStatusAsString());
        return node;
    }

    private static ObjectNode runtimeVersionConfig(RuntimeVersionConfig runtimeVersionConfig) {
        ObjectNode node = NODES.objectNode();
        node.put("runtimeVersionArn", runtimeVersionConfig.runtimeVersionArn());
        node.set("error", object(runtimeVersionConfig.error(), AwsLambdaResponseMapper::runtimeVersionError));
        return node;
    }

    private static ObjectNode runtimeVersionError(RuntimeVersionError error) {
        return errorNode(error.errorCode(), error.message());
    }

    private static ObjectNode loggingConfig(LoggingConfig loggingConfig) {
        ObjectNode node = NODES.objectNode();
        node.put("logFormat", loggingConfig.logFormatAsString());
        node.put("applicationLogLevel", loggingConfig.applicationLogLevelAsString());
        node.put("systemLogLevel", loggingConfig.systemLogLevelAsString());
        node.put("logGroup", loggingConfig.logGroup());
        return node;
    }

    private static ObjectNode errorNode(String errorCode, String message) {
        ObjectNode node = NODES.objectNode();
        node.put("errorCode", errorCode);
        node.put("message", message);
        return node;
    }

    /** Unset nested objects are emitted as JSON null. */
    private static <T> JsonNode object(T value, Function<T, ObjectNode> mapper) {
        return value == null ? NODES.nullNode() : mapper.apply(value);
    }

    /** Unset collections are emitted as an empty array, never null. */
    private static <T> ArrayNode array(List<T> values, Function<T, ObjectNode> mapper) {
        ArrayNode node = NODES.arrayNode();
        if (values != null) {
            values.forEach(value -> node.add(object(value, mapper)));
        }
        return node;
    }

    private static ArrayNode strings(List<String> values) {
        ArrayNode node = NODES.arrayNode();
        if (values != null) {
            values.forEach(node::add);
        }
        return node;
    }
}
