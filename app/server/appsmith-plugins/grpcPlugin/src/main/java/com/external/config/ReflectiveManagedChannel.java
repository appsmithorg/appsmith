package com.external.config;

import static com.appsmith.external.helpers.PluginUtils.getValueSafelyFromPropertyList;
import static io.grpc.Metadata.ASCII_STRING_MARSHALLER;
import static java.lang.String.format;

import com.appsmith.external.models.DatasourceConfiguration;
import com.appsmith.external.models.Property;
import com.appsmith.external.models.UploadedFile;
import com.google.common.collect.ImmutableList;
import com.google.protobuf.ByteString;
import com.google.protobuf.DescriptorProtos.FileDescriptorProto;
import com.google.protobuf.Descriptors;
import com.google.protobuf.Descriptors.FileDescriptor;
import com.google.protobuf.InvalidProtocolBufferException;
import io.grpc.*;
import io.grpc.netty.shaded.io.grpc.netty.NettyChannelBuilder;
import io.grpc.netty.shaded.io.grpc.netty.NettySslContextChannelCredentials;
import io.grpc.netty.shaded.io.netty.handler.ssl.SslContext;
import io.grpc.reflection.v1alpha.ErrorResponse;
import io.grpc.reflection.v1alpha.ServerReflectionGrpc;
import io.grpc.reflection.v1alpha.ServerReflectionRequest;
import io.grpc.reflection.v1alpha.ServerReflectionResponse;
import io.grpc.reflection.v1alpha.ServiceResponse;
import io.grpc.stub.MetadataUtils;
import io.grpc.stub.StreamObserver;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.collections.map.HashedMap;
import org.pf4j.util.StringUtils;

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.LinkedBlockingQueue;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicReference;
import java.util.stream.Collectors;

/**
 * This class wraps a GRPC connection to provide reflection functionalities to enable service/endpoint discovery.
 */
@Slf4j(topic = "ReflectiveManagedChannel")
public class ReflectiveManagedChannel extends ManagedChannel implements StreamObserver<ServerReflectionResponse> {
    private final int PROPERTY_INDEX_REFLECTION_TIMEOUT = 0;
    private final int PROPERTY_INDEX_TLS = 1;
    private final int PROPERTY_SELF_SIGNED_OR_CLIENT_CERT = 2;
    private final int PROPERTY_CA_CERT = 3;
    private final int PROPERTY_USE_CLIENT_CERT = 7;
    private final int PROPERTY_CLIENT_PRIVATE_KEY = 4;
    private final int PROPERTY_CLIENT_CERT_CHAIN = 5;
    private final int PROPERTY_AUTHORITY_OVERRIDE = 6;
    private static final int MAX_INBOUND_SIZE_IN_BYTE = 40 * 1024 * 1024;
    private static final List<String> IGNORED_SERVICES = List.of("grpc.reflection.v1alpha.ServerReflection", "grpc.health.v1.Health");
    private final ManagedChannel channel;
    private final DatasourceConfiguration datasourceConfiguration;
    private final StreamObserver<ServerReflectionRequest> sendStream;
    private final Channel channelWithHeaders;
    private LinkedBlockingQueue<ServerReflectionRequest> outstandingRequests;
    private CountDownLatch done;
    private Throwable error;

    private Map<String, FileDescriptorProto> fileDescriptorProtos;

    private boolean streamOpen;

    private AtomicReference<ImmutableList<GrpcEndpoint>> endpoints;

