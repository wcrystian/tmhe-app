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
  serverTimestamp,
  increment
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
  ThumbsUp
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

// --- INTEGRAÇÃO GEMINI API ---

const callGemini = async (prompt, systemInstruction = "") => {
  const apiKey = ""; 
  const model = "gemini-2.5-flash-preview-09-2025";
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  const payload = {
    contents: [{ parts: [{ text: prompt }] }],
    systemInstruction: systemInstruction ? { parts: [{ text: systemInstruction }] } : undefined
  };

  const maxRetries = 5;
  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const result = await response.json();
      return result.candidates?.[0]?.content?.parts?.[0]?.text;
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      const delay = Math.pow(2, i) * 1000;
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
};

// --- COMPONENTES AUXILIARES ---

const Logo = () => (
  <div className="flex flex-col items-center justify-center py-6">
    <div className="relative flex items-center justify-center w-44 h-44 mb-2">
      <div className="absolute inset-0 border-2 border-[#cfa855] rounded-full animate-pulse"></div>
      <img
        src="/logo.png"
        alt="TMHE Logo"
        className="z-10 w-32 h-32 object-contain"
        onError={(e) => {
          e.target.src = "https://via.placeholder.com/150?text=TMHE";
        }}
      />
    </div>
    <h1 className="text-2xl font-bold tracking-wider text-[#051c38]">TMHE</h1>
    <p className="text-xs uppercase tracking-[0.2em] text-[#cfa855] font-medium text-center px-4">Templo Missionário Há Esperança</p>
  </div>
);

const Notification = ({ message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 5000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className={`fixed top-4 left-4 right-4 md:left-auto md:w-80 z-50 p-4 rounded-xl shadow-2xl flex items-center gap-3 animate-bounce-in border ${
      type === 'success' ? 'bg-green-600 border-green-500 text-white' : 'bg-red-600 border-red-500 text-white'
    }`}>
      {type === 'success' ? <CheckCircle2 size={24} className="shrink-0" /> : <X size={24} className="shrink-0" />}
      <span className="font-bold text-sm leading-tight">{message}</span>
    </div>
  );
};

