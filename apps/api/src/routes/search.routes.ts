import { Router } from 'express'
import { searchController } from '../modules/search/search.controller'

const router = Router()

// Global search endpoint
router.get('/', searchController.search)

export default router
