import React, { useCallback, useEffect, useState } from "react";
import {
  Button,
  Callout,
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
  COPY_MCP_CLIENT_CONFIG,
  COPY_MCP_SERVER_URL,
  COPY_MCP_TOKEN,
  CREATE_MCP_TOKEN,
  MCP_CLIENT_CONFIG_COPIED,
  MCP_CLIENT_CONFIG_COPY_FAILED,
  MCP_CLIENT_CONFIG_HELP,
  MCP_CLIENT_CONFIG_LABEL,
  MCP_SERVER_URL_COPIED,
  MCP_SERVER_URL_COPY_FAILED,
  MCP_SERVER_URL_HELP,
  MCP_SERVER_URL_LABEL,
  MCP_TOKEN_COPIED,
  MCP_TOKEN_COPY_FAILED,
  MCP_TOKEN_CREATE_FAILED,
  MCP_TOKEN_CREATED,
  MCP_TOKEN_CREATED_AT,
  MCP_TOKEN_EXPIRES_AT,
  MCP_TOKEN_CREATED_DESCRIPTION,
  MCP_TOKEN_CREATED_DISMISS_WARNING,
  MCP_TOKEN_CREATED_DONE,
  MCP_TOKEN_VALUE_LABEL,
  MCP_TOKEN_REVOKE_FAILED,
  MCP_TOKEN_REVOKED,
  MCP_TOKEN_ROTATE_FAILED,
  MCP_TOKEN_ROTATED,
  MCP_TOKEN_ROTATED_TITLE,
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
  MCP_TOKEN_NAME_LABEL,
  MCP_TOKEN_NAME_PLACEHOLDER,
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

// The MCP server endpoint for this deployment. The /mcp route is served from the app origin (via Caddy), so the URL
// a user pastes into their MCP client is simply the current origin + /mcp.
const MCP_SERVER_URL = `${window.location.origin}/mcp`;

// Mirrors MAX_TOKEN_NAME_LENGTH in UserMcpTokenServiceCEImpl. Enforced here too so an over-long name is
// prevented at the keyboard rather than rejected by the server after a round trip.
const MAX_MCP_TOKEN_NAME_LENGTH = 50;

// A ready-to-paste MCP client configuration (the common `mcpServers` shape used by Claude Desktop and compatible
// clients): the server URL plus this token as a bearer credential. Rendered once, in the token-created modal.
const buildClientConfig = (token: string) =>
  JSON.stringify(
    {
      mcpServers: {
        appsmith: {
          url: MCP_SERVER_URL,
          headers: { Authorization: `Bearer ${token}` },
        },
      },
    },
    null,
    2,
  );

// A read-only, monospaced value with a copy-to-clipboard button — used for both the server URL and the one-time token.
// `description` (when set) renders as the field's helper text, which the design system links via aria-describedby.
function ReadOnlyCopyField(props: {
  label: string;
  value: string;
  copyLabel: string;
  onCopy: () => void;
  className?: string;
  description?: string;
}) {
  return (
    <Flex alignItems="flex-end" gap="spaces-2" width="100%">
      <Flex flex="1" minWidth="0">
        <Input
          UNSAFE_width="100%"
          description={props.description}
          isReadOnly
          label={props.label}
          style={{ fontFamily: "var(--ads-v2-font-family-code)" }}
          value={props.value}
        />
      </Flex>
      <Tooltip content={props.copyLabel}>
        <Button
          aria-label={props.copyLabel}
          className={props.className}
          isIconButton
          kind="tertiary"
          onClick={props.onCopy}
          size="md"
          startIcon="copy-control"
        />
      </Tooltip>
    </Flex>
  );
}

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
  // The reveal modal is shared by create and rotate; only the header copy differs.
  const [createdViaRotation, setCreatedViaRotation] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [tokenName, setTokenName] = useState("");
  const [rotateTokenId, setRotateTokenId] = useState<string | null>(null);
  const [isRotating, setIsRotating] = useState(false);
  const [revokeTokenId, setRevokeTokenId] = useState<string | null>(null);
  const [isRevoking, setIsRevoking] = useState(false);

  const loadTokens = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await McpTokenApi.list();

      setTokens(ensureSuccess(response));
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
      const response = await McpTokenApi.create(tokenName);
      const token = ensureSuccess(response);

      setCreatedViaRotation(false);
      setCreatedToken(token);
      setTokens((tokens) => [
        {
          id: token.id,
          name: token.name,
          createdAt: token.createdAt,
          expiresAt: token.expiresAt,
        },
        ...tokens,
      ]);
      setTokenName("");
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

  const copyServerUrl = async () => {
    try {
      await navigator.clipboard.writeText(MCP_SERVER_URL);
      toast.show(createMessage(MCP_SERVER_URL_COPIED), { kind: "success" });
    } catch {
      toast.show(createMessage(MCP_SERVER_URL_COPY_FAILED), { kind: "error" });
    }
  };

  const copyClientConfig = async () => {
    if (!createdToken) {
      return;
    }

    try {
      await navigator.clipboard.writeText(
        buildClientConfig(createdToken.token),
      );
      toast.show(createMessage(MCP_CLIENT_CONFIG_COPIED), { kind: "success" });
    } catch {
      toast.show(createMessage(MCP_CLIENT_CONFIG_COPY_FAILED), {
        kind: "error",
      });
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

      setCreatedViaRotation(true);
      setCreatedToken(token);
      setTokens((tokens) =>
        tokens.map((existing) =>
          existing.id === token.id
            ? {
                id: token.id,
                name: token.name,
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
        <div>
          <Text kind="body-m">{createMessage(MCP_TOKENS_DESCRIPTION)}</Text>
        </div>
        <Flex alignItems="flex-end" gap="spaces-4">
          <Input
            className="t--mcp-token-name-input"
            label={createMessage(MCP_TOKEN_NAME_LABEL)}
            onChange={(value: string) =>
              setTokenName(value.slice(0, MAX_MCP_TOKEN_NAME_LENGTH))
            }
            onKeyDown={(event: React.KeyboardEvent) => {
              if (event.key === "Enter" && !isCreating) createToken();
            }}
            placeholder={createMessage(MCP_TOKEN_NAME_PLACEHOLDER)}
            renderAs="input"
            size="md"
            type="text"
            value={tokenName}
          />
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
        <div>
          <ReadOnlyCopyField
            className="t--copy-mcp-server-url"
            copyLabel={createMessage(COPY_MCP_SERVER_URL)}
            description={createMessage(MCP_SERVER_URL_HELP)}
            label={createMessage(MCP_SERVER_URL_LABEL)}
            onCopy={copyServerUrl}
            value={MCP_SERVER_URL}
          />
        </div>
        {error && (
          <Callout aria-atomic="true" kind="error" role="alert">
            {error}
          </Callout>
        )}
        {isLoading ? (
          <Text aria-live="polite" kind="body-m" role="status">
            {createMessage(MCP_TOKENS_LOADING)}
          </Text>
        ) : tokens.length === 0 ? (
          // Only claim "no tokens exist" when the list actually loaded. On a failed load `tokens` is also empty,
          // and showing both the error and the empty state reads as "your credentials were deleted".
          error ? null : (
            <Text kind="body-m">{createMessage(MCP_TOKENS_EMPTY)}</Text>
          )
        ) : (
          <div aria-label={createMessage(MCP_TOKENS)} role="list">
            {tokens.map((token) => (
              <TokenRow key={token.id} role="listitem">
                <TokenMeta>
                  <Text kind="body-m">{token.name || token.id}</Text>
                  <Text color="var(--ads-v2-color-fg-muted)" kind="body-s">
                    {/* Keep the id visible when a name is set so rotate/revoke (labelled by id, and names
                        aren't unique) can be correlated. */}
                    {token.name ? `${token.id} · ` : ""}
                    {createMessage(MCP_TOKEN_CREATED_AT)}:{" "}
                    {formatTimestamp(token.createdAt)} ·{" "}
                    {createMessage(MCP_TOKEN_EXPIRES_AT)}:{" "}
                    {formatTimestamp(token.expiresAt)}
                  </Text>
                </TokenMeta>
                <Button
                  aria-label={`${createMessage(ROTATE_MCP_TOKEN)} ${token.name || token.id}`}
                  isDisabled={isRevoking || isRotating}
                  kind="secondary"
                  onClick={() => setRotateTokenId(token.id)}
                  size="sm"
                >
                  {createMessage(ROTATE_MCP_TOKEN)}
                </Button>
                <Button
                  aria-label={`${createMessage(REVOKE_MCP_TOKEN)} ${token.name || token.id}`}
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
        {/*
          The secret is shown exactly once and is unrecoverable afterwards, so this modal must not be dismissable
          by accident. Radix closes on Escape and on an outside click by default, and onOpenChange nulls the token
          unconditionally — one stray keystroke destroyed the credential with no warning and no undo, leaving a
          rotate (a second destructive action) as the only recovery. Both paths are suppressed; the explicit
          footer action below is the only way out. This also covers the plain-HTTP case where navigator.clipboard
          is undefined and every copy button fails: the user keeps the token on screen to copy by hand.
        */}
        <ModalContent
          onEscapeKeyDown={(event) => event.preventDefault()}
          onInteractOutside={(event) => event.preventDefault()}
          style={{ width: "640px" }}
        >
          <ModalHeader>
            {createdViaRotation
              ? createMessage(MCP_TOKEN_ROTATED_TITLE)
              : createMessage(MCP_TOKEN_CREATED)}
          </ModalHeader>
          <ModalBody>
            <Text kind="body-m">
              {createMessage(MCP_TOKEN_CREATED_DESCRIPTION)}
            </Text>
            <ReadOnlyCopyField
              className="t--copy-mcp-token-icon"
              copyLabel={createMessage(COPY_MCP_TOKEN)}
              label={createMessage(MCP_TOKEN_VALUE_LABEL)}
              onCopy={copyCreatedToken}
              value={createdToken?.token ?? ""}
            />
            <ReadOnlyCopyField
              className="t--copy-mcp-server-url-modal"
              copyLabel={createMessage(COPY_MCP_SERVER_URL)}
              label={createMessage(MCP_SERVER_URL_LABEL)}
              onCopy={copyServerUrl}
              value={MCP_SERVER_URL}
            />
            <Flex alignItems="flex-start" gap="spaces-2" width="100%">
              <Flex flex="1" flexDirection="column" gap="spaces-1" minWidth="0">
                <Text id="mcp-client-config-label" kind="body-s">
                  {createMessage(MCP_CLIENT_CONFIG_LABEL)}
                </Text>
                <pre
                  aria-describedby="mcp-client-config-help"
                  aria-labelledby="mcp-client-config-label"
                  className="t--mcp-client-config"
                  role="region"
                  style={{
                    margin: 0,
                    padding: "var(--ads-v2-spaces-3)",
                    background: "var(--ads-v2-color-bg-subtle)",
                    borderRadius: "var(--ads-v2-border-radius)",
                    fontFamily: "var(--ads-v2-font-family-code)",
                    fontSize: "var(--ads-v2-font-size-2)",
                    overflowX: "auto",
                    whiteSpace: "pre",
                  }}
                >
                  {buildClientConfig(createdToken?.token ?? "")}
                </pre>
                <Text
                  color="var(--ads-v2-color-fg-muted)"
                  id="mcp-client-config-help"
                  kind="body-s"
                >
                  {createMessage(MCP_CLIENT_CONFIG_HELP)}
                </Text>
              </Flex>
              <Tooltip content={createMessage(COPY_MCP_CLIENT_CONFIG)}>
                <Button
                  aria-label={createMessage(COPY_MCP_CLIENT_CONFIG)}
                  className="t--copy-mcp-client-config"
                  isIconButton
                  kind="tertiary"
                  onClick={copyClientConfig}
                  size="md"
                  startIcon="copy-control"
                />
              </Tooltip>
            </Flex>
            <Text color="var(--ads-v2-color-fg-muted)" kind="body-s">
              {createMessage(MCP_TOKEN_EXPIRES_AT)}:{" "}
              {formatTimestamp(createdToken?.expiresAt ?? "")}
            </Text>
            <Callout kind="warning">
              {createMessage(MCP_TOKEN_CREATED_DISMISS_WARNING)}
            </Callout>
          </ModalBody>
          <ModalFooter>
            <Button
              className="t--mcp-token-created-done"
              kind="primary"
              onClick={() => setCreatedToken(null)}
              size="md"
            >
              {createMessage(MCP_TOKEN_CREATED_DONE)}
            </Button>
          </ModalFooter>
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
