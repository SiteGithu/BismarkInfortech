import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Plus, Trash2, TrendingUp, TrendingDown, Wallet } from "lucide-react";
import { brl, dateBR } from "@/lib/format";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/financeiro")({
  head: () => ({ meta: [{ title: "Financeiro" }] }),
  component: FinanceiroPage,
});

function FinanceiroPage() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["movimentacoes"],
    queryFn: async () => (await supabase.from("movimentacoes_financeiras").select("*").order("data", { ascending: false }).order("created_at", { ascending: false }).limit(200)).data ?? [],
  });

  const entradas = (data ?? []).filter((m: any) => m.tipo === "entrada").reduce((s: number, m: any) => s + Number(m.valor), 0);
  const saidas = (data ?? []).filter((m: any) => m.tipo === "saida").reduce((s: number, m: any) => s + Number(m.valor), 0);

  async function remove(id: string) {
    if (!confirm("Excluir movimentação?")) return;
    const { error } = await supabase.from("movimentacoes_financeiras").delete().eq("id", id);
    if (error) return toast.error(error.message);
    qc.invalidateQueries({ queryKey: ["movimentacoes"] });
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl md:text-3xl font-display font-bold">Financeiro</h1>
        <MovDialog />
      </div>

      <div className="grid grid-cols-3 gap-3">
        <Card><CardContent className="p-4"><div className="inline-flex p-2 rounded-md mb-2 bg-success/15 text-success"><TrendingUp className="h-5 w-5" /></div><p className="text-xs text-muted-foreground">Entradas</p><p className="text-lg font-display font-semibold tabular-nums">{brl(entradas)}</p></CardContent></Card>
        <Card><CardContent className="p-4"><div className="inline-flex p-2 rounded-md mb-2 bg-destructive/15 text-destructive"><TrendingDown className="h-5 w-5" /></div><p className="text-xs text-muted-foreground">Saídas</p><p className="text-lg font-display font-semibold tabular-nums">{brl(saidas)}</p></CardContent></Card>
        <Card><CardContent className="p-4"><div className="inline-flex p-2 rounded-md mb-2 bg-primary/15 text-primary"><Wallet className="h-5 w-5" /></div><p className="text-xs text-muted-foreground">Saldo</p><p className="text-lg font-display font-semibold tabular-nums text-primary">{brl(entradas - saidas)}</p></CardContent></Card>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Movimentações recentes</CardTitle></CardHeader>
        <CardContent>
          {isLoading ? <p className="text-sm text-muted-foreground">Carregando…</p> :
            data?.length === 0 ? <p className="text-sm text-muted-foreground">Nenhuma movimentação. Movimentações são criadas automaticamente quando você marca uma OS como "entregue".</p> :
            <ul className="divide-y divide-border">
              {data?.map((m: any) => (
                <li key={m.id} className="py-2.5 flex items-center gap-3">
                  <span className={`text-xs px-1.5 py-0.5 rounded uppercase ${m.tipo === "entrada" ? "bg-success/15 text-success" : "bg-destructive/15 text-destructive"}`}>{m.tipo}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm truncate">{m.descricao}</p>
                    <p className="text-xs text-muted-foreground">{dateBR(m.data)} · {m.categoria ?? "—"}</p>
                  </div>
                  <span className={`font-semibold tabular-nums ${m.tipo === "entrada" ? "text-success" : "text-destructive"}`}>{m.tipo === "entrada" ? "+" : "−"}{brl(m.valor)}</span>
                  <Button variant="ghost" size="icon" onClick={() => remove(m.id)}><Trash2 className="h-4 w-4" /></Button>
                </li>
              ))}
            </ul>}
        </CardContent>
      </Card>
    </div>
  );
}

function MovDialog() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [f, setF] = useState({
    tipo: "entrada" as "entrada" | "saida",
    descricao: "", categoria: "", valor: 0,
    data: new Date().toISOString().slice(0, 10),
  });

  async function save() {
    if (!f.descricao || f.valor <= 0) return toast.error("Preencha descrição e valor");
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { error } = await supabase.from("movimentacoes_financeiras").insert({ ...f, owner_id: user.id });
    if (error) return toast.error(error.message);
    toast.success("Lançado");
    setOpen(false);
    setF({ tipo: "entrada", descricao: "", categoria: "", valor: 0, data: new Date().toISOString().slice(0, 10) });
    qc.invalidateQueries({ queryKey: ["movimentacoes"] });
    qc.invalidateQueries({ queryKey: ["dashboard"] });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-1" />Lançar</Button></DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Nova movimentação</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <Select value={f.tipo} onValueChange={(v: any) => setF({ ...f, tipo: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="entrada">Entrada</SelectItem>
              <SelectItem value="saida">Saída</SelectItem>
            </SelectContent>
          </Select>
          <div><Label>Descrição</Label><Input value={f.descricao} onChange={e => setF({ ...f, descricao: e.target.value })} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Categoria</Label><Input value={f.categoria} onChange={e => setF({ ...f, categoria: e.target.value })} placeholder="Aluguel, Compra de peças…" /></div>
            <div><Label>Valor</Label><Input type="number" step="0.01" value={f.valor} onChange={e => setF({ ...f, valor: Number(e.target.value) })} /></div>
          </div>
          <div><Label>Data</Label><Input type="date" value={f.data} onChange={e => setF({ ...f, data: e.target.value })} /></div>
        </div>
        <DialogFooter><Button onClick={save}>Salvar</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
