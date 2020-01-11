import {expect} from '@loopback/testlab';
import {FintsService} from '../../../services/accountsynchronisation/fints.service';

describe.skip('FinTs Integration', () => {
  let fints: FintsService;

  before('setupApplication', async () => {
    fints = new FintsService();
  });

  after(async () => {});

  it('should get account transactions', async function() {
    // when
    const finTsAccountTransactions = await fints.fetchStatements(
      process.env.FINTS_BLZ as string,
      process.env.FINTS_URL as string,
      process.env.FINTS_USER as string,
      process.env.FINTS_PASSWORD as string,
      '',
    );

    // then
    expect(finTsAccountTransactions.length).to.be.above(0);
  });
});
