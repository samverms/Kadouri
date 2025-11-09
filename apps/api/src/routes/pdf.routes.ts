import { Router } from 'express'
import { PDFGenerator } from '../services/pdf/pdf-generator'

const router = Router()
const pdfGenerator = new PDFGenerator()

/**
 * Generate Seller PDF
 * POST /api/pdf/order/seller
 */
router.post('/order/seller', async (req, res) => {
  try {
    const orderData = req.body

    // Validate required fields
    if (!orderData.orderNo || !orderData.seller || !orderData.buyer) {
      return res.status(400).json({
        error: 'Missing required order data',
      })
    }

    const pdfBuffer = await pdfGenerator.generateSellerPDFBuffer(orderData)

    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader('Content-Disposition', `inline; filename="seller-${orderData.orderNo}.pdf"`)
    res.send(pdfBuffer)
  } catch (error: any) {
    console.error('Error generating seller PDF:', error)
    res.status(500).json({
      error: 'Failed to generate seller PDF',
      message: error.message,
    })
  }
})

/**
 * Generate Buyer PDF
 * POST /api/pdf/order/buyer
 */
router.post('/order/buyer', async (req, res) => {
  try {
    const orderData = req.body

    // Validate required fields
    if (!orderData.orderNo || !orderData.seller || !orderData.buyer) {
      return res.status(400).json({
        error: 'Missing required order data',
      })
    }

    const pdfBuffer = await pdfGenerator.generateBuyerPDFBuffer(orderData)

    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader('Content-Disposition', `inline; filename="buyer-${orderData.orderNo}.pdf"`)
    res.send(pdfBuffer)
  } catch (error: any) {
    console.error('Error generating buyer PDF:', error)
    res.status(500).json({
      error: 'Failed to generate buyer PDF',
      message: error.message,
    })
  }
})

export default router
