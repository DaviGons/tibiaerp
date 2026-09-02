import { useState } from 'react'
import { useCharacter } from '../contexts/CharacterContext'
import { formatGold } from '../utils/parseHuntLog'
import {
  Settings,
  User,
  Plus,
  Edit2,
  Trash2,
  Check,
  Coins,
  Globe,
  Shield,
  Loader2,
  AlertCircle,
  CheckCircle2,
  X,
  AlertTriangle,
  Sparkles,
} from 'lucide-react'

const VOCATIONS = [
  'None',
  'Knight',
  'Elite Knight',
  'Paladin',
  'Royal Paladin',
  'Sorcerer',
  'Master Sorcerer',
  'Druid',
  'Elder Druid',
]

const VOCATION_BADGES = {
  'Knight': 'text-tibia-red bg-tibia-red/15 border-tibia-red/30',
  'Elite Knight': 'text-tibia-red bg-tibia-red/15 border-tibia-red/30',
  'Paladin': 'text-tibia-gold bg-tibia-gold/15 border-tibia-gold/30',
  'Royal Paladin': 'text-tibia-gold bg-tibia-gold/15 border-tibia-gold/30',
  'Sorcerer': 'text-tibia-blue bg-tibia-blue/15 border-tibia-blue/30',
  'Master Sorcerer': 'text-tibia-blue bg-tibia-blue/15 border-tibia-blue/30',
  'Druid': 'text-tibia-green bg-tibia-green/15 border-tibia-green/30',
  'Elder Druid': 'text-tibia-green bg-tibia-green/15 border-tibia-green/30',
  'None': 'text-gray-400 bg-gray-500/15 border-gray-500/30',
}

const INITIAL_FORM = {
  name: '',
  vocation: 'None',
  world: '',
  gold_token_price: '',
  silver_token_price: '',
  tibia_coin_price: '',
}

