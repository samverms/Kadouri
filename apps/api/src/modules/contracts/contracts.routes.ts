import { Router } from 'express'
import multer from 'multer'
import fs from 'fs/promises'
import path from 'path'
import contractsService from './contracts.service'
import emailService from '../../services/email/email-service'
import { AppError } from '../../middleware/error-handler'
import { AuthRequest } from '../../middleware/auth'

const router = Router()

// Configure multer to store files locally
const uploadDir = path.join(process.cwd(), 'uploads', 'contracts')
const upload = multer({
  storage: multer.diskStorage({
    destination: async (req, file, cb) => {
      // Create directory if it doesn't exist
      await fs.mkdir(uploadDir, { recursive: true })
      cb(null, uploadDir)
    },
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname)
      const filename = `${Date.now()}-${Math.round(Math.random() * 1E9)}${ext}`
      cb(null, filename)
    }
  })
})

// Note: Authentication is handled at the route level in routes/index.ts

/**
 * GET /api/contracts
 * Get all contracts with optional filters
 */
router.get('/', async (req, res, next) => {
  try {
    const { status, sellerId, buyerId, productId, validFrom, validUntil } = req.query

    const filters: any = {}
    if (status) filters.status = status as string
    if (sellerId) filters.sellerId = sellerId as string
    if (buyerId) filters.buyerId = buyerId as string
    if (productId) filters.productId = productId as string
    if (validFrom) filters.validFrom = new Date(validFrom as string)
    if (validUntil) filters.validUntil = new Date(validUntil as string)

    const contracts = await contractsService.getContracts(filters)
    res.json(contracts)
  } catch (error) {
    next(error)
  }
})

/**
 * GET /api/contracts/:id
 * Get contract by ID with related data
 */
router.get('/:id', async (req, res, next) => {
  try {
    const contract = await contractsService.getContractById(req.params.id)
    res.json(contract)
  } catch (error) {
    next(error)
  }
})

/**
 * POST /api/contracts
 * Create a new contract
 */
router.post('/', async (req, res, next) => {
  try {
    const authReq = req as AuthRequest
    const {
      sellerId,
      buyerId,
      productId,
      totalQuantity,
      unit,
      pricePerUnit,
      validFrom,
      validUntil,
      terms,
      notes,
    } = req.body

    // Validation
    if (!sellerId || !buyerId || !productId) {
      throw new AppError('Seller, buyer, and product are required', 400)
    }
    if (!totalQuantity || totalQuantity <= 0) {
      throw new AppError('Total quantity must be greater than 0', 400)
    }
    if (!pricePerUnit || pricePerUnit <= 0) {
      throw new AppError('Price per unit must be greater than 0', 400)
    }
    if (!unit) {
      throw new AppError('Unit is required', 400)
    }
    if (!validFrom || !validUntil) {
      throw new AppError('Valid from and valid until dates are required', 400)
    }

    const contract = await contractsService.createContract({
      sellerId,
      buyerId,
      productId,
      totalQuantity: parseFloat(totalQuantity),
      unit,
      pricePerUnit: parseFloat(pricePerUnit),
      validFrom: new Date(validFrom),
      validUntil: new Date(validUntil),
      terms,
      notes,
      createdBy: authReq.userId!,
    })

    res.status(201).json(contract)
  } catch (error) {
    next(error)
  }
})

/**
 * PUT /api/contracts/:id
 * Update a contract
 */
router.put('/:id', async (req, res, next) => {
  try {
    const {
      totalQuantity,
      unit,
      pricePerUnit,
      validFrom,
      validUntil,
      status,
      brokerName,
      brokerAddress,
      brokerPhone,
      brokerEmail,
      terms,
      notes,
    } = req.body

    const updateData: any = {}
    if (totalQuantity !== undefined) updateData.totalQuantity = parseFloat(totalQuantity)
    if (unit !== undefined) updateData.unit = unit
    if (pricePerUnit !== undefined) updateData.pricePerUnit = parseFloat(pricePerUnit)
    if (validFrom !== undefined) updateData.validFrom = new Date(validFrom)
    if (validUntil !== undefined) updateData.validUntil = new Date(validUntil)
    if (status !== undefined) updateData.status = status
    if (brokerName !== undefined) updateData.brokerName = brokerName
    if (brokerAddress !== undefined) updateData.brokerAddress = brokerAddress
    if (brokerPhone !== undefined) updateData.brokerPhone = brokerPhone
    if (brokerEmail !== undefined) updateData.brokerEmail = brokerEmail
    if (terms !== undefined) updateData.terms = terms
    if (notes !== undefined) updateData.notes = notes

    const updated = await contractsService.updateContract(req.params.id, updateData)
    res.json(updated)
  } catch (error) {
    next(error)
  }
})

/**
 * DELETE /api/contracts/:id
 * Delete a contract
 */
router.delete('/:id', async (req, res, next) => {
  try {
    await contractsService.deleteContract(req.params.id)
    res.json({ message: 'Contract deleted successfully' })
  } catch (error) {
    next(error)
  }
})

/**
 * GET /api/contracts/match
 * Find matching contracts for order creation
 */
router.get('/match', async (req, res, next) => {
  try {
    const { sellerId, buyerId, productId } = req.query

    if (!sellerId || !buyerId || !productId) {
      throw new AppError('Seller, buyer, and product IDs are required', 400)
    }

    const matches = await contractsService.findMatchingContracts(
      sellerId as string,
      buyerId as string,
      productId as string
    )

    res.json(matches)
  } catch (error) {
    next(error)
  }
})

/**
 * POST /api/contracts/:id/email
 * Send contract email to seller and/or buyer with themed templates
 */
router.post('/:id/email', async (req, res, next) => {
  try {
    const authReq = req as AuthRequest
    const { sendToSeller, sendToBuyer, message } = req.body

    if (!sendToSeller && !sendToBuyer) {
      throw new AppError('Must select at least one recipient', 400)
    }

    // Get contract with related data
    const contract = await contractsService.getContractById(req.params.id)

    // Send email
    const results = await emailService.sendContractEmail({
      userId: authReq.userId!,
      contract,
      sendToSeller: sendToSeller === true,
      sendToBuyer: sendToBuyer === true,
      message,
    })

    res.json(results)
  } catch (error) {
    next(error)
  }
})

/**
 * POST /api/contracts/:id/upload
 * Upload executed contract document
 */
router.post('/:id/upload', upload.single('file'), async (req, res, next) => {
  try {
    const authReq = req as AuthRequest & { file?: Express.Multer.File }
    const file = authReq.file

    if (!file) {
      throw new AppError('No file uploaded', 400)
    }

    // Get contract details
    const contract = await contractsService.getContractById(req.params.id)

    // File is already saved by multer to uploads/contracts/
    // Store the relative path from the project root
    const documentUrl = `/uploads/contracts/${file.filename}`

    // Update contract with document path
    await contractsService.updateExecutedDocument(
      req.params.id,
      documentUrl,
      file.mimetype,
      authReq.userId!
    )

    res.json({
      message: 'Document uploaded successfully',
      url: documentUrl,
      filename: file.originalname
    })
  } catch (error) {
    next(error)
  }
})

export default router

