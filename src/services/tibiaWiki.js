/**
 * Service to interact with the TibiaWiki (Fandom) MediaWiki API
 * to fetch item sprites/GIFs.
 */

// In-memory cache for fetched item images to avoid redundant network calls
const imageCache = new Map()

/**
 * Common Tibia presets for imbuements, necklaces, rings and consumables
 * with default recharge cost (gp) and total duration (hours).
 */
export const POPULAR_EXTRA_COSTS = [
  { name: 'Powerful Strike', defaultCost: 300000, defaultHours: 20, category: 'Imbuement' },
  { name: 'Powerful Vampirism', defaultCost: 300000, defaultHours: 20, category: 'Imbuement' },
  { name: 'Powerful Void', defaultCost: 300000, defaultHours: 20, category: 'Imbuement' },
  { name: 'Powerful Epiphany', defaultCost: 300000, defaultHours: 20, category: 'Imbuement' },
  { name: 'Powerful Precision', defaultCost: 300000, defaultHours: 20, category: 'Imbuement' },
  { name: 'Gill Necklace', defaultCost: 20000, defaultHours: 2, category: 'Colar' },
  { name: 'Prismatic Ring', defaultCost: 40000, defaultHours: 1, category: 'Anel' },
  { name: 'Collar of Blue Plasma', defaultCost: 60000, defaultHours: 0.5, category: 'Colar' },
  { name: 'Ring of Blue Plasma', defaultCost: 60000, defaultHours: 0.5, category: 'Anel' },
  { name: 'Dragon Necklace', defaultCost: 5000, defaultHours: 2, category: 'Colar' },
  { name: 'Mastermind Potion', defaultCost: 8000, defaultHours: 0.166, category: 'Consumível' },
  { name: 'Bullseye Potion', defaultCost: 8000, defaultHours: 0.166, category: 'Consumível' },
  { name: 'Berserk Potion', defaultCost: 8000, defaultHours: 0.166, category: 'Consumível' },
]

/**
 * Normalizes item names for TibiaWiki query (Capital Case with underscores)
 */
function normalizeItemName(name) {
  if (!name) return ''
  return name
    .trim()
    .split(/\s+/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join('_')
}

/**
 * Fetches an item sprite/GIF image URL from TibiaWiki API.
 * @param {string} itemName - The name of the item (e.g. "Gill Necklace", "Powerful Strike")
 * @returns {Promise<string|null>} The image URL or null if not found
 */
export async function fetchTibiaItemImage(itemName) {
  if (!itemName || typeof itemName !== 'string' || !itemName.trim()) {
    return null
  }

  const trimmed = itemName.trim()
  const cacheKey = trimmed.toLowerCase()

  if (imageCache.has(cacheKey)) {
    return imageCache.get(cacheKey)
  }

  const normalized = normalizeItemName(trimmed)

  try {
    // Strategy 1: Query article images via generator=images
    const url1 = `https://tibia.fandom.com/api.php?action=query&titles=${encodeURIComponent(normalized)}&prop=imageinfo&iiprop=url&format=json&generator=images&gimlimit=5&origin=*`
    const res1 = await fetch(url1)
    if (res1.ok) {
      const data = await res1.json()
      if (data?.query?.pages) {
        const pages = Object.values(data.query.pages)
        // Look for exact file name match first or the primary gif/png
        const match = pages.find(p => {
          const title = (p.title || '').toLowerCase()
          return title.includes(cacheKey) || title.endsWith('.gif') || title.endsWith('.png')
        }) || pages[0]

        const imageUrl = match?.imageinfo?.[0]?.url
        if (imageUrl) {
          imageCache.set(cacheKey, imageUrl)
          return imageUrl
        }
      }
    }

    // Strategy 2: Query direct file name (File:Item_Name.gif or File:Item_Name.png)
    const url2 = `https://tibia.fandom.com/api.php?action=query&titles=File:${encodeURIComponent(normalized)}.gif|File:${encodeURIComponent(normalized)}.png&prop=imageinfo&iiprop=url&format=json&origin=*`
    const res2 = await fetch(url2)
    if (res2.ok) {
      const data = await res2.json()
      if (data?.query?.pages) {
        const pages = Object.values(data.query.pages)
        const validPage = pages.find(p => p.imageinfo && p.imageinfo[0]?.url)
        if (validPage) {
          const imageUrl = validPage.imageinfo[0].url
          imageCache.set(cacheKey, imageUrl)
          return imageUrl
        }
      }
    }

    // Strategy 3: Search
    const url3 = `https://tibia.fandom.com/api.php?action=query&generator=search&gsrsearch=${encodeURIComponent(trimmed)}&gsrlimit=1&prop=imageinfo&iiprop=url&generator=images&format=json&origin=*`
    const res3 = await fetch(url3)
    if (res3.ok) {
      const data = await res3.json()
      if (data?.query?.pages) {
        const pages = Object.values(data.query.pages)
        const validPage = pages.find(p => p.imageinfo && p.imageinfo[0]?.url)
        if (validPage) {
          const imageUrl = validPage.imageinfo[0].url
          imageCache.set(cacheKey, imageUrl)
          return imageUrl
        }
      }
    }

    imageCache.set(cacheKey, null)
    return null
  } catch (err) {
    console.warn(`Error fetching TibiaWiki image for "${trimmed}":`, err)
    return null
  }
}
