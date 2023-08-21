package com.external.plugins;

import com.google.protobuf.*;
import com.google.protobuf.util.JsonFormat;
import io.grpc.CallOptions;
import io.grpc.Channel;
import io.grpc.MethodDescriptor;
import io.grpc.protobuf.ProtoUtils;
import io.grpc.stub.ClientCalls;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.SneakyThrows;

import java.util.*;
import java.util.stream.Collectors;

class GrpcService {

    private DescriptorProtos.FileDescriptorProto fileDescriptorProto;
    private DescriptorProtos.ServiceDescriptorProto serviceDescriptorProto;
    private Map<String, DescriptorProtos.FileDescriptorProto> allFileDescriptorProtosByPath;
    private Descriptors.FileDescriptor fileDescriptor;
    private Descriptors.ServiceDescriptor serviceDescriptor;
    private Map<String, GrpcMethod> methodDescriptorsByFullMethodName;
    private JsonFormat.Parser parser;
    private JsonFormat.Printer printer;


    @Getter(AccessLevel.MODULE)
    final private GrpcTarget target;
    private GrpcService(DescriptorProtos.FileDescriptorProto fileDescriptorProto,
                        DescriptorProtos.ServiceDescriptorProto serviceDescriptorProto,
                        Map<String, DescriptorProtos.FileDescriptorProto> allFileDescriptorProtosByPath,
                        Descriptors.FileDescriptor fileDescriptor,
                        Descriptors.ServiceDescriptor serviceDescriptor,
                        Map<String, GrpcMethod> methodDescriptorsByFullMethodName,
                        JsonFormat.Parser parser,
                        JsonFormat.Printer printer,
                        GrpcTarget target
    ) {
        this.fileDescriptorProto = Objects.requireNonNull(fileDescriptorProto);
        this.serviceDescriptorProto = Objects.requireNonNull(serviceDescriptorProto);
        this.allFileDescriptorProtosByPath = Objects.requireNonNull(allFileDescriptorProtosByPath);
        this.fileDescriptor = Objects.requireNonNull(fileDescriptor);
        this.serviceDescriptor = Objects.requireNonNull(serviceDescriptor);
        this.methodDescriptorsByFullMethodName = Objects.requireNonNull(methodDescriptorsByFullMethodName);
        this.parser = Objects.requireNonNull(parser);
        this.printer = Objects.requireNonNull(printer);
        this.target = target;
    }

    /**
     */

    /**
     * This method takes descriptors and builds a service instance that is ready to use.
     * It processes all the methods of the service and constructs GrpcMethod instances.
     *
     * @param fileDescriptorProto           a descriptor for proto file that contains a service definition
     * @param serviceDescriptorProto        a descriptor for the service definition inside the proto file
     * @param allFileDescriptorProtosByPath all proto files mapped by their path, required for getting dependencies of a service
     * @param serviceURLsByPackagePrefixes  This is a mapping of service urls by the service full names which are prefixed with the package of the proto file
     * @return a GrpcService instance ready to make calls.
     */
    public static GrpcService buildFrom(DescriptorProtos.FileDescriptorProto fileDescriptorProto,
                                        DescriptorProtos.ServiceDescriptorProto serviceDescriptorProto,
                                        Map<String, DescriptorProtos.FileDescriptorProto> allFileDescriptorProtosByPath,
                                        Map<String, String> serviceURLsByPackagePrefixes
    ) {

        Descriptors.FileDescriptor[] dependencies = getDependencies(fileDescriptorProto, allFileDescriptorProtosByPath);
        Descriptors.FileDescriptor fileDescriptor = toFileDescriptor(fileDescriptorProto, dependencies);
        Descriptors.ServiceDescriptor serviceDescriptor = fileDescriptor.findServiceByName(serviceDescriptorProto.getName());

        GrpcTarget target = GrpcTarget.buildFrom(serviceDescriptor, serviceURLsByPackagePrefixes);

        Map<String, GrpcMethod> methodsByFullMethodName = new HashMap<>();
        serviceDescriptorProto
                .getMethodList()
                .stream()
                .map(DescriptorProtos.MethodDescriptorProto::getName)
                .forEach(methodName -> {
                    Descriptors.MethodDescriptor methodDescriptor = serviceDescriptor.findMethodByName(methodName);
                    GrpcMethod method = new GrpcMethod(serviceDescriptor.getFullName(), methodDescriptor);

                    methodsByFullMethodName.put(methodDescriptor.getFullName(), method);
                });

        TypeRegistry registry = TypeRegistry.newBuilder().add(fileDescriptor.getMessageTypes()).build();
        JsonFormat.Parser parser = JsonFormat.parser().usingTypeRegistry(registry);
        JsonFormat.Printer printer = JsonFormat.printer().usingTypeRegistry(registry).preservingProtoFieldNames();

        return new GrpcService(
                fileDescriptorProto,
                serviceDescriptorProto,
                allFileDescriptorProtosByPath,
                fileDescriptor,
                serviceDescriptor,
                methodsByFullMethodName,
                parser,
                printer,
                target
        );
    }

    public List<String> getServiceMethodFullNames() {
        return new ArrayList<>(this.methodDescriptorsByFullMethodName.keySet());
    }

