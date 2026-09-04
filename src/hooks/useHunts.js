import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

export function useHunts() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const createHunt = async ({ characterId, location, huntDate, totalLoot, totalSupplies, balance, rawLog }) => {
    if (!user) {
      setError('Usuário não autenticado')
      return { data: null, error: 'Usuário não autenticado' }
    }

    if (!characterId) {
      const msg = 'Selecione um personagem antes de salvar a hunt.'
      setError(msg)
      return { data: null, error: msg }
    }

    setLoading(true)
    setError(null)

    try {
      const { data, error: insertError } = await supabase
        .from('hunts')
        .insert({
          profile_id: user.id,
          character_id: characterId,
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

  const fetchHunts = async (limit = 20, offset = 0, characterId = null) => {
    if (!user) return { data: [], error: 'Usuário não autenticado' }

    setLoading(true)
    setError(null)

    try {
      let query = supabase
        .from('hunts')
        .select('*', { count: 'exact' })
        .eq('profile_id', user.id)

      // Filter by character when provided; null = all hunts (cross-character view)
      if (characterId) {
        query = query.eq('character_id', characterId)
      }

      const { data, error: fetchError, count } = await query
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

  const deleteHunt = async (huntId) => {
    if (!user) {
      setError('Usuário não autenticado')
      return { error: 'Usuário não autenticado' }
    }

    setLoading(true)
    setError(null)

    try {
      // Delete the hunt (profile_id filter ensures user can only delete their own)
      const { error: deleteError } = await supabase
        .from('hunts')
        .delete()
        .eq('id', huntId)
        .eq('profile_id', user.id)

      if (deleteError) throw deleteError

      return { error: null }
    } catch (err) {
      console.error('Delete hunt error:', err)
      setError(err.message)
      return { error: err.message }
    } finally {
      setLoading(false)
    }
  }

  return {
    createHunt,
    fetchHunts,
    deleteHunt,
    loading,
    error,
  }
}
