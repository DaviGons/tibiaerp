/**
 * Parses the raw text log from the Tibia Party Hunt Analyzer.
 *
 * Expected format:
 * ---
 * Session data: From YYYY-MM-DD, HH:MM:SS to YYYY-MM-DD, HH:MM:SS
 * Session: HH:MMh
 * Loot Type: Market
 * Loot: X,XXX,XXX
 * Supplies: X,XXX,XXX
 * Balance: X,XXX,XXX
 * PlayerName (Vocation)
 *   Loot: X,XXX
 *   Supplies: X,XXX
 *   Balance: X,XXX
 *   Damage: X,XXX
 *   Healing: X,XXX
 * ---
 *
 * @param {string} rawText - The raw pasted text from the analyzer clipboard
 * @returns {{ session: object, totals: object, players: array } | null}
 */
export function parseHuntLog(rawText) {
  if (!rawText || typeof rawText !== 'string') return null

  const lines = rawText.trim().split('\n').map(l => l.trim()).filter(Boolean)

  if (lines.length < 4) return null

  const result = {
    session: {
      from: null,
      to: null,
      duration: null,
      lootType: null,
    },
    totals: {
      loot: 0,
      supplies: 0,
      balance: 0,
    },
    players: [],
  }

  let currentPlayer = null
  let parsingPhase = 'header' // 'header' | 'players'

  for (const line of lines) {
    // Session data line
    const sessionMatch = line.match(
      /^Session data:\s*From\s+(\d{4}-\d{2}-\d{2},\s*\d{2}:\d{2}:\d{2})\s+to\s+(\d{4}-\d{2}-\d{2},\s*\d{2}:\d{2}:\d{2})/i
    )
    if (sessionMatch) {
      result.session.from = sessionMatch[1].replace(',', '')
      result.session.to = sessionMatch[2].replace(',', '')
      continue
    }

    // Session duration
    const durationMatch = line.match(/^Session:\s*(.+)/i)
    if (durationMatch && !line.includes('Session data')) {
      result.session.duration = durationMatch[1].trim()
      continue
    }

    // Loot Type
    const lootTypeMatch = line.match(/^Loot Type:\s*(.+)/i)
    if (lootTypeMatch) {
      result.session.lootType = lootTypeMatch[1].trim()
      continue
    }

    // Global totals (lines that start with the keyword and are NOT indented player stats)
    // We detect totals before any player is parsed
    if (parsingPhase === 'header') {
      const lootMatch = line.match(/^Loot:\s*([\d,.-]+)/i)
      if (lootMatch) {
        result.totals.loot = parseNumber(lootMatch[1])
        continue
      }

      const suppliesMatch = line.match(/^Supplies:\s*([\d,.-]+)/i)
      if (suppliesMatch) {
        result.totals.supplies = parseNumber(suppliesMatch[1])
        continue
      }

      const balanceMatch = line.match(/^Balance:\s*([\d,.-]+)/i)
      if (balanceMatch) {
        result.totals.balance = parseNumber(balanceMatch[1])
        parsingPhase = 'players'
        continue
      }
    }

    // Player header line: "PlayerName (Vocation)"
    if (parsingPhase === 'players') {
      const playerMatch = line.match(/^(.+?)\s*\(([^)]+)\)\s*$/)
      if (playerMatch) {
        if (currentPlayer) {
          result.players.push(currentPlayer)
        }
        currentPlayer = {
          name: playerMatch[1].trim(),
          vocation: playerMatch[2].trim(),
          loot: 0,
          supplies: 0,
          balance: 0,
          damage: 0,
          healing: 0,
        }
        continue
      }

      // Player stats (indented or after player header)
      if (currentPlayer) {
        const statMatch = line.match(/^(Loot|Supplies|Balance|Damage|Healing):\s*([\d,.-]+)/i)
        if (statMatch) {
          const key = statMatch[1].toLowerCase()
          currentPlayer[key] = parseNumber(statMatch[2])
          continue
        }
      }
    }
  }

  // Push last player
  if (currentPlayer) {
    result.players.push(currentPlayer)
  }

  // Validate we got meaningful data
  if (result.totals.loot === 0 && result.totals.supplies === 0 && result.players.length === 0) {
    return null
  }

  return result
}

/**
 * Parses a number string like "1,500,500" or "1.500.500" into a number.
 * Handles negative values prefixed with "-".
 */
function parseNumber(str) {
  if (!str) return 0
  const cleaned = str.replace(/[,.\s]/g, '')
  const num = parseInt(cleaned, 10)
  return isNaN(num) ? 0 : num
}

/**
 * Formats a number as Tibia gold currency (e.g., 1,050,500).
 * @param {number} value
 * @returns {string}
 */
export function formatGold(value) {
  if (value === null || value === undefined) return '0'
  return new Intl.NumberFormat('en-US').format(value)
}

/**
 * Formats a number as a short representation (e.g., 1.5M, 450K).
 * @param {number} value
 * @returns {string}
 */
export function formatGoldShort(value) {
  if (value === null || value === undefined) return '0'
  const abs = Math.abs(value)
  const sign = value < 0 ? '-' : ''
  if (abs >= 1_000_000_000) return `${sign}${(abs / 1_000_000_000).toFixed(1)}B`
  if (abs >= 1_000_000) return `${sign}${(abs / 1_000_000).toFixed(1)}M`
  if (abs >= 1_000) return `${sign}${(abs / 1_000).toFixed(1)}K`
  return `${sign}${abs}`
}


