# Bismark Inforcell — Plano de Implementação

Recriar o app no projeto Lovable (TanStack Start + React + Supabase) em vez de um único HTML, garantindo persistência real, menos bugs e fácil evolução. Tema visual "Azul Tech + Ciano" adaptado para assistência técnica de informática/celular.

## Identidade Visual

- **Paleta** (tokens em `src/styles.css`):
  - `--background` #0A1628 (deep navy) / superfícies #0F2A47
  - `--primary` #00B4D8 (ciano elétrico), `--primary-glow` #48CAE4
  - `--accent` #FFB703 (alerta/ouro suave para destaques de OS pendente)
  - Status: entrada #06D6A0, saída #EF476F, lucro #FFD166, info #48CAE4
  - Modo claro complementar (alternável) com fundo #F1F5F9
- **Tipografia**: `Space Grotesk` (display/headings) + `Inter` (body), carregadas via `<link>` no `__root.tsx`.
- **Tom**: tecnológico, circuitos sutis, gradientes ciano→azul, cards com borda luminosa, ícones lucide (Wrench, Cpu, Smartphone, HardDrive, Monitor).

## Módulos / Rotas

```
/                      Dashboard (KPIs: OS abertas, faturamento mês, lucro, estoque baixo)
/ordens                Lista de Ordens de Serviço + filtros por status
/ordens/nova           Criar OS (cliente, aparelho, defeito, serviços, peças)
/ordens/$id            Detalhe da OS (status, histórico, impressão recibo)
/clientes              CRUD de clientes
/servicos              Catálogo de serviços com preço padrão
/estoque               Peças com entrada/saída e alerta de estoque mínimo
/financeiro            Entradas/Saídas/Lucro + gráfico mensal (Recharts)
/configuracoes         Tema claro/escuro, dados da loja
```

Layout com `Sidebar` colapsável (shadcn) + topbar com toggle de tema.

## Catálogo de Serviços (seed inicial)

Troca de tela, Troca de bateria, Formatação de PC, Formatação de notebook, Limpeza interna (PC/notebook), Remoção de vírus, Instalação de Windows/Office, Backup de dados, Recuperação de dados, Troca de conector de carga, Troca de teclado, Upgrade SSD/RAM, Manutenção geral.

## Esquema de Dados (Supabase, com RLS por `owner_id = auth.uid()`)

- `profiles` (nome da loja, logo, telefone)
- `clientes` (nome, telefone, email, cpf)
- `servicos` (nome, descrição, preco_padrao, categoria)
- `pecas` (nome, sku, preco_custo, preco_venda, estoque, estoque_minimo)
- `ordens_servico` (numero, cliente_id, aparelho, marca, modelo, imei_sn, senha, defeito_relatado, diagnostico, status[orcamento|aprovado|em_andamento|pronto|entregue|cancelado], valor_total, desconto, data_entrada, data_entrega, garantia_dias, observacoes)
- `ordem_itens` (ordem_id, tipo[servico|peca], referencia_id, descricao, quantidade, valor_unitario)
- `movimentacoes_financeiras` (tipo[entrada|saida], categoria, descricao, valor, data, ordem_id?)
- `user_roles` + `has_role()` (padrão Lovable) para futuro multiusuário

Triggers: numeração automática de OS, baixa de estoque ao adicionar peça na OS, geração de entrada financeira ao marcar OS como "entregue".

## Stack Técnica

- **Frontend**: TanStack Start, React 19, shadcn/ui, Tailwind v4 (tokens semânticos), lucide-react, Recharts (gráficos), date-fns, react-hook-form + zod.
- **Server**: `createServerFn` para todas as mutações/listagens autenticadas (`requireSupabaseAuth`).
- **Auth**: rotas sob `_authenticated/` + página `/auth` (email/senha).
- **Persistência**: Supabase (já conectado).

## Fases de Entrega

1. **Fundação**: tokens de cor/tipografia, sidebar, layout, rota `/auth`, gate autenticado.
2. **Banco**: migration completa com tabelas, RLS, triggers, seed do catálogo.
3. **Clientes + Serviços + Peças**: CRUDs simples.
4. **Ordens de Serviço**: criação, edição, mudança de status, impressão.
5. **Financeiro + Dashboard**: KPIs, gráfico mensal, lista de movimentações.
6. **Polimento**: dark/light toggle, toasts, validação, vazios e loading states.

## Observação sobre formato

Você pediu "da melhor forma possível com menos risco de bugs" — por isso recomendo o app React no projeto (rotas tipadas, banco de verdade, sem perder dados ao fechar o navegador) em vez do HTML único original. Se preferir mesmo um único `index.html` standalone, me avise antes de eu começar.
