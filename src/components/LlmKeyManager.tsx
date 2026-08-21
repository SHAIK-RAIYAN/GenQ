import React, { useId, useMemo, useState } from "react";

export type LLMProviderId = "gemini" | "openai" | "anthropic" | "groq";

export interface LLMProviderConfig {
  id: LLMProviderId;

  name: string;

  placeholder: string;

  pattern: RegExp;

  docsUrl: string;
}

export const SUPPORTED_PROVIDERS: Record<LLMProviderId, LLMProviderConfig> = {
  gemini: {
    id: "gemini",
    name: "Google Gemini",
    placeholder: "AIzaSy... or AQ....",
    pattern: /^(AIzaSy[A-Za-z0-9_-]{33}|AQ\.[A-Za-z0-9_-]+)$/,
    docsUrl: "https://aistudio.google.com/app/apikey",
  },
  openai: {
    id: "openai",
    name: "OpenAI",
    placeholder: "sk-proj-...",
    pattern: /^sk-(proj-)?[A-Za-z0-9_-]{32,}$/,
    docsUrl: "https://platform.openai.com/api-keys",
  },
  anthropic: {
    id: "anthropic",
    name: "Anthropic Claude",
    placeholder: "sk-ant-...",
    pattern: /^sk-ant-[A-Za-z0-9_-]{32,}$/,
    docsUrl: "https://console.anthropic.com/settings/keys",
  },
  groq: {
    id: "groq",
    name: "Groq Cloud",
    placeholder: "gsk_...",
    pattern: /^gsk_[A-Za-z0-9_-]{48,}$/,
    docsUrl: "https://console.groq.com/keys",
  },
};

export interface KeyConfigState {
  provider: LLMProviderId;

  apiKey: string;

  persistInSession: boolean;
}

interface LLMKeyManagerProps {
  initialProvider?: LLMProviderId;

  onSave: (config: KeyConfigState) => void;

  onClear?: () => void;
}

export function LLMKeyManager({
  initialProvider = "gemini",

  onSave,

  onClear,
}: LLMKeyManagerProps) {
  const providerSelectId = useId();

  const apiKeyInputId = useId();

  const persistCheckboxId = useId();

  const [selectedProvider, setSelectedProvider] =
    useState<LLMProviderId>(initialProvider);

  const [apiKey, setApiKey] = useState("");

  const [isVisible, setIsVisible] = useState(false);

  const [persistInSession, setPersistInSession] = useState(true);

  const [hasInteracted, setHasInteracted] = useState(false);

  const activeProviderConfig = SUPPORTED_PROVIDERS[selectedProvider];

  const isValid = useMemo(() => {
    return activeProviderConfig.pattern.test(apiKey.trim());
  }, [apiKey, activeProviderConfig]);

  const handleProviderChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedProvider(e.target.value as LLMProviderId);

    setApiKey("");

    setHasInteracted(false);
  };

  const handleKeyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setApiKey(e.target.value);

    if (!hasInteracted) setHasInteracted(true);
  };

  const handleFormSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    setHasInteracted(true);

    if (!isValid) return;

    onSave({
      provider: selectedProvider,

      apiKey: apiKey.trim(),

      persistInSession,
    });
  };

  const handleReset = () => {
    setApiKey("");

    setHasInteracted(false);

    if (onClear) onClear();
  };

  return (
    <div className="w-full border p-4 rounded-sm my-4">
      <p className="text-muted-foreground text-sm my-2">
        You can try without an Api key. If the Generate paper button returns an
        Error then try entering your own Api key below
      </p>

      <h3 className="text-sm font-semibold uppercase tracking-widest  border-b border-border pb-2 mb-6">
        AI Provider Configuration
      </h3>

      <form onSubmit={handleFormSubmit} className="space-y-8" noValidate>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <label
              htmlFor={providerSelectId}
              className="block text-sm font-medium mb-2 text-foreground">
              Target Model Provider
            </label>

            <select
              id={providerSelectId}
              value={selectedProvider}
              onChange={handleProviderChange}
              className="w-full bg-transparent border pl-3 rounded-sm border-border py-2 px-0 text-foreground focus:ring-0 focus:outline-0  focus:border-primary transition-colors appearance-none">
              {Object.values(SUPPORTED_PROVIDERS).map((p) => (
                <option
                  key={p.id}
                  value={p.id}
                  className="bg-background text-foreground">
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <div className="flex items-end justify-between mb-2">
              <label
                htmlFor={apiKeyInputId}
                className="block text-sm font-medium text-foreground">
                API Key
              </label>
            </div>

            <div className="relative flex items-center">
              <input
                id={apiKeyInputId}
                type={isVisible ? "text" : "password"}
                value={apiKey}
                onChange={handleKeyChange}
                placeholder={activeProviderConfig.placeholder}
                spellCheck={false}
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="off"
                className="w-full bg-transparent border-0 border-b border-border py-2 px-0 pr-16 text-foreground focus:ring-0 focus:outline-0 focus:border-primary transition-colors placeholder:text-muted-foreground"
              />

              <button
                type="button"
                onClick={() => setIsVisible(!isVisible)}
                className="absolute right-0 h-full px-2 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors outline-none">
                {isVisible ? "Hide" : "Show"}
              </button>
            </div>

            <div className="flex items-center justify-between pt-2">
              {hasInteracted && apiKey.length > 0 && !isValid && (
                <span className="text-xs font-medium text-destructive">
                  Invalid format
                </span>
              )}

              {hasInteracted && isValid && (
                <span className="text-xs font-medium text-primary">
                  Format verified
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <input
            id={persistCheckboxId}
            type="checkbox"
            checked={persistInSession}
            onChange={(e) => setPersistInSession(e.target.checked)}
            className="size-4 rounded-sm border-border bg-transparent text-primary focus:ring-primary focus:ring-offset-background"
          />

          <label
            htmlFor={persistCheckboxId}
            className="text-sm font-medium text-muted-foreground cursor-pointer select-none">
            Vanish token if page refresh/tab closes
          </label>
        </div>

        <div className="flex items-center justify-end gap-4 pt-4 border-t border-border">
          <button
            type="button"
            onClick={handleReset}
            className="px-6 py-2 border border-border text-foreground text-sm font-medium transition-all hover:bg-secondary/50 outline-none">
            Clear
          </button>

          <button
            type="submit"
            disabled={!apiKey.trim()}
            className="px-6 py-2 bg-foreground text-background text-sm font-medium transition-all hover:scale-[1.01] hover:bg-foreground/90 disabled:opacity-50 disabled:hover:scale-100 outline-none">
            Activate Key
          </button>
        </div>
      </form>
    </div>
  );
}
