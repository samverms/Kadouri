import axios, { AxiosInstance } from 'axios'
import { qboClient, QBO_API_BASE_URL } from './config'
import { logger } from '../../utils/logger'
import { AppError } from '../../middleware/error-handler'
import {
  QBOCustomer,
  QBOItem,
  QBOInvoice,
  QBOEstimate,
  QBOPayment,
  QBOTokens,
} from './types'

export class QuickBooksClient {
  private realmId: string
  private axiosInstance: AxiosInstance

  constructor(tokens: QBOTokens) {
    this.realmId = tokens.realmId

    this.axiosInstance = axios.create({
      baseURL: `${QBO_API_BASE_URL}/v3/company/${this.realmId}`,
      headers: {
        Authorization: `Bearer ${tokens.access_token}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
    })

    // Add retry logic for rate limiting
    this.axiosInstance.interceptors.response.use(
      (response) => response,
      async (error) => {
        if (error.response?.status === 429) {
          const retryAfter = parseInt(error.response.headers['retry-after'] || '5', 10)
          logger.warn(`QBO rate limit hit, retrying after ${retryAfter}s`)
          await this.sleep(retryAfter * 1000)
          return this.axiosInstance.request(error.config)
        }
        return Promise.reject(error)
      }
    )
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }

  // Customer operations
  async getCustomer(customerId: string): Promise<QBOCustomer> {
    try {
      const response = await this.axiosInstance.get(`/customer/${customerId}`)
      return response.data.Customer
    } catch (error: any) {
      logger.error(`Failed to get QBO customer ${customerId}:`, error.message)
      throw new AppError('Failed to fetch customer from QuickBooks', 500)
    }
  }

  async findCustomerByName(name: string): Promise<QBOCustomer | null> {
    try {
      const query = `SELECT * FROM Customer WHERE DisplayName='${name.replace(/'/g, "\\'")}'`
      const response = await this.axiosInstance.get('/query', {
        params: { query },
      })
      return response.data.QueryResponse?.Customer?.[0] || null
    } catch (error: any) {
      logger.error('Failed to find QBO customer:', error.message)
      return null
    }
  }

  async createCustomer(customer: QBOCustomer): Promise<QBOCustomer> {
    try {
      const response = await this.axiosInstance.post('/customer', customer)
      return response.data.Customer
    } catch (error: any) {
      logger.error('Failed to create QBO customer:', error.message)
      throw new AppError('Failed to create customer in QuickBooks', 500)
    }
  }

  async updateCustomer(customer: QBOCustomer): Promise<QBOCustomer> {
    try {
      const response = await this.axiosInstance.post('/customer', customer, {
        params: { operation: 'update' },
      })
      return response.data.Customer
    } catch (error: any) {
      logger.error('Failed to update QBO customer:', error.message)
      throw new AppError('Failed to update customer in QuickBooks', 500)
    }
  }

  // Item operations
  async getItem(itemId: string): Promise<QBOItem> {
    try {
      const response = await this.axiosInstance.get(`/item/${itemId}`)
      return response.data.Item
    } catch (error: any) {
      logger.error(`Failed to get QBO item ${itemId}:`, error.message)
      throw new AppError('Failed to fetch item from QuickBooks', 500)
    }
  }

  async findItemByName(name: string): Promise<QBOItem | null> {
    try {
      const query = `SELECT * FROM Item WHERE Name='${name.replace(/'/g, "\\'")}'`
      const response = await this.axiosInstance.get('/query', {
        params: { query },
      })
      return response.data.QueryResponse?.Item?.[0] || null
    } catch (error: any) {
      logger.error('Failed to find QBO item:', error.message)
      return null
    }
  }

  async createItem(item: QBOItem): Promise<QBOItem> {
    try {
      const response = await this.axiosInstance.post('/item', item)
      return response.data.Item
    } catch (error: any) {
      logger.error('Failed to create QBO item:', error.message)
      throw new AppError('Failed to create item in QuickBooks', 500)
    }
  }

  // Invoice operations
  async getInvoice(invoiceId: string): Promise<QBOInvoice> {
    try {
      const response = await this.axiosInstance.get(`/invoice/${invoiceId}`)
      return response.data.Invoice
    } catch (error: any) {
      logger.error(`Failed to get QBO invoice ${invoiceId}:`, error.message)
      throw new AppError('Failed to fetch invoice from QuickBooks', 500)
    }
  }

  async createInvoice(invoice: QBOInvoice): Promise<QBOInvoice> {
    try {
      const response = await this.axiosInstance.post('/invoice', invoice)
      logger.info(`Created QBO invoice: ${response.data.Invoice.Id}`)
      return response.data.Invoice
    } catch (error: any) {
      logger.error('Failed to create QBO invoice:', error.message)
      throw new AppError('Failed to create invoice in QuickBooks', 500)
    }
  }

  async updateInvoice(invoice: QBOInvoice): Promise<QBOInvoice> {
    try {
      const response = await this.axiosInstance.post('/invoice', invoice, {
        params: { operation: 'update' },
      })
      return response.data.Invoice
    } catch (error: any) {
      logger.error('Failed to update QBO invoice:', error.message)
      throw new AppError('Failed to update invoice in QuickBooks', 500)
    }
  }

  // Estimate operations
  async getEstimate(estimateId: string): Promise<QBOEstimate> {
    try {
      const response = await this.axiosInstance.get(`/estimate/${estimateId}`)
      return response.data.Estimate
    } catch (error: any) {
      logger.error(`Failed to get QBO estimate ${estimateId}:`, error.message)
      throw new AppError('Failed to fetch estimate from QuickBooks', 500)
    }
  }

  async createEstimate(estimate: QBOEstimate): Promise<QBOEstimate> {
    try {
      const response = await this.axiosInstance.post('/estimate', estimate)
      logger.info(`Created QBO estimate: ${response.data.Estimate.Id}`)
      return response.data.Estimate
    } catch (error: any) {
      logger.error('Failed to create QBO estimate:', error.message)
      throw new AppError('Failed to create estimate in QuickBooks', 500)
    }
  }

  // Payment operations
  async getPayment(paymentId: string): Promise<QBOPayment> {
    try {
      const response = await this.axiosInstance.get(`/payment/${paymentId}`)
      return response.data.Payment
    } catch (error: any) {
      logger.error(`Failed to get QBO payment ${paymentId}:`, error.message)
      throw new AppError('Failed to fetch payment from QuickBooks', 500)
    }
  }

  async getInvoicePayments(invoiceId: string): Promise<QBOPayment[]> {
    try {
      const query = `SELECT * FROM Payment WHERE Line.LinkedTxn.TxnId='${invoiceId}'`
      const response = await this.axiosInstance.get('/query', {
        params: { query },
      })
      return response.data.QueryResponse?.Payment || []
    } catch (error: any) {
      logger.error('Failed to get invoice payments:', error.message)
      return []
    }
  }

  // Void invoice in QuickBooks
  async voidInvoice(invoiceId: string, syncToken: string): Promise<QBOInvoice> {
    try {
      const voidPayload = {
        Id: invoiceId,
        SyncToken: syncToken,
        sparse: true,
        PrivateNote: 'Invoice voided via PACE CRM'
      }

      const response = await this.axiosInstance.post(`/invoice?operation=void`, voidPayload, {
        params: { minorversion: '65' }
      })

      logger.info(`Voided invoice ${invoiceId} in QuickBooks`)
      return response.data.Invoice
    } catch (error: any) {
      logger.error(`Failed to void QBO invoice ${invoiceId}:`, error.message)
      throw new AppError('Failed to void invoice in QuickBooks', 500)
    }
  }
}
