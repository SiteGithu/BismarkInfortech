import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Wrench, DollarSign, Package, TrendingUp, AlertTriangle } from "lucide-react";
import { brl, STATUS_LABEL, STATUS_VARIANT } from "@/lib/format";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — Bismark Inforcell" }] }),
  component: Dashboard,
});

function Dashboard() {
  const { data, isLoading } = useQuery({
    queryKey: ["dashboard"],
    queryFn: async () => {
      const since = new Date();
      since.setDate(1);
      since.setHours(0, 0, 0, 0);
      const sinceIso = since.toISOString().slice(0, 10);

      const [abertas, recentes, movs, pecasBaixas] = await Promise.all([
        supabase.from("ordens_servico").select("id", { count: "exact", head: true })
          .in("status", ["orcamento", "aprovado", "em_andamento", "pronto"]),
        supabase.from("ordens_servico").select("id, numero, aparelho, status, valor_total, data_entrada, clientes(nome)")
          .order("created_at", { ascending: false }).limit(8),
        supabase.from("movimentacoes_financeiras").select("tipo, valor").gte("data", sinceIso),
        supabase.from("pecas").select("id, nome, estoque, estoque_minimo").order("estoque", { ascending: true }).limit(5),
      ]);

      const entradas = (movs.data ?? []).filter(m => m.tipo === "entrada").reduce((s, m) => s + Number(m.valor), 0);
      const saidas = (movs.data ?? []).filter(m => m.tipo === "saida").reduce((s, m) => s + Number(m.valor), 0);
      const baixas = (pecasBaixas.data ?? []).filter(p => p.estoque <= p.estoque_minimo);

      return {
        osAbertas: abertas.count ?? 0,
        entradas, saidas, lucro: entradas - saidas,
        recentes: recentes.data ?? [],
        baixas,
      };
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-display font-bold">Dashboard</h1>
          <p className="text-sm text-muted-foreground">Visão geral da assistência</p>
        </div>
        <Button asChild><Link to="/ordens/nova"><Wrench className="h-4 w-4 mr-2" />Nova OS</Link></Button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KpiCard icon={<Wrench className="h-5 w-5" />} label="OS abertas" value={isLoading ? "…" : String(data?.osAbertas ?? 0)} color="primary" />
        <KpiCard icon={<DollarSign className="h-5 w-5" />} label="Entradas do mês" value={isLoading ? "…" : brl(data?.entradas)} color="success" />
        <KpiCard icon={<TrendingUp className="h-5 w-5" />} label="Lucro do mês" value={isLoading ? "…" : brl(data?.lucro)} color="accent" />
        <KpiCard icon={<Package className="h-5 w-5" />} label="Saídas do mês" value={isLoading ? "…" : brl(data?.saidas)} color="destructive" />
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <CardHeader><CardTitle className="text-base">Últimas Ordens de Serviço</CardTitle></CardHeader>
          <CardContent>
            {isLoading ? <p className="text-sm text-muted-foreground">Carregando…</p> :
              data?.recentes.length === 0 ? <p className="text-sm text-muted-foreground">Nenhuma OS ainda. <Link className="text-primary underline" to="/ordens/nova">Criar a primeira</Link>.</p> :
              <ul className="divide-y divide-border">
                {data?.recentes.map((o: any) => (
                  <li key={o.id} className="py-2.5 flex items-center justify-between gap-3">
                    <Link to="/ordens/$id" params={{ id: o.id }} className="flex-1 min-w-0">
                      <p className="font-medium truncate">#{o.numero} — {o.aparelho}</p>
                      <p className="text-xs text-muted-foreground truncate">{o.clientes?.nome ?? "Sem cliente"}</p>
                    </Link>
                    <span className={`text-xs px-2 py-1 rounded-md whitespace-nowrap ${STATUS_VARIANT[o.status]}`}>{STATUS_LABEL[o.status]}</span>
                    <span className="text-sm font-medium whitespace-nowrap hidden sm:block">{brl(o.valor_total)}</span>
                  </li>
                ))}
              </ul>}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><AlertTriangle className="h-4 w-4 text-warning" />Estoque baixo</CardTitle></CardHeader>
          <CardContent>
            {isLoading ? <p className="text-sm text-muted-foreground">Carregando…</p> :
              data?.baixas.length === 0 ? <p className="text-sm text-muted-foreground">Nenhuma peça abaixo do mínimo.</p> :
              <ul className="space-y-2">
                {data?.baixas.map((p: any) => (
                  <li key={p.id} className="flex justify-between text-sm">
                    <span className="truncate">{p.nome}</span>
                    <span className="text-warning font-medium">{p.estoque}/{p.estoque_minimo}</span>
                  </li>
                ))}
              </ul>}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function KpiCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string; color: string }) {
  const colorMap: Record<string, string> = {
    primary: "text-primary bg-primary/15",
    success: "text-success bg-success/15",
    accent: "text-accent bg-accent/15",
    destructive: "text-destructive bg-destructive/15",
  };
  return (
    <Card>
      <CardContent className="p-4">
        <div className={`inline-flex p-2 rounded-md mb-2 ${colorMap[color]}`}>{icon}</div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-lg md:text-xl font-semibold font-display mt-0.5">{value}</p>
      </CardContent>
    </Card>
  );
}
