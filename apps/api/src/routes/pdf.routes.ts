import { Router } from 'express'
import { authenticate } from '../middleware/auth'
import { ContractPDFService } from '../services/pdf/contract-pdf.service'
import { InvoicePDFService } from '../services/pdf/invoice-pdf.service'

const router = Router()
const contractPDFService = new ContractPDFService()
const invoicePDFService = new InvoicePDFService()

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

// Generate invoice PDF for seller or buyer
router.get('/invoice/:orderId/:type', authenticate, async (req, res, next) => {
  try {
    const { orderId, type } = req.params
    const userId = (req as any).auth?.userId // Get Clerk user ID from auth middleware

    if (type !== 'seller' && type !== 'buyer') {
      return res.status(400).json({ error: 'Type must be either "seller" or "buyer"' })
    }

    const pdfBuffer = await invoicePDFService.generateInvoicePDF(orderId, type as 'seller' | 'buyer', userId)

    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader('Content-Disposition', `attachment; filename="invoice-${orderId}-${type}.pdf"`)
    res.send(pdfBuffer)
  } catch (error) {
    next(error)
  }
})

export default router
