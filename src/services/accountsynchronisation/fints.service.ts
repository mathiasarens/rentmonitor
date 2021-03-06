import {AccountSettings} from '../../models';

export interface FintsService {
  fetchStatements(
    accountSettings: AccountSettings,
    from?: Date,
    to?: Date,
    tan?: string,
  ): Promise<FinTsAccountTransactionDTO[]>;

  fetchAccounts(
    fintsBlz: string,
    fintsUrl: string,
    fintsUser: string,
    fintsPassword: string,
  ): Promise<FinTsAccountDTO[]>;
}

export class FinTsAccountTransactionDTO {
  constructor(
    public rawstring: string,
    public date?: Date,
    public name?: string,
    public iban?: string,
    public bic?: string,
    public text?: string,
    public value?: number,
  ) {}
}

export class FinTsAccountDTO {
  constructor(
    public rawstring: string,
    public name?: string,
    public iban?: string,
    public bic?: string,
  ) {}
}
