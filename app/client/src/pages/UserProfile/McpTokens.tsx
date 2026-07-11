import React, { useCallback, useEffect, useState } from "react";
import {
  Button,
  Input,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  Text,
  toast,
} from "@appsmith/ads";
import {
  COPY_MCP_TOKEN,
  CREATE_MCP_TOKEN,
  MCP_TOKEN_COPIED,
  MCP_TOKEN_COPY_FAILED,
  MCP_TOKEN_CREATE_FAILED,
  MCP_TOKEN_CREATED,
  MCP_TOKEN_CREATED_AT,
  MCP_TOKEN_EXPIRES_AT,
  MCP_TOKEN_CREATED_DESCRIPTION,
  MCP_TOKEN_VALUE_LABEL,
  MCP_TOKEN_REVOKE_FAILED,
  MCP_TOKEN_REVOKED,
  MCP_TOKENS,
  MCP_TOKENS_DESCRIPTION,
  MCP_TOKENS_EMPTY,
  MCP_TOKENS_LOAD_FAILED,
  MCP_TOKENS_LOADING,
  CANCEL,
  REVOKE_MCP_TOKEN,
  REVOKE_MCP_TOKEN_CONFIRM,
  REVOKE_MCP_TOKEN_CONFIRMATION,
  createMessage,
} from "ee/constants/messages";
import McpTokenApi, {
  type CreatedMcpToken,
  type McpTokenMetadata,
} from "api/McpTokenApi";
import type { ApiResponse } from "api/ApiResponses";
import styled from "styled-components";
import { Wrapper } from "./StyledComponents";

const TokensWrapper = styled(Wrapper)`
  width: 640px;
  max-width: 100%;
`;

const getErrorMessage = (error: unknown, fallback: string) => {
  const response = error as Partial<ApiResponse> & { message?: string };

  return response.responseMeta?.error?.message || response.message || fallback;
};

const ensureSuccess = <T,>(response: ApiResponse<T>) => {
  if (!response.responseMeta?.success) {
    throw response;
  }

  return response.data;
};

const formatCreatedAt = (createdAt: string) => {
  const date = new Date(createdAt);

  return Number.isNaN(date.getTime()) ? createdAt : date.toLocaleString();
};

