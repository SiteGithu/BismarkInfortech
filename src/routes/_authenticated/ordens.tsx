import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Search } from "lucide-react";
import { brl, dateBR, STATUS_LABEL, STATUS_VARIANT } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/ordens")({
  head: () => ({ meta: [{ title: "Ordens de Serviço" }] }),
  component: OrdensPage,
});

function OrdensPage() {
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<string>("todos");

  const { data, isLoading } = useQuery({
    queryKey: ["ordens", status],
    queryFn: async () => {
      let qry = supabase.from("ordens_servico")
        .select("id, numero, aparelho, marca, modelo, status, valor_total, data_entrada, clientes(nome)")
        .order("created_at", { ascending: false });
      if (status !== "todos") qry = qry.eq("status", status as any);
      const { data, error } = await qry;
      if (error) throw error;
      return data;
    },
  });

  const filtered = (data ?? []).filter((o: any) => {
    if (!q) return true;
    const s = q.toLowerCase();
    return o.aparelho?.toLowerCase().includes(s) ||
      o.clientes?.nome?.toLowerCase().includes(s) ||
      String(o.numero).includes(s);
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl md:text-3xl font-display font-bold">Ordens de Serviço</h1>
        <Button asChild><Link to="/ordens/nova"><Plus className="h-4 w-4 mr-2" />Nova OS</Link></Button>
      </div>

      <div className="flex gap-2 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Buscar nº, aparelho, cliente…" value={q} onChange={e => setQ(e.target.value)} className="pl-9" />
        </div>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos os status</SelectItem>
            {Object.entries(STATUS_LABEL).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? <p className="text-sm text-muted-foreground">Carregando…</p> :
        filtered.length === 0 ? (
          <Card><CardContent className="py-12 text-center text-muted-foreground">Nenhuma OS encontrada.</CardContent></Card>
        ) : (
          <div className="grid gap-2">
            {filtered.map((o: any) => (
              <Link key={o.id} to="/ordens/$id" params={{ id: o.id }}>
                <Card className="hover:border-primary/50 transition-colors">
                  <CardContent className="p-4 flex items-center gap-4 flex-wrap">
                    <div className="font-display font-bold text-primary text-lg w-16">#{o.numero}</div>
                    <div className="flex-1 min-w-[180px]">
                      <p className="font-medium">{o.aparelho} {o.marca && <span className="text-muted-foreground font-normal">— {o.marca} {o.modelo ?? ""}</span>}</p>
                      <p className="text-xs text-muted-foreground">{o.clientes?.nome ?? "Sem cliente"} · {dateBR(o.data_entrada)}</p>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-md ${STATUS_VARIANT[o.status]}`}>{STATUS_LABEL[o.status]}</span>
                    <span className="font-semibold tabular-nums">{brl(o.valor_total)}</span>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
    </div>
  );
}