    public ReflectiveManagedChannel(DatasourceConfiguration datasourceConfiguration) throws IOException {
        log.info("Connecting to {}", datasourceConfiguration.getUrl());
        this.datasourceConfiguration = datasourceConfiguration;
        this.outstandingRequests = new LinkedBlockingQueue<>();
        this.fileDescriptorProtos = new ConcurrentHashMap<>();
        this.streamOpen = true;
        this.done = new CountDownLatch(1);
        this.channel = buildChannel(datasourceConfiguration);
        this.channelWithHeaders = decorateChannel(channel, datasourceConfiguration.getHeaders());
        this.sendStream = buildReflectionStub(datasourceConfiguration);
        this.sendStream.onNext(ServerReflectionRequest.newBuilder().setListServices("").build());

        List<GrpcEndpoint> grpcEndpoints = awaitCompletion();

        endpoints = new AtomicReference<>(ImmutableList.copyOf(grpcEndpoints));
    }
    private UploadedFile getUploadedFileFromPropertyList(List<Property> properties, String name, int index) {
        LinkedHashMap map = getValueSafelyFromPropertyList(properties, index, LinkedHashMap.class, null);
        if(map == null) {
            return null;
        }
        return new UploadedFile(name, (String) map.get("base64Content"));
    }

    ManagedChannel buildChannel(DatasourceConfiguration configuration) throws IOException {
        List<Property> properties = datasourceConfiguration.getProperties();
        boolean useTLS = getValueSafelyFromPropertyList(properties, PROPERTY_INDEX_TLS, Boolean.class, true);
        boolean useSelfSigned = getValueSafelyFromPropertyList(properties, PROPERTY_SELF_SIGNED_OR_CLIENT_CERT, Boolean.class, false);
        boolean useClientCert = getValueSafelyFromPropertyList(properties, PROPERTY_USE_CLIENT_CERT, Boolean.class, false);
        String authorityOverride = getValueSafelyFromPropertyList(properties, PROPERTY_AUTHORITY_OVERRIDE, String.class, null);

        ChannelCredentials credentials = null;
        if(useTLS && (useSelfSigned || useClientCert)) {
            TlsChannelCredentials.Builder tlsBuilder = TlsChannelCredentials.newBuilder();
            if (useSelfSigned) {
                UploadedFile caCert = getUploadedFileFromPropertyList(properties, "ca.pem", PROPERTY_CA_CERT);
                if (caCert != null) {
                    log.info("Trust CA Cert {}", new String(caCert.getDecodedContent()));
                    tlsBuilder.trustManager(new ByteArrayInputStream(caCert.getDecodedContent()));
                }
            }
            if(useClientCert) {
                UploadedFile privateKey = getUploadedFileFromPropertyList(properties, "private.key", PROPERTY_CLIENT_PRIVATE_KEY);
                UploadedFile certChain = getUploadedFileFromPropertyList(properties, "client.pem", PROPERTY_CLIENT_CERT_CHAIN);
                if (privateKey != null && certChain != null) {
                    log.info("Trust Private Key {}", new String(privateKey.getDecodedContent()));
                    log.info("Trust Cert Chain {}", new String(certChain.getDecodedContent()));
                    tlsBuilder.keyManager(new ByteArrayInputStream(certChain.getDecodedContent()), new ByteArrayInputStream(privateKey.getDecodedContent()));
                }
            }
            credentials = tlsBuilder.build();
        }
        NettyChannelBuilder builder = null;
        if(credentials != null){
            builder = NettyChannelBuilder.forTarget(configuration.getUrl(), credentials);
        } else {
            builder = NettyChannelBuilder.forTarget(configuration.getUrl());
        }
        builder.keepAliveTime(15, TimeUnit.SECONDS);
        builder.idleTimeout(200, TimeUnit.SECONDS);
        builder.keepAliveWithoutCalls(true);
        builder.maxInboundMessageSize(MAX_INBOUND_SIZE_IN_BYTE);
        if(useTLS && useClientCert && authorityOverride != null && !authorityOverride.equals("")) {
            log.info("overrideAuthority {}", authorityOverride);
            builder.overrideAuthority(authorityOverride);
        }
        if (!useTLS) {
            builder.usePlaintext();
        }
        return builder.build();
    }

