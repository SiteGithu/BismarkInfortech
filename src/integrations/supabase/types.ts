export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      clientes: {
        Row: {
          cpf: string | null
          created_at: string
          email: string | null
          id: string
          nome: string
          observacoes: string | null
          owner_id: string
          telefone: string | null
          updated_at: string
        }
        Insert: {
          cpf?: string | null
          created_at?: string
          email?: string | null
          id?: string
          nome: string
          observacoes?: string | null
          owner_id: string
          telefone?: string | null
          updated_at?: string
        }
        Update: {
          cpf?: string | null
          created_at?: string
          email?: string | null
          id?: string
          nome?: string
          observacoes?: string | null
          owner_id?: string
          telefone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      movimentacoes_financeiras: {
        Row: {
          categoria: string | null
          created_at: string
          data: string
          descricao: string
          id: string
          ordem_id: string | null
          owner_id: string
          tipo: Database["public"]["Enums"]["mov_tipo"]
          valor: number
        }
        Insert: {
          categoria?: string | null
          created_at?: string
          data?: string
          descricao: string
          id?: string
          ordem_id?: string | null
          owner_id: string
          tipo: Database["public"]["Enums"]["mov_tipo"]
          valor: number
        }
        Update: {
          categoria?: string | null
          created_at?: string
          data?: string
          descricao?: string
          id?: string
          ordem_id?: string | null
          owner_id?: string
          tipo?: Database["public"]["Enums"]["mov_tipo"]
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "movimentacoes_financeiras_ordem_id_fkey"
            columns: ["ordem_id"]
            isOneToOne: false
            referencedRelation: "ordens_servico"
            referencedColumns: ["id"]
          },
        ]
      }
      ordem_itens: {
        Row: {
          created_at: string
          descricao: string
          id: string
          ordem_id: string
          owner_id: string
          quantidade: number
          referencia_id: string | null
          tipo: Database["public"]["Enums"]["item_tipo"]
          valor_unitario: number
        }
        Insert: {
          created_at?: string
          descricao: string
          id?: string
          ordem_id: string
          owner_id: string
          quantidade?: number
          referencia_id?: string | null
          tipo: Database["public"]["Enums"]["item_tipo"]
          valor_unitario?: number
        }
        Update: {
          created_at?: string
          descricao?: string
          id?: string
          ordem_id?: string
          owner_id?: string
          quantidade?: number
          referencia_id?: string | null
          tipo?: Database["public"]["Enums"]["item_tipo"]
          valor_unitario?: number
        }
        Relationships: [
          {
            foreignKeyName: "ordem_itens_ordem_id_fkey"
            columns: ["ordem_id"]
            isOneToOne: false
            referencedRelation: "ordens_servico"
            referencedColumns: ["id"]
          },
        ]
      }
      ordens_servico: {
        Row: {
          aparelho: string
          cliente_id: string | null
          created_at: string
          data_entrada: string
          data_entrega: string | null
          defeito_relatado: string | null
          desconto: number
          diagnostico: string | null
          garantia_dias: number
          id: string
          imei_sn: string | null
          marca: string | null
          modelo: string | null
          numero: number
          observacoes: string | null
          owner_id: string
          senha: string | null
          status: Database["public"]["Enums"]["os_status"]
          updated_at: string
          valor_total: number
        }
        Insert: {
          aparelho: string
          cliente_id?: string | null
          created_at?: string
          data_entrada?: string
          data_entrega?: string | null
          defeito_relatado?: string | null
          desconto?: number
          diagnostico?: string | null
          garantia_dias?: number
          id?: string
          imei_sn?: string | null
          marca?: string | null
          modelo?: string | null
          numero: number
          observacoes?: string | null
          owner_id: string
          senha?: string | null
          status?: Database["public"]["Enums"]["os_status"]
          updated_at?: string
          valor_total?: number
        }
        Update: {
          aparelho?: string
          cliente_id?: string | null
          created_at?: string
          data_entrada?: string
          data_entrega?: string | null
          defeito_relatado?: string | null
          desconto?: number
          diagnostico?: string | null
          garantia_dias?: number
          id?: string
          imei_sn?: string | null
          marca?: string | null
          modelo?: string | null
          numero?: number
          observacoes?: string | null
          owner_id?: string
          senha?: string | null
          status?: Database["public"]["Enums"]["os_status"]
          updated_at?: string
          valor_total?: number
        }
        Relationships: [
          {
            foreignKeyName: "ordens_servico_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
        ]
      }
      pecas: {
        Row: {
          created_at: string
          estoque: number
          estoque_minimo: number
          id: string
          nome: string
          owner_id: string
          preco_custo: number
          preco_venda: number
          sku: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          estoque?: number
          estoque_minimo?: number
          id?: string
          nome: string
          owner_id: string
          preco_custo?: number
          preco_venda?: number
          sku?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          estoque?: number
          estoque_minimo?: number
          id?: string
          nome?: string
          owner_id?: string
          preco_custo?: number
          preco_venda?: number
          sku?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          endereco: string | null
          id: string
          nome_loja: string
          telefone: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          endereco?: string | null
          id: string
          nome_loja?: string
          telefone?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          endereco?: string | null
          id?: string
          nome_loja?: string
          telefone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      servicos: {
        Row: {
          ativo: boolean
          categoria: string | null
          created_at: string
          descricao: string | null
          id: string
          nome: string
          owner_id: string
          preco_padrao: number
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          categoria?: string | null
          created_at?: string
          descricao?: string | null
          id?: string
          nome: string
          owner_id: string
          preco_padrao?: number
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          categoria?: string | null
          created_at?: string
          descricao?: string | null
          id?: string
          nome?: string
          owner_id?: string
          preco_padrao?: number
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      recalc_ordem_total: { Args: { p_ordem: string }; Returns: undefined }
    }
    Enums: {
      app_role: "admin" | "user"
      item_tipo: "servico" | "peca"
      mov_tipo: "entrada" | "saida"
      os_status:
        | "orcamento"
        | "aprovado"
        | "em_andamento"
        | "pronto"
        | "entregue"
        | "cancelado"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "user"],
      item_tipo: ["servico", "peca"],
      mov_tipo: ["entrada", "saida"],
      os_status: [
        "orcamento",
        "aprovado",
        "em_andamento",
        "pronto",
        "entregue",
        "cancelado",
      ],
    },
  },
} as const
