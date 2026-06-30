export const brl = (n: number | string | null | undefined) =>
  Number(n ?? 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export const dateBR = (s: string | null | undefined) =>
  s ? new Date(s).toLocaleDateString("pt-BR") : "—";

export const dateTimeBR = (s: string | null | undefined) =>
  s ? new Date(s).toLocaleString("pt-BR") : "—";

export const STATUS_LABEL: Record<string, string> = {
  orcamento: "Orçamento",
  aprovado: "Aprovado",
  em_andamento: "Em andamento",
  pronto: "Pronto",
  entregue: "Entregue",
  cancelado: "Cancelado",
};

export const STATUS_VARIANT: Record<string, string> = {
  orcamento: "bg-muted text-muted-foreground",
  aprovado: "bg-primary/15 text-primary border border-primary/30",
  em_andamento: "bg-accent/20 text-accent border border-accent/40",
  pronto: "bg-success/20 text-success border border-success/40",
  entregue: "bg-success/30 text-success border border-success/50",
  cancelado: "bg-destructive/15 text-destructive border border-destructive/30",
};