function McpTokens() {
  const [tokens, setTokens] = useState<McpTokenMetadata[]>([]);
  const [createdToken, setCreatedToken] = useState<CreatedMcpToken | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [revokeTokenId, setRevokeTokenId] = useState<string | null>(null);
  const [isRevoking, setIsRevoking] = useState(false);

  const loadTokens = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await McpTokenApi.list();

      setTokens(response.map(ensureSuccess));
    } catch (error) {
      setError(getErrorMessage(error, createMessage(MCP_TOKENS_LOAD_FAILED)));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTokens();
  }, [loadTokens]);

  const createToken = async () => {
    setIsCreating(true);
    setError(null);

    try {
      const response = await McpTokenApi.create();
      const token = ensureSuccess(response);

      setCreatedToken(token);
      setTokens((tokens) => [
        {
          id: token.id,
          createdAt: token.createdAt,
          expiresAt: token.expiresAt,
        },
        ...tokens,
      ]);
    } catch (error) {
      setError(getErrorMessage(error, createMessage(MCP_TOKEN_CREATE_FAILED)));
    } finally {
      setIsCreating(false);
    }
  };

  const copyCreatedToken = async () => {
    if (!createdToken) {
      return;
    }

    try {
      await navigator.clipboard.writeText(createdToken.token);
      toast.show(createMessage(MCP_TOKEN_COPIED), { kind: "success" });
    } catch {
      toast.show(createMessage(MCP_TOKEN_COPY_FAILED), { kind: "error" });
    }
  };

  const revokeToken = async () => {
    if (!revokeTokenId) {
      return;
    }

    setIsRevoking(true);
    setError(null);

    try {
      ensureSuccess(await McpTokenApi.revoke(revokeTokenId));
      setTokens((tokens) =>
        tokens.filter((token) => token.id !== revokeTokenId),
      );
      setRevokeTokenId(null);
      toast.show(createMessage(MCP_TOKEN_REVOKED), { kind: "success" });
    } catch (error) {
      setRevokeTokenId(null);
      setError(getErrorMessage(error, createMessage(MCP_TOKEN_REVOKE_FAILED)));
    } finally {
      setIsRevoking(false);
    }
  };

  return (
    <>
      <TokensWrapper>
        <Text kind="body-m">{createMessage(MCP_TOKENS_DESCRIPTION)}</Text>
        {error && (
          <Text aria-atomic="true" kind="body-m" role="alert">
            {error}
          </Text>
        )}
        <div>
          <Button isLoading={isCreating} onClick={createToken} size="md">
            {createMessage(CREATE_MCP_TOKEN)}
          </Button>
        </div>
        {isLoading ? (
          <Text aria-live="polite" kind="body-m" role="status">
            {createMessage(MCP_TOKENS_LOADING)}
          </Text>
        ) : tokens.length === 0 ? (
          <Text kind="body-m">{createMessage(MCP_TOKENS_EMPTY)}</Text>
        ) : (
          <div aria-label={createMessage(MCP_TOKENS)} role="list">
            {tokens.map((token) => (
              <div key={token.id} role="listitem">
                <Text kind="body-m">{token.id}</Text>
                <Text kind="body-s">
                  {createMessage(MCP_TOKEN_CREATED_AT)}:{" "}
                  {formatCreatedAt(token.createdAt)}
                </Text>
                <Text kind="body-s">
                  {createMessage(MCP_TOKEN_EXPIRES_AT)}:{" "}
                  {formatCreatedAt(token.expiresAt)}
                </Text>
                <Button
                  aria-label={`${createMessage(REVOKE_MCP_TOKEN)} ${token.id}`}
                  isDisabled={isRevoking}
                  kind="secondary"
                  onClick={() => setRevokeTokenId(token.id)}
                  size="sm"
                >
                  {createMessage(REVOKE_MCP_TOKEN)}
                </Button>
              </div>
            ))}
          </div>
        )}
      </TokensWrapper>

      <Modal
        onOpenChange={(open) => {
          if (!open) {
            setCreatedToken(null);
          }
        }}
        open={Boolean(createdToken)}
      >
        <ModalContent style={{ width: "640px" }}>
          <ModalHeader>{createMessage(MCP_TOKEN_CREATED)}</ModalHeader>
          <ModalBody>
            <Text kind="body-m">
              {createMessage(MCP_TOKEN_CREATED_DESCRIPTION)}
            </Text>
            <Input
              UNSAFE_width="100%"
              isReadOnly
              label={createMessage(MCP_TOKEN_VALUE_LABEL)}
              style={{
                fontFamily:
                  "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
              }}
              value={createdToken?.token ?? ""}
            />
            <Text kind="body-s">
              {createMessage(MCP_TOKEN_EXPIRES_AT)}:{" "}
              {formatCreatedAt(createdToken?.expiresAt ?? "")}
            </Text>
            <Button onClick={copyCreatedToken} size="md">
              {createMessage(COPY_MCP_TOKEN)}
            </Button>
          </ModalBody>
        </ModalContent>
      </Modal>

      <Modal
        onOpenChange={(open) => {
          if (!open) {
            setRevokeTokenId(null);
          }
        }}
        open={Boolean(revokeTokenId)}
      >
        <ModalContent style={{ width: "480px" }}>
          <ModalHeader>{createMessage(REVOKE_MCP_TOKEN)}</ModalHeader>
          <ModalBody>
            <Text kind="body-m">
              {createMessage(REVOKE_MCP_TOKEN_CONFIRMATION)}
            </Text>
            <ModalFooter>
              <Button
                isDisabled={isRevoking}
                kind="secondary"
                onClick={() => setRevokeTokenId(null)}
                size="md"
              >
                {createMessage(CANCEL)}
              </Button>
              <Button
                isLoading={isRevoking}
                kind="error"
                onClick={revokeToken}
                size="md"
              >
                {createMessage(REVOKE_MCP_TOKEN_CONFIRM)}
              </Button>
            </ModalFooter>
          </ModalBody>
        </ModalContent>
      </Modal>
    </>
  );
}

export default McpTokens;
