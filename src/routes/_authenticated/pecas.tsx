import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Plus, Pencil, Trash2, AlertTriangle } from "lucide-react";
import { brl } from "@/lib/format";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/pecas")({
  head: () => ({ meta: [{ title: "Estoque de Peças" }] }),
  component: PecasPage,
});

type Peca = { id: string; nome: string; sku: string | null; preco_custo: number; preco_venda: number; estoque: number; estoque_minimo: number };

function PecasPage() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["pecas"],
    queryFn: async () => (await supabase.from("pecas").select("*").order("nome")).data ?? [],
  });

  async function remove(id: string) {
    if (!confirm("Excluir peça?")) return;
    const { error } = await supabase.from("pecas").delete().eq("id", id);
    if (error) return toast.error(error.message);
    qc.invalidateQueries({ queryKey: ["pecas"] });
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-display font-bold">Peças & Estoque</h1>
          <p className="text-sm text-muted-foreground">Telas, baterias, conectores e mais</p>
        </div>
        <PecaDialog />
      </div>
      {isLoading ? <p className="text-sm text-muted-foreground">Carregando…</p> :
        data?.length === 0 ? <Card><CardContent className="py-12 text-center text-muted-foreground">Nenhuma peça cadastrada.</CardContent></Card> :
        <div className="grid gap-2">
          {data?.map((p: Peca) => {
            const low = p.estoque <= p.estoque_minimo;
            return (
              <Card key={p.id} className={low ? "border-warning/50" : ""}>
                <CardContent className="p-4 flex items-center gap-3 flex-wrap">
                  <div className="flex-1 min-w-[180px]">
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{p.nome}</p>
                      {low && <AlertTriangle className="h-4 w-4 text-warning" />}
                    </div>
                    <p className="text-xs text-muted-foreground">SKU: {p.sku ?? "—"} · Custo: {brl(p.preco_custo)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">Estoque</p>
                    <p className={`font-display font-semibold ${low ? "text-warning" : ""}`}>{p.estoque}/{p.estoque_minimo}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">Venda</p>
                    <p className="font-display font-semibold text-primary tabular-nums">{brl(p.preco_venda)}</p>
                  </div>
                  <div className="flex gap-1">
                    <PecaDialog initial={p} />
                    <Button variant="ghost" size="icon" onClick={() => remove(p.id)}><Trash2 className="h-4 w-4" /></Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>}
    </div>
  );
}

function PecaDialog({ initial }: { initial?: Peca }) {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [f, setF] = useState({
    nome: initial?.nome ?? "", sku: initial?.sku ?? "",
    preco_custo: initial?.preco_custo ?? 0, preco_venda: initial?.preco_venda ?? 0,
    estoque: initial?.estoque ?? 0, estoque_minimo: initial?.estoque_minimo ?? 1,
  });

  async function save() {
    if (!f.nome) return toast.error("Nome obrigatório");
    if (initial) {
      const { error } = await supabase.from("pecas").update(f).eq("id", initial.id);
      if (error) return toast.error(error.message);
    } else {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { error } = await supabase.from("pecas").insert({ ...f, owner_id: user.id });
      if (error) return toast.error(error.message);
    }
    setOpen(false);
    qc.invalidateQueries({ queryKey: ["pecas"] });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {initial ? <Button variant="ghost" size="icon"><Pencil className="h-4 w-4" /></Button>
                 : <Button><Plus className="h-4 w-4 mr-1" />Nova peça</Button>}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>{initial ? "Editar" : "Nova"} peça</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div><Label>Nome *</Label><Input value={f.nome} onChange={e => setF({ ...f, nome: e.target.value })} /></div>
          <div><Label>SKU</Label><Input value={f.sku} onChange={e => setF({ ...f, sku: e.target.value })} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Preço de custo</Label><Input type="number" step="0.01" value={f.preco_custo} onChange={e => setF({ ...f, preco_custo: Number(e.target.value) })} /></div>
            <div><Label>Preço de venda</Label><Input type="number" step="0.01" value={f.preco_venda} onChange={e => setF({ ...f, preco_venda: Number(e.target.value) })} /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Estoque atual</Label><Input type="number" value={f.estoque} onChange={e => setF({ ...f, estoque: Number(e.target.value) })} /></div>
            <div><Label>Estoque mínimo</Label><Input type="number" value={f.estoque_minimo} onChange={e => setF({ ...f, estoque_minimo: Number(e.target.value) })} /></div>
          </div>
        </div>
        <DialogFooter><Button onClick={save}>Salvar</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
