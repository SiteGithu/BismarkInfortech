import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/ordens/nova")({
  head: () => ({ meta: [{ title: "Nova OS" }] }),
  component: NovaOS,
});

function NovaOS() {
  const navigate = useNavigate();
  const { data: clientes } = useQuery({
    queryKey: ["clientes-select"],
    queryFn: async () => (await supabase.from("clientes").select("id, nome").order("nome")).data ?? [],
  });

  const [form, setForm] = useState({
    cliente_id: "", aparelho: "", marca: "", modelo: "", imei_sn: "", senha: "",
    defeito_relatado: "", garantia_dias: 90, observacoes: "",
  });
  const [saving, setSaving] = useState(false);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { toast.error("Sessão expirou"); return; }
    const { data, error } = await supabase.from("ordens_servico").insert({
      numero: 0, // será preenchido pelo trigger
      owner_id: user.id,
      cliente_id: form.cliente_id || null,
      aparelho: form.aparelho,
      marca: form.marca || null,
      modelo: form.modelo || null,
      imei_sn: form.imei_sn || null,
      senha: form.senha || null,
      defeito_relatado: form.defeito_relatado || null,
      garantia_dias: Number(form.garantia_dias) || 0,
      observacoes: form.observacoes || null,
    }).select("id").single();
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("OS criada!");
    navigate({ to: "/ordens/$id", params: { id: data.id } });
  }

  return (
    <div className="space-y-4 max-w-3xl">
      <h1 className="text-2xl md:text-3xl font-display font-bold">Nova Ordem de Serviço</h1>
      <Card>
        <CardHeader><CardTitle className="text-base">Dados do atendimento</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={save} className="grid md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <Label>Cliente</Label>
              <Select value={form.cliente_id} onValueChange={v => setForm({...form, cliente_id: v})}>
                <SelectTrigger><SelectValue placeholder="Selecione (opcional)" /></SelectTrigger>
                <SelectContent>
                  {clientes?.map(c => <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div><Label>Aparelho *</Label><Input required placeholder="Notebook, Celular, PC…" value={form.aparelho} onChange={e=>setForm({...form, aparelho: e.target.value})} /></div>
            <div><Label>Marca</Label><Input value={form.marca} onChange={e=>setForm({...form, marca: e.target.value})} /></div>
            <div><Label>Modelo</Label><Input value={form.modelo} onChange={e=>setForm({...form, modelo: e.target.value})} /></div>
            <div><Label>IMEI / Serial</Label><Input value={form.imei_sn} onChange={e=>setForm({...form, imei_sn: e.target.value})} /></div>
            <div><Label>Senha do aparelho</Label><Input value={form.senha} onChange={e=>setForm({...form, senha: e.target.value})} /></div>
            <div><Label>Garantia (dias)</Label><Input type="number" value={form.garantia_dias} onChange={e=>setForm({...form, garantia_dias: Number(e.target.value)})} /></div>
            <div className="md:col-span-2"><Label>Defeito relatado</Label><Textarea rows={3} value={form.defeito_relatado} onChange={e=>setForm({...form, defeito_relatado: e.target.value})} /></div>
            <div className="md:col-span-2"><Label>Observações</Label><Textarea rows={2} value={form.observacoes} onChange={e=>setForm({...form, observacoes: e.target.value})} /></div>
            <div className="md:col-span-2 flex gap-2 justify-end">
              <Button type="button" variant="outline" onClick={()=>navigate({to:"/ordens"})}>Cancelar</Button>
              <Button type="submit" disabled={saving}>{saving?"Salvando…":"Criar OS"}</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
