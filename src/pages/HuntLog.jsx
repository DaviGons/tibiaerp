import { useState, useCallback, useMemo, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { parseHuntLog, formatGold, parseDurationToHours } from '../utils/parseHuntLog'
import { useHunts } from '../hooks/useHunts'
import { useCharacter } from '../contexts/CharacterContext'
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
  Package,
  ShoppingCart,
  Scale,
  Clock,
  User,
  Plus,
  Sparkles,
  Layers,
} from 'lucide-react'

export default function HuntLog() {
  const [rawLog, setRawLog] = useState('')
  const [location, setLocation] = useState('')
  const [huntDate, setHuntDate] = useState('')
  const [parsedData, setParsedData] = useState(null)
  const [parseError, setParseError] = useState('')
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [extraCosts, setExtraCosts] = useState([])

  const { characters, activeCharacter, loading: loadingChars } = useCharacter()
  const [selectedCharId, setSelectedCharId] = useState(activeCharacter?.id || '')

  const { createHunt, loading: savingHunt } = useHunts()
  const navigate = useNavigate()

  // Sync selected character with activeCharacter or first character
  useEffect(() => {
    if (activeCharacter?.id && !selectedCharId) {
      setSelectedCharId(activeCharacter.id)
    } else if (characters.length > 0 && !selectedCharId) {
      setSelectedCharId(characters[0].id)
    }
  }, [activeCharacter, characters, selectedCharId])

  // Get selected character object and its token prices in memory
  const selectedChar = useMemo(() => {
    if (!selectedCharId) return activeCharacter || characters[0] || null
    return characters.find((c) => String(c.id) === String(selectedCharId)) || activeCharacter || null
  }, [characters, selectedCharId, activeCharacter])

  const silverTokenPrice = Number(selectedChar?.silver_token_price) || 0

  // ─── Extract Hunt Duration from Log ─────────────────────────────────────────

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

  // ─── Extra Costs Management (Silver Tokens & Automated Hours) ──────────────

  const handleAddCost = () => {
    const newItem = {
      id: `cost_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      name: '',
      silverTokens: 5,
      totalHours: 2, // default 2h (ex: Spiritthorn Ring, Pendulet, etc.)
      fullUsage: false,
    }
    setExtraCosts((prev) => [...prev, newItem])
  }

  const handleUpdateCost = (id, field, value) => {
    setExtraCosts((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: value } : item))
    )
  }

  const handleRemoveCost = (id) => {
    setExtraCosts((prev) => prev.filter((item) => item.id !== id))
  }

  // Calculate cost for each item based on Silver Tokens and automated hunt duration
  const calculateItemCost = useCallback(
    (item) => {
      const tokenQty = Number(item.silverTokens) || 0
      if (tokenQty <= 0 || silverTokenPrice <= 0) return 0

      // If full usage is explicitly checked, charge 100% of recharge cost
      if (item.fullUsage) {
        return tokenQty * silverTokenPrice
      }

      // Automated calculation by hours: (Hunt Duration / Item Total Hours) * (Tokens * Price)
      const itemHours = Number(item.totalHours) || 0
      if (itemHours <= 0) return 0

      if (huntDurationHours > 0) {
        // Capped at 100% if hunt duration is greater than item duration
        const fraction = Math.min(1, huntDurationHours / itemHours)
        return fraction * (tokenQty * silverTokenPrice)
      }

      return 0
    },
    [silverTokenPrice, huntDurationHours]
  )

  // Total extra costs
  const totalExtraCosts = useMemo(() => {
    return Math.round(
      extraCosts.reduce((sum, item) => sum + calculateItemCost(item), 0)
    )
  }, [extraCosts, calculateItemCost])

  // Adjusted supplies & balance
  const rawSupplies = parsedData?.totals?.supplies || 0
  const rawBalance = parsedData?.totals?.balance || 0
  const adjustedSupplies = rawSupplies + totalExtraCosts
  const adjustedBalance = rawBalance - totalExtraCosts

  // ─── Log Parsing & Clearing ────────────────────────────────────────────────

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
        'Não foi possível interpretar o log. Verifique se você colou o texto completo do Hunt Analyzer.'
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

  // ─── Save Hunt ─────────────────────────────────────────────────────────────

  const handleSave = async () => {
    if (!parsedData) return

    if (!selectedCharId) {
      setParseError('Selecione um Personagem antes de salvar a hunt.')
      return
    }

    // Build extra costs summary to append to raw_log for transparent history
    let enhancedRawLog = rawLog.trim()
    if (extraCosts.length > 0 && totalExtraCosts > 0) {
      const extraLines = extraCosts
        .map((item) => {
          const cost = Math.round(calculateItemCost(item))
          const itemHours = Number(item.totalHours) || 0
          const usageText = item.fullUsage
            ? 'Carga 100%'
            : huntDurationHours > 0 && itemHours > 0
              ? `${huntDurationHours.toFixed(2)}h de ${itemHours}h (${Math.min(100, (huntDurationHours / itemHours) * 100).toFixed(0)}%)`
              : 'Sem duração'
          return `  - ${item.name || 'Recarga'}: ${item.silverTokens} ST (${usageText}) = ${formatGold(cost)} gp`
        })
        .join('\n')

      enhancedRawLog += `\n\n--- Custos Extras (Silver Tokens) ---\nPersonagem: ${selectedChar?.name || '—'}\nTempo Hunt: ${huntDurationStr || '—'}\n${extraLines}\nTotal Custos Extras: ${formatGold(totalExtraCosts)} gp\nBalance Bruto Log: ${formatGold(rawBalance)} gp\nBalance Real Ajustado: ${formatGold(adjustedBalance)} gp`
    }

    const { error } = await createHunt({
      location: location || parsedData.session?.lootType || 'Unknown',
      huntDate: huntDate || new Date().toISOString(),
      totalLoot: parsedData.totals.loot,
      totalSupplies: adjustedSupplies,
      balance: adjustedBalance,
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
          Cole o log do Hunt Analyzer e adicione custos extras de recarga
        </p>
      </div>

      {/* Fallback if no characters exist */}
      {!loadingChars && characters.length === 0 && (
        <div className="glass-card p-5 border-tibia-gold/40 bg-gradient-to-r from-tibia-gold/10 via-tibia-card to-tibia-card flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-slide-up shadow-glow-gold">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-tibia-gold/20 border border-tibia-gold/40 flex items-center justify-center text-tibia-gold flex-shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-gray-100">
                Nenhum personagem cadastrado
              </h2>
              <p className="text-xs text-gray-400 mt-0.5 max-w-xl leading-relaxed">
                Você precisa cadastrar um personagem com o preço do Silver Token em <strong>Configurações</strong> para registrar hunts e calcular os custos extras de recarga.
              </p>
            </div>
          </div>

          <Link
            to="/configuracoes"
            className="btn-primary !px-4 !py-2 text-xs font-semibold flex items-center gap-2 whitespace-nowrap self-stretch sm:self-auto justify-center"
          >
            <span>Cadastrar Personagem</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      )}

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

      {/* Main Input Form */}
      <div className="glass-card p-6 space-y-5">
        {/* 1. Character Selector (Required) */}
        <div>
          <label htmlFor="character-select" className="label-text flex items-center gap-1.5 font-semibold text-gray-200">
            <User className="w-4 h-4 text-tibia-gold" />
            Personagem da Hunt *
          </label>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
            <select
              id="character-select"
              value={selectedCharId}
              onChange={(e) => setSelectedCharId(e.target.value)}
              className="input-field bg-tibia-deeper text-gray-200 cursor-pointer font-medium"
              required
            >
              <option value="" disabled>
                Selecione o Personagem
              </option>
              {characters.map((char) => (
                <option key={char.id} value={char.id} className="bg-tibia-card text-gray-200">
                  {char.name} ({char.vocation || 'Sem Vocação'}{char.world ? ` - ${char.world}` : ''})
                </option>
              ))}
            </select>

            {/* Silver Token Price in Memory Display */}
            {selectedChar && (
              <div className="flex items-center gap-2 p-2.5 rounded-lg bg-tibia-deeper/80 border border-tibia-border/60 text-xs">
                <span className="text-gray-400 font-medium">Preço Silver Token:</span>
                <span className="text-gray-100 font-bold font-mono">
                  {formatGold(silverTokenPrice)} gp
                </span>
                {silverTokenPrice === 0 && (
                  <Link to="/configuracoes" className="text-tibia-gold hover:underline text-[11px] ml-auto">
                    Configurar preço
                  </Link>
                )}
              </div>
            )}
          </div>
        </div>

        {/* 2. Raw Log Input */}
        <div>
          <div className="flex items-center gap-2 mb-1.5">
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
            placeholder={`Cole aqui o texto copiado do Hunt Analyzer...\n\nExemplo:\nSession data: From 2026-08-30, 21:00:00 to 2026-08-30, 22:30:00\nSession: 01:30h\nLoot Type: Market\nLoot: 1,500,500\nSupplies: 450,000\nBalance: 1,050,500`}
            rows={8}
            className="input-field font-mono text-sm resize-y min-h-[160px] leading-relaxed"
          />
        </div>

        {/* 3. Seção Simplificada de Custos Extras (Silver Tokens por Horas) */}
        <div className="pt-2 border-t border-tibia-border/50 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-tibia-purple/15 flex items-center justify-center text-tibia-purple flex-shrink-0">
                <Layers className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-semibold text-gray-200">
                    Custos Extras (Recargas)
                  </h3>
                  {huntDurationStr && (
                    <span className="badge bg-tibia-purple/15 text-tibia-purple border border-tibia-purple/30 text-[10px] font-mono">
                      Duração: {huntDurationStr} ({huntDurationHours.toFixed(2)}h)
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-0.5">
                  Cálculo automático proporcional à duração da hunt lida no log
                </p>
              </div>
            </div>

            {/* Botão Único (Sem '+' duplicado) */}
            <button
              type="button"
              onClick={handleAddCost}
              className="btn-primary !px-3.5 !py-2 text-xs flex items-center justify-center gap-1.5 self-start sm:self-auto"
            >
              <Plus className="w-4 h-4" />
              <span>Adicionar Custo Extra</span>
            </button>
          </div>

          {/* List of Extra Costs Rows */}
          {extraCosts.length === 0 ? (
            <div className="p-5 rounded-xl border border-dashed border-tibia-border/60 bg-tibia-deeper/30 text-center text-xs text-gray-500">
              Nenhum custo extra adicionado para esta hunt.
            </div>
          ) : (
            <div className="space-y-3">
              {extraCosts.map((item) => {
                const cost = Math.round(calculateItemCost(item))
                const itemHours = Number(item.totalHours) || 0
                const percentUsed =
                  item.fullUsage
                    ? 100
                    : itemHours > 0 && huntDurationHours > 0
                      ? Math.min(100, (huntDurationHours / itemHours) * 100)
                      : 0

                return (
                  <div
                    key={item.id}
                    className="p-4 rounded-xl bg-tibia-deeper/80 border border-tibia-border/70 hover:border-tibia-border transition-all duration-150 space-y-3"
                  >
                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
                      {/* Nome do Item (Placeholders: Ex: Spiritthorn Ring / Ex: Pendulet) */}
                      <div className="sm:col-span-4">
                        <label className="text-[10px] text-gray-400 font-medium uppercase tracking-wider block mb-1">
                          Nome do Item
                        </label>
                        <input
                          type="text"
                          placeholder="Ex: Spiritthorn Ring, Pendulet..."
                          value={item.name}
                          onChange={(e) => handleUpdateCost(item.id, 'name', e.target.value)}
                          className="input-field !py-1.5 !px-3 text-xs"
                        />
                      </div>

                      {/* Quantidade de Silver Tokens (Recarga) */}
                      <div className="sm:col-span-3">
                        <label className="text-[10px] text-gray-400 font-medium uppercase tracking-wider block mb-1">
                          Qtd Silver Tokens
                        </label>
                        <input
                          type="number"
                          min="1"
                          placeholder="5"
                          value={item.silverTokens}
                          onChange={(e) => handleUpdateCost(item.id, 'silverTokens', e.target.value)}
                          className="input-field !py-1.5 !px-3 text-xs font-mono"
                        />
                      </div>

                      {/* Carga Total do Item (em horas) */}
                      <div className="sm:col-span-3">
                        <label className="text-[10px] text-gray-400 font-medium uppercase tracking-wider block mb-1">
                          Carga Total (horas)
                        </label>
                        <div className="relative">
                          <input
                            type="number"
                            min="0.1"
                            step="0.5"
                            placeholder="2"
                            value={item.totalHours}
                            onChange={(e) => handleUpdateCost(item.id, 'totalHours', e.target.value)}
                            disabled={item.fullUsage}
                            className="input-field !py-1.5 !px-3 text-xs font-mono pr-7 disabled:opacity-50"
                          />
                          <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-gray-500 font-medium pointer-events-none">
                            h
                          </span>
                        </div>
                      </div>

                      {/* Custo Calculado & Botão Excluir */}
                      <div className="sm:col-span-2 flex items-center justify-end gap-2.5">
                        <div className="text-right">
                          <span className="text-[10px] uppercase text-gray-500 block">Custo</span>
                          <span className="text-xs font-bold text-tibia-purple font-mono">
                            +{formatGold(cost)} gp
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveCost(item.id)}
                          className="p-1.5 rounded-lg text-gray-500 hover:text-tibia-red hover:bg-tibia-red/10 transition-colors"
                          title="Remover custo"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Bottom Status / Checkbox bar */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pt-2 border-t border-tibia-border/40 text-xs">
                      {/* Checkbox: Usou toda a carga? */}
                      <label className="flex items-center gap-2 cursor-pointer select-none text-xs text-gray-300">
                        <input
                          type="checkbox"
                          checked={item.fullUsage}
                          onChange={(e) => handleUpdateCost(item.id, 'fullUsage', e.target.checked)}
                          className="rounded border-tibia-border text-tibia-gold focus:ring-tibia-gold/30 bg-tibia-deeper w-4 h-4 cursor-pointer"
                        />
                        <span>Usou toda a carga? (100%)</span>
                      </label>

                      {/* Proportional Calculation Info */}
                      {!item.fullUsage ? (
                        <div className="text-[11px] text-gray-400">
                          {huntDurationHours > 0 ? (
                            <span>
                              Cálculo:{' '}
                              <strong className="text-gray-200">
                                {huntDurationHours.toFixed(2)}h
                              </strong>{' '}
                              de {item.totalHours}h ({percentUsed.toFixed(0)}% da recarga)
                            </span>
                          ) : (
                            <span className="text-yellow-500 italic">
                              Cole o log para calcular o tempo proporcional da hunt
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-[11px] text-tibia-purple font-medium">
                          Cobrança integral da recarga (100%)
                        </span>
                      )}
                    </div>
                  </div>
                )
              })}

              {/* Barra de resumo de custos extras */}
              <div className="p-3 rounded-lg bg-tibia-card/60 border border-tibia-border/60 flex items-center justify-between text-xs">
                <span className="text-gray-400">Total de Custos Extras a deduzir:</span>
                <span className="text-sm font-bold text-tibia-purple font-mono">
                  +{formatGold(totalExtraCosts)} gp
                </span>
              </div>
            </div>
          )}
        </div>

        {/* 4. Metadata fields: Location & Date */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-tibia-border/50">
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
              value={adjustedSupplies}
              subtext={
                totalExtraCosts > 0
                  ? `Log: ${formatGold(rawSupplies)} + Extras: ${formatGold(totalExtraCosts)} gp`
                  : null
              }
              color="text-tibia-purple"
              bg="bg-tibia-purple/10"
            />
            <TotalCard
              icon={Scale}
              label="Lucro Real (Balance)"
              value={adjustedBalance}
              subtext={
                totalExtraCosts > 0
                  ? `Bruto: ${formatGold(rawBalance)} - Extras: ${formatGold(totalExtraCosts)} gp`
                  : null
              }
              color={adjustedBalance >= 0 ? 'text-tibia-green' : 'text-tibia-red'}
              bg={adjustedBalance >= 0 ? 'bg-tibia-green/10' : 'bg-tibia-red/10'}
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
              disabled={savingHunt || saveSuccess}
              className="btn-primary flex items-center gap-2 text-base px-8 py-3"
            >
              {savingHunt ? (
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
