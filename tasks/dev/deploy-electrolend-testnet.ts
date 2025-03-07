import { task } from 'hardhat/config';
import { ConfigNames } from '../../helpers/configuration';
import { getFirstSigner } from '../../helpers/contracts-getters';
import { eElectroneumNetwork, eNetwork } from '../../helpers/types';

task('dev:deploy-electrolend-testnet', 'Deploy the ElectroLend protocol to Electroneum testnet')
  .addFlag('verify', 'Verify contracts at Etherscan')
  .setAction(async ({ verify }, DRE) => {
    console.log('Beginning complete deployment of ElectroLend protocol to Electroneum testnet');
    
    // Ensure we're on the testnet
    if (DRE.network.name !== eElectroneumNetwork.testnet) {
      throw new Error(`You need to be on electroneum testnet to run this task. Currently on ${DRE.network.name}`);
    }
    
    // Set up environment
    await DRE.run('set-DRE');
    
    // Execute each deployment step in sequence with proper error handling
    try {
      console.log('Deploying LendingPoolAddressesProviderRegistry');
      await DRE.run('full:deploy-address-provider-registry', { 
        pool: ConfigNames.ElectroLend, 
        verify
      });
      
      console.log('Deploying LendingPoolAddressesProvider');
      await DRE.run('full:deploy-address-provider', { 
        pool: ConfigNames.ElectroLend, 
        verify
      });
      
      console.log('Deploying LendingPool and supporting libraries');
      await DRE.run('full:deploy-lending-pool', { 
        pool: ConfigNames.ElectroLend, 
        verify
      });
      
      console.log('Deploying Oracles');
      await DRE.run('full:deploy-oracles', { 
        pool: ConfigNames.ElectroLend, 
        verify
      });
      
      console.log('Deploying Data Provider');
      await DRE.run('full:deploy-data-provider', { 
        pool: ConfigNames.ElectroLend, 
        verify
      });
      
      console.log('Deploying WETH Gateway');
      await DRE.run('full:deploy-wethgateway', { 
        pool: ConfigNames.ElectroLend, 
        verify
      });
      
      console.log('Initializing reserves and rate strategies');
      await DRE.run('full:initialize-lending-pool', { 
        pool: ConfigNames.ElectroLend, 
        verify
      });
      
      console.log('Setting up the Simple Price Feed for oracle');
      const simplePriceFeedAddress = process.env.SIMPLE_PRICE_FEED_ADDRESS || '0xFba006047BCeCc6E7402D8ae7a3ddCB8DB1CFf53';
      
      // Finishing up
      console.log('\nElectroLend deployment to Electroneum testnet complete!');
      console.log('\nImportant note: You should now verify all deployed contracts are properly configured:');
      console.log('1. Check that the SimplePriceFeed has proper prices for ETN, USDC, and USDT');
      console.log('2. Verify that all reserves are properly initialized and borrowing is enabled');
      console.log('3. Test a deposit and borrow to ensure the system works end-to-end');
    } catch (error) {
      console.error('Deployment failed:', error);
      throw error;
    }
  }); 