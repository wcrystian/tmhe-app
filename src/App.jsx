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
  Sparkles,
  Wand2,
  Share2
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
    const timer = setTimeout(onClose, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const displayMessage = typeof message === 'string' ? message : String(message || "");

  return (
    <div className={`fixed top-4 right-4 z-50 p-4 rounded-xl shadow-2xl flex items-center gap-3 animate-bounce-in border ${
      type === 'success' ? 'bg-green-600 border-green-500 text-white' : 'bg-red-600 border-red-500 text-white'
    }`}>
      {type === 'success' ? <CheckCircle2 size={20} /> : <X size={20} />}
      <span className="font-medium text-sm">{displayMessage}</span>
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

  // Lógica de partilha REDESENHADA para ser infalível
  const handleShare = async () => {
    const url = window.location.href;
    const shareData = {
      title: 'Templo Missionário Há Esperança',
      text: 'Olá! Conheça o aplicativo do TMHE para pedidos de oração, visitas e testemunhos.',
      url: url
    };

    // Função interna para copiar link (fallback)
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

    // Se estivermos num telemóvel e o navegador suportar partilha
    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        // Se o utilizador cancelou, não fazemos nada. 
        // Se deu erro (como fechar sozinho), tentamos o copiar.
        if (err.name !== 'AbortError') {
          await copyToClipboard();
        }
      }
    } else {
      // Se for computador ou navegador antigo, apenas copia o link
      await copyToClipboard();
    }
  };

  const handleGenerateComfort = async () => {
    if (!formData.message) return notify('Escreva primeiro o seu pedido.', 'error');
    setAiLoading(true);
    setAiResponse('');
    const prompt = `O utilizador fez o seguinte pedido de oração: "${formData.message}". Escreve uma breve mensagem de conforto bíblico (máximo 3 frases) em Português de Portugal. Inclui um versículo bíblico curto e inspirador.`;
    const systemPrompt = "És um assistente pastoral do Templo Missionário Há Esperança. O teu objetivo é trazer esperança e conforto bíblico.";
    try {
      const response = await callGemini(prompt, systemPrompt);
      setAiResponse(response);
    } catch (err) {
      notify('Erro ao gerar palavra de conforto.', 'error');
    } finally {
      setAiLoading(false);
    }
  };

  const handleGenerateTitle = async () => {
    if (!formData.message) return notify('Escreva o testemunho primeiro.', 'error');
    setAiLoading(true);
    const prompt = `Gera um título inspirador e curto (máximo 5 palavras) para este testemunho: "${formData.message}". Usa Português de Portugal.`;
    try {
      const response = await callGemini(prompt);
      setFormData(prev => ({ ...prev, title: response.replace(/"/g, '') }));
      notify('✨ Título sugerido com sucesso!');
    } catch (err) {
      notify('Erro ao gerar título.', 'error');
    } finally {
      setAiLoading(false);
    }
  };

  const handleSubmitRequest = async (type) => {
    if (!formData.message) return notify('Escreva a sua mensagem.', 'error');
    try {
      await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'requests'), {
        ...formData,
        type,
        status: type === 'testimony' ? 'approved' : 'pending',
        createdAt: serverTimestamp(),
        userId: user.uid
      });
      notify('Enviado com sucesso!');
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
      notify('Estado atualizado.');
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
    if (typeof val === 'string' || typeof val === 'number') return val;
    return JSON.stringify(val);
  };

  const filteredRequests = useMemo(() => {
    if (filterType === 'all') return allRequests;
    return allRequests.filter(r => r.type === filterType);
  }, [allRequests, filterType]);

  const approvedTestimonies = useMemo(() => {
    return allRequests.filter(r => r.type === 'testimony' && r.status === 'approved');
  }, [allRequests]);

  if (loading) return (
    <div className="flex items-center justify-center h-screen bg-[#f1f5f9]">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#cfa855]"></div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#f1f5f9] pb-24 font-sans text-slate-800 selection:bg-[#cfa855]/30">
      {notification && <Notification message={notification.msg} type={notification.type} onClose={() => setNotification(null)} />}

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

            <div className="bg-white p-4 rounded-3xl shadow-xl border border-slate-100 mt-6 overflow-hidden">
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
          <div className="space-y-4 animate-fade-in">
            <div className="flex items-center justify-between mb-4 px-2">
              <h2 className="text-xl font-bold text-[#051c38]">Vitórias</h2>
              <button onClick={() => setView('add-testimony')} className="bg-[#cfa855] text-white px-4 py-2 rounded-full text-xs font-bold shadow-lg flex items-center gap-1"><Plus size={14} /> Contar Vitória</button>
            </div>
            {approvedTestimonies.length === 0 ? (
              <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-slate-200 text-slate-400 italic text-sm">Ainda sem testemunhos.</div>
            ) : (
              approvedTestimonies.map(t => (
                <div key={t.id} className="bg-white p-6 rounded-3xl shadow-md border border-slate-50 mb-4 transition-all hover:shadow-lg">
                  {t.title && <h4 className="font-black text-[#051c38] mb-1 uppercase text-[10px] tracking-widest">{safeRender(t.title)}</h4>}
                  <p className="text-slate-700 italic text-sm leading-relaxed mb-4">"{safeRender(t.message)}"</p>
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center text-[#cfa855] font-bold text-xs uppercase">{t.name ? t.name[0] : 'A'}</div>
                    <span className="font-bold text-xs text-slate-500">{t.isAnonymous ? 'Anónimo' : safeRender(t.name)}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {view === 'add-testimony' && (
          <div className="bg-white p-7 rounded-3xl shadow-2xl animate-slide-up border border-slate-100">
            <div className="flex items-center gap-2 mb-8">
              <button onClick={() => setView('testimonies')} className="p-2 -ml-2 hover:bg-slate-100 rounded-full transition-colors"><X size={20} /></button>
              <h2 className="text-xl font-bold text-[#051c38]">Novo Testemunho</h2>
            </div>
            <div className="space-y-5">
              <input type="text" placeholder="Título da Vitória (ou use a IA)" className="w-full p-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-[#cfa855] font-bold" value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})} />
              <div className="relative">
                <textarea placeholder="O que Deus fez na sua vida?" rows="6" className="w-full p-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-[#cfa855] font-medium" value={formData.message} onChange={(e) => setFormData({...formData, message: e.target.value})}></textarea>
                <button 
                  onClick={handleGenerateTitle} 
                  disabled={aiLoading}
                  className="absolute bottom-4 right-4 bg-white/80 shadow-sm text-[#cfa855] p-2 rounded-xl flex items-center gap-2 text-[10px] font-bold hover:bg-white border border-slate-100"
                >
                  <Wand2 size={12} /> IA Título
                </button>
              </div>
              <button onClick={() => handleSubmitRequest('testimony')} className="w-full bg-[#cfa855] text-white p-4 rounded-2xl font-bold flex items-center justify-center gap-3 shadow-xl active:scale-95 transition-all">
                Publicar Testemunho
              </button>
            </div>
          </div>
        )}

        {view === 'admin' && isAdmin && (
          <div className="space-y-5 animate-fade-in pb-12">
            <div className="flex items-center justify-between bg-white p-5 rounded-3xl shadow-md">
              <h2 className="font-bold text-sm text-[#051c38] uppercase tracking-wider">Gestão Pastoral</h2>
              <button onClick={() => setView('home')} className="p-2 text-red-500"><X size={20} /></button>
            </div>
            <div className="space-y-4">
              {filteredRequests.map(req => (
                <div key={req.id} className="bg-white rounded-3xl p-6 border-l-8 border-[#cfa855] shadow-md relative group">
                  <div className="absolute top-4 right-4 flex gap-2">
                    <button onClick={() => handleDelete(req.id)} className="text-slate-300 hover:text-red-500"><Trash2 size={16} /></button>
                  </div>
                  <h4 className="font-black text-slate-800 text-sm mb-1">{req.isAnonymous ? 'Anónimo' : safeRender(req.name)}</h4>
                  <p className="text-xs text-slate-500 mb-3 bg-slate-50 p-3 rounded-xl">"{safeRender(req.message)}"</p>
                  
                  <button 
                    onClick={async () => {
                      setAiLoading(true);
                      const prompt = `Gera uma resposta pastoral curta e encorajadora para este pedido: "${req.message}". Português de Portugal.`;
                      try {
                        const res = await callGemini(prompt);
                        notify(`Sugestão: ${res}`, 'success');
                      } catch(e) { notify('Erro na IA.', 'error'); } finally { setAiLoading(false); }
                    }}
                    className="text-[10px] font-black text-[#cfa855] flex items-center gap-1 hover:underline"
                  >
                    <Sparkles size={10} /> Sugestão de Resposta IA
                  </button>
                </div>
              ))}
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
              <input type="text" placeholder="Nome Completo" className="w-full p-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-[#cfa855] font-medium" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} />
              <input type="tel" placeholder="Telemóvel / WhatsApp" className="w-full p-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-[#cfa855]" value={formData.contact} onChange={(e) => setFormData({...formData, contact: e.target.value})} />
              <input type="text" placeholder="Morada completa" className="w-full p-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-[#cfa855]" value={formData.address} onChange={(e) => setFormData({...formData, address: e.target.value})} />
              <textarea placeholder="Motivo da visita..." rows="5" className="w-full p-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-[#cfa855] font-medium" value={formData.message} onChange={(e) => setFormData({...formData, message: e.target.value})}></textarea>
              <button onClick={() => handleSubmitRequest('visit')} className="w-full bg-[#cfa855] text-white p-4 rounded-2xl font-bold flex items-center justify-center gap-3 shadow-xl active:scale-95 transition-all">Solicitar Visita</button>
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

        {/* Botão central agora é Partilhar (com a lógica defensiva) */}
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
      `}} />
    </div>
  );
}
