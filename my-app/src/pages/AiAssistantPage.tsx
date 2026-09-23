import { Bot, Clock, Globe, Mail, Phone, ShieldCheck } from "lucide-react";
import { ChatComponent } from "@/components/ChatComponent";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const HIGHLIGHTS = [
  { icon: Clock, title: "Disponible 24/7", text: "Une réponse à tout moment, sans attendre l'ouverture des bureaux." },
  { icon: Globe, title: "Multilingue", text: "Posez votre question dans votre langue." },
  { icon: ShieldCheck, title: "Sécurisé", text: "Vos échanges restent sur votre appareil ; aucune donnée sensible n'est demandée." },
];

const FAQ = [
  { question: "Que puis-je demander à l'assistant ?", answer: "Congés, paie, télétravail, formation, outils RH et avantages : des informations générales et des indications pour trouver le bon outil." },
  { question: "L'assistant remplace-t-il l'équipe RH ?", answer: "Non. Pour les sujets sensibles (santé, disciplinaire, litige de paie), il vous oriente vers l'équipe RH." },
  { question: "Mon historique est-il conservé ?", answer: "Il est enregistré localement dans votre navigateur. Vous pouvez l'effacer à tout moment." },
];

export default function AiAssistantPage() {
  return (
    <div className="flex flex-col gap-6">
      <section className="flex flex-col gap-4 rounded-2xl bg-linear-to-br from-lesaffre-blue to-lesaffre-dark-blue p-5 text-white sm:flex-row sm:items-center sm:justify-between sm:p-6">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white/15">
            <Bot className="h-6 w-6" />
          </div>
          <div>
            <h1 className="font-heading text-xl font-bold">Assistant RH IA</h1>
            <p className="text-sm text-white/90">
              Posez vos questions RH et retrouvez rapidement le bon outil ou la bonne politique.
            </p>
          </div>
        </div>
        <span className="w-fit rounded-full bg-white/15 px-3 py-1 text-xs font-semibold">Mode démo</span>
      </section>

      <div className="grid gap-3 sm:grid-cols-3">
        {HIGHLIGHTS.map(({ icon: Icon, title, text }) => (
          <Card key={title} size="sm">
            <CardContent className="flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Icon className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">{title}</p>
                <p className="text-xs text-muted-foreground">{text}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <ChatComponent />

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Questions fréquentes</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            {FAQ.map(({ question, answer }) => (
              <div key={question}>
                <p className="text-sm font-medium text-foreground">{question}</p>
                <p className="text-sm text-muted-foreground">{answer}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Contacter les RH</CardTitle>
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
