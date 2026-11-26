"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { z } from "zod";
import { useForm, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Image from "next/image";
import { zecchiBotServiceInquiry } from "@/ai/flows/zecchi-bot-service-inquiry-flow";
import { getContactInfo } from "@/lib/data";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem } from "@/components/ui/form";
import {
  Send,
  X,
  Phone,
  CheckCheck,
  ExternalLink,
} from "lucide-react";
import { cn } from "@/lib/utils";

const WhatsAppSVGIcon = ({ className }: { className?: string }) => (
  <svg
    viewBox="0 0 448 512"
    className={cn("fill-current", className)}
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <path d="M380.9 97.1C339 55.1 283.2 32 223.9 32c-122.4 0-222 99.6-222 222 0 39.1 10.2 77.3 29.6 111L0 480l117.7-30.9c32.4 17.7 68.9 27 106.1 27h.1c122.3 0 224.1-99.6 224.1-222 0-59.3-25.2-115-67.1-157zm-157 341.6c-33.2 0-65.7-8.9-94-25.7l-6.7-4-69.8 18.3L72 359.2l-4.4-7c-18.5-29.4-28.2-63.3-28.2-98.2 0-101.7 82.8-184.5 184.6-184.5 49.3 0 95.6 19.2 130.4 54.1 34.8 34.9 56.2 81.2 56.1 130.5 0 101.8-84.9 184.6-186.6 184.6zm101.2-138.2c-5.5-2.8-32.8-16.2-37.9-18-5.1-1.9-8.8-2.8-12.5 2.8-3.7 5.6-14.3 18-17.6 21.8-3.2 3.7-6.5 4.2-12 1.4-5.5-2.8-23.3-8.6-44.4-27.5-16.4-14.6-27.4-32.8-30.6-38.3-3.2-5.6-.3-8.6 2.5-11.4 2.5-2.5 5.5-6.5 8.3-9.7 2.8-3.2 3.7-5.5 5.6-9.2 1.9-3.7.9-6.9-.5-9.7-1.4-2.8-12.5-30.1-17.1-41.2-4.5-10.8-9.1-9.3-12.5-9.5-3.2-.2-6.9-.2-10.6-.2-3.7 0-9.7 1.4-14.8 6.9-5.1 5.6-19.4 19-19.4 46.3 0 27.3 19.9 53.7 22.6 57.4 2.8 3.7 39.1 59.7 94.8 83.8 13.2 5.8 23.5 9.2 31.5 11.8 13.3 4.2 25.4 3.6 35 2.2 10.7-1.6 32.8-13.4 37.4-26.4 4.6-13 4.6-24.1 3.2-26.4-1.3-2.5-5-3.9-10.5-6.6z" />
  </svg>
);

const chatSchema = z.object({
  message: z.string().trim().min(1, "Il messaggio non può essere vuoto.").max(1000),
});

type ChatInput = z.infer<typeof chatSchema>;

type Message = {
  role: "user" | "bot";
  text: string;
  time: string;
};

const QUICK_REPLIES = [
  "Vorrei un preventivo gratuito",
  "Manutenzione giardini",
  "Potatura alto fusto",
  "Scavi e lavori edili",
];

