import {inject} from '@loopback/core';
import {repository} from '@loopback/repository';
import {
  AccountSettings,
  AccountTransaction,
  AccountTransactionLog,
} from '../../models';
import {AccountTransactionLogRepository} from '../../repositories/account-transaction-log.repository';
import {AccountTransactionSaveService} from './account-transaction-save.service';
import {
  FinTsAccountTransactionDTO,
  FintsAccountTransactionSynchronization,
} from './fints.service';

export class AccountTransactionService {
  constructor(
    @repository(AccountTransactionLogRepository)
    private accountTransactionLogRepository: AccountTransactionLogRepository,
    @inject(
      'services.accountsynchronisation.FintsAccountTransactionSynchronization',
    )
    private fintsAccountTransactionSynchronization: FintsAccountTransactionSynchronization,
    @inject('services.accountsynchronisation.AccountTransactionSaveService')
    private accountTransactionSaveService: AccountTransactionSaveService,
  ) {}

  public async retrieveAndSaveAccountTransactions(
    now: Date,
    accountSettings: AccountSettings,
  ) {
    const rawAccountTransactions: FinTsAccountTransactionDTO[] = await this.fintsAccountTransactionSynchronization.load(
      accountSettings.fintsBlz!,
      accountSettings.fintsUrl!,
      accountSettings.fintsUser!,
      accountSettings.fintsPassword!,
    );
    await this.logAccountTransactions(
      now,
      accountSettings,
      rawAccountTransactions,
    );
    const accountTransactions: AccountTransaction[] = rawAccountTransactions.map(
      at => this.convertToAccountTransaction(accountSettings, at),
    );
    await this.accountTransactionSaveService.saveNewAccountTransactions(
      accountSettings,
      accountTransactions,
    );
  }

  private convertToAccountTransaction(
    accountSettings: AccountSettings,
    rawAccountTransaction: FinTsAccountTransactionDTO,
  ): AccountTransaction {
    return new AccountTransaction({
      clientId: accountSettings.clientId,
      accountSettingsId: accountSettings.id,
      date: rawAccountTransaction.date,
      name: rawAccountTransaction.name,
      bic: rawAccountTransaction.bic,
      iban: rawAccountTransaction.iban,
      text: rawAccountTransaction.text,
      amount: rawAccountTransaction.value,
    });
  }

  private async logAccountTransactions(
    now: Date,
    accountSettings: AccountSettings,
    rawAccountTransactions: FinTsAccountTransactionDTO[],
  ) {
    const accountTransactionsToSave: AccountTransactionLog[] = rawAccountTransactions.map(
      at =>
        new AccountTransactionLog({
          clientId: accountSettings.clientId,
          accountSettingsId: accountSettings.id,
          time: now,
          rawstring: at.rawstring,
        }),
    );
    await this.accountTransactionLogRepository.createAll(
      accountTransactionsToSave,
    );
  }
}