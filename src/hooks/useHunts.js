import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

export function useHunts() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const createHunt = async ({ location, huntDate, totalLoot, totalSupplies, balance, rawLog }) => {
    if (!user) {
      setError('Usuário não autenticado')
      return { data: null, error: 'Usuário não autenticado' }
    }

    setLoading(true)
    setError(null)

    try {
      const { data, error: insertError } = await supabase
        .from('hunts')
        .insert({
          profile_id: user.id,
          location,
          hunt_date: huntDate || new Date().toISOString(),
          total_loot: totalLoot,
          total_supplies: totalSupplies,
          balance,
          raw_log: rawLog,
        })
        .select()
        .single()

      if (insertError) throw insertError

      return { data, error: null }
    } catch (err) {
      console.error('Create hunt error:', err)
      setError(err.message)
      return { data: null, error: err.message }
    } finally {
      setLoading(false)
    }
  }

  const fetchHunts = async (limit = 20, offset = 0) => {
    if (!user) return { data: [], error: 'Usuário não autenticado' }

    setLoading(true)
    setError(null)

    try {
      const { data, error: fetchError, count } = await supabase
        .from('hunts')
        .select('*', { count: 'exact' })
        .eq('profile_id', user.id)
        .order('hunt_date', { ascending: false })
        .range(offset, offset + limit - 1)

      if (fetchError) throw fetchError

      return { data, count, error: null }
    } catch (err) {
      console.error('Fetch hunts error:', err)
      setError(err.message)
      return { data: [], count: 0, error: err.message }
    } finally {
      setLoading(false)
    }
  }

  return {
    createHunt,
    fetchHunts,
    loading,
    error,
  }
}
