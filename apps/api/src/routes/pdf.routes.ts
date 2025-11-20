import { Router } from 'express'
import { authenticate } from '../middleware/auth'
import { ContractPDFService } from '../services/pdf/contract-pdf.service'
import { logger } from '../utils/logger'

const router = Router()
const contractPDFService = new ContractPDFService()

/**
 * Generate PDF for a contract
 * GET /api/pdf/contract/:id
 */
router.get('/contract/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params

    logger.info(`Generating PDF for contract ${id}`)

    const pdfBuffer = await contractPDFService.generateContractPDF(id)

    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader('Content-Disposition', `attachment; filename="contract-${id}.pdf"`)
    res.setHeader('Content-Length', pdfBuffer.length)

    res.send(pdfBuffer)
  } catch (error: any) {
    logger.error('Failed to generate contract PDF', error)
    res.status(500).json({ error: error.message || 'Failed to generate PDF' })
  }
})

export default router
