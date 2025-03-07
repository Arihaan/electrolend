import { DRE, setDRE } from '../../helpers/misc-utils';
import { evmSnapshot, evmRevert } from '../../helpers/misc-utils';

// This is a monkey patch to override the hardhat DRE run function to add support for skipWait
export const patchDREForSkipWait = () => {
  // Store the original DRE.run method
  const originalRun = DRE.run;
  
  // Override the run method to handle skipWait
  DRE.run = async function(taskName: string, taskArguments: any = {}) {
    if (taskArguments && taskArguments.skipWait) {
      console.log(`[Skip Wait Mode] Running task "${taskName}" without waiting for confirmations`);
      // Take a snapshot of the EVM state
      const snapshotId = await evmSnapshot();
      
      try {
        // Add skipWait parameter to any subtasks that might be called
        const originalSend = DRE.ethers.provider.send;
        DRE.ethers.provider.send = async function(method: string, params: any[]) {
          if (method === 'eth_sendTransaction' || method === 'eth_sendRawTransaction') {
            console.log(`[Skip Wait] Sending transaction with method ${method}`);
            const result = await originalSend.call(this, method, params);
            console.log(`[Skip Wait] Transaction sent: ${result}`);
            return result;
          } else {
            return originalSend.call(this, method, params);
          }
        };
        
        // Run the task with skipWait parameter
        const result = await originalRun.call(this, taskName, taskArguments);
        
        // Restore original send method
        DRE.ethers.provider.send = originalSend;
        
        return result;
      } catch (error) {
        console.error(`[Skip Wait] Error in task "${taskName}":`, error);
        throw error;
      } finally {
        // Restore the EVM state
        await evmRevert(snapshotId);
      }
    } else {
      // Run normally if skipWait is not specified
      return originalRun.call(this, taskName, taskArguments);
    }
  };
}; 