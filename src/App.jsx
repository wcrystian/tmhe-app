import React, { useState, useEffect, useMemo } from 'react';
import { initializeApp } from 'firebase/app';
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
  serverTimestamp
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
  Sparkles
} from 'lucide-react';

// --- CONFIGURAÇÃO E SEGURANÇA ---

/**
 * INSTRUÇÕES IMPORTANTES:
 * 1. Vá ao Console do Firebase (https://console.firebase.google.com/)
 * 2. Crie um projeto e adicione uma "Web App"
 * 3. Copie o objeto 'firebaseConfig' e substitua os valores abaixo.
 */
const getFirebaseConfig = () => {
  try {
    // Tenta obter do ambiente online (Canvas)
    if (typeof __firebase_config !== 'undefined' && __firebase_config) {
      return JSON.parse(__firebase_config);
    }
  } catch (e) {
    console.error("Erro ao ler __firebase_config:", e);
  }

  // CONFIGURAÇÃO LOCAL: Substitua pelos seus dados reais aqui!
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

// Inicialização segura
let app, auth, db;
try {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
} catch (e) {
  console.error("Erro na inicialização do Firebase:", e);
}

const appId = typeof __app_id !== 'undefined' ? __app_id : 'tmhe-church-app';

// --- COMPONENTES AUXILIARES ---

const Logo = () => (
  <div className="flex flex-col items-center justify-center py-6">
    <div className="relative flex items-center justify-center w-20 h-20 mb-2">
      {/* Círculo dourado pulsante (opcional, pode remover se não quiser) */}
      <div className="absolute inset-0 border-2 border-[#cfa855] rounded-full animate-pulse"></div>

      {/* A SUA NOVA LOGO AQUI */}
      <img
        src="/logo.png"  // Certifique-se de que o nome do ficheiro está correto
        alt="TMHE Logo"
        className="z-10 w-14 h-14 object-contain" // Ajuste w-14 e h-14 se precisar mudar o tamanho
      />
    </div>
    <h1 className="text-2xl font-bold tracking-wider text-[#051c38]">TMHE</h1>
    <p className="text-xs uppercase tracking-[0.2em] text-[#cfa855] font-medium text-center">Templo Missionário Há Esperança</p>
  </div>
);

const Notification = ({ message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className={`fixed top-4 right-4 z-50 p-4 rounded-xl shadow-2xl flex items-center gap-3 animate-bounce-in border ${
      type === 'success' ? 'bg-green-600 border-green-500 text-white' : 'bg-red-600 border-red-500 text-white'
    }`}>
      {type === 'success' ? <CheckCircle2 size={20} /> : <X size={20} />}
      <span className="font-medium">{message}</span>
    </div>
  );
};

// --- COMPONENTE PRINCIPAL ---

export default function App() {
  const [user, setUser] = useState(null);
  const [view, setView] = useState('home'); 
  const [allRequests, setAllRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState(null);
  
  const isConfigPlaceholder = firebaseConfig.apiKey === "SUA_API_KEY_AQUI";
  const [configMissing, setConfigMissing] = useState(isConfigPlaceholder);
  
  // Admin State
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminPin, setAdminPin] = useState('');
  const [filterType, setFilterType] = useState('all');

  // Form States
  const [formData, setFormData] = useState({
    name: '',
    contact: '',
    message: '',
    address: '',
    preferredDays: [],
    timeSlot: '',
    isAnonymous: false,
  });

  // Autenticação
  useEffect(() => {
    if (configMissing) {
      setLoading(false);
      return;
    }

    const initAuth = async () => {
      try {
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
          await signInWithCustomToken(auth, __initial_auth_token);
        } else {
          await signInAnonymously(auth);
        }
      } catch (err) {
        console.error("Erro Auth:", err);
      }
    };
    initAuth();
    return onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
  }, [configMissing]);

  // Escuta de Dados (Real-time)
  useEffect(() => {
    if (!user || configMissing) return;

    const q = query(collection(db, 'artifacts', appId, 'public', 'data', 'requests'));
    const unsubscribe = onSnapshot(q, 
      (snapshot) => {
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        // Ordenação manual em memória (Regra 2)
        const sorted = data.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
        setAllRequests(sorted);
      },
      (err) => {
        console.error("Erro no Banco de Dados:", err);
      }
    );

    return () => unsubscribe();
  }, [user, configMissing]);

  // Ações
  const notify = (msg, type = 'success') => setNotification({ msg, type });

  const handleSubmitRequest = async (type) => {
    if (configMissing) {
      notify('Configure o Firebase primeiro.', 'error');
      return;
    }

    if (!formData.message) {
      notify('Por favor, escreva a sua mensagem.', 'error');
      return;
    }

    try {
      await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'requests'), {
        ...formData,
        type,
        status: type === 'testimony' ? 'approved' : 'pending',
        createdAt: serverTimestamp(),
        userId: user.uid
      });
      
      const messages = {
        prayer: 'Pedido de oração enviado com sucesso!',
        visit: 'Solicitação de visita registada.',
        testimony: 'O seu testemunho foi partilhado com a comunidade!'
      };

      notify(messages[type] || 'Enviado com sucesso!');
      setFormData({ name: '', contact: '', message: '', address: '', preferredDays: [], timeSlot: '', isAnonymous: false });
      setView(type === 'testimony' ? 'testimonies' : 'home');
    } catch (err) {
      notify('Erro ao enviar. Tente novamente.', 'error');
    }
  };

  const handleUpdateStatus = async (id, newStatus) => {
    try {
      await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'requests', id), {
        status: newStatus
      });
      notify('Estado atualizado.');
    } catch (err) {
      notify('Erro ao atualizar.', 'error');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Deseja eliminar este registo permanentemente?')) return;
    try {
      await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'requests', id));
      notify('Registo eliminado.');
    } catch (err) {
      notify('Erro ao eliminar.', 'error');
    }
  };

  const checkAdmin = () => {
    if (adminPin === '1234') { 
      setIsAdmin(true);
      setView('admin');
      setAdminPin('');
    } else {
      notify('PIN Incorreto', 'error');
    }
  };

  // Filtros
  const filteredRequests = useMemo(() => {
    if (filterType === 'all') return allRequests;
    return allRequests.filter(r => r.type === filterType);
  }, [allRequests, filterType]);

  const approvedTestimonies = useMemo(() => {
    return allRequests.filter(r => r.type === 'testimony' && r.status === 'approved');
  }, [allRequests]);

  // Ecrã de Erro de Configuração
  if (configMissing) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6 text-white text-center">
        <div className="max-w-md w-full space-y-8">
          <div className="bg-amber-500/20 p-5 rounded-full w-24 h-24 flex items-center justify-center mx-auto text-amber-500 border border-amber-500/30">
            <AlertTriangle size={48} />
          </div>
          <div className="space-y-2">
            <h2 className="text-3xl font-bold italic tracking-tight">Quase lá!</h2>
            <p className="text-slate-400">O seu aplicativo está pronto, mas precisa de ser ligado ao Firebase da sua igreja.</p>
          </div>
          <div className="bg-slate-800 rounded-2xl p-6 text-left border border-slate-700 space-y-4 shadow-2xl">
            <h3 className="font-bold text-lg border-b border-slate-700 pb-2 flex items-center gap-2">
              <ExternalLink size={18} className="text-[#cfa855]" /> Como resolver:
            </h3>
            <ol className="space-y-3 text-sm text-slate-300 list-decimal list-inside">
              <li>Vá ao Console do Firebase e crie um projeto.</li>
              <li>Ative o <b>Firestore</b> e <b>Auth Anónima</b>.</li>
              <li>Copie a sua <code className="text-amber-400">apiKey</code> e cole no topo do ficheiro <code className="text-amber-400">App.jsx</code>.</li>
            </ol>
          </div>
          <button onClick={() => setConfigMissing(false)} className="text-slate-500 text-xs underline hover:text-slate-300">
            Ver apenas design (sem base de dados)
          </button>
        </div>
      </div>
    );
  }

  if (loading) return (
    <div className="flex items-center justify-center h-screen bg-[#f1f5f9]">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#cfa855]"></div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#f1f5f9] pb-24 font-sans text-slate-800 selection:bg-[#cfa855]/30">
      {notification && (
        <Notification message={notification.msg} type={notification.type} onClose={() => setNotification(null)} />
      )}

      {/* Header */}
      <header className="bg-[#051c38] text-white shadow-2xl rounded-b-[2.5rem] sticky top-0 z-30 border-b border-[#cfa855]/20">
        <Logo />
      </header>

      <main className="max-w-md mx-auto px-4 -mt-6">
        
        {/* VIEW: HOME */}
        {view === 'home' && (
          <div className="space-y-4 animate-fade-in pt-2">
            <div className="bg-white p-6 rounded-3xl shadow-xl border border-slate-100 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-24 h-24 bg-[#cfa855]/5 rounded-bl-full -mr-8 -mt-8 transition-all group-hover:scale-110"></div>
              <h2 className="text-xl font-bold text-[#051c38] mb-2 flex items-center gap-2">
                <Sparkles size={20} className="text-[#cfa855]" /> Bem-vindo ao TMHE
              </h2>
              <p className="text-slate-500 text-sm leading-relaxed">
                Um espaço de comunhão e suporte espiritual. Estamos prontos para o ouvir e orar contigo.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-3">
              <button onClick={() => setView('prayer')} className="w-full bg-white p-5 rounded-2xl shadow-md flex items-center justify-between border border-transparent hover:border-[#cfa855] transition-all group">
                <div className="flex items-center gap-4">
                  <div className="bg-red-50 p-3 rounded-xl text-red-500 group-hover:scale-110 transition-transform"><Heart fill="currentColor" size={24} /></div>
                  <div className="text-left">
                    <h3 className="font-bold text-slate-800">Pedido de Oração</h3>
                    <p className="text-[10px] text-slate-500 uppercase font-semibold tracking-wider">Partilhe o seu fardo</p>
                  </div>
                </div>
                <ChevronRight className="text-slate-300" />
              </button>

              <button onClick={() => setView('visit')} className="w-full bg-white p-5 rounded-2xl shadow-md flex items-center justify-between border border-transparent hover:border-[#cfa855] transition-all group">
                <div className="flex items-center gap-4">
                  <div className="bg-blue-50 p-3 rounded-xl text-blue-500 group-hover:scale-110 transition-transform"><Home size={24} /></div>
                  <div className="text-left">
                    <h3 className="font-bold text-slate-800">Solicitar Visita</h3>
                    <p className="text-[10px] text-slate-500 uppercase font-semibold tracking-wider">Receba apoio pastoral</p>
                  </div>
                </div>
                <ChevronRight className="text-slate-300" />
              </button>

              <button onClick={() => setView('testimonies')} className="w-full bg-white p-5 rounded-2xl shadow-md flex items-center justify-between border border-transparent hover:border-[#cfa855] transition-all group text-[#cfa855]">
                <div className="flex items-center gap-4">
                  <div className="bg-amber-50 p-3 rounded-xl text-amber-600 group-hover:scale-110 transition-transform"><Quote size={24} /></div>
                  <div className="text-left">
                    <h3 className="font-bold text-slate-800">Testemunhos</h3>
                    <p className="text-[10px] text-slate-500 uppercase font-semibold tracking-wider">Veja vitórias de fé</p>
                  </div>
                </div>
                <ChevronRight className="text-slate-300" />
              </button>
            </div>

            <div className="pt-10 flex justify-center">
              <button onClick={() => setView('login')} className="flex items-center gap-2 text-slate-400 text-xs font-semibold hover:text-[#cfa855] transition-colors py-2 px-4 rounded-full bg-white shadow-sm border border-slate-100">
                <Lock size={12} /> ÁREA ADMINISTRATIVA
              </button>
            </div>
          </div>
        )}

        {/* VIEW: TESTIMONIES LIST */}
        {view === 'testimonies' && (
          <div className="space-y-4 animate-fade-in pt-2">
            <div className="flex items-center justify-between mb-4 px-2">
              <h2 className="text-xl font-bold flex items-center gap-2 text-[#051c38]">
                <Sparkles size={20} className="text-[#cfa855]" /> Testemunhos
              </h2>
              <button onClick={() => setView('add-testimony')} className="bg-[#cfa855] text-white px-4 py-2 rounded-full text-xs font-bold shadow-lg shadow-gold/20 flex items-center gap-1">
                <Plus size={14} /> Contar Vitória
              </button>
            </div>

            {approvedTestimonies.length === 0 ? (
              <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-slate-200">
                <Quote size={40} className="mx-auto text-slate-200 mb-2" />
                <p className="text-slate-400 text-sm italic">Ainda não foram partilhados testemunhos. Seja o primeiro!</p>
              </div>
            ) : (
              approvedTestimonies.map(t => (
                <div key={t.id} className="bg-white p-6 rounded-3xl shadow-md border border-slate-50 relative group transition-all hover:shadow-lg">
                  <Quote size={30} className="absolute top-4 right-4 text-[#cfa855]/10 group-hover:text-[#cfa855]/20" />
                  <p className="text-slate-700 leading-relaxed italic mb-4">"{t.message}"</p>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center text-[#cfa855]">
                      <User size={16} />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-[#051c38]">{t.isAnonymous ? 'Irmão(ã) Anónimo(a)' : t.name}</h4>
                      <p className="text-[10px] text-slate-400 font-medium">Partilhado recentemente</p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* VIEW: ADD TESTIMONY FORM */}
        {view === 'add-testimony' && (
          <div className="bg-white p-7 rounded-3xl shadow-2xl animate-slide-up border border-slate-100">
            <div className="flex items-center gap-2 mb-8">
              <button onClick={() => setView('testimonies')} className="p-2 -ml-2 hover:bg-slate-100 rounded-full transition-colors"><X size={20} /></button>
              <h2 className="text-xl font-bold text-[#051c38]">Contar a minha Vitória</h2>
            </div>
            <div className="space-y-5">
              <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <input type="checkbox" id="anon-t" checked={formData.isAnonymous} onChange={(e) => setFormData({...formData, isAnonymous: e.target.checked})} className="w-5 h-5 accent-[#cfa855] rounded-lg" />
                <label htmlFor="anon-t" className="text-sm font-bold text-slate-600 cursor-pointer">Enviar de forma anónima</label>
              </div>
              {!formData.isAnonymous && (
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase ml-2 tracking-widest">O Seu Nome</label>
                  <input type="text" placeholder="Ex: João Silva" className="w-full p-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-[#cfa855] transition-all font-medium" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} />
                </div>
              )}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase ml-2 tracking-widest">O Seu Testemunho</label>
                <textarea placeholder="O que Deus fez na sua vida?" rows="6" className="w-full p-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-[#cfa855] transition-all font-medium leading-relaxed" value={formData.message} onChange={(e) => setFormData({...formData, message: e.target.value})}></textarea>
              </div>
              <button onClick={() => handleSubmitRequest('testimony')} className="w-full bg-[#cfa855] text-white p-4 rounded-2xl font-bold flex items-center justify-center gap-3 shadow-xl shadow-gold/20 hover:bg-[#b38f44] transition-all active:scale-95">
                <Send size={18} /> Publicar Testemunho
              </button>
            </div>
          </div>
        )}

        {/* VIEW: PRAYER FORM */}
        {view === 'prayer' && (
          <div className="bg-white p-7 rounded-3xl shadow-2xl animate-slide-up border border-slate-100">
            <div className="flex items-center gap-2 mb-8">
              <button onClick={() => setView('home')} className="p-2 -ml-2 hover:bg-slate-100 rounded-full transition-colors"><X size={20} /></button>
              <h2 className="text-xl font-bold text-[#051c38]">Pedido de Oração</h2>
            </div>
            <div className="space-y-5">
              <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <input type="checkbox" id="anon-p" checked={formData.isAnonymous} onChange={(e) => setFormData({...formData, isAnonymous: e.target.checked})} className="w-5 h-5 accent-[#cfa855] rounded-lg" />
                <label htmlFor="anon-p" className="text-sm font-bold text-slate-600 cursor-pointer">Enviar de forma anónima</label>
              </div>
              {!formData.isAnonymous && (
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase ml-2 tracking-widest">Nome Completo</label>
                  <input type="text" placeholder="Como deseja ser chamado?" className="w-full p-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-[#cfa855] transition-all font-medium" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} />
                </div>
              )}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase ml-2 tracking-widest">Motivo</label>
                <textarea placeholder="Partilhe o que vai no seu coração..." rows="5" className="w-full p-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-[#cfa855] transition-all font-medium leading-relaxed" value={formData.message} onChange={(e) => setFormData({...formData, message: e.target.value})}></textarea>
              </div>
              <button onClick={() => handleSubmitRequest('prayer')} className="w-full bg-[#051c38] text-white p-4 rounded-2xl font-bold flex items-center justify-center gap-3 shadow-xl shadow-navy/20 hover:bg-slate-900 transition-all active:scale-95">
                <Heart fill="white" size={18} /> Enviar Pedido
              </button>
            </div>
          </div>
        )}

        {/* VIEW: VISIT FORM */}
        {view === 'visit' && (
          <div className="bg-white p-7 rounded-3xl shadow-2xl animate-slide-up border border-slate-100">
            <div className="flex items-center gap-2 mb-8">
              <button onClick={() => setView('home')} className="p-2 -ml-2 hover:bg-slate-100 rounded-full transition-colors"><X size={20} /></button>
              <h2 className="text-xl font-bold text-[#051c38]">Solicitar Visita</h2>
            </div>
            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase ml-2 tracking-widest">Nome Completo</label>
                <input type="text" placeholder="Nome para o contacto" className="w-full p-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-[#cfa855]" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase ml-2 tracking-widest">Telemóvel / WhatsApp</label>
                <input type="tel" placeholder="Ex: 912 345 678" className="w-full p-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-[#cfa855]" value={formData.contact} onChange={(e) => setFormData({...formData, contact: e.target.value})} />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase ml-2 tracking-widest">Morada</label>
                <input type="text" placeholder="Rua, número e localidade" className="w-full p-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-[#cfa855]" value={formData.address} onChange={(e) => setFormData({...formData, address: e.target.value})} />
              </div>
              <div className="space-y-2 py-2">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1 flex items-center gap-2"><Calendar size={14} /> Preferência de Dias</p>
                <div className="flex flex-wrap gap-2">
                  {['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab', 'Dom'].map(day => (
                    <button key={day} onClick={() => {
                      const days = formData.preferredDays.includes(day) ? formData.preferredDays.filter(d => d !== day) : [...formData.preferredDays, day];
                      setFormData({...formData, preferredDays: days});
                    }} className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${formData.preferredDays.includes(day) ? 'bg-[#cfa855] text-white shadow-lg shadow-gold/20' : 'bg-slate-100 text-slate-400 hover:bg-slate-200'}`}>{day}</button>
                  ))}
                </div>
              </div>
              <button onClick={() => handleSubmitRequest('visit')} className="w-full bg-[#cfa855] text-white p-4 rounded-2xl font-bold flex items-center justify-center gap-3 shadow-xl shadow-gold/20 hover:bg-[#b38f44] transition-all active:scale-95 mt-4">
                <Calendar size={18} /> Agendar Visita
              </button>
            </div>
          </div>
        )}

        {/* VIEW: LOGIN ADMIN */}
        {view === 'login' && (
          <div className="bg-white p-8 rounded-3xl shadow-2xl text-center space-y-8 animate-fade-in">
            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto text-slate-300 border border-slate-100 shadow-inner"><Lock size={40} /></div>
            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-[#051c38]">Área Restrita</h2>
              <p className="text-sm text-slate-400 font-medium leading-relaxed">Painel de gestão pastoral. Introduza o código de acesso.</p>
            </div>
            <input type="password" placeholder="••••" maxLength={4} className="text-center text-4xl tracking-[1em] w-full p-5 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-[#cfa855] shadow-inner font-mono" value={adminPin} onChange={(e) => setAdminPin(e.target.value)} />
            <div className="flex gap-4">
              <button onClick={() => setView('home')} className="flex-1 p-4 bg-slate-50 text-slate-500 rounded-2xl font-bold hover:bg-slate-100 transition-colors">Cancelar</button>
              <button onClick={checkAdmin} className="flex-1 p-4 bg-[#051c38] text-white rounded-2xl font-bold hover:bg-slate-900 shadow-lg shadow-navy/20 transition-all active:scale-95">Entrar</button>
            </div>
          </div>
        )}

        {/* VIEW: ADMIN DASHBOARD */}
        {view === 'admin' && isAdmin && (
          <div className="space-y-5 animate-fade-in pb-12">
            <div className="flex items-center justify-between bg-white p-5 rounded-3xl shadow-md border border-slate-50">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-[#051c38] text-[#cfa855] rounded-full flex items-center justify-center shadow-lg"><Lock size={20} /></div>
                <div><h2 className="font-bold text-sm text-[#051c38]">Gestão Pastoral</h2><p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">Monitorização</p></div>
              </div>
              <button onClick={() => { setIsAdmin(false); setView('home'); }} className="p-2 bg-red-50 text-red-500 rounded-xl hover:bg-red-100 transition-colors"><X size={20} /></button>
            </div>

            <div className="flex gap-2 overflow-x-auto pb-4 no-scrollbar px-1">
              {[
                {id: 'all', label: 'Todos', count: allRequests.length},
                {id: 'prayer', label: 'Orações', count: allRequests.filter(r => r.type === 'prayer').length},
                {id: 'visit', label: 'Visitas', count: allRequests.filter(r => r.type === 'visit').length},
                {id: 'testimony', label: 'Testemunhos', count: allRequests.filter(r => r.type === 'testimony').length}
              ].map(f => (
                <button key={f.id} onClick={() => setFilterType(f.id)} className={`px-5 py-2.5 rounded-full text-xs font-bold whitespace-nowrap transition-all border ${filterType === f.id ? 'bg-[#cfa855] text-white border-transparent shadow-lg shadow-gold/30' : 'bg-white text-slate-500 border-slate-100'}`}>
                  {f.label} <span className={`ml-1 opacity-60`}>({f.count})</span>
                </button>
              ))}
            </div>

            <div className="space-y-4">
              {filteredRequests.length === 0 ? (
                <div className="text-center py-24 bg-white rounded-[2.5rem] border border-dashed border-slate-200">
                  <Bell className="mx-auto text-slate-100 mb-4" size={56} />
                  <p className="text-slate-400 font-medium italic">Sem novos pedidos nesta categoria.</p>
                </div>
              ) : (
                filteredRequests.map(req => (
                  <div key={req.id} className={`bg-white rounded-3xl border-l-8 shadow-md overflow-hidden transition-all group ${req.status === 'completed' ? 'border-green-400 opacity-60' : req.type === 'prayer' ? 'border-red-400' : req.type === 'visit' ? 'border-blue-400' : 'border-amber-400'}`}>
                    <div className="p-6">
                      <div className="flex justify-between items-start mb-4">
                        <span className={`text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-full ${req.type === 'prayer' ? 'bg-red-50 text-red-600' : req.type === 'visit' ? 'bg-blue-50 text-blue-600' : 'bg-amber-50 text-amber-600'}`}>
                          {req.type === 'prayer' ? 'Pedido Oração' : req.type === 'visit' ? 'Visita Pastoral' : 'Testemunho'}
                        </span>
                        <div className="flex gap-3 translate-x-4 opacity-0 group-hover:translate-x-0 group-hover:opacity-100 transition-all">
                          <button onClick={() => handleDelete(req.id)} className="p-2 bg-slate-50 text-slate-400 hover:text-red-500 rounded-lg shadow-sm transition-colors"><Trash2 size={16} /></button>
                          {req.status === 'pending' && (
                            <button onClick={() => handleUpdateStatus(req.id, 'completed')} className="p-2 bg-green-50 text-green-600 rounded-lg shadow-sm hover:bg-green-100 transition-colors"><CheckCircle2 size={16} /></button>
                          )}
                        </div>
                      </div>

                      <div className="space-y-3">
                        <h4 className="font-bold text-slate-800 text-lg flex items-center gap-2 uppercase tracking-tight">
                          {req.isAnonymous ? 'Irmão(ã) Anónimo(a)' : req.name}
                        </h4>
                        
                        {req.contact && (
                          <div className="flex items-center gap-2 text-xs font-bold text-slate-400 bg-slate-50 w-fit px-3 py-1.5 rounded-lg">
                            <Phone size={12} className="text-[#cfa855]" /> {req.contact}
                          </div>
                        )}

                        <div className="bg-slate-50/50 p-4 rounded-2xl italic text-slate-600 text-sm leading-relaxed border border-slate-100">
                          "{req.message}"
                        </div>

                        {req.type === 'visit' && (
                          <div className="grid grid-cols-1 gap-2 pt-2 text-[11px] font-bold text-slate-400">
                            <div className="flex items-start gap-2 text-[#051c38] bg-slate-50 p-3 rounded-xl border border-slate-100">
                              <MapPin size={14} className="mt-0.5 text-[#cfa855] shrink-0" />
                              <span className="leading-tight">{req.address}</span>
                            </div>
                            <div className="flex justify-between items-center bg-slate-50 p-3 rounded-xl border border-slate-100">
                              <span className="flex items-center gap-1"><Calendar size={14} className="text-[#cfa855]" /> {req.preferredDays?.join(', ')}</span>
                              <span className="flex items-center gap-1 italic opacity-60 tracking-wider">Aguardando contacto</span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </main>

      {/* Navegação Inferior (Estilo Tab Bar) */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-lg border-t border-slate-100 px-6 py-4 flex justify-around items-center z-40 shadow-[0_-10px_30px_-10px_rgba(0,0,0,0.1)]">
        <button onClick={() => setView('home')} className={`flex flex-col items-center gap-1.5 transition-all ${view === 'home' ? 'text-[#cfa855] scale-110' : 'text-slate-400 hover:text-slate-600'}`}>
          <Home size={22} className={view === 'home' ? 'drop-shadow-sm' : ''} />
          <span className="text-[9px] font-bold uppercase tracking-widest">Início</span>
        </button>
        <button onClick={() => setView('prayer')} className={`flex flex-col items-center gap-1.5 transition-all ${view === 'prayer' ? 'text-red-500 scale-110' : 'text-slate-400 hover:text-slate-600'}`}>
          <Heart size={22} fill={view === 'prayer' ? "currentColor" : "none"} />
          <span className="text-[9px] font-bold uppercase tracking-widest">Oração</span>
        </button>
        <button onClick={() => setView('testimonies')} className={`flex flex-col items-center gap-1.5 transition-all ${view === 'testimonies' || view === 'add-testimony' ? 'text-amber-500 scale-110' : 'text-slate-400 hover:text-slate-600'}`}>
          <Quote size={22} />
          <span className="text-[9px] font-bold uppercase tracking-widest">Vitórias</span>
        </button>
        {isAdmin && (
           <button onClick={() => setView('admin')} className={`flex flex-col items-center gap-1.5 transition-all ${view === 'admin' ? 'text-[#051c38] scale-110' : 'text-slate-400 hover:text-slate-600'}`}>
             <div className="relative">
               <Lock size={22} />
               {allRequests.filter(r => r.status === 'pending').length > 0 && (
                 <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white animate-pulse"></span>
               )}
             </div>
             <span className="text-[9px] font-bold uppercase tracking-widest">Admin</span>
           </button>
        )}
      </nav>

      {/* Estilos Animados Globais */}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes fade-in { from { opacity: 0; transform: translateY(5px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes slide-up { from { transform: translateY(40px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        @keyframes bounce-in { 0% { transform: scale(0.3); opacity: 0; } 50% { transform: scale(1.05); } 70% { transform: scale(0.9); } 100% { transform: scale(1); opacity: 1; } }
        .animate-fade-in { animation: fade-in 0.4s ease-out; }
        .animate-slide-up { animation: slide-up 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.1); }
        .animate-bounce-in { animation: bounce-in 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275); }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}} />
    </div>
  );
}
