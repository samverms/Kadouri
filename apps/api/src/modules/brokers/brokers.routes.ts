import { Router } from 'express'
import brokersService from './brokers.service'

const router = Router()

// Create broker
router.post('/', async (req, res, next) => {
  try {
    const broker = await brokersService.createBroker(req.body)
    res.status(201).json(broker)
  } catch (error) {
    next(error)
  }
})

// Get all brokers
router.get('/', async (req, res, next) => {
  try {
    const brokers = await brokersService.getAllBrokers()
    console.log('=== BROKERS API RESPONSE ===')
    console.log('Total brokers:', brokers.length)
    console.log('Brokers data:', JSON.stringify(brokers, null, 2))
    console.log('============================')
    res.json(brokers)
  } catch (error) {
    console.error('Error fetching brokers:', error)
    next(error)
  }
})

// Get broker by ID
router.get('/:id', async (req, res, next) => {
  try {
    const broker = await brokersService.getBrokerById(req.params.id)
    res.json(broker)
  } catch (error) {
    next(error)
  }
})

// Update broker
router.put('/:id', async (req, res, next) => {
  try {
    const broker = await brokersService.updateBroker(req.params.id, req.body)
    res.json(broker)
  } catch (error) {
    next(error)
  }
})

// Delete broker
router.delete('/:id', async (req, res, next) => {
  try {
    await brokersService.deleteBroker(req.params.id)
    res.status(204).send()
  } catch (error) {
    next(error)
  }
})

export default router
