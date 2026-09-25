import { Bot, Clock, Globe, Mail, Phone, ShieldCheck } from "lucide-react";
import { ChatComponent } from "@/components/ChatComponent";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useLanguage } from "@/lib/i18n/LanguageProvider";

const HIGHLIGHTS = [
  { icon: Clock, titleKey: "assistant.highlight.available.title", textKey: "assistant.highlight.available.text" },
  { icon: Globe, titleKey: "assistant.highlight.multilingual.title", textKey: "assistant.highlight.multilingual.text" },
  { icon: ShieldCheck, titleKey: "assistant.highlight.secure.title", textKey: "assistant.highlight.secure.text" },
];

const FAQ = [
  { questionKey: "assistant.faq.q1", answerKey: "assistant.faq.a1" },
  { questionKey: "assistant.faq.q2", answerKey: "assistant.faq.a2" },
  { questionKey: "assistant.faq.q3", answerKey: "assistant.faq.a3" },
];

export default function AiAssistantPage() {
  const { t } = useLanguage();
  return (
    <div className="flex flex-col gap-6">
      <section className="flex flex-col gap-4 rounded-2xl bg-linear-to-br from-lesaffre-blue to-lesaffre-dark-blue p-5 text-white sm:flex-row sm:items-center sm:justify-between sm:p-6">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white/15">
            <Bot className="h-6 w-6" />
          </div>
          <div>
            <h1 className="font-heading text-xl font-bold">{t("assistant.pageTitle")}</h1>
            <p className="text-sm text-white/90">{t("assistant.pageSubtitle")}</p>
          </div>
        </div>
        <span className="w-fit rounded-full bg-white/15 px-3 py-1 text-xs font-semibold">{t("chat.demoMode")}</span>
      </section>

      <div className="grid gap-3 sm:grid-cols-3">
        {HIGHLIGHTS.map(({ icon: Icon, titleKey, textKey }) => (
          <Card key={titleKey} size="sm">
            <CardContent className="flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Icon className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">{t(titleKey)}</p>
                <p className="text-xs text-muted-foreground">{t(textKey)}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <ChatComponent />

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>{t("assistant.faq.heading")}</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            {FAQ.map(({ questionKey, answerKey }) => (
              <div key={questionKey}>
                <p className="text-sm font-medium text-foreground">{t(questionKey)}</p>
                <p className="text-sm text-muted-foreground">{t(answerKey)}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("assistant.contactHr")}</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2 text-sm text-muted-foreground">
            <span className="flex items-center gap-2">
              <Mail className="h-4 w-4" /> rh@lesaffre.example
            </span>
            <span className="flex items-center gap-2">
              <Phone className="h-4 w-4" /> +33 0 00 00 00 00
            </span>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
