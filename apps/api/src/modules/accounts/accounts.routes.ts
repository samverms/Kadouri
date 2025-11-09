import { Router } from 'express'
import { AccountsController } from './accounts.controller'

const router = Router()
const controller = new AccountsController()

router.get('/', controller.searchAccounts)
router.post('/', controller.createAccount)
router.get('/:id', controller.getAccount)
router.patch('/:id', controller.updateAccount)
router.post('/:id/link-qbo', controller.linkQboCustomer)
router.post('/:id/addresses', controller.addAddress)
router.post('/:id/contacts', controller.addContact)
router.get('/:id/addresses', controller.getAddresses)
router.get('/:id/contacts', controller.getContacts)

export { router as accountsRouter }
