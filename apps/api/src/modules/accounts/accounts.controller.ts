import { Request, Response, NextFunction } from 'express'
import { AccountsService } from './accounts.service'
import { createAccountSchema, createAddressSchema, createContactSchema } from '@pace/shared'
import { AuthRequest } from '../../middleware/auth'

export class AccountsController {
  private accountsService: AccountsService

  constructor() {
    this.accountsService = new AccountsService()
  }

  createAccount = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const validated = createAccountSchema.parse(req.body)
      const account = await this.accountsService.createAccount(validated)
      res.status(201).json(account)
    } catch (error) {
      next(error)
    }
  }

  getAccount = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const account = await this.accountsService.getAccount(req.params.id)
      res.json(account)
    } catch (error) {
      next(error)
    }
  }

  searchAccounts = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { search, limit } = req.query
      const accounts = await this.accountsService.searchAccounts(
        search as string,
        limit ? parseInt(limit as string) : undefined
      )
      res.json(accounts)
    } catch (error) {
      next(error)
    }
  }

  updateAccount = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const account = await this.accountsService.updateAccount(req.params.id, req.body)
      res.json(account)
    } catch (error) {
      next(error)
    }
  }

  linkQboCustomer = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { qboCustomerId } = req.body
      const account = await this.accountsService.linkQboCustomer(
        req.params.id,
        qboCustomerId
      )
      res.json(account)
    } catch (error) {
      next(error)
    }
  }

  addAddress = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const validated = createAddressSchema.parse({
        ...req.body,
        accountId: req.params.id,
      })
      const address = await this.accountsService.addAddress(req.params.id, validated)
      res.status(201).json(address)
    } catch (error) {
      next(error)
    }
  }

  addContact = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const validated = createContactSchema.parse({
        ...req.body,
        accountId: req.params.id,
      })
      const contact = await this.accountsService.addContact(req.params.id, validated)
      res.status(201).json(contact)
    } catch (error) {
      next(error)
    }
  }

  getAddresses = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const addresses = await this.accountsService.getAddresses(req.params.id)
      res.json(addresses)
    } catch (error) {
      next(error)
    }
  }

  getContacts = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const contacts = await this.accountsService.getContacts(req.params.id)
      res.json(contacts)
    } catch (error) {
      next(error)
    }
  }
}
