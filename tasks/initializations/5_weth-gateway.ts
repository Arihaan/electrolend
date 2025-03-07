import { task } from 'hardhat/config';

task('oasys-initialization:weth-gateway', '').setAction(async ({}, DRE) => {
  await DRE.run('set-DRE');
  // Do nothing
});
