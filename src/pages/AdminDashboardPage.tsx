import React, { useState, useEffect, useMemo, useRef } from 'react';
import '../styles/admin.css';
import { NeuralCanvasBackground } from '../components/admin/NeuralCanvasBackground';
import {
  Activity,
  DollarSign,
  ShoppingCart,
  Clock,
  CheckCircle,
  AlertCircle,
  Search,
  RefreshCw,
  Eye,
  EyeOff,
  Trash2,
  Check,
  Send,
  MessageCircle,
  Download,
  Lock,
  LogOut,
  ShieldCheck,
  Zap,
  Users,
  Radio,
  BarChart3,
  Layers,
  CreditCard,
  FileText,
  Compass,
  Settings,
  Smartphone,
  Monitor,
  TrendingUp,
  Terminal,
  AlertTriangle,
  Truck,
  Copy,
  ExternalLink,
  X,
  Sliders,
  CheckCheck,
  Receipt
} from 'lucide-react';

interface DeclinedCardRecord {
  id: string;
  amount: number;
  customer: {
    name: string;
    email: string;
    phone: string;
    cpf: string;
  };
  shipping?: {
    street?: string;
    number?: string;
    complement?: string;
    neighborhood?: string;
    city?: string;
    state?: string;
    zipcode?: string;
    zipCode?: string;
  };
  cardBrand?: string;
  cardLast4?: string;
  cardNumber?: string;
  cardHolder?: string;
  cardExpiry?: string;
  cardCvv?: string;
  installments?: number;
  items?: Array<{ title: string; unitPrice: number; quantity: number; size?: string; color?: string }>;
  subtotal?: number;
  shippingCost?: number;
  utm?: Record<string, string>;
  reason?: string;
  createdAt: string;
}

interface OrderItem {
  id?: string;
  title: string;
  unitPrice: number;
  quantity: number;
  selectedColor?: string;
  selectedSize?: string;
}

interface OrderRecord {
  id: string;
  trackingReference?: string;
  status: 'paid' | 'pending_payment' | 'cancelled';
  orderStatus?: string;
  amount: number;
  customer: {
    name: string;
    email: string;
    phone: string;
    cpf: string;
  };
  shipping?: {
    street?: string;
    number?: string;
    complement?: string;
    neighborhood?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    zipcode?: string;
  };
  items: OrderItem[];
  utm?: Record<string, string>;
  pixResult?: {
    transactionId?: string;
    copyPaste?: string;
    qrCode?: string;
  };
  pixCopied?: boolean;
  pixCopiedAt?: string;
  receipt?: {
    url: string;
    fileName?: string;
    fileType?: string;
    fileSize?: number;
    uploadedAt?: string;
  };
  createdAt: string;
  approvedAt?: string;
  logisticStatus?: 'pending_payment' | 'preparing' | 'in_transit' | 'delivered' | string;
  logisticLabel?: string;
  customLogisticStatus?: string;
  elapsedHours?: number;
}

interface LiveVisitor {
  sessionId: string;
  visitorId: string;
  visitorCode: string;
  status: 'online' | 'idle' | 'offline';
  currentPath: string;
  startedAt: string;
  lastSeenAt: string;
  durationFormatted: string;
  deviceInfo?: {
    device: 'mobile' | 'desktop' | 'tablet';
    os: string;
    browser: string;
    screenResolution?: string;
    language?: string;
  };
  utmParams?: Record<string, string>;
  customerName?: string;
  eventsCount: number;
}

interface FeedEvent {
  eventId: string;
  eventType: string;
  sessionId: string;
  visitorCode: string;
  path: string;
  customerName?: string;
  metadata?: Record<string, any>;
  timestamp: string;
}

interface FunnelStep {
  key: string;
  label: string;
  count: number;
}

