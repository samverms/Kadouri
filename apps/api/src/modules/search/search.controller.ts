import { Request, Response } from 'express'
import { searchService } from './search.service'

export const searchController = {
  async search(req: Request, res: Response) {
    try {
      const query = req.query.q as string

      if (!query || query.trim().length === 0) {
        return res.status(400).json({
          error: 'Search query is required',
        })
      }

      const results = await searchService.globalSearch(query.trim())

      return res.json({
        query: query.trim(),
        results,
        count: results.length,
      })
    } catch (error) {
      console.error('Search error:', error)
      return res.status(500).json({
        error: 'An error occurred while searching',
      })
    }
  },
}
