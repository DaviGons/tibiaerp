import { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { parseHuntLog, formatGold } from '../utils/parseHuntLog'
import { useHunts } from '../hooks/useHunts'
import {
  ScrollText,
  ClipboardPaste,
  MapPin,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Trash2,
  ArrowRight,
  Swords,
  Heart,
  Shield,
  Package,
  ShoppingCart,
  Scale,
  Clock,
  User,
} from 'lucide-react'

export default function HuntLog() {
  const [rawLog, setRawLog] = useState('')
  const [location, setLocation] = useState('')
  const [huntDate, setHuntDate] = useState('')
  const [parsedData, setParsedData] = useState(null)
  const [parseError, setParseError] = useState('')
  const [saveSuccess, setSaveSuccess] = useState(false)
  const { createHunt, loading } = useHunts()
  const navigate = useNavigate()

  const handleParse = useCallback(() => {
    setParseError('')
    setSaveSuccess(false)

    if (!rawLog.trim()) {
      setParseError('Cole o log do Hunt Analyzer no campo acima.')
      setParsedData(null)
      return
    }

    const result = parseHuntLog(rawLog)
    if (!result) {
      setParseError(
        'Não foi possível interpretar o log. Verifique se você colou o texto completo do Party Hunt Analyzer.'
      )
      setParsedData(null)
      return
    }

    setParsedData(result)
  }, [rawLog])

  const handleClear = () => {
    setRawLog('')
    setLocation('')
    setHuntDate('')
    setParsedData(null)
    setParseError('')
    setSaveSuccess(false)
  }

  const handleSave = async () => {
    if (!parsedData) return

    const { data, error } = await createHunt({
      location: location || parsedData.session?.lootType || 'Unknown',
      huntDate: huntDate || new Date().toISOString(),
      totalLoot: parsedData.totals.loot,
      totalSupplies: parsedData.totals.supplies,
      balance: parsedData.totals.balance,
      rawLog,
    })

    if (error) {
      setParseError(`Erro ao salvar: ${error}`)
      return
    }

    setSaveSuccess(true)
    setTimeout(() => navigate('/'), 2000)
  }

  return (
    <div className="page-enter space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-100">Registrar Hunt</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Cole o log do Party Hunt Analyzer para registrar automaticamente
        </p>
      </div>

      {/* Success toast */}
      {saveSuccess && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-tibia-green/10 border border-tibia-green/20 animate-slide-up">
          <CheckCircle2 className="w-5 h-5 text-tibia-green flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-tibia-green">Hunt registrada com sucesso!</p>
            <p className="text-xs text-tibia-green/70 mt-0.5">Redirecionando para o dashboard...</p>
          </div>
        </div>
      )}

      {/* Input section */}
      <div className="glass-card p-6 space-y-4">
        <div className="flex items-center gap-2 mb-1">
          <ClipboardPaste className="w-4 h-4 text-tibia-gold" />
          <h2 className="text-sm font-semibold text-gray-200">Log do Analyzer</h2>
        </div>

        <textarea
          id="hunt-log-input"
          value={rawLog}
          onChange={(e) => {
            setRawLog(e.target.value)
            setParsedData(null)
            setParseError('')
            setSaveSuccess(false)
          }}
          placeholder={`Cole aqui o texto copiado do Party Hunt Analyzer...\n\nExemplo:\nSession data: From 2026-08-30, 21:00:00 to 2026-08-30, 22:30:00\nSession: 01:30h\nLoot Type: Market\nLoot: 1,500,500\nSupplies: 450,000\nBalance: 1,050,500`}
          rows={10}
          className="input-field font-mono text-sm resize-y min-h-[200px] leading-relaxed"
        />

        {/* Metadata fields */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="location" className="label-text flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5" />
              Local da Hunt
            </label>
            <input
              id="location"
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Ex: Roshamuul, Ferumbras Ascension..."
              className="input-field"
            />
          </div>
          <div>
            <label htmlFor="hunt-date" className="label-text flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" />
              Data da Hunt
            </label>
            <input
              id="hunt-date"
              type="datetime-local"
              value={huntDate}
              onChange={(e) => setHuntDate(e.target.value)}
              className="input-field"
            />
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-3 pt-2">
          <button
            onClick={handleParse}
            disabled={!rawLog.trim()}
            className="btn-primary flex items-center gap-2"
          >
            <ScrollText className="w-4 h-4" />
            Analisar Log
          </button>
          <button
            onClick={handleClear}
            className="btn-secondary flex items-center gap-2 text-sm"
          >
            <Trash2 className="w-4 h-4" />
            Limpar
          </button>
        </div>

        {/* Parse error */}
        {parseError && (
          <div className="flex items-start gap-2 p-3 rounded-lg bg-tibia-red/10 border border-tibia-red/20 animate-fade-in">
            <AlertCircle className="w-4 h-4 text-tibia-red flex-shrink-0 mt-0.5" />
            <p className="text-sm text-tibia-red">{parseError}</p>
          </div>
        )}
      </div>

      {/* Parsed preview */}
      {parsedData && (
        <div className="space-y-4 animate-slide-up">
          {/* Session info */}
          <div className="glass-card p-5">
            <h3 className="text-sm font-semibold text-gray-200 mb-3 flex items-center gap-2">
              <Clock className="w-4 h-4 text-tibia-gold" />
              Dados da Sessão
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
              {parsedData.session.duration && (
                <div className="bg-tibia-deeper rounded-lg p-3">
                  <p className="stat-label">Duração</p>
                  <p className="text-gray-200 font-medium mt-0.5">{parsedData.session.duration}</p>
                </div>
              )}
              {parsedData.session.lootType && (
                <div className="bg-tibia-deeper rounded-lg p-3">
                  <p className="stat-label">Tipo de Loot</p>
                  <p className="text-gray-200 font-medium mt-0.5">{parsedData.session.lootType}</p>
                </div>
              )}
              {parsedData.session.from && (
                <div className="bg-tibia-deeper rounded-lg p-3 col-span-2">
                  <p className="stat-label">Período</p>
                  <p className="text-gray-200 font-medium mt-0.5 text-xs">
                    {parsedData.session.from} → {parsedData.session.to}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Totals */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <TotalCard
              icon={Package}
              label="Total Loot"
              value={parsedData.totals.loot}
              color="text-tibia-gold"
              bg="bg-tibia-gold/10"
            />
            <TotalCard
              icon={ShoppingCart}
              label="Total Supplies"
              value={parsedData.totals.supplies}
              color="text-tibia-purple"
              bg="bg-tibia-purple/10"
            />
            <TotalCard
              icon={Scale}
              label="Balance"
              value={parsedData.totals.balance}
              color={parsedData.totals.balance >= 0 ? 'text-tibia-green' : 'text-tibia-red'}
              bg={parsedData.totals.balance >= 0 ? 'bg-tibia-green/10' : 'bg-tibia-red/10'}
            />
          </div>

          {/* Players */}
          {parsedData.players.length > 0 && (
            <div className="glass-card overflow-hidden">
              <div className="flex items-center gap-2 p-5 border-b border-tibia-border/50">
                <User className="w-4 h-4 text-tibia-gold" />
                <h3 className="text-sm font-semibold text-gray-200">
                  Jogadores ({parsedData.players.length})
                </h3>
              </div>
              <div className="divide-y divide-tibia-border/30">
                {parsedData.players.map((player, idx) => (
                  <div key={idx} className="p-4 hover:bg-tibia-card-hover/50 transition-colors">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-7 h-7 rounded-lg bg-tibia-gold/10 flex items-center justify-center">
                        <User className="w-3.5 h-3.5 text-tibia-gold" />
                      </div>
                      <span className="text-sm font-semibold text-gray-100">{player.name}</span>
                      <span className="badge bg-tibia-card border border-tibia-border text-xs text-gray-400">
                        {player.vocation}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs">
                      <PlayerStat icon={Package} label="Loot" value={player.loot} />
                      <PlayerStat icon={ShoppingCart} label="Supplies" value={player.supplies} />
                      <PlayerStat icon={Scale} label="Balance" value={player.balance} isBalance />
                      <PlayerStat icon={Swords} label="Damage" value={player.damage} />
                      <PlayerStat icon={Heart} label="Healing" value={player.healing} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Save button */}
          <div className="flex justify-end">
            <button
              onClick={handleSave}
              disabled={loading || saveSuccess}
              className="btn-primary flex items-center gap-2 text-base px-8 py-3"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Salvando...
                </>
              ) : saveSuccess ? (
                <>
                  <CheckCircle2 className="w-5 h-5" />
                  Salvo!
                </>
              ) : (
                <>
                  Salvar Hunt
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function TotalCard({ icon: Icon, label, value, color, bg }) {
  return (
    <div className="glass-card p-4 flex items-center gap-3">
      <div className={`w-10 h-10 rounded-xl ${bg} flex items-center justify-center`}>
        <Icon className={`w-5 h-5 ${color}`} />
      </div>
      <div>
        <p className="stat-label">{label}</p>
        <p className={`text-lg font-bold ${color}`}>
          {formatGold(value)}<span className="text-xs font-normal text-gray-500 ml-1">gp</span>
        </p>
      </div>
    </div>
  )
}

function PlayerStat({ icon: Icon, label, value, isBalance }) {
  const color = isBalance
    ? value >= 0 ? 'text-tibia-green' : 'text-tibia-red'
    : 'text-gray-300'

  return (
    <div className="bg-tibia-deeper rounded-md p-2">
      <div className="flex items-center gap-1 text-gray-500 mb-0.5">
        <Icon className="w-3 h-3" />
        <span>{label}</span>
      </div>
      <p className={`font-semibold text-xs ${color}`}>{formatGold(value)}</p>
    </div>
  )
}
