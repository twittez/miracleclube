import React, { useState, useEffect, useMemo } from 'react';
import './TaxDashboardView.css';
import {
  Percent,
  DollarSign,
  MoreVertical,
  Edit2,
  Trash2,
  X,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  Package,
  Calculator,
  Receipt,
  RotateCcw
} from 'lucide-react';

export interface TaxItem {
  id: string;
  name: string;
  type: 'percent';
  value: number;
  applyOn: 'ads' | 'faturamento';
  configured: boolean;
}

export interface FeeItem {
  id: string;
  name: string;
  rateType: 'percent' | 'fixed';
  rateValue: number;
  paymentMethod: 'Todas' | 'Pix' | 'Cartão de Crédito' | 'Boleto';
  rule: 'Valor de Faturamento' | 'Por Pedido' | 'Valor Líquido';
}

export interface ProductCostItem {
  id: string;
  productName: string;
  cost: number;
}

export interface TaxesSettings {
  impostos: TaxItem[];
  taxas: FeeItem[];
  productCosts: ProductCostItem[];
  syncNoticeDismissed: boolean;
}

interface TaxDashboardViewProps {
  orders: any[];
}

const DEFAULT_TAXES_SETTINGS: TaxesSettings = {
  impostos: [
    {
      id: 'tax_meta',
      name: 'Imposto sobre gastos em anúncios (Meta)',
      type: 'percent',
      value: 0,
      applyOn: 'ads',
      configured: false
    },
    {
      id: 'tax_nf',
      name: 'Imposto adicional',
      type: 'percent',
      value: 0,
      applyOn: 'faturamento',
      configured: false
    }
  ],
  taxas: [
    {
      id: 'fee_fixo_1',
      name: 'fixo',
      rateType: 'percent',
      rateValue: 8.0,
      paymentMethod: 'Todas',
      rule: 'Valor de Faturamento'
    },
    {
      id: 'fee_moeda_2',
      name: '$',
      rateType: 'fixed',
      rateValue: 2.99,
      paymentMethod: 'Todas',
      rule: 'Por Pedido'
    }
  ],
  productCosts: [
    {
      id: 'cogs_1',
      productName: 'Cinta Modeladora',
      cost: 21.90
    },
    {
      id: 'cogs_2',
      productName: 'Body Modelador',
      cost: 21.90
    },
    {
      id: 'cogs_3',
      productName: 'Sutiã com Renda Pós Preto',
      cost: 9.50
    }
  ],
  syncNoticeDismissed: false
};

const LOCAL_STORAGE_KEY = 'miracle_admin_taxes_settings_v1';

