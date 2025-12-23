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
  ShieldCheck,
  Scale
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

// --- COMPONENTES AUXILIARES ---

const Header = ({ isScrolled, onLoginClick }) => (
  <header className={`bg-[#051c38] text-white shadow-2xl rounded-b-[2.5rem] sticky top-0 z-30 border-b border-[#cfa855]/20 transition-all duration-500 ease-in-out ${isScrolled ? 'h-20 shadow-lg' : 'h-56'}`}>
    <div className="absolute top-4 right-4 z-40">
       <button 
         onClick={onLoginClick} 
         className={`bg-white/10 hover:bg-white/20 rounded-full text-white/70 transition-all border border-white/5 ${isScrolled ? 'p-1.5 opacity-50' : 'p-2'}`}
       >
         <Lock size={isScrolled ? 14 : 18} />
       </button>
    </div>

    <div className="flex flex-col items-center justify-center h-full px-4 overflow-hidden">
      <div className={`relative flex items-center justify-center transition-all duration-500 ease-out transform ${isScrolled ? 'scale-0 h-0 opacity-0' : 'scale-100 h-28 w-28 mb-3 opacity-100'}`}>
        <div className="absolute inset-0 border-2 border-[#cfa855] rounded-full animate-pulse"></div>
        <img
          src="/logo.png"
          alt="TMHE Logo"
          className="z-10 w-24 h-24 object-contain"
          onError={(e) => { e.target.src = "https://via.placeholder.com/150?text=TMHE"; }}
        />
      </div>
      
      <div className={`text-center transition-all duration-500 ease-out`}>
        <h1 className={`font-bold tracking-wider text-white transition-all duration-500 ${isScrolled ? 'text-xl' : 'text-2xl'}`}>
          TMHE
        </h1>
        <p className={`uppercase tracking-[0.15em] text-[#cfa855] font-semibold transition-all duration-500 ${isScrolled ? 'text-[8px] opacity-70' : 'text-[10px]'}`}>
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
      <div className="bg-white w-full max-w-sm rounded-[2rem] shadow-2xl overflow-hidden animate-bounce-in max-h-[85vh] flex flex-col">
        <div className="bg-[#051c38] p-6 text-white flex justify-between items-center shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#cfa855] rounded-xl"><ShieldCheck size={20} className="text-[#051c38]" /></div>
            <h3 className="font-bold text-lg">Termos e Privacidade</h3>
          </div>
          <button onClick={onClose} className="p-2 text-white/50 hover:text-white"><X size={20} /></button>
        </div>
        <div className="p-6 space-y-4 overflow-y-auto text-sm text-slate-600 leading-relaxed text-left no-scrollbar">
          <section>
            <h4 className="font-bold text-[#051c38] mb-1">1. Coleta de Dados (LGPD)</h4>
            <p>Ao utilizar nossos formulários, você consente com a coleta de seu nome, contato e endereço. Estes são dados necessários para a finalidade de apoio espiritual e eclesiástico solicitado.</p>
          </section>
          <section>
            <h4 className="font-bold text-[#051c38] mb-1">2. Finalidade e Sigilo</h4>
            <p>Os dados são de uso exclusivo do Templo Missionário Há Esperança (TMHE). Garantimos o sigilo pastoral e não compartilhamos suas informações com terceiros para fins comerciais.</p>
          </section>
          <section>
            <h4 className="font-bold text-[#051c38] mb-1">3. Testemunhos e Imagem</h4>
            <p>Ao publicar uma "Vitória", você autoriza a exibição pública do texto e nome (ou anonimato conforme escolhido) dentro desta plataforma para fins de edificação da comunidade.</p>
          </section>
          <section>
            <h4 className="font-bold text-[#051c38] mb-1">4. Seus Direitos</h4>
            <p>Você pode solicitar a exclusão de seus dados ou mensagens a qualquer momento através do suporte pastoral presencial na nossa sede.</p>
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
    <div className="fixed inset-0 z-[60] flex items-center justify-center px-4 bg-black/60 backdrop-blur-sm">
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

// --- COMPONENTE PRINCIPAL ---

export default function App() {
  const [user, setUser] = useState(null);
  const [view, setView] = useState('home'); 
  const [allRequests, setAllRequests] = useState([]);
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

  useEffect(() => {
    if (!user || configMissing) return;
    const q = query(collection(db, 'artifacts', appId, 'public', 'data', 'requests'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        const sorted = data.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
        setAllRequests(sorted);
      }, (err) => console.error("Erro no Banco de Dados:", err));
    return () => unsubscribe();
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
        notify('Link copiado!', 'success');
      } catch (e) { notify('Erro ao copiar link.', 'error'); }
    };
    if (navigator.share) { try { await navigator.share(shareData); } catch (err) { if (err.name !== 'AbortError') await copyToClipboard(); } }
    else { await copyToClipboard(); }
  };

  const handleLike = async (id) => {
    try {
      const testimonyRef = doc(db, 'artifacts', appId, 'public', 'data', 'requests', id);
      await updateDoc(testimonyRef, { likes: increment(1) });
    } catch (err) { console.error("Erro ao curtir:", err); }
  };

  const handleSubmitRequest = async (type) => {
    if (!formData.message && type !== 'visit') return notify('Escreva a sua mensagem.', 'error');
    if (type === 'visit' && (!formData.name || !formData.contact || !formData.address)) return notify('Preencha os campos obrigatórios.', 'error');
    if (type === 'testimony' && (!formData.name || !formData.title || !formData.message)) return notify('Preencha os campos obrigatórios.', 'error');
    if (type === 'prayer' && formData.wantContact && !formData.contact) return notify('Informe o WhatsApp.', 'error');
    
    try {
      await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'requests'), {
        ...formData, type, status: 'pending', createdAt: serverTimestamp(), userId: user.uid, likes: type === 'testimony' ? 0 : null
      });
      notify('Enviado com sucesso!');
      setFormData({ name: '', contact: '', message: '', address: '', preferredDays: [], timeSlot: '', isAnonymous: false, title: '', wantContact: false });
      setView(type === 'testimony' ? 'testimonies' : 'home');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) { notify('Erro ao enviar.', 'error'); }
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
      setIsAdmin(true); setView('admin'); setAdminPin('');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else { notify('PIN Incorreto', 'error'); }
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

      <Header isScrolled={isScrolled} onLoginClick={() => { setView('login'); window.scrollTo(0,0); }} />

      <main className="max-w-md mx-auto px-4 mt-6 pb-32">
        
        {view === 'home' && (
          <div className="space-y-4 animate-fade-in">
            <div className="bg-white p-6 rounded-3xl shadow-xl border border-slate-100 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-24 h-24 bg-[#cfa855]/5 rounded-bl-full -mr-8 -mt-8 transition-all group-hover:scale-110"></div>
              <h2 className="text-xl font-bold text-[#051c38] mb-2 flex items-center gap-2">
                <Sparkles size={20} className="text-[#cfa855]" /> Bem-vindo
              </h2>
              <p className="text-slate-500 text-sm leading-relaxed">Estamos prontos para o ouvir e orar contigo. Escolha uma das opções:</p>
            </div>

            <div className="grid grid-cols-1 gap-3">
              <button onClick={() => { setView('prayer'); window.scrollTo(0,0); }} className="w-full bg-white p-5 rounded-2xl shadow-md flex items-center justify-between border border-transparent hover:border-[#cfa855] transition-all group">
                <div className="flex items-center gap-4">
                  <div className="bg-red-50 p-3 rounded-xl text-red-500 group-hover:scale-110 transition-transform"><Heart fill="currentColor" size={24} /></div>
                  <div className="text-left"><h3 className="font-bold text-slate-800">Pedido de Oração</h3><p className="text-[10px] text-slate-500 uppercase font-semibold">Partilhe o seu fardo</p></div>
                </div>
                <ChevronRight className="text-slate-300" />
              </button>
              <button onClick={() => { setView('visit'); window.scrollTo(0,0); }} className="w-full bg-white p-5 rounded-2xl shadow-md flex items-center justify-between border border-transparent hover:border-[#cfa855] transition-all group">
                <div className="flex items-center gap-4">
                  <div className="bg-blue-50 p-3 rounded-xl text-blue-500 group-hover:scale-110 transition-transform"><Home size={24} /></div>
                  <div className="text-left"><h3 className="font-bold text-slate-800">Solicitar Visita</h3><p className="text-[10px] text-slate-500 uppercase font-semibold">Receba apoio pastoral</p></div>
                </div>
                <ChevronRight className="text-slate-300" />
              </button>
              <button onClick={() => { setView('testimonies'); window.scrollTo(0,0); }} className="w-full bg-white p-5 rounded-2xl shadow-md flex items-center justify-between border border-transparent hover:border-[#cfa855] transition-all group">
                <div className="flex items-center gap-4">
                  <div className="bg-amber-50 p-3 rounded-xl text-amber-600 group-hover:scale-110 transition-transform"><Quote size={24} /></div>
                  <div className="text-left"><h3 className="font-bold text-slate-800">Testemunhos</h3><p className="text-[10px] text-slate-500 uppercase font-semibold">Veja vitórias de fé</p></div>
                </div>
                <ChevronRight className="text-slate-300" />
              </button>
            </div>

            <button onClick={() => setShowSchedule(true)} className="w-full bg-[#051c38] p-5 rounded-2xl shadow-lg border border-[#cfa855]/30 flex items-center justify-between group overflow-hidden relative mt-6">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
              <div className="flex items-center gap-4 z-10">
                <div className="bg-[#cfa855] p-3 rounded-xl text-[#051c38]"><Calendar size={24} /></div>
                <div className="text-left text-white"><h3 className="font-bold">Horários de Culto</h3><p className="text-[10px] opacity-70 uppercase tracking-wider">Saiba quando nos visitar</p></div>
              </div>
              <Info className="text-[#cfa855] z-10" size={20} />
            </button>

            <div className="bg-white p-4 rounded-3xl shadow-xl border border-slate-100 overflow-hidden">
               <h3 className="text-sm font-bold text-[#051c38] mb-3 flex items-center gap-2 uppercase tracking-widest px-2"><MapPin size={16} className="text-[#cfa855]" /> Localização</h3>
               <div className="rounded-2xl overflow-hidden border border-slate-50 h-[220px] w-full bg-slate-50 relative">
                  <iframe src="https://www.google.com/maps/embed?pb=!1m14!1m12!1m3!1d266.352304462434!2d-43.33688119999806!3d-22.822559745632812!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!5e1!3m2!1spt-BR!2sbr!4v1766371878086!5m2!1spt-BR!2sbr" width="100%" height="100%" style={{ border: 0 }} allowFullScreen="" loading="lazy"></iframe>
               </div>
               <div className="mt-4 text-center pb-2">
                  <a href="https://maps.app.goo.gl/7qi7anN314nEYmVg7" target="_blank" rel="noopener noreferrer" className="text-[10px] font-black text-[#cfa855] flex items-center justify-center gap-2 uppercase tracking-tighter">Clique aqui e chegue até nós <ExternalLink size={10} /></a>
               </div>
            </div>

            <footer className="mt-8 pt-8 pb-12 border-t border-slate-200">
               <div className="flex flex-col items-center gap-4">
                  <div className="w-full flex justify-between items-end border-l-4 border-[#cfa855] pl-4 py-1">
                    <div className="text-left">
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-1">Assinatura Pastoral</p>
                      <p className="text-sm font-black text-[#051c38] italic">Pr. Presidente Cláudio Araújo</p>
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

        {view === 'prayer' && (
          <div className="bg-white p-7 rounded-3xl shadow-2xl animate-slide-up border border-slate-100 text-left">
            <div className="flex items-center gap-2 mb-8">
              <button onClick={() => setView('home')} className="p-2 -ml-2 text-slate-400"><X size={20} /></button>
              <h2 className="text-xl font-bold text-[#051c38]">Pedido de Oração</h2>
            </div>
            <div className="space-y-5">
              <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <input type="checkbox" id="anon-p" checked={formData.isAnonymous} onChange={(e) => setFormData({...formData, isAnonymous: e.target.checked})} className="w-5 h-5 accent-[#cfa855] rounded-lg" />
                <label htmlFor="anon-p" className="text-sm font-bold text-slate-600 cursor-pointer">Enviar de forma Anônima</label>
              </div>
              {!formData.isAnonymous && (
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase ml-2">Seu Nome</label>
                  <input type="text" placeholder="Nome completo" className="w-full p-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-[#cfa855]" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} />
                </div>
              )}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase ml-2">Pedido</label>
                <textarea placeholder="O que vai no seu coração?" rows="5" className="w-full p-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-[#cfa855]" value={formData.message} onChange={(e) => setFormData({...formData, message: e.target.value})}></textarea>
              </div>
              <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 space-y-4">
                <div className="flex items-center gap-3">
                  <input type="checkbox" id="want-contact" checked={formData.wantContact} onChange={(e) => setFormData({...formData, wantContact: e.target.checked})} className="w-5 h-5 accent-[#cfa855] rounded-lg" />
                  <label htmlFor="want-contact" className="text-sm font-bold text-slate-600 cursor-pointer">Gostaria que a igreja entre em contato?</label>
                </div>
                {formData.wantContact && (
                  <input type="tel" placeholder="(21) 98765-4321" className="w-full p-4 bg-white border border-slate-100 rounded-xl focus:ring-2 focus:ring-[#cfa855] font-bold" value={formData.contact} onChange={handleWhatsAppChange} />
                )}
              </div>
              <p className="text-[9px] text-slate-400 italic px-2">Nota: Seus dados serão tratados com sigilo conforme nossa Política de Privacidade baseada na LGPD.</p>
              <button onClick={() => handleSubmitRequest('prayer')} className="w-full bg-[#051c38] text-white p-4 rounded-2xl font-bold flex items-center justify-center gap-3 shadow-xl active:scale-95 transition-all">
                <Send size={18} /> Enviar Pedido
              </button>
            </div>
          </div>
        )}

        {view === 'testimonies' && (
          <div className="space-y-4 animate-fade-in text-left">
            <div className="flex items-center justify-between mb-6 px-2">
              <h2 className="text-2xl font-bold text-[#051c38]">Vitórias</h2>
              <button onClick={() => { setView('add-testimony'); window.scrollTo(0,0); }} className="bg-[#cfa855] text-white px-5 py-2.5 rounded-full text-xs font-black shadow-lg flex items-center gap-2 uppercase active:scale-95 transition-all"><Plus size={16} /> Contar Vitória</button>
            </div>
            {allRequests.filter(r => r.type === 'testimony').map(t => (
              <div key={t.id} className="bg-white p-6 rounded-3xl shadow-md border border-slate-50 mb-4 transition-all hover:shadow-lg relative">
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-black text-[#051c38] uppercase text-xs tracking-widest flex-1 pr-12">{safeRender(t.title)}</h4>
                  <button onClick={() => handleLike(t.id)} className="flex flex-col items-center gap-1 active:scale-125 transition-all"><div className="p-2 bg-pink-50 rounded-full text-pink-500"><Heart size={16} fill={t.likes > 0 ? "currentColor" : "none"} /></div><span className="text-[10px] font-black text-pink-500">{t.likes || 0}</span></button>
                </div>
                <p className="text-slate-700 italic text-sm leading-relaxed mb-6">"{safeRender(t.message)}"</p>
                <div className="flex items-center gap-3"><div className="w-8 h-8 bg-[#051c38] text-white rounded-full flex items-center justify-center font-black text-[10px] uppercase">{t.name ? t.name[0] : 'A'}</div><span className="font-black text-[10px] text-slate-500 uppercase tracking-widest">{t.isAnonymous ? 'Anônimo' : safeRender(t.name)}</span></div>
              </div>
            ))}
          </div>
        )}

        {view === 'add-testimony' && (
          <div className="bg-white p-8 rounded-3xl shadow-2xl animate-slide-up border border-slate-100 text-left">
            <div className="flex items-center gap-2 mb-8">
              <button onClick={() => setView('testimonies')} className="p-2 -ml-2 text-slate-400"><X size={20} /></button>
              <h2 className="text-xl font-black text-[#051c38] uppercase">Partilhar Vitória</h2>
            </div>
            <div className="space-y-5">
              <input type="text" placeholder="Seu Nome" className="w-full p-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-[#cfa855] font-bold" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} />
              <input type="text" placeholder="Título da Vitória" className="w-full p-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-[#cfa855] font-bold" value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})} />
              <textarea placeholder="O que Deus fez na sua vida?" rows="6" className="w-full p-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-[#cfa855] font-medium leading-relaxed" value={formData.message} onChange={(e) => setFormData({...formData, message: e.target.value})}></textarea>
              <button onClick={() => handleSubmitRequest('testimony')} className="w-full bg-[#cfa855] text-white p-4 rounded-2xl font-black uppercase tracking-widest shadow-xl active:scale-95 transition-all mt-4">Publicar</button>
            </div>
          </div>
        )}

        {view === 'visit' && (
          <div className="bg-white p-7 rounded-3xl shadow-2xl animate-slide-up border border-slate-100 text-left">
            <div className="flex items-center gap-2 mb-8">
              <button onClick={() => setView('home')} className="p-2 -ml-2 text-slate-400"><X size={20} /></button>
              <h2 className="text-xl font-bold text-[#051c38]">Agendar Visita</h2>
            </div>
            <div className="space-y-5">
              <input type="text" placeholder="Nome Completo" className="w-full p-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-[#cfa855] font-medium" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} />
              <input type="tel" placeholder="WhatsApp (21) 98765-4321" className="w-full p-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-[#cfa855] font-medium" value={formData.contact} onChange={handleWhatsAppChange} />
              <input type="text" placeholder="Endereço (Rua, nº, Bairro)" className="w-full p-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-[#cfa855] font-medium" value={formData.address} onChange={(e) => setFormData({...formData, address: e.target.value})} />
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-500 uppercase ml-2">Dia sugerido</label>
                <div className="flex flex-wrap gap-2">
                  {['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab', 'Dom'].map(day => (
                    <button key={day} onClick={() => handleDayToggle(day)} className={`px-4 py-2 rounded-xl text-xs font-bold border ${formData.preferredDays.includes(day) ? 'bg-[#cfa855] text-white border-transparent' : 'bg-white text-slate-400 border-slate-100'}`}>{day}</button>
                  ))}
                </div>
              </div>
              <input type="text" placeholder="Horário sugerido" className="w-full p-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-[#cfa855] font-medium" value={formData.timeSlot} onChange={(e) => setFormData({...formData, timeSlot: e.target.value})} />
              <button onClick={() => handleSubmitRequest('visit')} className="w-full bg-[#cfa855] text-white p-4 rounded-2xl font-bold active:scale-95 transition-all mt-4 uppercase text-xs tracking-widest shadow-xl">Agendar</button>
            </div>
          </div>
        )}

        {view === 'login' && (
          <div className="bg-white p-8 rounded-3xl shadow-2xl text-center space-y-8 animate-fade-in mt-10">
            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto text-slate-300 border border-slate-100 shadow-inner"><Lock size={40} /></div>
            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-[#051c38]">Área Restrita</h2>
              <p className="text-sm text-slate-400 font-medium">Introduza o PIN de acesso.</p>
            </div>
            <input type="password" placeholder="••••" maxLength={4} className="text-center text-4xl tracking-[1em] w-full p-5 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-[#cfa855] shadow-inner font-mono" value={adminPin} onChange={(e) => setAdminPin(e.target.value)} />
            <div className="flex gap-4">
              <button onClick={() => setView('home')} className="flex-1 p-4 bg-slate-50 text-slate-500 rounded-2xl font-bold">Voltar</button>
              <button onClick={checkAdmin} className="flex-1 p-4 bg-[#051c38] text-white rounded-2xl font-bold active:scale-95 transition-all">Entrar</button>
            </div>
          </div>
        )}

        {view === 'admin' && isAdmin && (
          <div className="space-y-5 animate-fade-in text-left">
            <div className="flex items-center justify-between bg-white p-5 rounded-3xl shadow-md border border-slate-100">
              <h2 className="font-bold text-sm text-[#051c38] uppercase tracking-wider">Gestão Pastoral</h2>
              <button onClick={() => setView('home')} className="p-2 text-red-500 hover:bg-red-50 rounded-full"><X size={20} /></button>
            </div>
            <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
              {['all', 'prayer', 'visit', 'testimony'].map(cat => (
                <button key={cat} onClick={() => setFilterType(cat)} className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${filterType === cat ? 'bg-[#051c38] text-white shadow-lg' : 'bg-white text-slate-400 border border-slate-100'}`}>{cat === 'all' ? 'Todos' : cat === 'prayer' ? 'Orações' : cat === 'visit' ? 'Visitas' : 'Vitórias'}</button>
              ))}
            </div>
            <div className="space-y-4">
              {allRequests.filter(r => filterType === 'all' || r.type === filterType).map(req => (
                <div key={req.id} className={`bg-white rounded-3xl p-6 border-l-8 shadow-md relative transition-all ${req.status === 'completed' ? 'border-green-400' : 'border-red-400'}`}>
                  <div className="absolute top-4 right-4 flex gap-2"><button onClick={() => handleDelete(req.id)} className="text-slate-300 hover:text-red-500"><Trash2 size={16} /></button></div>
                  <div className="mb-4"><h4 className="font-black text-slate-800 text-lg">{req.isAnonymous ? 'Anônimo' : safeRender(req.name)}</h4></div>
                  {req.contact && <p className="text-xs font-bold text-green-600 mb-2 flex items-center gap-1"><Phone size={12} /> {safeRender(req.contact)}</p>}
                  <p className="text-sm text-slate-600 italic mb-4">"{safeRender(req.message)}"</p>
                  <button onClick={() => handleUpdateStatus(req.id, 'completed')} className="w-full py-2 bg-[#051c38] text-white rounded-xl text-[10px] font-black uppercase">Finalizar</button>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      <nav className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-lg border-t border-slate-100 px-6 py-4 flex justify-around items-center z-40 shadow-[0_-10px_30px_-10px_rgba(0,0,0,0.1)]">
        <button onClick={() => { setView('home'); window.scrollTo(0,0); }} className={`flex flex-col items-center gap-1.5 ${view === 'home' ? 'text-[#cfa855] scale-110' : 'text-slate-400'}`}><Home size={24} /><span className="text-[9px] font-bold uppercase tracking-widest">Início</span></button>
        <button onClick={handleShare} className="flex flex-col items-center gap-1.5 text-slate-400 active:scale-110"><div className="bg-[#cfa855]/10 p-2 rounded-xl text-[#cfa855]"><Share2 size={24} /></div><span className="text-[9px] font-bold uppercase tracking-widest">Partilhar</span></button>
        <button onClick={() => { setView('testimonies'); window.scrollTo(0,0); }} className={`flex flex-col items-center gap-1.5 ${view === 'testimonies' || view === 'add-testimony' ? 'text-amber-500 scale-110' : 'text-slate-400'}`}><Quote size={24} /><span className="text-[9px] font-bold uppercase tracking-widest">Vitórias</span></button>
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