const ScheduleModal = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const schedules = [
    { day: 'Domingo', events: [
      { name: 'Escola Bíblica Dominical', time: '10:00 - 11:30' },
      { name: 'Culto de Adoração', time: '19:00 - 21:00' }
    ]},
    { day: 'Quarta-feira', events: [
      { name: 'Culto de Consagração', time: '19:00 - 21:00' }
    ]},
    { day: 'Sexta-feira', events: [
      { name: 'Culto de Libertação', time: '19:00 - 21:00' }
    ]}
  ];

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center px-4 bg-black/60 backdrop-blur-sm transition-opacity">
      <div className="bg-white w-full max-w-sm rounded-[2.5rem] shadow-2xl overflow-hidden animate-bounce-in border border-slate-100">
        <div className="bg-[#051c38] p-6 text-white flex justify-between items-center border-b border-[#cfa855]/30">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#cfa855] rounded-xl">
              <Calendar size={20} className="text-[#051c38]" />
            </div>
            <h3 className="font-bold text-lg tracking-tight">Horários de Cultos</h3>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors text-white/70">
            <X size={20} />
          </button>
        </div>
        
        <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto no-scrollbar">
          {schedules.map((item, idx) => (
            <div key={idx} className="space-y-3">
              <h4 className="text-xs font-black uppercase tracking-[0.2em] text-[#cfa855] flex items-center gap-2">
                <span className="w-1 h-3 bg-[#cfa855] rounded-full"></span>
                {item.day}
              </h4>
              <div className="space-y-2">
                {item.events.map((event, eIdx) => (
                  <div key={eIdx} className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex items-center justify-between group hover:border-[#cfa855]/30 transition-all">
                    <div className="flex flex-col flex-1 mr-2">
                      <span className="text-sm font-bold text-slate-800 leading-tight">{event.name}</span>
                    </div>
                    <div className="shrink-0 flex items-center gap-2 text-[#cfa855] font-bold text-xs bg-white px-3 py-1.5 rounded-xl border border-slate-100 shadow-sm whitespace-nowrap">
                      <Clock size={12} />
                      {event.time}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
        
        <div className="p-6 bg-slate-50 border-t border-slate-100">
          <p className="text-[10px] text-slate-400 text-center italic font-medium">
            "Alegrei-me quando me disseram: Vamos à casa do Senhor." (Salmos 122:1)
          </p>
        </div>
      </div>
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
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResponse, setAiResponse] = useState('');
  const [showSchedule, setShowSchedule] = useState(false);
  
  const isConfigPlaceholder = firebaseConfig.apiKey === "SUA_API_KEY_AQUI";
  const [configMissing, setConfigMissing] = useState(isConfigPlaceholder);
  
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminPin, setAdminPin] = useState('');
  const [filterType, setFilterType] = useState('all');

  const [formData, setFormData] = useState({
    name: '',
    contact: '',
    message: '',
    address: '',
    preferredDays: [],
    timeSlot: '',
    isAnonymous: false,
    title: ''
  });

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

  useEffect(() => {
    if (!user || configMissing) return;

    const q = query(collection(db, 'artifacts', appId, 'public', 'data', 'requests'));
    const unsubscribe = onSnapshot(q, 
      (snapshot) => {
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        const sorted = data.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
        setAllRequests(sorted);
      },
      (err) => console.error("Erro no Banco de Dados:", err)
    );
    return () => unsubscribe();
  }, [user, configMissing]);

  const notify = (msg, type = 'success') => setNotification({ msg, type });

  const handleWhatsAppChange = (e) => {
    let value = e.target.value.replace(/\D/g, "");
    if (value.length > 11) value = value.slice(0, 11);
    
    let formatted = value;
    if (value.length > 0) {
      formatted = `(${value.slice(0, 2)}`;
      if (value.length > 2) {
        formatted += `) ${value.slice(2, 7)}`;
        if (value.length > 7) {
          formatted += `-${value.slice(7)}`;
        }
      }
    }
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
    const shareData = {
      title: 'Templo Missionário Há Esperança',
      text: 'Olá! Conheça o aplicativo do TMHE para pedidos de oração, visitas e testemunhos.',
      url: url
    };

    const copyToClipboard = async () => {
      try {
        if (navigator.clipboard && navigator.clipboard.writeText) {
          await navigator.clipboard.writeText(url);
        } else {
          const textArea = document.createElement("textarea");
          textArea.value = url;
          document.body.appendChild(textArea);
          textArea.select();
          document.execCommand('copy');
          document.body.removeChild(textArea);
        }
        notify('Link copiado! Já o pode colar no WhatsApp ou redes sociais.', 'success');
      } catch (e) {
        notify('Não foi possível copiar o link automaticamente.', 'error');
      }
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        if (err.name !== 'AbortError') {
          await copyToClipboard();
        }
      }
    } else {
      await copyToClipboard();
    }
  };

  const handleGenerateComfort = async () => {
    if (!formData.message) return notify('Escreva primeiro o seu pedido.', 'error');
    setAiLoading(true);
    setAiResponse('');
    const prompt = `O utilizador fez o seguinte pedido de oração: "${formData.message}". Escreve uma breve mensagem de conforto bíblico (máximo 3 frases) em Português de Portugal. Inclui um versículo bíblico curto e inspirador, obrigatoriamente com a respetiva referência (Livro, Capítulo e Versículo).`;
    const systemPrompt = "És um assistente pastoral do Templo Missionário Há Esperança. O teu objetivo é trazer esperança e conforto bíblico fundamentado nas Escrituras.";
    try {
      const response = await callGemini(prompt, systemPrompt);
      setAiResponse(response);
    } catch (err) {
      notify('Erro ao gerar palavra de conforto.', 'error');
    } finally {
      setAiLoading(false);
    }
  };

  const handleLike = async (id) => {
    try {
      const testimonyRef = doc(db, 'artifacts', appId, 'public', 'data', 'requests', id);
      await updateDoc(testimonyRef, {
        likes: increment(1)
      });
    } catch (err) {
      console.error("Erro ao curtir:", err);
    }
  };

  const handleSubmitRequest = async (type) => {
    if (!formData.message && type !== 'visit') return notify('Escreva a sua mensagem.', 'error');
    if (type === 'visit' && (!formData.name || !formData.contact || !formData.address)) {
      return notify('Por favor, preencha nome, whatsapp e endereço.', 'error');
    }
    if (type === 'testimony' && (!formData.name || !formData.title || !formData.message)) {
      return notify('Preencha o seu nome, título e o seu testemunho.', 'error');
    }
    
    try {
      await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'requests'), {
        ...formData,
        type,
        status: 'pending', 
        createdAt: serverTimestamp(),
        userId: user.uid,
        likes: 0
      });

      const successMsg = type === 'visit' 
        ? 'A igreja entrará em contato para confirmar a visita.' 
        : 'Enviado com sucesso!';

      notify(successMsg);
      setFormData({ name: '', contact: '', message: '', address: '', preferredDays: [], timeSlot: '', isAnonymous: false, title: '' });
      setAiResponse('');
      setView(type === 'testimony' ? 'testimonies' : 'home');
    } catch (err) {
      notify('Erro ao enviar.', 'error');
    }
  };

  const handleUpdateStatus = async (id, newStatus) => {
    try {
      await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'requests', id), { status: newStatus });
      notify('Estado atualizado com sucesso.');
    } catch (err) { notify('Erro ao atualizar.', 'error'); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Eliminar permanentemente?')) return;
    try {
      await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'requests', id));
      notify('Registo eliminado.');
    } catch (err) { notify('Erro ao eliminar.', 'error'); }
  };

  const checkAdmin = () => {
    if (adminPin === '1234') { 
      setIsAdmin(true);
      setView('admin');
      setAdminPin('');
    } else { notify('PIN Incorreto', 'error'); }
  };

  const safeRender = (val) => {
    if (val === null || val === undefined) return "";
    if (Array.isArray(val)) return val.join(", ");
    if (typeof val === 'string' || typeof val === 'number') return val;
    return JSON.stringify(val);
  };

  const filteredRequests = useMemo(() => {
    if (filterType === 'all') return allRequests;
    return allRequests.filter(r => r.type === filterType);
  }, [allRequests, filterType]);

  const approvedTestimonies = useMemo(() => {
    return allRequests.filter(r => r.type === 'testimony');
  }, [allRequests]);

  if (loading) return (
    <div className="flex items-center justify-center h-screen bg-[#f1f5f9]">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#cfa855]"></div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#f1f5f9] pb-24 font-sans text-slate-800 selection:bg-[#cfa855]/30">
      {notification && <Notification message={notification.msg} type={notification.type} onClose={() => setNotification(null)} />}
      
      <ScheduleModal isOpen={showSchedule} onClose={() => setShowSchedule(false)} />

      <header className="bg-[#051c38] text-white shadow-2xl rounded-b-[2.5rem] sticky top-0 z-30 border-b border-[#cfa855]/20 relative">
        <div className="absolute top-6 right-6 z-40">
           <button 
             onClick={() => setView('login')} 
             className="p-2 bg-white/10 hover:bg-white/20 rounded-full text-white/70 transition-all border border-white/5"
           >
             <Lock size={18} />
           </button>
        </div>
        <Logo />
      </header>

      <main className="max-w-md mx-auto px-4 mt-8">
        
        {view === 'home' && (
          <div className="space-y-4 animate-fade-in">
            <div className="bg-white p-6 rounded-3xl shadow-xl border border-slate-100 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-24 h-24 bg-[#cfa855]/5 rounded-bl-full -mr-8 -mt-8 transition-all group-hover:scale-110"></div>
              <h2 className="text-xl font-bold text-[#051c38] mb-2 flex items-center gap-2">
                <Sparkles size={20} className="text-[#cfa855]" /> Bem-vindo ao TMHE
              </h2>
              <p className="text-slate-500 text-sm leading-relaxed mb-4">
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

              <button onClick={() => setView('testimonies')} className="w-full bg-white p-5 rounded-2xl shadow-md flex items-center justify-between border border-transparent hover:border-[#cfa855] transition-all group">
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

            <button 
              onClick={() => setShowSchedule(true)}
              className="w-full bg-[#051c38] p-5 rounded-2xl shadow-lg border border-[#cfa855]/30 flex items-center justify-between group overflow-hidden relative mt-6"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
              <div className="flex items-center gap-4 relative z-10">
                <div className="bg-[#cfa855] p-3 rounded-xl text-[#051c38]"><Calendar size={24} /></div>
                <div className="text-left text-white">
                  <h3 className="font-bold">Horários de Culto</h3>
                  <p className="text-[10px] opacity-70 uppercase font-semibold tracking-wider">Saiba quando nos visitar</p>
                </div>
              </div>
              <Info className="text-[#cfa855] relative z-10" size={20} />
            </button>

            <div className="bg-white p-4 rounded-3xl shadow-xl border border-slate-100 overflow-hidden">
               <h3 className="text-sm font-bold text-[#051c38] mb-3 flex items-center gap-2 uppercase tracking-widest px-2">
                 <MapPin size={16} className="text-[#cfa855]" /> Localização
               </h3>
               <div className="rounded-2xl overflow-hidden border border-slate-50 h-[250px] w-full bg-slate-50 relative">
                  <iframe 
                    src="https://www.google.com/maps/embed?pb=!1m14!1m12!1m3!1d266.352304462434!2d-43.33688119999806!3d-22.822559745632812!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!5e1!3m2!1spt-BR!2sbr!4v1766371878086!5m2!1spt-BR!2sbr" 
                    width="100%" 
                    height="100%" 
                    style={{ border: 0 }} 
                    allowFullScreen="" 
                    loading="lazy" 
                    referrerPolicy="no-referrer-when-downgrade"
                  ></iframe>
               </div>
               <div className="mt-4 text-center">
                  <a 
                    href="https://maps.app.goo.gl/7qi7anN314nEYmVg7" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-xs font-bold text-[#cfa855] hover:underline flex items-center justify-center gap-2"
                  >
                    Clique aqui e chegue até nós <ExternalLink size={12} />
                  </a>
               </div>
            </div>
          </div>
        )}

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
                <input type="text" placeholder="O seu nome completo" className="w-full p-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-[#cfa855] font-medium" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} />
              )}
              <div className="relative">
                <textarea placeholder="Partilhe o que vai no seu coração..." rows="5" className="w-full p-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-[#cfa855] font-medium leading-relaxed" value={formData.message} onChange={(e) => setFormData({...formData, message: e.target.value})}></textarea>
                <button 
                  onClick={handleGenerateComfort} 
                  disabled={aiLoading}
                  className="absolute bottom-4 right-4 bg-white/80 shadow-sm text-[#cfa855] p-2 rounded-xl flex items-center gap-2 text-[10px] font-bold hover:bg-white transition-all border border-slate-100"
                >
                  {aiLoading ? "..." : <Sparkles size={12} />} IA Conforto
                </button>
              </div>
              {aiResponse && <div className="bg-[#051c38] text-white p-5 rounded-2xl text-sm italic border-l-4 border-[#cfa855] animate-fade-in">{aiResponse}</div>}
              <button onClick={() => handleSubmitRequest('prayer')} className="w-full bg-[#051c38] text-white p-4 rounded-2xl font-bold flex items-center justify-center gap-3 shadow-xl hover:bg-slate-900 transition-all active:scale-95">
                <Send size={18} /> Enviar Pedido
              </button>
            </div>
          </div>
        )}

        {view === 'testimonies' && (
          <div className="space-y-4 animate-fade-in pb-12">
            <div className="flex items-center justify-between mb-6 px-2">
              <h2 className="text-2xl font-bold text-[#051c38]">Vitórias</h2>
              <button onClick={() => setView('add-testimony')} className="bg-[#cfa855] text-white px-5 py-2.5 rounded-full text-xs font-black shadow-lg flex items-center gap-2 uppercase tracking-widest active:scale-95 transition-all">
                <Plus size={16} /> Contar Vitória
              </button>
            </div>
            {approvedTestimonies.length === 0 ? (
              <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-slate-200 text-slate-400 italic text-sm">Ainda sem testemunhos.</div>
            ) : (
              approvedTestimonies.map(t => (
                <div key={t.id} className="bg-white p-6 rounded-3xl shadow-md border border-slate-50 mb-4 transition-all hover:shadow-lg relative group">
                  <div className="flex justify-between items-start mb-2">
                    {t.title && <h4 className="font-black text-[#051c38] uppercase text-xs tracking-widest flex-1 pr-12">{safeRender(t.title)}</h4>}
                    <button 
                      onClick={() => handleLike(t.id)}
                      className="flex flex-col items-center gap-1 group/like transition-all active:scale-125"
                    >
                      <div className="p-2 bg-pink-50 rounded-full text-pink-500 group-hover/like:bg-pink-100 transition-colors">
                        <Heart size={16} fill={t.likes > 0 ? "currentColor" : "none"} />
                      </div>
                      <span className="text-[10px] font-black text-pink-500">{t.likes || 0}</span>
                    </button>
                  </div>
                  <p className="text-slate-700 italic text-sm leading-relaxed mb-6">"{safeRender(t.message)}"</p>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-[#051c38] text-white rounded-full flex items-center justify-center font-black text-[10px] uppercase shadow-sm">
                      {t.name ? t.name[0] : 'A'}
                    </div>
                    <div>
                      <span className="font-black text-[10px] text-slate-500 uppercase tracking-widest block">{t.isAnonymous ? 'Anónimo' : safeRender(t.name)}</span>
                      <span className="text-[8px] text-slate-300 font-bold uppercase tracking-tighter">Testemunho de Fé</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {view === 'add-testimony' && (
          <div className="bg-white p-8 rounded-3xl shadow-2xl animate-slide-up border border-slate-100">
            <div className="flex items-center gap-2 mb-8">
              <button onClick={() => setView('testimonies')} className="p-2 -ml-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400"><X size={20} /></button>
              <h2 className="text-xl font-black text-[#051c38] uppercase tracking-tighter">Partilhar Vitória</h2>
            </div>
            <div className="space-y-5">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase ml-2 tracking-widest">Seu Nome</label>
                <input 
                  type="text" 
                  placeholder="Como se chama?" 
                  className="w-full p-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-[#cfa855] font-bold" 
                  value={formData.name} 
                  onChange={(e) => setFormData({...formData, name: e.target.value})} 
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase ml-2 tracking-widest">Título da Vitória</label>
                <input 
                  type="text" 
                  placeholder="Ex: Cura de enfermidade" 
                  className="w-full p-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-[#cfa855] font-bold" 
                  value={formData.title} 
                  onChange={(e) => setFormData({...formData, title: e.target.value})} 
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase ml-2 tracking-widest">O que Deus fez na sua vida?</label>
                <textarea 
                  placeholder="Conte-nos o seu testemunho..." 
                  rows="6" 
                  className="w-full p-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-[#cfa855] font-medium leading-relaxed" 
                  value={formData.message} 
                  onChange={(e) => setFormData({...formData, message: e.target.value})}
                ></textarea>
              </div>

              <button 
                onClick={() => handleSubmitRequest('testimony')} 
                className="w-full bg-[#cfa855] text-white p-4 rounded-2xl font-black uppercase tracking-widest flex items-center justify-center gap-3 shadow-xl active:scale-95 transition-all mt-4"
              >
                Publicar Testemunho
              </button>
            </div>
          </div>
        )}

        {view === 'admin' && isAdmin && (
          <div className="space-y-5 animate-fade-in pb-12">
            <div className="flex items-center justify-between bg-white p-5 rounded-3xl shadow-md border border-slate-100">
              <h2 className="font-bold text-sm text-[#051c38] uppercase tracking-wider">Gestão Pastoral</h2>
              <button onClick={() => setView('home')} className="p-2 text-red-500 hover:bg-red-50 rounded-full transition-colors"><X size={20} /></button>
            </div>

            <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
              {['all', 'prayer', 'visit', 'testimony'].map(cat => (
                <button 
                  key={cat} 
                  onClick={() => setFilterType(cat)}
                  className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${
                    filterType === cat ? 'bg-[#051c38] text-white shadow-lg' : 'bg-white text-slate-400 border border-slate-100'
                  }`}
                >
                  {cat === 'all' ? 'Todos' : cat === 'prayer' ? 'Orações' : cat === 'visit' ? 'Visitas' : 'Vitórias'}
                </button>
              ))}
            </div>

            <div className="space-y-4">
              {filteredRequests.map(req => {
                let borderClass = 'border-slate-200';
                let statusLabel = 'Pendente';
                let statusBg = 'bg-slate-100 text-slate-500';

                if (req.type === 'visit') {
                  if (req.status === 'pending') {
                    borderClass = 'border-red-400';
                    statusLabel = 'Visita não confirmada';
                    statusBg = 'bg-red-50 text-red-600';
                  } else if (req.status === 'confirmed') {
                    borderClass = 'border-yellow-400';
                    statusLabel = 'Visita confirmada';
                    statusBg = 'bg-yellow-50 text-yellow-700';
                  } else if (req.status === 'completed') {
                    borderClass = 'border-green-400';
                    statusLabel = 'Visita realizada';
                    statusBg = 'bg-green-50 text-green-700';
                  }
                } else {
                  if (req.status === 'completed') {
                    borderClass = 'border-green-400 opacity-60';
                    statusLabel = 'Concluído';
                    statusBg = 'bg-green-50 text-green-700';
                  } else {
                    borderClass = req.type === 'prayer' ? 'border-red-400' : 'border-amber-400';
                    statusLabel = 'Pendente';
                    statusBg = 'bg-slate-50 text-slate-500';
                  }
                }

                return (
                  <div key={req.id} className={`bg-white rounded-3xl p-6 border-l-8 shadow-md relative group transition-all ${borderClass}`}>
                    <div className="absolute top-4 right-4 flex gap-2">
                      <button onClick={() => handleDelete(req.id)} className="text-slate-300 hover:text-red-500 transition-colors"><Trash2 size={16} /></button>
                    </div>
                    
                    <div className="mb-4">
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded border ${statusBg}`}>
                          {statusLabel}
                        </span>
                        <span className="text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded bg-slate-50 border border-slate-100 text-slate-400">
                          {req.type === 'visit' ? 'Visita' : req.type === 'prayer' ? 'Oração' : 'Testemunho'}
                        </span>
                      </div>
                      <h4 className="font-black text-slate-800 text-lg">{req.isAnonymous ? 'Anónimo' : safeRender(req.name)}</h4>
                    </div>

                    {req.type === 'visit' && (
                      <div className="grid grid-cols-1 gap-3 mb-4">
                        <div className="flex items-center gap-3 bg-blue-50/30 p-3 rounded-2xl border border-blue-100/50">
                          <Phone size={16} className="text-blue-500" />
                          <div>
                            <p className="text-[9px] uppercase font-bold text-slate-400 leading-none mb-1">WhatsApp</p>
                            <p className="text-sm font-bold text-slate-700">{safeRender(req.contact)}</p>
                          </div>
                        </div>
                        
                        <div className="flex items-start gap-3 bg-slate-50 p-3 rounded-2xl border border-slate-100">
                          <MapPin size={16} className="text-slate-400 mt-1" />
                          <div>
                            <p className="text-[9px] uppercase font-bold text-slate-400 leading-none mb-1">Endereço Completo</p>
                            <p className="text-sm font-medium text-slate-600 leading-relaxed">{safeRender(req.address)}</p>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
                            <p className="text-[9px] uppercase font-bold text-slate-400 leading-none mb-1 flex items-center gap-1"><Calendar size={10} /> Dias</p>
                            <p className="text-xs font-bold text-slate-600">{safeRender(req.preferredDays) || 'Não inf.'}</p>
                          </div>
                          <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
                            <p className="text-[9px] uppercase font-bold text-slate-400 leading-none mb-1 flex items-center gap-1"><Clock size={10} /> Horário</p>
                            <p className="text-xs font-bold text-slate-600">{safeRender(req.timeSlot) || 'Não inf.'}</p>
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 mb-4">
                      <p className="text-[9px] uppercase font-bold text-slate-400 mb-2">Observações / Mensagem</p>
                      <p className="text-sm text-slate-600 italic leading-relaxed">"{safeRender(req.message)}"</p>
                      {req.type === 'testimony' && (
                        <div className="mt-2 pt-2 border-t border-slate-200/50 flex items-center gap-1 text-[9px] font-black text-pink-400 uppercase">
                          <Heart size={10} /> {req.likes || 0} Curtidas
                        </div>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-50">
                      {req.type === 'visit' ? (
                        <>
                          {req.status === 'pending' && (
                            <button 
                              onClick={() => handleUpdateStatus(req.id, 'confirmed')}
                              className="flex-1 flex items-center justify-center gap-2 py-2 bg-yellow-400 text-yellow-900 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-yellow-500 transition-all"
                            >
                              <CalendarCheck size={14} /> Confirmar Visita
                            </button>
                          )}
                          {(req.status === 'pending' || req.status === 'confirmed') && (
                            <button 
                              onClick={() => handleUpdateStatus(req.id, 'completed')}
                              className="flex-1 flex items-center justify-center gap-2 py-2 bg-green-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-green-600 transition-all"
                            >
                              <CheckCircle2 size={14} /> Marcar Realizada
                            </button>
                          )}
                        </>
                      ) : (
                        req.status !== 'completed' && (
                          <button 
                            onClick={() => handleUpdateStatus(req.id, 'completed')}
                            className="w-full flex items-center justify-center gap-2 py-2 bg-[#051c38] text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-900 transition-all"
                          >
                            <CheckCircle2 size={14} /> Marcar como Concluído
                          </button>
                        )
                      )}
                    </div>
                  </div>
                );
              })}
              
              {filteredRequests.length === 0 && (
                <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-slate-200 text-slate-300 italic">
                  Nenhum registo encontrado nesta categoria.
                </div>
              )}
            </div>
          </div>
        )}

        {view === 'login' && (
          <div className="bg-white p-8 rounded-3xl shadow-2xl text-center space-y-8 animate-fade-in mt-10">
            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto text-slate-300 border border-slate-100 shadow-inner"><Lock size={40} /></div>
            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-[#051c38]">Área Restrita</h2>
              <p className="text-sm text-slate-400 font-medium leading-relaxed">Painel de gestão pastoral. Introduza o código de acesso.</p>
            </div>
            <input type="password" placeholder="••••" maxLength={4} className="text-center text-4xl tracking-[1em] w-full p-5 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-[#cfa855] shadow-inner font-mono" value={adminPin} onChange={(e) => setAdminPin(e.target.value)} />
            <div className="flex gap-4">
              <button onClick={() => setView('home')} className="flex-1 p-4 bg-slate-50 text-slate-500 rounded-2xl font-bold hover:bg-slate-100 transition-colors">Voltar</button>
              <button onClick={checkAdmin} className="flex-1 p-4 bg-[#051c38] text-white rounded-2xl font-bold hover:bg-slate-900 shadow-lg shadow-navy/20 transition-all active:scale-95">Entrar</button>
            </div>
          </div>
        )}

        {view === 'visit' && (
          <div className="bg-white p-7 rounded-3xl shadow-2xl animate-slide-up border border-slate-100">
            <div className="flex items-center gap-2 mb-8">
              <button onClick={() => setView('home')} className="p-2 -ml-2 hover:bg-slate-100 rounded-full transition-colors"><X size={20} /></button>
              <h2 className="text-xl font-bold text-[#051c38]">Agendar Visita</h2>
            </div>
            <div className="space-y-5">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase ml-2 tracking-widest">Nome Completo</label>
                <input 
                  type="text" 
                  placeholder="Seu nome" 
                  className="w-full p-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-[#cfa855] font-medium" 
                  value={formData.name} 
                  onChange={(e) => setFormData({...formData, name: e.target.value})} 
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase ml-2 tracking-widest">WhatsApp</label>
                <input 
                  type="tel" 
                  placeholder="(21) 98765-4321" 
                  className="w-full p-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-[#cfa855] font-medium" 
                  value={formData.contact} 
                  onChange={handleWhatsAppChange} 
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase ml-2 tracking-widest">Endereço</label>
                <input 
                  type="text" 
                  placeholder="Rua, número, bairro e complemento" 
                  className="w-full p-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-[#cfa855] font-medium" 
                  value={formData.address} 
                  onChange={(e) => setFormData({...formData, address: e.target.value})} 
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-500 uppercase ml-2 tracking-widest flex items-center gap-2">
                  <Calendar size={14} /> Melhor dia para a visita
                </label>
                <div className="flex flex-wrap gap-2">
                  {['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab', 'Dom'].map(day => (
                    <button 
                      key={day} 
                      onClick={() => handleDayToggle(day)} 
                      className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
                        formData.preferredDays.includes(day) 
                          ? 'bg-[#cfa855] text-white border-transparent shadow-md' 
                          : 'bg-white text-slate-400 border-slate-100 hover:bg-slate-50'
                      }`}
                    >
                      {day}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase ml-2 tracking-widest flex items-center gap-2">
                  <Clock size={14} /> Horário sugerido (24h)
                </label>
                <input 
                  type="text" 
                  placeholder="Ex: 14:30" 
                  className="w-full p-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-[#cfa855] font-medium" 
                  value={formData.timeSlot} 
                  onChange={(e) => {
                    let val = e.target.value.replace(/\D/g, "");
                    if (val.length > 4) val = val.slice(0, 4);
                    if (val.length > 2) val = val.slice(0, 2) + ":" + val.slice(2);
                    setFormData({...formData, timeSlot: val});
                  }} 
                />
              </div>

              <textarea 
                placeholder="Observações adicionais..." 
                rows="3" 
                className="w-full p-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-[#cfa855] font-medium leading-relaxed" 
                value={formData.message} 
                onChange={(e) => setFormData({...formData, message: e.target.value})}
              ></textarea>

              <button 
                onClick={() => handleSubmitRequest('visit')} 
                className="w-full bg-[#cfa855] text-white p-4 rounded-2xl font-bold flex items-center justify-center gap-3 shadow-xl active:scale-95 transition-all mt-4"
              >
                <Calendar size={18} /> Agendar Visita
              </button>
            </div>
          </div>
        )}

      </main>

      <nav className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-lg border-t border-slate-100 px-6 py-4 flex justify-around items-center z-40 shadow-[0_-10px_30px_-10px_rgba(0,0,0,0.1)]">
        <button 
          onClick={() => setView('home')} 
          className={`flex flex-col items-center gap-1.5 transition-all ${view === 'home' ? 'text-[#cfa855] scale-110' : 'text-slate-400 hover:text-slate-600'}`}
        >
          <Home size={26} />
          <span className="text-[9px] font-bold uppercase tracking-widest">Início</span>
        </button>

        <button 
          onClick={handleShare} 
          className="flex flex-col items-center gap-1.5 transition-all text-slate-400 hover:text-[#cfa855] active:scale-110"
        >
          <div className="bg-[#cfa855]/10 p-2 rounded-xl text-[#cfa855]">
            <Share2 size={26} />
          </div>
          <span className="text-[9px] font-bold uppercase tracking-widest">Partilhar</span>
        </button>

        <button 
          onClick={() => setView('testimonies')} 
          className={`flex flex-col items-center gap-1.5 transition-all ${view === 'testimonies' || view === 'add-testimony' ? 'text-amber-500 scale-110' : 'text-slate-400 hover:text-slate-600'}`}
        >
          <Quote size={26} />
          <span className="text-[9px] font-bold uppercase tracking-widest">Vitórias</span>
        </button>
      </nav>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes fade-in { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes slide-up { from { transform: translateY(50px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        @keyframes bounce-in { 0% { transform: scale(0.3); opacity: 0; } 50% { transform: scale(1.05); } 100% { transform: scale(1); opacity: 1; } }
        .animate-fade-in { animation: fade-in 0.5s ease-out forwards; }
        .animate-slide-up { animation: slide-up 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.1); }
        .animate-bounce-in { animation: bounce-in 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.2); }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}} />
    </div>
  );
}
