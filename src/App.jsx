import React, { useState, useEffect, useMemo } from 'react';
import { initializeApp } from 'firebase/app';
import FluxoInterativoEsperanca from './components/EvangelismoFlow';
import { 
  getAuth, 
  signInAnonymously, 
  onAuthStateChanged, 
  signInWithCustomToken 
} from 'firebase/auth';
import { 
  getFirestore, 
  collection, 
  addDoc, 
  onSnapshot, 
  doc, 
  updateDoc, 
  deleteDoc, 
  query, 
  serverTimestamp,
  increment,
  setDoc,
  getDoc
} from 'firebase/firestore';
import { 
  Heart, 
  Send, 
  Plus, 
  User, 
  CheckCircle2, 
  MessageCircle, 
  X, 
  Phone, 
  Home, 
  Calendar, 
  MapPin, 
  Clock, 
  BookOpen, 
  Lock, 
  ChevronRight, 
  Filter, 
  Trash2, 
  Bell, 
  AlertTriangle, 
  ExternalLink, 
  Quote, 
  Sparkles, 
  Wand2, 
  Share2, 
  CalendarCheck,
  Info,
  ShieldCheck,
  Scale,
  History,
  Target,
  Users,
  Church,
  Printer,
  ScrollText,
  BarChart3,
  Eye
<<<<<<< HEAD
  Flame,
  sun,
  ArrowRight,
  ChevronLeft,
=======
>>>>>>> 4697b7b1200c22ed39501a425298a7a650ecddfb
} from 'lucide-react';

// --- CONFIGURAÇÃO E SEGURANÇA ---

const getFirebaseConfig = () => {
  try {
    if (typeof __firebase_config !== 'undefined' && __firebase_config) {
      return JSON.parse(__firebase_config);
    }
  } catch (e) {
    console.error("Erro ao ler __firebase_config:", e);
  }

  return {
    apiKey: "AIzaSyC3xZnuo6BkMPtHBPkFgk6dZ5mbKePmwwM",
    authDomain: "evangelismo-pedidos.firebaseapp.com",
    projectId: "evangelismo-pedidos",
    storageBucket: "evangelismo-pedidos.firebasestorage.app",
    messagingSenderId: "750023798468",
    appId: "1:750023798468:web:9e1d1faf0f3c7765b06391",
    measurementId: "G-9VHTNBTD47"
  };
};

const firebaseConfig = getFirebaseConfig();

let app, auth, db;
try {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
} catch (e) {
  console.error("Erro na inicialização do Firebase:", e);
}

