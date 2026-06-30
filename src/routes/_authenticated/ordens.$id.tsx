import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Plus, Trash2, Printer, ArrowLeft } from "lucide-react";
import { brl, dateBR, STATUS_LABEL, STATUS_VARIANT } from "@/lib/format";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/ordens/$id")({
  head: () => ({ meta: [{ title: "Detalhe da OS" }] }),
  component: OrdemDetail,
});

function OrdemDetail() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const { data: os } = useQuery({
    queryKey: ["ordem", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("ordens_servico")
        .select("*, clientes(nome, telefone)").eq("id", id).single();
      if (error) throw error;
      return data;
    },
  });
  const { data: itens } = useQuery({
    queryKey: ["ordem-itens", id],
    queryFn: async () => (await supabase.from("ordem_itens").select("*").eq("ordem_id", id).order("created_at")).data ?? [],
  });

  async function updateStatus(status: string) {
    const { error } = await supabase.from("ordens_servico").update({ status: status as any }).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Status atualizado");
    qc.invalidateQueries({ queryKey: ["ordem", id] });
    qc.invalidateQueries({ queryKey: ["dashboard"] });
  }

  async function updateDesconto(v: number) {
    await supabase.from("ordens_servico").update({ desconto: v }).eq("id", id);
    qc.invalidateQueries({ queryKey: ["ordem", id] });
  }

  async function removeItem(itemId: string) {
    if (!confirm("Remover item?")) return;
    const { error } = await supabase.from("ordem_itens").delete().eq("id", itemId);
    if (error) return toast.error(error.message);
    qc.invalidateQueries({ queryKey: ["ordem-itens", id] });
    qc.invalidateQueries({ queryKey: ["ordem", id] });
  }

  async function deleteOS() {
    if (!confirm("Excluir esta OS? Isso devolverá peças ao estoque.")) return;
    const { error } = await supabase.from("ordens_servico").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("OS excluída");
    navigate({ to: "/ordens" });
  }

  if (!os) return <p className="text-sm text-muted-foreground">Carregando…</p>;
  const total = Number(os.valor_total) - Number(os.desconto);

  return (
    <div className="space-y-4 max-w-4xl">
      <div className="flex items-center justify-between flex-wrap gap-3 print:hidden">
        <Button variant="ghost" size="sm" onClick={() => navigate({ to: "/ordens" })}><ArrowLeft className="h-4 w-4 mr-1" />Voltar</Button>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => window.print()}><Printer className="h-4 w-4 mr-1" />Imprimir</Button>
          <Button variant="destructive" size="sm" onClick={deleteOS}>Excluir</Button>
        </div>
      </div>

      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-display font-bold">OS #{os.numero}</h1>
          <p className="text-sm text-muted-foreground">{os.aparelho} · {dateBR(os.data_entrada)}</p>
        </div>
        <div className="flex items-center gap-2 print:hidden">
          <span className={`text-xs px-2 py-1 rounded-md ${STATUS_VARIANT[os.status]}`}>{STATUS_LABEL[os.status]}</span>
          <Select value={os.status} onValueChange={updateStatus}>
            <SelectTrigger className="w-[170px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              {Object.entries(STATUS_LABEL).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <Card>
          <CardHeader><CardTitle className="text-base">Aparelho</CardTitle></CardHeader>
          <CardContent className="text-sm space-y-1">
            <Row label="Aparelho" value={os.aparelho} />
            <Row label="Marca / Modelo" value={`${os.marca ?? "—"} / ${os.modelo ?? "—"}`} />
            <Row label="IMEI / Serial" value={os.imei_sn ?? "—"} />
            <Row label="Senha" value={os.senha ?? "—"} />
            <Row label="Garantia" value={`${os.garantia_dias} dias`} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-base">Cliente & Diagnóstico</CardTitle></CardHeader>
          <CardContent className="text-sm space-y-2">
            <Row label="Cliente" value={os.clientes?.nome ?? "—"} />
            <Row label="Telefone" value={os.clientes?.telefone ?? "—"} />
            <div><p className="text-muted-foreground text-xs">Defeito relatado</p><p>{os.defeito_relatado ?? "—"}</p></div>
            <DiagnosticoEditor id={id} initial={os.diagnostico} />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Serviços e peças</CardTitle>
          <AddItemDialog ordemId={id} ownerId={os.owner_id} />
        </CardHeader>
        <CardContent>
          {itens?.length === 0 ? <p className="text-sm text-muted-foreground">Nenhum item adicionado.</p> :
            <ul className="divide-y divide-border">
              {itens?.map(it => (
                <li key={it.id} className="py-2 flex items-center gap-3">
                  <span className="text-xs px-1.5 py-0.5 rounded bg-muted text-muted-foreground uppercase">{it.tipo}</span>
                  <span className="flex-1">{it.descricao}</span>
                  <span className="text-sm text-muted-foreground">{it.quantidade}×</span>
                  <span className="font-medium tabular-nums w-24 text-right">{brl(Number(it.valor_unitario) * it.quantidade)}</span>
                  <Button variant="ghost" size="icon" onClick={() => removeItem(it.id)} className="print:hidden"><Trash2 className="h-4 w-4" /></Button>
                </li>
              ))}
            </ul>}
          <div className="mt-4 border-t pt-3 space-y-1 text-right">
            <div className="flex justify-between text-sm"><span>Subtotal</span><span className="tabular-nums">{brl(os.valor_total)}</span></div>
            <div className="flex justify-between items-center text-sm">
              <span>Desconto</span>
              <Input type="number" step="0.01" defaultValue={os.desconto} onBlur={e => updateDesconto(Number(e.target.value))} className="w-28 text-right print:hidden" />
              <span className="hidden print:inline tabular-nums">{brl(os.desconto)}</span>
            </div>
            <div className="flex justify-between text-lg font-display font-bold pt-2 border-t"><span>Total</span><span className="tabular-nums text-primary">{brl(total)}</span></div>
          </div>
        </CardContent>
      </Card>

      {os.observacoes && <Card><CardContent className="p-4 text-sm"><p className="text-muted-foreground text-xs mb-1">Observações</p>{os.observacoes}</CardContent></Card>}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return <div className="flex justify-between gap-3"><span className="text-muted-foreground">{label}</span><span className="text-right">{value}</span></div>;
}

