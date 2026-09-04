import { useDashboard } from '../hooks/useDashboard'
import { useCharacter } from '../contexts/CharacterContext'
import { formatGold, formatGoldShort } from '../utils/parseHuntLog'
import CharacterSelector from '../components/CharacterSelector'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  Swords,
  Package,
  ShoppingCart,
  RefreshCw,
  Loader2,
  ScrollText,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  AlertCircle,
  Coins,
  Sparkles,
  ArrowRight,
  User,
} from 'lucide-react'
import { Link } from 'react-router-dom'

export default function Dashboard() {
  const {
    consolidatedBalance,
    totalLoot,
    totalSupplies,
    huntCount,
    recentActivity,
    loading,
    error,
    refresh,
  } = useDashboard()

  const { characters, activeCharacter, loading: loadingChars } = useCharacter()

  // Calculate Buying Power in Tibia Coins: Math.floor(consolidatedBalance / tcPrice)
  const tcPrice = Number(activeCharacter?.tibia_coin_price) || 0
  const tcBuyingPower =
    tcPrice > 0 && consolidatedBalance > 0
      ? Math.floor(consolidatedBalance / tcPrice)
      : 0

  return (
    <div className="page-enter space-y-6">
      {/* Header with Title and Character Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-100">Dashboard</h1>
          <p className="text-sm text-gray-500 mt-0.5">Visão geral das suas finanças</p>
        </div>

        <div className="flex items-center gap-3 self-start sm:self-auto">
          {/* Active Character Selector Dropdown */}
          <CharacterSelector />

          <button
            onClick={refresh}
            disabled={loading}
            className="btn-secondary flex items-center gap-2 text-sm !py-2"
            title="Atualizar dados"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Atualizar</span>
          </button>
        </div>
      </div>

      {/* Fallback Banner if no characters exist */}
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
                Cadastre seu personagem em <strong>Configurações</strong> com o preço da Tibia Coin do seu servidor para desbloquear a conversão de saldo em TC e métricas personalizadas.
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

      {/* Stats cards grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {/* 1. Saldo Consolidado */}
        <StatCard
          icon={Wallet}
          label="Saldo Consolidado"
          value={formatGold(consolidatedBalance)}
          suffix=" gp"
          trend={consolidatedBalance >= 0 ? 'up' : 'down'}
          glowClass={consolidatedBalance >= 0 ? 'group-hover:shadow-glow-green' : 'group-hover:shadow-glow-red'}
          iconBg={consolidatedBalance >= 0 ? 'bg-tibia-green/15' : 'bg-tibia-red/15'}
          iconColor={consolidatedBalance >= 0 ? 'text-tibia-green' : 'text-tibia-red'}
          valueColor={consolidatedBalance >= 0 ? 'text-tibia-green' : 'text-tibia-red'}
          loading={loading}
          featured
        />

        {/* 2. Poder de Compra em TC (Novo!) */}
        <StatCard
          icon={Coins}
          label="Poder de Compra em TC"
          value={
            activeCharacter && tcPrice > 0
              ? formatGold(tcBuyingPower)
              : activeCharacter
                ? '0'
                : '—'
          }
          suffix=" TC"
          subtext={
            activeCharacter && tcPrice > 0
              ? `1 TC = ${formatGold(tcPrice)} gp (${activeCharacter.name})`
              : activeCharacter
                ? 'Defina o preço da TC'
                : 'Cadastre um personagem'
          }
          iconBg="bg-tibia-gold/15"
          iconColor="text-tibia-gold"
          valueColor="text-tibia-gold"
          loading={loading || loadingChars}
        />

        {/* 3. Total Loot */}
        <StatCard
          icon={Package}
          label="Total Loot"
          value={formatGoldShort(totalLoot)}
          suffix=" gp"
          iconBg="bg-tibia-gold/15"
          iconColor="text-tibia-gold"
          loading={loading}
        />

        {/* 4. Total Supplies */}
        <StatCard
          icon={ShoppingCart}
          label="Total Supplies"
          value={formatGoldShort(totalSupplies)}
          suffix=" gp"
          iconBg="bg-tibia-purple/15"
          iconColor="text-tibia-purple"
          loading={loading}
        />

        {/* 5. Hunts Registradas */}
        <StatCard
          icon={Swords}
          label="Hunts Registradas"
          value={huntCount.toString()}
          iconBg="bg-tibia-blue/15"
          iconColor="text-tibia-blue"
          loading={loading}
        />
      </div>

      {/* Recent activity */}
      <div className="glass-card overflow-hidden">
        <div className="flex items-center justify-between p-5 border-b border-tibia-border/50">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-tibia-gold" />
            <h2 className="text-base font-semibold text-gray-200">Histórico Recente</h2>
          </div>
          <Link
            to="/hunt-log"
            className="text-xs text-tibia-gold hover:text-tibia-gold-light transition-colors flex items-center gap-1"
          >
            Registrar Hunt
            <ArrowUpRight className="w-3 h-3" />
          </Link>
        </div>

        {loading ? (
          <div className="p-12 flex items-center justify-center">
            <Loader2 className="w-6 h-6 text-tibia-gold animate-spin" />
          </div>
        ) : recentActivity.length === 0 ? (
          <div className="p-12 text-center">
            <ScrollText className="w-10 h-10 text-gray-600 mx-auto mb-3" />
            <p className="text-sm text-gray-500">Nenhuma atividade registrada</p>
            <Link
              to="/hunt-log"
              className="inline-flex items-center gap-1 mt-3 text-xs text-tibia-gold hover:text-tibia-gold-light transition-colors"
            >
              Registrar sua primeira hunt
              <ArrowUpRight className="w-3 h-3" />
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-tibia-border/30">
            {recentActivity.map((item, index) => (
              <div
                key={`${item.type}-${item.id}`}
                className="flex items-center gap-4 px-5 py-3.5 hover:bg-tibia-card-hover/50 transition-colors"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                  item.type === 'hunt' ? 'bg-tibia-gold/10' : 'bg-tibia-blue/10'
                }`}>
                  {item.type === 'hunt' ? (
                    <Swords className="w-4 h-4 text-tibia-gold" />
                  ) : (
                    <ArrowUpRight className="w-4 h-4 text-tibia-blue" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-200 truncate">
                    {item.description}
                  </p>
                  <p className="text-xs text-gray-500">
                    {formatActivitySubtitle(item)}
                  </p>
                </div>

                <div className="text-right flex-shrink-0">
                  <span className={`text-sm font-semibold flex items-center gap-1 ${
                    item.amount >= 0 ? 'text-tibia-green' : 'text-tibia-red'
                  }`}>
                    {item.amount >= 0 ? (
                      <ArrowUpRight className="w-3 h-3" />
                    ) : (
                      <ArrowDownRight className="w-3 h-3" />
                    )}
                    {formatGold(Math.abs(item.amount))} gp
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function StatCard({
  icon: Icon,
  label,
  value,
  suffix,
  subtext,
  trend,
  glowClass,
  iconBg,
  iconColor,
  valueColor,
  loading,
  featured,
}) {
  return (
    <div className={`glass-card-hover p-5 group flex flex-col justify-between ${featured ? 'sm:col-span-2 lg:col-span-1' : ''}`}>
      <div>
        <div className="flex items-start justify-between">
          <div className={`w-10 h-10 rounded-xl ${iconBg || 'bg-tibia-card'} flex items-center justify-center`}>
            <Icon className={`w-5 h-5 ${iconColor || 'text-gray-400'}`} />
          </div>
          {trend && (
            <div className={`flex items-center gap-0.5 text-xs font-medium ${
              trend === 'up' ? 'text-tibia-green' : 'text-tibia-red'
            }`}>
              {trend === 'up' ? (
                <TrendingUp className="w-3.5 h-3.5" />
              ) : (
                <TrendingDown className="w-3.5 h-3.5" />
              )}
            </div>
          )}
        </div>
        <div className="mt-3">
          {loading ? (
            <div className="h-8 w-24 rounded-md shimmer" />
          ) : (
            <p className={`stat-value ${valueColor || 'text-gray-100'}`}>
              {value}
              {suffix && <span className="text-sm font-normal text-gray-500 ml-1">{suffix}</span>}
            </p>
          )}
          <p className="stat-label mt-1">{label}</p>
        </div>
      </div>

      {subtext && (
        <div className="mt-2.5 pt-2 border-t border-tibia-border/40">
          <p className="text-[10px] text-gray-400 font-medium truncate" title={subtext}>
            {subtext}
          </p>
        </div>
      )}
    </div>
  )
}

function formatActivitySubtitle(item) {
  if (!item?.date) return '—'
  try {
    const date = new Date(item.date)
    const formattedDate = format(date, "dd MMM yyyy", { locale: ptBR })
    if (item.type === 'hunt' && item.duration) {
      return `${formattedDate} • ${item.duration}`
    }
    return formattedDate
  } catch {
    return item.date
  }
}