    @SneakyThrows
    public List<String> executeCall(Channel channel, String methodFullName, String requestContent) {
        GrpcMethod method = this.methodDescriptorsByFullMethodName.get(methodFullName);
        DynamicMessage.Builder messageBuilder = DynamicMessage.newBuilder(method.getDescriptor().getInputType());
        this.parser.merge(requestContent, messageBuilder);
        DynamicMessage requestMessage = messageBuilder.build();

        // todo handle multiple requests etc.
        List<DynamicMessage> responses = method.call(channel, List.of(requestMessage));

        List<String> result = new ArrayList<>();
        responses.forEach(response -> {
            try {
                String responseContent = this.printer.print(response);
                result.add(responseContent);

            } catch (InvalidProtocolBufferException e) {
                throw new RuntimeException(e);
            }
        });
        return result;
    }

    private static Descriptors.FileDescriptor[] getDependencies(
            DescriptorProtos.FileDescriptorProto proto, Map<String,
            DescriptorProtos.FileDescriptorProto> finalDescriptorProtoMap) {
        return proto
                .getDependencyList()
                .stream()
                .map(finalDescriptorProtoMap::get)
                .map(f -> toFileDescriptor(f, getDependencies(f, finalDescriptorProtoMap)))
                .toArray(Descriptors.FileDescriptor[]::new);
    }

    @SneakyThrows
    private static Descriptors.FileDescriptor toFileDescriptor(DescriptorProtos.FileDescriptorProto fileDescriptorProto, Descriptors.FileDescriptor[] dependencies) {
        return Descriptors.FileDescriptor.buildFrom(fileDescriptorProto, dependencies);
    }

    static class GrpcTarget {
        @Getter(AccessLevel.MODULE)
        final private String url;

        GrpcTarget(String url) {
            this.url = url;
        }

        public static GrpcTarget buildFrom(Descriptors.ServiceDescriptor serviceDescriptor,
                                           Map<String, String> serviceURLsByPackagePrefixes) {

            List<String[]> candidateURLs = serviceURLsByPackagePrefixes.keySet()
                    .stream()
                    .filter(prefix -> serviceDescriptor.getFullName().startsWith(prefix))
                    .map(url -> url.split("\\."))
                    .sorted((key1, key2) -> {
                        assert key1.length != key2.length; // two packages have the same specificity, programmer error
                        return Integer.compare(key1.length, key2.length);
                    }).collect(Collectors.toList());

            if (candidateURLs.isEmpty()) {
                return null;
            }

            String backendURLKey = String.join(".", candidateURLs.get(candidateURLs.size() - 1));
            return new GrpcTarget(serviceURLsByPackagePrefixes.get(backendURLKey));
        }

    }

    private static class GrpcMethod {
        private final String fullMethodName;
        @Getter(AccessLevel.PRIVATE)
        private final Descriptors.MethodDescriptor descriptor;
        private final MethodDescriptor.MethodType type;
        private final MethodDescriptor<DynamicMessage, DynamicMessage> callMethodDescriptor;

        public GrpcMethod(String serviceFullName, Descriptors.MethodDescriptor descriptor) {
            this.fullMethodName = serviceFullName + "/" + descriptor.getName();
            this.descriptor = descriptor;
            MethodDescriptor.Marshaller<DynamicMessage> inputTypeMarshaller = ProtoUtils.marshaller(DynamicMessage.newBuilder(descriptor.getInputType()).buildPartial());
            MethodDescriptor.Marshaller<DynamicMessage> outputTypeMarshaller = ProtoUtils.marshaller(DynamicMessage.newBuilder(descriptor.getOutputType()).buildPartial());
            this.type = getMethodTypeFromDesc(descriptor);
            this.callMethodDescriptor = MethodDescriptor.<DynamicMessage, DynamicMessage>newBuilder()
                    .setType(type)
                    .setFullMethodName(fullMethodName)
                    .setRequestMarshaller(inputTypeMarshaller)
                    .setResponseMarshaller(outputTypeMarshaller)
                    .build();
        }

        private List<DynamicMessage> call(Channel channel, List<DynamicMessage> messages) {
            List<DynamicMessage> responses = new ArrayList<>();

            if (this.type.clientSendsOneMessage() && messages.isEmpty()) {
                // todo decide on this
                return responses;
            }

            if (this.type == MethodDescriptor.MethodType.UNARY && !messages.isEmpty()) {
                DynamicMessage requestMessage = messages.get(0);
                responses.add(ClientCalls
                        .blockingUnaryCall(channel, this.callMethodDescriptor, CallOptions.DEFAULT, requestMessage));

            } else if (this.type == MethodDescriptor.MethodType.SERVER_STREAMING && messages.size() == 1) {
                DynamicMessage requestMessage = messages.get(0);
                ClientCalls
                        .blockingServerStreamingCall(channel, this.callMethodDescriptor, CallOptions.DEFAULT, requestMessage)
                        .forEachRemaining(responses::add);
            }
            return responses;
        }

        private static MethodDescriptor.MethodType getMethodTypeFromDesc(
                Descriptors.MethodDescriptor methodDesc
        ) {
            if (!methodDesc.isServerStreaming()
                    && !methodDesc.isClientStreaming()) {
                return MethodDescriptor.MethodType.UNARY;
            } else if (methodDesc.isServerStreaming()
                    && !methodDesc.isClientStreaming()) {
                return MethodDescriptor.MethodType.SERVER_STREAMING;
            } else if (!methodDesc.isServerStreaming()) {
                return MethodDescriptor.MethodType.CLIENT_STREAMING;
            } else {
                return MethodDescriptor.MethodType.BIDI_STREAMING;
            }
        }
    }
}
