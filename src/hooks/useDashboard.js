import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { useCharacter } from '../contexts/CharacterContext'

export function useDashboard() {
  const { user } = useAuth()
  const { activeCharacterId } = useCharacter()
  const [consolidatedBalance, setConsolidatedBalance] = useState(0)
  const [totalLoot, setTotalLoot] = useState(0)
  const [totalSupplies, setTotalSupplies] = useState(0)
  const [huntCount, setHuntCount] = useState(0)
  const [recentActivity, setRecentActivity] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchDashboardData = useCallback(async () => {
    if (!user) return

    setLoading(true)
    setError(null)

    try {
      // ── Hunts query ──────────────────────────────────────────────
      // When an active character is selected, show only that character's hunts.
      // This ensures stats (balance, loot, supplies, hunt count) reflect
      // a single character's economy, not a mix of different servers/worlds.
      // Fallback: no active character → show all hunts (consolidated view).
      let huntsQuery = supabase
        .from('hunts')
        .select('id, location, hunt_date, total_loot, total_supplies, balance, created_at')
        .eq('profile_id', user.id)

      if (activeCharacterId) {
        huntsQuery = huntsQuery.eq('character_id', activeCharacterId)
      }

      const { data: hunts, error: huntsError } = await huntsQuery
        .order('hunt_date', { ascending: false })

      if (huntsError) throw huntsError

      // ── Transactions query ───────────────────────────────────────
      // DECISÃO DE DESIGN: Transações são GLOBAIS à conta do usuário.
      // A tabela `transactions` não possui coluna `character_id` no schema atual.
      // Transações representam movimentações financeiras gerais (compras de TC,
      // vendas de items no market, etc.) que não estão necessariamente vinculadas
      // a uma sessão de hunt de um personagem específico.
      // Por isso, o saldo de transações é somado ao consolidado independentemente
      // do personagem ativo selecionado.
      const { data: transactions, error: txError } = await supabase
        .from('transactions')
        .select('id, description, amount, transaction_date, type, created_at')
        .eq('profile_id', user.id)
        .order('transaction_date', { ascending: false })

      if (txError) throw txError

      // Calculate totals from hunts (filtered by character when applicable)
      const huntsBalance = hunts?.reduce((sum, h) => sum + (h.balance || 0), 0) ?? 0
      const huntsLoot = hunts?.reduce((sum, h) => sum + (h.total_loot || 0), 0) ?? 0
      const huntsSupplies = hunts?.reduce((sum, h) => sum + (h.total_supplies || 0), 0) ?? 0

      // Transactions total (global, not filtered by character)
      const txBalance = transactions?.reduce((sum, t) => sum + (t.amount || 0), 0) ?? 0

      setConsolidatedBalance(huntsBalance + txBalance)
      setTotalLoot(huntsLoot)
      setTotalSupplies(huntsSupplies)
      setHuntCount(hunts?.length ?? 0)

      // Combine and sort recent activity (last 10)
      const combined = [
        ...(hunts || []).map(h => ({
          id: h.id,
          type: 'hunt',
          description: h.location || 'Hunt',
          amount: h.balance,
          date: h.hunt_date || h.created_at,
        })),
        ...(transactions || []).map(t => ({
          id: t.id,
          type: 'transaction',
          description: t.description || t.type || 'Transação',
          amount: t.amount,
          date: t.transaction_date || t.created_at,
        })),
      ]
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .slice(0, 10)

      setRecentActivity(combined)
    } catch (err) {
      console.error('Dashboard fetch error:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [user, activeCharacterId])

  useEffect(() => {
    fetchDashboardData()
  }, [fetchDashboardData])

  return {
    consolidatedBalance,
    totalLoot,
    totalSupplies,
    huntCount,
    recentActivity,
    loading,
    error,
    refresh: fetchDashboardData,
  }
}
