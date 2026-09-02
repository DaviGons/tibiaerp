import { useHuntTimers } from '../hooks/useHuntTimers'
import {
  Wrench,
  Timer,
  Play,
  Square,
  Clock,
  Sparkles,
  Construction,
  Plus,
  X,
  BellOff,
  Tag,
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
    timers,
    addTimer,
    removeTimer,
    updateField,
    startTimer,
    cancelTimer,
    stopAlarm,
    getFormattedTime,
    getProgress,
  } = useHuntTimers()

  return (
    <div className="glass-card overflow-hidden flex flex-col md:col-span-2 xl:col-span-2">
      {/* Card header */}
      <div className="flex items-center justify-between p-5 border-b border-tibia-border/50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-tibia-gold/15 flex items-center justify-center">
            <Timer className="w-5 h-5 text-tibia-gold" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-gray-200">
              Temporizador de Caçada
            </h2>
            <p className="text-xs text-gray-500">
              Timers independentes para Plasma, Ring, Poções e mais
            </p>
          </div>
        </div>

        <button
          onClick={() => addTimer()}
          className="btn-secondary !px-3 !py-2 flex items-center gap-1.5 text-xs"
          title="Adicionar timer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Adicionar</span>
        </button>
      </div>

      {/* Timers list */}
      <div className="divide-y divide-tibia-border/30">
        {timers.map((timer) => (
          <TimerRow
            key={timer.id}
            timer={timer}
            formattedTime={getFormattedTime(timer)}
            progress={getProgress(timer)}
            onUpdateField={(field, value) => updateField(timer.id, field, value)}
            onStart={() => startTimer(timer.id)}
            onCancel={() => cancelTimer(timer.id)}
            onStopAlarm={() => stopAlarm(timer.id)}
            onRemove={() => removeTimer(timer.id)}
            canRemove={timers.length > 1}
          />
        ))}
      </div>

      {/* Footer — quick-add hint */}
      <div className="p-3 border-t border-tibia-border/30 bg-tibia-deeper/30">
        <button
          onClick={() => addTimer()}
          className="w-full py-2 rounded-lg border border-dashed border-tibia-border/50 text-xs text-gray-500
                     hover:border-tibia-gold/30 hover:text-gray-400 transition-all duration-200
                     flex items-center justify-center gap-1.5"
        >
          <Plus className="w-3.5 h-3.5" />
          Novo timer
        </button>
      </div>
    </div>
  )
}

// ─── Individual Timer Row ─────────────────────────────────────────────────────