export const TaxDashboardView: React.FC<TaxDashboardViewProps> = ({ orders }) => {
  // Settings State
  const [settings, setSettings] = useState<TaxesSettings>(() => {
    try {
      const cached = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (cached) {
        return JSON.parse(cached);
      }
    } catch (e) {
      console.error('Error reading taxes cache:', e);
    }
    return DEFAULT_TAXES_SETTINGS;
  });

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<{ success: boolean; message: string } | null>(null);

  // Active Dropdown Menu for Fees (id of fee whose 3 dots are opened)
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);

  // Modal States
  const [feeModalOpen, setFeeModalOpen] = useState<boolean>(false);
  const [editingFee, setEditingFee] = useState<FeeItem | null>(null);
  const [feeForm, setFeeForm] = useState<{
    name: string;
    rateType: 'percent' | 'fixed';
    rateValue: string;
    paymentMethod: 'Todas' | 'Pix' | 'Cartão de Crédito' | 'Boleto';
    rule: 'Valor de Faturamento' | 'Por Pedido' | 'Valor Líquido';
  }>({
    name: '',
    rateType: 'percent',
    rateValue: '8.00',
    paymentMethod: 'Todas',
    rule: 'Valor de Faturamento'
  });

  const [taxModalOpen, setTaxModalOpen] = useState<boolean>(false);
  const [editingTax, setEditingTax] = useState<TaxItem | null>(null);
  const [taxForm, setTaxForm] = useState<{
    name: string;
    value: string;
    applyOn: 'ads' | 'faturamento';
  }>({
    name: '',
    value: '0',
    applyOn: 'faturamento'
  });

  const [cogsModalOpen, setCogsModalOpen] = useState<boolean>(false);
  const [cogsFormList, setCogsFormList] = useState<ProductCostItem[]>([]);

  // Simulation Tool State
  const [simAmount, setSimAmount] = useState<string>('87.90');
  const [simPaymentMethod, setSimPaymentMethod] = useState<'Pix' | 'Cartão de Crédito'>('Pix');

  // Load from Backend on mount
  useEffect(() => {
    const fetchBackendSettings = async () => {
      try {
        const res = await fetch('/api/admin/taxes-settings');
        if (res.ok) {
          const data = await res.json();
          if (data.taxesSettings) {
            setSettings(data.taxesSettings);
            localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data.taxesSettings));
          }
        }
      } catch (err) {
        console.warn('Using local taxes settings:', err);
      }
    };
    fetchBackendSettings();
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handleWindowClick = () => {
      if (openDropdownId) setOpenDropdownId(null);
    };
    window.addEventListener('click', handleWindowClick);
    return () => window.removeEventListener('click', handleWindowClick);
  }, [openDropdownId]);

  // Persist helper
  const saveSettingsToStorageAndServer = async (newSettings: TaxesSettings) => {
    setSettings(newSettings);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(newSettings));
    setIsLoading(true);

    try {
      const res = await fetch('/api/admin/taxes-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taxesSettings: newSettings })
      });
      if (res.ok) {
        setFeedback({ success: true, message: 'Configurações de taxas salvas com sucesso!' });
      } else {
        setFeedback({ success: true, message: 'Salvo localmente com sucesso!' });
      }
    } catch (err) {
      setFeedback({ success: true, message: 'Salvo em cache local com sucesso!' });
    } finally {
      setIsLoading(false);
      setTimeout(() => setFeedback(null), 3500);
    }
  };

  // ── Calculation Engine ────────────────────────────────────────────────────────
  const financialMetrics = useMemo(() => {
    const paidOrders = orders.filter((o) => o.status === 'paid');
    const grossTotal = paidOrders.reduce((sum, o) => sum + (Number(o.amount) || 0), 0);

    let totalFeesDeducted = 0;
    let totalCogsDeducted = 0;
    let totalTaxesDeducted = 0;

    paidOrders.forEach((order) => {
      const orderAmount = Number(order.amount) || 0;
      const isPix = Boolean(order.pixResult || order.paymentMethod === 'pix' || !order.paymentMethod);

      // Calculate Fees
      settings.taxas.forEach((fee) => {
        let applies = false;
        if (fee.paymentMethod === 'Todas') applies = true;
        else if (fee.paymentMethod === 'Pix' && isPix) applies = true;
        else if (fee.paymentMethod === 'Cartão de Crédito' && !isPix) applies = true;

        if (applies) {
          if (fee.rateType === 'percent') {
            totalFeesDeducted += orderAmount * (fee.rateValue / 100);
          } else {
            totalFeesDeducted += fee.rateValue;
          }
        }
      });

      // Calculate Impostos on Faturamento
      settings.impostos.forEach((tax) => {
        if (tax.configured && tax.value > 0 && tax.applyOn === 'faturamento') {
          totalTaxesDeducted += orderAmount * (tax.value / 100);
        }
      });

      // Calculate Product Costs
      if (order.items && Array.isArray(order.items)) {
        order.items.forEach((item: any) => {
          const itemTitle = (item.title || item.name || '').toLowerCase();
          const matchCost = settings.productCosts.find((c) =>
            itemTitle.includes(c.productName.toLowerCase()) || c.productName.toLowerCase().includes(itemTitle)
          );
          if (matchCost) {
            totalCogsDeducted += (matchCost.cost || 0) * (item.quantity || 1);
          }
        });
      }
    });

    const netReceived = grossTotal - totalFeesDeducted - totalTaxesDeducted;
    const realProfit = netReceived - totalCogsDeducted;
    const effectiveFeeRate = grossTotal > 0 ? (totalFeesDeducted / grossTotal) * 100 : 0;
    const profitMargin = grossTotal > 0 ? (realProfit / grossTotal) * 100 : 0;

    return {
      paidOrdersCount: paidOrders.length,
      grossTotal,
      totalFeesDeducted,
      totalTaxesDeducted,
      totalCogsDeducted,
      netReceived,
      realProfit,
      effectiveFeeRate,
      profitMargin
    };
  }, [orders, settings]);

  // Simulator calculation
  const simResult = useMemo(() => {
    const rawAmount = parseFloat(simAmount.replace(',', '.')) || 0;
    let feePercentTotal = 0;
    let feeFixedTotal = 0;

    settings.taxas.forEach((fee) => {
      let applies = false;
      if (fee.paymentMethod === 'Todas') applies = true;
      else if (fee.paymentMethod === 'Pix' && simPaymentMethod === 'Pix') applies = true;
      else if (fee.paymentMethod === 'Cartão de Crédito' && simPaymentMethod === 'Cartão de Crédito') applies = true;

      if (applies) {
        if (fee.rateType === 'percent') {
          feePercentTotal += rawAmount * (fee.rateValue / 100);
        } else {
          feeFixedTotal += fee.rateValue;
        }
      }
    });

    let taxTotal = 0;
    settings.impostos.forEach((t) => {
      if (t.configured && t.value > 0 && t.applyOn === 'faturamento') {
        taxTotal += rawAmount * (t.value / 100);
      }
    });

    const totalDeductions = feePercentTotal + feeFixedTotal + taxTotal;
    const netReceived = Math.max(0, rawAmount - totalDeductions);

    return {
      rawAmount,
      feePercentTotal,
      feeFixedTotal,
      taxTotal,
      totalDeductions,
      netReceived
    };
  }, [simAmount, simPaymentMethod, settings]);

  // ── Handlers: Taxas (Fees) ───────────────────────────────────────────────────
  const handleOpenAddFee = () => {
    setEditingFee(null);
    setFeeForm({
      name: '',
      rateType: 'percent',
      rateValue: '8.00',
      paymentMethod: 'Todas',
      rule: 'Valor de Faturamento'
    });
    setFeeModalOpen(true);
  };

  const handleOpenEditFee = (fee: FeeItem) => {
    setEditingFee(fee);
    setFeeForm({
      name: fee.name,
      rateType: fee.rateType,
      rateValue: fee.rateValue.toString(),
      paymentMethod: fee.paymentMethod,
      rule: fee.rule
    });
    setFeeModalOpen(true);
  };

  const handleSaveFee = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(feeForm.rateValue.replace(',', '.')) || 0;
    const name = feeForm.name.trim() || (feeForm.rateType === 'percent' ? 'fixo' : '$');

    if (editingFee) {
      // Update
      const updated = settings.taxas.map((f) =>
        f.id === editingFee.id
          ? {
              ...f,
              name,
              rateType: feeForm.rateType,
              rateValue: val,
              paymentMethod: feeForm.paymentMethod,
              rule: feeForm.rule
            }
          : f
      );
      saveSettingsToStorageAndServer({ ...settings, taxas: updated });
    } else {
      // Add new
      const newFee: FeeItem = {
        id: `fee_${Date.now()}`,
        name,
        rateType: feeForm.rateType,
        rateValue: val,
        paymentMethod: feeForm.paymentMethod,
        rule: feeForm.rule
      };
      saveSettingsToStorageAndServer({ ...settings, taxas: [...settings.taxas, newFee] });
    }
    setFeeModalOpen(false);
  };

  const handleDeleteFee = (feeId: string) => {
    const updated = settings.taxas.filter((f) => f.id !== feeId);
    saveSettingsToStorageAndServer({ ...settings, taxas: updated });
  };

  // ── Handlers: Impostos ────────────────────────────────────────────────────────
  const handleOpenAddTax = () => {
    setEditingTax(null);
    setTaxForm({
      name: '',
      value: '5.00',
      applyOn: 'faturamento'
    });
    setTaxModalOpen(true);
  };

  const handleOpenEditTax = (tax: TaxItem) => {
    setEditingTax(tax);
    setTaxForm({
      name: tax.name,
      value: tax.value ? tax.value.toString() : '0',
      applyOn: tax.applyOn
    });
    setTaxModalOpen(true);
  };

  const handleSaveTax = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(taxForm.value.replace(',', '.')) || 0;
    const name = taxForm.name.trim() || 'Imposto adicional';

    if (editingTax) {
      const updated = settings.impostos.map((t) =>
        t.id === editingTax.id
          ? { ...t, name, value: val, applyOn: taxForm.applyOn, configured: val > 0 }
          : t
      );
      saveSettingsToStorageAndServer({ ...settings, impostos: updated });
    } else {
      const newTax: TaxItem = {
        id: `tax_${Date.now()}`,
        name,
        type: 'percent',
        value: val,
        applyOn: taxForm.applyOn,
        configured: val > 0
      };
      saveSettingsToStorageAndServer({ ...settings, impostos: [...settings.impostos, newTax] });
    }
    setTaxModalOpen(false);
  };

  // ── Handlers: Custo de Produtos ───────────────────────────────────────────────
  const handleOpenEditCogs = () => {
    // Combine current with any detected from orders
    const detectedNames = new Set<string>();
    settings.productCosts.forEach((c) => detectedNames.add(c.productName));

    orders.forEach((o) => {
      if (o.items && Array.isArray(o.items)) {
        o.items.forEach((it: any) => {
          if (it.title) detectedNames.add(it.title);
        });
      }
    });

    const list: ProductCostItem[] = Array.from(detectedNames).map((name) => {
      const existing = settings.productCosts.find((c) => c.productName === name);
      return (
        existing || {
          id: `cogs_${Math.random().toString(36).substring(2, 8)}`,
          productName: name,
          cost: 0
        }
      );
    });

    setCogsFormList(list);
    setCogsModalOpen(true);
  };

  const handleSaveCogs = (e: React.FormEvent) => {
    e.preventDefault();
    saveSettingsToStorageAndServer({ ...settings, productCosts: cogsFormList });
    setCogsModalOpen(false);
  };

  const handleDismissNotice = () => {
    saveSettingsToStorageAndServer({ ...settings, syncNoticeDismissed: true });
  };

  return (
    <div className="tax-dashboard-container">
      {/* ── Header ────────────────────────────────────────────────────────── */}
      <div className="tax-dashboard-header">
        <div className="tax-dashboard-title-row">
          <div className="tax-dashboard-title">
            <Calculator size={24} style={{ color: '#ec4899' }} />
            Dashboard de Taxas & Custos
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {isLoading && (
              <span style={{ fontSize: '12px', color: '#38bdf8', fontWeight: 600 }}>
                Salvando...
              </span>
            )}
            <button
              className="tax-btn-action"
              onClick={() => saveSettingsToStorageAndServer(DEFAULT_TAXES_SETTINGS)}
              title="Restaurar padrão inicial"
            >
              <RotateCcw size={13} />
              Padrão
            </button>
          </div>
        </div>
        <div className="tax-dashboard-subtitle">
          Configure as taxas pagas por venda (gateway, antecipação, fixas), impostos e custos de produtos para cálculo de lucro real.
        </div>
      </div>

      {/* ── Feedback Banner ────────────────────────────────────────────────── */}
      {feedback && (
        <div
          style={{
            padding: '12px 18px',
            borderRadius: '8px',
            background: feedback.success ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
            border: `1px solid ${feedback.success ? 'rgba(16, 185, 129, 0.4)' : 'rgba(239, 68, 68, 0.4)'}`,
            color: feedback.success ? '#10b981' : '#ef4444',
            fontSize: '13px',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          {feedback.success ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* ── KPI Overview Cards ────────────────────────────────────────────── */}
      <div className="tax-kpi-grid">
        <div className="tax-kpi-card gross">
          <div className="tax-kpi-label">
            <DollarSign size={13} style={{ color: '#38bdf8' }} />
            Faturamento Bruto
          </div>
          <div className="tax-kpi-value">
            R$ {financialMetrics.grossTotal.toFixed(2).replace('.', ',')}
          </div>
          <div className="tax-kpi-sub">{financialMetrics.paidOrdersCount} pedidos pagos aprovados</div>
        </div>

        <div className="tax-kpi-card fees">
          <div className="tax-kpi-label">
            <Percent size={13} style={{ color: '#ef4444' }} />
            Taxas Pagas
          </div>
          <div className="tax-kpi-value" style={{ color: '#ef4444' }}>
            -R$ {financialMetrics.totalFeesDeducted.toFixed(2).replace('.', ',')}
          </div>
          <div className="tax-kpi-sub">
            Média de {financialMetrics.effectiveFeeRate.toFixed(2).replace('.', ',')}% por venda
          </div>
        </div>

        <div className="tax-kpi-card cogs">
          <div className="tax-kpi-label">
            <Package size={13} style={{ color: '#f59e0b' }} />
            Custo dos Produtos (CPV)
          </div>
          <div className="tax-kpi-value" style={{ color: '#f59e0b' }}>
            -R$ {financialMetrics.totalCogsDeducted.toFixed(2).replace('.', ',')}
          </div>
          <div className="tax-kpi-sub">Mercadoria fornecedor</div>
        </div>

        <div className="tax-kpi-card net">
          <div className="tax-kpi-label">
            <TrendingUp size={13} style={{ color: '#10b981' }} />
            Lucro Líquido Real
          </div>
          <div className="tax-kpi-value" style={{ color: '#10b981' }}>
            R$ {financialMetrics.realProfit.toFixed(2).replace('.', ',')}
          </div>
          <div className="tax-kpi-sub">
            Margem líquida real de {financialMetrics.profitMargin.toFixed(1).replace('.', ',')}%
          </div>
        </div>
      </div>

      {/* ── Main Two Column Grid (Exact Layout from Screenshot) ────────────── */}
      <div className="tax-two-col-grid">
        {/* Left Column: Imposto + Taxas */}
        <div className="tax-left-stack">
          {/* Card: Imposto */}
          <div className="tax-panel-card">
            <div className="tax-panel-header">
              <span className="tax-panel-title">Imposto</span>
              <button className="tax-btn-action" onClick={handleOpenAddTax}>
                Adicionar Imposto
              </button>
            </div>
            <div className="tax-panel-subtitle">Configure o imposto dos seus produtos:</div>

            <div className="tax-imposto-list">
              {settings.impostos.map((tax) => (
                <div key={tax.id} className="tax-imposto-row">
                  <span className="tax-imposto-name">
                    {tax.name}
                    {tax.configured && tax.value > 0 && (
                      <span className="tax-imposto-badge">
                        {tax.value.toFixed(2).replace('.', ',')}%
                      </span>
                    )}
                  </span>
                  <div>
                    {tax.configured && tax.value > 0 ? (
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button
                          className="tax-btn-small-add"
                          onClick={() => handleOpenEditTax(tax)}
                          title="Editar imposto"
                        >
                          Editar
                        </button>
                        <button
                          className="tax-fee-dots-btn"
                          onClick={() => {
                            const updated = settings.impostos.filter((t) => t.id !== tax.id);
                            saveSettingsToStorageAndServer({ ...settings, impostos: updated });
                          }}
                          title="Remover imposto"
                        >
                          <Trash2 size={14} style={{ color: '#ef4444' }} />
                        </button>
                      </div>
                    ) : (
                      <button className="tax-btn-small-add" onClick={() => handleOpenEditTax(tax)}>
                        Adicionar
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Card: Taxas */}
          <div className="tax-panel-card">
            <div className="tax-panel-header">
              <span className="tax-panel-title">Taxas</span>
              <button className="tax-btn-action" onClick={handleOpenAddFee}>
                Adicionar Taxa
              </button>
            </div>
            <div className="tax-panel-subtitle">Configure taxas adicionais:</div>

            <div className="tax-fees-list">
              {settings.taxas.map((fee) => (
                <div key={fee.id} className="tax-fee-item-card">
                  <div className="tax-fee-item-header">
                    <span className="tax-fee-item-title">{fee.name}</span>
                    <button
                      className="tax-fee-dots-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        setOpenDropdownId(openDropdownId === fee.id ? null : fee.id);
                      }}
                      aria-label="Opções da taxa"
                    >
                      <MoreVertical size={16} />
                    </button>

                    {openDropdownId === fee.id && (
                      <div
                        className="tax-fee-dropdown-menu"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          className="tax-fee-menu-item"
                          onClick={() => {
                            setOpenDropdownId(null);
                            handleOpenEditFee(fee);
                          }}
                        >
                          <Edit2 size={13} />
                          Editar Taxa
                        </button>
                        <button
                          className="tax-fee-menu-item danger"
                          onClick={() => {
                            setOpenDropdownId(null);
                            handleDeleteFee(fee.id);
                          }}
                        >
                          <Trash2 size={13} />
                          Excluir Taxa
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="tax-fee-details">
                    <div className="tax-fee-line">
                      Taxa:{' '}
                      <strong>
                        {fee.rateType === 'percent'
                          ? `${fee.rateValue.toFixed(2).replace('.', ',')}%`
                          : `R$ ${fee.rateValue.toFixed(2).replace('.', ',')}`}
                      </strong>
                    </div>
                    <div className="tax-fee-line">
                      Forma de Pagamento: <strong>{fee.paymentMethod}</strong>
                    </div>
                    {fee.rule && (
                      <div className="tax-fee-line">
                        Regra: <strong>{fee.rule}</strong>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Custo de Produtos */}
        <div className="tax-panel-card tax-cogs-card">
          <div className="tax-panel-header">
            <span className="tax-panel-title">Custo de Produtos</span>
            <button className="tax-btn-action" onClick={handleOpenEditCogs}>
              Editar
            </button>
          </div>
          <div className="tax-panel-subtitle">Configure o custo dos seus produtos:</div>

          {/* Sync Notice (Dismissible) */}
          {!settings.syncNoticeDismissed && (
            <div className="tax-sync-notice">
              <div className="tax-sync-header">
                <span className="tax-sync-title">Sincronização dos produtos</span>
                <button
                  className="tax-sync-close"
                  onClick={handleDismissNotice}
                  aria-label="Fechar aviso"
                >
                  <X size={15} />
                </button>
              </div>
              <div className="tax-sync-text">
                Para que os produtos apareçam para seleção, é necessário que pelo menos uma venda ou processamento de pedido tenha sido realizado com o devido produto.
              </div>
              <span className="tax-sync-dismiss-link" onClick={handleDismissNotice}>
                Compreendo e não quero que essa mensagem volte a aparecer.
              </span>
            </div>
          )}

          {/* Products List or Empty State */}
          {settings.productCosts.length === 0 ? (
            <div className="tax-empty-cogs">
              Nenhum custo de produto configurado ainda. Clique em &quot;Editar&quot; e depois em &quot;Adicionar custo de produto&quot; para começar.
            </div>
          ) : (
            <div className="tax-cogs-list">
              {settings.productCosts.map((item) => (
                <div key={item.id} className="tax-cog-item">
                  <span className="tax-cog-name">{item.productName}</span>
                  <span className="tax-cog-price">
                    R$ {Number(item.cost || 0).toFixed(2).replace('.', ',')}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Interactive Live Sale Simulator ───────────────────────────────── */}
      <div className="tax-breakdown-card">
        <div className="tax-panel-header">
          <span className="tax-panel-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Receipt size={18} style={{ color: '#38bdf8' }} />
            Simulador de Lucro Líquido por Venda
          </span>
        </div>
        <div className="tax-panel-subtitle" style={{ marginBottom: 0 }}>
          Digite qualquer valor de venda para ver instantaneamente as deduções das taxas configuradas e quanto você recebe líquido na conta:
        </div>

        <div className="tax-sim-grid">
          <div className="tax-sim-input-group">
            <label className="tax-sim-label">Valor da Venda (R$)</label>
            <input
              type="text"
              className="tax-sim-input"
              value={simAmount}
              onChange={(e) => setSimAmount(e.target.value)}
              placeholder="79,90"
            />
          </div>

          <div className="tax-sim-input-group">
            <label className="tax-sim-label">Forma de Pagamento</label>
            <select
              className="tax-sim-input"
              value={simPaymentMethod}
              onChange={(e) => setSimPaymentMethod(e.target.value as any)}
            >
              <option value="Pix">Pix</option>
              <option value="Cartão de Crédito">Cartão de Crédito</option>
            </select>
          </div>

          <div className="tax-sim-result-box">
            <span style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 700 }}>
              Você Recebe Líquido
            </span>
            <span className="tax-sim-result-amount">
              R$ {simResult.netReceived.toFixed(2).replace('.', ',')}
            </span>
            <span style={{ fontSize: '11px', color: '#ef4444' }}>
              Taxas descontadas: -R$ {simResult.totalDeductions.toFixed(2).replace('.', ',')}
            </span>
          </div>
        </div>
      </div>

      {/* ── MODAL: ADICIONAR / EDITAR TAXA ─────────────────────────────────── */}
      {feeModalOpen && (
        <div className="tax-modal-overlay" onClick={() => setFeeModalOpen(false)}>
          <div className="tax-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="tax-modal-header">
              <span className="tax-modal-title">
                {editingFee ? 'Editar Taxa' : 'Adicionar Nova Taxa'}
              </span>
              <button
                className="tax-sync-close"
                onClick={() => setFeeModalOpen(false)}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveFee} className="tax-modal-body">
              <div className="tax-form-group">
                <label className="tax-form-label">Nome da Taxa</label>
                <input
                  type="text"
                  className="tax-form-input"
                  value={feeForm.name}
                  onChange={(e) => setFeeForm({ ...feeForm, name: e.target.value })}
                  placeholder="Ex: fixo, $, Taxa AxxonPay, Antecipação..."
                  required
                />
              </div>

              <div className="tax-form-group">
                <label className="tax-form-label">Tipo da Taxa</label>
                <select
                  className="tax-form-select"
                  value={feeForm.rateType}
                  onChange={(e) =>
                    setFeeForm({ ...feeForm, rateType: e.target.value as any })
                  }
                >
                  <option value="percent">Percentual (%)</option>
                  <option value="fixed">Valor Fixo (R$)</option>
                </select>
              </div>

              <div className="tax-form-group">
                <label className="tax-form-label">
                  Valor {feeForm.rateType === 'percent' ? '(%)' : '(R$)'}
                </label>
                <input
                  type="text"
                  className="tax-form-input"
                  value={feeForm.rateValue}
                  onChange={(e) => setFeeForm({ ...feeForm, rateValue: e.target.value })}
                  placeholder={feeForm.rateType === 'percent' ? '8.00' : '2.99'}
                  required
                />
              </div>

              <div className="tax-form-group">
                <label className="tax-form-label">Forma de Pagamento</label>
                <select
                  className="tax-form-select"
                  value={feeForm.paymentMethod}
                  onChange={(e) =>
                    setFeeForm({ ...feeForm, paymentMethod: e.target.value as any })
                  }
                >
                  <option value="Todas">Todas</option>
                  <option value="Pix">Pix</option>
                  <option value="Cartão de Crédito">Cartão de Crédito</option>
                  <option value="Boleto">Boleto</option>
                </select>
              </div>

              <div className="tax-form-group">
                <label className="tax-form-label">Regra de Aplicação</label>
                <select
                  className="tax-form-select"
                  value={feeForm.rule}
                  onChange={(e) =>
                    setFeeForm({ ...feeForm, rule: e.target.value as any })
                  }
                >
                  <option value="Valor de Faturamento">Valor de Faturamento</option>
                  <option value="Por Pedido">Por Pedido / Transação</option>
                  <option value="Valor Líquido">Valor Líquido</option>
                </select>
              </div>

              <div className="tax-modal-footer">
                <button
                  type="button"
                  className="tax-btn-cancel"
                  onClick={() => setFeeModalOpen(false)}
                >
                  Cancelar
                </button>
                <button type="submit" className="tax-btn-submit">
                  {editingFee ? 'Salvar Alterações' : 'Adicionar Taxa'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL: ADICIONAR / EDITAR IMPOSTO ───────────────────────────────── */}
      {taxModalOpen && (
        <div className="tax-modal-overlay" onClick={() => setTaxModalOpen(false)}>
          <div className="tax-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="tax-modal-header">
              <span className="tax-modal-title">
                {editingTax ? 'Editar Imposto' : 'Configurar Imposto'}
              </span>
              <button
                className="tax-sync-close"
                onClick={() => setTaxModalOpen(false)}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveTax} className="tax-modal-body">
              <div className="tax-form-group">
                <label className="tax-form-label">Nome do Imposto</label>
                <input
                  type="text"
                  className="tax-form-input"
                  value={taxForm.name}
                  onChange={(e) => setTaxForm({ ...taxForm, name: e.target.value })}
                  placeholder="Ex: Imposto adicional, Simples Nacional..."
                  required
                />
              </div>

              <div className="tax-form-group">
                <label className="tax-form-label">Alíquota (%)</label>
                <input
                  type="text"
                  className="tax-form-input"
                  value={taxForm.value}
                  onChange={(e) => setTaxForm({ ...taxForm, value: e.target.value })}
                  placeholder="6.00"
                  required
                />
              </div>

              <div className="tax-form-group">
                <label className="tax-form-label">Aplicar Sobre</label>
                <select
                  className="tax-form-select"
                  value={taxForm.applyOn}
                  onChange={(e) =>
                    setTaxForm({ ...taxForm, applyOn: e.target.value as any })
                  }
                >
                  <option value="faturamento">Faturamento Bruto</option>
                  <option value="ads">Gastos em Anúncios (Meta)</option>
                </select>
              </div>

              <div className="tax-modal-footer">
                <button
                  type="button"
                  className="tax-btn-cancel"
                  onClick={() => setTaxModalOpen(false)}
                >
                  Cancelar
                </button>
                <button type="submit" className="tax-btn-submit">
                  Salvar Imposto
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL: EDITAR CUSTO DE PRODUTOS ───────────────────────────────── */}
      {cogsModalOpen && (
        <div className="tax-modal-overlay" onClick={() => setCogsModalOpen(false)}>
          <div className="tax-modal-card" style={{ maxWidth: '540px' }} onClick={(e) => e.stopPropagation()}>
            <div className="tax-modal-header">
              <span className="tax-modal-title">Configurar Custo dos Produtos (CPV)</span>
              <button
                className="tax-sync-close"
                onClick={() => setCogsModalOpen(false)}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveCogs} className="tax-modal-body">
              <div style={{ fontSize: '12.5px', color: '#94a3b8' }}>
                Defina o custo unitário (fornecedor/embalagem) para cálculo automático de lucro real:
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '320px', overflowY: 'auto' }}>
                {cogsFormList.map((item, idx) => (
                  <div
                    key={item.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '12px',
                      background: '#192237',
                      padding: '10px 14px',
                      borderRadius: '8px'
                    }}
                  >
                    <span style={{ fontSize: '13px', color: '#e2e8f0', flex: 1 }}>
                      {item.productName}
                    </span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', width: '130px' }}>
                      <span style={{ fontSize: '13px', color: '#94a3b8' }}>R$</span>
                      <input
                        type="text"
                        className="tax-form-input"
                        style={{ padding: '6px 10px', fontSize: '13px' }}
                        value={item.cost}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value.replace(',', '.')) || 0;
                          const copy = [...cogsFormList];
                          copy[idx] = { ...copy[idx], cost: val };
                          setCogsFormList(copy);
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div className="tax-modal-footer">
                <button
                  type="button"
                  className="tax-btn-cancel"
                  onClick={() => setCogsModalOpen(false)}
                >
                  Cancelar
                </button>
                <button type="submit" className="tax-btn-submit">
                  Salvar Custos
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
