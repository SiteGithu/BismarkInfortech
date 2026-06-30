import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { brl } from "@/lib/format";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/servicos")({
  head: () => ({ meta: [{ title: "Catálogo de Serviços" }] }),
  component: ServicosPage,
});

type Servico = { id: string; nome: string; descricao: string | null; categoria: string | null; preco_padrao: number; ativo: boolean };

function ServicosPage() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["servicos"],
    queryFn: async () => (await supabase.from("servicos").select("*").order("categoria").order("nome")).data ?? [],
  });

  async function remove(id: string) {
    if (!confirm("Excluir serviço?")) return;
    const { error } = await supabase.from("servicos").delete().eq("id", id);
    if (error) return toast.error(error.message);
    qc.invalidateQueries({ queryKey: ["servicos"] });
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-display font-bold">Catálogo de Serviços</h1>
          <p className="text-sm text-muted-foreground">Troca de tela, formatação, limpeza, etc.</p>
        </div>
        <ServicoDialog />
      </div>
      {isLoading ? <p className="text-sm text-muted-foreground">Carregando…</p> :
        <div className="grid gap-2 md:grid-cols-2">
          {data?.map((s: Servico) => (
            <Card key={s.id}>
              <CardContent className="p-4 flex items-center justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-medium">{s.nome}</p>
                    {s.categoria && <span className="text-xs px-1.5 py-0.5 rounded bg-muted text-muted-foreground">{s.categoria}</span>}
                  </div>
                  {s.descricao && <p className="text-xs text-muted-foreground mt-0.5">{s.descricao}</p>}
                </div>
                <span className="font-display font-semibold text-primary tabular-nums">{brl(s.preco_padrao)}</span>
                <div className="flex gap-1">
                  <ServicoDialog initial={s} />
                  <Button variant="ghost" size="icon" onClick={() => remove(s.id)}><Trash2 className="h-4 w-4" /></Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>}
    </div>
  );
}

function ServicoDialog({ initial }: { initial?: Servico }) {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [f, setF] = useState({
    nome: initial?.nome ?? "", categoria: initial?.categoria ?? "",
    descricao: initial?.descricao ?? "", preco_padrao: initial?.preco_padrao ?? 0,
  });

  async function save() {
    if (!f.nome) return toast.error("Nome obrigatório");
    if (initial) {
      const { error } = await supabase.from("servicos").update(f).eq("id", initial.id);
      if (error) return toast.error(error.message);
    } else {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { error } = await supabase.from("servicos").insert({ ...f, owner_id: user.id });
      if (error) return toast.error(error.message);
    }
    setOpen(false);
    qc.invalidateQueries({ queryKey: ["servicos"] });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {initial ? <Button variant="ghost" size="icon"><Pencil className="h-4 w-4" /></Button>
                 : <Button><Plus className="h-4 w-4 mr-1" />Novo serviço</Button>}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>{initial ? "Editar" : "Novo"} serviço</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div><Label>Nome *</Label><Input value={f.nome} onChange={e => setF({ ...f, nome: e.target.value })} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Categoria</Label><Input value={f.categoria} onChange={e => setF({ ...f, categoria: e.target.value })} placeholder="Celular, Computador…" /></div>
            <div><Label>Preço padrão</Label><Input type="number" step="0.01" value={f.preco_padrao} onChange={e => setF({ ...f, preco_padrao: Number(e.target.value) })} /></div>
          </div>
          <div><Label>Descrição</Label><Textarea rows={2} value={f.descricao} onChange={e => setF({ ...f, descricao: e.target.value })} /></div>
        </div>
        <DialogFooter><Button onClick={save}>Salvar</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