export default function Configuracoes() {
  const {
    characters,
    activeCharacter,
    setActiveCharacterId,
    createCharacter,
    updateCharacter,
    deleteCharacter,
    loading,
    error: contextError,
  } = useCharacter()

  const [formData, setFormData] = useState(INITIAL_FORM)
  const [editingId, setEditingId] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState('')
  const [successMsg, setSuccessMsg] = useState('')

  // Delete modal state
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState('')

  const handleStartCreate = () => {
    setFormData(INITIAL_FORM)
    setEditingId(null)
    setFormError('')
    setShowForm(true)
  }

  const handleStartEdit = (char) => {
    setFormData({
      name: char.name || '',
      vocation: char.vocation || 'None',
      world: char.world || '',
      gold_token_price: char.gold_token_price || '',
      silver_token_price: char.silver_token_price || '',
      tibia_coin_price: char.tibia_coin_price || '',
    })
    setEditingId(char.id)
    setFormError('')
    setShowForm(true)
    // Scroll to form smoothly
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleCancelForm = () => {
    setFormData(INITIAL_FORM)
    setEditingId(null)
    setShowForm(false)
    setFormError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setFormError('')
    setSuccessMsg('')

    if (!formData.name.trim()) {
      setFormError('Por favor, informe o Nome do Personagem.')
      return
    }

    setSubmitting(true)

    if (editingId) {
      const { error } = await updateCharacter(editingId, formData)
      if (error) {
        setFormError(`Erro ao atualizar: ${error}`)
        setSubmitting(false)
        return
      }
      setSuccessMsg('Personagem atualizado com sucesso!')
    } else {
      const { error } = await createCharacter(formData)
      if (error) {
        setFormError(`Erro ao cadastrar: ${error}`)
        setSubmitting(false)
        return
      }
      setSuccessMsg('Personagem cadastrado com sucesso!')
    }

    setSubmitting(false)
    setShowForm(false)
    setFormData(INITIAL_FORM)
    setEditingId(null)
    setTimeout(() => setSuccessMsg(''), 4000)
  }

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    setDeleteError('')

    const { error } = await deleteCharacter(deleteTarget.id)
    if (error) {
      setDeleteError(`Erro ao excluir: ${error}`)
      setDeleting(false)
      return
    }

    setDeleting(false)
    setDeleteTarget(null)
    setSuccessMsg('Personagem excluído com sucesso!')
    setTimeout(() => setSuccessMsg(''), 4000)
  }

  return (
    <div className="page-enter space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-100 flex items-center gap-2.5">
            <Settings className="w-6 h-6 text-tibia-gold" />
            Configurações
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Gerencie seus personagens, servidores e preços de tokens e moedas
          </p>
        </div>

        {!showForm && (
          <button
            onClick={handleStartCreate}
            className="btn-primary flex items-center justify-center gap-2 self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            Novo Personagem
          </button>
        )}
      </div>

      {/* Success alert */}
      {successMsg && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-tibia-green/10 border border-tibia-green/20 animate-slide-up">
          <CheckCircle2 className="w-5 h-5 text-tibia-green flex-shrink-0" />
          <p className="text-sm font-medium text-tibia-green">{successMsg}</p>
        </div>
      )}

      {/* Context Error */}
      {contextError && (
        <div className="flex items-start gap-2 p-4 rounded-xl bg-tibia-red/10 border border-tibia-red/20 animate-fade-in">
          <AlertCircle className="w-5 h-5 text-tibia-red flex-shrink-0 mt-0.5" />
          <p className="text-sm text-tibia-red">{contextError}</p>
        </div>
      )}

      {/* Character Form (Create / Edit) */}
      {showForm && (
        <div className="glass-card p-6 border-tibia-gold/30 animate-slide-up space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-tibia-border/50">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-tibia-gold/15 flex items-center justify-center text-tibia-gold">
                {editingId ? <Edit2 className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
              </div>
              <h2 className="text-base font-bold text-gray-100">
                {editingId ? 'Editar Personagem' : 'Cadastrar Novo Personagem'}
              </h2>
            </div>
            <button
              onClick={handleCancelForm}
              className="p-1.5 rounded-lg hover:bg-tibia-card text-gray-400 hover:text-gray-200 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Form Error */}
            {formError && (
              <div className="flex items-start gap-2 p-3 rounded-lg bg-tibia-red/10 border border-tibia-red/20 text-xs text-tibia-red">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>{formError}</span>
              </div>
            )}

            {/* Row 1: Name, Vocation, World */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="label-text flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-tibia-gold" />
                  Nome do Personagem *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Lord of Flames"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="input-field"
                />
              </div>

              <div>
                <label className="label-text flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5 text-tibia-gold" />
                  Vocação
                </label>
                <select
                  value={formData.vocation}
                  onChange={(e) => setFormData({ ...formData, vocation: e.target.value })}
                  className="input-field bg-tibia-deeper text-gray-200 cursor-pointer"
                >
                  {VOCATIONS.map((voc) => (
                    <option key={voc} value={voc} className="bg-tibia-card text-gray-200">
                      {voc}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="label-text flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5 text-tibia-gold" />
                  Servidor
                </label>
                <input
                  type="text"
                  placeholder="Ex: Antica, Belobra..."
                  value={formData.world}
                  onChange={(e) => setFormData({ ...formData, world: e.target.value })}
                  className="input-field"
                />
              </div>
            </div>

            {/* Row 2: Gold Token, Silver Token, Tibia Coin */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
              <div>
                <label className="label-text flex items-center gap-1.5">
                  <Coins className="w-3.5 h-3.5 text-yellow-400" />
                  Preço do Gold Token (gp)
                </label>
                <input
                  type="number"
                  min="0"
                  step="500"
                  placeholder="Ex: 38000"
                  value={formData.gold_token_price}
                  onChange={(e) => setFormData({ ...formData, gold_token_price: e.target.value })}
                  className="input-field font-mono"
                />
                <span className="text-[10px] text-gray-500 mt-1 block">
                  {formData.gold_token_price ? `${formatGold(Number(formData.gold_token_price))} gp` : 'Valor em gp'}
                </span>
              </div>

              <div>
                <label className="label-text flex items-center gap-1.5">
                  <Coins className="w-3.5 h-3.5 text-gray-400" />
                  Preço do Silver Token (gp)
                </label>
                <input
                  type="number"
                  min="0"
                  step="500"
                  placeholder="Ex: 8500"
                  value={formData.silver_token_price}
                  onChange={(e) => setFormData({ ...formData, silver_token_price: e.target.value })}
                  className="input-field font-mono"
                />
                <span className="text-[10px] text-gray-500 mt-1 block">
                  {formData.silver_token_price ? `${formatGold(Number(formData.silver_token_price))} gp` : 'Valor em gp'}
                </span>
              </div>

              <div>
                <label className="label-text flex items-center gap-1.5">
                  <Coins className="w-3.5 h-3.5 text-tibia-gold" />
                  Preço da Tibia Coin (gp) *
                </label>
                <input
                  type="number"
                  min="0"
                  step="500"
                  placeholder="Ex: 42000"
                  value={formData.tibia_coin_price}
                  onChange={(e) => setFormData({ ...formData, tibia_coin_price: e.target.value })}
                  className="input-field font-mono border-tibia-gold/40 focus:border-tibia-gold"
                />
                <span className="text-[10px] text-tibia-gold font-medium mt-1 block">
                  {formData.tibia_coin_price
                    ? `1 TC = ${formatGold(Number(formData.tibia_coin_price))} gp`
                    : 'Usado para calcular o poder de compra na Dashboard'}
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-tibia-border/50">
              <button
                type="button"
                onClick={handleCancelForm}
                disabled={submitting}
                className="btn-secondary text-sm"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="btn-primary flex items-center gap-2 text-sm px-6"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    {editingId ? 'Salvar Alterações' : 'Cadastrar Personagem'}
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Characters List Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <User className="w-4 h-4 text-tibia-gold" />
            <h2 className="text-base font-semibold text-gray-200">
              Personagens Cadastrados ({characters.length})
            </h2>
          </div>
        </div>

        {loading ? (
          <div className="glass-card p-12 flex items-center justify-center">
            <Loader2 className="w-6 h-6 text-tibia-gold animate-spin" />
          </div>
        ) : characters.length === 0 ? (
          <div className="glass-card p-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-xl bg-tibia-card border border-tibia-border flex items-center justify-center mx-auto text-gray-500">
              <User className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-semibold text-gray-200">Nenhum personagem cadastrado</h3>
            <p className="text-xs text-gray-500 max-w-md mx-auto">
              Cadastre seu primeiro personagem com a cotação da Tibia Coin do seu servidor para habilitar cálculos automáticos na Dashboard.
            </p>
            <button
              onClick={handleStartCreate}
              className="btn-primary inline-flex items-center gap-2 text-xs mt-2"
            >
              <Plus className="w-4 h-4" />
              Cadastrar Agora
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {characters.map((char) => {
              const isActive = String(char.id) === String(activeCharacter?.id)
              const badgeClass =
                VOCATION_BADGES[char.vocation] || 'text-tibia-gold bg-tibia-gold/15 border-tibia-gold/30'

              return (
                <div
                  key={char.id}
                  className={`glass-card p-5 transition-all duration-300 relative group ${
                    isActive
                      ? 'border-tibia-gold/40 shadow-glow-gold bg-tibia-card/90'
                      : 'hover:border-tibia-border/90'
                  }`}
                >
                  {/* Top bar: Name, Vocation, Active Badge */}
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-bold text-gray-100">{char.name}</h3>
                        {isActive && (
                          <span className="badge bg-tibia-gold/20 text-tibia-gold border border-tibia-gold/30 text-[10px] font-bold flex items-center gap-1">
                            <Check className="w-2.5 h-2.5" />
                            Ativo
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`badge border text-[10px] ${badgeClass}`}>
                          {char.vocation || 'None'}
                        </span>
                        {char.world && (
                          <span className="badge bg-tibia-deeper border border-tibia-border text-gray-400 text-[10px] flex items-center gap-1">
                            <Globe className="w-2.5 h-2.5" />
                            {char.world}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Quick actions */}
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleStartEdit(char)}
                        className="p-1.5 rounded-lg hover:bg-tibia-card text-gray-400 hover:text-gray-200 transition-colors"
                        title="Editar personagem"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => {
                          setDeleteTarget(char)
                          setDeleteError('')
                        }}
                        className="p-1.5 rounded-lg hover:bg-tibia-red/10 text-gray-500 hover:text-tibia-red transition-colors"
                        title="Excluir personagem"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Market Prices Grid */}
                  <div className="grid grid-cols-3 gap-2 p-3 rounded-lg bg-tibia-deeper/70 border border-tibia-border/40 text-xs mb-4">
                    <div>
                      <p className="text-[10px] text-gray-500 uppercase tracking-wider">Tibia Coin</p>
                      <p className="text-xs font-bold text-tibia-gold font-mono mt-0.5">
                        {char.tibia_coin_price ? `${formatGold(char.tibia_coin_price)} gp` : '—'}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-500 uppercase tracking-wider">Gold Token</p>
                      <p className="text-xs font-semibold text-yellow-400 font-mono mt-0.5">
                        {char.gold_token_price ? `${formatGold(char.gold_token_price)} gp` : '—'}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-500 uppercase tracking-wider">Silver Token</p>
                      <p className="text-xs font-semibold text-gray-300 font-mono mt-0.5">
                        {char.silver_token_price ? `${formatGold(char.silver_token_price)} gp` : '—'}
                      </p>
                    </div>
                  </div>

                  {/* Set active button */}
                  {!isActive ? (
                    <button
                      onClick={() => setActiveCharacterId(char.id)}
                      className="w-full py-1.5 rounded-lg bg-tibia-deeper hover:bg-tibia-card border border-tibia-border hover:border-tibia-gold/30 text-xs font-medium text-gray-400 hover:text-tibia-gold transition-colors flex items-center justify-center gap-1.5"
                    >
                      <Check className="w-3.5 h-3.5" />
                      Selecionar como Ativo
                    </button>
                  ) : (
                    <div className="py-1 text-center">
                      <span className="text-[11px] text-tibia-gold font-medium">
                        ✓ Personagem ativo na Dashboard
                      </span>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
          onClick={() => setDeleteTarget(null)}
        >
          <div
            className="relative w-full max-w-md glass-card p-6 space-y-5 animate-slide-up"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setDeleteTarget(null)}
              className="absolute top-4 right-4 p-1 rounded-lg hover:bg-tibia-card text-gray-500 hover:text-gray-300 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-tibia-red/15 flex items-center justify-center text-tibia-red flex-shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-gray-100">Excluir Personagem</h3>
                <p className="text-xs text-gray-500 mt-0.5">Esta ação não pode ser desfeita</p>
              </div>
            </div>

            <div className="bg-tibia-deeper rounded-lg p-3.5 space-y-1.5 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">Nome:</span>
                <span className="font-semibold text-gray-200">{deleteTarget.name}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-gray-400">Vocação:</span>
                <span className="text-gray-300">{deleteTarget.vocation}</span>
              </div>
              {deleteTarget.world && (
                <div className="flex justify-between text-xs">
                  <span className="text-gray-400">Servidor:</span>
                  <span className="text-gray-300">{deleteTarget.world}</span>
                </div>
              )}
            </div>

            {deleteError && (
              <div className="p-3 rounded-lg bg-tibia-red/10 border border-tibia-red/20 text-xs text-tibia-red">
                {deleteError}
              </div>
            )}

            <div className="flex items-center gap-3 pt-1">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                disabled={deleting}
                className="btn-secondary flex-1 text-sm"
              >
                Cancelar
              </button>
              <button
                type="button"
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
                    Excluir
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