    StreamObserver<ServerReflectionRequest> buildReflectionStub(DatasourceConfiguration configuration) {
        List<Property> properties = datasourceConfiguration.getProperties();
        int reflectionTimeout = Integer.parseInt(getValueSafelyFromPropertyList(properties, PROPERTY_INDEX_REFLECTION_TIMEOUT, String.class, "10"));

        return ServerReflectionGrpc.newStub(channelWithHeaders)
                .withDeadlineAfter(reflectionTimeout, TimeUnit.SECONDS)
                .serverReflectionInfo(this);
    }

    public static Channel decorateChannel(ManagedChannel connection, List<Property> headers) {
        Metadata metadata = new Metadata();
        if (headers == null || headers.size() == 0) {
            return connection;
        }
        headers.forEach(property -> {
            String key = property.getKey();
            String value = (String) property.getValue();
            if(key != null && value != null && key.length() > 0 && value.length() > 0) {
                metadata.put(Metadata.Key.of(key, ASCII_STRING_MARSHALLER), value);
            }
        });
        if(metadata.keys().size() == 0) {
            return connection;
        }
        return ClientInterceptors.intercept(connection, MetadataUtils.newAttachHeadersInterceptor(metadata));
    }

    public ImmutableList<GrpcEndpoint> getGrpcServices() {
        return endpoints.get();
    }

    public Set<String> getServices() {
        if(endpoints == null ) {
            return Set.of();
        }
        return endpoints.get().stream().map(endpoint -> endpoint.getMethod().getService().getFullName()).filter((name) -> !IGNORED_SERVICES.contains(name)).collect(Collectors.toSet());
    }

    public Set<String> getEndpoints(String service) {
        return endpoints.get().stream()
                .filter(endpoint -> endpoint.getMethod().getService().getFullName().equals(service))
                .map(endpoints -> endpoints.getMethod().getName()).collect(Collectors.toSet());
    }

    List<GrpcEndpoint> awaitCompletion() {
        try {
            done.await();
        } catch (InterruptedException e) {
            sendStream.onError(e);
            throw new RuntimeException(e);
        }
        if (error instanceof RuntimeException) {
            throw (RuntimeException) error;
        } else if (error != null) {
            throw new RuntimeException(error);
        }

        // Convert the flat list of FileDescriptorProtos we received to interlinked FileDescriptor POJOs
        Map<String, FileDescriptor> fileDescriptors = new HashMap<>();
        fileDescriptorProtos.values().forEach(proto -> makeFileDescriptorPojo(proto.getName(), fileDescriptorProtos, fileDescriptors));

        // Extract the methods declared in each FileDescriptor
        ArrayList<GrpcEndpoint> result = new ArrayList<>();
        for (FileDescriptor fd : fileDescriptors.values())
            for (var svc : fd.getServices())
                for (var method : svc.getMethods())
                    result.add(new GrpcEndpoint(method));

        // Free file descriptors so they don't leak
        fileDescriptors.clear();
        outstandingRequests.clear();

        return result;
    }

    void send(ServerReflectionRequest req) {
        if (outstandingRequests.add(req)) {
            log.info("Sending request {}", req);
            sendStream.onNext(req);
        }
    }

    @Override
    public ManagedChannel shutdown() {
        return channel.shutdown();
    }

    @Override
    public boolean isShutdown() {
        return channel.isShutdown();
    }

    @Override
    public boolean isTerminated() {
        return channel.isTerminated();
    }

    @Override
    public ManagedChannel shutdownNow() {
        return channel.shutdownNow();
    }

    @Override
    public boolean awaitTermination(long timeout, TimeUnit unit) throws InterruptedException {
        return channel.awaitTermination(timeout, unit);
    }

    @Override
    public <RequestT, ResponseT> ClientCall<RequestT, ResponseT> newCall(MethodDescriptor<RequestT, ResponseT> methodDescriptor, CallOptions callOptions) {
        return channelWithHeaders.newCall(methodDescriptor, callOptions);
    }

    @Override
    public String authority() {
        return channel.authority();
    }