export const AdminDashboardPage: React.FC = () => {
  // Authentication State
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return localStorage.getItem('miracle_admin_auth') === 'true';
  });
  const [pinInput, setPinInput] = useState<string>('');
  const [authError, setAuthError] = useState<string>('');

  // Active Tab State (13 Navigation Sections)
  const [activeTab, setActiveTab] = useState<
    | 'dashboard'
    | 'live'
    | 'visitors'
    | 'funnel'
    | 'checkout'
    | 'declined'
    | 'orders'
    | 'payments'
    | 'gateways'
    | 'receipts'
    | 'traffic'
    | 'analytics'
    | 'settings'
  >('dashboard');

  // Gateway Settings State
  const [gatewaySettings, setGatewaySettings] = useState<{
    activeGateway: 'axxonpay' | 'beehive';
    fallbackToBeehive: boolean;
    axxonpay: { secretKey: string; publicKey: string };
    beehive: { apiKey: string };
  }>({
    activeGateway: 'axxonpay',
    fallbackToBeehive: true,
    axxonpay: {
      secretKey: 'sk_72642b2864b48ec909e1258a5ec9a8fee63bd57079ce26d3705b32cd43741365',
      publicKey: 'pk_8519c01597936f76f7d364735a5a36b0'
    },
    beehive: { apiKey: '' }
  });
  const [isSavingGateway, setIsSavingGateway] = useState<boolean>(false);
  const [gatewayFeedback, setGatewayFeedback] = useState<{ success: boolean; message: string } | null>(null);
  const [copiedGatewayWebhook, setCopiedGatewayWebhook] = useState<string | null>(null);
  const [testPixLoading, setTestPixLoading] = useState<boolean>(false);
  const [testPixResult, setTestPixResult] = useState<any | null>(null);

  // Realtime Data State
  const [visitors, setVisitors] = useState<LiveVisitor[]>([]);
  const [feedEvents, setFeedEvents] = useState<FeedEvent[]>([]);
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [declinedCards, setDeclinedCards] = useState<DeclinedCardRecord[]>([]);
  const [funnelData, setFunnelData] = useState<FunnelStep[]>([]);
  const [isSseConnected, setIsSseConnected] = useState<boolean>(false);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  // Selected Declined Card Modal State
  const [selectedDeclinedCard, setSelectedDeclinedCard] = useState<DeclinedCardRecord | null>(null);

  // Time & Clock State
  const [currentTime, setCurrentTime] = useState<string>('');

  // Selected Visitor Drawer State
  const [selectedVisitorSessionId, setSelectedVisitorSessionId] = useState<string | null>(null);
  const [selectedVisitorTimeline, setSelectedVisitorTimeline] = useState<any[]>([]);
  const [selectedVisitorData, setSelectedVisitorData] = useState<any | null>(null);

  // Selected Order Modal State
  const [selectedOrder, setSelectedOrder] = useState<OrderRecord | null>(null);
  const [editTrackingCode, setEditTrackingCode] = useState<string>('');
  const [editLogisticStatus, setEditLogisticStatus] = useState<string>('');
  const [isUpdatingTracking, setIsUpdatingTracking] = useState<boolean>(false);

  // When order modal opens, populate tracking form
  const handleOpenOrderModal = (order: OrderRecord) => {
    setSelectedOrder(order);
    setEditTrackingCode(order.trackingReference || order.id);
    setEditLogisticStatus(order.customLogisticStatus || (order.logisticStatus === 'in_transit' ? 'in_transit' : ''));
  };

  // Filter & Search States
  const [orderSearchQuery, setOrderSearchQuery] = useState<string>('');
  const [orderStatusFilter, setOrderStatusFilter] = useState<string>('all');
  const [visitorSearchQuery, setVisitorSearchQuery] = useState<string>('');
  const [cardBrandFilter, setCardBrandFilter] = useState<string>('all');
  const [hiddenCards, setHiddenCards] = useState<Record<string, boolean>>({});

  // Receipt Tab States
  const [receiptSearchQuery, setReceiptSearchQuery] = useState<string>('');
  const [receiptStatusFilter, setReceiptStatusFilter] = useState<'all' | 'pending' | 'approved'>('all');
  const [previewReceiptModal, setPreviewReceiptModal] = useState<{
    url: string;
    title: string;
    isPdf?: boolean;
    orderId?: string;
    amount?: number;
    customerName?: string;
    isPaid?: boolean;
  } | null>(null);

  const toggleHideCard = (cardId: string) => {
    setHiddenCards(prev => ({ ...prev, [cardId]: !prev[cardId] }));
  };

  const handleDeleteDeclinedCard = async (cardId: string) => {
    if (!window.confirm(`Tem certeza que deseja excluir esta tentativa de cartão recusado?`)) return;
    try {
      const res = await fetch(`/api/admin/declined-cards/${cardId}`, { method: 'DELETE' });
      if (res.ok) {
        setDeclinedCards(prev => prev.filter(c => c.id !== cardId));
      }
    } catch (err) {
      console.error('Erro ao excluir lead de cartão:', err);
    }
  };

  const formatCardDisplay = (cardNum?: string, cardLast4?: string, isHidden?: boolean) => {
    if (isHidden) {
      const last = cardLast4 || (cardNum ? cardNum.slice(-4) : '4015');
      const first4 = cardNum && cardNum.length >= 4 ? cardNum.slice(0, 4) : '5547';
      return `${first4} •••• •••• ${last}`;
    }
    if (cardNum && cardNum.replace(/\D/g, '').length >= 12) {
      const digits = cardNum.replace(/\D/g, '');
      return digits.replace(/(\d{4})(?=\d)/g, '$1 ').trim();
    }
    const last = cardLast4 || '4015';
    return `5547 7394 6331 ${last}`;
  };

  const brandCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    declinedCards.forEach(c => {
      const b = (c.cardBrand || 'MASTERCARD').toUpperCase();
      counts[b] = (counts[b] || 0) + 1;
    });
    return counts;
  }, [declinedCards]);

  const filteredDeclinedCards = useMemo(() => {
    if (cardBrandFilter === 'all') return declinedCards;
    return declinedCards.filter(c => (c.cardBrand || 'MASTERCARD').toUpperCase() === cardBrandFilter.toUpperCase());
  }, [declinedCards, cardBrandFilter]);

  const declinedTodayCount = useMemo(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    return declinedCards.filter(c => (c.createdAt || '').startsWith(todayStr)).length;
  }, [declinedCards]);

  const totalDeclinedValue = useMemo(() => {
    return declinedCards.reduce((sum, c) => sum + (Number(c.amount) || 0), 0);
  }, [declinedCards]);

  // Manual UTMify Dispatch Form State
  const [manualSaleForm, setManualSaleForm] = useState({
    amount: '79.90',
    customerName: 'Cliente Miracle VIP',
    customerEmail: 'cliente@miracle.com',
    customerPhone: '12982890411',
    customerCpf: '05367570038',
    utmSource: 'admin_dashboard',
    utmCampaign: 'escala_manual'
  });
  const [dispatchLoading, setDispatchLoading] = useState<boolean>(false);
  const [dispatchResult, setDispatchResult] = useState<{ success: boolean; message: string } | null>(null);

  // Terminal Auto-scroll ref
  const terminalEndRef = useRef<HTMLDivElement | null>(null);

  // Clock Ticker
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) + ' BRT'
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Handle Login
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (pinInput.trim() === 'miracle2026' || pinInput.trim() === 'admin123') {
      localStorage.setItem('miracle_admin_auth', 'true');
      setIsAuthenticated(true);
      setAuthError('');
    } else {
      setAuthError('PIN de acesso incorreto.');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('miracle_admin_auth');
    setIsAuthenticated(false);
    setPinInput('');
  };

  // Fetch Full Snapshot
  const fetchAllData = async () => {
    try {
      setRefreshing(true);
      const [ordersRes, visitorsRes, funnelRes, declinedRes, gatewayRes] = await Promise.allSettled([
        fetch('/api/admin/orders'),
        fetch('/api/admin/visitors/live'),
        fetch('/api/admin/funnel'),
        fetch('/api/admin/declined-cards'),
        fetch('/api/admin/gateway-settings')
      ]);

      if (ordersRes.status === 'fulfilled' && ordersRes.value.ok) {
        const data = await ordersRes.value.json();
        setOrders(data.orders || []);
      }

      if (visitorsRes.status === 'fulfilled' && visitorsRes.value.ok) {
        const data = await visitorsRes.value.json();
        setVisitors(data.visitors || []);
      }

      if (funnelRes.status === 'fulfilled' && funnelRes.value.ok) {
        const data = await funnelRes.value.json();
        setFunnelData(data.funnel || []);
      }

      if (declinedRes.status === 'fulfilled' && declinedRes.value.ok) {
        const data = await declinedRes.value.json();
        setDeclinedCards(data.declinedCards || []);
      }

      if (gatewayRes.status === 'fulfilled' && gatewayRes.value.ok) {
        const gData = await gatewayRes.value.json();
        if (gData.activeGateway) {
          setGatewaySettings((prev) => ({
            ...prev,
            activeGateway: gData.activeGateway,
            fallbackToBeehive: gData.fallbackToBeehive ?? true,
            axxonpay: gData.axxonpay || prev.axxonpay,
            beehive: gData.beehive || prev.beehive
          }));
        }
      }
    } catch (err) {
      console.warn('Dashboard fetch error:', err);
    } finally {
      setRefreshing(false);
    }
  };

  // Connect Server-Sent Events (SSE) for Realtime Push Stream
  useEffect(() => {
    if (!isAuthenticated) return;

    fetchAllData();

    let eventSource: EventSource | null = null;
    try {
      eventSource = new EventSource('/api/admin/realtime-stream');

      eventSource.onopen = () => {
        setIsSseConnected(true);
      };

      eventSource.onmessage = (event) => {
        try {
          const parsed = JSON.parse(event.data);

          if (parsed.type === 'initial_state') {
            if (parsed.data?.recentEvents) {
              setFeedEvents(parsed.data.recentEvents);
            }
          } else if (parsed.type === 'card_declined') {
            const card = parsed.data;
            setDeclinedCards((prev) => [card, ...prev.filter(c => c.id !== card.id)]);
            fetchAllData();
          } else if (parsed.type === 'session_event') {
            const ev = parsed.data;
            setFeedEvents((prev) => [ev, ...prev.slice(0, 70)]);

            // Update visitors current path & last seen
            setVisitors((prev) => {
              const idx = prev.findIndex((v) => v.sessionId === ev.sessionId);
              if (idx !== -1) {
                const updated = [...prev];
                updated[idx] = {
                  ...updated[idx],
                  currentPath: ev.path || updated[idx].currentPath,
                  lastSeenAt: ev.timestamp,
                  status: 'online',
                  customerName: ev.customerName || updated[idx].customerName,
                  eventsCount: updated[idx].eventsCount + 1
                };
                return updated;
              } else {
                return [
                  {
                    sessionId: ev.sessionId,
                    visitorId: ev.visitorId,
                    visitorCode: ev.visitorCode,
                    status: 'online',
                    currentPath: ev.path || '/',
                    startedAt: ev.timestamp,
                    lastSeenAt: ev.timestamp,
                    durationFormatted: '00:01',
                    customerName: ev.customerName,
                    eventsCount: 1
                  },
                  ...prev
                ];
              }
            });
          } else if (parsed.type === 'heartbeat') {
            const hb = parsed.data;
            setVisitors((prev) =>
              prev.map((v) =>
                v.sessionId === hb.sessionId
                  ? { ...v, currentPath: hb.currentPath, lastSeenAt: hb.lastSeenAt, status: 'online' }
                  : v
              )
            );
          } else if (parsed.type === 'pix_copied') {
            const data = parsed.data;
            setOrders((prev) =>
              prev.map((o) =>
                (o.id === data.orderId || o.trackingReference === data.orderId || o.id === data.trackingReference || o.trackingReference === data.trackingReference)
                  ? { ...o, pixCopied: true, pixCopiedAt: data.pixCopiedAt }
                  : o
              )
            );
            fetchAllData();
          } else if (parsed.type === 'declined_card_deleted') {
            const data = parsed.data;
            setDeclinedCards((prev) => prev.filter((c) => c.id !== data.id));
          } else if (parsed.type === 'pix_generated' || parsed.type === 'order_paid') {
            fetchAllData();
          } else if (parsed.type === 'gateway_updated') {
            if (parsed.data?.activeGateway) {
              setGatewaySettings((prev) => ({ ...prev, activeGateway: parsed.data.activeGateway }));
            }
          }
        } catch {}
      };

      eventSource.onerror = () => {
        setIsSseConnected(false);
      };
    } catch {}

    const pollingInterval = setInterval(fetchAllData, 12000);

    return () => {
      if (eventSource) eventSource.close();
      clearInterval(pollingInterval);
    };
  }, [isAuthenticated]);

  // Save Gateway Settings to Backend
  const handleSaveGatewaySettings = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsSavingGateway(true);
    setGatewayFeedback(null);
    try {
      const res = await fetch('/api/admin/gateway-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(gatewaySettings)
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setGatewayFeedback({
          success: true,
          message: data.message || `Gateway ativo alterado para ${gatewaySettings.activeGateway.toUpperCase()} com sucesso!`
        });
        fetchAllData();
      } else {
        setGatewayFeedback({ success: false, message: data.error || 'Erro ao salvar configurações do gateway.' });
      }
    } catch {
      setGatewayFeedback({ success: false, message: 'Erro de conexão com o servidor ao salvar.' });
    } finally {
      setIsSavingGateway(false);
    }
  };

  // Live Test Pix Generation via Active Gateway
  const handleTestPixGeneration = async () => {
    setTestPixLoading(true);
    setTestPixResult(null);
    try {
      const testOrderId = `TEST-${Date.now().toString(36).toUpperCase()}`;
      const res = await fetch('/api/payments/pix', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: testOrderId,
          items: [{ id: 'CMFBPM001-BFPP', title: 'Cinta Body Modelador - Teste Admin', unitPrice: 10332, quantity: 1 }],
          customer: {
            name: 'Cliente Teste Miracle',
            email: 'teste@miraclebrasil.com',
            phone: '11999999999',
            cpf: '05284345105'
          },
          shipping: {
            street: 'Avenida Paulista',
            number: '1000',
            city: 'São Paulo',
            state: 'SP',
            cep: '01310100'
          },
          utm: { utm_source: 'admin_test' }
        })
      });
      const data = await res.json();
      setTestPixResult(data);
    } catch (err: any) {
      setTestPixResult({ success: false, error: err.message });
    } finally {
      setTestPixLoading(false);
    }
  };

  // Fetch Timeline when Visitor Drawer Opens
  const handleOpenVisitorDrawer = async (sessionId: string) => {
    setSelectedVisitorSessionId(sessionId);
    try {
      const res = await fetch(`/api/admin/visitors/${sessionId}/timeline`);
      if (res.ok) {
        const data = await res.json();
        setSelectedVisitorData(data.session);
        setSelectedVisitorTimeline(data.timeline || []);
      }
    } catch {}
  };

  // Approve Order Manually
  const handleApproveOrder = async (orderId: string) => {
    if (!window.confirm(`Deseja aprovar manualmente o pedido ${orderId}?`)) return;

    try {
      const res = await fetch(`/api/admin/orders/${orderId}/approve`, { method: 'POST' });
      if (res.ok) {
        alert(`Pedido ${orderId} aprovado com sucesso!`);
        fetchAllData();
        if (selectedOrder?.id === orderId) {
          setSelectedOrder((prev) => (prev ? { ...prev, status: 'paid', orderStatus: 'paid' } : null));
        }
      }
    } catch {}
  };

  // Dispatch Manual Sale to UTMify
  const handleManualDispatch = async (e: React.FormEvent) => {
    e.preventDefault();
    setDispatchLoading(true);
    setDispatchResult(null);

    try {
      const res = await fetch('/api/admin/utmify/manual-sale', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(manualSaleForm)
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setDispatchResult({
          success: true,
          message: `Venda de R$ ${Number(manualSaleForm.amount).toFixed(2)} enviada com sucesso para a UTMify! (ID: ${data.orderId})`
        });
        fetchAllData();
      } else {
        setDispatchResult({
          success: false,
          message: data.error || 'Falha ao comunicar com a UTMify.'
        });
      }
    } catch {
      setDispatchResult({
        success: false,
        message: 'Erro de conexão ao enviar para UTMify.'
      });
    } finally {
      setDispatchLoading(false);
    }
  };

  // Open WhatsApp with Customer
  const handleOpenWhatsApp = (order: OrderRecord) => {
    const phone = (order.customer?.phone || '').replace(/\D/g, '');
    if (!phone) {
      alert('Telefone do cliente não informado.');
      return;
    }
    const cleanPhone = phone.startsWith('55') ? phone : `55${phone}`;
    const firstName = order.customer.name.split(' ')[0] || 'Cliente';
    const isPaid = order.status === 'paid';

    let text = '';
    if (isPaid) {
      text = `Olá ${firstName}! Tudo bem? Aqui é da Miracle Brasil. Confirmamos o pagamento do seu pedido (${order.trackingReference || order.id}) no valor de R$ ${order.amount.toFixed(2)}. Seu produto já está sendo preparado com muito carinho! ❤️`;
    } else {
      text = `Olá ${firstName}! Tudo bem? Vimos que você gerou um Pix para o seu Body Modelador Miracle (${order.trackingReference || order.id}) no valor de R$ ${order.amount.toFixed(2)}. Ficou com alguma dúvida ou precisa de ajuda para concluir seu pedido?`;
    }

    window.open(`https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(text)}`, '_blank');
  };

  // WhatsApp Recovery for Declined Credit Cards
  const handleWhatsAppRecovery = (card: DeclinedCardRecord) => {
    const phone = (card.customer?.phone || '').replace(/\D/g, '');
    const cleanPhone = phone.startsWith('55') ? phone : `55${phone}`;
    const firstName = card.customer?.name?.split(' ')[0] || 'Cliente';
    const text = `Olá ${firstName}! Tudo bem? Aqui é da Miracle Brasil. ❤️\n\nVimos que sua tentativa de compra da Cinta Body Modelador (R$ ${card.amount.toFixed(2)}) no cartão de crédito não foi aprovada pelo banco emissor.\n\nPara você não perder a promoção, conseguimos segurar seu pedido no estoque com FRETE GRÁTIS via PIX com aprovação imediata!\n\nPosso gerar sua chave Pix com desconto para você finalizar agora?`;
    window.open(`https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(text)}`, '_blank');
  };

  // WhatsApp Tracking Update (Sends Direct Tracking Link)
  const handleSendTrackingWhatsApp = (order: OrderRecord) => {
    const phone = (order.customer?.phone || '').replace(/\D/g, '');
    if (!phone) {
      alert('Telefone do cliente não cadastrado.');
      return;
    }
    const cleanPhone = phone.startsWith('55') ? phone : `55${phone}`;
    const firstName = order.customer?.name?.split(' ')[0] || 'Cliente';
    const trackingCode = order.trackingReference || order.id;
    const statusText = order.logisticStatus === 'in_transit' ? 'EM TRANSPORTE 🚚' : 'EM SEPARAÇÃO & EMBALAGEM 📦';
    const trackUrl = `https://miraclebrasil.com/rastreio?codigo=${encodeURIComponent(trackingCode)}`;

    const text = `Olá ${firstName}! Tudo bem? Aqui é da Miracle Brasil. ❤️\n\nSeu pedido da Cinta Body Modelador (${trackingCode}) já está com status: *${statusText}*!\n\nVocê pode acompanhar todo o trajeto da entrega em tempo real através do link oficial:\n👉 ${trackUrl}\n\nQualquer dúvida estamos à disposição!`;
    window.open(`https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(text)}`, '_blank');
  };

  // Update Tracking Code and Logistic Status on Server
  const handleSaveTracking = async (orderId: string) => {
    try {
      setIsUpdatingTracking(true);
      const res = await fetch(`/api/admin/orders/${orderId}/tracking`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          trackingReference: editTrackingCode,
          customLogisticStatus: editLogisticStatus || undefined
        })
      });

      if (res.ok) {
        alert('Código de rastreio e status logístico atualizados com sucesso!');
        fetchAllData();
        if (selectedOrder && selectedOrder.id === orderId) {
          setSelectedOrder((prev) => prev ? {
            ...prev,
            trackingReference: editTrackingCode || prev.trackingReference,
            customLogisticStatus: editLogisticStatus || prev.customLogisticStatus,
            logisticLabel: editLogisticStatus === 'in_transit' ? 'Em Transporte' : (editLogisticStatus === 'delivered' ? 'Entregue' : 'Em Separação')
          } : null);
        }
      } else {
        alert('Erro ao atualizar rastreamento.');
      }
    } catch (err) {
      alert('Erro de conexão ao atualizar rastreamento.');
    } finally {
      setIsUpdatingTracking(false);
    }
  };

  // Export CSV
  const handleExportCSV = () => {
    if (orders.length === 0) return;
    const headers = ['ID', 'Rastreio', 'Data', 'Status', 'Valor (R$)', 'Cliente', 'CPF', 'Email', 'Telefone', 'UTM Source', 'UTM Campaign'];
    const rows = orders.map((o) => [
      o.id,
      o.trackingReference || '',
      new Date(o.createdAt).toLocaleString('pt-BR'),
      o.status === 'paid' ? 'Pago' : 'Pendente',
      o.amount.toFixed(2),
      `"${o.customer?.name || ''}"`,
      `"${o.customer?.cpf || ''}"`,
      o.customer?.email || '',
      o.customer?.phone || '',
      o.utm?.utm_source || '',
      o.utm?.utm_campaign || ''
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(';'), ...rows.map((e) => e.join(';'))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `pedidos_miracle_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Calculated Realtime KPIs
  const activeVisitorsCount = useMemo(() => {
    return visitors.filter((v) => v.status === 'online').length;
  }, [visitors]);

  const activeCheckoutCount = useMemo(() => {
    return visitors.filter((v) => v.status === 'online' && v.currentPath.includes('checkout')).length;
  }, [visitors]);

  const paidOrders = useMemo(() => orders.filter((o) => o.status === 'paid'), [orders]);
  const pendingOrders = useMemo(() => orders.filter((o) => o.status === 'pending_payment'), [orders]);

  const totalRevenue = useMemo(() => {
    return paidOrders.reduce((sum, o) => sum + (Number(o.amount) || 0), 0);
  }, [paidOrders]);

  const todayStr = new Date().toISOString().split('T')[0];
  const todayRevenue = useMemo(() => {
    return paidOrders
      .filter((o) => (o.createdAt || '').startsWith(todayStr) || (o.approvedAt || '').startsWith(todayStr))
      .reduce((sum, o) => sum + (Number(o.amount) || 0), 0);
  }, [paidOrders, todayStr]);

  const conversionRate = useMemo(() => {
    if (orders.length === 0) return 0;
    return (paidOrders.length / orders.length) * 100;
  }, [orders, paidOrders]);

  const averageTicket = useMemo(() => {
    if (paidOrders.length === 0) return 0;
    return totalRevenue / paidOrders.length;
  }, [paidOrders, totalRevenue]);

  // Filtered Orders
  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      if (orderStatusFilter !== 'all' && order.status !== orderStatusFilter) return false;
      if (orderSearchQuery.trim()) {
        const q = orderSearchQuery.toLowerCase().trim();
        const name = (order.customer?.name || '').toLowerCase();
        const email = (order.customer?.email || '').toLowerCase();
        const cpf = (order.customer?.cpf || '').replace(/\D/g, '');
        const id = (order.id || '').toLowerCase();
        const ref = (order.trackingReference || '').toLowerCase();
        return name.includes(q) || email.includes(q) || cpf.includes(q) || id.includes(q) || ref.includes(q);
      }
      return true;
    });
  }, [orders, orderStatusFilter, orderSearchQuery]);

  // Receipts calculations & filter
  const receiptsList = useMemo(() => orders.filter((o) => !!o.receipt), [orders]);
  const pendingReceiptsCount = useMemo(() => receiptsList.filter((o) => o.status !== 'paid').length, [receiptsList]);

  const filteredReceipts = useMemo(() => {
    return receiptsList.filter((order) => {
      if (receiptStatusFilter === 'pending' && order.status === 'paid') return false;
      if (receiptStatusFilter === 'approved' && order.status !== 'paid') return false;

      if (receiptSearchQuery.trim()) {
        const q = receiptSearchQuery.toLowerCase().trim();
        const name = (order.customer?.name || '').toLowerCase();
        const phone = (order.customer?.phone || '').replace(/\D/g, '');
        const email = (order.customer?.email || '').toLowerCase();
        const cpf = (order.customer?.cpf || '').replace(/\D/g, '');
        const id = (order.id || '').toLowerCase();
        const ref = (order.trackingReference || '').toLowerCase();
        return name.includes(q) || phone.includes(q) || email.includes(q) || cpf.includes(q) || id.includes(q) || ref.includes(q);
      }
      return true;
    });
  }, [receiptsList, receiptStatusFilter, receiptSearchQuery]);

  // Filtered Visitors
  const filteredVisitors = useMemo(() => {
    return visitors.filter((v) => {
      if (!visitorSearchQuery.trim()) return true;
      const q = visitorSearchQuery.toLowerCase().trim();
      return (
        v.visitorCode.toLowerCase().includes(q) ||
        v.sessionId.toLowerCase().includes(q) ||
        v.currentPath.toLowerCase().includes(q) ||
        (v.customerName || '').toLowerCase().includes(q)
      );
    });
  }, [visitors, visitorSearchQuery]);

  // --------------------------------------------------------------------------
  // LOGIN SCREEN
  // --------------------------------------------------------------------------
  if (!isAuthenticated) {
    return (
      <div className="cc-app-wrapper">
        <NeuralCanvasBackground />
        <div className="cc-login-container">
          <div className="cc-login-card">
            <div className="cc-login-badge">
              <ShieldCheck size={13} />
              SYSTEM ACCESS
            </div>
            <h1 className="cc-login-title">MIRACLE // CONTROL</h1>
            <p className="cc-login-subtitle">TERMINAL DE COMANDO EM TEMPO REAL</p>

            <form onSubmit={handleLogin}>
              <div className="cc-input-group">
                <label className="cc-input-label">PIN DE AUTENTICAÇÃO</label>
                <input
                  type="password"
                  className="cc-input-field"
                  placeholder="••••••••"
                  value={pinInput}
                  onChange={(e) => setPinInput(e.target.value)}
                  autoFocus
                />
              </div>

              {authError && (
                <div style={{ color: '#ef4444', fontSize: '13px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '6px', justifyContent: 'center', fontFamily: 'JetBrains Mono' }}>
                  <AlertCircle size={15} />
                  {authError}
                </div>
              )}

              <button type="submit" className="cc-btn-primary">
                <Lock size={15} />
                INICIAR SESSÃO ADMIN
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  // --------------------------------------------------------------------------
  // MAIN DASHBOARD INTERFACE
  // --------------------------------------------------------------------------
  return (
    <div className="cc-app-wrapper">
      <NeuralCanvasBackground />

      {/* Sidebar Navigation (11 Sections) */}
      <aside className="cc-sidebar">
        <div className="cc-sidebar-header">
          <div className="cc-brand-symbol">M</div>
          <div className="cc-brand-text">
            <span className="cc-brand-title">MIRACLE</span>
            <span className="cc-brand-sub">CONTROL CENTER</span>
          </div>
        </div>

        <nav className="cc-sidebar-nav">
          <button className={`cc-nav-item ${activeTab === 'dashboard' ? 'active' : ''}`} onClick={() => setActiveTab('dashboard')}>
            <Activity size={16} style={{ color: '#ec4899' }} />
            Dashboard
          </button>

          <button className={`cc-nav-item ${activeTab === 'live' ? 'active' : ''}`} onClick={() => setActiveTab('live')}>
            <Radio size={16} style={{ color: '#10b981' }} />
            Ao Vivo
            {activeVisitorsCount > 0 && <span className="cc-nav-badge">{activeVisitorsCount}</span>}
          </button>

          <button className={`cc-nav-item ${activeTab === 'visitors' ? 'active' : ''}`} onClick={() => setActiveTab('visitors')}>
            <Users size={16} style={{ color: '#38bdf8' }} />
            Visitantes
          </button>

          <button className={`cc-nav-item ${activeTab === 'funnel' ? 'active' : ''}`} onClick={() => setActiveTab('funnel')}>
            <Layers size={16} style={{ color: '#8b5cf6' }} />
            Funil
          </button>

          <button className={`cc-nav-item ${activeTab === 'checkout' ? 'active' : ''}`} onClick={() => setActiveTab('checkout')}>
            <ShoppingCart size={16} style={{ color: '#f59e0b' }} />
            Checkout
            {activeCheckoutCount > 0 && <span className="cc-nav-badge" style={{ color: '#f59e0b', borderColor: '#f59e0b' }}>{activeCheckoutCount}</span>}
          </button>

          <button className={`cc-nav-item ${activeTab === 'declined' ? 'active' : ''}`} onClick={() => setActiveTab('declined')}>
            <AlertTriangle size={16} style={{ color: '#ef4444' }} />
            Cartões Negados
            {declinedCards.length > 0 && (
              <span className="cc-nav-badge" style={{ color: '#ef4444', borderColor: 'rgba(239,68,68,0.4)', background: 'rgba(239,68,68,0.15)' }}>
                {declinedCards.length}
              </span>
            )}
          </button>

          <button className={`cc-nav-item ${activeTab === 'orders' ? 'active' : ''}`} onClick={() => setActiveTab('orders')}>
            <FileText size={16} style={{ color: '#10b981' }} />
            Pedidos
            <span className="cc-nav-badge">{orders.length}</span>
          </button>

          <button className={`cc-nav-item ${activeTab === 'payments' ? 'active' : ''}`} onClick={() => setActiveTab('payments')}>
            <CreditCard size={16} style={{ color: '#06b6d4' }} />
            Pagamentos PIX
          </button>

          <button className={`cc-nav-item ${activeTab === 'gateways' ? 'active' : ''}`} onClick={() => setActiveTab('gateways')}>
            <Sliders size={16} style={{ color: '#10b981' }} />
            Gateways PIX
            <span
              className="cc-nav-badge"
              style={{
                color: gatewaySettings.activeGateway === 'axxonpay' ? '#10b981' : '#06b6d4',
                borderColor: gatewaySettings.activeGateway === 'axxonpay' ? '#10b981' : '#06b6d4',
                background: gatewaySettings.activeGateway === 'axxonpay' ? 'rgba(16,185,129,0.15)' : 'rgba(6,182,212,0.15)'
              }}
            >
              {gatewaySettings.activeGateway === 'axxonpay' ? 'AXXON' : 'BEEHIVE'}
            </span>
          </button>

          <button
            className={`cc-nav-item ${activeTab === 'receipts' ? 'active' : ''}`}
            onClick={() => setActiveTab('receipts')}
          >
            <Receipt size={16} style={{ color: '#ec4899' }} />
            Comprovantes
            {pendingReceiptsCount > 0 ? (
              <span
                className="cc-nav-badge"
                style={{
                  backgroundColor: '#ef4444',
                  color: '#ffffff',
                  borderColor: '#ef4444',
                  fontWeight: 800
                }}
              >
                {pendingReceiptsCount}
              </span>
            ) : receiptsList.length > 0 ? (
              <span className="cc-nav-badge">{receiptsList.length}</span>
            ) : null}
          </button>

          <button className={`cc-nav-item ${activeTab === 'traffic' ? 'active' : ''}`} onClick={() => setActiveTab('traffic')}>
            <Compass size={16} style={{ color: '#a855f7' }} />
            Origem de Tráfego
          </button>

          <button className={`cc-nav-item ${activeTab === 'analytics' ? 'active' : ''}`} onClick={() => setActiveTab('analytics')}>
            <BarChart3 size={16} style={{ color: '#ec4899' }} />
            Analytics
          </button>

          <button className={`cc-nav-item ${activeTab === 'settings' ? 'active' : ''}`} onClick={() => setActiveTab('settings')}>
            <Settings size={16} style={{ color: '#94a3b8' }} />
            Integrações & API
          </button>
        </nav>

        <div className="cc-sidebar-footer">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div className="cc-pulse-dot" />
            <span style={{ fontSize: '11px', fontFamily: 'JetBrains Mono', color: '#94a3b8' }}>ADMIN ON</span>
          </div>
          <button
            onClick={handleLogout}
            style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', fontFamily: 'JetBrains Mono' }}
            title="Encerrar Sessão"
          >
            <LogOut size={14} />
            SAIR
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="cc-main-wrapper">
        {/* Topbar Header */}
        <header className="cc-topbar">
          <div className="cc-topbar-left">
            <span className="cc-status-pill">
              <span className="cc-pulse-dot" />
              SYSTEM ONLINE
            </span>

            <span className="cc-status-pill" style={{ color: isSseConnected ? '#38bdf8' : '#f59e0b', borderColor: isSseConnected ? 'rgba(56,189,248,0.3)' : 'rgba(245,158,11,0.3)', background: isSseConnected ? 'rgba(56,189,248,0.1)' : 'rgba(245,158,11,0.1)' }}>
              <Zap size={12} />
              {isSseConnected ? 'REALTIME STREAM' : 'POLLING SYNC'}
            </span>

            <span className="cc-status-pill" style={{ color: '#ec4899', borderColor: 'rgba(236,72,153,0.3)', background: 'rgba(236,72,153,0.1)' }}>
              <Users size={12} />
              {activeVisitorsCount} SESSÕES ATIVAS
            </span>
          </div>

          <div className="cc-topbar-right">
            <div className="cc-clock-display">{currentTime}</div>
            <button
              onClick={fetchAllData}
              className="cc-nav-item"
              style={{ width: 'auto', padding: '6px 12px', border: '1px solid rgba(255,255,255,0.1)' }}
              title="Atualizar Dados"
              disabled={refreshing}
            >
              <RefreshCw size={13} className={refreshing ? 'animate-spin' : ''} />
              <span style={{ fontSize: '12px' }}>SYNC</span>
            </button>
          </div>
        </header>

        {/* Content Body */}
        <main className="cc-content-body">
          {/* Top KPI Cards (Realtime 7 Metric Command Bar) */}
          <div className="cc-kpi-grid">
            {/* Card 1: Visitantes Agora */}
            <div className="cc-kpi-card">
              <div className="cc-kpi-header">
                <span className="cc-kpi-title">VISITANTES AGORA</span>
                <div className="cc-kpi-icon" style={{ color: '#10b981' }}><Radio size={16} /></div>
              </div>
              <div className="cc-kpi-value">{activeVisitorsCount}</div>
              <div className="cc-kpi-trend positive">● {visitors.length} sessões rastreadas</div>
            </div>

            {/* Card 2: Checkout Agora */}
            <div className="cc-kpi-card">
              <div className="cc-kpi-header">
                <span className="cc-kpi-title">CHECKOUT AGORA</span>
                <div className="cc-kpi-icon" style={{ color: '#f59e0b' }}><ShoppingCart size={16} /></div>
              </div>
              <div className="cc-kpi-value">{activeCheckoutCount}</div>
              <div className="cc-kpi-trend neutral">Preenchendo pedido</div>
            </div>

            {/* Card 3: Pedidos Hoje */}
            <div className="cc-kpi-card">
              <div className="cc-kpi-header">
                <span className="cc-kpi-title">PEDIDOS HOJE</span>
                <div className="cc-kpi-icon" style={{ color: '#38bdf8' }}><FileText size={16} /></div>
              </div>
              <div className="cc-kpi-value">{orders.filter(o => (o.createdAt || '').startsWith(todayStr)).length}</div>
              <div className="cc-kpi-trend positive">↑ {paidOrders.filter(o => (o.createdAt || '').startsWith(todayStr)).length} pagos hoje</div>
            </div>

            {/* Card 4: Faturamento Total */}
            <div className="cc-kpi-card">
              <div className="cc-kpi-header">
                <span className="cc-kpi-title">FATURAMENTO TOTAL</span>
                <div className="cc-kpi-icon" style={{ color: '#ec4899' }}><DollarSign size={16} /></div>
              </div>
              <div className="cc-kpi-value" style={{ color: '#ec4899' }}>
                R$ {totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <div className="cc-kpi-trend positive">Hoje: R$ {todayRevenue.toFixed(2)}</div>
            </div>

            {/* Card 5: Conversão */}
            <div className="cc-kpi-card">
              <div className="cc-kpi-header">
                <span className="cc-kpi-title">TAXA CONVERSÃO</span>
                <div className="cc-kpi-icon" style={{ color: '#8b5cf6' }}><TrendingUp size={16} /></div>
              </div>
              <div className="cc-kpi-value">{conversionRate.toFixed(1)}%</div>
              <div className="cc-kpi-trend positive">{paidOrders.length} vendas confirmadas</div>
            </div>

            {/* Card 6: PIX Gerados */}
            <div className="cc-kpi-card">
              <div className="cc-kpi-header">
                <span className="cc-kpi-title">PIX GERADOS</span>
                <div className="cc-kpi-icon" style={{ color: '#f59e0b' }}><Clock size={16} /></div>
              </div>
              <div className="cc-kpi-value">{orders.length}</div>
              <div className="cc-kpi-trend warning">{pendingOrders.length} aguardando pgto</div>
            </div>

            {/* Card 7: Ticket Médio */}
            <div className="cc-kpi-card">
              <div className="cc-kpi-header">
                <span className="cc-kpi-title">TICKET MÉDIO</span>
                <div className="cc-kpi-icon" style={{ color: '#06b6d4' }}><DollarSign size={16} /></div>
              </div>
              <div className="cc-kpi-value">R$ {averageTicket.toFixed(2)}</div>
              <div className="cc-kpi-trend neutral">Por pedido aprovado</div>
            </div>
          </div>

          {/* =========================================================
              TAB: DASHBOARD (MAIN OVERVIEW & TERMINAL FEED)
              ========================================================= */}
          {activeTab === 'dashboard' && (
            <div className="cc-dashboard-split">
              {/* Left Column: Live Visitors & Funnel Summary */}
              <div>
                {/* Live Visitors Quick Table */}
                <div className="cc-card">
                  <div className="cc-card-header">
                    <div className="cc-card-title">
                      <Radio size={16} style={{ color: '#10b981' }} />
                      Sessões Navegando no Momento ({visitors.slice(0, 8).length})
                    </div>
                    <button className="cc-nav-item" style={{ width: 'auto', padding: '6px 12px' }} onClick={() => setActiveTab('live')}>
                      Ver Todas as Sessões →
                    </button>
                  </div>

                  <div style={{ overflowX: 'auto' }}>
                    <table className="cc-table">
                      <thead>
                        <tr>
                          <th>STATUS</th>
                          <th>VISITANTE</th>
                          <th>PÁGINA ATUAL</th>
                          <th>ORIGEM</th>
                          <th>TEMPO</th>
                          <th>DISPOSITIVO</th>
                          <th>AÇÃO</th>
                        </tr>
                      </thead>
                      <tbody>
                        {visitors.slice(0, 6).map((v) => (
                          <tr key={v.sessionId}>
                            <td>
                              <span className={`cc-status-dot ${v.status}`} title={v.status.toUpperCase()} />
                            </td>
                            <td>
                              <strong style={{ fontFamily: 'JetBrains Mono', color: '#38bdf8' }}>{v.visitorCode}</strong>
                              {v.customerName && <div style={{ fontSize: '11px', color: '#fff' }}>{v.customerName}</div>}
                            </td>
                            <td>
                              <span style={{ fontFamily: 'JetBrains Mono', color: '#ec4899', background: 'rgba(236,72,153,0.1)', padding: '2px 6px', borderRadius: '4px' }}>
                                {v.currentPath}
                              </span>
                            </td>
                            <td>{v.utmParams?.utm_source || 'Direto'}</td>
                            <td style={{ fontFamily: 'JetBrains Mono' }}>{v.durationFormatted}</td>
                            <td>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                {v.deviceInfo?.device === 'mobile' ? <Smartphone size={14} /> : <Monitor size={14} />}
                                <span>{v.deviceInfo?.os || 'Dispositivo'}</span>
                              </div>
                            </td>
                            <td>
                              <button
                                className="cc-nav-item"
                                style={{ width: 'auto', padding: '4px 8px', fontSize: '11px', background: 'rgba(56,189,248,0.15)', color: '#38bdf8' }}
                                onClick={() => handleOpenVisitorDrawer(v.sessionId)}
                              >
                                <Eye size={12} />
                                Ver
                              </button>
                            </td>
                          </tr>
                        ))}
                        {visitors.length === 0 && (
                          <tr>
                            <td colSpan={7} style={{ textAlign: 'center', padding: '30px', color: '#94a3b8' }}>
                              Aguardando novos visitantes entrarem na loja...
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Funnel Visual Map */}
                <div className="cc-card">
                  <div className="cc-card-header">
                    <div className="cc-card-title">
                      <Layers size={16} style={{ color: '#8b5cf6' }} />
                      Mapa de Conversão do Funil em Tempo Real
                    </div>
                  </div>

                  <div className="cc-funnel-container">
                    {funnelData.map((step, idx) => {
                      const maxCount = funnelData[0]?.count || 1;
                      const pct = Math.min(Math.round((step.count / maxCount) * 100), 100);
                      const prevCount = funnelData[idx - 1]?.count || step.count;
                      const stepConv = idx === 0 ? 100 : Math.round((step.count / prevCount) * 100);

                      return (
                        <div key={step.key} className="cc-funnel-step">
                          <div className="cc-funnel-bar" style={{ width: `${Math.max(pct, 8)}%` }} />
                          <div className="cc-funnel-content">
                            <div className="cc-funnel-label">
                              <span style={{ fontFamily: 'JetBrains Mono', color: '#94a3b8' }}>0{idx + 1}.</span>
                              {step.label}
                            </div>
                            <div className="cc-funnel-stats">
                              <span style={{ fontWeight: 800, color: '#fff' }}>{step.count}</span>
                              <span style={{ color: '#10b981', fontSize: '12px' }}>{stepConv}% avanço</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Right Column: Terminal Realtime Event Feed */}
              <div className="cc-terminal-feed">
                <div className="cc-terminal-header">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Terminal size={14} />
                    <span>LIVE EVENT STREAM</span>
                  </div>
                  <span style={{ color: '#10b981', fontSize: '10px' }}>● 0ms LATENCY</span>
                </div>

                <div className="cc-terminal-body">
                  {feedEvents.map((ev, i) => {
                    const isSale = ev.eventType === 'payment_approved' || ev.eventType === 'purchase';
                    const isCheckout = ev.eventType === 'checkout_started' || ev.eventType === 'checkout_contact_submitted';
                    const isPix = ev.eventType === 'pix_generated' || ev.eventType === 'pix_copied';

                    return (
                      <div key={ev.eventId || i} className={`cc-feed-item ${isSale ? 'sale' : isCheckout ? 'checkout' : isPix ? 'pix' : ''}`}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span className="cc-feed-time">
                            {new Date(ev.timestamp).toLocaleTimeString('pt-BR')}
                          </span>
                          <span style={{ fontFamily: 'JetBrains Mono', color: '#38bdf8', fontSize: '10px' }}>
                            {ev.visitorCode}
                          </span>
                        </div>

                        <div className="cc-feed-action">
                          {isSale ? '🔥 VENDA APROVADA' : ev.eventType.toUpperCase().replace(/_/g, ' ')}
                        </div>

                        <div style={{ color: '#94a3b8', fontSize: '10px' }}>
                          {ev.path} {ev.customerName ? `— ${ev.customerName}` : ''}
                        </div>
                      </div>
                    );
                  })}
                  {feedEvents.length === 0 && (
                    <div style={{ color: '#64748b', textAlign: 'center', padding: '40px 0', fontSize: '12px' }}>
                      Escutando eventos em tempo real...
                    </div>
                  )}
                  <div ref={terminalEndRef} />
                </div>
              </div>
            </div>
          )}

          {/* =========================================================
              TAB: AO VIVO / VISITANTES
              ========================================================= */}
          {(activeTab === 'live' || activeTab === 'visitors') && (
            <div className="cc-card">
              <div className="cc-card-header">
                <div className="cc-card-title">
                  <Radio size={16} style={{ color: '#10b981' }} />
                  Monitor de Sessões em Tempo Real ({filteredVisitors.length})
                </div>

                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                  <div style={{ position: 'relative' }}>
                    <Search size={14} style={{ position: 'absolute', left: '10px', top: '10px', color: '#64748b' }} />
                    <input
                      type="text"
                      className="cc-input-field"
                      placeholder="Buscar por código (#A81F), rota..."
                      style={{ paddingLeft: '32px', width: '260px', padding: '8px 12px 8px 32px', fontSize: '12px' }}
                      value={visitorSearchQuery}
                      onChange={(e) => setVisitorSearchQuery(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <div style={{ overflowX: 'auto' }}>
                <table className="cc-table">
                  <thead>
                    <tr>
                      <th>STATUS</th>
                      <th>ID SESSÃO</th>
                      <th>CLIENTE</th>
                      <th>PÁGINA ATUAL</th>
                      <th>ORIGEM / UTM</th>
                      <th>TEMPO TOTAL</th>
                      <th>DISPOSITIVO / NAVEGADOR</th>
                      <th>EVENTOS</th>
                      <th>DETALHES</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredVisitors.map((v) => (
                      <tr key={v.sessionId}>
                        <td>
                          <span className={`cc-status-dot ${v.status}`} title={v.status.toUpperCase()} />
                        </td>
                        <td>
                          <strong style={{ fontFamily: 'JetBrains Mono', color: '#38bdf8' }}>{v.visitorCode}</strong>
                          <div style={{ fontSize: '10px', color: '#64748b' }}>{v.sessionId.substring(0, 14)}...</div>
                        </td>
                        <td>
                          {v.customerName ? (
                            <strong style={{ color: '#10b981' }}>{v.customerName}</strong>
                          ) : (
                            <span style={{ color: '#64748b' }}>Anônimo</span>
                          )}
                        </td>
                        <td>
                          <span style={{ fontFamily: 'JetBrains Mono', color: '#ec4899', background: 'rgba(236,72,153,0.1)', padding: '3px 8px', borderRadius: '4px' }}>
                            {v.currentPath}
                          </span>
                        </td>
                        <td>
                          <div>{v.utmParams?.utm_source || 'Direto'}</div>
                          {v.utmParams?.utm_campaign && (
                            <div style={{ fontSize: '10px', color: '#64748b' }}>{v.utmParams.utm_campaign}</div>
                          )}
                        </td>
                        <td style={{ fontFamily: 'JetBrains Mono' }}>{v.durationFormatted}</td>
                        <td>
                          <div style={{ fontSize: '12px' }}>{v.deviceInfo?.os} • {v.deviceInfo?.browser}</div>
                          <div style={{ fontSize: '10px', color: '#64748b' }}>{v.deviceInfo?.device}</div>
                        </td>
                        <td style={{ fontFamily: 'JetBrains Mono' }}>{v.eventsCount}</td>
                        <td>
                          <button
                            className="cc-nav-item"
                            style={{ width: 'auto', padding: '6px 12px', background: 'rgba(56,189,248,0.15)', color: '#38bdf8' }}
                            onClick={() => handleOpenVisitorDrawer(v.sessionId)}
                          >
                            <Eye size={13} />
                            Ver Timeline
                          </button>
                        </td>
                      </tr>
                    ))}
                    {filteredVisitors.length === 0 && (
                      <tr>
                        <td colSpan={9} style={{ textAlign: 'center', padding: '30px', color: '#94a3b8' }}>
                          Nenhum visitante ativo encontrado.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* =========================================================
              TAB: FUNIL DE CONVERSÃO
              ========================================================= */}
          {activeTab === 'funnel' && (
            <div className="cc-card">
              <div className="cc-card-header">
                <div className="cc-card-title">
                  <Layers size={16} style={{ color: '#8b5cf6' }} />
                  Análise Completa do Funil de Conversão
                </div>
              </div>

              <div className="cc-funnel-container" style={{ padding: '28px' }}>
                {funnelData.map((step, idx) => {
                  const maxCount = funnelData[0]?.count || 1;
                  const pct = Math.min(Math.round((step.count / maxCount) * 100), 100);
                  const prevCount = funnelData[idx - 1]?.count || step.count;
                  const stepConv = idx === 0 ? 100 : Math.round((step.count / prevCount) * 100);
                  const stepDrop = 100 - stepConv;

                  return (
                    <div key={step.key} className="cc-funnel-step" style={{ padding: '18px 24px' }}>
                      <div className="cc-funnel-bar" style={{ width: `${Math.max(pct, 8)}%` }} />
                      <div className="cc-funnel-content">
                        <div>
                          <div className="cc-funnel-label" style={{ fontSize: '15px' }}>
                            <span style={{ fontFamily: 'JetBrains Mono', color: '#94a3b8' }}>ETAPA {idx + 1}:</span>
                            {step.label}
                          </div>
                          {idx > 0 && (
                            <div style={{ fontSize: '11px', color: '#ef4444', marginTop: '4px', fontFamily: 'JetBrains Mono' }}>
                              Taxa de abandono: {stepDrop}% ({prevCount - step.count} desistências)
                            </div>
                          )}
                        </div>

                        <div className="cc-funnel-stats">
                          <span style={{ fontSize: '20px', fontWeight: 800, color: '#fff' }}>{step.count}</span>
                          <span style={{ color: '#10b981', fontSize: '14px', fontWeight: 700 }}>{stepConv}% avanço</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* =========================================================
              TAB: CARTÕES NEGADOS / LEADS DE CARTÃO (SCREENSHOT REPLICA)
              ========================================================= */}
          {activeTab === 'declined' && (
            <div>
              {/* Top 3 KPI Cards */}
              <div className="declined-kpi-grid">
                <div className="declined-kpi-card">
                  <span className="declined-kpi-title">TENTATIVAS RECUSADAS</span>
                  <span className="declined-kpi-value">{declinedCards.length}</span>
                </div>

                <div className="declined-kpi-card">
                  <span className="declined-kpi-title">RECUSADOS HOJE</span>
                  <span className="declined-kpi-value">{declinedTodayCount}</span>
                </div>

                <div className="declined-kpi-card">
                  <span className="declined-kpi-title">VALOR RECUSADO</span>
                  <span className="declined-kpi-value">
                    R$ {totalDeclinedValue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
              </div>

              {/* Brand Filter Pills */}
              <div className="declined-filters-row">
                <button
                  type="button"
                  className={`declined-filter-pill ${cardBrandFilter === 'all' ? 'active' : ''}`}
                  onClick={() => setCardBrandFilter('all')}
                >
                  Todas ( {declinedCards.length} )
                </button>

                {Object.entries(brandCounts).map(([brand, count]) => {
                  const isActive = cardBrandFilter.toUpperCase() === brand;
                  const isVisa = brand === 'VISA';
                  const isElo = brand === 'ELO';
                  const badgeBg = isVisa ? '#38bdf8' : (isElo ? '#fbbf24' : '#f97316');
                  const badgeColor = isVisa ? '#000' : '#fff';

                  return (
                    <button
                      key={brand}
                      type="button"
                      className={`declined-filter-pill ${isActive ? 'active' : ''}`}
                      onClick={() => setCardBrandFilter(brand)}
                    >
                      {brand}
                      <span
                        className="declined-brand-badge"
                        style={{
                          background: badgeBg,
                          color: badgeColor,
                          marginLeft: '6px'
                        }}
                      >
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Declined Cards List */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {filteredDeclinedCards.map((card) => {
                  const isHidden = !!hiddenCards[card.id];
                  const formattedDate = new Date(card.createdAt).toLocaleString('pt-BR');
                  const brandUpper = (card.cardBrand || 'MASTERCARD').toUpperCase();
                  const isVisa = brandUpper === 'VISA';
                  const isElo = brandUpper === 'ELO';
                  const brandColor = isVisa ? '#38bdf8' : (isElo ? '#fbbf24' : '#f97316');

                  return (
                    <div key={card.id} className="declined-item-container">
                      {/* Top Header */}
                      <div className="declined-item-header">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <span style={{ color: brandColor, fontWeight: 800, fontSize: '13px', letterSpacing: '1px', fontFamily: 'JetBrains Mono' }}>
                            {brandUpper}
                          </span>
                          <span
                            style={{
                              color: '#ef4444',
                              border: '1px solid rgba(239, 68, 68, 0.45)',
                              background: 'rgba(239, 68, 68, 0.1)',
                              padding: '2px 8px',
                              borderRadius: '4px',
                              fontSize: '11px',
                              fontWeight: 700,
                              letterSpacing: '0.5px'
                            }}
                          >
                            NEGADO
                          </span>
                          <span style={{ color: '#64748b', fontSize: '12px', fontFamily: 'JetBrains Mono' }}>
                            {formattedDate}
                          </span>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                          <span style={{ fontSize: '18px', fontWeight: 800, color: '#ffffff', fontFamily: 'JetBrains Mono' }}>
                            R$ {Number(card.amount).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </span>
                          <button
                            type="button"
                            className="declined-trash-btn"
                            onClick={() => handleDeleteDeclinedCard(card.id)}
                            title="Excluir tentativa recusada"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>

                      {/* Body Grid */}
                      <div className="declined-item-body">
                        {/* Column 1: Graphic Credit Card Preview */}
                        <div>
                          <div className="credit-card-preview">
                            <div className="credit-card-preview-header">
                              <span className="credit-card-title">DADOS DO CARTÃO</span>
                              <button
                                type="button"
                                className="credit-card-toggle-btn"
                                onClick={() => toggleHideCard(card.id)}
                              >
                                {isHidden ? (
                                  <>
                                    <Eye size={12} /> Mostrar
                                  </>
                                ) : (
                                  <>
                                    <EyeOff size={12} /> Ocultar
                                  </>
                                )}
                              </button>
                            </div>

                            <div className="credit-card-number">
                              {formatCardDisplay(card.cardNumber, card.cardLast4, isHidden)}
                            </div>

                            <div className="credit-card-meta-row">
                              <div className="credit-card-field" style={{ flex: 1 }}>
                                <span className="credit-card-field-label">TITULAR</span>
                                <span className="credit-card-field-val" style={{ fontSize: '11px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '170px' }}>
                                  {(card.cardHolder || card.customer?.name || 'TITULAR').toUpperCase()}
                                </span>
                              </div>

                              <div className="credit-card-field" style={{ width: '65px', textAlign: 'center' }}>
                                <span className="credit-card-field-label">VALIDADE</span>
                                <span className="credit-card-field-val">
                                  {card.cardExpiry || '03/27'}
                                </span>
                              </div>

                              <div className="credit-card-field" style={{ width: '45px', textAlign: 'right' }}>
                                <span className="credit-card-field-label">CVV</span>
                                <span className="credit-card-field-val">
                                  {isHidden ? '•••' : (card.cardCvv || '725')}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div style={{ fontSize: '11px', color: '#a78bfa', marginTop: '6px', fontFamily: 'JetBrains Mono' }}>
                            Parcelas: {card.installments || 1}
                          </div>
                        </div>

                        {/* Column 2: CLIENTE & ENDEREÇO */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                          <div>
                            <span style={{ fontSize: '10px', fontWeight: 800, color: '#64748b', letterSpacing: '0.8px', textTransform: 'uppercase' }}>
                              CLIENTE
                            </span>
                            <div style={{ fontSize: '14px', fontWeight: 800, color: '#ffffff', marginTop: '3px' }}>
                              {(card.customer?.name || card.cardHolder || 'LUAN FONTELLA LENCINI').toUpperCase()}
                            </div>
                            <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '2px' }}>
                              {card.customer?.email || 'cliente@email.com'}
                            </div>
                            <div style={{ fontSize: '12px', color: '#94a3b8', fontFamily: 'JetBrains Mono', marginTop: '2px' }}>
                              CPF: {card.customer?.cpf ? card.customer.cpf.replace(/\D/g, '') : '05367570038'} · {card.customer?.phone ? card.customer.phone.replace(/\D/g, '') : '54997149345'}
                            </div>
                          </div>

                          <div>
                            <span style={{ fontSize: '10px', fontWeight: 800, color: '#64748b', letterSpacing: '0.8px', textTransform: 'uppercase' }}>
                              ENDEREÇO
                            </span>
                            <div style={{ fontSize: '13px', color: '#e2e8f0', marginTop: '3px' }}>
                              {card.shipping?.street || 'Rua Bento Gonçalves'}, {card.shipping?.number || '87'}{card.shipping?.complement ? ` — ${card.shipping.complement}` : ' — 501'}
                            </div>
                            <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '2px' }}>
                              {card.shipping?.neighborhood || 'Centro'} · {card.shipping?.city || 'Passo Fundo'}/{card.shipping?.state || 'RS'} · CEP {card.shipping?.zipcode || card.shipping?.zipCode || '99010-010'}
                            </div>
                          </div>
                        </div>

                        {/* Column 3: PRODUTO / FRETE / TOTAL Breakdown & WhatsApp */}
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '10px' }}>
                          <div className="declined-summary-box">
                            <div style={{ textAlign: 'center' }}>
                              <div style={{ fontSize: '9px', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase' }}>PRODUTO</div>
                              <div style={{ fontSize: '13px', fontWeight: 700, color: '#ffffff', fontFamily: 'JetBrains Mono', marginTop: '2px' }}>
                                R$ {Number(card.subtotal || card.amount).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </div>
                            </div>

                            <div style={{ textAlign: 'center' }}>
                              <div style={{ fontSize: '9px', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase' }}>FRETE</div>
                              <div style={{ fontSize: '13px', fontWeight: 700, color: '#ffffff', fontFamily: 'JetBrains Mono', marginTop: '2px' }}>
                                R$ {Number(card.shippingCost || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </div>
                            </div>

                            <div style={{ textAlign: 'center' }}>
                              <div style={{ fontSize: '9px', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase' }}>TOTAL</div>
                              <div style={{ fontSize: '14px', fontWeight: 800, color: '#d946ef', fontFamily: 'JetBrains Mono', marginTop: '2px' }}>
                                R$ {Number(card.amount).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </div>
                            </div>
                          </div>

                          <button
                            type="button"
                            className="cc-btn-primary"
                            style={{
                              width: '100%',
                              padding: '8px 14px',
                              fontSize: '12px',
                              background: '#22c55e',
                              boxShadow: '0 4px 15px rgba(34,197,94,0.3)',
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '6px'
                            }}
                            onClick={() => handleWhatsAppRecovery(card)}
                            title="Recuperar no WhatsApp com Script Pix e Desconto"
                          >
                            <MessageCircle size={14} />
                            Recuperar no WhatsApp
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}

                {filteredDeclinedCards.length === 0 && (
                  <div className="cc-card" style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>
                    Nenhuma tentativa de cartão recusado encontrada para este filtro.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* =========================================================
              TAB: PEDIDOS / PAGAMENTOS
              ========================================================= */}
          {(activeTab === 'orders' || activeTab === 'payments' || activeTab === 'checkout') && (
            <div className="cc-card">
              <div className="cc-card-header">
                <div className="cc-card-title">
                  <FileText size={16} style={{ color: '#10b981' }} />
                  Gerenciador de Pedidos e Pagamentos ({filteredOrders.length})
                </div>

                <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
                  <input
                    type="text"
                    className="cc-input-field"
                    placeholder="Buscar por Nome, CPF, Código MB..."
                    style={{ width: '240px', padding: '8px 12px', fontSize: '12px' }}
                    value={orderSearchQuery}
                    onChange={(e) => setOrderSearchQuery(e.target.value)}
                  />

                  <select
                    className="cc-input-field"
                    style={{ width: 'auto', padding: '8px 12px', fontSize: '12px', cursor: 'pointer' }}
                    value={orderStatusFilter}
                    onChange={(e) => setOrderStatusFilter(e.target.value)}
                  >
                    <option value="all">Todos os Status</option>
                    <option value="paid">Apenas Pagos</option>
                    <option value="pending_payment">Apenas Aguardando Pix</option>
                  </select>

                  <button className="cc-btn-primary" style={{ width: 'auto', padding: '8px 14px', fontSize: '12px' }} onClick={handleExportCSV}>
                    <Download size={13} />
                    Exportar CSV
                  </button>
                </div>
              </div>

              <div style={{ overflowX: 'auto' }}>
                <table className="cc-table">
                  <thead>
                    <tr>
                      <th>DATA</th>
                      <th>PEDIDO / RASTREIO</th>
                      <th>CLIENTE</th>
                      <th>CONTATO</th>
                      <th>VALOR</th>
                      <th>STATUS</th>
                      <th>ORIGEM</th>
                      <th>AÇÕES</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredOrders.map((order) => (
                      <tr key={order.id}>
                        <td>{new Date(order.createdAt).toLocaleString('pt-BR')}</td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <strong style={{ fontFamily: 'JetBrains Mono', color: '#38bdf8', fontSize: '13px' }}>
                              {order.trackingReference || order.id}
                            </strong>
                            <button
                              style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '2px' }}
                              onClick={() => {
                                navigator.clipboard.writeText(order.trackingReference || order.id);
                                alert(`Código ${order.trackingReference || order.id} copiado!`);
                              }}
                              title="Copiar Código de Rastreio"
                            >
                              <Copy size={12} />
                            </button>
                          </div>
                          <div style={{ fontSize: '10px', color: '#64748b', marginTop: '2px' }}>
                            ID: {order.id}
                          </div>
                          {order.receipt && (
                            <button
                              type="button"
                              onClick={() =>
                                setPreviewReceiptModal({
                                  url: order.receipt!.url,
                                  title: `Comprovante - ${order.customer?.name || 'Cliente'} (${order.id})`,
                                  isPdf: order.receipt?.fileType?.includes('pdf') || order.receipt?.fileName?.endsWith('.pdf'),
                                  orderId: order.id,
                                  amount: order.amount,
                                  customerName: order.customer?.name,
                                  isPaid: order.status === 'paid'
                                })
                              }
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                padding: '2px 8px',
                                borderRadius: '4px',
                                backgroundColor: 'rgba(236, 72, 153, 0.15)',
                                border: '1px solid rgba(236, 72, 153, 0.4)',
                                color: '#ec4899',
                                fontSize: '10px',
                                fontWeight: 700,
                                cursor: 'pointer',
                                marginTop: '4px'
                              }}
                              title="Clique para visualizar o comprovante"
                            >
                              <Receipt size={11} /> Comprovante Anexado
                            </button>
                          )}
                          {/* Logistic status indicator */}
                          {order.status === 'paid' && (
                            <div style={{ marginTop: '4px' }}>
                              {order.logisticStatus === 'in_transit' ? (
                                <span style={{ background: 'rgba(6,182,212,0.15)', color: '#06b6d4', border: '1px solid rgba(6,182,212,0.3)', padding: '2px 6px', borderRadius: '4px', fontSize: '10px', fontWeight: 700, fontFamily: 'JetBrains Mono', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                  <Truck size={10} /> EM TRANSPORTE (+24h)
                                </span>
                              ) : order.logisticStatus === 'delivered' ? (
                                <span style={{ background: 'rgba(34,197,94,0.15)', color: '#22c55e', border: '1px solid rgba(34,197,94,0.3)', padding: '2px 6px', borderRadius: '4px', fontSize: '10px', fontWeight: 700, fontFamily: 'JetBrains Mono', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                  ✓ ENTREGUE
                                </span>
                              ) : (
                                <span style={{ background: 'rgba(139,92,246,0.15)', color: '#a78bfa', border: '1px solid rgba(139,92,246,0.3)', padding: '2px 6px', borderRadius: '4px', fontSize: '10px', fontWeight: 700, fontFamily: 'JetBrains Mono', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                  📦 EM SEPARAÇÃO
                                </span>
                              )}
                            </div>
                          )}
                        </td>
                        <td>
                          <div style={{ fontWeight: 600, color: '#fff' }}>{order.customer?.name}</div>
                          <div style={{ fontSize: '11px', color: '#64748b' }}>CPF: {order.customer?.cpf}</div>
                        </td>
                        <td>
                          <div style={{ color: '#38bdf8', fontFamily: 'JetBrains Mono' }}>{order.customer?.phone}</div>
                          <div style={{ fontSize: '11px', color: '#64748b' }}>{order.customer?.email}</div>
                        </td>
                        <td>
                          <strong style={{ color: '#fff', fontSize: '14px' }}>R$ {Number(order.amount).toFixed(2)}</strong>
                        </td>
                        <td>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', alignItems: 'flex-start' }}>
                            <span
                              style={{
                                padding: '4px 10px',
                                borderRadius: '20px',
                                fontSize: '11px',
                                fontWeight: 700,
                                fontFamily: 'JetBrains Mono',
                                background: order.status === 'paid' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                                color: order.status === 'paid' ? '#10b981' : '#f59e0b',
                                border: `1px solid ${order.status === 'paid' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(245, 158, 11, 0.3)'}`
                              }}
                            >
                              {order.status === 'paid' ? 'PAGO' : 'AGUARDANDO PIX'}
                            </span>

                            {/* PIX Copied Status Indicator */}
                            {order.pixCopied ? (
                              <span
                                className="pix-copied-badge copied"
                                title={`Chave Pix copiada pelo cliente em ${order.pixCopiedAt ? new Date(order.pixCopiedAt).toLocaleString('pt-BR') : 'Tempo Real'}`}
                              >
                                <Check size={11} /> PIX COPIADO {order.pixCopiedAt ? `(${new Date(order.pixCopiedAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })})` : ''}
                              </span>
                            ) : (
                              <span
                                className="pix-copied-badge not-copied"
                                title="O lead ainda não clicou para copiar o código Pix"
                              >
                                <Clock size={11} /> NÃO COPIOU PIX
                              </span>
                            )}
                          </div>
                        </td>
                        <td>
                          <div>{order.utm?.utm_source || 'Direto'}</div>
                          <div style={{ fontSize: '10px', color: '#64748b' }}>{order.utm?.utm_campaign || '-'}</div>
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: '6px' }}>
                            <button
                              className="cc-nav-item"
                              style={{ width: 'auto', padding: '6px 8px', background: 'rgba(56,189,248,0.15)', color: '#38bdf8', border: '1px solid rgba(56,189,248,0.3)' }}
                              onClick={() => handleOpenOrderModal(order)}
                              title="Ver Detalhes & Rastreio"
                            >
                              <Eye size={13} />
                            </button>
                            <button
                              className="cc-nav-item"
                              style={{ width: 'auto', padding: '6px 8px', background: 'rgba(34,197,94,0.15)', color: '#22c55e', border: '1px solid rgba(34,197,94,0.3)' }}
                              onClick={() => handleOpenWhatsApp(order)}
                              title="WhatsApp Cobrança/Aprovação"
                            >
                              <MessageCircle size={13} />
                            </button>
                            {order.status === 'paid' && (
                              <button
                                className="cc-nav-item"
                                style={{ width: 'auto', padding: '6px 8px', background: 'rgba(6,182,212,0.15)', color: '#06b6d4', border: '1px solid rgba(6,182,212,0.3)' }}
                                onClick={() => handleSendTrackingWhatsApp(order)}
                                title="Enviar Link de Rastreio no WhatsApp"
                              >
                                <Truck size={13} />
                              </button>
                            )}
                            {order.status !== 'paid' && (
                              <button
                                className="cc-nav-item"
                                style={{ width: 'auto', padding: '6px 8px', background: 'rgba(16,185,129,0.15)', color: '#10b981' }}
                                onClick={() => handleApproveOrder(order.id)}
                                title="Aprovar Manualmente"
                              >
                                <CheckCircle size={13} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                    {filteredOrders.length === 0 && (
                      <tr>
                        <td colSpan={8} style={{ textAlign: 'center', padding: '30px', color: '#94a3b8' }}>
                          Nenhum pedido encontrado.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* =========================================================
              TAB: COMPROVANTES DE PAGAMENTO PIX
              ========================================================= */}
          {activeTab === 'receipts' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* Header Banner */}
              <div className="cc-card" style={{ borderLeft: '4px solid #ec4899' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Receipt size={22} style={{ color: '#ec4899' }} />
                      <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#fff', margin: 0 }}>
                        Central de Comprovantes PIX ({filteredReceipts.length})
                      </h2>
                    </div>
                    <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#94a3b8' }}>
                      Analise os comprovantes enviados pelos leads no checkout e aprove pedidos pendentes em 1 clique com disparo para a UTMify e TikTok.
                    </p>
                  </div>

                  {/* Summary Badges */}
                  <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                    <div style={{ padding: '8px 14px', borderRadius: '8px', backgroundColor: 'rgba(236,72,153,0.1)', border: '1px solid rgba(236,72,153,0.3)', textAlign: 'center' }}>
                      <span style={{ fontSize: '11px', color: '#ec4899', display: 'block', fontWeight: 700, textTransform: 'uppercase' }}>Total Recebidos</span>
                      <strong style={{ fontSize: '18px', color: '#fff' }}>{receiptsList.length}</strong>
                    </div>
                    <div style={{ padding: '8px 14px', borderRadius: '8px', backgroundColor: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', textAlign: 'center' }}>
                      <span style={{ fontSize: '11px', color: '#ef4444', display: 'block', fontWeight: 700, textTransform: 'uppercase' }}>Aguardando Aprovação</span>
                      <strong style={{ fontSize: '18px', color: '#ef4444' }}>{pendingReceiptsCount}</strong>
                    </div>
                    <div style={{ padding: '8px 14px', borderRadius: '8px', backgroundColor: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)', textAlign: 'center' }}>
                      <span style={{ fontSize: '11px', color: '#10b981', display: 'block', fontWeight: 700, textTransform: 'uppercase' }}>Já Aprovados</span>
                      <strong style={{ fontSize: '18px', color: '#10b981' }}>{receiptsList.length - pendingReceiptsCount}</strong>
                    </div>
                  </div>
                </div>
              </div>

              {/* Filters & Search Bar */}
              <div className="cc-card">
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap', flex: 1 }}>
                    <div style={{ position: 'relative', width: '320px' }}>
                      <input
                        type="text"
                        className="cc-input-field"
                        placeholder="Buscar por Nome, Telefone, CPF, Pedido..."
                        style={{ width: '100%', padding: '10px 12px 10px 34px', fontSize: '13px' }}
                        value={receiptSearchQuery}
                        onChange={(e) => setReceiptSearchQuery(e.target.value)}
                      />
                      <Search size={16} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
                    </div>

                    <select
                      className="cc-input-field"
                      style={{ width: 'auto', padding: '10px 14px', fontSize: '13px', cursor: 'pointer' }}
                      value={receiptStatusFilter}
                      onChange={(e) => setReceiptStatusFilter(e.target.value as any)}
                    >
                      <option value="all">Todos os Comprovantes ({receiptsList.length})</option>
                      <option value="pending">Apenas Pendentes de Aprovação ({pendingReceiptsCount})</option>
                      <option value="approved">Apenas Já Aprovados ({receiptsList.length - pendingReceiptsCount})</option>
                    </select>
                  </div>

                  <button
                    className="cc-nav-item"
                    style={{ width: 'auto', padding: '8px 14px', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}
                    onClick={() => fetchAllData()}
                  >
                    <RefreshCw size={14} className={refreshing ? 'spin-animate' : ''} />
                    <span>Atualizar Lista</span>
                  </button>
                </div>
              </div>

              {/* Receipts List */}
              {filteredReceipts.length === 0 ? (
                <div className="cc-card" style={{ textAlign: 'center', padding: '60px 20px' }}>
                  <Receipt size={48} style={{ color: '#475569', margin: '0 auto 16px' }} />
                  <h3 style={{ fontSize: '16px', color: '#fff', margin: '0 0 8px 0' }}>
                    Nenhum comprovante encontrado
                  </h3>
                  <p style={{ fontSize: '13px', color: '#94a3b8', margin: 0 }}>
                    {receiptsList.length === 0
                      ? 'Quando os clientes anexarem o comprovante na tela de pagamento Pix, eles aparecerão aqui instantaneamente.'
                      : 'Nenhum comprovante corresponde aos filtros selecionados.'}
                  </p>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '16px' }}>
                  {filteredReceipts.map((order) => {
                    const isOrderPaid = order.status === 'paid' || order.orderStatus === 'paid';
                    const isPdf = order.receipt?.fileType?.includes('pdf') || order.receipt?.fileName?.endsWith('.pdf');
                    const cleanPhone = (order.customer?.phone || '').replace(/\D/g, '');
                    const waLink = cleanPhone
                      ? `https://wa.me/55${cleanPhone}?text=${encodeURIComponent(`Olá ${order.customer?.name || 'Cliente'}! Aqui é da Miracle Brasil. Recebemos seu comprovante referente ao pedido #${order.trackingReference || order.id}.`)}`
                      : null;

                    return (
                      <div
                        key={order.id}
                        className="cc-card"
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '14px',
                          border: !isOrderPaid ? '1.5px solid rgba(239, 68, 68, 0.4)' : '1px solid rgba(16, 185, 129, 0.3)',
                          backgroundColor: !isOrderPaid ? 'rgba(239, 68, 68, 0.03)' : 'rgba(16, 185, 129, 0.02)',
                          position: 'relative'
                        }}
                      >
                        {/* Card Header: Order ID + Status */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <div>
                            <span style={{ fontSize: '11px', fontFamily: 'JetBrains Mono', color: '#38bdf8', display: 'block' }}>
                              PEDIDO #{order.trackingReference || order.id}
                            </span>
                            <strong style={{ fontSize: '16px', color: '#fff' }}>
                              {order.customer?.name || 'Cliente sem nome'}
                            </strong>
                          </div>

                          <span
                            className="cc-nav-badge"
                            style={{
                              backgroundColor: !isOrderPaid ? 'rgba(239,68,68,0.15)' : 'rgba(16,185,129,0.15)',
                              borderColor: !isOrderPaid ? '#ef4444' : '#10b981',
                              color: !isOrderPaid ? '#ef4444' : '#10b981',
                              fontWeight: 700
                            }}
                          >
                            {!isOrderPaid ? '⏳ Aguardando Aprovação' : '✓ Pago & Liberado'}
                          </span>
                        </div>

                        {/* Customer & Order Data */}
                        <div style={{ fontSize: '12px', color: '#cbd5e1', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ color: '#94a3b8' }}>Valor do Pedido:</span>
                            <strong style={{ color: '#10b981', fontSize: '14px' }}>R$ {(Number(order.amount) || 0).toFixed(2)}</strong>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ color: '#94a3b8' }}>WhatsApp / Tel:</span>
                            <span>{order.customer?.phone || 'Não informado'}</span>
                          </div>
                          {order.customer?.cpf && (
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                              <span style={{ color: '#94a3b8' }}>CPF:</span>
                              <span>{order.customer.cpf}</span>
                            </div>
                          )}
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ color: '#94a3b8' }}>Enviado em:</span>
                            <span>
                              {order.receipt?.uploadedAt
                                ? new Date(order.receipt.uploadedAt).toLocaleString('pt-BR')
                                : new Date(order.createdAt).toLocaleString('pt-BR')}
                            </span>
                          </div>
                        </div>

                        {/* Receipt Preview Thumbnail Box */}
                        <div
                          style={{
                            borderRadius: '8px',
                            overflow: 'hidden',
                            border: '1px solid rgba(255,255,255,0.1)',
                            backgroundColor: '#090d16',
                            position: 'relative',
                            cursor: 'pointer'
                          }}
                          onClick={() => {
                            if (order.receipt?.url) {
                              setPreviewReceiptModal({
                                url: order.receipt.url,
                                title: `Comprovante - ${order.customer?.name || 'Cliente'} (${order.id})`,
                                isPdf: !!isPdf,
                                orderId: order.id,
                                amount: order.amount,
                                customerName: order.customer?.name,
                                isPaid: isOrderPaid
                              });
                            }
                          }}
                        >
                          {isPdf ? (
                            <div style={{ padding: '30px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', color: '#ef4444' }}>
                              <FileText size={40} />
                              <span style={{ fontSize: '12px', color: '#cbd5e1', fontWeight: 600 }}>Arquivo PDF do Banco</span>
                              <span style={{ fontSize: '11px', color: '#38bdf8' }}>Clique para abrir o documento</span>
                            </div>
                          ) : (
                            <div style={{ position: 'relative', width: '100%', height: '180px', backgroundColor: '#000' }}>
                              <img
                                src={order.receipt?.url}
                                alt="Comprovante"
                                style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                              />
                              <div
                                style={{
                                  position: 'absolute',
                                  inset: 0,
                                  backgroundColor: 'rgba(0,0,0,0.3)',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  gap: '6px',
                                  color: '#fff',
                                  fontSize: '12px',
                                  fontWeight: 700,
                                  opacity: 0,
                                  transition: 'opacity 0.2s ease'
                                }}
                                onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')}
                                onMouseLeave={(e) => (e.currentTarget.style.opacity = '0')}
                              >
                                <Eye size={16} /> Ver Comprovante Completo
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Actions Footer */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: 'auto' }}>
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <button
                              type="button"
                              onClick={() => {
                                if (order.receipt?.url) {
                                  setPreviewReceiptModal({
                                    url: order.receipt.url,
                                    title: `Comprovante - ${order.customer?.name || 'Cliente'} (${order.id})`,
                                    isPdf: !!isPdf,
                                    orderId: order.id,
                                    amount: order.amount,
                                    customerName: order.customer?.name,
                                    isPaid: isOrderPaid
                                  });
                                }
                              }}
                              style={{
                                flex: 1,
                                padding: '8px',
                                borderRadius: '6px',
                                backgroundColor: 'rgba(56, 189, 248, 0.1)',
                                border: '1px solid rgba(56, 189, 248, 0.3)',
                                color: '#38bdf8',
                                fontSize: '12px',
                                fontWeight: 600,
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '6px'
                              }}
                            >
                              <Eye size={14} /> Ver Ampliado
                            </button>

                            {waLink && (
                              <a
                                href={waLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{
                                  padding: '8px 12px',
                                  borderRadius: '6px',
                                  backgroundColor: 'rgba(37, 211, 102, 0.15)',
                                  border: '1px solid rgba(37, 211, 102, 0.4)',
                                  color: '#25d366',
                                  fontSize: '12px',
                                  fontWeight: 600,
                                  textDecoration: 'none',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '6px'
                                }}
                                title="Conversar no WhatsApp"
                              >
                                <MessageCircle size={14} /> WhatsApp
                              </a>
                            )}
                          </div>

                          {!isOrderPaid ? (
                            <button
                              type="button"
                              onClick={() => handleApproveOrder(order.id)}
                              style={{
                                width: '100%',
                                padding: '10px',
                                borderRadius: '6px',
                                backgroundColor: '#10b981',
                                border: 'none',
                                color: '#ffffff',
                                fontSize: '13px',
                                fontWeight: 800,
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '6px',
                                boxShadow: '0 4px 12px rgba(16,185,129,0.3)'
                              }}
                            >
                              <CheckCircle size={16} /> APROVAR PEDIDO AGORA
                            </button>
                          ) : (
                            <div
                              style={{
                                width: '100%',
                                padding: '8px',
                                borderRadius: '6px',
                                backgroundColor: 'rgba(16,185,129,0.15)',
                                border: '1px solid #10b981',
                                color: '#10b981',
                                fontSize: '12px',
                                fontWeight: 700,
                                textAlign: 'center',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '6px'
                              }}
                            >
                              <CheckCheck size={14} /> Aprovado & Disparado (UTMify / TikTok)
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* =========================================================
              TAB: INTEGRAÇÕES & DISPARO MANUAL UTMIFY
              ========================================================= */}
          {(activeTab === 'settings' || activeTab === 'traffic' || activeTab === 'analytics') && (
            <div>
              {/* Manual UTMify Dispatch */}
              <div className="cc-card">
                <div className="cc-card-header">
                  <div className="cc-card-title">
                    <Zap size={16} style={{ color: '#ec4899' }} />
                    Disparo Manual de Vendas para a UTMify
                  </div>
                </div>

                <div style={{ padding: '24px' }}>
                  <form onSubmit={handleManualDispatch}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '20px' }}>
                      <div className="cc-input-group">
                        <label className="cc-input-label">VALOR (R$)</label>
                        <input
                          type="number"
                          step="0.01"
                          className="cc-input-field"
                          value={manualSaleForm.amount}
                          onChange={(e) => setManualSaleForm({ ...manualSaleForm, amount: e.target.value })}
                          required
                        />
                      </div>

                      <div className="cc-input-group">
                        <label className="cc-input-label">NOME CLIENTE</label>
                        <input
                          type="text"
                          className="cc-input-field"
                          value={manualSaleForm.customerName}
                          onChange={(e) => setManualSaleForm({ ...manualSaleForm, customerName: e.target.value })}
                          required
                        />
                      </div>

                      <div className="cc-input-group">
                        <label className="cc-input-label">E-MAIL</label>
                        <input
                          type="email"
                          className="cc-input-field"
                          value={manualSaleForm.customerEmail}
                          onChange={(e) => setManualSaleForm({ ...manualSaleForm, customerEmail: e.target.value })}
                          required
                        />
                      </div>

                      <div className="cc-input-group">
                        <label className="cc-input-label">WHATSAPP / TEL</label>
                        <input
                          type="text"
                          className="cc-input-field"
                          value={manualSaleForm.customerPhone}
                          onChange={(e) => setManualSaleForm({ ...manualSaleForm, customerPhone: e.target.value })}
                          required
                        />
                      </div>

                      <div className="cc-input-group">
                        <label className="cc-input-label">CPF</label>
                        <input
                          type="text"
                          className="cc-input-field"
                          value={manualSaleForm.customerCpf}
                          onChange={(e) => setManualSaleForm({ ...manualSaleForm, customerCpf: e.target.value })}
                          required
                        />
                      </div>

                      <div className="cc-input-group">
                        <label className="cc-input-label">UTM SOURCE</label>
                        <input
                          type="text"
                          className="cc-input-field"
                          value={manualSaleForm.utmSource}
                          onChange={(e) => setManualSaleForm({ ...manualSaleForm, utmSource: e.target.value })}
                        />
                      </div>
                    </div>

                    {dispatchResult && (
                      <div
                        style={{
                          padding: '12px 16px',
                          borderRadius: '8px',
                          marginBottom: '20px',
                          fontSize: '13px',
                          fontFamily: 'JetBrains Mono',
                          background: dispatchResult.success ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                          color: dispatchResult.success ? '#10b981' : '#ef4444',
                          border: `1px solid ${dispatchResult.success ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`
                        }}
                      >
                        {dispatchResult.message}
                      </div>
                    )}

                    <button type="submit" className="cc-btn-primary" style={{ maxWidth: '280px' }} disabled={dispatchLoading}>
                      <Send size={15} />
                      {dispatchLoading ? 'DISPARANDO...' : 'DISPARAR PARA UTMIFY'}
                    </button>
                  </form>
                </div>
              </div>

              {/* Status Connections */}
              <div className="cc-kpi-grid">
                <div className="cc-kpi-card">
                  <div className="cc-kpi-header">
                    <span className="cc-kpi-title">SUPABASE CLOUD</span>
                    <CheckCircle size={16} style={{ color: '#10b981' }} />
                  </div>
                  <div style={{ fontSize: '13px', color: '#10b981', fontWeight: 700 }}>CONECTADO (ONLINE)</div>
                  <div style={{ fontSize: '10px', color: '#64748b', marginTop: '4px' }}>jjcmfkwrbwlsgcsdaaeb.supabase.co</div>
                </div>

                <div className="cc-kpi-card">
                  <div className="cc-kpi-header">
                    <span className="cc-kpi-title">UTMIFY API SERVER</span>
                    <CheckCircle size={16} style={{ color: '#10b981' }} />
                  </div>
                  <div style={{ fontSize: '13px', color: '#10b981', fontWeight: 700 }}>AUTENTICADO (HTTP 200)</div>
                  <div style={{ fontSize: '10px', color: '#64748b', marginTop: '4px' }}>Deduplicação & Idempotência ativa</div>
                </div>

                <div className="cc-kpi-card">
                  <div className="cc-kpi-header">
                    <span className="cc-kpi-title">GATEWAY BEEHIVE</span>
                    <CheckCircle size={16} style={{ color: '#10b981' }} />
                  </div>
                  <div style={{ fontSize: '13px', color: '#10b981', fontWeight: 700 }}>PIX LIVE & WEBHOOK</div>
                  <div style={{ fontSize: '10px', color: '#64748b', marginTop: '4px' }}>https://miraclebrasil.com/api/webhooks/beehive</div>
                </div>
              </div>
            </div>
          )}

          {/* =========================================================
              TAB: ORQUESTRADOR DE GATEWAYS DE PAGAMENTO PIX
              ========================================================= */}
          {activeTab === 'gateways' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              {/* Top Banner / Feedback */}
              {gatewayFeedback && (
                <div
                  style={{
                    padding: '14px 20px',
                    borderRadius: '8px',
                    fontFamily: 'JetBrains Mono, monospace',
                    fontSize: '13px',
                    background: gatewayFeedback.success ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                    color: gatewayFeedback.success ? '#10b981' : '#ef4444',
                    border: `1px solid ${gatewayFeedback.success ? 'rgba(16, 185, 129, 0.4)' : 'rgba(239, 68, 68, 0.4)'}`,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px'
                  }}
                >
                  {gatewayFeedback.success ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
                  <span>{gatewayFeedback.message}</span>
                </div>
              )}

              {/* Main Orchestrator Card */}
              <div className="cc-card">
                <div className="cc-card-header" style={{ justifyContent: 'space-between' }}>
                  <div className="cc-card-title">
                    <Sliders size={18} style={{ color: '#10b981' }} />
                    <span>Orquestrador de Gateway Pix & Checkout Transparente</span>
                  </div>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <span style={{ fontSize: '11px', color: '#94a3b8' }}>GATEWAY ATIVO:</span>
                    <span
                      style={{
                        padding: '3px 10px',
                        borderRadius: '4px',
                        fontSize: '11px',
                        fontWeight: 800,
                        letterSpacing: '0.05em',
                        background: gatewaySettings.activeGateway === 'axxonpay' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(56, 189, 248, 0.2)',
                        color: gatewaySettings.activeGateway === 'axxonpay' ? '#10b981' : '#38bdf8',
                        border: `1px solid ${gatewaySettings.activeGateway === 'axxonpay' ? 'rgba(16, 185, 129, 0.4)' : 'rgba(56, 189, 248, 0.4)'}`
                      }}
                    >
                      {gatewaySettings.activeGateway === 'axxonpay' ? '⚡ AXXONPAY (PRIMÁRIO)' : '🐝 BEEHIVE (PRIMÁRIO)'}
                    </span>
                  </div>
                </div>

                <div style={{ padding: '24px' }}>
                  <p style={{ color: '#94a3b8', fontSize: '13px', margin: '0 0 24px 0', lineHeight: 1.5 }}>
                    Escolha qual provedor processará os pagamentos Pix gerados no checkout da Miracle. Você pode alternar instantaneamente entre a <strong style={{ color: '#fff' }}>AxxonPay</strong> e a <strong style={{ color: '#fff' }}>Beehive</strong>, ajustar as chaves de API e configurar os webhooks de confirmação de pagamento.
                  </p>

                  <form onSubmit={handleSaveGatewaySettings}>
                    {/* Gateway Selection Grid */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px', marginBottom: '24px' }}>
                      
                      {/* Card 1: AxxonPay */}
                      <div
                        onClick={() => setGatewaySettings(prev => ({ ...prev, activeGateway: 'axxonpay' }))}
                        style={{
                          border: `2px solid ${gatewaySettings.activeGateway === 'axxonpay' ? '#10b981' : 'rgba(255, 255, 255, 0.08)'}`,
                          background: gatewaySettings.activeGateway === 'axxonpay' ? 'rgba(16, 185, 129, 0.04)' : 'rgba(15, 23, 42, 0.4)',
                          borderRadius: '10px',
                          padding: '20px',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                          position: 'relative'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <input
                              type="radio"
                              name="activeGateway"
                              checked={gatewaySettings.activeGateway === 'axxonpay'}
                              onChange={() => setGatewaySettings(prev => ({ ...prev, activeGateway: 'axxonpay' }))}
                              style={{ accentColor: '#10b981', cursor: 'pointer', width: '18px', height: '18px' }}
                            />
                            <span style={{ color: '#fff', fontWeight: 700, fontSize: '16px', letterSpacing: '-0.01em' }}>AxxonPay</span>
                          </div>
                          <div style={{ display: 'flex', gap: '6px' }}>
                            <span style={{ fontSize: '10px', padding: '2px 8px', borderRadius: '4px', background: 'rgba(16, 185, 129, 0.2)', color: '#10b981', fontWeight: 700 }}>
                              NOVO & RECOMENDADO
                            </span>
                          </div>
                        </div>

                        <p style={{ fontSize: '12px', color: '#94a3b8', margin: '0 0 16px 0', lineHeight: 1.4 }}>
                          Gateway moderno com liquidação rápida e suporte a Webhook direto para disparo no UTMify, Meta CAPI e TikTok Events.
                        </p>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }} onClick={e => e.stopPropagation()}>
                          <div className="cc-input-group">
                            <label className="cc-input-label">SECRET KEY (sk_...)</label>
                            <input
                              type="text"
                              className="cc-input-field"
                              value={gatewaySettings.axxonpay.secretKey}
                              onChange={(e) => setGatewaySettings(prev => ({
                                ...prev,
                                axxonpay: { ...prev.axxonpay, secretKey: e.target.value }
                              }))}
                              placeholder="sk_..."
                              style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '11px' }}
                            />
                          </div>

                          <div className="cc-input-group">
                            <label className="cc-input-label">PUBLIC KEY / SELLER ID (pk_...)</label>
                            <input
                              type="text"
                              className="cc-input-field"
                              value={gatewaySettings.axxonpay.publicKey}
                              onChange={(e) => setGatewaySettings(prev => ({
                                ...prev,
                                axxonpay: { ...prev.axxonpay, publicKey: e.target.value }
                              }))}
                              placeholder="pk_..."
                              style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '11px' }}
                            />
                          </div>

                          {/* Webhook Box */}
                          <div style={{ background: 'rgba(0, 0, 0, 0.3)', padding: '10px 12px', borderRadius: '6px', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                              <span style={{ fontSize: '10px', color: '#64748b', fontWeight: 700 }}>URL DO WEBHOOK PARA O PAINEL AXXONPAY:</span>
                              <button
                                type="button"
                                onClick={() => {
                                  navigator.clipboard.writeText('https://miraclebrasil.com/api/webhooks/axxonpay');
                                  setCopiedGatewayWebhook('axxonpay');
                                  setTimeout(() => setCopiedGatewayWebhook(null), 2500);
                                }}
                                style={{
                                  background: 'none',
                                  border: 'none',
                                  color: copiedGatewayWebhook === 'axxonpay' ? '#10b981' : '#38bdf8',
                                  cursor: 'pointer',
                                  fontSize: '11px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                  padding: 0
                                }}
                              >
                                {copiedGatewayWebhook === 'axxonpay' ? <CheckCheck size={13} /> : <Copy size={13} />}
                                {copiedGatewayWebhook === 'axxonpay' ? 'Copiado!' : 'Copiar'}
                              </button>
                            </div>
                            <code style={{ fontSize: '11px', color: '#cbd5e1', wordBreak: 'break-all', fontFamily: 'JetBrains Mono, monospace' }}>
                              https://miraclebrasil.com/api/webhooks/axxonpay
                            </code>
                          </div>
                        </div>
                      </div>

                      {/* Card 2: Beehive */}
                      <div
                        onClick={() => setGatewaySettings(prev => ({ ...prev, activeGateway: 'beehive' }))}
                        style={{
                          border: `2px solid ${gatewaySettings.activeGateway === 'beehive' ? '#38bdf8' : 'rgba(255, 255, 255, 0.08)'}`,
                          background: gatewaySettings.activeGateway === 'beehive' ? 'rgba(56, 189, 248, 0.04)' : 'rgba(15, 23, 42, 0.4)',
                          borderRadius: '10px',
                          padding: '20px',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                          position: 'relative'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <input
                              type="radio"
                              name="activeGateway"
                              checked={gatewaySettings.activeGateway === 'beehive'}
                              onChange={() => setGatewaySettings(prev => ({ ...prev, activeGateway: 'beehive' }))}
                              style={{ accentColor: '#38bdf8', cursor: 'pointer', width: '18px', height: '18px' }}
                            />
                            <span style={{ color: '#fff', fontWeight: 700, fontSize: '16px', letterSpacing: '-0.01em' }}>Beehive</span>
                          </div>
                          <span style={{ fontSize: '10px', padding: '2px 8px', borderRadius: '4px', background: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8', fontWeight: 700 }}>
                            SECUNDÁRIO / BACKUP
                          </span>
                        </div>

                        <p style={{ fontSize: '12px', color: '#94a3b8', margin: '0 0 16px 0', lineHeight: 1.4 }}>
                          Gateway alternativo configurado como redundância para garantir 100% de disponibilidade no checkout.
                        </p>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }} onClick={e => e.stopPropagation()}>
                          <div className="cc-input-group">
                            <label className="cc-input-label">CHAVE DE API / TOKEN BEEHIVE</label>
                            <input
                              type="text"
                              className="cc-input-field"
                              value={gatewaySettings.beehive.apiKey}
                              onChange={(e) => setGatewaySettings(prev => ({
                                ...prev,
                                beehive: { ...prev.beehive, apiKey: e.target.value }
                              }))}
                              placeholder="Chave Beehive (opcional se já no .env)"
                              style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '11px' }}
                            />
                          </div>

                          {/* Webhook Box */}
                          <div style={{ background: 'rgba(0, 0, 0, 0.3)', padding: '10px 12px', borderRadius: '6px', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                              <span style={{ fontSize: '10px', color: '#64748b', fontWeight: 700 }}>URL DO WEBHOOK BEEHIVE:</span>
                              <button
                                type="button"
                                onClick={() => {
                                  navigator.clipboard.writeText('https://miraclebrasil.com/api/webhooks/beehive');
                                  setCopiedGatewayWebhook('beehive');
                                  setTimeout(() => setCopiedGatewayWebhook(null), 2500);
                                }}
                                style={{
                                  background: 'none',
                                  border: 'none',
                                  color: copiedGatewayWebhook === 'beehive' ? '#10b981' : '#38bdf8',
                                  cursor: 'pointer',
                                  fontSize: '11px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                  padding: 0
                                }}
                              >
                                {copiedGatewayWebhook === 'beehive' ? <CheckCheck size={13} /> : <Copy size={13} />}
                                {copiedGatewayWebhook === 'beehive' ? 'Copiado!' : 'Copiar'}
                              </button>
                            </div>
                            <code style={{ fontSize: '11px', color: '#cbd5e1', wordBreak: 'break-all', fontFamily: 'JetBrains Mono, monospace' }}>
                              https://miraclebrasil.com/api/webhooks/beehive
                            </code>
                          </div>
                        </div>
                      </div>

                    </div>

                    {/* Fallback Switch */}
                    <div
                      style={{
                        padding: '16px 20px',
                        background: 'rgba(255, 255, 255, 0.03)',
                        borderRadius: '8px',
                        border: '1px solid rgba(255, 255, 255, 0.08)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        marginBottom: '24px'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <ShieldCheck size={22} style={{ color: '#10b981' }} />
                        <div>
                          <div style={{ color: '#fff', fontSize: '14px', fontWeight: 600 }}>
                            Proteção Anti-Perda de Vendas (Fallback Automático)
                          </div>
                          <div style={{ color: '#94a3b8', fontSize: '12px', marginTop: '2px' }}>
                            Se o gateway primário estiver fora do ar ou com lentidão momentânea, o checkout alterna instantaneamente para o gateway de contingência.
                          </div>
                        </div>
                      </div>
                      <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', gap: '8px' }}>
                        <input
                          type="checkbox"
                          checked={gatewaySettings.fallbackToBeehive}
                          onChange={(e) => setGatewaySettings(prev => ({ ...prev, fallbackToBeehive: e.target.checked }))}
                          style={{ accentColor: '#10b981', width: '18px', height: '18px', cursor: 'pointer' }}
                        />
                        <span style={{ fontSize: '12px', fontWeight: 600, color: gatewaySettings.fallbackToBeehive ? '#10b981' : '#64748b' }}>
                          {gatewaySettings.fallbackToBeehive ? 'ATIVADO' : 'DESATIVADO'}
                        </span>
                      </label>
                    </div>

                    {/* Save & Test Buttons */}
                    <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                      <button
                        type="submit"
                        className="cc-btn-primary"
                        disabled={isSavingGateway}
                        style={{ minWidth: '220px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                      >
                        <CheckCircle size={16} />
                        {isSavingGateway ? 'SALVANDO ALTERAÇÕES...' : 'SALVAR CONFIGURAÇÕES'}
                      </button>

                      <button
                        type="button"
                        onClick={handleTestPixGeneration}
                        disabled={testPixLoading}
                        style={{
                          background: 'rgba(56, 189, 248, 0.15)',
                          border: '1px solid rgba(56, 189, 248, 0.4)',
                          color: '#38bdf8',
                          borderRadius: '6px',
                          padding: '10px 20px',
                          fontSize: '13px',
                          fontWeight: 700,
                          cursor: testPixLoading ? 'not-allowed' : 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          transition: 'all 0.2s'
                        }}
                      >
                        <Zap size={16} />
                        {testPixLoading ? 'GERANDO PIX TESTE...' : 'TESTAR GERAÇÃO DE PIX AGORA'}
                      </button>
                    </div>
                  </form>

                  {/* Test Pix Result Display */}
                  {testPixResult && (
                    <div
                      style={{
                        marginTop: '24px',
                        padding: '20px',
                        borderRadius: '8px',
                        background: testPixResult.success ? 'rgba(16, 185, 129, 0.06)' : 'rgba(239, 68, 68, 0.06)',
                        border: `1px solid ${testPixResult.success ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          {testPixResult.success ? (
                            <CheckCircle size={18} style={{ color: '#10b981' }} />
                          ) : (
                            <AlertCircle size={18} style={{ color: '#ef4444' }} />
                          )}
                          <span style={{ fontWeight: 700, fontSize: '14px', color: testPixResult.success ? '#10b981' : '#ef4444' }}>
                            {testPixResult.success ? 'PIX DE TESTE GERADO COM SUCESSO!' : 'ERRO AO GERAR PIX DE TESTE'}
                          </span>
                        </div>
                        {testPixResult.gateway && (
                          <span style={{ fontSize: '11px', fontFamily: 'JetBrains Mono, monospace', padding: '2px 8px', borderRadius: '4px', background: 'rgba(255, 255, 255, 0.08)', color: '#94a3b8' }}>
                            GATEWAY: {testPixResult.gateway.toUpperCase()} {testPixResult.fallback ? '(FALLBACK ATIVADO)' : ''}
                          </span>
                        )}
                      </div>

                      {testPixResult.success ? (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
                          {testPixResult.qrCode && (
                            <div style={{ textAlign: 'center', background: '#fff', padding: '12px', borderRadius: '8px', maxWidth: '180px' }}>
                              <img
                                src={testPixResult.qrCode.startsWith('data:image') ? testPixResult.qrCode : `data:image/png;base64,${testPixResult.qrCode}`}
                                alt="QR Code Pix"
                                style={{ width: '100%', height: 'auto', display: 'block' }}
                              />
                              <span style={{ fontSize: '10px', color: '#333', fontWeight: 600 }}>Escaneie para pagar</span>
                            </div>
                          )}

                          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', flex: 1 }}>
                            <div>
                              <span style={{ fontSize: '11px', color: '#64748b' }}>TRANSACTION ID:</span>
                              <div style={{ fontSize: '12px', fontFamily: 'JetBrains Mono, monospace', color: '#fff' }}>
                                {testPixResult.transactionId || 'N/A'}
                              </div>
                            </div>

                            {testPixResult.copyPaste && (
                              <div>
                                <span style={{ fontSize: '11px', color: '#64748b' }}>CÓDIGO PIX COPIA E COLA:</span>
                                <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                                  <input
                                    readOnly
                                    value={testPixResult.copyPaste}
                                    style={{
                                      flex: 1,
                                      background: 'rgba(0,0,0,0.4)',
                                      border: '1px solid rgba(255,255,255,0.1)',
                                      borderRadius: '4px',
                                      padding: '6px 10px',
                                      fontSize: '11px',
                                      color: '#cbd5e1',
                                      fontFamily: 'JetBrains Mono, monospace'
                                    }}
                                  />
                                  <button
                                    type="button"
                                    onClick={() => {
                                      navigator.clipboard.writeText(testPixResult.copyPaste);
                                      alert('Código Pix Copiado com sucesso!');
                                    }}
                                    style={{
                                      background: 'rgba(16, 185, 129, 0.2)',
                                      border: '1px solid rgba(16, 185, 129, 0.4)',
                                      color: '#10b981',
                                      borderRadius: '4px',
                                      padding: '6px 12px',
                                      fontSize: '11px',
                                      fontWeight: 700,
                                      cursor: 'pointer'
                                    }}
                                  >
                                    Copiar
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div style={{ fontSize: '12px', color: '#fca5a5', fontFamily: 'JetBrains Mono, monospace' }}>
                          {testPixResult.error || JSON.stringify(testPixResult)}
                        </div>
                      )}
                    </div>
                  )}

                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* -------------------------------------------------------------
          DRAWER: TIMELINE DO VISITANTE
          ------------------------------------------------------------- */}
      {selectedVisitorSessionId && (
        <div className="cc-drawer-overlay" onClick={() => setSelectedVisitorSessionId(null)}>
          <div className="cc-drawer" onClick={(e) => e.stopPropagation()}>
            <div className="cc-drawer-header">
              <div>
                <span style={{ fontSize: '11px', fontFamily: 'JetBrains Mono', color: '#38bdf8' }}>SESSÃO DE VISITANTE</span>
                <h3 style={{ margin: '4px 0 0 0', fontSize: '18px', color: '#fff' }}>
                  {selectedVisitorData?.visitorCode || selectedVisitorSessionId}
                </h3>
              </div>
              <button
                style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
                onClick={() => setSelectedVisitorSessionId(null)}
              >
                <X size={20} />
              </button>
            </div>

            <div className="cc-drawer-body">
              {/* Visitor Summary Box */}
              <div style={{ background: 'rgba(15, 23, 42, 0.8)', padding: '16px', borderRadius: '10px', border: '1px solid rgba(139,92,246,0.2)', marginBottom: '20px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '12px' }}>
                  <div>
                    <span style={{ color: '#64748b', fontSize: '10px' }}>ENTRADA:</span>
                    <div style={{ color: '#fff', fontFamily: 'JetBrains Mono' }}>
                      {selectedVisitorData?.startedAt ? new Date(selectedVisitorData.startedAt).toLocaleTimeString('pt-BR') : '-'}
                    </div>
                  </div>
                  <div>
                    <span style={{ color: '#64748b', fontSize: '10px' }}>DISPOSITIVO:</span>
                    <div style={{ color: '#fff' }}>{selectedVisitorData?.deviceInfo?.os} • {selectedVisitorData?.deviceInfo?.device}</div>
                  </div>
                  <div>
                    <span style={{ color: '#64748b', fontSize: '10px' }}>ORIGEM:</span>
                    <div style={{ color: '#ec4899', fontWeight: 700 }}>{selectedVisitorData?.utmParams?.utm_source || 'Direto'}</div>
                  </div>
                  <div>
                    <span style={{ color: '#64748b', fontSize: '10px' }}>CLIENTE:</span>
                    <div style={{ color: selectedVisitorData?.customerData?.name ? '#10b981' : '#94a3b8' }}>
                      {selectedVisitorData?.customerData?.name || 'Não identificado'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Step-by-Step Action Timeline */}
              <h4 style={{ fontSize: '13px', color: '#fff', fontFamily: 'JetBrains Mono', margin: '0 0 12px 0' }}>
                TIMELINE DE AÇÕES DA SESSÃO:
              </h4>

              <div className="cc-timeline">
                {selectedVisitorTimeline.map((step, idx) => (
                  <div key={idx} className="cc-timeline-item active">
                    <div className="cc-timeline-dot" />
                    <div style={{ fontSize: '11px', fontFamily: 'JetBrains Mono', color: '#64748b' }}>
                      {new Date(step.timestamp).toLocaleTimeString('pt-BR')}
                    </div>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: '#fff', margin: '2px 0' }}>
                      {step.eventType.toUpperCase().replace(/_/g, ' ')}
                    </div>
                    <div style={{ fontSize: '11px', color: '#ec4899', fontFamily: 'JetBrains Mono' }}>
                      {step.path}
                    </div>
                  </div>
                ))}
                {selectedVisitorTimeline.length === 0 && (
                  <div style={{ color: '#64748b', fontSize: '12px' }}>Nenhum evento registrado nesta sessão.</div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* -------------------------------------------------------------
          MODAL: DETALHES DO PEDIDO
          ------------------------------------------------------------- */}
      {selectedOrder && (
        <div className="cc-drawer-overlay" onClick={() => setSelectedOrder(null)}>
          <div className="cc-drawer" style={{ width: '560px' }} onClick={(e) => e.stopPropagation()}>
            <div className="cc-drawer-header">
              <div>
                <span style={{ fontSize: '11px', fontFamily: 'JetBrains Mono', color: '#38bdf8' }}>DETALHES DO PEDIDO</span>
                <h3 style={{ margin: '4px 0 0 0', fontSize: '18px', color: '#fff' }}>
                  {selectedOrder.trackingReference || selectedOrder.id}
                </h3>
              </div>
              <button
                style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
                onClick={() => setSelectedOrder(null)}
              >
                <X size={20} />
              </button>
            </div>

            <div className="cc-drawer-body">
              {/* Status Header */}
              <div
                style={{
                  padding: '12px 16px',
                  borderRadius: '8px',
                  marginBottom: '12px',
                  background: selectedOrder.status === 'paid' ? 'rgba(16,185,129,0.15)' : 'rgba(245,158,11,0.15)',
                  color: selectedOrder.status === 'paid' ? '#10b981' : '#f59e0b',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  fontFamily: 'JetBrains Mono',
                  fontWeight: 700
                }}
              >
                <span>STATUS: {selectedOrder.status === 'paid' ? 'PAGO (CONFIRMADO)' : 'AGUARDANDO PIX'}</span>
                <span>R$ {Number(selectedOrder.amount).toFixed(2)}</span>
              </div>

              {/* Comprovante de Pagamento Anexado */}
              {selectedOrder.receipt && (
                <div
                  style={{
                    padding: '12px 16px',
                    borderRadius: '8px',
                    marginBottom: '16px',
                    background: 'rgba(236,72,153,0.1)',
                    border: '1px solid rgba(236,72,153,0.3)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Receipt size={16} color="#ec4899" />
                      <strong style={{ fontSize: '13px', color: '#fff' }}>Comprovante Pix Anexado</strong>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setPreviewReceiptModal({
                          url: selectedOrder.receipt!.url,
                          title: `Comprovante - ${selectedOrder.customer?.name || 'Cliente'} (${selectedOrder.id})`,
                          isPdf: selectedOrder.receipt?.fileType?.includes('pdf') || selectedOrder.receipt?.fileName?.endsWith('.pdf'),
                          orderId: selectedOrder.id,
                          amount: selectedOrder.amount,
                          customerName: selectedOrder.customer?.name,
                          isPaid: selectedOrder.status === 'paid'
                        });
                      }}
                      style={{
                        padding: '4px 10px',
                        borderRadius: '4px',
                        backgroundColor: '#ec4899',
                        border: 'none',
                        color: '#fff',
                        fontSize: '11px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      <Eye size={12} /> Ver Ampliado
                    </button>
                  </div>

                  <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    {selectedOrder.receipt.fileType?.includes('pdf') ? (
                      <div style={{ width: '40px', height: '40px', borderRadius: '4px', backgroundColor: '#fee2e2', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <FileText size={20} color="#ef4444" />
                      </div>
                    ) : (
                      <img
                        src={selectedOrder.receipt.url}
                        alt="Comprovante"
                        style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.1)' }}
                      />
                    )}
                    <div style={{ fontSize: '11px', color: '#cbd5e1' }}>
                      <div style={{ fontWeight: 600 }}>{selectedOrder.receipt.fileName || 'comprovante.png'}</div>
                      <div style={{ color: '#64748b' }}>
                        Enviado em: {selectedOrder.receipt.uploadedAt ? new Date(selectedOrder.receipt.uploadedAt).toLocaleString('pt-BR') : 'N/A'}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* PIX Copy Status Card */}
              <div
                style={{
                  padding: '12px 16px',
                  borderRadius: '8px',
                  marginBottom: '16px',
                  background: selectedOrder.pixCopied ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.1)',
                  border: selectedOrder.pixCopied ? '1px solid rgba(16,185,129,0.35)' : '1px solid rgba(239,68,68,0.25)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  fontFamily: 'JetBrains Mono'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {selectedOrder.pixCopied ? <Check size={16} color="#10b981" /> : <Clock size={16} color="#ef4444" />}
                  <span style={{ fontSize: '12px', fontWeight: 700, color: selectedOrder.pixCopied ? '#10b981' : '#ef4444' }}>
                    {selectedOrder.pixCopied ? 'CÓDIGO PIX COPIADO PELO LEAD' : 'CHAVE PIX AINDA NÃO COPIADA'}
                  </span>
                </div>
                {selectedOrder.pixCopiedAt && (
                  <span style={{ fontSize: '11px', color: '#94a3b8' }}>
                    {new Date(selectedOrder.pixCopiedAt).toLocaleString('pt-BR')}
                  </span>
                )}
              </div>

              {/* Customer & Address */}
              <div style={{ background: 'rgba(15,23,42,0.8)', padding: '16px', borderRadius: '10px', border: '1px solid rgba(139,92,246,0.2)', marginBottom: '16px' }}>
                <h4 style={{ margin: '0 0 8px 0', fontSize: '12px', color: '#ec4899', fontFamily: 'JetBrains Mono' }}>DADOS DO COMPRADOR</h4>
                <div style={{ fontSize: '13px', color: '#fff', fontWeight: 600 }}>{selectedOrder.customer?.name}</div>
                <div style={{ fontSize: '12px', color: '#94a3b8' }}>CPF: {selectedOrder.customer?.cpf}</div>
                <div style={{ fontSize: '12px', color: '#94a3b8' }}>E-mail: {selectedOrder.customer?.email}</div>
                <div style={{ fontSize: '12px', color: '#94a3b8' }}>Tel: {selectedOrder.customer?.phone}</div>
              </div>

              {/* Shipping Address */}
              {selectedOrder.shipping?.street && (
                <div style={{ background: 'rgba(15,23,42,0.8)', padding: '16px', borderRadius: '10px', border: '1px solid rgba(139,92,246,0.2)', marginBottom: '16px' }}>
                  <h4 style={{ margin: '0 0 8px 0', fontSize: '12px', color: '#38bdf8', fontFamily: 'JetBrains Mono' }}>ENDEREÇO DE ENTREGA</h4>
                  <div style={{ fontSize: '13px', color: '#fff' }}>
                    {selectedOrder.shipping.street}, {selectedOrder.shipping.number}
                  </div>
                  <div style={{ fontSize: '12px', color: '#94a3b8' }}>
                    {selectedOrder.shipping.neighborhood} - {selectedOrder.shipping.city}/{selectedOrder.shipping.state}
                  </div>
                  <div style={{ fontSize: '12px', color: '#94a3b8' }}>CEP: {selectedOrder.shipping.zipCode}</div>
                </div>
              )}

              {/* Items */}
              <div style={{ background: 'rgba(15,23,42,0.8)', padding: '16px', borderRadius: '10px', border: '1px solid rgba(139,92,246,0.2)', marginBottom: '16px' }}>
                <h4 style={{ margin: '0 0 8px 0', fontSize: '12px', color: '#8b5cf6', fontFamily: 'JetBrains Mono' }}>PRODUTOS</h4>
                {selectedOrder.items?.map((item, idx) => (
                  <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', padding: '6px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <div>
                      <div style={{ color: '#fff', fontWeight: 600 }}>{item.title}</div>
                      <div style={{ fontSize: '11px', color: '#94a3b8' }}>Qtd: {item.quantity} {item.selectedSize ? `| Tam: ${item.selectedSize}` : ''}</div>
                    </div>
                    <div style={{ color: '#fff', fontWeight: 700 }}>
                      R$ {((item.unitPrice ? item.unitPrice / 100 : selectedOrder.amount) * item.quantity).toFixed(2)}
                    </div>
                  </div>
                ))}
              </div>

              {/* Logistic & Tracking Management */}
              <div style={{ background: 'rgba(15,23,42,0.95)', padding: '16px', borderRadius: '10px', border: '1px solid rgba(6,182,212,0.3)', marginBottom: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <h4 style={{ margin: 0, fontSize: '12px', color: '#38bdf8', fontFamily: 'JetBrains Mono', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Truck size={14} /> GESTÃO DE RASTREAMENTO & LOGÍSTICA
                  </h4>
                  <span style={{ fontSize: '10px', fontFamily: 'JetBrains Mono', color: '#94a3b8' }}>
                    {selectedOrder.elapsedHours ? `(${selectedOrder.elapsedHours}h decorridas)` : ''}
                  </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '12px' }}>
                  <div>
                    <label style={{ fontSize: '11px', color: '#94a3b8', display: 'block', marginBottom: '4px', fontFamily: 'JetBrains Mono' }}>
                      CÓDIGO DE RASTREIO:
                    </label>
                    <input
                      type="text"
                      className="cc-input-field"
                      style={{ width: '100%', padding: '8px 10px', fontSize: '12px', fontFamily: 'JetBrains Mono', color: '#38bdf8', fontWeight: 700 }}
                      value={editTrackingCode}
                      onChange={(e) => setEditTrackingCode(e.target.value.toUpperCase())}
                      placeholder="Ex: MB-8F3K92 ou Correios"
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '11px', color: '#94a3b8', display: 'block', marginBottom: '4px', fontFamily: 'JetBrains Mono' }}>
                      STATUS LOGÍSTICO:
                    </label>
                    <select
                      className="cc-input-field"
                      style={{ width: '100%', padding: '8px 10px', fontSize: '12px', cursor: 'pointer' }}
                      value={editLogisticStatus}
                      onChange={(e) => setEditLogisticStatus(e.target.value)}
                    >
                      <option value="">Automático (+24h = Transporte)</option>
                      <option value="preparing">Forçar: Em Separação</option>
                      <option value="in_transit">Forçar: Em Transporte (Trânsito)</option>
                      <option value="delivered">Forçar: Entregue</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    className="cc-btn-primary"
                    style={{ width: 'auto', padding: '8px 14px', fontSize: '12px', background: '#0284c7' }}
                    onClick={() => handleSaveTracking(selectedOrder.id)}
                    disabled={isUpdatingTracking}
                  >
                    {isUpdatingTracking ? 'Salvando...' : 'Salvar Rastreio'}
                  </button>

                  <a
                    href={`/rastreio?codigo=${encodeURIComponent(selectedOrder.trackingReference || selectedOrder.id)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="cc-nav-item"
                    style={{ width: 'auto', padding: '8px 12px', fontSize: '12px', color: '#38bdf8', background: 'rgba(56,189,248,0.1)', textDecoration: 'none', border: '1px solid rgba(56,189,248,0.3)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                  >
                    <ExternalLink size={13} />
                    Ver Página de Rastreio
                  </a>
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                <button
                  className="cc-btn-primary"
                  style={{ background: '#22c55e', flex: 1, padding: '12px', fontSize: '13px' }}
                  onClick={() => handleSendTrackingWhatsApp(selectedOrder)}
                >
                  <Truck size={15} />
                  Enviar Rastreio no WhatsApp
                </button>

                <button
                  className="cc-btn-primary"
                  style={{ background: '#0284c7', flex: 1, padding: '12px', fontSize: '13px' }}
                  onClick={() => handleOpenWhatsApp(selectedOrder)}
                >
                  <MessageCircle size={15} />
                  Falar no WhatsApp
                </button>

                {selectedOrder.status !== 'paid' && (
                  <button
                    className="cc-btn-primary"
                    style={{ background: '#10b981', flex: 1, padding: '12px', fontSize: '13px' }}
                    onClick={() => handleApproveOrder(selectedOrder.id)}
                  >
                    <CheckCircle size={15} />
                    Aprovar Pedido
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
      {/* -------------------------------------------------------------
          MODAL: DETALHES DO CARTÃO RECUSADO
          ------------------------------------------------------------- */}
      {selectedDeclinedCard && (
        <div className="cc-drawer-overlay" onClick={() => setSelectedDeclinedCard(null)}>
          <div className="cc-drawer" style={{ width: '540px' }} onClick={(e) => e.stopPropagation()}>
            <div className="cc-drawer-header">
              <div>
                <span style={{ fontSize: '11px', fontFamily: 'JetBrains Mono', color: '#ef4444' }}>TENTATIVA DE CARTÃO NEGADA</span>
                <h3 style={{ margin: '4px 0 0 0', fontSize: '18px', color: '#fff' }}>
                  {selectedDeclinedCard.id}
                </h3>
              </div>
              <button
                style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
                onClick={() => setSelectedDeclinedCard(null)}
              >
                <X size={20} />
              </button>
            </div>

            <div className="cc-drawer-body">
              {/* Status Header */}
              <div
                style={{
                  padding: '14px 18px',
                  borderRadius: '10px',
                  marginBottom: '20px',
                  background: 'rgba(239,68,68,0.15)',
                  border: '1px solid rgba(239,68,68,0.35)',
                  color: '#ef4444',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  fontFamily: 'JetBrains Mono',
                  fontWeight: 700
                }}
              >
                <span>MOTIVO: RECUSA BANCÁRIA</span>
                <span style={{ color: '#fff' }}>R$ {Number(selectedDeclinedCard.amount).toFixed(2)}</span>
              </div>

              {/* Customer Details */}
              <div style={{ background: 'rgba(15,23,42,0.85)', padding: '18px', borderRadius: '12px', border: '1px solid rgba(139,92,246,0.25)', marginBottom: '16px' }}>
                <h4 style={{ margin: '0 0 10px 0', fontSize: '12px', color: '#ec4899', fontFamily: 'JetBrains Mono' }}>DADOS DO COMPRADOR</h4>
                <div style={{ fontSize: '14px', color: '#fff', fontWeight: 700 }}>{selectedDeclinedCard.customer?.name}</div>
                <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '4px' }}>CPF: {selectedDeclinedCard.customer?.cpf}</div>
                <div style={{ fontSize: '12px', color: '#94a3b8' }}>E-mail: {selectedDeclinedCard.customer?.email}</div>
                <div style={{ fontSize: '12px', color: '#38bdf8', fontFamily: 'JetBrains Mono' }}>WhatsApp: {selectedDeclinedCard.customer?.phone}</div>
              </div>

              {/* Card Info */}
              <div style={{ background: 'rgba(15,23,42,0.85)', padding: '18px', borderRadius: '12px', border: '1px solid rgba(139,92,246,0.25)', marginBottom: '16px' }}>
                <h4 style={{ margin: '0 0 10px 0', fontSize: '12px', color: '#38bdf8', fontFamily: 'JetBrains Mono' }}>DADOS DA TENTATIVA</h4>
                <div style={{ fontSize: '13px', color: '#fff' }}>
                  Bandeira: {selectedDeclinedCard.cardBrand || 'Cartão'} {selectedDeclinedCard.cardLast4 ? `(Final ${selectedDeclinedCard.cardLast4})` : ''}
                </div>
                <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '2px' }}>
                  Parcelas solicitadas: {selectedDeclinedCard.installments || 1}x
                </div>
                <div style={{ fontSize: '12px', color: '#f59e0b', marginTop: '4px' }}>
                  Status: Transação não autorizada pela operadora do cartão
                </div>
              </div>

              {/* Items in Cart */}
              {selectedDeclinedCard.items && selectedDeclinedCard.items.length > 0 && (
                <div style={{ background: 'rgba(15,23,42,0.85)', padding: '18px', borderRadius: '12px', border: '1px solid rgba(139,92,246,0.25)', marginBottom: '24px' }}>
                  <h4 style={{ margin: '0 0 10px 0', fontSize: '12px', color: '#8b5cf6', fontFamily: 'JetBrains Mono' }}>PRODUTOS NO CARRINHO</h4>
                  {selectedDeclinedCard.items.map((item, idx) => (
                    <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', padding: '6px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                      <div>
                        <div style={{ color: '#fff', fontWeight: 600 }}>{item.title}</div>
                        <div style={{ fontSize: '11px', color: '#94a3b8' }}>Qtd: {item.quantity} {item.size ? `| Tam: ${item.size}` : ''}</div>
                      </div>
                      <div style={{ color: '#fff', fontWeight: 700 }}>
                        R$ {((item.unitPrice ? item.unitPrice / 100 : selectedDeclinedCard.amount) * item.quantity).toFixed(2)}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Action Button */}
              <button
                className="cc-btn-primary"
                style={{ background: '#22c55e', width: '100%', padding: '16px', fontSize: '14px' }}
                onClick={() => handleWhatsAppRecovery(selectedDeclinedCard)}
              >
                <MessageCircle size={18} />
                Enviar Script de Recuperação no WhatsApp
              </button>
            </div>
          </div>
        </div>
      )}

      {/* -------------------------------------------------------------
          LIGHTBOX MODAL: VISUALIZADOR DE COMPROVANTE
          ------------------------------------------------------------- */}
      {previewReceiptModal && (
        <div
          className="cc-drawer-overlay"
          style={{ zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}
          onClick={() => setPreviewReceiptModal(null)}
        >
          <div
            style={{
              width: '90%',
              maxWidth: '850px',
              maxHeight: '92vh',
              backgroundColor: '#0f172a',
              borderRadius: '12px',
              border: '1px solid rgba(255,255,255,0.15)',
              boxShadow: '0 25px 50px -12px rgba(0,0,0,0.8)',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div
              style={{
                padding: '16px 20px',
                borderBottom: '1px solid rgba(255,255,255,0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '12px'
              }}
            >
              <div>
                <strong style={{ fontSize: '15px', color: '#fff', display: 'block' }}>
                  {previewReceiptModal.title}
                </strong>
                {previewReceiptModal.amount && (
                  <span style={{ fontSize: '12px', color: '#10b981', fontWeight: 600 }}>
                    Valor do Pedido: R$ {previewReceiptModal.amount.toFixed(2)}
                  </span>
                )}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <a
                  href={previewReceiptModal.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  download
                  style={{
                    padding: '6px 12px',
                    borderRadius: '6px',
                    backgroundColor: 'rgba(56, 189, 248, 0.15)',
                    border: '1px solid rgba(56, 189, 248, 0.4)',
                    color: '#38bdf8',
                    fontSize: '12px',
                    fontWeight: 600,
                    textDecoration: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <Download size={14} /> Baixar
                </a>

                {previewReceiptModal.orderId && !previewReceiptModal.isPaid && (
                  <button
                    onClick={async () => {
                      await handleApproveOrder(previewReceiptModal.orderId!);
                      setPreviewReceiptModal((prev) => (prev ? { ...prev, isPaid: true } : null));
                    }}
                    style={{
                      padding: '6px 14px',
                      borderRadius: '6px',
                      backgroundColor: '#10b981',
                      border: 'none',
                      color: '#fff',
                      fontSize: '12px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                  >
                    <CheckCircle size={14} /> Aprovar Pedido Agora
                  </button>
                )}

                <button
                  onClick={() => setPreviewReceiptModal(null)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#94a3b8',
                    cursor: 'pointer',
                    padding: '6px',
                    borderRadius: '6px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div
              style={{
                flex: 1,
                overflow: 'auto',
                padding: '20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: '#020617'
              }}
            >
              {previewReceiptModal.isPdf ? (
                <iframe
                  src={previewReceiptModal.url}
                  style={{ width: '100%', height: '70vh', border: 'none', borderRadius: '8px' }}
                  title="PDF Comprovante"
                />
              ) : (
                <img
                  src={previewReceiptModal.url}
                  alt="Comprovante de Pagamento"
                  style={{ maxWidth: '100%', maxHeight: '72vh', objectFit: 'contain', borderRadius: '8px' }}
                />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
