import { Router } from 'express'
import { authenticate } from '../middleware/auth'
import { ContractPDFService } from '../services/pdf/contract-pdf.service'

const router = Router()
const contractPDFService = new ContractPDFService()

// Generate contract PDF
router.get('/contract/:id', authenticate, async (req, res, next) => {
  try {
    const { id } = req.params

    const pdfBuffer = await contractPDFService.generateContractPDF(id)

    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader('Content-Disposition', `attachment; filename="contract-${id}.pdf"`)
    res.send(pdfBuffer)
  } catch (error) {
    next(error)
  }
})

export default router
