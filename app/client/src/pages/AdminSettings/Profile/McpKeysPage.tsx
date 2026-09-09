import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Button,
  Callout,
  Flex,
  Input,
  Menu,
  MenuContent,
  MenuItem,
  MenuTrigger,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  Option,
  SearchInput,
  Select,
  Table,
  Tag,
  Text,
  Tooltip,
  toast,
} from "@appsmith/ads";
import {
  COPY_MCP_CLIENT_CONFIG,
  COPY_MCP_SERVER_URL,
  COPY_MCP_TOKEN,
  CREATE_MCP_TOKEN,
  CREATE_MCP_KEY_CONFIRM,
  CREATE_MCP_KEY_TITLE,
  MCP_CLIENT_CONFIG_COPIED,
  MCP_CLIENT_CONFIG_COPY_FAILED,
  MCP_CLIENT_CONFIG_HELP,
  MCP_CLIENT_CONFIG_LABEL,
  MCP_SERVER_URL_COPIED,
  MCP_SERVER_URL_COPY_FAILED,
  MCP_SERVER_URL_LABEL,
  MCP_TOKEN_COPIED,
  MCP_TOKEN_COPY_FAILED,
  MCP_TOKEN_CREATE_FAILED,
  MCP_KEYS_HOW_TO_CONNECT,
  MCP_KEYS_CONNECT_TITLE,
  MCP_KEYS_CONNECT_DESCRIPTION,
  MCP_KEYS_CONNECT_CONFIG_HELP,
  MCP_TOKEN_CREATED,
  MCP_TOKEN_CREATED_AT,
  MCP_TOKEN_EXPIRES_AT,
  MCP_KEY_COLUMN_NAME,
  MCP_KEY_COLUMN_STATUS,
  MCP_KEY_STATUS_ACTIVE,
  MCP_KEY_STATUS_REVOKED,
  MCP_KEY_STATUS_EXPIRED,
  MCP_KEY_MORE_ACTIONS,
  MCP_KEYS_SEARCH_PLACEHOLDER,
  MCP_KEY_STATUS_FILTER_ALL,
  MCP_KEYS_NO_MATCH,
  MCP_KEYS_PREVIOUS_PAGE,
  MCP_KEYS_NEXT_PAGE,
  MCP_KEYS_PAGE_STATUS,
  MCP_TOKEN_CREATED_DESCRIPTION,
  MCP_TOKEN_CREATED_DISMISS_WARNING,
  MCP_TOKEN_CREATED_DONE,
  MCP_TOKEN_VALUE_LABEL,
  MCP_TOKEN_REVOKE_FAILED,
  MCP_TOKEN_REVOKED,
  MCP_TOKEN_ROTATE_FAILED,
  MCP_TOKEN_ROTATED,
  MCP_TOKEN_ROTATED_TITLE,
  MCP_KEYS,
  MCP_TOKENS,
  MCP_TOKENS_DESCRIPTION,
  MCP_TOKENS_EMPTY,
  MCP_TOKENS_LOAD_FAILED,
  MCP_TOKENS_LOADING,
  CANCEL,
  CLOSE,
  REVOKE_MCP_TOKEN,
  REVOKE_MCP_TOKEN_CONFIRM,
  REVOKE_MCP_TOKEN_CONFIRMATION,
  ROTATE_MCP_TOKEN,
  ROTATE_MCP_TOKEN_CONFIRM,
  ROTATE_MCP_TOKEN_CONFIRMATION,
  MCP_TOKEN_NAME_LABEL,
  MCP_TOKEN_NAME_PLACEHOLDER,
  MCP_KEY_VALIDITY_LABEL,
  createMessage,
} from "ee/constants/messages";
import McpTokenApi, {
  type CreatedMcpToken,
  type McpKeyStatus,
  type McpTokenMetadata,
} from "api/McpTokenApi";
import type { ApiResponse } from "api/ApiResponses";
import styled from "styled-components";
import { useDispatch, useSelector } from "react-redux";
import { getCurrentOrganization } from "ee/actions/organizationActions";
import {
  getIsMcpEnabled,
  getMcpServerUrl,
} from "ee/selectors/organizationSelectors";
import type { AdminConfigType } from "ee/pages/AdminSettings/config/types";
import {
  BottomSpace,
  HeaderWrapper,
  SettingsFormWrapper,
  SettingsHeader,
  SettingsSubHeader,
  Wrapper,
} from "../components";

