import { useState, useEffect, useCallback, useMemo } from 'react'
import { useHunts } from '../hooks/useHunts'
import { useCharacter } from '../contexts/CharacterContext'
import { formatGold } from '../utils/parseHuntLog'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import {
  History,
  Trash2,
  Loader2,
  AlertCircle,
  ScrollText,
  Package,
  ShoppingCart,
  Scale,
  Clock,
  MapPin,
  X,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  User,
  Users,
} from 'lucide-react'
import { Link } from 'react-router-dom'

const PAGE_SIZE = 15

export default function Historico() {
  const { fetchHunts, deleteHunt, loading, error } = useHunts()
  const { activeCharacterId, activeCharacter, characters } = useCharacter()
  const [hunts, setHunts] = useState([])
  const [totalCount, setTotalCount] = useState(0)
  const [currentPage, setCurrentPage] = useState(0)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState('')
  const [initialLoad, setInitialLoad] = useState(true)

  // View mode: 'active' = filtered by active character, 'all' = all characters
  const [viewMode, setViewMode] = useState('active')

  // Build a lookup map for character names (avoids repeated .find calls per row)
  const characterNameMap = useMemo(() => {
    const map = {}
    characters.forEach(c => { map[String(c.id)] = c.name })
    return map
  }, [characters])

  // Determine the characterId to filter by based on view mode
  const filterCharacterId = viewMode === 'active' ? activeCharacterId : null

  const loadHunts = useCallback(async (page = 0) => {
    const offset = page * PAGE_SIZE
    const { data, count } = await fetchHunts(PAGE_SIZE, offset, filterCharacterId)
    setHunts(data || [])
    setTotalCount(count || 0)
    setInitialLoad(false)
  }, [fetchHunts, filterCharacterId])

  // Reload hunts when character or view mode changes — reset to page 0
  useEffect(() => {
    setCurrentPage(0)
    loadHunts(0)
  }, [filterCharacterId, viewMode]) // eslint-disable-line react-hooks/exhaustive-deps

  // Reload on page change (separate from above to avoid double-fetching page 0)
  useEffect(() => {
    loadHunts(currentPage)
  }, [currentPage]) // eslint-disable-line react-hooks/exhaustive-deps

  const totalPages = Math.ceil(totalCount / PAGE_SIZE)

  const handleDeleteClick = (hunt) => {
    setDeleteTarget(hunt)
    setDeleteError('')
  }

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return

    setDeleting(true)
    setDeleteError('')

    const { error: err } = await deleteHunt(deleteTarget.id)

    if (err) {
      setDeleteError(err)
      setDeleting(false)
      return
    }

    setDeleteTarget(null)
    setDeleting(false)

    // If we deleted the last item on this page, go back a page
    if (hunts.length === 1 && currentPage > 0) {
      setCurrentPage(prev => prev - 1)
    } else {
      loadHunts(currentPage)
    }
  }

  const handleDeleteCancel = () => {
    setDeleteTarget(null)
    setDeleteError('')
  }

  // Subtitle text reflecting current filter mode
  const subtitleText = viewMode === 'active' && activeCharacter
    ? `Hunts de ${activeCharacter.name} (${totalCount} ${totalCount === 1 ? 'registro' : 'registros'})`
    : `Todas as hunts registradas (${totalCount} ${totalCount === 1 ? 'registro' : 'registros'})`

  return (
    <div className="page-enter space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-100">Histórico</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {subtitleText}
          </p>
        </div>

        {/* View mode toggle */}
        <div className="flex items-center gap-1 p-1 rounded-xl bg-tibia-deeper border border-tibia-border/60 self-start">
          <button
            onClick={() => setViewMode('active')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${
              viewMode === 'active'
                ? 'bg-tibia-gold/15 text-tibia-gold border border-tibia-gold/30'
                : 'text-gray-400 hover:text-gray-200 hover:bg-tibia-card border border-transparent'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Personagem Ativo</span>
            <span className="sm:hidden">Ativo</span>
          </button>
          <button
            onClick={() => setViewMode('all')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${
              viewMode === 'all'
                ? 'bg-tibia-gold/15 text-tibia-gold border border-tibia-gold/30'
                : 'text-gray-400 hover:text-gray-200 hover:bg-tibia-card border border-transparent'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Todos os Personagens</span>
            <span className="sm:hidden">Todos</span>
          </button>
        </div>
      </div>

      {/* Error alert */}
      {error && (
        <div className="flex items-start gap-2 p-4 rounded-xl bg-tibia-red/10 border border-tibia-red/20 animate-fade-in">
          <AlertCircle className="w-5 h-5 text-tibia-red flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-tibia-red">Erro ao carregar dados</p>
            <p className="text-xs text-tibia-red/70 mt-0.5">{error}</p>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="glass-card overflow-hidden relative">
        {loading && initialLoad ? (
          <div className="p-16 flex items-center justify-center">
            <Loader2 className="w-6 h-6 text-tibia-gold animate-spin" />
          </div>
        ) : hunts.length === 0 ? (
          <div className="p-16 text-center">
            <ScrollText className="w-12 h-12 text-gray-600 mx-auto mb-4" />
            <p className="text-sm text-gray-400 font-medium">
              {viewMode === 'active' && activeCharacter
                ? `Nenhuma hunt registrada para ${activeCharacter.name}`
                : 'Nenhuma hunt registrada'}
            </p>
            <p className="text-xs text-gray-500 mt-1">Comece registrando sua primeira hunt</p>
            <Link
              to="/hunt-log"
              className="inline-flex items-center gap-1.5 mt-4 text-sm text-tibia-gold hover:text-tibia-gold-light transition-colors font-medium"
            >
              Registrar Hunt
              <ScrollText className="w-3.5 h-3.5" />
            </Link>
          </div>
        ) : (
          <>
            {/* Table header */}
            <div className={`hidden md:grid gap-4 px-5 py-3 border-b border-tibia-border/50 bg-tibia-deeper/50 ${
              viewMode === 'all'
                ? 'md:grid-cols-[1.2fr_1fr_1fr_1fr_1fr_1fr_auto]'
                : 'md:grid-cols-[1.5fr_1fr_1fr_1fr_1fr_auto]'
            }`}>
              <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                <Clock className="w-3.5 h-3.5" />
                Data / Local
              </div>
              {viewMode === 'all' && (
                <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  <User className="w-3.5 h-3.5" />
                  Personagem
                </div>
              )}
              <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                <Clock className="w-3.5 h-3.5" />
                Duração
              </div>
              <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                <Package className="w-3.5 h-3.5" />
                Loot
              </div>
              <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                <ShoppingCart className="w-3.5 h-3.5" />
                Supplies
              </div>
              <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                <Scale className="w-3.5 h-3.5" />
                Balance
              </div>
              <div className="w-10" />
            </div>

            {/* Table body */}
            <div className="divide-y divide-tibia-border/30">
              {hunts.map((hunt, index) => (
                <HuntRow
                  key={hunt.id}
                  hunt={hunt}
                  index={index}
                  onDelete={handleDeleteClick}
                  isDeleting={deleting && deleteTarget?.id === hunt.id}
                  showCharacter={viewMode === 'all'}
                  characterName={
                    hunt.character_id
                      ? (characterNameMap[String(hunt.character_id)] || 'Desconhecido')
                      : null
                  }
                />
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-5 py-3 border-t border-tibia-border/50 bg-tibia-deeper/30">
                <p className="text-xs text-gray-500">
                  Mostrando {currentPage * PAGE_SIZE + 1}–{Math.min((currentPage + 1) * PAGE_SIZE, totalCount)} de {totalCount}
                </p>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setCurrentPage(p => p - 1)}
                    disabled={currentPage === 0 || loading}
                    className="p-1.5 rounded-lg hover:bg-tibia-card text-gray-400 hover:text-gray-200 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => (
                    <button
                      key={i}
                      onClick={() => setCurrentPage(i)}
                      disabled={loading}
                      className={`w-8 h-8 rounded-lg text-xs font-medium transition-all duration-200 ${
                        i === currentPage
                          ? 'bg-tibia-gold/15 text-tibia-gold border border-tibia-gold/30'
                          : 'text-gray-400 hover:bg-tibia-card hover:text-gray-200'
                      }`}
                    >
                      {i + 1}
                    </button>
                  ))}
                  <button
                    onClick={() => setCurrentPage(p => p + 1)}
                    disabled={currentPage >= totalPages - 1 || loading}
                    className="p-1.5 rounded-lg hover:bg-tibia-card text-gray-400 hover:text-gray-200 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}

        {/* Loading overlay for non-initial loads */}
        {loading && !initialLoad && (
          <div className="absolute inset-0 bg-tibia-dark/50 backdrop-blur-sm flex items-center justify-center rounded-xl z-10">
            <Loader2 className="w-6 h-6 text-tibia-gold animate-spin" />
          </div>
        )}
      </div>

      {/* Delete confirmation modal */}
      {deleteTarget && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          onClick={handleDeleteCancel}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in" />

          {/* Modal */}
          <div
            className="relative w-full max-w-md glass-card p-6 space-y-5 animate-slide-up"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              onClick={handleDeleteCancel}
              className="absolute top-4 right-4 p-1 rounded-lg hover:bg-tibia-card text-gray-500 hover:text-gray-300 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Warning icon */}
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-tibia-red/15 flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-5 h-5 text-tibia-red" />
              </div>
              <div>
                <h3 className="text-base font-bold text-gray-100">Excluir Hunt</h3>
                <p className="text-xs text-gray-500 mt-0.5">Esta ação não pode ser desfeita</p>
              </div>
            </div>

            {/* Details */}
            <div className="bg-tibia-deeper rounded-lg p-4 space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5" />
                  Local
                </span>
                <span className="text-gray-200 font-medium">
                  {deleteTarget.location && deleteTarget.location.trim() && deleteTarget.location !== 'Unknown'
                    ? deleteTarget.location
                    : 'Hunt Solo'}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" />
                  Data / Duração
                </span>
                <span className="text-gray-200 font-medium">
                  {formatHuntSubtitle(
                    deleteTarget.hunt_date,
                    deleteTarget.duration || extractDuration(deleteTarget.raw_log)
                  )}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500 flex items-center gap-1.5">
                  <Scale className="w-3.5 h-3.5" />
                  Balance
                </span>
                <span className={`font-bold ${deleteTarget.balance >= 0 ? 'text-tibia-green' : 'text-tibia-red'}`}>
                  {formatGold(deleteTarget.balance)} gp
                </span>
              </div>
            </div>

            <p className="text-sm text-gray-400 leading-relaxed">
              Ao excluir, o valor de{' '}
              <span className={`font-semibold ${deleteTarget.balance >= 0 ? 'text-tibia-green' : 'text-tibia-red'}`}>
                {formatGold(deleteTarget.balance)} gp
              </span>{' '}
              será removido do seu saldo consolidado.
            </p>

            {/* Delete error */}
            {deleteError && (
              <div className="flex items-start gap-2 p-3 rounded-lg bg-tibia-red/10 border border-tibia-red/20 animate-fade-in">
                <AlertCircle className="w-4 h-4 text-tibia-red flex-shrink-0 mt-0.5" />
                <p className="text-sm text-tibia-red">{deleteError}</p>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center gap-3 pt-1">
              <button
                onClick={handleDeleteCancel}
                disabled={deleting}
                className="btn-secondary flex-1 text-sm"
              >
                Cancelar
              </button>
              <button
                onClick={handleDeleteConfirm}
                disabled={deleting}
                className="btn-danger flex-1 flex items-center justify-center gap-2 text-sm"
              >
                {deleting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Excluindo...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    Excluir Hunt
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function HuntRow({ hunt, index, onDelete, isDeleting, showCharacter, characterName }) {
  const balanceColor = hunt.balance >= 0 ? 'text-tibia-green' : 'text-tibia-red'
  const balanceBadge = hunt.balance >= 0 ? 'badge-profit' : 'badge-loss'
  const displayLocation = hunt.location && hunt.location.trim() && hunt.location !== 'Unknown' ? hunt.location : 'Hunt Solo'
  const huntDuration = hunt.duration || extractDuration(hunt.raw_log)

  return (
    <>
      {/* Desktop row */}
      <div
        className={`hidden md:grid gap-4 px-5 py-3.5 hover:bg-tibia-card-hover/50 transition-colors items-center group ${
          showCharacter
            ? 'md:grid-cols-[1.2fr_1fr_1fr_1fr_1fr_1fr_auto]'
            : 'md:grid-cols-[1.5fr_1fr_1fr_1fr_1fr_auto]'
        }`}
        style={{ animationDelay: `${index * 30}ms` }}
      >
        {/* Date & Location */}
        <div className="min-w-0">
          <p className="text-sm font-medium text-gray-200 truncate">
            {displayLocation}
          </p>
          <p className="text-xs text-gray-500 mt-0.5">
            {formatHuntSubtitle(hunt.hunt_date, huntDuration)}
          </p>
        </div>

        {/* Character column (only in 'all' mode) */}
        {showCharacter && (
          <div className="min-w-0">
            {characterName ? (
              <span className="text-xs font-medium text-gray-300 truncate block">
                {characterName}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-gray-700/50 border border-gray-600/50 text-[10px] text-gray-400 font-medium">
                Sem personagem
              </span>
            )}
          </div>
        )}

        {/* Duration */}
        <div>
          <p className="text-sm text-gray-300">
            {huntDuration || '—'}
          </p>
        </div>

        {/* Loot */}
        <div>
          <p className="text-sm text-tibia-gold font-medium">
            {formatGold(hunt.total_loot)} <span className="text-xs text-gray-500">gp</span>
          </p>
        </div>

        {/* Supplies */}
        <div>
          <p className="text-sm text-tibia-purple font-medium">
            {formatGold(hunt.total_supplies)} <span className="text-xs text-gray-500">gp</span>
          </p>
        </div>

        {/* Balance */}
        <div>
          <span className={balanceBadge}>
            {hunt.balance >= 0 ? '+' : ''}{formatGold(hunt.balance)} gp
          </span>
        </div>

        {/* Delete button */}
        <div>
          <button
            onClick={() => onDelete(hunt)}
            disabled={isDeleting}
            className="p-2 rounded-lg text-gray-600 hover:text-tibia-red hover:bg-tibia-red/10 transition-all duration-200 opacity-0 group-hover:opacity-100"
            title="Excluir hunt"
          >
            {isDeleting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Trash2 className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile card */}
      <div
        className="md:hidden p-4 hover:bg-tibia-card-hover/50 transition-colors space-y-3"
        style={{ animationDelay: `${index * 30}ms` }}
      >
        <div className="flex items-start justify-between">
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-gray-200 truncate">
              {displayLocation}
            </p>
            <p className="text-xs text-gray-500 mt-0.5">
              {formatHuntSubtitle(hunt.hunt_date, huntDuration)}
            </p>
            {/* Character badge on mobile (only in 'all' mode) */}
            {showCharacter && (
              <p className="text-[10px] text-gray-400 mt-1">
                {characterName ? (
                  <span className="inline-flex items-center gap-1">
                    <User className="w-3 h-3" />
                    {characterName}
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-gray-700/50 border border-gray-600/50">
                    Sem personagem
                  </span>
                )}
              </p>
            )}
          </div>
          <button
            onClick={() => onDelete(hunt)}
            disabled={isDeleting}
            className="p-2 rounded-lg text-gray-600 hover:text-tibia-red hover:bg-tibia-red/10 transition-all duration-200 flex-shrink-0"
            title="Excluir hunt"
          >
            {isDeleting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Trash2 className="w-4 h-4" />
            )}
          </button>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <div className="bg-tibia-deeper rounded-lg p-2.5">
            <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-0.5">Loot</p>
            <p className="text-xs text-tibia-gold font-semibold">{formatGold(hunt.total_loot)}</p>
          </div>
          <div className="bg-tibia-deeper rounded-lg p-2.5">
            <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-0.5">Supplies</p>
            <p className="text-xs text-tibia-purple font-semibold">{formatGold(hunt.total_supplies)}</p>
          </div>
          <div className="bg-tibia-deeper rounded-lg p-2.5">
            <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-0.5">Balance</p>
            <p className={`text-xs font-semibold ${balanceColor}`}>
              {hunt.balance >= 0 ? '+' : ''}{formatGold(hunt.balance)}
            </p>
          </div>
        </div>
      </div>
    </>
  )
}

/**
 * Extract session duration from raw_log text
 */
function extractDuration(rawLog) {
  if (!rawLog) return null
  const match = rawLog.match(/Session:\s*([^\r\n]+)/i)
  if (match && !match[0].includes('Session data')) {
    return match[1].trim()
  }
  return null
}

function formatHuntSubtitle(dateStr, durationStr) {
  if (!dateStr) return durationStr ? durationStr : '—'
  try {
    const date = new Date(dateStr)
    const formattedDate = format(date, "dd MMM yyyy", { locale: ptBR })
    return durationStr ? `${formattedDate} • ${durationStr}` : formattedDate
  } catch {
    return dateStr
  }
}
