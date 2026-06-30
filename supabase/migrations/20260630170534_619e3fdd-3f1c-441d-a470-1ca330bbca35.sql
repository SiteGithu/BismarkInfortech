
-- ============= ROLES =============
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL DEFAULT 'user',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own roles" ON public.user_roles FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

-- ============= UPDATED_AT trigger =============
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

-- ============= PROFILES =============
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nome_loja TEXT NOT NULL DEFAULT 'Bismark Inforcell',
  telefone TEXT,
  endereco TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own profile" ON public.profiles FOR ALL TO authenticated USING (id = auth.uid()) WITH CHECK (id = auth.uid());
CREATE TRIGGER trg_profiles_updated BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============= CLIENTES =============
CREATE TABLE public.clientes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  telefone TEXT,
  email TEXT,
  cpf TEXT,
  observacoes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.clientes TO authenticated;
GRANT ALL ON public.clientes TO service_role;
ALTER TABLE public.clientes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own clientes" ON public.clientes FOR ALL TO authenticated USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());
CREATE TRIGGER trg_clientes_updated BEFORE UPDATE ON public.clientes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE INDEX idx_clientes_owner ON public.clientes(owner_id);

-- ============= SERVICOS =============
CREATE TABLE public.servicos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  descricao TEXT,
  categoria TEXT,
  preco_padrao NUMERIC(10,2) NOT NULL DEFAULT 0,
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.servicos TO authenticated;
GRANT ALL ON public.servicos TO service_role;
ALTER TABLE public.servicos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own servicos" ON public.servicos FOR ALL TO authenticated USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());
CREATE TRIGGER trg_servicos_updated BEFORE UPDATE ON public.servicos FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE INDEX idx_servicos_owner ON public.servicos(owner_id);

-- ============= PECAS =============
CREATE TABLE public.pecas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  sku TEXT,
  preco_custo NUMERIC(10,2) NOT NULL DEFAULT 0,
  preco_venda NUMERIC(10,2) NOT NULL DEFAULT 0,
  estoque INTEGER NOT NULL DEFAULT 0,
  estoque_minimo INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.pecas TO authenticated;
GRANT ALL ON public.pecas TO service_role;
ALTER TABLE public.pecas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own pecas" ON public.pecas FOR ALL TO authenticated USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());
CREATE TRIGGER trg_pecas_updated BEFORE UPDATE ON public.pecas FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE INDEX idx_pecas_owner ON public.pecas(owner_id);

-- ============= ORDENS DE SERVICO =============
CREATE TYPE public.os_status AS ENUM ('orcamento','aprovado','em_andamento','pronto','entregue','cancelado');