const TokensWrapper = styled.div`
  width: 100%;
  max-width: 100%;
  & > div {
    margin-bottom: 16px;
  }
`;

const KeysFormWrapper = styled(SettingsFormWrapper)`
  max-width: 56rem;
`;

const KeysTableWrapper = styled.div`
  width: 100%;

  table {
    width: 100%;
  }
`;

const MAX_MCP_TOKEN_NAME_LENGTH = 50;
const MCP_KEY_SPAN_DAYS = [30, 60, 90, 180, 365] as const;
const DEFAULT_MCP_KEY_SPAN_DAYS = 30;
const MCP_KEYS_PAGE_SIZE = 10;

type StatusFilter = "ALL" | McpKeyStatus;

// A ready-to-paste MCP client configuration (the common `mcpServers` shape used by Claude Desktop and compatible
// clients): the server URL plus this token as a bearer credential. Rendered once, in the token-created modal.
const buildClientConfig = (serverUrl: string, token: string) =>
  JSON.stringify(
    {
      mcpServers: {
        appsmith: {
          url: serverUrl,
          headers: { Authorization: `Bearer ${token}` },
        },
      },
    },
    null,
    2,
  );

const CLIENT_CONFIG_KEY_PLACEHOLDER = "<YOUR_MCP_KEY>";

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

