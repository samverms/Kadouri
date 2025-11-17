export interface QBOTokens {
  access_token: string
  refresh_token: string
  expires_in: number
  x_refresh_token_expires_in: number
  token_type: string
  realmId: string
}

export interface QBOCustomer {
  Id?: string
  DisplayName: string
  CompanyName?: string
  GivenName?: string
  FamilyName?: string
  PrimaryEmailAddr?: {
    Address: string
  }
  PrimaryPhone?: {
    FreeFormNumber: string
  }
  BillAddr?: QBOAddress
  ShipAddr?: QBOAddress
}

export interface QBOAddress {
  Line1?: string
  Line2?: string
  City?: string
  CountrySubDivisionCode?: string // State
  PostalCode?: string
  Country?: string
}

export interface QBOItem {
  Id?: string
  Name: string
  Type: 'Service' | 'Inventory'
  IncomeAccountRef?: {
    value: string
    name: string
  }
  ExpenseAccountRef?: {
    value: string
    name: string
  }
  UnitPrice?: number
  QtyOnHand?: number
  InvStartDate?: string
}

export interface QBOInvoice {
  Id?: string
  DocNumber?: string
  SyncToken?: string
  TxnDate: string
  CustomerRef: {
    value: string
    name?: string
  }
  Line: QBOInvoiceLine[]
  BillEmail?: {
    Address: string
  }
  PrivateNote?: string
  CustomerMemo?: {
    value: string
  }
  TxnTaxDetail?: {
    TotalTax: number
  }
  TotalAmt?: number
  Balance?: number
}

export interface QBOInvoiceLine {
  Id?: string
  LineNum?: number
  Description?: string
  Amount: number
  DetailType: 'SalesItemLineDetail'
  SalesItemLineDetail: {
    ItemRef: {
      value: string
      name?: string
    }
    UnitPrice?: number
    Qty?: number
    TaxCodeRef?: {
      value: string
    }
  }
}

export interface QBOEstimate {
  Id?: string
  DocNumber?: string
  TxnDate: string
  CustomerRef: {
    value: string
    name?: string
  }
  Line: QBOInvoiceLine[]
  PrivateNote?: string
  CustomerMemo?: {
    value: string
  }
  TotalAmt?: number
}

export interface QBOPayment {
  Id: string
  TotalAmt: number
  TxnDate: string
  CustomerRef: {
    value: string
    name: string
  }
  Line: Array<{
    Amount: number
    LinkedTxn: Array<{
      TxnId: string
      TxnType: string
    }>
  }>
}

export interface QBOWebhookEvent {
  eventNotifications: Array<{
    realmId: string
    dataChangeEvent: {
      entities: Array<{
        name: string
        id: string
        operation: 'Create' | 'Update' | 'Delete' | 'Merge'
        lastUpdated: string
      }>
    }
  }>
}
