package com.external.config;

import com.appsmith.external.exceptions.pluginExceptions.AppsmithPluginError;
import com.appsmith.external.models.ActionExecutionRequest;
import com.appsmith.external.models.ActionExecutionResult;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.google.protobuf.*;
import com.google.protobuf.util.JsonFormat;
import io.grpc.CallOptions;
import io.grpc.Channel;
import io.grpc.ClientCall;
import io.grpc.Metadata;
import io.grpc.stub.ClientCalls;
import io.grpc.stub.StreamObserver;
import lombok.AllArgsConstructor;
import lombok.Getter;

import com.google.protobuf.Descriptors.Descriptor;
import io.grpc.MethodDescriptor.Marshaller;
import lombok.extern.slf4j.Slf4j;
import reactor.core.publisher.Mono;

import java.io.IOException;
import java.io.InputStream;
import java.util.ArrayList;
import java.util.Iterator;
import java.util.List;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.TimeUnit;

import static io.grpc.MethodDescriptor.MethodType.BIDI_STREAMING;
import static io.grpc.MethodDescriptor.MethodType.CLIENT_STREAMING;
import static io.grpc.MethodDescriptor.MethodType.SERVER_STREAMING;
import static io.grpc.MethodDescriptor.MethodType.UNARY;

@Slf4j
@Getter
@AllArgsConstructor
public class GrpcEndpoint {
    Descriptors.MethodDescriptor method;

    private final io.grpc.MethodDescriptor<DynamicMessage, DynamicMessage> gMethodDescriptor;

    public GrpcEndpoint(Descriptors.MethodDescriptor method) {
        this.method = method;

        boolean clientStreaming = method.toProto().getClientStreaming();
        boolean serverStreaming = method.toProto().getServerStreaming();

        this.gMethodDescriptor = io.grpc.MethodDescriptor.<DynamicMessage, DynamicMessage>newBuilder()
                .setType(clientStreaming ? (serverStreaming ? BIDI_STREAMING : CLIENT_STREAMING)
                        : serverStreaming ? SERVER_STREAMING : UNARY)
                .setFullMethodName(io.grpc.MethodDescriptor.generateFullMethodName(method.getService().getFullName(),
                        method.getName()))
                .setRequestMarshaller(new DynamicMessageMarshaller(method.getInputType()))
                .setResponseMarshaller(new DynamicMessageMarshaller(method.getOutputType()))
                .build();
    }

    public Mono<ActionExecutionResult> call(Channel channel, DynamicMessage message, CallOptions callOptions, ObjectMapper objectMapper) {
        ClientCall<DynamicMessage, DynamicMessage> clientCall = channel.newCall(gMethodDescriptor, callOptions);

        boolean clientStreaming = method.toProto().getClientStreaming();
        boolean serverStreaming = method.toProto().getServerStreaming();

        ResponseStream responseStream = new ResponseStream();

        if (clientStreaming) {
            StreamObserver<DynamicMessage> requestStream = serverStreaming
                    ? ClientCalls.asyncBidiStreamingCall(clientCall, responseStream)
                    : ClientCalls.asyncClientStreamingCall(clientCall, responseStream);

            log.debug("Sending args ", message);
            requestStream.onNext(message);

            requestStream.onCompleted();
        } else if (serverStreaming) {
            ClientCalls.asyncServerStreamingCall(clientCall, message, responseStream);
        } else {
            ClientCalls.asyncUnaryCall(clientCall, message, responseStream);
        }

        return responseStream.handle().map((protoTree) -> {
            ActionExecutionResult result = new ActionExecutionResult();
            String bodyString;
            try {
                if(serverStreaming) {
                    List<String> responses = new ArrayList<>();
                    for (DynamicMessage m : protoTree) {
                        responses.add(JsonFormat.printer().print(m));
                    }
                    bodyString = "["+String.join(",", responses)+"]";
                } else {
                    bodyString = JsonFormat.printer().print(protoTree.get(0));
                }
                result.setBody(objectMapper.readTree(bodyString));
            } catch (JsonProcessingException | InvalidProtocolBufferException e) {
                throw new RuntimeException(e);
            }
            result.setIsExecutionSuccess(true);
            result.setStatusCode("200");
            return result;
        }).onErrorResume((error) -> {
            log.error("Error", error);
            ActionExecutionResult result = new ActionExecutionResult();
            result.setErrorInfo(error);
            result.setIsExecutionSuccess(false);
            result.setStatusCode(AppsmithPluginError.PLUGIN_ERROR.getAppErrorCode().toString());
            return Mono.just(result);
        });
    }

    private static  class DynamicMessageMarshaller implements Marshaller<DynamicMessage> {
        private final Descriptor messageDescriptor;

        public DynamicMessageMarshaller(Descriptor messageDescriptor) {
            this.messageDescriptor = messageDescriptor;
        }

        @Override
        public DynamicMessage parse(InputStream inputStream) {
            try {
                return DynamicMessage.newBuilder(messageDescriptor)
                        .mergeFrom(inputStream, ExtensionRegistryLite.getEmptyRegistry())
                        .build();
            } catch (IOException e) {
                throw new RuntimeException("Unable to merge from the supplied input stream", e);
            }
        }

        @Override
        public InputStream stream(DynamicMessage abstractMessage) {
            return abstractMessage.toByteString().newInput();
        }
    }
    @Slf4j
    static private class ResponseStream implements StreamObserver<DynamicMessage> {
        List<DynamicMessage> list = new ArrayList<>();

        Throwable error;

        CountDownLatch done = new CountDownLatch(1);

        @Override public void onNext(DynamicMessage value) {
            log.trace("Received {}", value);
            list.add(value);
        }

        @Override public void onError(Throwable t) {
            log.trace("Error {}", t);
            error = t;
            done.countDown();
        }

        @Override public void onCompleted() {
            log.trace("Completed {}", list);
            done.countDown();
        }

        Mono<List<DynamicMessage>> handle() {
            return Mono.fromCallable(() -> {
                done.await();
                if(error instanceof RuntimeException) {
                    throw (RuntimeException) error;
                }
                if(error != null){
                    throw new RuntimeException(error);
                }
                return list;
            });
        }
    }
    static private class HeaderCapture extends ClientCall.Listener {
        private Metadata headers;

        public void onHeaders(Metadata headers) {
            this.headers = headers;
        }
    }
}
