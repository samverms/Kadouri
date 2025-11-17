import { Router } from 'express'
import agentsService from './agents.service'

const router = Router()

// Create agent
router.post('/', async (req, res, next) => {
  try {
    const agent = await agentsService.createAgent(req.body)
    res.status(201).json(agent)
  } catch (error) {
    next(error)
  }
})

// Get all agents
router.get('/', async (req, res, next) => {
  try {
    const agents = await agentsService.getAllAgents()
    res.json(agents)
  } catch (error) {
    next(error)
  }
})

// Get agent by ID
router.get('/:id', async (req, res, next) => {
  try {
    const agent = await agentsService.getAgentById(req.params.id)
    res.json(agent)
  } catch (error) {
    next(error)
  }
})

// Update agent
router.put('/:id', async (req, res, next) => {
  try {
    const agent = await agentsService.updateAgent(req.params.id, req.body)
    res.json(agent)
  } catch (error) {
    next(error)
  }
})

// Delete agent
router.delete('/:id', async (req, res, next) => {
  try {
    await agentsService.deleteAgent(req.params.id)
    res.status(204).send()
  } catch (error) {
    next(error)
  }
})

export default router
