import { useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ArrowUp, Check, Database, Loader2, Sparkles, Square, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUi } from '@/stores/uiStore';
import { playSound } from '@/lib/sound';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Kbd } from '@/components/ui/misc';
import { Tooltip } from '@/components/ui/tooltip';
import { DUR, EASE, softSpring } from '@/lib/motion';
import { answer, SUGGESTIONS, type Block, type ToolCall } from './engine';

/* ------------------------------------------------------------------ *
 * Message model
 * ------------------------------------------------------------------ */

interface Message {
  id: string;
  role: 'user' | 'assistant';
  /** For the assistant: filled progressively as the answer streams. */
  blocks: Block[];
  tools?: (ToolCall & { done: boolean })[];
  source?: string;
  streaming?: boolean;
}

const uid = () => Math.random().toString(36).slice(2);

/* ------------------------------------------------------------------ *
 * Answer rendering
 * ------------------------------------------------------------------ */

function BlockView({ block, onAction }: { block: Block; onAction: (a: { to?: string; prompt?: string }) => void }) {
  switch (block.kind) {
    case 'text':
      return <p className="text-sm leading-relaxed text-fg">{block.text}</p>;

    case 'stats':
      return (
        <div className="grid grid-cols-3 gap-1.5">
          {block.items.map((s) => (
            <div key={s.label} className="rounded-lg border border-line bg-surface-2/60 p-2">
              <p
                className={cn(
                  'font-mono text-lg font-semibold tabular leading-none',
                  s.tone === 'danger' && 'text-danger-fg',
                  s.tone === 'warning' && 'text-warning-fg',
                  s.tone === 'success' && 'text-success-fg'
                )}
              >
                {s.value}
              </p>
              <p className="mt-1 truncate text-2xs text-fg-muted">{s.label}</p>
            </div>
          ))}
        </div>
      );

    case 'table':
      return (
        <figure className="overflow-hidden rounded-lg border border-line">
          <figcaption className="border-b border-line bg-surface-2/60 px-2.5 py-1.5 text-2xs font-medium uppercase tracking-wider text-fg-subtle">
            {block.caption}
          </figcaption>
          {/* Wide content scrolls inside its own box; the dock must never scroll sideways. */}
          <div className="overflow-x-auto">
            <table className="w-full text-2xs">
              <thead>
                <tr className="border-b border-line">
                  {block.columns.map((c) => (
                    <th key={c} scope="col" className="whitespace-nowrap px-2.5 py-1.5 text-left font-semibold text-fg-muted">
                      {c}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {block.rows.map((row, i) => (
                  <tr key={i} className="border-b border-line last:border-0">
                    {row.map((cell, j) => (
                      <td
                        key={j}
                        className={cn(
                          'whitespace-nowrap px-2.5 py-1.5',
                          j === 0 ? 'font-mono text-fg' : 'text-fg-muted'
                        )}
                      >
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </figure>
      );

    case 'actions':
      return (
        <div className="flex flex-wrap gap-1.5">
          {block.items.map((a) => (
            <Button key={a.label} variant="outline" size="xs" onClick={() => onAction(a)} className="max-w-full">
              <span className="truncate">{a.label}</span>
            </Button>
          ))}
        </div>
      );
  }
}

/**
 * The tool trace. Showing which data the assistant touched, one resolved step at a time,
 * is what separates "it answered" from "it guessed" — and it fills the wait with something
 * more informative than a spinner.
 */
function ToolTrace({ tools }: { tools: (ToolCall & { done: boolean })[] }) {
  return (
    <ul className="space-y-1">
      {tools.map((t) => (
        <motion.li
          key={t.label}
          initial={{ opacity: 0, x: -6 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: DUR.normal, ease: EASE }}
          className="flex items-center gap-1.5 text-2xs text-fg-muted"
        >
          {t.done ? (
            <Check className="size-3 shrink-0 text-success-fg" aria-hidden="true" />
          ) : (
            <Loader2 className="size-3 shrink-0 animate-spin text-primary-fg" aria-hidden="true" />
          )}
          <span className={cn('truncate', t.done && 'text-fg-subtle')}>{t.label}</span>
        </motion.li>
      ))}
    </ul>
  );
}

function MessageView({ message, onAction }: { message: Message; onAction: (a: { to?: string; prompt?: string }) => void }) {
  if (message.role === 'user') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: DUR.normal, ease: EASE }}
        className="flex justify-end"
      >
        <div className="max-w-[85%] rounded-2xl rounded-br-sm bg-primary px-3 py-2 text-sm text-primary-on shadow-low">
          {message.blocks[0]?.kind === 'text' && message.blocks[0].text}
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: DUR.normal, ease: EASE }}
      className="space-y-2.5"
    >
      <div className="flex items-center gap-1.5">
        <span className="grid size-5 place-items-center rounded-md bg-primary-soft text-primary-soft-fg">
          <Sparkles className="size-3" aria-hidden="true" />
        </span>
        <span className="text-2xs font-semibold uppercase tracking-wider text-fg-subtle">Axis AI</span>
      </div>

      {message.tools && message.tools.length > 0 && <ToolTrace tools={message.tools} />}

      <div className="space-y-2.5">
        {message.blocks.map((b, i) => (
          <BlockView key={i} block={b} onAction={onAction} />
        ))}
        {message.streaming && (
          <span className="inline-block h-4 w-1.5 translate-y-0.5 animate-caret-blink rounded-sm bg-primary" aria-hidden="true" />
        )}
      </div>

      {message.source && !message.streaming && (
        <p className="flex items-center gap-1.5 border-t border-line pt-2 text-2xs text-fg-subtle">
          <Database className="size-3 shrink-0" aria-hidden="true" />
          <span className="truncate">{message.source}</span>
        </p>
      )}
    </motion.div>
  );
}

/* ------------------------------------------------------------------ *
 * The dock
 * ------------------------------------------------------------------ */

export function AiDock() {
  const { aiOpen, setAiOpen, aiPrompt, clearAiPrompt } = useUi();
  const navigate = useNavigate();
  const reduced = useReducedMotion();

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const cancelled = useRef(false);

  // Follow the stream. `auto` rather than `smooth`: a smooth scroll that restarts on
  // every token never arrives at the bottom.
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [messages]);

  useEffect(() => {
    if (aiOpen) window.setTimeout(() => inputRef.current?.focus(), 120);
  }, [aiOpen]);

  const send = useCallback(
    async (text: string) => {
      const question = text.trim();
      if (!question || busy) return;

      cancelled.current = false;
      setBusy(true);
      setInput('');
      playSound('send');

      const userMsg: Message = { id: uid(), role: 'user', blocks: [{ kind: 'text', text: question }] };
      const replyId = uid();
      const result = answer(question);

      setMessages((m) => [
        ...m,
        userMsg,
        { id: replyId, role: 'assistant', blocks: [], tools: result.tools.map((t) => ({ ...t, done: false })), streaming: true },
      ]);

      const patch = (fn: (m: Message) => Message) =>
        setMessages((all) => all.map((m) => (m.id === replyId ? fn(m) : m)));

      // Resolve the tool calls one at a time so the trace reads as sequential work.
      for (let i = 0; i < result.tools.length; i++) {
        await new Promise((r) => setTimeout(r, result.tools[i]!.ms));
        if (cancelled.current) break;
        patch((m) => ({ ...m, tools: m.tools?.map((t, j) => (j <= i ? { ...t, done: true } : t)) }));
      }

      // Stream the prose word by word. Waiting for a complete answer makes a fast
      // response feel slower than a slow one that started immediately.
      for (const block of result.blocks) {
        if (cancelled.current) break;

        if (block.kind === 'text') {
          const words = block.text.split(' ');
          patch((m) => ({ ...m, blocks: [...m.blocks, { kind: 'text', text: '' }] }));
          for (let w = 0; w < words.length; w++) {
            if (cancelled.current) break;
            await new Promise((r) => setTimeout(r, reduced ? 0 : 18));
            playSound('type');
            patch((m) => {
              const blocks = [...m.blocks];
              const last = blocks[blocks.length - 1];
              if (last?.kind === 'text') {
                blocks[blocks.length - 1] = { kind: 'text', text: words.slice(0, w + 1).join(' ') };
              }
              return { ...m, blocks };
            });
          }
        } else {
          await new Promise((r) => setTimeout(r, 140));
          if (cancelled.current) break;
          patch((m) => ({ ...m, blocks: [...m.blocks, block] }));
        }
      }

      patch((m) => ({ ...m, streaming: false, source: result.source }));
      setBusy(false);
      if (!cancelled.current) playSound('receive');
    },
    [busy, reduced]
  );

  // A contextual action elsewhere in the app can open the dock with a question ready.
  useEffect(() => {
    if (aiPrompt) {
      const p = aiPrompt;
      clearAiPrompt();
      void send(p);
    }
  }, [aiPrompt, clearAiPrompt, send]);

  const onAction = (a: { to?: string; prompt?: string }) => {
    if (a.to) {
      navigate(a.to);
      setAiOpen(false);
    } else if (a.prompt) {
      void send(a.prompt);
    }
  };

  return (
    <AnimatePresence>
      {aiOpen && (
        <motion.aside
          key="ai-dock"
          role="complementary"
          aria-label="Axis AI assistant"
          initial={reduced ? { opacity: 0 } : { x: '100%', opacity: 0.6 }}
          animate={{ x: 0, opacity: 1 }}
          exit={reduced ? { opacity: 0 } : { x: '100%', opacity: 0.4, transition: { duration: DUR.normal, ease: EASE } }}
          transition={softSpring}
          className="z-20 flex w-[380px] shrink-0 flex-col border-l border-line bg-surface"
        >
          <header className="flex h-14 shrink-0 items-center gap-2 border-b border-line px-3">
            <span className="grid size-7 place-items-center rounded-lg bg-primary-soft text-primary-soft-fg">
              <Sparkles className="size-4" aria-hidden="true" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold">Axis AI</p>
              <p className="truncate text-2xs text-fg-subtle">Reads inventory, people and training</p>
            </div>
            <Tooltip content="Close">
              <Button variant="ghost" size="icon-sm" onClick={() => setAiOpen(false)} aria-label="Close assistant" sound="close">
                <X />
              </Button>
            </Tooltip>
          </header>

          <div ref={scrollRef} className="flex-1 space-y-5 overflow-y-auto p-3">
            {messages.length === 0 ? (
              // An empty state that teaches. A blank panel with a cursor tells the user
              // nothing about what the assistant can actually reach.
              <div className="flex h-full flex-col justify-center gap-4 px-1">
                <div>
                  <p className="text-md font-semibold tracking-tight">Ask about this workspace</p>
                  <p className="mt-1 text-sm text-fg-muted">
                    Every answer is drawn from live inventory, people and training records — and cites
                    which one it used.
                  </p>
                </div>
                <ul className="space-y-1.5">
                  {SUGGESTIONS.map((s, i) => (
                    <motion.li
                      key={s}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.05 * i, duration: DUR.normal, ease: EASE }}
                    >
                      <button
                        type="button"
                        onClick={() => void send(s)}
                        className="w-full rounded-lg border border-line bg-surface-2/50 px-2.5 py-2 text-left text-sm text-fg-muted transition-colors duration-fast hover:border-primary-line hover:bg-primary-soft/40 hover:text-primary-soft-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      >
                        {s}
                      </button>
                    </motion.li>
                  ))}
                </ul>
              </div>
            ) : (
              messages.map((m) => <MessageView key={m.id} message={m} onAction={onAction} />)
            )}
          </div>

          <div className="shrink-0 border-t border-line p-2.5">
            <div className="rounded-xl border border-line bg-surface-3 p-1.5 transition-colors duration-fast focus-within:border-primary-line focus-within:ring-2 focus-within:ring-ring/30">
              <label htmlFor="ai-input" className="sr-only">
                Ask Axis AI
              </label>
              <textarea
                id="ai-input"
                ref={inputRef}
                rows={1}
                value={input}
                placeholder="Ask about stock, people or training…"
                onChange={(e) => {
                  setInput(e.target.value);
                  // Autosize, capped: the composer may grow to a paragraph, not a page.
                  e.target.style.height = 'auto';
                  e.target.style.height = `${Math.min(e.target.scrollHeight, 140)}px`;
                }}
                onKeyDown={(e) => {
                  // Enter sends, Shift+Enter breaks the line. The reverse traps anyone
                  // who wants two sentences.
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    void send(input);
                  }
                }}
                className="max-h-36 w-full resize-none bg-transparent px-1.5 py-1 text-sm text-fg outline-none placeholder:text-fg-subtle"
              />
              <div className="flex items-center justify-between gap-2 pl-1.5">
                <span className="text-2xs text-fg-subtle">
                  <Kbd>↵</Kbd> send · <Kbd>⇧↵</Kbd> newline
                </span>
                {busy ? (
                  <Button
                    size="icon-sm"
                    variant="secondary"
                    onClick={() => {
                      cancelled.current = true;
                      setBusy(false);
                    }}
                    aria-label="Stop generating"
                  >
                    <Square className="fill-current" />
                  </Button>
                ) : (
                  <Button
                    size="icon-sm"
                    variant="primary"
                    disabled={!input.trim()}
                    onClick={() => void send(input)}
                    aria-label="Send message"
                    sound={null}
                  >
                    <ArrowUp />
                  </Button>
                )}
              </div>
            </div>
            <p className="mt-1.5 px-1 text-2xs text-fg-subtle">
              <Badge tone="neutral" className="mr-1">
                Demo
              </Badge>
              Answers are generated from local mock data.
            </p>
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}