    @Override
    public void onNext(ServerReflectionResponse response) {
        if (error != null) return;

        if (response.hasListServicesResponse()) {
            log.debug("ListServicesResponse {}", response.getListServicesResponse());
            // When we receive the initial list of services, launch new requests for the file descriptors of each
            response.getListServicesResponse().getServiceList().stream()
                    .map(ServiceResponse::getName)
                    .map(name -> ServerReflectionRequest.newBuilder().setFileContainingSymbol(name).build())
                    .forEach(this::send);
        } else if (response.hasFileDescriptorResponse()) {
            log.debug("FileDescriptorResponse {}", response.getFileDescriptorResponse());
            // If the GRPC reflection service echos the request in the response, match it up against the requests we sent.  Otherwise
            // assume the responses come back in order
            if (response.hasOriginalRequest()) {
                if (!outstandingRequests.remove(response.getOriginalRequest())) {
                    error = Status.INTERNAL
                            .withDescription(
                                    format("Can't find reflection response %s among outstanding requests %s", response, outstandingRequests))
                            .asRuntimeException();
                }
            } else if (outstandingRequests.size() >= 1) {
                ServerReflectionRequest req = outstandingRequests.poll();
            } else {
                error = Status.INTERNAL
                        .withDescription(format("More reflection responses than requests. %s", response))
                        .asRuntimeException();
            }

            if (error == null) {
                for (ByteString bytes : response.getFileDescriptorResponse().getFileDescriptorProtoList()) {
                    try {
                        FileDescriptorProto fd = FileDescriptorProto.parseFrom(bytes);
                        fileDescriptorProtos.put(fd.getName(), fd);

                        // Submit requests for any dependent descriptors that aren't already in the request queue
                        fd.getDependencyList().stream()
                                .map(dep -> ServerReflectionRequest.newBuilder().setFileByFilename(dep).build())
                                .forEach(this::send);

                    } catch (InvalidProtocolBufferException e) {
                        error = e;
                    }
                }
            }

        } else if (response.hasErrorResponse()) {
            ErrorResponse err = response.getErrorResponse();
            error = Status.fromCodeValue(err.getErrorCode()).withDescription(err.getErrorMessage()).asRuntimeException();

        } else {
            error = Status.INTERNAL.withDescription(format("Unexpected reflection response: %s", response)).asRuntimeException();
        }

        // If we've received responses to everything we asked for, or if responses surprised us, close the request stream.
        if ((outstandingRequests.isEmpty() || error != null) && streamOpen) {
            sendStream.onCompleted();
            streamOpen = false;
        }
    }

    @Override
    public void onError(Throwable serverError) {
        this.error = serverError;
        log.error("[ReflectiveManagedChannel] onCompleted", error);
        done.countDown();
    }

    @Override
    public void onCompleted() {
        log.info("[ReflectiveManagedChannel] onCompleted");
        done.countDown();
    }

    /**
     * Convert a FileDescriptorProto to a FileDescriptor pojo, which requires a recursive operation
     * to convert all its dependencies first.
     *
     * @param name name of the file descriptor
     * @param input map of name -> FileDescriptorProtos collected from reflection service
     * @param output map of name -> FileDescriptor caching results.  Running all the names through this method
     *                has the side effect of leaving this map fully populated.
     * @return a FileDescriptor with the given name, and other settings from the FileDescriptorProto
     */
    private static FileDescriptor makeFileDescriptorPojo(String name, Map<String, FileDescriptorProto> input, Map<String, FileDescriptor> output) {
        FileDescriptor fd = output.get(name);
        if (fd == null) {
            try {
                FileDescriptorProto proto = input.get(name);
                fd = FileDescriptor.buildFrom(proto, proto.getDependencyList().stream()
                        .map(dep -> makeFileDescriptorPojo(dep, input, output))
                        .toArray(FileDescriptor[]::new));
                output.put(name, fd);
            } catch (Descriptors.DescriptorValidationException e) {
                throw new RuntimeException(e);
            }
        }
        return fd;
    }
}
