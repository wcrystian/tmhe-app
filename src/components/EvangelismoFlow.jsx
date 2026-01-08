import React, { useState } from 'react';
import { 
  Heart, 
  Flame, 
  Sun, 
  X, 
  ArrowRight, 
  ChevronLeft, 
  BookOpen 
} from 'lucide-react';

/**
 * Componente isolado: FluxoInterativoEsperanca
 * Pode ser inserido em qualquer página React que utilize Tailwind CSS.
 */

function CrossIcon({ className }) {
  return (
    <svg className={className} width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2v20M8 8h8" />
    </svg>
  );
}

const GOSPEL_STEPS = [
  { 
    title: "Deus te Ama", 
    text: "Você não é um acidente. Deus te criou com propósito e te ama incondicionalmente, independente do seu passado.", 
    verse: "Porque Deus amou o mundo de tal maneira que deu o seu Filho unigênito...",
    ref: "João 3:16",
    icon: <Heart size={48} className="text-red-500" fill="currentColor" /> 
  },
  { 
    title: "O Problema", 
    text: "Nossas escolhas e falhas nos afastaram de Deus, criando um abismo que nenhuma religião ou esforço humano pode cruzar.", 
    verse: "Pois todos pecaram e carecem da glória de Deus.",
    ref: "Romanos 3:23",
    icon: <Flame size={48} className="text-orange-500" /> 
  },
  { 
    title: "A Solução", 
    text: "Jesus Cristo veio para ser a ponte. Ele morreu em seu lugar para que você pudesse ter vida e paz com o Pai.", 
    verse: "Mas Deus prova o seu próprio amor para conosco pelo fato de ter Cristo morrido por nós, sendo nós ainda pecadores.",
    ref: "Romanos 5:8",
    icon: <CrossIcon className="text-blue-500" /> 
  },
  { 
    title: "Sua Escolha", 
    text: "Deus não força ninguém. Ele está batendo à porta do seu coração agora. Você aceita o convite d'Ele?", 
    verse: "Eis que estou à porta e bato; se alguém ouvir a minha voz e abrir a porta, entrarei em sua casa...",
    ref: "Apocalipse 3:20",
    icon: <Sun size={48} className="text-amber-500" /> 
  }
];

export default function FluxoInterativoEsperanca({ isOpen, onClose, onFinish }) {
  const [step, setStep] = useState(0);

  if (!isOpen) return null;

  const current = GOSPEL_STEPS[step];

  return (
    <div className="fixed inset-0 z-[999] bg-[#051c38] text-white flex flex-col animate-in fade-in duration-500">
      {/* Botão Fechar */}
      <button 
        onClick={onClose} 
        className="absolute top-8 right-8 text-white/30 hover:text-white transition-colors"
      >
        <X size={32} />
      </button>

      <div className="flex-1 flex flex-col justify-center items-center text-center p-8">
        {/* Ícone com Animação */}
        <div className="w-32 h-32 bg-white/5 rounded-full flex items-center justify-center mb-8 animate-pulse">
           {current.icon}
        </div>

        {/* Conteúdo de Texto */}
        <div className="max-w-md space-y-6">
          <div className="space-y-2">
            <h2 className="text-4xl font-black tracking-tight">{current.title}</h2>
            <p className="text-lg text-white/80 leading-relaxed">{current.text}</p>
          </div>

          {/* Cartão do Versículo */}
          <div className="bg-white/10 p-6 rounded-3xl border border-white/10 backdrop-blur-sm text-left relative overflow-hidden group">
            <div className="absolute -right-4 -top-4 opacity-5 group-hover:opacity-10 transition-opacity">
              <BookOpen size={80} />
            </div>
            <p className="text-sm italic leading-relaxed text-white/90 mb-3">
              "{current.verse}"
            </p>
            <span className="text-[10px] font-black uppercase tracking-widest text-[#cfa855]">
              — {current.ref}
            </span>
          </div>
        </div>
      </div>

      {/* Controles de Navegação */}
      <div className="p-8 max-w-md mx-auto w-full space-y-6">
        {/* Indicadores de Progresso */}
        <div className="flex gap-2 justify-center">
           {GOSPEL_STEPS.map((_, i) => (
             <div 
               key={i} 
               className={`h-1.5 rounded-full transition-all duration-300 ${i === step ? 'w-10 bg-[#cfa855]' : 'w-2 bg-white/20'}`} 
             />
           ))}
        </div>

        <div className="flex gap-3">
          {step > 0 && (
            <button 
              onClick={() => setStep(s => s - 1)}
              className="flex-1 py-5 bg-white/5 hover:bg-white/10 text-white rounded-[2rem] font-bold text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2 border border-white/10"
            >
              <ChevronLeft size={16} /> Voltar
            </button>
          )}

          <button 
            onClick={() => {
              if (step < GOSPEL_STEPS.length - 1) {
                setStep(s => s + 1);
              } else {
                onFinish ? onFinish() : onClose();
              }
            }}
            className="flex-[2] bg-[#cfa855] hover:bg-[#b8954a] text-[#051c38] py-5 rounded-[2rem] font-black uppercase tracking-widest text-xs shadow-xl shadow-[#cfa855]/20 transition-all flex items-center justify-center gap-2 active:scale-95"
          >
            {step < GOSPEL_STEPS.length - 1 ? 'Continuar' : 'Entregar minha vida'}
            <ArrowRight size={16} />
          </button>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
        .animate-in { animation: fade-in 0.5s ease-out; }
      `}} />
    </div>
  );
}