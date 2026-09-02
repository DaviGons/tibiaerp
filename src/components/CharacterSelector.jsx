import { useState, useRef, useEffect } from 'react'
import { useCharacter } from '../contexts/CharacterContext'
import { Link } from 'react-router-dom'
import { formatGold } from '../utils/parseHuntLog'
import {
  User,
  ChevronDown,
  Check,
  Plus,
  Settings,
  Coins,
  Globe,
  Shield,
} from 'lucide-react'

const VOCATION_COLORS = {
  'Knight': 'text-tibia-red bg-tibia-red/10 border-tibia-red/20',
  'Elite Knight': 'text-tibia-red bg-tibia-red/10 border-tibia-red/20',
  'Paladin': 'text-tibia-gold bg-tibia-gold/10 border-tibia-gold/20',
  'Royal Paladin': 'text-tibia-gold bg-tibia-gold/10 border-tibia-gold/20',
  'Sorcerer': 'text-tibia-blue bg-tibia-blue/10 border-tibia-blue/20',
  'Master Sorcerer': 'text-tibia-blue bg-tibia-blue/10 border-tibia-blue/20',
  'Druid': 'text-tibia-green bg-tibia-green/10 border-tibia-green/20',
  'Elder Druid': 'text-tibia-green bg-tibia-green/10 border-tibia-green/20',
  'None': 'text-gray-400 bg-gray-500/10 border-gray-500/20',
}

export default function CharacterSelector() {
  const { characters, activeCharacter, setActiveCharacterId, loading } = useCharacter()
  const [open, setOpen] = useState(false)
  const dropdownRef = useRef(null)

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  if (loading && characters.length === 0) {
    return (
      <div className="h-10 w-44 rounded-xl bg-tibia-card border border-tibia-border/50 shimmer" />
    )
  }

  if (characters.length === 0) {
    return (
      <Link
        to="/configuracoes"
        className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-tibia-gold/10 hover:bg-tibia-gold/20 border border-tibia-gold/30 text-xs font-semibold text-tibia-gold transition-all duration-200"
      >
        <Plus className="w-4 h-4" />
        <span>Cadastrar Personagem</span>
      </Link>
    )
  }

  const vocColor = activeCharacter?.vocation
    ? VOCATION_COLORS[activeCharacter.vocation] || 'text-tibia-gold bg-tibia-gold/10 border-tibia-gold/20'
    : 'text-gray-400 bg-gray-500/10 border-gray-500/20'

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Selector Trigger Button */}
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-tibia-card/90 hover:bg-tibia-card border border-tibia-border/60 hover:border-tibia-gold/30 text-left transition-all duration-200 shadow-sm group"
      >
        <div className="w-7 h-7 rounded-lg bg-tibia-gold/15 flex items-center justify-center text-tibia-gold flex-shrink-0">
          <User className="w-3.5 h-3.5" />
        </div>

        <div className="min-w-0 pr-1">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-bold text-gray-100 truncate max-w-[120px] sm:max-w-[150px]">
              {activeCharacter?.name || 'Selecionar'}
            </span>
            {activeCharacter?.world && (
              <span className="text-[10px] text-gray-500 hidden sm:inline">
                ({activeCharacter.world})
              </span>
            )}
          </div>
          {activeCharacter?.tibia_coin_price > 0 && (
            <p className="text-[10px] text-gray-400 font-medium">
              1 TC = <span className="text-tibia-gold font-mono">{formatGold(activeCharacter.tibia_coin_price)}</span> gp
            </p>
          )}
        </div>

        <ChevronDown
          className={`w-4 h-4 text-gray-400 group-hover:text-gray-200 transition-transform duration-200 ${
            open ? 'rotate-180' : ''
          }`}
        />
      </button>

      {/* Dropdown Menu */}
      {open && (
        <div className="absolute right-0 top-full mt-2 w-72 rounded-xl bg-tibia-deeper/95 backdrop-blur-xl border border-tibia-border/80 shadow-2xl z-50 overflow-hidden animate-slide-up">
          <div className="p-3 border-b border-tibia-border/50 bg-tibia-card/40 flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-300 uppercase tracking-wider">
              Meus Personagens
            </span>
            <span className="badge bg-tibia-card border border-tibia-border text-[10px] text-gray-400">
              {characters.length}
            </span>
          </div>

          <div className="max-h-64 overflow-y-auto divide-y divide-tibia-border/30 p-1.5">
            {characters.map((char) => {
              const isSelected = String(char.id) === String(activeCharacter?.id)
              const badgeClass =
                VOCATION_COLORS[char.vocation] || 'text-tibia-gold bg-tibia-gold/10 border-tibia-gold/20'

              return (
                <button
                  key={char.id}
                  onClick={() => {
                    setActiveCharacterId(char.id)
                    setOpen(false)
                  }}
                  className={`w-full p-2.5 rounded-lg flex items-center justify-between gap-2 text-left transition-all duration-150 ${
                    isSelected
                      ? 'bg-tibia-gold/10 border border-tibia-gold/30'
                      : 'hover:bg-tibia-card/70 border border-transparent'
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 mb-1">
                      <span className={`text-xs font-bold truncate ${isSelected ? 'text-tibia-gold' : 'text-gray-200'}`}>
                        {char.name}
                      </span>
                      <span className={`badge border text-[9px] py-0 px-1.5 ${badgeClass}`}>
                        {char.vocation || 'None'}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-[10px] text-gray-400">
                      {char.world && (
                        <span className="flex items-center gap-1">
                          <Globe className="w-2.5 h-2.5" />
                          {char.world}
                        </span>
                      )}
                      {char.tibia_coin_price > 0 && (
                        <span className="flex items-center gap-1 text-gray-400">
                          <Coins className="w-2.5 h-2.5 text-tibia-gold" />
                          {formatGold(char.tibia_coin_price)} gp
                        </span>
                      )}
                    </div>
                  </div>

                  {isSelected && (
                    <div className="w-5 h-5 rounded-full bg-tibia-gold/20 text-tibia-gold flex items-center justify-center flex-shrink-0">
                      <Check className="w-3 h-3" />
                    </div>
                  )}
                </button>
              )
            })}
          </div>

          <div className="p-2 border-t border-tibia-border/50 bg-tibia-card/20">
            <Link
              to="/configuracoes"
              onClick={() => setOpen(false)}
              className="w-full py-2 px-3 rounded-lg bg-tibia-card hover:bg-tibia-card-hover border border-tibia-border text-xs text-gray-300 hover:text-tibia-gold flex items-center justify-center gap-2 transition-colors font-medium"
            >
              <Settings className="w-3.5 h-3.5" />
              Gerenciar Personagens
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
