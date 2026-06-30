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
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/clientes")({
  head: () => ({ meta: [{ title: "Clientes" }] }),
  component: ClientesPage,
});

type Cliente = { id: string; nome: string; telefone: string | null; email: string | null; cpf: string | null; observacoes: string | null };

function ClientesPage() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["clientes"],
    queryFn: async () => (await supabase.from("clientes").select("*").order("nome")).data ?? [],
  });

  async function remove(id: string) {
    if (!confirm("Excluir cliente?")) return;
    const { error } = await supabase.from("clientes").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Excluído");
    qc.invalidateQueries({ queryKey: ["clientes"] });
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl md:text-3xl font-display font-bold">Clientes</h1>
        <ClienteDialog />
      </div>
      {isLoading ? <p className="text-sm text-muted-foreground">Carregando…</p> :
        data?.length === 0 ? <Card><CardContent className="py-12 text-center text-muted-foreground">Nenhum cliente cadastrado.</CardContent></Card> :
        <div className="grid gap-2">
          {data?.map((c: Cliente) => (
            <Card key={c.id}>
              <CardContent className="p-4 flex items-center justify-between gap-3 flex-wrap">
                <div className="flex-1 min-w-[180px]">
                  <p className="font-medium">{c.nome}</p>
                  <p className="text-xs text-muted-foreground">{c.telefone ?? "—"} · {c.email ?? "—"}</p>
                </div>
                <div className="flex gap-1">
                  <ClienteDialog initial={c} />
                  <Button variant="ghost" size="icon" onClick={() => remove(c.id)}><Trash2 className="h-4 w-4" /></Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>}
    </div>
  );
}

function ClienteDialog({ initial }: { initial?: Cliente }) {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [f, setF] = useState({
    nome: initial?.nome ?? "", telefone: initial?.telefone ?? "", email: initial?.email ?? "",
    cpf: initial?.cpf ?? "", observacoes: initial?.observacoes ?? "",
  });

  async function save() {
    if (!f.nome) return toast.error("Nome é obrigatório");
    if (initial) {
      const { error } = await supabase.from("clientes").update(f).eq("id", initial.id);
      if (error) return toast.error(error.message);
    } else {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { error } = await supabase.from("clientes").insert({ ...f, owner_id: user.id });
      if (error) return toast.error(error.message);
    }
    toast.success("Salvo");
    setOpen(false);
    qc.invalidateQueries({ queryKey: ["clientes"] });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {initial
          ? <Button variant="ghost" size="icon"><Pencil className="h-4 w-4" /></Button>
          : <Button><Plus className="h-4 w-4 mr-1" />Novo cliente</Button>}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>{initial ? "Editar" : "Novo"} cliente</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div><Label>Nome *</Label><Input value={f.nome} onChange={e => setF({ ...f, nome: e.target.value })} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Telefone</Label><Input value={f.telefone} onChange={e => setF({ ...f, telefone: e.target.value })} /></div>
            <div><Label>CPF</Label><Input value={f.cpf} onChange={e => setF({ ...f, cpf: e.target.value })} /></div>
          </div>
          <div><Label>Email</Label><Input type="email" value={f.email} onChange={e => setF({ ...f, email: e.target.value })} /></div>
          <div><Label>Observações</Label><Textarea rows={2} value={f.observacoes} onChange={e => setF({ ...f, observacoes: e.target.value })} /></div>
        </div>
        <DialogFooter><Button onClick={save}>Salvar</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