CREATE TABLE public.ordens_servico (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  numero INTEGER NOT NULL,
  cliente_id UUID REFERENCES public.clientes(id) ON DELETE SET NULL,
  aparelho TEXT NOT NULL,
  marca TEXT,
  modelo TEXT,
  imei_sn TEXT,
  senha TEXT,
  defeito_relatado TEXT,
  diagnostico TEXT,
  status os_status NOT NULL DEFAULT 'orcamento',
  valor_total NUMERIC(10,2) NOT NULL DEFAULT 0,
  desconto NUMERIC(10,2) NOT NULL DEFAULT 0,
  data_entrada TIMESTAMPTZ NOT NULL DEFAULT now(),
  data_entrega TIMESTAMPTZ,
  garantia_dias INTEGER NOT NULL DEFAULT 90,
  observacoes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (owner_id, numero)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ordens_servico TO authenticated;
GRANT ALL ON public.ordens_servico TO service_role;
ALTER TABLE public.ordens_servico ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own ordens" ON public.ordens_servico FOR ALL TO authenticated USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());
CREATE TRIGGER trg_ordens_updated BEFORE UPDATE ON public.ordens_servico FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE INDEX idx_ordens_owner ON public.ordens_servico(owner_id);
CREATE INDEX idx_ordens_status ON public.ordens_servico(owner_id, status);

-- numero automático por owner
CREATE OR REPLACE FUNCTION public.set_ordem_numero()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.numero IS NULL OR NEW.numero = 0 THEN
    SELECT COALESCE(MAX(numero),0)+1 INTO NEW.numero FROM public.ordens_servico WHERE owner_id = NEW.owner_id;
  END IF;
  RETURN NEW;
END; $$;
CREATE TRIGGER trg_ordens_numero BEFORE INSERT ON public.ordens_servico FOR EACH ROW EXECUTE FUNCTION public.set_ordem_numero();

-- ============= ORDEM ITENS =============
CREATE TYPE public.item_tipo AS ENUM ('servico','peca');

CREATE TABLE public.ordem_itens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  ordem_id UUID NOT NULL REFERENCES public.ordens_servico(id) ON DELETE CASCADE,
  tipo item_tipo NOT NULL,
  referencia_id UUID,
  descricao TEXT NOT NULL,
  quantidade INTEGER NOT NULL DEFAULT 1,
  valor_unitario NUMERIC(10,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ordem_itens TO authenticated;
GRANT ALL ON public.ordem_itens TO service_role;
ALTER TABLE public.ordem_itens ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own ordem_itens" ON public.ordem_itens FOR ALL TO authenticated USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());
CREATE INDEX idx_ordem_itens_ordem ON public.ordem_itens(ordem_id);

-- recalcula valor_total da OS e baixa estoque ao inserir peça
CREATE OR REPLACE FUNCTION public.recalc_ordem_total(p_ordem UUID)
RETURNS VOID LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  UPDATE public.ordens_servico
  SET valor_total = COALESCE((SELECT SUM(quantidade*valor_unitario) FROM public.ordem_itens WHERE ordem_id = p_ordem),0)
  WHERE id = p_ordem;
END; $$;

CREATE OR REPLACE FUNCTION public.on_ordem_item_insert()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.tipo = 'peca' AND NEW.referencia_id IS NOT NULL THEN
    UPDATE public.pecas SET estoque = estoque - NEW.quantidade WHERE id = NEW.referencia_id AND owner_id = NEW.owner_id;
  END IF;
  PERFORM public.recalc_ordem_total(NEW.ordem_id);
  RETURN NEW;
END; $$;
CREATE TRIGGER trg_ordem_item_ins AFTER INSERT ON public.ordem_itens FOR EACH ROW EXECUTE FUNCTION public.on_ordem_item_insert();

CREATE OR REPLACE FUNCTION public.on_ordem_item_delete()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF OLD.tipo = 'peca' AND OLD.referencia_id IS NOT NULL THEN
    UPDATE public.pecas SET estoque = estoque + OLD.quantidade WHERE id = OLD.referencia_id AND owner_id = OLD.owner_id;
  END IF;
  PERFORM public.recalc_ordem_total(OLD.ordem_id);
  RETURN OLD;
END; $$;
CREATE TRIGGER trg_ordem_item_del AFTER DELETE ON public.ordem_itens FOR EACH ROW EXECUTE FUNCTION public.on_ordem_item_delete();

-- ============= FINANCEIRO =============
CREATE TYPE public.mov_tipo AS ENUM ('entrada','saida');

CREATE TABLE public.movimentacoes_financeiras (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tipo mov_tipo NOT NULL,
  categoria TEXT,
  descricao TEXT NOT NULL,
  valor NUMERIC(10,2) NOT NULL,
  data DATE NOT NULL DEFAULT CURRENT_DATE,
  ordem_id UUID REFERENCES public.ordens_servico(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.movimentacoes_financeiras TO authenticated;
GRANT ALL ON public.movimentacoes_financeiras TO service_role;
ALTER TABLE public.movimentacoes_financeiras ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own movs" ON public.movimentacoes_financeiras FOR ALL TO authenticated USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());
CREATE INDEX idx_movs_owner_data ON public.movimentacoes_financeiras(owner_id, data DESC);

-- gera entrada financeira ao marcar OS como entregue
CREATE OR REPLACE FUNCTION public.on_ordem_status_change()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.status = 'entregue' AND (OLD.status IS DISTINCT FROM 'entregue') THEN
    INSERT INTO public.movimentacoes_financeiras (owner_id, tipo, categoria, descricao, valor, ordem_id)
    VALUES (NEW.owner_id, 'entrada', 'OS', 'OS #'||NEW.numero||' - '||NEW.aparelho, NEW.valor_total - NEW.desconto, NEW.id);
    IF NEW.data_entrega IS NULL THEN NEW.data_entrega = now(); END IF;
  END IF;
  RETURN NEW;
END; $$;
CREATE TRIGGER trg_ordem_status BEFORE UPDATE ON public.ordens_servico FOR EACH ROW WHEN (OLD.status IS DISTINCT FROM NEW.status) EXECUTE FUNCTION public.on_ordem_status_change();

-- ============= NEW USER: profile + role + seed catálogo =============
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id) VALUES (NEW.id);
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'user');
  INSERT INTO public.servicos (owner_id, nome, categoria, preco_padrao) VALUES
    (NEW.id, 'Troca de tela', 'Celular', 0),
    (NEW.id, 'Troca de bateria', 'Celular', 0),
    (NEW.id, 'Troca de conector de carga', 'Celular', 0),
    (NEW.id, 'Formatação de PC', 'Computador', 0),
    (NEW.id, 'Formatação de notebook', 'Computador', 0),
    (NEW.id, 'Limpeza interna (PC/notebook)', 'Computador', 0),
    (NEW.id, 'Remoção de vírus', 'Computador', 0),
    (NEW.id, 'Instalação de Windows/Office', 'Computador', 0),
    (NEW.id, 'Backup de dados', 'Computador', 0),
    (NEW.id, 'Recuperação de dados', 'Computador', 0),
    (NEW.id, 'Upgrade SSD/RAM', 'Computador', 0),
    (NEW.id, 'Troca de teclado', 'Notebook', 0),
    (NEW.id, 'Manutenção geral', 'Geral', 0);
  RETURN NEW;
END; $$;

CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
