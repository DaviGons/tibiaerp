import { useHuntTimer } from '../hooks/useHuntTimer'
import {
  Wrench,
  Timer,
  Play,
  Square,
  Clock,
  Sparkles,
  Construction,
} from 'lucide-react'

export default function Ferramentas() {
  return (
    <div className="page-enter space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-100 flex items-center gap-2">
          <Wrench className="w-6 h-6 text-tibia-gold" />
          Ferramentas
        </h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Utilitários para otimizar sua gameplay
        </p>
      </div>

      {/* Cards grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        <HuntTimerCard />
        <ComingSoonCard
          icon={Sparkles}
          title="Calculadora de Loot"
          description="Calcule o lucro estimado por hora baseado no loot."
        />
        <ComingSoonCard
          icon={Construction}
          title="Mais em breve"
          description="Novas ferramentas estão a caminho. Fique ligado!"
        />
      </div>
    </div>
  )
}

// ─── Hunt Timer Card ──────────────────────────────────────────────────────────

function HuntTimerCard() {
  const {
    minutes,
    setMinutes,
    isRunning,
    isFinished,
    start,
    cancel,
    formattedTime,
    progress,
  } = useHuntTimer()

  const handleSubmit = (e) => {
    e.preventDefault()
    start()
  }

  return (
    <div className="glass-card overflow-hidden flex flex-col md:col-span-2 xl:col-span-1">
      {/* Card header */}
      <div className="flex items-center gap-3 p-5 border-b border-tibia-border/50">
        <div className="w-10 h-10 rounded-xl bg-tibia-gold/15 flex items-center justify-center">
          <Timer className="w-5 h-5 text-tibia-gold" />
        </div>
        <div>
          <h2 className="text-base font-semibold text-gray-200">
            Temporizador de Caçada
          </h2>
          <p className="text-xs text-gray-500">
            Timer para Plasma, Ring e outros
          </p>
        </div>
      </div>

      {/* Timer display */}
      <div className="flex-1 p-5 flex flex-col items-center justify-center">
        {/* Circular progress ring */}
        <div className="relative w-44 h-44 mb-5">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 160 160">
            {/* Background ring */}
            <circle
              cx="80"
              cy="80"
              r="70"
              fill="none"
              stroke="currentColor"
              className="text-tibia-border/30"
              strokeWidth="6"
            />
            {/* Progress ring */}
            <circle
              cx="80"
              cy="80"
              r="70"
              fill="none"
              stroke="url(#timerGradient)"
              strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray={2 * Math.PI * 70}
              strokeDashoffset={2 * Math.PI * 70 * (1 - progress)}
              className="transition-[stroke-dashoffset] duration-500 ease-linear"
            />
            <defs>
              <linearGradient id="timerGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#f5a623" />
                <stop offset="100%" stopColor="#ffd700" />
              </linearGradient>
            </defs>
          </svg>

          {/* Center time display */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span
              className={`text-4xl font-bold tracking-tight tabular-nums transition-colors duration-300 ${
                isFinished
                  ? 'text-tibia-green animate-pulse'
                  : isRunning
                    ? 'text-tibia-gold-light'
                    : 'text-gray-400'
              }`}
            >
              {formattedTime}
            </span>
            {isRunning && (
              <span className="text-[10px] text-gray-500 uppercase tracking-widest mt-1 animate-fade-in">
                em andamento
              </span>
            )}
            {isFinished && (
              <span className="text-[10px] text-tibia-green uppercase tracking-widest mt-1 animate-fade-in">
                concluído!
              </span>
            )}
          </div>
        </div>

        {/* Input & controls */}
        {!isRunning && !isFinished ? (
          <form onSubmit={handleSubmit} className="w-full max-w-xs space-y-3 animate-fade-in">
            <div className="relative">
              <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
              <input
                id="hunt-timer-minutes"
                type="number"
                min="1"
                max="999"
                placeholder="Minutos (ex: 15)"
                value={minutes}
                onChange={(e) => setMinutes(e.target.value)}
                className="input-field pl-10 text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                autoComplete="off"
              />
            </div>
            <button
              type="submit"
              disabled={!minutes || Number(minutes) <= 0}
              className="btn-primary w-full flex items-center justify-center gap-2"
            >
              <Play className="w-4 h-4" />
              Iniciar
            </button>

            {/* Quick presets */}
            <div className="flex gap-2 justify-center pt-1">
              {[
                { label: '15 min', value: '15' },
                { label: '30 min', value: '30' },
                { label: '60 min', value: '60' },
              ].map((preset) => (
                <button
                  key={preset.value}
                  type="button"
                  onClick={() => setMinutes(preset.value)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${
                    minutes === preset.value
                      ? 'bg-tibia-gold/20 text-tibia-gold border border-tibia-gold/30'
                      : 'bg-tibia-deeper text-gray-500 border border-tibia-border hover:text-gray-300 hover:border-tibia-gold/20'
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </form>
        ) : (
          <div className="w-full max-w-xs animate-fade-in">
            <button
              onClick={() => {
                cancel()
              }}
              className={`w-full flex items-center justify-center gap-2 ${
                isFinished ? 'btn-primary' : 'btn-danger'
              }`}
            >
              <Square className="w-4 h-4" />
              {isFinished ? 'Novo Timer' : 'Cancelar'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Coming Soon Placeholder ──────────────────────────────────────────────────

function ComingSoonCard({ icon: Icon, title, description }) {
  return (
    <div className="glass-card p-5 flex flex-col items-center justify-center text-center opacity-60 min-h-[280px]">
      <div className="w-12 h-12 rounded-xl bg-tibia-card border border-tibia-border flex items-center justify-center mb-4">
        <Icon className="w-6 h-6 text-gray-500" />
      </div>
      <h3 className="text-sm font-semibold text-gray-300">{title}</h3>
      <p className="text-xs text-gray-500 mt-1 max-w-[200px]">{description}</p>
      <span className="badge bg-tibia-card border border-tibia-border text-gray-500 mt-3">
        Em breve
      </span>
    </div>
  )
}
