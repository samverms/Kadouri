declare module 'intuit-oauth' {
  export default class OAuthClient {
    constructor(config: {
      clientId: string
      clientSecret: string
      environment: string
      redirectUri: string
    })

    static scopes: {
      Accounting: string
      Payment: string
      Payroll: string
      TimeTracking: string
      Benefits: string
    }

    authorizeUri(params: { scope: string[]; state: string }): string
    createToken(uri: string): Promise<any>
    refresh(): Promise<any>
    revoke(params: any): Promise<any>
    setToken(token: { access_token: string; refresh_token?: string }): void
    getToken(): any
    isAccessTokenValid(): boolean
  }
}
