import React, { useState, useEffect } from 'react';
import { 
  Heart, 
  Flame, 
  Sun, 
  X, 
  ArrowRight, 
  ChevronLeft, 
  BookOpen,
  Church,
  Sparkles,
  Send
} from 'lucide-react';

// --- UTILITÁRIOS DE UI ---

function CrossIcon({ className }) {
  return (
    <svg className={className} width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2v20M8 8h8" />
    </svg>
  );
}

// --- DADOS DO FLUXO (Definidos após os ícones) ---
const GOSPEL_STEPS = [
  { 
    title: "Deus te Ama", 
    text: "Não és um acidente. Deus criou-te com um propósito e ama-te incondicionalmente, independentemente do teu passado.", 
    verse: "Porque Deus amou o mundo de tal maneira que deu o seu Filho unigênito...",
    ref: "João 3:16",
    icon: <Heart size={48} className="text-red-500" fill="currentColor" /> 
  },
  { 
    title: "O Problema", 
    text: "As nossas escolhas e falhas afastaram-nos de Deus, criando um abismo que nenhum esforço humano pode cruzar.", 
    verse: "Pois todos pecaram e carecem da glória de Deus.",
    ref: "Romanos 3:23",
    icon: <Flame size={48} className="text-orange-500" /> 
  },
  { 
    title: "A Solução", 
    text: "Jesus Cristo veio para ser a ponte. Ele morreu no teu lugar para que pudesses ter vida e paz com o Pai.", 
    verse: "Mas Deus prova o seu próprio amor para connosco pelo facto de ter Cristo morrido por nós, sendo nós ainda pecadores.",
    ref: "Romanos 5:8",
    icon: <CrossIcon className="text-blue-500" /> 
  },
  { 
    title: "A Tua Escolha", 
    text: "Deus não força ninguém. Ele está a bater à porta do teu coração agora. Aceitas o convite d'Ele?", 
    verse: "Eis que estou à porta e bato; se alguém ouvir a minha voz e abrir a porta, entrarei em sua casa...",
    ref: "Apocalipse 3:20",
    icon: <Sun size={48} className="text-amber-500" /> 
  }
];

