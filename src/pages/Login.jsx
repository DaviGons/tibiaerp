import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { Swords, Mail, Lock, Eye, EyeOff, Loader2, AlertCircle } from 'lucide-react'

export default function Login() {
  const [isSignUp, setIsSignUp] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const { signIn, signUp } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setLoading(true)

    try {
      if (isSignUp) {
        const { error } = await signUp(email, password)
        if (error) throw error
        setSuccess('Conta criada! Verifique seu e-mail para confirmar o cadastro.')
        setEmail('')
        setPassword('')
      } else {
        const { error } = await signIn(email, password)
        if (error) throw error
        navigate('/')
      }
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-tibia-dark bg-grid-pattern flex items-center justify-center p-4 relative overflow-hidden">
      {/* Ambient glow effects */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-tibia-gold/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-tibia-green/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="w-full max-w-md animate-slide-up">
        {/* Logo section */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-tibia-gold to-yellow-600 shadow-glow-gold mb-4">
            <Swords className="w-8 h-8 text-tibia-dark" />
          </div>
          <h1 className="text-2xl font-bold text-gray-100 tracking-tight">Tibia ERP</h1>
          <p className="text-sm text-gray-500 mt-1">Gerencie suas hunts e finanças</p>
        </div>

        {/* Card */}
        <div className="glass-card p-8">
          {/* Tabs */}
          <div className="flex rounded-lg bg-tibia-deeper p-1 mb-6">
            <button
              onClick={() => { setIsSignUp(false); setError(''); setSuccess('') }}
              className={`flex-1 py-2 text-sm font-medium rounded-md transition-all duration-200 ${
                !isSignUp
                  ? 'bg-tibia-card text-tibia-gold shadow-sm'
                  : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              Entrar
            </button>
            <button
              onClick={() => { setIsSignUp(true); setError(''); setSuccess('') }}
              className={`flex-1 py-2 text-sm font-medium rounded-md transition-all duration-200 ${
                isSignUp
                  ? 'bg-tibia-card text-tibia-gold shadow-sm'
                  : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              Cadastrar
            </button>
          </div>

          {/* Error message */}
          {error && (
            <div className="flex items-start gap-2 p-3 rounded-lg bg-tibia-red/10 border border-tibia-red/20 mb-4 animate-fade-in">
              <AlertCircle className="w-4 h-4 text-tibia-red flex-shrink-0 mt-0.5" />
              <p className="text-sm text-tibia-red">{error}</p>
            </div>
          )}

          {/* Success message */}
          {success && (
            <div className="flex items-start gap-2 p-3 rounded-lg bg-tibia-green/10 border border-tibia-green/20 mb-4 animate-fade-in">
              <AlertCircle className="w-4 h-4 text-tibia-green flex-shrink-0 mt-0.5" />
              <p className="text-sm text-tibia-green">{success}</p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="label-text">E-mail</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                  required
                  className="input-field pl-10"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="label-text">Senha</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  minLength={6}
                  className="input-field pl-10 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {isSignUp ? 'Criando conta...' : 'Entrando...'}
                </>
              ) : (
                isSignUp ? 'Criar Conta' : 'Entrar'
              )}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-gray-600 mt-6">
          Tibia é uma marca registrada da CipSoft GmbH. Este projeto não é afiliado.
        </p>
      </div>
    </div>
  )
}

function getErrorMessage(error) {
  const msg = error?.message || error?.toString() || ''
  if (msg.includes('Invalid login credentials')) return 'E-mail ou senha inválidos.'
  if (msg.includes('Email not confirmed')) return 'Confirme seu e-mail antes de entrar.'
  if (msg.includes('User already registered')) return 'Este e-mail já está cadastrado.'
  if (msg.includes('Password should be at least')) return 'A senha deve ter pelo menos 6 caracteres.'
  if (msg.includes('rate limit')) return 'Muitas tentativas. Tente novamente mais tarde.'
  return msg || 'Ocorreu um erro inesperado.'
}