function DiagnosticoEditor({ id, initial }: { id: string; initial: string | null }) {
  const qc = useQueryClient();
  const [v, setV] = useState(initial ?? "");
  return (
    <div>
      <p className="text-muted-foreground text-xs">Diagnóstico técnico</p>
      <Textarea rows={2} value={v} onChange={e => setV(e.target.value)}
        onBlur={async () => {
          await supabase.from("ordens_servico").update({ diagnostico: v || null }).eq("id", id);
          qc.invalidateQueries({ queryKey: ["ordem", id] });
        }} />
    </div>
  );
}

function AddItemDialog({ ordemId, ownerId }: { ordemId: string; ownerId: string }) {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [tipo, setTipo] = useState<"servico" | "peca">("servico");
  const [referenciaId, setReferenciaId] = useState("");
  const [descricao, setDescricao] = useState("");
  const [quantidade, setQuantidade] = useState(1);
  const [valor, setValor] = useState(0);

  const { data: servicos } = useQuery({
    queryKey: ["servicos-select"],
    queryFn: async () => (await supabase.from("servicos").select("id, nome, preco_padrao").eq("ativo", true).order("nome")).data ?? [],
  });
  const { data: pecas } = useQuery({
    queryKey: ["pecas-select"],
    queryFn: async () => (await supabase.from("pecas").select("id, nome, preco_venda, estoque").order("nome")).data ?? [],
  });

  function pickRef(id: string) {
    setReferenciaId(id);
    if (tipo === "servico") {
      const s = servicos?.find(x => x.id === id);
      if (s) { setDescricao(s.nome); setValor(Number(s.preco_padrao)); }
    } else {
      const p = pecas?.find(x => x.id === id);
      if (p) { setDescricao(p.nome); setValor(Number(p.preco_venda)); }
    }
  }

  async function add() {
    if (!descricao || valor < 0 || quantidade < 1) return toast.error("Preencha os campos");
    const { error } = await supabase.from("ordem_itens").insert({
      owner_id: ownerId, ordem_id: ordemId, tipo,
      referencia_id: referenciaId || null,
      descricao, quantidade, valor_unitario: valor,
    });
    if (error) return toast.error(error.message);
    toast.success("Item adicionado");
    setOpen(false);
    setReferenciaId(""); setDescricao(""); setQuantidade(1); setValor(0);
    qc.invalidateQueries({ queryKey: ["ordem-itens", ordemId] });
    qc.invalidateQueries({ queryKey: ["ordem", ordemId] });
    qc.invalidateQueries({ queryKey: ["pecas"] });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button size="sm"><Plus className="h-4 w-4 mr-1" />Adicionar</Button></DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Adicionar item</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <Select value={tipo} onValueChange={(v: any) => { setTipo(v); setReferenciaId(""); setDescricao(""); setValor(0); }}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="servico">Serviço</SelectItem>
              <SelectItem value="peca">Peça</SelectItem>
            </SelectContent>
          </Select>
          <Select value={referenciaId} onValueChange={pickRef}>
            <SelectTrigger><SelectValue placeholder={`Selecionar ${tipo === "servico" ? "serviço" : "peça"} (opcional)`} /></SelectTrigger>
            <SelectContent>
              {(tipo === "servico" ? servicos : pecas)?.map((x: any) => (
                <SelectItem key={x.id} value={x.id}>{x.nome}{tipo === "peca" && ` (estoque: ${x.estoque})`}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div><Label>Descrição</Label><Input value={descricao} onChange={e => setDescricao(e.target.value)} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Qtde</Label><Input type="number" min={1} value={quantidade} onChange={e => setQuantidade(Number(e.target.value))} /></div>
            <div><Label>Valor unit.</Label><Input type="number" step="0.01" value={valor} onChange={e => setValor(Number(e.target.value))} /></div>
          </div>
        </div>
        <DialogFooter><Button onClick={add}>Adicionar</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
