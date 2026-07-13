import React, { useCallback, useEffect, useState } from "react";
import {
  Button,
  Flex,
  Input,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  Text,
  Tooltip,
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
  MCP_TOKEN_ROTATE_FAILED,
  MCP_TOKEN_ROTATED,
  MCP_TOKENS,
  MCP_TOKENS_DESCRIPTION,
  MCP_TOKENS_EMPTY,
  MCP_TOKENS_LOAD_FAILED,
  MCP_TOKENS_LOADING,
  CANCEL,
  REVOKE_MCP_TOKEN,
  REVOKE_MCP_TOKEN_CONFIRM,
  REVOKE_MCP_TOKEN_CONFIRMATION,
  ROTATE_MCP_TOKEN,
  ROTATE_MCP_TOKEN_CONFIRM,
  ROTATE_MCP_TOKEN_CONFIRMATION,
  createMessage,
} from "ee/constants/messages";
import McpTokenApi, {
  type CreatedMcpToken,
  type McpTokenMetadata,
} from "api/McpTokenApi";
import type { ApiResponse } from "api/ApiResponses";
import styled from "styled-components";

const TokensWrapper = styled.div`
  width: 640px;
  max-width: 100%;
  & > div {
    margin-bottom: 16px;
  }
`;

const TokenRow = styled.div`
  display: flex;
  align-items: center;
  gap: var(--ads-v2-spaces-4);
  padding: var(--ads-v2-spaces-4) 0;
  border-bottom: 1px solid var(--ads-v2-color-border);
`;

const TokenMeta = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--ads-v2-spaces-1);
  flex: 1;
  min-width: 0;
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

// Timestamps arrive as epoch seconds (Jackson's Instant serialization). Detect and normalize to milliseconds so
// they don't render as 1970; ISO strings pass through unchanged.
const formatTimestamp = (value: string | number) => {
  const numeric = typeof value === "number" ? value : Number(value);
  let date: Date;

  if (!Number.isNaN(numeric) && String(value).trim() !== "") {
    // Values below ~year 2286 in ms are actually seconds; scale them up.
    date = new Date(numeric < 1e12 ? numeric * 1000 : numeric);
  } else {
    date = new Date(value);
  }

  return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleString();
};

function McpTokens() {
  const [tokens, setTokens] = useState<McpTokenMetadata[]>([]);
  const [createdToken, setCreatedToken] = useState<CreatedMcpToken | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [rotateTokenId, setRotateTokenId] = useState<string | null>(null);
  const [isRotating, setIsRotating] = useState(false);
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

  const rotateToken = async () => {
    if (!rotateTokenId) {
      return;
    }

    setIsRotating(true);
    setError(null);

    try {
      const token = ensureSuccess(await McpTokenApi.rotate(rotateTokenId));

      setCreatedToken(token);
      setTokens((tokens) =>
        tokens.map((existing) =>
          existing.id === token.id
            ? {
                id: token.id,
                createdAt: token.createdAt,
                expiresAt: token.expiresAt,
              }
            : existing,
        ),
      );
      setRotateTokenId(null);
      toast.show(createMessage(MCP_TOKEN_ROTATED), { kind: "success" });
    } catch (error) {
      setRotateTokenId(null);
      setError(getErrorMessage(error, createMessage(MCP_TOKEN_ROTATE_FAILED)));
    } finally {
      setIsRotating(false);
    }
  };

  return (
    <>
      <TokensWrapper>
        <Flex alignItems="center" gap="spaces-4" justifyContent="space-between">
          <Text kind="body-m">{createMessage(MCP_TOKENS_DESCRIPTION)}</Text>
          <Button
            className="t--create-mcp-token"
            isLoading={isCreating}
            onClick={createToken}
            size="md"
            startIcon="plus"
          >
            {createMessage(CREATE_MCP_TOKEN)}
          </Button>
        </Flex>
        {error && (
          <Text aria-atomic="true" kind="body-m" role="alert">
            {error}
          </Text>
        )}
        {isLoading ? (
          <Text aria-live="polite" kind="body-m" role="status">
            {createMessage(MCP_TOKENS_LOADING)}
          </Text>
        ) : tokens.length === 0 ? (
          <Text kind="body-m">{createMessage(MCP_TOKENS_EMPTY)}</Text>
        ) : (
          <div aria-label={createMessage(MCP_TOKENS)} role="list">
            {tokens.map((token) => (
              <TokenRow key={token.id} role="listitem">
                <TokenMeta>
                  <Text kind="body-m">{token.id}</Text>
                  <Text color="var(--ads-v2-color-fg-muted)" kind="body-s">
                    {createMessage(MCP_TOKEN_CREATED_AT)}:{" "}
                    {formatTimestamp(token.createdAt)} ·{" "}
                    {createMessage(MCP_TOKEN_EXPIRES_AT)}:{" "}
                    {formatTimestamp(token.expiresAt)}
                  </Text>
                </TokenMeta>
                <Button
                  aria-label={`${createMessage(ROTATE_MCP_TOKEN)} ${token.id}`}
                  isDisabled={isRevoking || isRotating}
                  kind="secondary"
                  onClick={() => setRotateTokenId(token.id)}
                  size="sm"
                >
                  {createMessage(ROTATE_MCP_TOKEN)}
                </Button>
                <Button
                  aria-label={`${createMessage(REVOKE_MCP_TOKEN)} ${token.id}`}
                  isDisabled={isRevoking || isRotating}
                  kind="error"
                  onClick={() => setRevokeTokenId(token.id)}
                  size="sm"
                >
                  {createMessage(REVOKE_MCP_TOKEN)}
                </Button>
              </TokenRow>
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
            <Flex alignItems="flex-end" gap="spaces-2" width="100%">
              <Flex flex="1" minWidth="0">
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
              </Flex>
              <Tooltip content={createMessage(COPY_MCP_TOKEN)}>
                <Button
                  aria-label={createMessage(COPY_MCP_TOKEN)}
                  className="t--copy-mcp-token-icon"
                  isIconButton
                  kind="tertiary"
                  onClick={copyCreatedToken}
                  size="md"
                  startIcon="copy-control"
                />
              </Tooltip>
            </Flex>
            <Text color="var(--ads-v2-color-fg-muted)" kind="body-s">
              {createMessage(MCP_TOKEN_EXPIRES_AT)}:{" "}
              {formatTimestamp(createdToken?.expiresAt ?? "")}
            </Text>
          </ModalBody>
        </ModalContent>
      </Modal>

      <Modal
        onOpenChange={(open) => {
          if (!open) {
            setRotateTokenId(null);
          }
        }}
        open={Boolean(rotateTokenId)}
      >
        <ModalContent style={{ width: "480px" }}>
          <ModalHeader>{createMessage(ROTATE_MCP_TOKEN)}</ModalHeader>
          <ModalBody>
            <Text kind="body-m">
              {createMessage(ROTATE_MCP_TOKEN_CONFIRMATION)}
            </Text>
            <ModalFooter>
              <Button
                isDisabled={isRotating}
                kind="secondary"
                onClick={() => setRotateTokenId(null)}
                size="md"
              >
                {createMessage(CANCEL)}
              </Button>
              <Button isLoading={isRotating} onClick={rotateToken} size="md">
                {createMessage(ROTATE_MCP_TOKEN_CONFIRM)}
              </Button>
            </ModalFooter>
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
