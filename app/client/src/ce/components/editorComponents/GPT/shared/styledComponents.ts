import styled, { keyframes } from "styled-components";
import { Button } from "@appsmith/ads";

export const slideIn = keyframes`
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
`;

export const shimmer = keyframes`
  0% {
    background-position: -200% 0;
  }
  100% {
    background-position: 200% 0;
  }
`;

export const fadeIn = keyframes`
  from {
    opacity: 0;
    transform: translateY(4px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

export const PanelHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: linear-gradient(
    180deg,
    var(--ads-v2-color-bg) 0%,
    var(--ads-v2-color-bg-subtle) 100%
  );
  border-bottom: 1px solid var(--ads-v2-color-border);
  flex-shrink: 0;
`;

export const HeaderTitle = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;

  .sparkle-icon {
    color: var(--ads-v2-color-fg-brand);
  }
`;

export const PanelContent = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
`;

export const InputSection = styled.div`
  padding: 16px;
  border-bottom: 1px solid var(--ads-v2-color-border);
  background: var(--ads-v2-color-bg);
  flex-shrink: 0;
`;

export const PromptInput = styled.textarea`
  width: 100%;
  min-height: 72px;
  max-height: 160px;
  padding: 12px;
  border: 1px solid var(--ads-v2-color-border);
  border-radius: 8px;
  background: var(--ads-v2-color-bg);
  color: var(--ads-v2-color-fg);
  font-family: inherit;
  font-size: 13px;
  line-height: 1.5;
  resize: vertical;
  transition:
    border-color 0.15s ease,
    box-shadow 0.15s ease;

  &:focus {
    outline: none;
    border-color: var(--ads-v2-color-border-emphasis);
    box-shadow: 0 0 0 3px var(--ads-v2-color-bg-brand-secondary);
  }

  &::placeholder {
    color: var(--ads-v2-color-fg-muted);
  }
`;

export const InputActions = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 12px;
`;

export const SendButton = styled(Button)`
  min-width: 80px;
`;

export const QuickActionsSection = styled.div`
  padding: 12px 16px;
  border-bottom: 1px solid var(--ads-v2-color-border);
  background: var(--ads-v2-color-bg-subtle);
  flex-shrink: 0;
`;

export const QuickActionsLabel = styled.div`
  font-size: 11px;
  font-weight: 500;
  color: var(--ads-v2-color-fg-muted);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 8px;
`;

export const QuickActionsGrid = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
`;

export const QuickActionChip = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 6px 10px;
  background: var(--ads-v2-color-bg);
  border: 1px solid var(--ads-v2-color-border);
  border-radius: 6px;
  color: var(--ads-v2-color-fg);
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s ease;

  &:hover {
    background: var(--ads-v2-color-bg-emphasis);
    border-color: var(--ads-v2-color-border-emphasis);
  }

  &:active {
    transform: scale(0.98);
  }

  .chip-icon {
    font-size: 14px;
    color: var(--ads-v2-color-fg-muted);
  }
`;

export const ContextSection = styled.div`
  padding: 10px 16px;
  background: var(--ads-v2-color-bg-muted);
  border-bottom: 1px solid var(--ads-v2-color-border);
  flex-shrink: 0;
`;

export const ContextLabel = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  color: var(--ads-v2-color-fg-muted);

  .context-icon {
    font-size: 12px;
  }

  code {
    background: var(--ads-v2-color-bg);
    padding: 2px 6px;
    border-radius: 4px;
    font-family: monospace;
    font-size: 11px;
    color: var(--ads-v2-color-fg);
  }
`;

export const ResponseSection = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 16px;
`;

export const LoadingState = styled.div`
  padding: 16px;
  background: linear-gradient(
    90deg,
    var(--ads-v2-color-bg-subtle) 25%,
    var(--ads-v2-color-bg-muted) 50%,
    var(--ads-v2-color-bg-subtle) 75%
  );
  background-size: 200% 100%;
  animation: ${shimmer} 1.5s infinite;
  border-radius: 8px;
  min-height: 80px;
`;

export const LoadingText = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--ads-v2-color-fg-muted);
  font-size: 13px;
`;

export const ErrorState = styled.div`
  padding: 12px 16px;
  background: var(--ads-v2-color-bg-error);
  border: 1px solid var(--ads-v2-color-border-error);
  border-radius: 8px;
  color: var(--ads-v2-color-fg-error);
  font-size: 13px;
  animation: ${fadeIn} 0.2s ease-out;
`;

export const ResponseContent = styled.div`
  animation: ${fadeIn} 0.3s ease-out;
`;

export const ResponseText = styled.div`
  font-size: 13px;
  line-height: 1.6;
  color: var(--ads-v2-color-fg);
  white-space: pre-wrap;

  p {
    margin: 0 0 12px 0;
  }
`;

export const CodeBlock = styled.div`
  margin: 12px 0;
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid var(--ads-v2-color-border);
`;

export const CodeBlockHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  background: var(--ads-v2-color-bg-subtle);
  border-bottom: 1px solid var(--ads-v2-color-border);
`;

export const CodeBlockLanguage = styled.span`
  font-size: 11px;
  font-weight: 500;
  color: var(--ads-v2-color-fg-muted);
  text-transform: uppercase;
`;

export const CodeBlockActions = styled.div`
  display: flex;
  gap: 4px;
`;

export const CodeBlockContent = styled.pre`
  margin: 0;
  padding: 12px;
  background: #1e1e2e;
  color: #cdd6f4;
  font-family: "JetBrains Mono", "Fira Code", monospace;
  font-size: 12px;
  line-height: 1.5;
  overflow-x: auto;

  &::-webkit-scrollbar {
    height: 6px;
  }

  &::-webkit-scrollbar-track {
    background: transparent;
  }

  &::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.2);
    border-radius: 3px;
  }
`;

export const EmptyState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  text-align: center;
  padding: 32px;
  color: var(--ads-v2-color-fg-muted);

  .empty-icon {
    font-size: 48px;
    opacity: 0.3;
    margin-bottom: 16px;
  }
`;

export const EmptyStateText = styled.div`
  font-size: 13px;
  line-height: 1.5;
  max-width: 240px;
`;
