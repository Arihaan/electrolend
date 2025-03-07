import { task } from 'hardhat/config';

task('oasys-initialization', 'Initialize Palmy oasys enviroment').setAction(async ({}, DRE) => {
  await DRE.run('set-DRE');
  await DRE.run('oasys-initialization:address-provider');
  await DRE.run('oasys-initialization:lending-pool');
  await DRE.run('oasys-initialization:oracle');
  await DRE.run('oasys-initialization:data-provider');
  await DRE.run('oasys-initialization:weth-gateway');
  await DRE.run('oasys-initialization:misc');
});
