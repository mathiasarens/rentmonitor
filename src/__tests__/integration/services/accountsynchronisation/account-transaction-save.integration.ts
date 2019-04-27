import {expect} from '@loopback/testlab';
import {AccountSettings, AccountTransaction} from '../../../../models';
import {AccountTransactionRepository} from '../../../../repositories';
import {AccountSynchronisationSaveService} from '../../../../services/accountsynchronisation/account-synchronisation-save.service';
import {testdb} from '../../../fixtures/datasources/rentmontior.datasource';
import {givenEmptyDatabase} from '../../../helpers/database.helpers';

describe('Account Transaction Save Service Integration Tests', () => {
  let accountTransactionRepository: AccountTransactionRepository;
  let accountTransactionSaveService: AccountSynchronisationSaveService;

  beforeEach('setup service and database', async () => {
    await givenEmptyDatabase();

    accountTransactionRepository = new AccountTransactionRepository(testdb);

    accountTransactionSaveService = new AccountSynchronisationSaveService(
      accountTransactionRepository,
    );
  });

  after(async () => {});

  it('should save new transactions on an empty database', async function() {
    // given
    const accountSettings = new AccountSettings({id: 1, clientId: 2});
    const accountTransactions = [
      new AccountTransaction({
        clientId: 2,
        accountSettingsId: 1,
        date: new Date(2019, 3, 14),
        iban: 'IBAN1',
        bic: 'BIC1',
        name: 'NAME1',
        text: 'text1',
        amount: 1000,
      }),
    ];

    // when
    const newTransactionsList = await accountTransactionSaveService.saveNewAccountTransactions(
      accountSettings,
      accountTransactions,
    );

    // then
    const savedAccountTransactions: AccountTransaction[] = await accountTransactionRepository.find(
      {
        where: {clientId: 2, accountSettingsId: 1},
        order: ['date ASC'],
      },
    );
    expect(savedAccountTransactions).length(1);
    expect(newTransactionsList).length(1);
  });

  it('should save new transactions which are newer than an existing transaction', async function() {
    // given
    const accountSettings = new AccountSettings({id: 1, clientId: 2});
    const newAccountTransactions = [
      new AccountTransaction({
        clientId: 2,
        accountSettingsId: 1,
        date: new Date(2019, 3, 13),
        iban: 'IBAN1',
        bic: 'BIC1',
        name: 'NAME1',
        text: 'text1',
        amount: 1000,
      }),

      new AccountTransaction({
        clientId: 2,
        accountSettingsId: 1,
        date: new Date(2019, 3, 14),
        iban: 'IBAN1',
        bic: 'BIC1',
        name: 'NAME1',
        text: 'text1',
        amount: 500,
      }),
    ];

    await accountTransactionRepository.create({
      clientId: 2,
      accountSettingsId: 1,
      date: new Date(2018, 0, 1),
      iban: 'IBAN1',
      bic: 'BIC1',
      name: 'NAME1',
      text: 'text1',
      amount: 500,
    });

    // when
    const newTransactionsList = await accountTransactionSaveService.saveNewAccountTransactions(
      accountSettings,
      newAccountTransactions,
    );

    // then
    const savedAccountTransactions: AccountTransaction[] = await accountTransactionRepository.find(
      {
        where: {clientId: 2, accountSettingsId: 1},
        order: ['date ASC'],
      },
    );
    expect(savedAccountTransactions).length(3);
    expect(newTransactionsList).length(2);
  });

  it('should save new transactions which are almost equal to an existing transaction except for one field', async function() {
    // given
    const accountSettings = new AccountSettings({id: 1, clientId: 2});
    const newAccountTransactions = [
      new AccountTransaction({
        clientId: 2,
        accountSettingsId: 1,
        date: new Date(2019, 3, 14),
        iban: 'IBAN',
        bic: 'BIC',
        name: 'NAME',
        text: 'text',
        amount: 1000,
      }),
      new AccountTransaction({
        clientId: 2,
        accountSettingsId: 1,
        date: new Date(2019, 3, 13),
        iban: 'DIFFRENT-IBAN',
        bic: 'BIC',
        name: 'NAME',
        text: 'text',
        amount: 1000,
      }),
      new AccountTransaction({
        clientId: 2,
        accountSettingsId: 1,
        date: new Date(2019, 3, 13),
        iban: 'IBAN',
        bic: 'DIFFRENT-BIC',
        name: 'NAME',
        text: 'text',
        amount: 1000,
      }),
      new AccountTransaction({
        clientId: 2,
        accountSettingsId: 1,
        date: new Date(2019, 3, 13),
        iban: 'IBAN',
        bic: 'BIC',
        name: 'DIFFRENT-NAME',
        text: 'text',
        amount: 1000,
      }),
      new AccountTransaction({
        clientId: 2,
        accountSettingsId: 1,
        date: new Date(2019, 3, 13),
        iban: 'IBAN',
        bic: 'BIC',
        name: 'NAME',
        text: 'DIFFRENT-text',
        amount: 1000,
      }),
      new AccountTransaction({
        clientId: 2,
        accountSettingsId: 1,
        date: new Date(2019, 3, 13),
        iban: 'IBAN',
        bic: 'BIC',
        name: 'NAME',
        text: 'text',
        amount: 2000,
      }),
    ];

    await accountTransactionRepository.create({
      clientId: 2,
      accountSettingsId: 1,
      date: new Date(2018, 3, 13),
      iban: 'IBAN',
      bic: 'BIC',
      name: 'NAME',
      text: 'text',
      amount: 1000,
    });

    // when
    const newTransactionsList = await accountTransactionSaveService.saveNewAccountTransactions(
      accountSettings,
      newAccountTransactions,
    );

    // then
    const savedAccountTransactions: AccountTransaction[] = await accountTransactionRepository.find(
      {
        where: {clientId: 2, accountSettingsId: 1},
        order: ['date ASC'],
      },
    );
    expect(savedAccountTransactions).length(7);
    expect(newTransactionsList).length(6);
  });

  it('should save 2 new transactions but not override an duplicate one', async function() {
    // given
    const accountSettings = new AccountSettings({id: 1, clientId: 2});
    const newAccountTransactions = [
      new AccountTransaction({
        clientId: 2,
        accountSettingsId: 1,
        date: new Date(2019, 3, 13),
        iban: 'IBAN',
        bic: 'BIC',
        name: 'NAME',
        text: 'text',
        amount: 1000,
      }),
      new AccountTransaction({
        clientId: 2,
        accountSettingsId: 1,
        date: new Date(2019, 3, 13),
        iban: 'IBAN',
        bic: 'BIC',
        name: 'NAME',
        text: 'text',
        amount: 1000,
      }),
      new AccountTransaction({
        clientId: 2,
        accountSettingsId: 1,
        date: new Date(2019, 3, 13),
        iban: 'IBAN',
        bic: 'BIC',
        name: 'NAME',
        text: 'text',
        amount: 1000,
      }),
    ];

    await accountTransactionRepository.create({
      clientId: 2,
      accountSettingsId: 1,
      date: new Date(2019, 3, 13),
      iban: 'IBAN',
      bic: 'BIC',
      name: 'NAME',
      text: 'text',
      amount: 1000,
    });

    // when
    const newTransactionsList = await accountTransactionSaveService.saveNewAccountTransactions(
      accountSettings,
      newAccountTransactions,
    );

    // then
    const savedAccountTransactions: AccountTransaction[] = await accountTransactionRepository.find(
      {
        where: {clientId: 2, accountSettingsId: 1},
        order: ['date ASC'],
      },
    );
    expect(savedAccountTransactions).length(3);
    expect(newTransactionsList).length(2);
  });

  it('should save a new transactions but not override two duplicates', async function() {
    // given
    const accountSettings = new AccountSettings({id: 1, clientId: 2});
    const newAccountTransactions = [
      new AccountTransaction({
        clientId: 2,
        accountSettingsId: 1,
        date: new Date(2019, 3, 13),
        iban: 'IBAN',
        bic: 'BIC',
        name: 'NAME',
        text: 'text',
        amount: 1000,
      }),
      new AccountTransaction({
        clientId: 2,
        accountSettingsId: 1,
        date: new Date(2019, 3, 13),
        iban: 'IBAN',
        bic: 'BIC',
        name: 'NAME',
        text: 'text',
        amount: 1000,
      }),
      new AccountTransaction({
        clientId: 2,
        accountSettingsId: 1,
        date: new Date(2019, 3, 13),
        iban: 'IBAN',
        bic: 'BIC',
        name: 'NAME',
        text: 'text',
        amount: 1000,
      }),
    ];

    await accountTransactionRepository.create({
      clientId: 2,
      accountSettingsId: 1,
      date: new Date(2019, 3, 13),
      iban: 'IBAN',
      bic: 'BIC',
      name: 'NAME',
      text: 'text',
      amount: 1000,
    });

    await accountTransactionRepository.create({
      clientId: 2,
      accountSettingsId: 1,
      date: new Date(2019, 3, 13),
      iban: 'IBAN',
      bic: 'BIC',
      name: 'NAME',
      text: 'text',
      amount: 1000,
    });

    // when
    const newTransactionsList = await accountTransactionSaveService.saveNewAccountTransactions(
      accountSettings,
      newAccountTransactions,
    );

    // then
    const savedAccountTransactions: AccountTransaction[] = await accountTransactionRepository.find(
      {
        where: {clientId: 2, accountSettingsId: 1},
        order: ['date ASC'],
      },
    );
    expect(savedAccountTransactions).length(3);
    expect(newTransactionsList).length(1);
  });

  it('should save new duplicate transactions in empty database', async function() {
    // given
    const accountSettings = new AccountSettings({id: 1, clientId: 2});
    const newAccountTransactions = [
      new AccountTransaction({
        clientId: 2,
        accountSettingsId: 1,
        date: new Date(2019, 3, 13),
        iban: 'IBAN',
        bic: 'BIC',
        name: 'NAME',
        text: 'text',
        amount: 1000,
      }),
      new AccountTransaction({
        clientId: 2,
        accountSettingsId: 1,
        date: new Date(2019, 3, 13),
        iban: 'IBAN',
        bic: 'BIC',
        name: 'NAME',
        text: 'text',
        amount: 1000,
      }),
      new AccountTransaction({
        clientId: 2,
        accountSettingsId: 1,
        date: new Date(2019, 3, 13),
        iban: 'IBAN',
        bic: 'BIC',
        name: 'NAME',
        text: 'text',
        amount: 1000,
      }),
    ];

    // when
    const newTransactionsList = await accountTransactionSaveService.saveNewAccountTransactions(
      accountSettings,
      newAccountTransactions,
    );

    // then
    const savedAccountTransactions: AccountTransaction[] = await accountTransactionRepository.find(
      {
        where: {clientId: 2, accountSettingsId: 1},
        order: ['date ASC'],
      },
    );
    expect(savedAccountTransactions).length(3);
    expect(newTransactionsList).length(3);
  });

  it('should save new transactions if new transactions are inbetween old transactions', async function() {
    // given
    const accountSettings = new AccountSettings({id: 1, clientId: 2});
    const newAccountTransactions = [
      new AccountTransaction({
        clientId: 2,
        accountSettingsId: 1,
        date: new Date(2019, 3, 1),
        iban: 'IBAN',
        bic: 'BIC',
        name: 'NAME',
        text: 'text',
        amount: 1000,
      }),
      new AccountTransaction({
        clientId: 2,
        accountSettingsId: 1,
        date: new Date(2019, 3, 3),
        iban: 'IBAN',
        bic: 'BIC',
        name: 'NAME',
        text: 'text',
        amount: 1000,
      }),
      new AccountTransaction({
        clientId: 2,
        accountSettingsId: 1,
        date: new Date(2019, 3, 5),
        iban: 'IBAN',
        bic: 'BIC',
        name: 'NAME',
        text: 'text',
        amount: 1000,
      }),
    ];

    await accountTransactionRepository.create({
      clientId: 2,
      accountSettingsId: 1,
      date: new Date(2018, 3, 2),
      iban: 'IBAN',
      bic: 'BIC',
      name: 'NAME',
      text: 'text',
      amount: 1000,
    });

    await accountTransactionRepository.create({
      clientId: 2,
      accountSettingsId: 1,
      date: new Date(2018, 3, 4),
      iban: 'IBAN',
      bic: 'BIC',
      name: 'NAME',
      text: 'text',
      amount: 1000,
    });

    // when
    const newTransactionsList = await accountTransactionSaveService.saveNewAccountTransactions(
      accountSettings,
      newAccountTransactions,
    );

    // then
    const savedAccountTransactions: AccountTransaction[] = await accountTransactionRepository.find(
      {
        where: {clientId: 2, accountSettingsId: 1},
        order: ['date ASC'],
      },
    );
    expect(savedAccountTransactions).length(5);
    expect(newTransactionsList).length(3);
  });
});
