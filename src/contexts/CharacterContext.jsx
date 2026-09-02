import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './AuthContext'

const CharacterContext = createContext({})

const STORAGE_KEY = 'tibiaerp_active_character_id'

export function CharacterProvider({ children }) {
  const { user } = useAuth()
  const [characters, setCharacters] = useState([])
  const [activeCharacterId, setActiveCharacterIdState] = useState(() => {
    return localStorage.getItem(STORAGE_KEY) || null
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchCharacters = useCallback(async () => {
    if (!user) {
      setCharacters([])
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    try {
      // Try fetching characters by profile_id first
      let { data, error: fetchErr } = await supabase
        .from('characters')
        .select('*')
        .eq('profile_id', user.id)
        .order('created_at', { ascending: false })

      // Fallback if profile_id column is named user_id
      if (fetchErr && fetchErr.message?.includes('profile_id')) {
        const fallback = await supabase
          .from('characters')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
        data = fallback.data
        fetchErr = fallback.error
      }

      if (fetchErr) throw fetchErr

      const list = data || []
      setCharacters(list)

      // Ensure active character is valid
      setActiveCharacterIdState((currentActiveId) => {
        if (list.length === 0) {
          localStorage.removeItem(STORAGE_KEY)
          return null
        }
        const exists = list.some((c) => String(c.id) === String(currentActiveId))
        if (exists) {
          return currentActiveId
        }
        // Auto-select the first character
        const firstId = String(list[0].id)
        localStorage.setItem(STORAGE_KEY, firstId)
        return firstId
      })
    } catch (err) {
      console.error('Fetch characters error:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    fetchCharacters()
  }, [fetchCharacters])

  const setActiveCharacterId = useCallback((id) => {
    const stringId = id ? String(id) : null
    if (stringId) {
      localStorage.setItem(STORAGE_KEY, stringId)
    } else {
      localStorage.removeItem(STORAGE_KEY)
    }
    setActiveCharacterIdState(stringId)
  }, [])

  const activeCharacter = useMemo(() => {
    if (!activeCharacterId || characters.length === 0) return null
    return characters.find((c) => String(c.id) === String(activeCharacterId)) || characters[0] || null
  }, [characters, activeCharacterId])

  const createCharacter = async (charData) => {
    if (!user) return { data: null, error: 'Usuário não autenticado' }

    try {
      const payload = {
        profile_id: user.id,
        name: charData.name.trim(),
        vocation: charData.vocation || 'None',
        world: charData.world ? charData.world.trim() : null,
        gold_token_price: Number(charData.gold_token_price) || 0,
        silver_token_price: Number(charData.silver_token_price) || 0,
        tibia_coin_price: Number(charData.tibia_coin_price) || 0,
      }

      let { data, error: insertError } = await supabase
        .from('characters')
        .insert(payload)
        .select()
        .single()

      // Fallback if column is user_id
      if (insertError && insertError.message?.includes('profile_id')) {
        delete payload.profile_id
        payload.user_id = user.id
        const fallback = await supabase
          .from('characters')
          .insert(payload)
          .select()
          .single()
        data = fallback.data
        insertError = fallback.error
      }

      if (insertError) throw insertError

      await fetchCharacters()

      // Set newly created character as active
      if (data?.id) {
        setActiveCharacterId(data.id)
      }

      return { data, error: null }
    } catch (err) {
      console.error('Create character error:', err)
      return { data: null, error: err.message }
    }
  }

  const updateCharacter = async (id, charData) => {
    if (!user) return { data: null, error: 'Usuário não autenticado' }

    try {
      const payload = {
        name: charData.name.trim(),
        vocation: charData.vocation || 'None',
        world: charData.world ? charData.world.trim() : null,
        gold_token_price: Number(charData.gold_token_price) || 0,
        silver_token_price: Number(charData.silver_token_price) || 0,
        tibia_coin_price: Number(charData.tibia_coin_price) || 0,
      }

      const { data, error: updateError } = await supabase
        .from('characters')
        .update(payload)
        .eq('id', id)
        .select()
        .single()

      if (updateError) throw updateError

      await fetchCharacters()
      return { data, error: null }
    } catch (err) {
      console.error('Update character error:', err)
      return { data: null, error: err.message }
    }
  }

  const deleteCharacter = async (id) => {
    if (!user) return { error: 'Usuário não autenticado' }

    try {
      const { error: delError } = await supabase
        .from('characters')
        .delete()
        .eq('id', id)

      if (delError) throw delError

      await fetchCharacters()
      return { error: null }
    } catch (err) {
      console.error('Delete character error:', err)
      return { error: err.message }
    }
  }

  const value = {
    characters,
    activeCharacter,
    activeCharacterId,
    setActiveCharacterId,
    loading,
    error,
    createCharacter,
    updateCharacter,
    deleteCharacter,
    refreshCharacters: fetchCharacters,
  }

  return (
    <CharacterContext.Provider value={value}>
      {children}
    </CharacterContext.Provider>
  )
}

export function useCharacter() {
  const context = useContext(CharacterContext)
  if (context === undefined) {
    throw new Error('useCharacter must be used within a CharacterProvider')
  }
  return context
}
