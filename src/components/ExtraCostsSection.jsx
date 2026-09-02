import { useState, useEffect, useRef, useCallback } from 'react'
import {
  fetchTibiaItemImage,
  POPULAR_EXTRA_COSTS,
} from '../services/tibiaWiki'
import { formatGold, formatGoldShort } from '../utils/parseHuntLog'
import {
  Sparkles,
  Plus,
  Trash2,
  Clock,
  Coins,
  Tag,
  Loader2,
  Layers,
  HelpCircle,
  Shield,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'

export default function ExtraCostsSection({
  extraCosts,
  onChange,
  huntDurationHours = 0,
  huntDurationStr = '',
}) {
  const [isOpen, setIsOpen] = useState(true)

  // Add new empty cost item
  const handleAddEmpty = () => {
    const newItem = {
      id: `cost_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      name: '',
      totalCost: '',
      totalHours: 20,
      imageUrl: null,
      loadingImage: false,
    }
    onChange([...extraCosts, newItem])
    if (!isOpen) setIsOpen(true)
  }

  // Add from popular preset
  const handleAddPreset = (preset) => {
    const newItem = {
      id: `cost_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      name: preset.name,
      totalCost: preset.defaultCost,
      totalHours: preset.defaultHours,
      imageUrl: null,
      loadingImage: true,
    }
    onChange([...extraCosts, newItem])
    if (!isOpen) setIsOpen(true)

    // Immediately fetch image for preset
    fetchTibiaItemImage(preset.name).then((url) => {
      onChange(
        (prevCosts) =>
          prevCosts.map((item) =>
            item.id === newItem.id
              ? { ...item, imageUrl: url, loadingImage: false }
              : item
          )
      )
    })
  }

  // Remove a cost item
  const handleRemove = (id) => {
    onChange(extraCosts.filter((item) => item.id !== id))
  }

  // Update a field of a specific item
  const handleUpdate = (id, field, value) => {
    onChange(
      extraCosts.map((item) => {
        if (item.id !== id) return item
        return { ...item, [field]: value }
      })
    )
  }

  // Total extra supplies calculated from all rows
  const totalExtraCost = extraCosts.reduce((acc, item) => {
    const cost = Number(item.totalCost) || 0
    const hours = Number(item.totalHours) || 0
    if (huntDurationHours > 0 && hours > 0 && cost > 0) {
      const fracCost = (huntDurationHours / hours) * cost
      return acc + fracCost
    }
    return acc
  }, 0)

  return (
    <div className="glass-card overflow-hidden transition-all duration-300">
      {/* Header / Toggle bar */}
      <div className="p-4 sm:p-5 flex items-center justify-between border-b border-tibia-border/50 bg-tibia-card/60">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-tibia-purple/15 flex items-center justify-center text-tibia-purple flex-shrink-0">
            <Layers className="w-4.5 h-4.5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-gray-200">
                Custos Extras Fracionados
              </h3>
              <span className="badge bg-tibia-card border border-tibia-border text-[10px] text-gray-400">
                Opcional
              </span>
              {extraCosts.length > 0 && (
                <span className="badge bg-tibia-purple/20 text-tibia-purple border border-tibia-purple/30 text-[10px] font-semibold">
                  {extraCosts.length} {extraCosts.length === 1 ? 'item' : 'itens'}
                </span>
              )}
            </div>
            <p className="text-xs text-gray-500 mt-0.5">
              Imbuements, Rings e Colares proporcionais ao tempo de hunt
              {huntDurationStr ? ` (${huntDurationStr})` : ''}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {extraCosts.length > 0 && totalExtraCost > 0 && (
            <div className="hidden sm:flex flex-col text-right mr-2">
              <span className="text-[10px] uppercase text-gray-500 font-medium">
                Total Extra
              </span>
              <span className="text-xs font-bold text-tibia-purple">
                +{formatGold(Math.round(totalExtraCost))} gp
              </span>
            </div>
          )}

          <button
            type="button"
            onClick={handleAddEmpty}
            className="btn-secondary !px-3 !py-1.5 text-xs flex items-center gap-1.5"
            title="Adicionar item customizado"
          >
            <Plus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Adicionar</span>
          </button>

          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className="p-1.5 rounded-lg hover:bg-tibia-card text-gray-400 hover:text-gray-200 transition-colors"
            title={isOpen ? 'Recolher' : 'Expandir'}
          >
            {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {isOpen && (
        <div className="p-4 sm:p-5 space-y-4 animate-fade-in">
          {/* Quick presets pills */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-medium uppercase tracking-wider text-gray-400 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-tibia-gold" />
                Adicionar Predefinição Rápida
              </span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {POPULAR_EXTRA_COSTS.map((preset) => (
                <button
                  key={preset.name}
                  type="button"
                  onClick={() => handleAddPreset(preset)}
                  className="px-2.5 py-1.5 rounded-lg bg-tibia-deeper hover:bg-tibia-card-hover border border-tibia-border hover:border-tibia-gold/30 text-xs text-gray-300 hover:text-tibia-gold transition-all duration-150 flex items-center gap-1.5 group"
                >
                  <Plus className="w-3 h-3 text-gray-500 group-hover:text-tibia-gold transition-colors" />
                  <span>{preset.name}</span>
                  <span className="text-[10px] text-gray-500 font-mono">
                    ({preset.defaultHours}h)
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Dynamic item rows */}
          {extraCosts.length === 0 ? (
            <div className="border border-dashed border-tibia-border/60 rounded-xl p-6 text-center bg-tibia-deeper/20">
              <Shield className="w-8 h-8 text-gray-600 mx-auto mb-2" />
              <p className="text-xs text-gray-400 font-medium">
                Nenhum custo extra adicionado
              </p>
              <p className="text-[11px] text-gray-500 mt-1 max-w-sm mx-auto">
                Adicione imbuements (ex: 20h), colares (ex: 2h) ou rings para calcular o custo proporcional exato da duração desta hunt.
              </p>
              <button
                type="button"
                onClick={handleAddEmpty}
                className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-tibia-card hover:bg-tibia-card-hover border border-tibia-border text-xs text-tibia-gold transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                Adicionar primeiro item
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {extraCosts.map((item, index) => (
                <CostRow
                  key={item.id}
                  item={item}
                  index={index}
                  huntDurationHours={huntDurationHours}
                  huntDurationStr={huntDurationStr}
                  onUpdate={(field, val) => handleUpdate(item.id, field, val)}
                  onRemove={() => handleRemove(item.id)}
                />
              ))}
            </div>
          )}

          {/* Footer calculation summary */}
          {extraCosts.length > 0 && (
            <div className="pt-3 border-t border-tibia-border/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs">
              <div className="text-gray-400 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-tibia-gold" />
                <span>
                  Tempo da Hunt considerado:{' '}
                  <strong className="text-gray-200">
                    {huntDurationStr || (huntDurationHours > 0 ? `${huntDurationHours.toFixed(2)}h` : 'Ainda não analisado')}
                  </strong>
                </span>
                {!huntDurationStr && huntDurationHours === 0 && (
                  <span className="text-[10px] text-yellow-500 italic">
                    (analise o log para calcular o valor proporcional)
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2 self-end sm:self-auto">
                <span className="text-gray-400">Total de Custos Extras:</span>
                <span className="text-sm font-bold text-tibia-purple bg-tibia-purple/10 px-2.5 py-1 rounded-md border border-tibia-purple/20">
                  +{formatGold(Math.round(totalExtraCost))} gp
                </span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Individual Cost Row ──────────────────────────────────────────────────────

function CostRow({
  item,
  index,
  huntDurationHours,
  huntDurationStr,
  onUpdate,
  onRemove,
}) {
  const [imgUrl, setImgUrl] = useState(item.imageUrl || null)
  const [loadingImg, setLoadingImg] = useState(false)
  const debounceRef = useRef(null)

  // Debounced image fetching when user types item name
  useEffect(() => {
    if (item.imageUrl) {
      setImgUrl(item.imageUrl)
      return
    }

    if (!item.name || !item.name.trim()) {
      setImgUrl(null)
      return
    }

    if (debounceRef.current) clearTimeout(debounceRef.current)

    setLoadingImg(true)
    debounceRef.current = setTimeout(async () => {
      const url = await fetchTibiaItemImage(item.name)
      setImgUrl(url)
      setLoadingImg(false)
      if (url) onUpdate('imageUrl', url)
    }, 450)

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [item.name, item.imageUrl]) // eslint-disable-line react-hooks/exhaustive-deps

  const cost = Number(item.totalCost) || 0
  const totalHours = Number(item.totalHours) || 0

  // Calculate fractionated cost: (huntDuration / itemTotalHours) * totalCost
  const fractionCost =
    huntDurationHours > 0 && totalHours > 0 && cost > 0
      ? (huntDurationHours / totalHours) * cost
      : 0

  const percentUsed =
    huntDurationHours > 0 && totalHours > 0
      ? Math.min(100, (huntDurationHours / totalHours) * 100)
      : 0

  return (
    <div className="p-3.5 rounded-xl bg-tibia-deeper/70 border border-tibia-border/60 hover:border-tibia-border transition-all duration-200">
      <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
        {/* Item sprite / thumbnail */}
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-lg bg-tibia-card border border-tibia-border/80 flex items-center justify-center flex-shrink-0 relative overflow-hidden group">
            {loadingImg ? (
              <Loader2 className="w-4 h-4 text-tibia-gold animate-spin" />
            ) : imgUrl ? (
              <img
                src={imgUrl}
                alt={item.name}
                className="w-8 h-8 object-contain transition-transform duration-200 group-hover:scale-110"
                onError={() => setImgUrl(null)}
              />
            ) : (
              <Shield className="w-5 h-5 text-gray-600" />
            )}
          </div>

          {/* Item name input */}
          <div className="flex-1 md:w-52 min-w-0">
            <label className="text-[10px] text-gray-400 font-medium uppercase tracking-wider mb-1 flex items-center gap-1">
              <Tag className="w-3 h-3 text-tibia-gold" />
              Nome do Item
            </label>
            <input
              type="text"
              placeholder="Ex: Powerful Strike, Gill Necklace..."
              value={item.name}
              onChange={(e) => {
                onUpdate('name', e.target.value)
                onUpdate('imageUrl', null) // trigger refetch
              }}
              className="input-field !py-1.5 !px-3 text-sm"
              autoComplete="off"
            />
          </div>
        </div>

        {/* Cost input */}
        <div className="w-full md:w-36">
          <label className="text-[10px] text-gray-400 font-medium uppercase tracking-wider mb-1 flex items-center gap-1">
            <Coins className="w-3 h-3 text-tibia-gold" />
            Recarga Total (gp)
          </label>
          <input
            type="number"
            min="0"
            step="1000"
            placeholder="300000"
            value={item.totalCost}
            onChange={(e) => onUpdate('totalCost', e.target.value)}
            className="input-field !py-1.5 !px-3 text-sm [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none font-mono"
            autoComplete="off"
          />
        </div>

        {/* Total duration in hours input */}
        <div className="w-full md:w-32">
          <label className="text-[10px] text-gray-400 font-medium uppercase tracking-wider mb-1 flex items-center gap-1">
            <Clock className="w-3 h-3 text-tibia-gold" />
            Duração Total
          </label>
          <div className="relative">
            <input
              type="number"
              min="0.1"
              step="0.5"
              placeholder="20"
              value={item.totalHours}
              onChange={(e) => onUpdate('totalHours', e.target.value)}
              className="input-field !py-1.5 !px-3 text-sm [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none font-mono pr-7"
              autoComplete="off"
            />
            <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-gray-500 font-medium pointer-events-none">
              h
            </span>
          </div>
        </div>

        {/* Calculated fraction result & remove button */}
        <div className="flex items-center justify-between md:justify-end gap-3 flex-1 pt-1 md:pt-4">
          <div className="text-left md:text-right">
            <span className="text-[10px] uppercase tracking-wider text-gray-500 block">
              Custo na Hunt
            </span>
            {huntDurationHours > 0 ? (
              <div className="flex items-baseline md:justify-end gap-1">
                <span className="text-sm font-bold text-tibia-purple font-mono">
                  +{formatGold(Math.round(fractionCost))}
                </span>
                <span className="text-[10px] text-gray-500 font-mono">
                  gp ({percentUsed.toFixed(1)}%)
                </span>
              </div>
            ) : (
              <span className="text-xs text-gray-500 italic">
                Aguardando log
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={onRemove}
            className="p-2 rounded-lg text-gray-500 hover:text-tibia-red hover:bg-tibia-red/10 transition-colors"
            title="Remover custo extra"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