// --- COMPONENTE DO FLUXO ---
const FluxoInterativoEsperanca = ({ isOpen, onClose, onFinish }) => {
  const [step, setStep] = useState(0);

  if (!isOpen) return null;

  const current = GOSPEL_STEPS[step];

  return (
    <div className="fixed inset-0 z-[100] bg-[#051c38] text-white flex flex-col animate-fade-in">
      <button onClick={onClose} className="absolute top-6 right-6 text-white/30 hover:text-white transition-colors">
        <X size={32} />
      </button>

      <div className="flex-1 flex flex-col justify-center items-center text-center p-8">
        <div className="w-28 h-28 bg-white/5 rounded-full flex items-center justify-center mb-8 animate-pulse">
           {current.icon}
        </div>

        <div className="max-w-md space-y-6">
          <div className="space-y-2">
            <h2 className="text-3xl font-black tracking-tight">{current.title}</h2>
            <p className="text-base text-white/80 leading-relaxed">{current.text}</p>
          </div>

          <div className="bg-white/10 p-5 rounded-3xl border border-white/10 backdrop-blur-sm text-left relative overflow-hidden">
            <p className="text-sm italic leading-relaxed text-white/90 mb-2">"{current.verse}"</p>
            <span className="text-[10px] font-black uppercase tracking-widest text-[#cfa855]">— {current.ref}</span>
          </div>
        </div>
      </div>

      <div className="p-8 max-w-md mx-auto w-full space-y-6">
        <div className="flex gap-2 justify-center">
           {GOSPEL_STEPS.map((_, i) => (
             <div key={i} className={`h-1.5 rounded-full transition-all duration-300 ${i === step ? 'w-10 bg-[#cfa855]' : 'w-2 bg-white/20'}`} />
           ))}
        </div>

        <div className="flex gap-3">
          {step > 0 && (
            <button onClick={() => setStep(s => s - 1)} className="flex-1 py-4 bg-white/5 text-white rounded-2xl font-bold text-xs uppercase border border-white/10 flex items-center justify-center gap-2">
              <ChevronLeft size={16} /> Voltar
            </button>
          )}

          <button 
            onClick={() => {
              if (step < GOSPEL_STEPS.length - 1) setStep(s => s + 1);
              else onFinish();
            }}
            className="flex-[2] bg-[#cfa855] text-[#051c38] py-4 rounded-2xl font-black uppercase text-xs flex items-center justify-center gap-2 active:scale-95 transition-all shadow-lg"
          >
            {step < GOSPEL_STEPS.length - 1 ? 'Continuar' : 'Entregar a minha vida'}
            <ArrowRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};

// --- COMPONENTE PRINCIPAL (APP) ---
export default function App() {
  const [user, setUser] = useState(null);
  const [showFlow, setShowFlow] = useState(false);
  const [isFinished, setIsFinished] = useState(false);

  useEffect(() => {
    const initAuth = async () => {
      try {
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
          await signInWithCustomToken(auth, __initial_auth_token);
        } else {
          await signInAnonymously(auth);
        }
      } catch (err) { console.error("Auth Error:", err); }
    };
    initAuth();
    const unsubscribe = onAuthStateChanged(auth, setUser);
    return () => unsubscribe();
  }, []);

  const handleFinish = async () => {
    setShowFlow(false);
    setIsFinished(true);
    if (user) {
      try {
        await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'conversions'), {
          userId: user.uid,
          timestamp: serverTimestamp(),
          type: 'gospel_flow_complete'
        });
      } catch (e) { console.error("Erro ao guardar conversão:", e); }
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans flex flex-col items-center justify-center p-6 text-center">
      <div className="absolute top-0 left-0 p-4 opacity-20">
         <div className="text-[10px] font-mono text-slate-400">ID: {appId}</div>
      </div>
      
      {!showFlow && !isFinished && (
        <div className="max-w-sm space-y-8 animate-fade-in">
          <div className="flex flex-col items-center gap-4">
            <div className="bg-[#051c38] p-5 rounded-[2.5rem] shadow-xl text-[#cfa855]">
              <Church size={48} />
            </div>
            <h1 className="text-3xl font-black text-[#051c38] tracking-tighter">TMHE</h1>
            <p className="text-slate-500 font-medium">Templo Missionário Há Esperança</p>
          </div>

          <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 space-y-6">
            <h2 className="text-xl font-bold text-slate-800 text-left">Existe um caminho para a paz.</h2>
            <p className="text-sm text-slate-500 leading-relaxed text-left">
              Criámos esta pequena jornada para te mostrar que, não importa como te sentes, existe esperança real para ti hoje.
            </p>
            <button 
              onClick={() => setShowFlow(true)}
              className="w-full bg-[#cfa855] text-[#051c38] py-4 rounded-2xl font-black uppercase text-xs tracking-widest flex items-center justify-center gap-2 shadow-lg hover:bg-[#b8954a] transition-all"
            >
              Começar Jornada <Sparkles size={16} />
            </button>
          </div>
        </div>
      )}

      {isFinished && (
        <div className="max-w-sm space-y-6 animate-bounce-in">
           <div className="bg-green-100 text-green-600 p-6 rounded-full inline-block">
              <Heart size={48} fill="currentColor" />
           </div>
           <h2 className="text-2xl font-black text-[#051c38]">Deus abençoe a tua decisão!</h2>
           <p className="text-slate-500 text-sm leading-relaxed px-4">
              A tua jornada está apenas a começar. Gostarias de falar com um pastor ou pedir uma oração específica?
           </p>
           <div className="space-y-3">
              <button className="w-full bg-[#051c38] text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 shadow-md">
                <Send size={18} /> Pedir Oração Agora
              </button>
              <button onClick={() => setIsFinished(false)} className="w-full py-4 text-slate-400 font-bold text-xs uppercase">
                Voltar ao Início
              </button>
           </div>
        </div>
      )}

      {/* Chamada do Componente do Fluxo */}
      <FluxoInterativoEsperanca 
        isOpen={showFlow} 
        onClose={() => setShowFlow(false)} 
        onFinish={handleFinish} 
      />

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes fade-in { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes bounce-in { 0% { transform: scale(0.9); opacity: 0; } 100% { transform: scale(1); opacity: 1; } }
        .animate-fade-in { animation: fade-in 0.6s ease-out forwards; }
        .animate-bounce-in { animation: bounce-in 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275); }
        * { -webkit-tap-highlight-color: transparent; }
      `}} />
    </div>
  );
}