function getCurrentTime(): string {
  return new Date().toLocaleTimeString("it-IT", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function WhatsAppButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [phone, setPhone] = useState("393404962500");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const form = useForm<ChatInput>({
    resolver: zodResolver(chatSchema),
    defaultValues: { message: "" },
  });

  useEffect(() => {
    async function fetchPhone() {
      try {
        const contactInfo = await getContactInfo();
        if (contactInfo?.phoneMonica) {
          let cleanNumber = contactInfo.phoneMonica.replace(/\D/g, "");
          if (!cleanNumber.startsWith("39")) {
            cleanNumber = `39${cleanNumber}`;
          }
          setPhone(cleanNumber);
        }
      } catch {
        // Fallback already set in default state
      }
    }
    fetchPhone();
  }, []);

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setMessages([
        {
          role: "bot",
          text: "Ciao! Benvenuto nella chat di Zecchi Monica. Come possiamo aiutarti oggi per il tuo giardino, potature, scavi o piccoli lavori edili?",
          time: getCurrentTime(),
        },
      ]);
    }
  }, [isOpen, messages.length]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  // Blocca lo scroll della pagina sotto quando la chat è aperta a schermo intero su mobile
  useEffect(() => {
    if (!isOpen) return;
    const isMobile = window.matchMedia("(max-width: 767px)").matches;
    if (!isMobile) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  const sendMessage = useCallback(
    async (rawText: string) => {
      const trimmed = rawText.trim();
      if (!trimmed || isLoading) return;

      const userMessage: Message = {
        role: "user",
        text: trimmed,
        time: getCurrentTime(),
      };

      const historyPayload = messages.slice(-6).map(({ role, text }) => ({
        role,
        text,
      }));

      setMessages((prev) => [...prev, userMessage]);
      setIsLoading(true);
      form.reset();

      try {
        const result = await zecchiBotServiceInquiry({
          message: trimmed,
          history: historyPayload,
        });
        setMessages((prev) => [
          ...prev,
          {
            role: "bot",
            text: result.response,
            time: getCurrentTime(),
          },
        ]);
      } catch {
        setMessages((prev) => [
          ...prev,
          {
            role: "bot",
            text: "Spiacente, al momento non riesco a rispondere. Puoi chiamare Monica al 340 496 2500 o scrivere a monicazecchi56@gmail.com.",
            time: getCurrentTime(),
          },
        ]);
      } finally {
        setIsLoading(false);
      }
    },
    [form, isLoading, messages],
  );

  const onSubmit: SubmitHandler<ChatInput> = async (data) => {
    await sendMessage(data.message);
  };

  const whatsappExternalLink = `https://wa.me/${phone}`;

  return (
    <>
      {/* Finestra Chat Interna stile WhatsApp (responsive: full-viewport su mobile, card flottante su desktop) */}
      {isOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Chat assistenza Zecchi Monica"
          className={cn(
            "fixed inset-0 z-[100] flex h-[100dvh] w-full flex-col bg-[#0b141a] text-white",
            "md:inset-auto md:bottom-24 md:right-6 md:h-[min(560px,calc(100dvh-8rem))] md:w-[390px] md:rounded-3xl md:border md:border-white/10 md:shadow-[0_20px_60px_rgba(0,0,0,0.65)] md:overflow-hidden",
            "animate-in fade-in duration-200 md:slide-in-from-bottom-4",
          )}
        >
          {/* Header stile WhatsApp */}
          <header className="flex shrink-0 items-center justify-between gap-3 bg-[#1f2c34] px-4 py-3 border-b border-white/10 pt-[max(0.75rem,env(safe-area-inset-top))] md:pt-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="relative h-10 w-10 shrink-0 rounded-full bg-white p-1.5 shadow-sm">
                <div className="relative h-full w-full">
                  <Image
                    src="/images/logo.png"
                    alt="Zecchi Monica"
                    fill
                    className="object-contain"
                    unoptimized
                  />
                </div>
                <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-[#25D366] ring-2 ring-[#1f2c34]" />
              </div>
              <div className="min-w-0">
                <h3 className="truncate font-headline text-sm font-bold text-white leading-tight">
                  Zecchi Monica
                </h3>
                <p className="truncate text-[11px] text-[#25D366] font-medium">
                  {isLoading ? "sta scrivendo..." : "Online · Risponde subito"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1 shrink-0">
              <a
                href={`tel:+${phone}`}
                aria-label="Chiama Monica"
                title="Chiama Monica"
                className="flex h-9 w-9 items-center justify-center rounded-full text-zinc-300 hover:bg-white/10 hover:text-white transition-colors"
              >
                <Phone className="h-4 w-4" />
              </a>
              <a
                href={whatsappExternalLink}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Apri su app WhatsApp"
                title="Apri su app WhatsApp"
                className="flex h-9 w-9 items-center justify-center rounded-full text-zinc-300 hover:bg-white/10 hover:text-[#25D366] transition-colors"
              >
                <ExternalLink className="h-4 w-4" />
              </a>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                aria-label="Chiudi chat"
                className="flex h-9 w-9 items-center justify-center rounded-full text-zinc-300 hover:bg-white/10 hover:text-white transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </header>

          {/* Area Messaggi */}
          <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-3.5 py-4 space-y-3 bg-[#0b141a]">
            <div className="flex justify-center">
              <span className="rounded-lg bg-[#182229] px-3 py-1 text-[11px] text-zinc-400 border border-white/5">
                Assistenza virtuale attiva · Terracina e Provincia
              </span>
            </div>

            {messages.map((message, index) => (
              <div
                key={index}
                className={cn(
                  "flex",
                  message.role === "user" ? "justify-end" : "justify-start",
                )}
              >
                <div
                  className={cn(
                    "max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed shadow-sm break-words whitespace-pre-wrap",
                    message.role === "user"
                      ? "bg-[#005c4b] text-[#e9edef] rounded-tr-sm"
                      : "bg-[#202c33] text-[#e9edef] rounded-tl-sm border border-white/5",
                  )}
                >
                  <p>{message.text}</p>
                  <div className="mt-1 flex items-center justify-end gap-1 text-[10px] text-white/60">
                    <span>{message.time}</span>
                    {message.role === "user" && (
                      <CheckCheck className="h-3.5 w-3.5 text-[#53bdeb]" />
                    )}
                  </div>
                </div>
              </div>
            ))}

            {/* Suggerimenti rapidi visibili all'inizio della conversazione */}
            {messages.length === 1 && !isLoading && (
              <div className="flex flex-wrap gap-2 pt-1">
                {QUICK_REPLIES.map((suggestion) => (
                  <button
                    key={suggestion}
                    type="button"
                    onClick={() => sendMessage(suggestion)}
                    className="rounded-full border border-[#25D366]/35 bg-[#182229] px-3 py-1.5 text-xs font-medium text-[#e9edef] hover:bg-[#25D366]/15 hover:border-[#25D366] transition-colors text-left"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            )}

            {isLoading && (
              <div className="flex justify-start">
                <div className="rounded-2xl rounded-tl-sm bg-[#202c33] px-4 py-3 border border-white/5">
                  <div className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-zinc-400 animate-bounce [animation-delay:-0.3s]" />
                    <span className="h-2 w-2 rounded-full bg-zinc-400 animate-bounce [animation-delay:-0.15s]" />
                    <span className="h-2 w-2 rounded-full bg-zinc-400 animate-bounce" />
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Barra Invio Messaggio */}
          <div className="shrink-0 bg-[#1f2c34] px-3 py-2.5 border-t border-white/10 pb-[max(0.75rem,env(safe-area-inset-bottom))] md:pb-3">
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="flex items-center gap-2"
              >
                <FormField
                  control={form.control}
                  name="message"
                  render={({ field }) => (
                    <FormItem className="flex-1 space-y-0">
                      <FormControl>
                        <Input
                          placeholder="Scrivi un messaggio..."
                          className="h-11 rounded-full bg-[#2a3942] border-transparent focus-visible:ring-1 focus-visible:ring-[#25D366] text-base md:text-sm text-white placeholder:text-zinc-400 px-4"
                          autoComplete="off"
                          maxLength={1000}
                          disabled={isLoading}
                          {...field}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <Button
                  type="submit"
                  size="icon"
                  disabled={isLoading}
                  aria-label="Invia messaggio"
                  className="h-11 w-11 shrink-0 rounded-full bg-[#00a884] hover:bg-[#06cf9c] text-zinc-950 transition-colors"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </form>
            </Form>
          </div>
        </div>
      )}

      {/* Pulsante Flottante WhatsApp */}
      <div
        className={cn(
          "fixed bottom-24 right-4 md:bottom-6 md:right-6 z-40",
          isOpen && "hidden md:block",
        )}
      >
        {!isOpen && (
          <span className="absolute inset-0 inline-flex h-full w-full animate-ping rounded-full bg-[#25D366] opacity-25 pointer-events-none" />
        )}

        <Button
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          aria-label={isOpen ? "Chiudi chat WhatsApp" : "Apri chat WhatsApp"}
          aria-expanded={isOpen}
          className="relative h-14 w-14 rounded-full bg-[#25D366] p-0 shadow-[0_8px_28px_rgba(37,211,102,0.4)] hover:bg-[#1fa855] transition-all hover:scale-105 border-none flex items-center justify-center overflow-hidden"
        >
          {isOpen ? (
            <X className="h-6 w-6 text-white" />
          ) : (
            <WhatsAppSVGIcon className="h-8 w-8 text-white" />
          )}
        </Button>
      </div>
    </>
  );
}
