import { useState, useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { parseHuntLog, formatGold, parseDurationToHours } from '../utils/parseHuntLog'
import { useHunts } from '../hooks/useHunts'
import ExtraCostsSection from '../components/ExtraCostsSection'
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
  Layers,
  Sparkles,
} from 'lucide-react'

export default function HuntLog() {
  const [rawLog, setRawLog] = useState('')
  const [location, setLocation] = useState('')
  const [huntDate, setHuntDate] = useState('')
  const [parsedData, setParsedData] = useState(null)
  const [extraCosts, setExtraCosts] = useState([])
  const [parseError, setParseError] = useState('')
  const [saveSuccess, setSaveSuccess] = useState(false)
  const { createHunt, loading } = useHunts()
  const navigate = useNavigate()

  // Extract session duration string from parsed data or raw log
  const huntDurationStr = useMemo(() => {
    if (parsedData?.session?.duration) return parsedData.session.duration
    if (!rawLog) return ''
    const match = rawLog.match(/Session:\s*([^\r\n]+)/i)
    if (match && !match[0].includes('Session data')) {
      return match[1].trim()
    }
    return ''
  }, [parsedData, rawLog])

  const huntDurationHours = useMemo(() => {
    return parseDurationToHours(huntDurationStr)
  }, [huntDurationStr])

  // Total extra supplies calculated from all fractionated cost rows
  const totalExtraSupplies = useMemo(() => {
    if (huntDurationHours <= 0) return 0
    return Math.round(
      extraCosts.reduce((acc, item) => {
        const cost = Number(item.totalCost) || 0
        const hours = Number(item.totalHours) || 0
        if (hours > 0 && cost > 0) {
          return acc + (huntDurationHours / hours) * cost
        }
        return acc
      }, 0)
    )
  }, [extraCosts, huntDurationHours])

  // Effective calculated values taking extra fractionated costs into account
  const effectiveSupplies = useMemo(() => {
    if (!parsedData) return 0
    return (parsedData.totals.supplies || 0) + totalExtraSupplies
  }, [parsedData, totalExtraSupplies])

  const effectiveBalance = useMemo(() => {
    if (!parsedData) return 0
    return (parsedData.totals.loot || 0) - effectiveSupplies
  }, [parsedData, effectiveSupplies])

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
    setExtraCosts([])
    setParseError('')
    setSaveSuccess(false)
  }

  const handleSave = async () => {
    if (!parsedData) return

    // Build extra costs summary to append to raw_log for transparent history
    let enhancedRawLog = rawLog.trim()
    if (extraCosts.length > 0 && totalExtraSupplies > 0) {
      const extraLines = extraCosts
        .filter((item) => Number(item.totalCost) > 0 && Number(item.totalHours) > 0)
        .map((item) => {
          const fracCost = Math.round((huntDurationHours / Number(item.totalHours)) * Number(item.totalCost))
          return `  - ${item.name || 'Item'}: ${formatGold(fracCost)} gp (${huntDurationHours.toFixed(2)}h de ${item.totalHours}h | Recarga: ${formatGold(item.totalCost)} gp)`
        })
        .join('\n')

      enhancedRawLog += `\n\n--- Custos Extras Fracionados (${huntDurationStr}) ---\n${extraLines}\nTotal Extras: ${formatGold(totalExtraSupplies)} gp\nSupplies do Log: ${formatGold(parsedData.totals.supplies)} gp\nSupplies Total Real: ${formatGold(effectiveSupplies)} gp\nLucro Real Ajustado: ${formatGold(effectiveBalance)} gp`
    }

    const { error } = await createHunt({
      location: location || parsedData.session?.lootType || 'Unknown',
      huntDate: huntDate || new Date().toISOString(),
      totalLoot: parsedData.totals.loot,
      totalSupplies: effectiveSupplies,
      balance: effectiveBalance,
      rawLog: enhancedRawLog,
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

        {/* Optional Fractionated Extra Costs Section */}
        <ExtraCostsSection
          extraCosts={extraCosts}
          onChange={setExtraCosts}
          huntDurationHours={huntDurationHours}
          huntDurationStr={huntDurationStr}
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
              value={effectiveSupplies}
              subtext={
                totalExtraSupplies > 0
                  ? `Log: ${formatGold(parsedData.totals.supplies)} + Extras: ${formatGold(totalExtraSupplies)} gp`
                  : null
              }
              color="text-tibia-purple"
              bg="bg-tibia-purple/10"
            />
            <TotalCard
              icon={Scale}
              label="Lucro Real (Balance)"
              value={effectiveBalance}
              subtext={
                totalExtraSupplies > 0
                  ? 'Já descontando imbuements e itens proporcionais'
                  : null
              }
              color={effectiveBalance >= 0 ? 'text-tibia-green' : 'text-tibia-red'}
              bg={effectiveBalance >= 0 ? 'bg-tibia-green/10' : 'bg-tibia-red/10'}
            />
          </div>

          {/* Extra costs breakdown in preview if items exist */}
          {extraCosts.length > 0 && totalExtraSupplies > 0 && (
            <div className="glass-card overflow-hidden">
              <div className="flex items-center justify-between p-4 border-b border-tibia-border/50 bg-tibia-purple/5">
                <div className="flex items-center gap-2">
                  <Layers className="w-4 h-4 text-tibia-purple" />
                  <h3 className="text-sm font-semibold text-gray-200">
                    Detalhamento dos Custos Extras Fracionados
                  </h3>
                </div>
                <span className="badge bg-tibia-purple/20 text-tibia-purple border border-tibia-purple/30 text-xs font-semibold">
                  +{formatGold(totalExtraSupplies)} gp
                </span>
              </div>
              <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {extraCosts
                  .filter((item) => Number(item.totalCost) > 0 && Number(item.totalHours) > 0)
                  .map((item) => {
                    const cost = Number(item.totalCost)
                    const hours = Number(item.totalHours)
                    const fracCost = Math.round((huntDurationHours / hours) * cost)
                    const percent = Math.min(100, (huntDurationHours / hours) * 100)

                    return (
                      <div
                        key={item.id}
                        className="bg-tibia-deeper/70 border border-tibia-border/50 rounded-xl p-3 flex items-center gap-3"
                      >
                        <div className="w-10 h-10 rounded-lg bg-tibia-card border border-tibia-border flex items-center justify-center flex-shrink-0 overflow-hidden">
                          {item.imageUrl ? (
                            <img
                              src={item.imageUrl}
                              alt={item.name}
                              className="w-7 h-7 object-contain"
                            />
                          ) : (
                            <Shield className="w-4 h-4 text-gray-500" />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-semibold text-gray-200 truncate">
                            {item.name || 'Item'}
                          </p>
                          <p className="text-[10px] text-gray-500">
                            {huntDurationHours.toFixed(2)}h de {hours}h ({percent.toFixed(0)}%)
                          </p>
                          <p className="text-xs font-bold text-tibia-purple font-mono mt-0.5">
                            +{formatGold(fracCost)} gp
                          </p>
                        </div>
                      </div>
                    )
                  })}
              </div>
            </div>
          )}

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

function TotalCard({ icon: Icon, label, value, subtext, color, bg }) {
  return (
    <div className="glass-card p-4 flex items-start gap-3">
      <div className={`w-10 h-10 rounded-xl ${bg} flex items-center justify-center flex-shrink-0 mt-0.5`}>
        <Icon className={`w-5 h-5 ${color}`} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="stat-label">{label}</p>
        <p className={`text-lg font-bold ${color}`}>
          {formatGold(value)}<span className="text-xs font-normal text-gray-500 ml-1">gp</span>
        </p>
        {subtext && (
          <p className="text-[11px] text-gray-400 mt-1 leading-snug truncate" title={subtext}>
            {subtext}
          </p>
        )}
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