function TimerRow({
  timer,
  formattedTime,
  progress,
  onUpdateField,
  onStart,
  onCancel,
  onStopAlarm,
  onRemove,
  canRemove,
}) {
  const { isRunning, isFinished } = timer

  const handleSubmit = (e) => {
    e.preventDefault()
    onStart()
  }

  // ── Idle state ────────────────────────────────────────────────────────────
  if (!isRunning && !isFinished) {
    return (
      <form
        onSubmit={handleSubmit}
        className="p-4 flex flex-col sm:flex-row items-stretch sm:items-end gap-3 animate-fade-in group/row hover:bg-tibia-card-hover/30 transition-colors"
      >
        {/* Name */}
        <div className="flex-1 min-w-0">
          <label className="label-text flex items-center gap-1">
            <Tag className="w-3 h-3" />
            Nome
          </label>
          <input
            type="text"
            placeholder="Ex: Poção, Colar..."
            value={timer.name}
            onChange={(e) => onUpdateField('name', e.target.value)}
            className="input-field !py-2 text-sm"
            autoComplete="off"
          />
        </div>

        {/* Minutes */}
        <div className="w-full sm:w-28">
          <label className="label-text flex items-center gap-1">
            <Clock className="w-3 h-3" />
            Minutos
          </label>
          <input
            type="number"
            min="1"
            max="999"
            placeholder="15"
            value={timer.minutes}
            onChange={(e) => onUpdateField('minutes', e.target.value)}
            className="input-field !py-2 text-sm text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            autoComplete="off"
          />
        </div>

        {/* Preset buttons */}
        <div className="flex gap-1.5 sm:pb-0">
          {[
            { label: '15', value: '15' },
            { label: '30', value: '30' },
            { label: '60', value: '60' },
          ].map((p) => (
            <button
              key={p.value}
              type="button"
              onClick={() => onUpdateField('minutes', p.value)}
              className={`px-2.5 py-2 rounded-lg text-xs font-medium transition-all duration-200 ${
                timer.minutes === p.value
                  ? 'bg-tibia-gold/20 text-tibia-gold border border-tibia-gold/30'
                  : 'bg-tibia-deeper text-gray-500 border border-tibia-border hover:text-gray-300 hover:border-tibia-gold/20'
              }`}
            >
              {p.label}m
            </button>
          ))}
        </div>

        {/* Start */}
        <button
          type="submit"
          disabled={!timer.minutes || Number(timer.minutes) <= 0}
          className="btn-primary !px-4 !py-2 flex items-center justify-center gap-1.5 text-sm whitespace-nowrap"
        >
          <Play className="w-3.5 h-3.5" />
          Iniciar
        </button>

        {/* Remove */}
        {canRemove && (
          <button
            type="button"
            onClick={onRemove}
            className="p-2 rounded-lg text-gray-600 hover:text-tibia-red hover:bg-tibia-red/10 transition-colors self-center sm:self-end"
            title="Remover timer"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </form>
    )
  }

  // ── Running / Finished state ──────────────────────────────────────────────
  return (
    <div
      className={`p-4 animate-fade-in transition-colors ${
        isFinished ? 'bg-tibia-red/5' : 'hover:bg-tibia-card-hover/30'
      }`}
    >
      <div className="flex items-center gap-4">
        {/* Timer info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            {timer.name ? (
              <span className="text-sm font-semibold text-gray-200 truncate">
                {timer.name}
              </span>
            ) : (
              <span className="text-sm font-medium text-gray-500 italic truncate">
                Timer
              </span>
            )}
            <span className="text-[10px] text-gray-600">
              {timer.minutes} min
            </span>
          </div>

          {/* Progress bar */}
          <div className="h-1.5 bg-tibia-deeper rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-300 ease-linear ${
                isFinished
                  ? 'bg-tibia-red animate-pulse'
                  : 'bg-gradient-to-r from-tibia-gold to-tibia-gold-light'
              }`}
              style={{ width: `${Math.min(100, progress * 100)}%` }}
            />
          </div>
        </div>

        {/* Countdown */}
        <span
          className={`text-2xl font-bold tabular-nums tracking-tight transition-colors duration-300 flex-shrink-0 ${
            isFinished
              ? 'text-tibia-red animate-pulse'
              : 'text-tibia-gold-light'
          }`}
        >
          {formattedTime}
        </span>

        {/* Action button */}
        {isFinished ? (
          <button
            onClick={onStopAlarm}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold
                       bg-tibia-red/20 border border-tibia-red/40 text-tibia-red
                       hover:bg-tibia-red/30 hover:border-tibia-red/60
                       transition-all duration-200 animate-pulse whitespace-nowrap"
          >
            <BellOff className="w-4 h-4" />
            Parar Alarme
          </button>
        ) : (
          <button
            onClick={onCancel}
            className="btn-danger !px-3 !py-2 flex items-center gap-1.5 text-sm whitespace-nowrap"
          >
            <Square className="w-3.5 h-3.5" />
            Cancelar
          </button>
        )}
      </div>

      {/* Finished label */}
      {isFinished && (
        <div className="mt-2 flex items-center gap-1.5 animate-fade-in">
          <span className="inline-block w-2 h-2 rounded-full bg-tibia-red animate-pulse" />
          <span className="text-xs text-tibia-red font-medium uppercase tracking-wider">
            Tempo esgotado — alarme tocando
          </span>
        </div>
      )}
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
