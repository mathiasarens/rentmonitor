import {Getter} from '@loopback/context';
import {expect} from '@loopback/testlab';
import {AccountSettings, Client} from '../../../models';
import {
  AccountSettingsRepository,
  ClientRepository,
} from '../../../repositories';
import {testdb} from '../../fixtures/datasources/rentmontior.datasource';
import {givenEmptyDatabase} from '../../helpers/database.helpers';

describe('Account Settings Repository Integration Tests', () => {
  let clientRepository: ClientRepository;
  let accountSettingsRepository: AccountSettingsRepository;

  beforeEach('setupApplication', async () => {
    await givenEmptyDatabase();

    clientRepository = new ClientRepository(testdb);
    const clientRepositoryGetter = Getter.fromValue(clientRepository);
    accountSettingsRepository = new AccountSettingsRepository(
      testdb,
      clientRepositoryGetter,
      'test_password',
      'test_salt',
    );
  });

  after(async () => {});

  it('should create accountSettings with fints params', async function () {
    // given
    const dbClient: Client = await clientRepository.create({
      name: 'Rentmonitor Test',
    });

    // when
    await accountSettingsRepository.create({
      clientId: dbClient.id,
      name: 'Konto1',
      fintsBlz: '12345678',
      fintsUrl: 'https://fints.bank.com',
      fintsUser: 'login',
      fintsPassword: 'password',
    });

    // then
    const accountSettingsFromDb = await accountSettingsRepository.find();
    expect(accountSettingsFromDb.length).to.equal(1);
    expect(accountSettingsFromDb[0].clientId).to.equal(dbClient.id);
    expect(accountSettingsFromDb[0].name).to.equal('Konto1');
    expect(accountSettingsFromDb[0].fintsBlz).to.equal('12345678');
    expect(accountSettingsFromDb[0].fintsUrl).to.equal(
      'https://fints.bank.com',
    );
    expect(accountSettingsFromDb[0].fintsUser).to.equal('login');
    expect(accountSettingsFromDb[0].fintsPassword).to.equal('password');
  });

  it('should update accountSettings.tanRequiredError', async function () {
    // given
    const dbClient: Client = await clientRepository.create({
      name: 'Rentmonitor Test',
    });

    // when
    await accountSettingsRepository.create({
      clientId: dbClient.id,
      name: 'Konto1',
      fintsBlz: '12345678',
      fintsUrl: 'https://fints.bank.com',
      fintsUser: 'login',
      fintsPassword: 'password',
    });

    // then
    const accountSettingsFromDbList1 = await accountSettingsRepository.find();
    expect(accountSettingsFromDbList1.length).to.equal(1);
    const accountSettingsFromDb1 = accountSettingsFromDbList1[0];
    accountSettingsFromDb1.fintsTanRequiredError = 'tanRequiredError';
    await accountSettingsRepository.update(
      new AccountSettings(accountSettingsFromDb1),
    );
    const accountSettingsFromDbList2 = await accountSettingsRepository.find();
    expect(accountSettingsFromDbList2[0].clientId).to.equal(dbClient.id);
    expect(accountSettingsFromDbList2[0].name).to.equal('Konto1');
    expect(accountSettingsFromDbList2[0].fintsBlz).to.equal('12345678');
    expect(accountSettingsFromDbList2[0].fintsUrl).to.equal(
      'https://fints.bank.com',
    );
    expect(accountSettingsFromDbList2[0].fintsUser).to.equal('login');
    expect(accountSettingsFromDbList2[0].fintsPassword).to.equal('password');
    expect(accountSettingsFromDbList2[0].fintsTanRequiredError).to.equal(
      'tanRequiredError',
    );
  });
});