const rawAppId = typeof __app_id !== 'undefined' ? __app_id : 'tmhe-church-app';
const appId = rawAppId.replace(/\//g, '_');

// --- DADOS ESTÁTICOS: VERSÍCULOS ---
const BIBLE_VERSES = [
  { text: "O Senhor é o meu pastor; nada me faltará.", ref: "Salmos 23:1" },
  { text: "Posso todas as coisas naquele que me fortalece.", ref: "Filipenses 4:13" },
  { text: "Lâmpada para os meus pés é tua palavra e luz, para o meu caminho.", ref: "Salmos 119:105" },
  { text: "Deus é o nosso refúgio e fortaleza, socorro bem presente na angústia.", ref: "Salmos 46:1" },
  { text: "Seja forte e corajoso! Não se apavore nem desanime.", ref: "Josué 1:9" },
  { text: "A alegria do Senhor é a vossa força.", ref: "Neemias 8:10" },
  { text: "Peçam, e lhes será dado; busquem, e encontrarão.", ref: "Mateus 7:7" },
  { text: "Tudo o que fizerem, façam de todo o coração, como para o Senhor.", ref: "Colossenses 3:23" }
];

// --- COMPONENTES AUXILIARES ---

const Header = ({ isScrolled, onLoginClick, onLogoClick, pendingCount }) => (
  <header className={`bg-[#051c38] text-white shadow-2xl rounded-b-[2.5rem] sticky top-0 z-30 border-b border-[#cfa855]/20 transition-all duration-500 ease-in-out ${isScrolled ? 'h-20 shadow-lg' : 'h-56'}`}>
    <div className="absolute top-4 right-4 z-40">
       <button 
         onClick={onLoginClick} 
         className={`relative bg-white/10 hover:bg-white/20 rounded-full text-white/70 transition-all border border-white/5 ${isScrolled ? 'p-1.5 opacity-50' : 'p-2'}`}
       >
         <Lock size={isScrolled ? 14 : 18} />
         {pendingCount > 0 && (
           <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[9px] font-black w-4 h-4 flex items-center justify-center rounded-full animate-bounce shadow-lg ring-2 ring-[#051c38]">
             {pendingCount}
           </span>
         )}
       </button>
    </div>

    <div 
      onClick={onLogoClick}
      className="flex flex-col items-center justify-center h-full px-4 overflow-hidden text-center cursor-pointer group/logo"
    >
      <div className={`relative flex items-center justify-center transition-all duration-500 ease-out transform group-active/logo:scale-95 ${isScrolled ? 'scale-0 h-0 opacity-0' : 'scale-100 h-28 w-28 mb-3 opacity-100'}`}>
        <div className="absolute inset-0 border-2 border-[#cfa855] rounded-full animate-pulse group-hover/logo:border-white transition-colors"></div>
        <img
          src="/logo.png"
          alt="TMHE Logo"
          className="z-10 w-24 h-24 object-contain"
          onError={(e) => { e.target.src = "https://via.placeholder.com/150?text=TMHE"; }}
        />
      </div>
      
      <div className="transition-all duration-500 ease-out">
        <h1 className={`font-bold tracking-wider text-white transition-all duration-500 group-hover/logo:text-[#cfa855] ${isScrolled ? 'text-xl' : 'text-2xl'}`}>
          TMHE
        </h1>
        <p className={`uppercase tracking-[0.15em] text-[#cfa855] font-semibold transition-all duration-500 group-hover/logo:text-white ${isScrolled ? 'text-[8px] opacity-70' : 'text-[10px]'}`}>
          Templo Missionário Há Esperança
        </p>
      </div>
    </div>
  </header>
);

const LegalModal = ({ isOpen, onClose }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center px-4 bg-black/80 backdrop-blur-md">
      <div className="bg-white w-full max-w-sm rounded-[2rem] shadow-2xl overflow-hidden animate-bounce-in max-h-[85vh] flex flex-col text-left">
        <div className="bg-[#051c38] p-6 text-white flex justify-between items-center shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#cfa855] rounded-xl"><ShieldCheck size={20} className="text-[#051c38]" /></div>
            <h3 className="font-bold text-lg">Termos e Privacidade</h3>
          </div>
          <button onClick={onClose} className="p-2 text-white/50 hover:text-white"><X size={20} /></button>
        </div>
        <div className="p-6 space-y-4 overflow-y-auto text-sm text-slate-600 leading-relaxed no-scrollbar text-left">
          <section>
            <h4 className="font-bold text-[#051c38] mb-1 text-left">1. Coleta de Dados (LGPD)</h4>
            <p className="text-left">Ao utilizar nossos formulários, consente com a coleta do seu nome, contato e endereço para fins de apoio espiritual e eclesiástico.</p>
          </section>
          <section>
            <h4 className="font-bold text-[#051c38] mb-1 text-left">2. Sigilo Pastoral</h4>
            <p className="text-left">Pedidos de oração e solicitações de visita são tratados com estrito sigilo interno pela liderança do Templo Missionário Há Esperança.</p>
          </section>
          <section className="bg-amber-50 p-3 rounded-xl border border-amber-100">
            <h4 className="font-bold text-amber-800 mb-1 flex items-center gap-2 text-left"><Quote size={14} /> 3. Teor Público dos Testemunhos</h4>
            <p className="text-amber-900 text-xs font-medium text-left">Ao publicar uma mensagem na seção "Vitórias", o usuário reconhece e aceita o seu **caráter público**. Estas mensagens destinam-se à edificação e encorajamento de todos os membros e visitantes da comunidade TMHE que acedam à aplicação.</p>
          </section>
          <section>
            <h4 className="font-bold text-[#051c38] mb-1 text-left">4. Direitos do Usuário</h4>
            <p className="text-left">Pode solicitar a remoção de qualquer conteúdo de sua autoria ou a retificação de dados através da nossa secretaria presencial.</p>
          </section>
        </div>
        <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-center">
          <button onClick={onClose} className="bg-[#051c38] text-white px-8 py-3 rounded-2xl font-bold text-xs uppercase tracking-widest shadow-lg">Entendido</button>
        </div>
      </div>
    </div>
  );
};

const ScheduleModal = ({ isOpen, onClose }) => {
  if (!isOpen) return null;
  const schedules = [
    { day: 'Domingo', events: [{ name: 'Escola Bíblica Dominical', time: '10:00 - 11:30' }, { name: 'Culto de Adoração', time: '19:00 - 21:00' }] },
    { day: 'Quarta-feira', events: [{ name: 'Culto de Consagração', time: '19:00 - 21:00' }] },
    { day: 'Sexta-feira', events: [{ name: 'Culto de Libertação', time: '19:00 - 21:00' }] }
  ];
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center px-4 bg-black/60 backdrop-blur-sm text-left">
      <div className="bg-white w-full max-w-sm rounded-[2.5rem] shadow-2xl overflow-hidden animate-bounce-in border border-slate-100">
        <div className="bg-[#051c38] p-6 text-white flex justify-between items-center border-b border-[#cfa855]/30">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#cfa855] rounded-xl"><Calendar size={20} className="text-[#051c38]" /></div>
            <h3 className="font-bold text-lg tracking-tight">Horários de Cultos</h3>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full text-white/70"><X size={20} /></button>
        </div>
        <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto no-scrollbar text-left">
          {schedules.map((item, idx) => (
            <div key={idx} className="space-y-3">
              <h4 className="text-xs font-black uppercase tracking-[0.2em] text-[#cfa855] flex items-center gap-2">
                <span className="w-1 h-3 bg-[#cfa855] rounded-full"></span>{item.day}
              </h4>
              <div className="space-y-2">
                {item.events.map((event, eIdx) => (
                  <div key={eIdx} className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex items-center justify-between group">
                    <span className="text-sm font-bold text-slate-800 leading-tight">{event.name}</span>
                    <div className="shrink-0 flex items-center gap-2 text-[#cfa855] font-bold text-xs bg-white px-3 py-1.5 rounded-xl border border-slate-100 shadow-sm whitespace-nowrap ml-2"><Clock size={12} />{event.time}</div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div className="p-6 bg-slate-50 border-t border-slate-100 text-center"><p className="text-[10px] text-slate-400 italic font-medium">"Alegrei-me quando me disseram: Vamos à casa do Senhor." (Salmos 122:1)</p></div>
      </div>
    </div>
  );
};

const Notification = ({ message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 6000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className={`fixed top-4 left-4 right-4 md:left-auto md:w-80 z-50 p-5 rounded-2xl shadow-2xl flex items-start gap-4 animate-bounce-in border-l-[6px] ${
      type === 'success' ? 'bg-white border-green-500 text-slate-800' : 'bg-white border-red-500 text-slate-800'
    }`}>
      <div className={`p-2 rounded-full shrink-0 ${type === 'success' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
        {type === 'success' ? <CheckCircle2 size={24} /> : <X size={24} />}
      </div>
      <div className="flex flex-col gap-1 text-left">
        <span className="font-bold text-sm leading-tight">{type === 'success' ? 'Sucesso!' : 'Ocorreu um erro'}</span>
        <span className="text-xs text-slate-500 leading-relaxed font-medium">{message}</span>
      </div>
      <button onClick={onClose} className="text-slate-300 hover:text-slate-500 ml-auto shrink-0"><X size={16} /></button>
    </div>
  );
};

// --- COMPONENTE PRINCIPAL ---

export default function App() {
  const [user, setUser] = useState(null);
  const [view, setView] = useState('home'); 
  const [allRequests, setAllRequests] = useState([]);
  const [analytics, setAnalytics] = useState({ total: 0, today: 0 });
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState(null);
  const [showSchedule, setShowSchedule] = useState(false);
  const [showLegal, setShowLegal] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  
  const isConfigPlaceholder = firebaseConfig.apiKey === "SUA_API_KEY_AQUI";
  const [configMissing, setConfigMissing] = useState(isConfigPlaceholder);
  
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminPin, setAdminPin] = useState('');
  const [filterType, setFilterType] = useState('all');

  const [formData, setFormData] = useState({
    name: '', contact: '', message: '', address: '', preferredDays: [], timeSlot: '', isAnonymous: false, title: '', wantContact: false
  });

  const dailyVerse = useMemo(() => {
    const day = new Date().getDate();
    return BIBLE_VERSES[day % BIBLE_VERSES.length];
  }, []);

  const pendingCount = useMemo(() => {
    return allRequests.filter(r => r.status === 'pending').length;
  }, [allRequests]);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (configMissing) { setLoading(false); return; }
    const initAuth = async () => {
      try {
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
          await signInWithCustomToken(auth, __initial_auth_token);
        } else { await signInAnonymously(auth); }
      } catch (err) { console.error("Erro Auth:", err); }
    };
    initAuth();
    return onAuthStateChanged(auth, (u) => { setUser(u); setLoading(false); });
  }, [configMissing]);

  // Melhoria: Rastrear acesso único por sessão
  useEffect(() => {
    if (!user || configMissing) return;
    
    const trackVisit = async () => {
      if (sessionStorage.getItem('tmhe_counted')) return;
      
      const today = new Date().toISOString().split('T')[0];
      const statsRef = doc(db, 'artifacts', appId, 'public', 'data', 'analytics', 'stats');
      
      try {
        await setDoc(statsRef, {
          total: increment(1),
          [`daily.${today}`]: increment(1)
        }, { merge: true });
        sessionStorage.setItem('tmhe_counted', 'true');
      } catch (e) {
        console.error("Erro ao rastrear acesso:", e);
      }
    };
    
    trackVisit();
  }, [user, configMissing]);

  useEffect(() => {
    if (!user || configMissing) return;
    const qRequests = query(collection(db, 'artifacts', appId, 'public', 'data', 'requests'));
    const unsubRequests = onSnapshot(qRequests, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setAllRequests(data.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0)));
    });

    const statsRef = doc(db, 'artifacts', appId, 'public', 'data', 'analytics', 'stats');
    const unsubStats = onSnapshot(statsRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        const todayKey = new Date().toISOString().split('T')[0];
        setAnalytics({
          total: data.total || 0,
          today: data.daily?.[todayKey] || 0
        });
      }
    });

    return () => { unsubRequests(); unsubStats(); };
  }, [user, configMissing]);

  const notify = (msg, type = 'success') => setNotification({ msg, type });

  const handleWhatsAppFormat = (value) => {
    let v = value.replace(/\D/g, "");
    if (v.length > 11) v = v.slice(0, 11);
    let formatted = v;
    if (v.length > 0) {
      formatted = `(${v.slice(0, 2)}`;
      if (v.length > 2) {
        formatted += `) ${v.slice(2, 7)}`;
        if (v.length > 7) { formatted += `-${v.slice(7)}`; }
      }
    }
    return formatted;
  };

  const handleWhatsAppChange = (e) => {
    const formatted = handleWhatsAppFormat(e.target.value);
    setFormData({ ...formData, contact: formatted });
  };

  const handleDayToggle = (day) => {
    const days = formData.preferredDays.includes(day)
      ? formData.preferredDays.filter(d => d !== day)
      : [...formData.preferredDays, day];
    setFormData({ ...formData, preferredDays: days });
  };

  const handleShare = async () => {
    const url = window.location.href;
    const shareData = { title: 'TMHE', text: 'Conheça o aplicativo do TMHE.', url: url };
    const copyToClipboard = async () => {
      try {
        const textArea = document.createElement("textarea");
        textArea.value = url; document.body.appendChild(textArea);
        textArea.select(); document.execCommand('copy');
        document.body.removeChild(textArea);
        notify('Link copiado para a área de transferência!', 'success');
      } catch (e) { notify('Erro ao copiar link.', 'error'); }
    };
    if (navigator.share) {
      try { await navigator.share(shareData); } catch (err) { if (err.name !== 'AbortError') await copyToClipboard(); }
    } else {
      await copyToClipboard();
    }
  };

  const handleLike = async (id) => {
    try {
      const testimonyRef = doc(db, 'artifacts', appId, 'public', 'data', 'requests', id);
      await updateDoc(testimonyRef, { likes: increment(1) });
    } catch (err) { console.error("Erro ao curtir:", err); }
  };

  const handlePrintVisit = (req) => {
    const printWindow = window.open('', '_blank');
    const htmlContent = `
      <html>
        <head>
          <title>Ficha de Visita - TMHE</title>
          <style>
            body { font-family: 'Arial', sans-serif; padding: 40px; color: #333; line-height: 1.6; }
            .header { text-align: center; border-bottom: 2px solid #051c38; padding-bottom: 10px; margin-bottom: 30px; }
            .church-name { font-size: 24px; font-weight: bold; color: #051c38; margin: 0; }
            .doc-title { font-size: 14px; text-transform: uppercase; color: #cfa855; letter-spacing: 2px; }
            .field { margin-bottom: 20px; border-bottom: 1px solid #eee; padding-bottom: 10px; }
            .label { font-size: 10px; font-weight: bold; text-transform: uppercase; color: #888; display: block; margin-bottom: 5px; }
            .value { font-size: 16px; font-weight: 500; }
            .footer { margin-top: 50px; text-align: center; font-size: 10px; color: #aaa; font-style: italic; border-top: 1px solid #eee; padding-top: 20px; }
            @media print { .no-print { display: none; } }
          </style>
        </head>
        <body>
          <div class="header">
            <p class="church-name">Templo Missionário Há Esperança</p>
            <p class="doc-title">Ficha de Visita Pastoral</p>
          </div>
          <div class="field"><span class="label">Nome do Visitado:</span><div class="value">${req.name}</div></div>
          <div class="field"><span class="label">WhatsApp:</span><div class="value">${req.contact}</div></div>
          <div class="field"><span class="label">Endereço:</span><div class="value">${req.address}</div></div>
          <div class="field"><span class="label">Melhor Dia/Horário:</span><div class="value">${req.preferredDays.join(', ')} às ${req.timeSlot}h</div></div>
          <div class="field"><span class="label">Observações Pastorais:</span><div class="value">${req.message || 'Nenhuma observação informada.'}</div></div>
          <div class="footer">Gerado em ${new Date().toLocaleString()} via Aplicativo Digital TMHE</div>
          <script>window.print();</script>
        </body>
      </html>
    `;
    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };


  const handleSubmitRequest = async (type) => {
    if (type === 'prayer' && !formData.message) return notify('Escreva seu pedido de oração.', 'error');
    if (type === 'visit' && (!formData.name || !formData.contact || !formData.address || formData.preferredDays.length === 0 || !formData.timeSlot)) {
      return notify('Por favor, preencha todos os campos obrigatórios da visita.', 'error');
    }
    if (type === 'testimony' && (!formData.name || !formData.title || !formData.message)) return notify('Preencha todos os campos do testemunho.', 'error');
    
    try {
      await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'requests'), {
        ...formData, 
        type, 
        status: 'pending', 
        createdAt: serverTimestamp(), 
        userId: user.uid, 
        likes: type === 'testimony' ? 0 : null
      });
      
      if (type === 'visit') {
        notify('A igreja entrará em contato para confirmar a visita.', 'success');
      } else {
        notify('Sua mensagem foi enviada com sucesso!', 'success');
      }

      setFormData({ name: '', contact: '', message: '', address: '', preferredDays: [], timeSlot: '', isAnonymous: false, title: '', wantContact: false });
      setView(type === 'testimony' ? 'testimonies' : 'home');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) { notify('Ocorreu um erro ao enviar. Tente novamente.', 'error'); }
  };

  const handleUpdateStatus = async (id, newStatus) => {
    try {
      await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'requests', id), { status: newStatus });
      notify('Estado atualizado com sucesso.');
    } catch (err) { notify('Erro ao atualizar status.', 'error'); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Deseja realmente eliminar este registro permanentemente?')) return;
    try {
      await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'requests', id));
      notify('Registro eliminado.');
    } catch (err) { notify('Erro ao eliminar registro.', 'error'); }
  };

  const checkAdmin = () => {
    if (adminPin === '1234') { 
      setIsAdmin(true); setView('admin'); setAdminPin('');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else { notify('PIN de acesso incorreto.', 'error'); }
  };

  const safeRender = (val) => {
    if (val === null || val === undefined) return "";
    if (Array.isArray(val)) return val.join(", ");
    return String(val);
  };

  if (loading) return (
    <div className="flex items-center justify-center h-screen bg-[#f1f5f9]">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#cfa855]"></div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#f1f5f9] font-sans text-slate-800 selection:bg-[#cfa855]/30">
      {notification && <Notification message={notification.msg} type={notification.type} onClose={() => setNotification(null)} />}
      
      <ScheduleModal isOpen={showSchedule} onClose={() => setShowSchedule(false)} />
      <LegalModal isOpen={showLegal} onClose={() => setShowLegal(false)} />

      <Header 
        isScrolled={isScrolled} 
        onLoginClick={() => { setView('login'); window.scrollTo(0,0); }}
        onLogoClick={() => { setView('history'); window.scrollTo(0,0); }}
        pendingCount={pendingCount}
      />

      <main className="max-w-md mx-auto px-4 mt-6 pb-40">
        
        {view === 'home' && (
          <div className="space-y-4 animate-fade-in text-left">
            
            <div className="bg-gradient-to-br from-[#051c38] to-[#0a2e5c] p-6 rounded-[2.5rem] shadow-xl border border-[#cfa855]/20 relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-125 transition-transform duration-500">
                <ScrollText size={80} className="text-white" />
              </div>
              <div className="relative z-10 space-y-3 text-left">
                <div className="flex items-center gap-2 text-[#cfa855] text-[10px] font-black uppercase tracking-[0.2em] text-left">
                   <Sparkles size={14} /> Versículo do Dia
                </div>
                <p className="text-white text-lg font-serif italic leading-relaxed text-left">
                  "{dailyVerse.text}"
                </p>
                <div className="flex justify-end">
                  <span className="text-[#cfa855] text-xs font-bold border-b border-[#cfa855]/30 pb-0.5">
                    — {dailyVerse.ref}
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-3xl shadow-xl border border-slate-100 relative overflow-hidden group text-left">
              <div className="absolute top-0 right-0 w-24 h-24 bg-[#cfa855]/5 rounded-bl-full -mr-8 -mt-8 transition-all group-hover:scale-110"></div>
              <h2 className="text-xl font-bold text-[#051c38] mb-2 flex items-center gap-2 text-left">
                  Bem-vindo
              </h2>
              <p className="text-slate-500 text-sm leading-relaxed font-medium text-left">Estamos prontos para o ouvir e orar contigo.</p>
			  <div> export default function App() {
  const [mostrarFluxo, setMostrarFluxo] = useState(true);

  return (
    <div>
      {/* 2. Crie um botão para abrir o fluxo */}
      <button onClick={() => setMostrarFluxo(true)}>
        Ver Mensagem de Esperança
      </button>

      {/* 3. Coloque o componente aqui (ele só aparece quando mostrarFluxo for true) */}
      <FluxoInterativoEsperanca 
        isOpen={mostrarFluxo} 
        onClose={() => setMostrarFluxo(false)} 
        onFinish={() => {
          setMostrarFluxo(false);
          // Ação após o fim (ex: abrir formulário)
        }} 
      />
    </div>
			  </div>
			            </div>

            <div className="grid grid-cols-1 gap-3">
              <button onClick={() => { setView('prayer'); window.scrollTo(0,0); }} className="w-full bg-white p-5 rounded-2xl shadow-md flex items-center justify-between border border-transparent hover:border-[#cfa855] transition-all group text-left">
                <div className="flex items-center gap-4 text-left">
                  <div className="bg-red-50 p-3 rounded-xl text-red-500 group-hover:scale-110 transition-transform shrink-0"><Heart fill="currentColor" size={24} /></div>
                  <div className="text-left flex-1">
                    <h3 className="font-bold text-slate-800 uppercase tracking-tight text-left">Pedido de Oração</h3>
                    <p className="text-[10px] text-slate-500 uppercase font-semibold tracking-wider text-left">Compartilhe o seu fardo</p>
                  </div>
                </div>
                <ChevronRight className="text-slate-300" />
              </button>
              <button onClick={() => { setView('visit'); window.scrollTo(0,0); }} className="w-full bg-white p-5 rounded-2xl shadow-md flex items-center justify-between border border-transparent hover:border-[#cfa855] transition-all group text-left">
                <div className="flex items-center gap-4 text-left">
                  <div className="bg-blue-50 p-3 rounded-xl text-blue-500 group-hover:scale-110 transition-transform shrink-0"><Home size={24} /></div>
                  <div className="text-left flex-1">
                    <h3 className="font-bold text-slate-800 uppercase tracking-tight text-left">Solicitar Visita</h3>
                    <p className="text-[10px] text-slate-500 uppercase font-semibold tracking-wider text-left">Receba apoio pastoral</p>
                  </div>
                </div>
                <ChevronRight className="text-slate-300" />
              </button>
              <button onClick={() => { setView('testimonies'); window.scrollTo(0,0); }} className="w-full bg-white p-5 rounded-2xl shadow-md flex items-center justify-between border border-transparent hover:border-[#cfa855] transition-all group text-left">
                <div className="flex items-center gap-4 text-left">
                  <div className="bg-amber-50 p-3 rounded-xl text-amber-600 group-hover:scale-110 transition-transform shrink-0"><Quote size={24} /></div>
                  <div className="text-left flex-1">
                    <h3 className="font-bold text-slate-800 uppercase tracking-tight text-left">Testemunhos</h3>
                    <p className="text-[10px] text-slate-500 uppercase font-semibold tracking-wider text-left">Veja vitórias de fé</p>
                  </div>
                </div>
                <ChevronRight className="text-slate-300" />
              </button>
            </div>

            <button onClick={() => setShowSchedule(true)} className="w-full bg-[#051c38] p-5 rounded-2xl shadow-lg border border-[#cfa855]/30 flex items-center justify-between group overflow-hidden relative mt-6">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
              <div className="flex items-center gap-4 z-10 text-left">
                <div className="bg-[#cfa855] p-3 rounded-xl text-[#051c38] shrink-0"><Calendar size={24} /></div>
                <div className="text-left text-white flex-1"><h3 className="font-bold">Horários de Culto</h3><p className="text-[10px] opacity-70 uppercase tracking-wider">Saiba quando nos visitar</p></div>
              </div>
              <Info className="text-[#cfa855] z-10" size={20} />
            </button>

            <div className="bg-white p-4 rounded-3xl shadow-xl border border-slate-100 overflow-hidden text-left">
               <h3 className="text-sm font-bold text-[#051c38] mb-3 flex items-center gap-2 uppercase tracking-widest px-2 text-left"><MapPin size={16} className="text-[#cfa855]" /> Localização</h3>
               <div className="rounded-2xl overflow-hidden border border-slate-50 h-[220px] w-full bg-slate-50 relative">
                  <iframe src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d316.74789674764503!2d-43.33668071699493!3d-22.8226280113004!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x9965001030609d%3A0x1b9ec7a2e77b54a8!2sTMHE%20-%20Templo%20Mission%C3%A1rio%20H%C3%A1%20Esperan%C3%A7a!5e1!3m2!1spt-BR!2sbr!4v1766614959017!5m2!1spt-BR!2sbr" width="100%" height="100%" style={{ border: 0 }} allowFullScreen="" loading="lazy" referrerPolicy="no-referrer-when-downgrade"></iframe>
               </div>
               <div className="mt-4 text-center pb-2">
                  <a href="https://maps.app.goo.gl/7qi7anN314nEYmVg7" target="_blank" rel="noopener noreferrer" className="text-[10px] font-black text-[#cfa855] flex items-center justify-center gap-2 uppercase tracking-tighter hover:underline transition-all">Clique aqui e chegue até nós <ExternalLink size={10} /></a>
               </div>
            </div>

            <footer className="mt-8 pt-8 pb-12 border-t border-slate-200">
               <div className="flex flex-col items-center gap-4 text-center">
                  <div className="w-full flex justify-between items-end border-l-4 border-[#cfa855] pl-4 py-1 text-left">
                    <div className="text-left">
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-1 text-left">Assinatura Pastoral</p>
                      <p className="text-sm font-black text-[#051c38] italic text-left">Pr. Presidente Cláudio Araújo</p>
                    </div>
                  </div>
                  <div className="w-full flex flex-col items-center gap-3 pt-4 text-center">
                    <button onClick={() => setShowLegal(true)} className="flex items-center gap-2 text-[10px] font-bold text-[#cfa855] uppercase hover:underline"><Scale size={12} /> Termos de Uso e Privacidade (LGPD)</button>
                    <div className="text-slate-300 text-[9px] font-bold uppercase tracking-widest text-center leading-relaxed">
                      © {new Date().getFullYear()} TMHE - Templo Missionário Há Esperança.<br/>
                      Todos os direitos reservados.
                    </div>
                  </div>
               </div>
            </footer>
          </div>
        )}

        {view === 'history' && (
          <div className="space-y-6 animate-fade-in text-left pb-12">
            <div className="flex items-center gap-2 mb-2 text-left">
              <button onClick={() => setView('home')} className="p-2 -ml-2 text-slate-400 hover:bg-slate-100 rounded-full transition-colors"><X size={20} /></button>
              <h2 className="text-2xl font-black text-[#051c38] uppercase tracking-tighter text-left">Nossa História</h2>
            </div>

            <div className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-slate-100 space-y-8 relative overflow-hidden text-left">
               <div className="absolute top-0 right-0 w-32 h-32 bg-[#cfa855]/5 rounded-bl-full -mr-16 -mt-16"></div>
               <section className="space-y-4 relative z-10 text-left">
                  <div className="flex items-center gap-3 text-[#cfa855] text-left">
                    <Church size={24} />
                    <h3 className="font-black uppercase text-xs tracking-[0.2em] text-left">O Início da Caminhada</h3>
                  </div>
                  <p className="text-slate-600 leading-relaxed italic border-l-2 border-slate-100 pl-4 text-sm text-left">
                    "Não desprezes o dia dos pequenos começos." (Zacarias 4:10)
                  </p>
                  <p className="text-slate-600 leading-relaxed text-sm text-left">
                    A trajetória do Templo Missionário Há Esperança começou com um pequeno grupo de irmãos unidos por um propósito maior: levar a palavra de Deus e o conforto espiritual àqueles que mais precisam. 
                  </p>
               </section>
               <div className="h-px bg-slate-100"></div>
               <section className="space-y-4 relative z-10 text-left">
                  <div className="flex items-center gap-3 text-[#cfa855] text-left">
                    <Target size={24} />
                    <h3 className="font-black uppercase text-xs tracking-[0.2em] text-left">Nosso Objetivo</h3>
                  </div>
                  <p className="text-slate-600 leading-relaxed text-sm text-left">
                    Nosso objetivo principal é ser a extensão do amor de Cristo no mundo. Buscamos não apenas realizar cultos, mas transformar vidas através do evangelismo prático e do suporte social e espiritual.
                  </p>
               </section>
            </div>
          </div>
        )}

        {view === 'testimonies' && (
          <div className="space-y-4 animate-fade-in text-left pt-4">
            <div className="flex items-center justify-between mb-6 px-2 text-left">
              <h2 className="text-2xl font-bold text-[#051c38] text-left">Vitórias</h2>
              <button onClick={() => { setView('add-testimony'); window.scrollTo(0,0); }} className="bg-[#cfa855] text-white px-5 py-2.5 rounded-full text-xs font-black shadow-lg flex items-center gap-2 uppercase active:scale-95 transition-all shrink-0"><Plus size={16} /> Contar Vitória</button>
            </div>
            {allRequests.filter(r => r.type === 'testimony').length === 0 ? (
              <div className="text-center py-20 text-slate-300 italic text-sm text-center">Ainda sem testemunhos compartilhados.</div>
            ) : (
              allRequests.filter(r => r.type === 'testimony').map(t => (
                <div key={t.id} className="bg-white p-6 rounded-3xl shadow-md border border-slate-50 mb-4 transition-all hover:shadow-lg relative text-left">
                  <div className="flex justify-between items-start mb-2 text-left">
                    <h4 className="font-black text-[#051c38] uppercase text-xs tracking-widest flex-1 pr-12 text-left">{safeRender(t.title)}</h4>
                    <button onClick={() => handleLike(t.id)} className="flex flex-col items-center gap-1 active:scale-125 transition-all shrink-0">
                      <div className="p-2 bg-pink-50 rounded-full text-pink-500"><Heart size={16} fill={t.likes > 0 ? "currentColor" : "none"} /></div>
                      <span className="text-[10px] font-black text-pink-500">{t.likes || 0}</span>
                    </button>
                  </div>
                  <p className="text-slate-700 italic text-sm leading-relaxed mb-6 text-left">"{safeRender(t.message)}"</p>
                  <div className="flex items-center gap-3 text-left">
                    <div className="w-8 h-8 bg-[#051c38] text-white rounded-full flex items-center justify-center font-black text-[10px] uppercase">{(t.name && t.name[0]) || 'A'}</div>
                    <span className="font-black text-[10px] text-slate-500 uppercase tracking-widest text-left">{t.isAnonymous ? 'Anônimo' : safeRender(t.name)}</span>
                  </div>
                </div>
              ))
            )}
            <div className="text-center pt-8 text-center">
               <button onClick={() => setView('home')} className="text-xs font-bold text-[#cfa855] uppercase tracking-widest hover:underline text-center">Voltar ao Início</button>
            </div>
          </div>
        )}

        {view === 'add-testimony' && (
          <div className="bg-white p-8 rounded-3xl shadow-2xl animate-slide-up border border-slate-100 text-left">
            <div className="flex items-center gap-2 mb-8 text-left">
              <button onClick={() => setView('testimonies')} className="p-2 -ml-2 text-slate-400"><X size={20} /></button>
              <h2 className="text-xl font-black text-[#051c38] uppercase text-left">Compartilhar Vitória</h2>
            </div>
            <div className="space-y-5 text-left">
              <input type="text" placeholder="Seu Nome" className="w-full p-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-[#cfa855] font-bold" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} />
              <input type="text" placeholder="Título da Vitória" className="w-full p-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-[#cfa855] font-bold" value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})} />
              <textarea placeholder="O que Deus fez na sua vida?" rows="6" className="w-full p-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-[#cfa855] font-medium leading-relaxed" value={formData.message} onChange={(e) => setFormData({...formData, message: e.target.value})}></textarea>
              <div className="flex items-center gap-3 p-4 bg-amber-50 rounded-2xl border border-amber-100 text-left">
                <Info size={18} className="text-amber-600 shrink-0" />
                <p className="text-[10px] text-amber-900 font-medium text-left">Nota: Testemunhos são públicos e visíveis para toda a comunidade.</p>
              </div>
              <button onClick={() => handleSubmitRequest('testimony')} className="w-full bg-[#cfa855] text-white p-4 rounded-2xl font-black uppercase tracking-widest shadow-xl active:scale-95 transition-all mt-4">Publicar</button>
            </div>
          </div>
        )}

        {view === 'prayer' && (
          <div className="bg-white p-7 rounded-3xl shadow-2xl animate-slide-up border border-slate-100 text-left">
            <div className="flex items-center gap-2 mb-8 text-left">
              <button onClick={() => setView('home')} className="p-2 -ml-2 text-slate-400"><X size={20} /></button>
              <h2 className="text-xl font-bold text-[#051c38] text-left">Pedido de Oração</h2>
            </div>
            <div className="space-y-5 text-left">
              <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100 text-left">
                <input type="checkbox" id="anon-p" checked={formData.isAnonymous} onChange={(e) => setFormData({...formData, isAnonymous: e.target.checked})} className="w-5 h-5 accent-[#cfa855] rounded-lg shrink-0" />
                <label htmlFor="anon-p" className="text-sm font-bold text-slate-600 cursor-pointer text-left">Enviar de forma Anônima</label>
              </div>
              {!formData.isAnonymous && (
                <div className="space-y-1 text-left">
                  <label className="text-[10px] font-bold text-slate-400 uppercase ml-2 text-left block">Seu Nome</label>
                  <input type="text" placeholder="Nome completo" className="w-full p-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-[#cfa855]" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} />
                </div>
              )}
              <div className="space-y-1 text-left">
                <label className="text-[10px] font-bold text-slate-400 uppercase ml-2 text-left block">Pedido</label>
                <textarea placeholder="O que vai no seu coração?" rows="5" className="w-full p-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-[#cfa855]" value={formData.message} onChange={(e) => setFormData({...formData, message: e.target.value})}></textarea>
              </div>
              <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 space-y-4 text-left">
                <div className="flex items-center gap-3 text-left">
                  <input type="checkbox" id="want-contact" checked={formData.wantContact} onChange={(e) => setFormData({...formData, wantContact: e.target.checked})} className="w-5 h-5 accent-[#cfa855] rounded-lg shrink-0" />
                  <label htmlFor="want-contact" className="text-sm font-bold text-slate-600 cursor-pointer text-left">Gostaria de contato?</label>
                </div>
                {formData.wantContact && (
                  <input type="tel" placeholder="(21) 98765-4321" className="w-full p-4 bg-white border border-slate-100 rounded-xl focus:ring-2 focus:ring-[#cfa855] font-bold" value={formData.contact} onChange={handleWhatsAppChange} />
                )}
              </div>
              <button onClick={() => handleSubmitRequest('prayer')} className="w-full bg-[#051c38] text-white p-4 rounded-2xl font-bold flex items-center justify-center gap-3 shadow-xl active:scale-95 transition-all uppercase tracking-widest text-sm text-center">
                <Send size={18} /> Enviar Pedido
              </button>
            </div>
          </div>
        )}

        {view === 'visit' && (
          <div className="bg-white p-7 rounded-3xl shadow-2xl animate-slide-up border border-slate-100 text-left">
            <div className="flex items-center gap-2 mb-8 text-left">
              <button onClick={() => setView('home')} className="p-2 -ml-2 text-slate-400 hover:bg-slate-50 rounded-full transition-colors text-center"><X size={20} /></button>
              <h2 className="text-xl font-bold text-[#051c38] text-left">Agendar Visita</h2>
            </div>
            <div className="space-y-5 text-left">
              <div className="space-y-1 text-left">
                <label className="text-[10px] font-bold text-slate-400 uppercase ml-2 block tracking-widest text-left">Nome do Visitado</label>
                <input type="text" placeholder="Nome completo" className="w-full p-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-[#cfa855] font-medium" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} />
              </div>
              <div className="space-y-1 text-left">
                <label className="text-[10px] font-bold text-slate-400 uppercase ml-2 block tracking-widest text-left">WhatsApp de Contato</label>
                <input type="tel" placeholder="(21) 98765-4321" className="w-full p-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-[#cfa855] font-bold text-[#051c38]" value={formData.contact} onChange={handleWhatsAppChange} />
              </div>
              <div className="space-y-1 text-left">
                <label className="text-[10px] font-bold text-slate-400 uppercase ml-2 block tracking-widest text-left">Endereço Completo</label>
                <input type="text" placeholder="Rua, número, bairro e complemento" className="w-full p-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-[#cfa855] font-medium" value={formData.address} onChange={(e) => setFormData({...formData, address: e.target.value})} />
              </div>
              <div className="space-y-3 text-left">
                <label className="text-[10px] font-bold text-slate-400 uppercase ml-2 block tracking-widest text-left">Melhor dia para Visita</label>
                <div className="grid grid-cols-4 gap-2 text-center">
                  {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(day => (
                    <button key={day} onClick={() => handleDayToggle(day)} className={`py-2.5 rounded-xl text-xs font-bold transition-all border ${formData.preferredDays.includes(day) ? 'bg-[#051c38] text-white border-transparent shadow-md scale-95' : 'bg-white text-slate-400 border-slate-100 hover:bg-slate-50'}`}>{day}</button>
                  ))}
                </div>
              </div>
              <div className="space-y-1 text-left">
                <label className="text-[10px] font-bold text-slate-400 uppercase ml-2 block tracking-widest text-left">Horário Sugerido (24h)</label>
                <div className="relative text-left">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#cfa855]"><Clock size={16} /></div>
                  <input type="text" placeholder="Ex: 15:30 ou 09:00" className="w-full p-4 pl-12 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-[#cfa855] font-bold" value={formData.timeSlot} onChange={(e) => setFormData({...formData, timeSlot: e.target.value})} />
                </div>
              </div>
              <div className="space-y-1 text-left">
                <label className="text-[10px] font-bold text-slate-400 uppercase ml-2 block tracking-widest text-left">Observações Adicionais</label>
                <textarea placeholder="Informações relevantes (ponto de referência, motivo da visita, etc)" rows="3" className="w-full p-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-[#cfa855] font-medium" value={formData.message} onChange={(e) => setFormData({...formData, message: e.target.value})}></textarea>
              </div>
              <p className="text-[10px] text-slate-400 italic px-2 text-left">Os dados acima serão usados apenas para a coordenação da visita pastoral.</p>
              <button onClick={() => handleSubmitRequest('visit')} className="w-full bg-[#051c38] text-white p-5 rounded-3xl font-bold active:scale-95 transition-all mt-4 uppercase text-xs tracking-widest shadow-xl flex items-center justify-center gap-2 text-center"><CalendarCheck size={18} /> Agendar Visita Agora</button>
            </div>
          </div>
        )}

        {view === 'login' && (
          <div className="bg-white p-8 rounded-3xl shadow-2xl text-center space-y-8 animate-fade-in mt-10 text-center">
            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto text-slate-300 border border-slate-100 shadow-inner shrink-0 text-center"><Lock size={40} /></div>
            <h2 className="text-2xl font-bold text-[#051c38] text-center">Acesso Pastoral</h2>
            <input type="password" placeholder="••••" maxLength={4} className="text-center text-4xl tracking-[1em] w-full p-5 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-[#cfa855] shadow-inner font-mono text-center" value={adminPin} onChange={(e) => setAdminPin(e.target.value)} />
            <div className="flex gap-4 text-center">
              <button onClick={() => setView('home')} className="flex-1 p-4 bg-slate-50 text-slate-500 rounded-2xl font-bold text-center">Voltar</button>
              <button onClick={checkAdmin} className="flex-1 p-4 bg-[#051c38] text-white rounded-2xl font-bold active:scale-95 transition-all text-center">Entrar</button>
            </div>
          </div>
        )}

        {view === 'admin' && isAdmin && (
          <div className="space-y-5 animate-fade-in text-left pb-10 text-left">
            <div className="flex items-center justify-between bg-white p-5 rounded-3xl shadow-md border border-slate-100 text-left">
              <h2 className="font-bold text-sm text-[#051c38] uppercase tracking-wider text-left">Gestão Pastoral</h2>
              <button onClick={() => setView('home')} className="p-2 text-red-500 hover:bg-red-50 rounded-full transition-colors text-center"><X size={20} /></button>
            </div>

            {/* Melhoria: Painel de Estatísticas de Acesso */}
            <div className="bg-[#051c38] p-6 rounded-3xl shadow-lg border border-[#cfa855]/20 text-white relative overflow-hidden text-left">
              <div className="absolute top-0 right-0 p-4 opacity-5"><BarChart3 size={100} /></div>
              <h3 className="text-[#cfa855] text-[10px] font-black uppercase tracking-[0.2em] mb-4 flex items-center gap-2 text-left"><BarChart3 size={14} /> Estatísticas de Acesso</h3>
              <div className="grid grid-cols-2 gap-4 relative z-10 text-left">
                <div className="bg-white/5 p-4 rounded-2xl border border-white/5 text-left">
                  <span className="text-[9px] uppercase font-bold text-white/50 block mb-1 text-left">Hoje</span>
                  <div className="flex items-center gap-2 text-left">
                    <Eye size={14} className="text-[#cfa855]" />
                    <span className="text-xl font-black text-left">{analytics.today}</span>
                  </div>
                </div>
                <div className="bg-white/5 p-4 rounded-2xl border border-white/5 text-left">
                  <span className="text-[9px] uppercase font-bold text-white/50 block mb-1 text-left">Total Geral</span>
                  <div className="flex items-center gap-2 text-left">
                    <Users size={14} className="text-[#cfa855]" />
                    <span className="text-xl font-black text-left">{analytics.total}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar text-left">
              {['all', 'visit', 'prayer', 'testimony'].map(type => (
                <button key={type} onClick={() => setFilterType(type)} className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all ${filterType === type ? 'bg-[#051c38] text-white shadow-lg' : 'bg-white text-slate-400 border border-slate-100'}`}>{type === 'all' ? 'Todos' : type === 'visit' ? 'Visitas' : type === 'prayer' ? 'Orações' : 'Vitórias'}</button>
              ))}
            </div>

            <div className="space-y-4 text-left">
              {allRequests.filter(r => filterType === 'all' || r.type === filterType).length === 0 ? (
                <div className="text-center py-20 text-slate-300 italic text-sm text-center">Nenhum registro encontrado.</div>
              ) : (
                allRequests.filter(r => filterType === 'all' || r.type === filterType).map(req => {
                  const isVisit = req.type === 'visit';
                  let borderClass = 'border-slate-200';
                  let statusLabel = 'Pendente';
                  let statusBg = 'bg-slate-100 text-slate-500';

                  if (isVisit) {
                    if (req.status === 'pending') { borderClass = 'border-red-500'; statusLabel = 'Não Confirmada'; statusBg = 'bg-red-50 text-red-600'; } 
                    else if (req.status === 'confirmed') { borderClass = 'border-yellow-500'; statusLabel = 'Confirmada'; statusBg = 'bg-yellow-50 text-yellow-700'; } 
                    else if (req.status === 'completed') { borderClass = 'border-green-500 opacity-60'; statusLabel = 'Realizada'; statusBg = 'bg-green-50 text-green-700'; }
                  } else {
                    if (req.status === 'completed') { borderClass = 'border-green-500 opacity-60'; statusLabel = 'Concluído'; statusBg = 'bg-green-50 text-green-700'; }
                  }

                  return (
                    <div key={req.id} className={`bg-white rounded-[2rem] p-6 border-l-8 shadow-md relative transition-all text-left ${borderClass}`}>
                      <div className="absolute top-5 right-5 flex gap-3 text-left">
                        {isVisit && req.status === 'confirmed' && (
                          <button onClick={() => handlePrintVisit(req)} className="text-[#cfa855] hover:text-[#051c38] transition-colors p-1 text-center" title="Imprimir Ficha"><Printer size={18} /></button>
                        )}
                        <button onClick={() => handleDelete(req.id)} className="text-slate-300 hover:text-red-500 transition-colors p-1 text-center"><Trash2 size={16} /></button>
                      </div>
                      <div className="flex items-center gap-2 mb-3 text-left">
                        <span className={`text-[9px] font-black uppercase tracking-[0.2em] px-3 py-1 rounded-full ${statusBg} text-left`}>{statusLabel}</span>
                        {!isVisit && <span className="text-[9px] font-bold text-slate-300 uppercase text-left">{req.type === 'prayer' ? 'Oração' : 'Testemunho'}</span>}
                      </div>
                      <h4 className="font-black text-slate-800 text-lg mb-2 text-left">{req.isAnonymous ? 'Anônimo' : safeRender(req.name)}</h4>
                      {req.contact && <a href={`https://wa.me/55${req.contact.replace(/\D/g, '')}`} target="_blank" rel="noreferrer" className="text-xs font-bold text-green-600 mb-2 flex items-center gap-1.5 bg-green-50 w-fit px-3 py-1.5 rounded-xl text-left"><Phone size={14} /> {safeRender(req.contact)}</a>}
                      {isVisit && (
                        <div className="space-y-2 mb-4 bg-slate-50 p-4 rounded-2xl border border-slate-100 text-left">
                          <p className="text-[11px] text-slate-600 flex items-center gap-2 text-left"><MapPin size={12} className="text-[#cfa855]" /> <strong>Endereço:</strong> {safeRender(req.address)}</p>
                          <p className="text-[11px] text-slate-600 flex items-center gap-2 text-left"><Calendar size={12} className="text-[#cfa855]" /> <strong>Data/Hora:</strong> {safeRender(req.preferredDays)} às {safeRender(req.timeSlot)}h</p>
                        </div>
                      )}
                      {req.message && <p className="text-sm text-slate-600 italic leading-relaxed mb-6 text-left">"{safeRender(req.message)}"</p>}
                      <div className="flex flex-col gap-2 text-left">
                        {isVisit && req.status === 'pending' && <button onClick={() => handleUpdateStatus(req.id, 'confirmed')} className="w-full py-3 bg-yellow-400 text-yellow-900 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 shadow-sm text-center"><CalendarCheck size={14} /> Confirmar Visita</button>}
                        {isVisit && req.status === 'confirmed' && <button onClick={() => handleUpdateStatus(req.id, 'completed')} className="w-full py-3 bg-green-500 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 shadow-sm text-center"><CheckCircle2 size={14} /> Marcar como Realizada</button>}
                        {!isVisit && req.status === 'pending' && <button onClick={() => handleUpdateStatus(req.id, 'completed')} className="w-full py-3 bg-[#051c38] text-white rounded-2xl text-[10px] font-black uppercase tracking-widest text-center">Finalizar Atendimento</button>}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}
      </main>

      <nav className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-lg border-t border-slate-100 px-6 py-4 flex justify-around items-center z-40 shadow-[0_-10px_30px_-10px_rgba(0,0,0,0.1)]">
        <button onClick={() => { setView('home'); window.scrollTo(0,0); }} className={`flex flex-col items-center gap-1.5 transition-all ${view === 'home' ? 'text-[#051c38] scale-110' : 'text-slate-400 hover:text-[#051c38]'}`}><Home size={26} /><span className="text-[9px] font-bold uppercase tracking-widest">Início</span></button>
        <button onClick={handleShare} className="flex flex-col items-center gap-1.5 text-slate-400 active:scale-110 hover:text-[#cfa855]"><div className="bg-[#cfa855]/10 p-2 rounded-xl text-[#cfa855] text-center"><Share2 size={26} /></div><span className="text-[9px] font-bold uppercase tracking-widest text-center">Compartilhar</span></button>
        <button onClick={() => { setView('history'); window.scrollTo(0,0); }} className={`flex flex-col items-center gap-1.5 transition-all ${view === 'history' ? 'text-[#051c38] scale-110' : 'text-slate-400 hover:text-[#051c38]'}`}><Church size={26} /><span className="text-[9px] font-bold uppercase tracking-widest text-center">Nossa História</span></button>
      </nav>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes fade-in { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes slide-up { from { transform: translateY(50px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        @keyframes bounce-in { 0% { transform: scale(0.3); opacity: 0; } 50% { transform: scale(1.05); } 100% { transform: scale(1); opacity: 1; } }
        .animate-fade-in { animation: fade-in 0.5s ease-out forwards; }
        .animate-slide-up { animation: slide-up 0.6s cubic-bezier(0.16, 1, 0.3, 1); }
        .animate-bounce-in { animation: bounce-in 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.2); }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        input::placeholder, textarea::placeholder { color: #cbd5e1; font-weight: 400; }
        * { -webkit-tap-highlight-color: transparent; }
      `}} />
    </div>
  );
}

