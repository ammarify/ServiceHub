import { Send } from "lucide-react";
import { useEffect, useRef } from "react";
import { Button } from "../../components/ui/Button";

const MAX_HEIGHT = 112;
const MAX_LENGTH = 2000;
const isMac = typeof navigator !== "undefined" && /Mac|iPhone|iPad/.test(navigator.platform);

export function MessageComposer({ value, onChange, onSend, onTyping, isSending, error, disabled }) {
  const textareaRef = useRef(null);

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, MAX_HEIGHT)}px`;
  }, [value]);

  const trimmed = value.trim();
  const tooLong = value.length > MAX_LENGTH;

  function handleSend() {
    if (!trimmed || tooLong || isSending || disabled) return;
    onSend(trimmed);
  }

  function handleKeyDown(event) {
    if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
      event.preventDefault();
      handleSend();
    }
  }

  return (
    <div>
      <div className="flex items-end gap-2">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(event) => {
            onChange(event.target.value);
            onTyping?.();
          }}
          onKeyDown={handleKeyDown}
          rows={1}
          disabled={disabled}
          aria-label="Reply to customer"
          aria-invalid={tooLong || Boolean(error) || undefined}
          placeholder={`Type a reply... (${isMac ? "⌘" : "Ctrl"} + Enter to send)`}
          className="max-h-[112px] flex-1 resize-none overflow-y-auto rounded-card border border-border bg-surface px-3 py-2 text-[13px] leading-relaxed text-text-primary placeholder:text-text-secondary disabled:opacity-50"
        />
        <Button variant="primary" onClick={handleSend} disabled={!trimmed || tooLong || isSending || disabled}>
          <Send size={14} />
          {isSending ? "Sending…" : "Send"}
        </Button>
      </div>
      {(error || tooLong || value.length > MAX_LENGTH - 200) && (
        <div className="mt-1.5 flex items-center justify-between gap-3 text-[12px]">
          <span role={error ? "alert" : undefined} className="text-danger">
            {error || (tooLong ? "That's longer than a message can be." : "")}
          </span>
          <span className={tooLong ? "font-data text-danger" : "font-data text-text-secondary"}>
            {value.length}/{MAX_LENGTH}
          </span>
        </div>
      )}
    </div>
  );
}