function ClientConfigSnippet(props: {
  serverUrl: string;
  token: string;
  help: string;
  onCopy: () => void;
}) {
  const config = buildClientConfig(props.serverUrl, props.token);

  return (
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
          {config}
        </pre>
        <Text
          color="var(--ads-v2-color-fg-muted)"
          id="mcp-client-config-help"
          kind="body-s"
        >
          {props.help}
        </Text>
      </Flex>
      <Tooltip content={createMessage(COPY_MCP_CLIENT_CONFIG)}>
        <Button
          aria-label={createMessage(COPY_MCP_CLIENT_CONFIG)}
          className="t--copy-mcp-client-config"
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

function CreateMcpKeyModal(props: {
  isOpen: boolean;
  isCreating: boolean;
  error: string | null;
  onClose: () => void;
  onCreate: (name: string, keySpanDays: number) => void;
}) {
  const [name, setName] = useState("");
  const [keySpanDays, setKeySpanDays] = useState(DEFAULT_MCP_KEY_SPAN_DAYS);

  useEffect(
    function resetCreateFormWhenClosed() {
      if (!props.isOpen) {
        setName("");
        setKeySpanDays(DEFAULT_MCP_KEY_SPAN_DAYS);
      }
    },
    [props.isOpen],
  );

  const handleOpenChange = (open: boolean) => {
    if (open || props.isCreating) {
      return;
    }

    props.onClose();
  };

  const handleCreate = () => {
    if (props.isCreating) {
      return;
    }

    props.onCreate(name, keySpanDays);
  };

  return (
    <Modal onOpenChange={handleOpenChange} open={props.isOpen}>
      <ModalContent style={{ width: "480px" }}>
        <ModalHeader>{createMessage(CREATE_MCP_KEY_TITLE)}</ModalHeader>
        <ModalBody>
          <Flex flexDirection="column" gap="spaces-4">
            {props.error && (
              <Callout aria-atomic="true" kind="error" role="alert">
                {props.error}
              </Callout>
            )}
            <Input
              autoFocus
              className="t--mcp-token-name-input"
              label={createMessage(MCP_TOKEN_NAME_LABEL)}
              onChange={(value: string) =>
                setName(value.slice(0, MAX_MCP_TOKEN_NAME_LENGTH))
              }
              onKeyDown={(event: React.KeyboardEvent) => {
                if (event.key === "Enter") {
                  handleCreate();
                }
              }}
              placeholder={createMessage(MCP_TOKEN_NAME_PLACEHOLDER)}
              renderAs="input"
              size="md"
              type="text"
              value={name}
            />
            <Flex flexDirection="column" gap="spaces-1">
              <Text renderAs="label">
                {createMessage(MCP_KEY_VALIDITY_LABEL)}
              </Text>
              <Select
                className="t--mcp-key-span-select"
                dropdownMatchSelectWidth
                onSelect={(value: string) => setKeySpanDays(Number(value))}
                value={String(keySpanDays)}
              >
                {MCP_KEY_SPAN_DAYS.map((days) => (
                  <Option key={days} value={String(days)}>
                    {days}
                  </Option>
                ))}
              </Select>
            </Flex>
          </Flex>
          <ModalFooter>
            <Button
              isDisabled={props.isCreating}
              kind="secondary"
              onClick={() => handleOpenChange(false)}
              size="md"
            >
              {createMessage(CANCEL)}
            </Button>
            <Button
              className="t--create-mcp-key-submit"
              isLoading={props.isCreating}
              onClick={handleCreate}
              size="md"
            >
              {createMessage(CREATE_MCP_KEY_CONFIRM)}
            </Button>
          </ModalFooter>
        </ModalBody>
      </ModalContent>
    </Modal>
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
const parseTimestamp = (value: string | number) => {
  const numeric = typeof value === "number" ? value : Number(value);
  let date: Date;

  if (!Number.isNaN(numeric) && String(value).trim() !== "") {
    // Values below ~year 2286 in ms are actually seconds; scale them up.
    date = new Date(numeric < 1e12 ? numeric * 1000 : numeric);
  } else {
    date = new Date(value);
  }

  return Number.isNaN(date.getTime()) ? null : date;
};

const formatTimestamp = (value: string | number) => {
  const date = parseTimestamp(value);

  return date ? date.toLocaleString() : String(value);
};

const formatDate = (value: string | number) => {
  const date = parseTimestamp(value);

  if (!date) {
    return "—";
  }

  return date.toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

const formatKeyPrefix = (id: string) => `mcp_${id}....`;

const matchesKeySearch = (token: McpTokenMetadata, query: string) => {
  const needle = query.trim().toLowerCase();

  if (!needle) {
    return true;
  }

  const haystack = [token.name, token.id, formatKeyPrefix(token.id)]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return haystack.includes(needle);
};

const resolveKeyStatus = (token: McpTokenMetadata): McpKeyStatus => {
  if (
    token.status === "ACTIVE" ||
    token.status === "REVOKED" ||
    token.status === "EXPIRED"
  ) {
    return token.status;
  }

  const expiresAt = parseTimestamp(token.expiresAt);

  if (!expiresAt || expiresAt.getTime() <= Date.now()) {
    return "EXPIRED";
  }

  return "ACTIVE";
};

const STATUS_LABEL: Record<McpKeyStatus, () => string> = {
  ACTIVE: MCP_KEY_STATUS_ACTIVE,
  REVOKED: MCP_KEY_STATUS_REVOKED,
  EXPIRED: MCP_KEY_STATUS_EXPIRED,
};

const STATUS_TAG_KIND: Record<McpKeyStatus, "info" | "special" | "premium"> = {
  ACTIVE: "info",
  REVOKED: "special",
  EXPIRED: "premium",
};

function McpKeyRowMenu(props: {
  token: McpTokenMetadata;
  isBusy: boolean;
  onRotate: (id: string) => void;
  onRevoke: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const label = props.token.name || props.token.id;
  const isRevoked = resolveKeyStatus(props.token) === "REVOKED";

  return (
    <Menu onOpenChange={setOpen} open={open}>
      <MenuTrigger>
        <Button
          aria-label={createMessage(MCP_KEY_MORE_ACTIONS, label)}
          className="t--mcp-key-row-menu"
          isDisabled={props.isBusy}
          isIconButton
          kind="tertiary"
          onClick={() => setOpen((isOpen) => !isOpen)}
          size="sm"
          startIcon="more-2-fill"
        />
      </MenuTrigger>
      <MenuContent align="end">
        <MenuItem
          disabled={isRevoked || props.isBusy}
          onSelect={() => props.onRotate(props.token.id)}
        >
          {createMessage(ROTATE_MCP_TOKEN)}
        </MenuItem>
        <MenuItem
          className="error-menuitem"
          disabled={isRevoked || props.isBusy}
          onSelect={() => props.onRevoke(props.token.id)}
        >
          {createMessage(REVOKE_MCP_TOKEN)}
        </MenuItem>
      </MenuContent>
    </Menu>
  );
}

function McpKeysTable(props: {
  keys: McpTokenMetadata[];
  isBusy: boolean;
  emptyText: string;
  onRotate: (id: string) => void;
  onRevoke: (id: string) => void;
}) {
  const columns = useMemo(
    () => [
      {
        title: createMessage(MCP_KEY_COLUMN_NAME),
        dataIndex: "name",
        key: "name",
        render: (_: string, token: McpTokenMetadata) => (
          <Flex flexDirection="column" gap="spaces-1">
            <Text kind="body-m">{token.name || token.id}</Text>
            <Text color="var(--ads-v2-color-fg-muted)" kind="body-s">
              {formatKeyPrefix(token.id)}
            </Text>
          </Flex>
        ),
      },
      {
        title: createMessage(MCP_KEY_COLUMN_STATUS),
        dataIndex: "status",
        key: "status",
        width: 100,
        render: (_: string, token: McpTokenMetadata) => {
          const status = resolveKeyStatus(token);

          return (
            <Flex alignItems="center" display="inline-flex" height="100%">
              <Tag isClosable={false} kind={STATUS_TAG_KIND[status]}>
                {createMessage(STATUS_LABEL[status])}
              </Tag>
            </Flex>
          );
        },
      },
      {
        title: createMessage(MCP_TOKEN_CREATED_AT),
        dataIndex: "createdAt",
        key: "createdAt",
        width: 140,
        render: (value: string | number) => (
          <Text kind="body-m">{formatDate(value)}</Text>
        ),
      },
      {
        title: createMessage(MCP_TOKEN_EXPIRES_AT),
        dataIndex: "expiresAt",
        key: "expiresAt",
        width: 140,
        render: (value: string | number) => (
          <Text kind="body-m">{formatDate(value)}</Text>
        ),
      },
      {
        title: "",
        dataIndex: "id",
        key: "actions",
        width: 56,
        align: "right" as const,
        render: (_: string, token: McpTokenMetadata) => (
          <McpKeyRowMenu
            isBusy={props.isBusy}
            onRevoke={props.onRevoke}
            onRotate={props.onRotate}
            token={token}
          />
        ),
      },
    ],
    [props.isBusy, props.onRotate, props.onRevoke],
  );

  return (
    <KeysTableWrapper>
      <Table
        columns={columns}
        data={props.keys}
        data-testid="t--mcp-keys-table"
        emptyText={props.emptyText}
        rowKey="id"
      />
    </KeysTableWrapper>
  );
}

function StatusFilterMenu(props: {
  value: StatusFilter;
  onChange: (value: StatusFilter) => void;
}) {
  const [open, setOpen] = useState(false);
  const selectedLabel =
    props.value === "ALL"
      ? createMessage(MCP_KEY_STATUS_FILTER_ALL)
      : createMessage(STATUS_LABEL[props.value]);

  return (
    <Menu onOpenChange={setOpen} open={open}>
      <MenuTrigger>
        <Button
          aria-label={`${createMessage(MCP_KEY_COLUMN_STATUS)}: ${selectedLabel}`}
          className="t--mcp-key-status-filter"
          endIcon="arrow-down-s-line"
          kind="secondary"
          onClick={() => setOpen((isOpen) => !isOpen)}
          size="sm"
        >
          {`${createMessage(MCP_KEY_COLUMN_STATUS)}: ${selectedLabel}`}
        </Button>
      </MenuTrigger>
      <MenuContent align="end">
        <MenuItem onSelect={() => props.onChange("ALL")}>
          {createMessage(MCP_KEY_STATUS_FILTER_ALL)}
        </MenuItem>
        <MenuItem onSelect={() => props.onChange("ACTIVE")}>
          {createMessage(MCP_KEY_STATUS_ACTIVE)}
        </MenuItem>
        <MenuItem onSelect={() => props.onChange("REVOKED")}>
          {createMessage(MCP_KEY_STATUS_REVOKED)}
        </MenuItem>
        <MenuItem onSelect={() => props.onChange("EXPIRED")}>
          {createMessage(MCP_KEY_STATUS_EXPIRED)}
        </MenuItem>
      </MenuContent>
    </Menu>
  );
}

function McpKeysToolbar(props: {
  search: string;
  statusFilter: StatusFilter;
  onSearchChange: (value: string) => void;
  onStatusFilterChange: (value: StatusFilter) => void;
}) {
  return (
    <Flex
      alignItems="center"
      flexWrap="wrap"
      gap="spaces-3"
      justifyContent="space-between"
    >
      <Flex flex="1" maxWidth="320px" minWidth="180px">
        <SearchInput
          className="t--mcp-keys-search"
          onChange={props.onSearchChange}
          placeholder={createMessage(MCP_KEYS_SEARCH_PLACEHOLDER)}
          value={props.search}
        />
      </Flex>
      <Flex alignItems="center" gap="spaces-2">
        <StatusFilterMenu
          onChange={props.onStatusFilterChange}
          value={props.statusFilter}
        />
      </Flex>
    </Flex>
  );
}

function McpKeysPagination(props: {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}) {
  if (props.totalPages <= 1) {
    return null;
  }

  return (
    <Flex alignItems="center" justifyContent="space-between">
      <Text kind="body-s">
        {createMessage(MCP_KEYS_PAGE_STATUS, props.page, props.totalPages)}
      </Text>
      <Flex gap="spaces-2">
        <Button
          className="t--mcp-keys-prev-page"
          isDisabled={props.page <= 1}
          kind="secondary"
          onClick={() => props.onPageChange(props.page - 1)}
          size="sm"
        >
          {createMessage(MCP_KEYS_PREVIOUS_PAGE)}
        </Button>
        <Button
          className="t--mcp-keys-next-page"
          isDisabled={props.page >= props.totalPages}
          kind="secondary"
          onClick={() => props.onPageChange(props.page + 1)}
          size="sm"
        >
          {createMessage(MCP_KEYS_NEXT_PAGE)}
        </Button>
      </Flex>
    </Flex>
  );
}

function McpKeysPage({ category }: { category?: AdminConfigType }) {
  const dispatch = useDispatch();
  const isMcpEnabled = useSelector(getIsMcpEnabled);
  const mcpServerUrl = useSelector(getMcpServerUrl);
  const [tokens, setTokens] = useState<McpTokenMetadata[]>([]);
  const [createdToken, setCreatedToken] = useState<CreatedMcpToken | null>(
    null,
  );
  // The reveal modal is shared by create and rotate; only the header copy differs.
  const [createdViaRotation, setCreatedViaRotation] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isConnectHelpOpen, setIsConnectHelpOpen] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [rotateTokenId, setRotateTokenId] = useState<string | null>(null);
  const [isRotating, setIsRotating] = useState(false);
  const [revokeTokenId, setRevokeTokenId] = useState<string | null>(null);
  const [isRevoking, setIsRevoking] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
  const [page, setPage] = useState(1);

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
    dispatch(getCurrentOrganization());
  }, [dispatch]);

  useEffect(() => {
    if (isMcpEnabled) {
      loadTokens();
    }
  }, [isMcpEnabled, loadTokens]);

  const filteredKeys = useMemo(
    () =>
      tokens.filter((token) => {
        if (!matchesKeySearch(token, search)) {
          return false;
        }

        if (statusFilter === "ALL") {
          return true;
        }

        return resolveKeyStatus(token) === statusFilter;
      }),
    [tokens, search, statusFilter],
  );

  const totalPages = Math.max(
    1,
    Math.ceil(filteredKeys.length / MCP_KEYS_PAGE_SIZE),
  );
  const currentPage = Math.min(page, totalPages);
  const pagedKeys = filteredKeys.slice(
    (currentPage - 1) * MCP_KEYS_PAGE_SIZE,
    currentPage * MCP_KEYS_PAGE_SIZE,
  );

  useEffect(
    function clampKeysPage() {
      if (page !== currentPage) {
        setPage(currentPage);
      }
    },
    [page, currentPage],
  );

  if (!isMcpEnabled) {
    return null;
  }

  const createToken = async (name: string, keySpanDays: number) => {
    setIsCreating(true);
    setCreateError(null);

    try {
      const response = await McpTokenApi.create(name, keySpanDays);
      const token = ensureSuccess(response);

      setCreatedViaRotation(false);
      setCreatedToken(token);
      setTokens((tokens) => [
        {
          id: token.id,
          name: token.name,
          createdAt: token.createdAt,
          expiresAt: token.expiresAt,
          status: token.status,
        },
        ...tokens,
      ]);
      setIsCreateModalOpen(false);
      setPage(1);
    } catch (error) {
      setCreateError(
        getErrorMessage(error, createMessage(MCP_TOKEN_CREATE_FAILED)),
      );
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
      await navigator.clipboard.writeText(mcpServerUrl);
      toast.show(createMessage(MCP_SERVER_URL_COPIED), { kind: "success" });
    } catch {
      toast.show(createMessage(MCP_SERVER_URL_COPY_FAILED), { kind: "error" });
    }
  };

  const copyConnectClientConfig = async () => {
    try {
      await navigator.clipboard.writeText(
        buildClientConfig(mcpServerUrl, CLIENT_CONFIG_KEY_PLACEHOLDER),
      );
      toast.show(createMessage(MCP_CLIENT_CONFIG_COPIED), { kind: "success" });
    } catch {
      toast.show(createMessage(MCP_CLIENT_CONFIG_COPY_FAILED), {
        kind: "error",
      });
    }
  };

  const copyClientConfig = async () => {
    if (!createdToken) {
      return;
    }

    try {
      await navigator.clipboard.writeText(
        buildClientConfig(mcpServerUrl, createdToken.token),
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
                status: token.status,
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
    <Wrapper>
      <KeysFormWrapper>
        <HeaderWrapper>
          <Flex
            alignItems="flex-start"
            gap="spaces-4"
            justifyContent="space-between"
          >
            <Flex flex="1" flexDirection="column" gap="spaces-2" minWidth="0">
              <SettingsHeader
                color="var(--ads-v2-color-fg-emphasis-plus)"
                data-testid="t--mcp-keys-header"
                kind="heading-l"
                renderAs="h1"
              >
                {category?.title ?? createMessage(MCP_KEYS)}
              </SettingsHeader>
              <SettingsSubHeader
                color="var(--ads-v2-color-fg-emphasis)"
                kind="body-m"
                renderAs="p"
              >
                {createMessage(MCP_TOKENS_DESCRIPTION)}
              </SettingsSubHeader>
            </Flex>
            <Flex flexShrink="0" gap="spaces-2">
              <Button
                className="t--mcp-how-to-connect"
                kind="secondary"
                onClick={() => setIsConnectHelpOpen(true)}
                size="md"
              >
                {createMessage(MCP_KEYS_HOW_TO_CONNECT)}
              </Button>
              <Button
                className="t--create-mcp-token"
                onClick={() => {
                  setCreateError(null);
                  setIsCreateModalOpen(true);
                }}
                size="md"
                startIcon="plus"
              >
                {createMessage(CREATE_MCP_TOKEN)}
              </Button>
            </Flex>
          </Flex>
        </HeaderWrapper>
        <TokensWrapper>
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
            <Flex
              aria-label={createMessage(MCP_TOKENS)}
              flexDirection="column"
              gap="spaces-4"
            >
              <McpKeysToolbar
                onSearchChange={(value) => {
                  setSearch(value);
                  setPage(1);
                }}
                onStatusFilterChange={(value) => {
                  setStatusFilter(value);
                  setPage(1);
                }}
                search={search}
                statusFilter={statusFilter}
              />
              <McpKeysTable
                emptyText={createMessage(MCP_KEYS_NO_MATCH)}
                isBusy={isRevoking || isRotating}
                keys={pagedKeys}
                onRevoke={setRevokeTokenId}
                onRotate={setRotateTokenId}
              />
              <McpKeysPagination
                onPageChange={setPage}
                page={currentPage}
                totalPages={totalPages}
              />
            </Flex>
          )}
        </TokensWrapper>

        <CreateMcpKeyModal
          error={createError}
          isCreating={isCreating}
          isOpen={isCreateModalOpen}
          onClose={() => {
            setIsCreateModalOpen(false);
            setCreateError(null);
          }}
          onCreate={createToken}
        />

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
                value={mcpServerUrl}
              />
              <ClientConfigSnippet
                help={createMessage(MCP_CLIENT_CONFIG_HELP)}
                onCopy={copyClientConfig}
                serverUrl={mcpServerUrl}
                token={createdToken?.token ?? ""}
              />
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

        <Modal onOpenChange={setIsConnectHelpOpen} open={isConnectHelpOpen}>
          <ModalContent style={{ width: "640px" }}>
            <ModalHeader>{createMessage(MCP_KEYS_CONNECT_TITLE)}</ModalHeader>
            <ModalBody>
              <Text kind="body-m">
                {createMessage(MCP_KEYS_CONNECT_DESCRIPTION)}
              </Text>
              <ReadOnlyCopyField
                className="t--copy-mcp-server-url"
                copyLabel={createMessage(COPY_MCP_SERVER_URL)}
                label={createMessage(MCP_SERVER_URL_LABEL)}
                onCopy={copyServerUrl}
                value={mcpServerUrl}
              />
              <ClientConfigSnippet
                help={createMessage(MCP_KEYS_CONNECT_CONFIG_HELP)}
                onCopy={copyConnectClientConfig}
                serverUrl={mcpServerUrl}
                token={CLIENT_CONFIG_KEY_PLACEHOLDER}
              />
            </ModalBody>
            <ModalFooter>
              <Button
                kind="primary"
                onClick={() => setIsConnectHelpOpen(false)}
                size="md"
              >
                {createMessage(CLOSE)}
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
        <BottomSpace />
      </KeysFormWrapper>
    </Wrapper>
  );
}

export default McpKeysPage;
