import Decimal from 'decimal.js';
import { Contract } from 'ethers';
import { action, computed, makeObservable, observable } from 'mobx';
import config from '~app/common/config';
import Operator from '~lib/api/Operator';
import ApiParams from '~lib/api/ApiParams';
import BaseStore from '~app/common/stores/BaseStore';
import ApplicationStore from '~app/common/stores/Abstracts/Application';
import SsvStore from '~app/common/stores/applications/SsvWeb/SSV.store';
import MyAccountStore from '~app/common/stores/applications/SsvWeb/MyAccount.store';
import NotificationsStore from '~app/common/stores/applications/SsvWeb/Notifications.store';
import { isMainnet, NETWORKS } from '~lib/utils/envHelper';

import { fromWei, toWei } from '~root/services/conversions.service';
import { getStoredNetwork } from '~root/providers/networkInfo.provider';
import { getContractByName } from '~root/services/contracts.service';
import { EContractName } from '~app/model/contracts.model';

export interface NewOperator {
  id: number,
  fee: number,
  publicKey: string,
  address: string,
}

export interface IOperator {
  id: any,
  fee?: string,
  name: string,
  logo?: string,
  type?: string,
  address: string,
  score?: number,
  public_key: string,
  selected?: boolean,
  dappNode?: boolean,
  ownerAddress: string,
  dkg_address?: string,
  mev_relays?: string,
  autoSelected?: boolean
  validators_count: number,
  verified_operator?: boolean,
}

export interface Operators {
  [page: number]: OperatorFee;
}

interface OperatorFee {
  ssv: number,
  dollar: number,
}

interface OperatorsFees {
  [publicKey: string]: OperatorFee;
}

interface SelectedOperators {
  [index: string]: IOperator;
}

class OperatorStore extends BaseStore {
  // Process data
  processOperatorId: number = 0;

  // Cancel dialog switcher
  openCancelDialog: boolean = false;

  operators: IOperator[] = [];
  operatorsFees: OperatorsFees = {};
  selectedOperators: SelectedOperators = {};

  // Operator update fee process
  maxFeeIncrease: number = 0;
  operatorCurrentFee: null | number = null;
  operatorFutureFee: null | number = null;
  getSetOperatorFeePeriod: null | number = null;
  operatorApprovalEndTime: null | number = null;
  declaredOperatorFeePeriod: null | number = null;
  operatorApprovalBeginTime: null | number = null;

  newOperatorKeys: NewOperator = { publicKey: '', address: '', fee: 0, id: 0 };
  newOperatorRegisterSuccessfully: string = '';

  estimationGas: number = 0;
  dollarEstimationGas: number = 0;

  loadingOperators: boolean = false;

  operatorValidatorsLimit: number = 0;
  clusterSize: number = 4;

  constructor() {
    // TODO: [mobx-undecorate] verify the constructor arguments and the arguments of this automatically generated super call
    super();

    makeObservable(this, {
      stats: computed,
      operators: observable,
      initUser: action.bound,
      clusterSize: observable,
      operatorsFees: observable,
      estimationGas: observable,
      maxFeeIncrease: observable,
      newOperatorKeys: observable,
      clearSettings: action.bound,
      setClusterSize: action.bound,
      openCancelDialog: observable,
      getOperatorFee: action.bound,
      removeOperator: action.bound,
      loadingOperators: observable,
      addNewOperator: action.bound,
      selectOperator: action.bound,
      processOperatorId: observable,
      selectedOperators: observable,
      setOperatorKeys: action.bound,
      operatorFutureFee: observable,
      selectOperators: action.bound,
      operatorCurrentFee: observable,
      unselectOperator: action.bound,
      clearOperatorData: action.bound,
      dollarEstimationGas: observable,
      updateOperatorFee: action.bound,
      getOperatorRevenue: action.bound,
      approveOperatorFee: action.bound,
      switchCancelDialog: action.bound,
      syncOperatorFeeInfo: action.bound,
      isOperatorSelected: action.bound,
      getSelectedOperatorsFee: computed,
      selectedEnoughOperators: computed,
      unselectAllOperators: action.bound,
      clearOperatorFeeInfo: action.bound,
      operatorValidatorsLimit: observable,
      getSetOperatorFeePeriod: observable,
      operatorApprovalEndTime: observable,
      cancelChangeFeeProcess: action.bound,
      declaredOperatorFeePeriod: observable,
      operatorApprovalBeginTime: observable,
      getOperatorValidatorsCount: action.bound,
      unselectOperatorByPublicKey: action.bound,
      updateOperatorAddressWhitelist: observable,
      newOperatorRegisterSuccessfully: observable,
      updateOperatorValidatorsLimit: action.bound,
      hasOperatorReachedValidatorLimit: action.bound,
    });
  }

  /**
   * Updating operators and validators data
   * @param resolve
   * @param showError
   */
  async refreshOperatorsAndClusters(resolve: any, showError?: boolean) {
    const myAccountStore: MyAccountStore = this.getStore('MyAccount');
    const applicationStore: ApplicationStore = this.getStore('Application');
    const notificationsStore: NotificationsStore = this.getStore('Notifications');
    return Promise.all([
      myAccountStore.getOwnerAddressClusters({}),
      myAccountStore.getOwnerAddressOperators({}),
    ])
      .then(() => {
        applicationStore.setIsLoading(false);
        applicationStore.showTransactionPendingPopUp(false);
        resolve(true);
      })
      .catch((error) => {
        applicationStore.setIsLoading(false);
        if (showError) {
          notificationsStore.showMessage(error.message, 'error');
        }
        applicationStore.showTransactionPendingPopUp(false);
        resolve(false);
      });
  }

  clearOperatorFeeInfo() {
    this.operatorFutureFee = null;
    this.operatorApprovalBeginTime = null;
    this.operatorApprovalEndTime = null;
  }

  get getSelectedOperatorsFee(): number {
    return Object.values(this.selectedOperators).reduce(
      (previousValue: number, currentValue: IOperator) => previousValue + fromWei(currentValue.fee),
      0,
    );
  }

  /**
   * Check if selected necessary minimum of operators
   */
  get selectedEnoughOperators(): boolean {
    return this.stats.selected >= this.clusterSize;
  }

  /**
   * Get selection stats
   */
  get stats(): { total: number, selected: number, selectedPercents: number } {
    const selected = Object.values(this.selectedOperators).length;
    return {
      selected,
      total: this.operators.length,
      selectedPercents: ((selected / this.operators.length) * 100.0),
    };
  }

  /**
   * Get max validators count
   */
  async updateOperatorValidatorsLimit(): Promise<void> {
    const contract = getContractByName(EContractName.GETTER);
    if (this.operatorValidatorsLimit === 0) {
      this.operatorValidatorsLimit = await contract.getValidatorsPerOperatorLimit();
    }
  }

  /**
   * Check if operator registrable
   */
  hasOperatorReachedValidatorLimit(validatorsRegisteredCount: number): boolean {
    // return this.operatorValidatorsLimit <= validatorsRegisteredCount + config.GLOBAL_VARIABLE.OPERATOR_VALIDATORS_LIMIT_PRESERVE;
    return this.operatorValidatorsLimit <= validatorsRegisteredCount;
  }

  /**
   * Check if operator registrable
   */
  switchCancelDialog() {
    this.openCancelDialog = !this.openCancelDialog;
  }

  /**
   * Check if operator registrable
   */
  async initUser() {
    const contract = getContractByName(EContractName.GETTER);
    if (!contract) return;
    const { declareOperatorFeePeriod, executeOperatorFeePeriod } = await contract.getOperatorFeePeriods();
    this.getSetOperatorFeePeriod = Number(executeOperatorFeePeriod);
    this.declaredOperatorFeePeriod = Number(declareOperatorFeePeriod);
    this.maxFeeIncrease = Number(await contract.getOperatorFeeIncreaseLimit()) / 100;
  }

  /**
   * Check if operator registrable
   */
  clearSettings() {
    this.maxFeeIncrease = 0;
    this.operatorFutureFee = null;
    this.operatorCurrentFee = null;
    this.getSetOperatorFeePeriod = null;
    this.operatorApprovalEndTime = null;
    this.declaredOperatorFeePeriod = null;
    this.operatorApprovalBeginTime = null;
    this.clearOperatorData();
  }

  /**
   * Retrieves the operator id
   */
  get getOperatorId(): number {
    const operatorStore: OperatorStore = this.getStore('Operator');
    return operatorStore.newOperatorKeys.id;
  }

  /**
   * Check if operator registrable
   */
  async syncOperatorFeeInfo(operatorId: number) {
    const contract = getContractByName(EContractName.GETTER);
    try {
      this.operatorCurrentFee = await contract.getOperatorFee(operatorId);
      const response = await contract.getOperatorDeclaredFee(operatorId);
      const testNets = [NETWORKS.GOERLI, NETWORKS.HOLESKY];
      if (response['0'] && testNets.indexOf(getStoredNetwork().networkId) !== -1) {
        this.operatorFutureFee = response['1'];
        this.operatorApprovalBeginTime = response['2'];
        this.operatorApprovalEndTime = response['3'];
      } else {
        this.operatorFutureFee = response['0'] === '0' ? null : response['0'];
        this.operatorApprovalBeginTime = response['1'] === '1' ? null : response['1'];
        this.operatorApprovalEndTime = response['2'] === '2' ? null : response['2'];
      }
    } catch (e: any) {
      console.error(`Failed to get operator fee details from the contract: ${e.message}`);
      this.clearOperatorFeeInfo();
    }
  }

  /**
   * Check if operator is whitelisted
   * @param accountAddress queried account
   */
  async isOperatorWhitelisted(accountAddress: string): Promise<boolean> {
    if (!isMainnet) {
      return true;
    }
    const contract = getContractByName(EContractName.SETTER);
    try {
      const response = await contract.getRegisterAuth(accountAddress);
      return response.authOperators;
    }
  catch (e: any) {
    console.error(`Failed to check if operator ${accountAddress} is whitelisted: ${e.message}`);
    return false;
  }
}

  /**
   * update operator address whitelist
   */
  async updateOperatorAddressWhitelist(operatorId: string, address: string) {
    const applicationStore: ApplicationStore = this.getStore('Application');
    const notificationsStore: NotificationsStore = this.getStore('Notifications');
    return new Promise(async (resolve) => {
      try {
        const contractInstance = getContractByName(EContractName.SETTER);
        const tx = await contractInstance.setOperatorWhitelist(operatorId, address);
        if (tx.hash) {
          applicationStore.txHash = tx.hash;
          applicationStore.showTransactionPendingPopUp(true);
        }
        const receipt = await tx.wait();
        if (receipt.blockHash) {
          const event: boolean = receipt.hasOwnProperty('events');
          if (event) {
            let iterations = 0;
            while (iterations <= MyAccountStore.CHECK_UPDATES_MAX_ITERATIONS) {
              if (iterations >= MyAccountStore.CHECK_UPDATES_MAX_ITERATIONS) {
                await this.refreshOperatorsAndClusters(resolve, true);
                break;
              }
              iterations += 1;
              const operator = await Operator.getInstance().getOperator(operatorId);
              const changed = operator.address_whitelist.toString() === address.toString();
              if (changed) {
                await this.refreshOperatorsAndClusters(resolve, true);
                break;
              } else {
                console.log('Operator is still not updated in API..');
              }
            }
          }
        }
      } catch (e: any) {
        console.debug('Contract Error', e.message);
        applicationStore.setIsLoading(false);
        applicationStore.showTransactionPendingPopUp(false);
        notificationsStore.showMessage(e.message, 'error');
        resolve(false);
      }
    });
    // return new Promise(async (resolve) => {
    //   try {
    //     const walletStore: WalletStore = this.getStore('Wallet');
    //     const applicationStore: ApplicationStore = this.getStore('Application');
    //     const gasLimit = getFixedGasLimit(GasGroup.DECLARE_OPERATOR_FEE);
    //     const contractInstance = walletStore.setterContract;
    //     await contractInstance.setOperatorWhitelist(operatorId, address).send({
    //       from: walletStore.accountAddress,
    //       gas: gasLimit,
    //     })
    //       .on('receipt', async (receipt: any) => {
    //         const event: boolean = receipt.hasOwnProperty('events');
    //         if (event) {
    //           let iterations = 0;
    //           while (iterations <= MyAccountStore.CHECK_UPDATES_MAX_ITERATIONS) {
    //             const operator = await Operator.getInstance().getOperator(operatorId);
    //             const changed = operator.address_whitelist.toString() === address.toString();
    //             if (changed) {
    //               iterations = MyAccountStore.CHECK_UPDATES_MAX_ITERATIONS;
    //             } else {
    //               console.log('Operator is still not updated in API..');
    //             }
    //             iterations += 1;
    //           }
    //           await this.refreshOperatorsAndClusters(resolve, true);
    //         }
    //       })
    //       .on('transactionHash', (txHash: string) => {
    //         applicationStore.txHash = txHash;
    //         applicationStore.showTransactionPendingPopUp(true);
    //       })
    //       .on('error', (error: any) => {
    //         console.debug('Contract Error', error.message);
    //         applicationStore.setIsLoading(false);
    //         applicationStore.showTransactionPendingPopUp(false);
    //         resolve(false);
    //       });
    //   } catch (e: any) {
    //     console.log('<<<<<<<<<<<<<<error>>>>>>>>>>>>>>');
    //     console.log(e.message);
    //     resolve(false);
    //   }
    // });
  }

  /**
   * Get operator balance
   */
  async getOperatorBalance(id: number): Promise<any> {
    return new Promise((resolve) => {
      const contract = getContractByName(EContractName.GETTER);
      contract.getOperatorEarnings(id).then((response: any) => {
        resolve(fromWei(response));
      }).catch(() => resolve(true));
    });
  }

  /**
   * Cancel change fee process for operator
   */
  async cancelChangeFeeProcess(operatorId: number): Promise<any> {
    const myAccountStore: MyAccountStore = this.getStore('MyAccount');
    const applicationStore: ApplicationStore = this.getStore('Application');
    const notificationsStore: NotificationsStore = this.getStore('Notifications');
    await this.syncOperatorFeeInfo(operatorId);
    const operatorDataBefore = {
      operatorFutureFee: this.operatorFutureFee,
      operatorApprovalEndTime: this.operatorApprovalEndTime,
      operatorApprovalBeginTime: this.operatorApprovalBeginTime,
    };
    return new Promise(async (resolve) => {
      try {
        const contract: Contract = getContractByName(EContractName.SETTER);
        const tx = await contract.cancelDeclaredOperatorFee(operatorId);
        if (tx.hash) {
          applicationStore.txHash = tx.hash;
          applicationStore.showTransactionPendingPopUp(true);
        }
        const receipt = await tx.wait();
        if (receipt.blockHash) {
          const event: boolean = receipt.hasOwnProperty('events');
          if (event) {
            ApiParams.initStorage(true);
            console.debug('Contract Receipt', receipt);
            let iterations = 0;
            while (iterations <= MyAccountStore.CHECK_UPDATES_MAX_ITERATIONS) {
              // Reached maximum iterations
              if (iterations >= MyAccountStore.CHECK_UPDATES_MAX_ITERATIONS) {
                // eslint-disable-next-line no-await-in-loop
                await this.refreshOperatorsAndClusters(resolve, true);
                break;
              }
              iterations += 1;
              // eslint-disable-next-line no-await-in-loop
              const changed = await myAccountStore.checkEntityChangedInAccount(
                // eslint-disable-next-line @typescript-eslint/no-loop-func
                async () => {
                  await this.syncOperatorFeeInfo(operatorId);
                  return {
                    operatorFutureFee: this.operatorFutureFee,
                    operatorApprovalEndTime: this.operatorApprovalEndTime,
                    operatorApprovalBeginTime: this.operatorApprovalBeginTime,
                  };
                },
                operatorDataBefore,
              );
              if (changed) {
                // eslint-disable-next-line no-await-in-loop
                await this.refreshOperatorsAndClusters(resolve, true);
                break;
              } else {
                console.log('Operator is still not updated in API..');
              }
              // eslint-disable-next-line no-await-in-loop
              await myAccountStore.delay();
            }
          }
        }
      } catch (e: any) {
        applicationStore.setIsLoading(false);
        applicationStore.showTransactionPendingPopUp(false);
        notificationsStore.showMessage(e.message, 'error');
        resolve(false);
      }
    });
    // const myAccountStore: MyAccountStore = this.getStore('MyAccount');
    // const gasLimit = getFixedGasLimit(GasGroup.CANCEL_OPERATOR_FEE);
    // await this.syncOperatorFeeInfo(operatorId);
    // const operatorDataBefore = {
    //   operatorFutureFee: this.operatorFutureFee,
    //   operatorApprovalEndTime: this.operatorApprovalEndTime,
    //   operatorApprovalBeginTime: this.operatorApprovalBeginTime,
    // };
    //
    // return new Promise((resolve) => {
    //   try {
    //     const walletStore: WalletStore = this.getStore('Wallet');
    //     const applicationStore: ApplicationStore = this.getStore('Application');
    //     const contract: Contract = walletStore.setterContract;
    //     contract.cancelDeclaredOperatorFee(operatorId).send({ from: walletStore.accountAddress, gas: gasLimit })
    //       .on('receipt', async (receipt: any) => {
    //         const event: boolean = receipt.hasOwnProperty('events');
    //         if (event) {
    //           ApiParams.initStorage(true);
    //           console.debug('Contract Receipt', receipt);
    //           let iterations = 0;
    //           while (iterations <= MyAccountStore.CHECK_UPDATES_MAX_ITERATIONS) {
    //             const changed = await myAccountStore.checkEntityChangedInAccount(
    //               async () => {
    //                 await this.syncOperatorFeeInfo(operatorId);
    //                 return {
    //                   operatorFutureFee: this.operatorFutureFee,
    //                   operatorApprovalEndTime: this.operatorApprovalEndTime,
    //                   operatorApprovalBeginTime: this.operatorApprovalBeginTime,
    //                 };
    //               },
    //               operatorDataBefore,
    //             );
    //             if (changed) {
    //               iterations = MyAccountStore.CHECK_UPDATES_MAX_ITERATIONS;
    //             } else {
    //               console.log('Operator is still not updated in API..');
    //             }
    //             iterations += 1;
    //             await myAccountStore.delay();
    //           }
    //           await this.refreshOperatorsAndClusters(resolve, true);
    //         }
    //       })
    //       .on('transactionHash', (txHash: string) => {
    //         applicationStore.txHash = txHash;
    //         applicationStore.showTransactionPendingPopUp(true);
    //       })
    //       .on('error', () => {
    //         applicationStore.setIsLoading(false);
    //         applicationStore.showTransactionPendingPopUp(false);
    //         resolve(false);
    //       });
    //   } catch (e) {
    //     resolve(false);
    //   }
    // });
  }

  /**
   * get validators of operator
   */
  async getOperatorValidatorsCount(operatorId: number): Promise<any> {
    return new Promise((resolve) => {
      const contract = getContractByName(EContractName.GETTER);
      contract.validatorsPerOperatorCount(operatorId).then((response: any) => {
        resolve(response);
      });
    });
  }

  /**
   * clear operator store
   */
  clearOperatorData() {
    this.newOperatorKeys = {
      fee: 0,
      id: 0,
      publicKey: '',
      address: '',
    };
    this.newOperatorRegisterSuccessfully = '';
  }

  /**
   * Set operator keys
   * @param publicKey
   */
  async getOperatorFee(publicKey: string): Promise<any> {
    // eslint-disable-next-line no-async-promise-executor
    return new Promise(async (resolve) => {
      try {
        const contract = getContractByName(EContractName.GETTER);
        contract.getOperatorFee(publicKey).then((response: any) => {
          const ssv = fromWei(response);
          this.operatorsFees[publicKey] = { ssv, dollar: 0 };
          resolve(ssv);
        });
      } catch {
        this.operatorsFees[publicKey] = { ssv: 0, dollar: 0 };
        resolve(0);
      }
    });
  }

  /**
   * Set operator keys
   * @param transaction
   */
  setOperatorKeys(transaction: NewOperator) {
    this.newOperatorKeys = transaction;
  }

  /**
   * Get operator revenue
   */
  async getOperatorRevenue(operatorId: number): Promise<any> {
    try {
      const contract = getContractByName(EContractName.GETTER);
      const response = await contract.totalEarningsOf(operatorId);
      return fromWei(response.toString());
    } catch (e: any) {
      return 0;
    }
  }

  /**
   * Check if operator already exists in the contract
   * @param operatorId
   * @param newFee
   */
  async updateOperatorFee(operatorId: number, newFee: any): Promise<boolean> {
    const myAccountStore: MyAccountStore = this.getStore('MyAccount');
    const applicationStore: ApplicationStore = this.getStore('Application');
    const notificationsStore: NotificationsStore = this.getStore('Notifications');
    return new Promise(async (resolve) => {
      try {
        const ssvStore: SsvStore = this.getStore('SSV');
        const contractInstance = getContractByName(EContractName.SETTER);
        const formattedFee = ssvStore.prepareSsvAmountToTransfer(
          toWei(
            new Decimal(newFee).dividedBy(config.GLOBAL_VARIABLE.BLOCKS_PER_YEAR).toFixed().toString(),
          ),
        );
        await this.syncOperatorFeeInfo(operatorId);
        const operatorDataBefore = {
          operatorFutureFee: this.operatorFutureFee,
          operatorApprovalEndTime: this.operatorApprovalEndTime,
          operatorApprovalBeginTime: this.operatorApprovalBeginTime,
        };
        const tx = await contractInstance.declareOperatorFee(operatorId, formattedFee);
        if (tx.hash) {
          applicationStore.txHash = tx.hash;
          applicationStore.showTransactionPendingPopUp(true);
        }
        const receipt = await tx.wait();
        if (receipt.blockHash) {
          const event: boolean = receipt.hasOwnProperty('events');
          if (event) {
            let iterations = 0;
            while (iterations <= MyAccountStore.CHECK_UPDATES_MAX_ITERATIONS) {
              if (iterations >= MyAccountStore.CHECK_UPDATES_MAX_ITERATIONS) {
                await this.refreshOperatorsAndClusters(resolve, true);
                break;
              }
              iterations += 1;
              const changed = await myAccountStore.checkEntityChangedInAccount(
                async () => {
                  await this.syncOperatorFeeInfo(operatorId);
                  return {
                    operatorFutureFee: this.operatorFutureFee,
                    operatorApprovalEndTime: this.operatorApprovalEndTime,
                    operatorApprovalBeginTime: this.operatorApprovalBeginTime,
                  };
                },
                operatorDataBefore,
              );
              if (changed) {
                await this.refreshOperatorsAndClusters(resolve, true);
                break;
              } else {
                console.log('Operator is still not updated in API..');
              }
              await myAccountStore.delay();
            }
          }
        }
      } catch (e: any) {
        console.debug('Contract Error', e.message);
        applicationStore.setIsLoading(false);
        applicationStore.showTransactionPendingPopUp(false);
        notificationsStore.showMessage(e.message, 'error');
        resolve(false);
      }
    });
    // const myAccountStore: MyAccountStore = this.getStore('MyAccount');
    // return new Promise(async (resolve) => {
    //   try {
    //     const ssvStore: SsvStore = this.getStore('SSV');
    //     const walletStore: WalletStore = this.getStore('Wallet');
    //     const applicationStore: ApplicationStore = this.getStore('Application');
    //     const gasLimit = getFixedGasLimit(GasGroup.DECLARE_OPERATOR_FEE);
    //     const contractInstance = walletStore.setterContract;
    //     const formattedFee = ssvStore.prepareSsvAmountToTransfer(
    //       walletStore.toWei(
    //         new Decimal(newFee).dividedBy(config.GLOBAL_VARIABLE.BLOCKS_PER_YEAR).toFixed().toString(),
    //       ),
    //     );
    //     await this.syncOperatorFeeInfo(operatorId);
    //     const operatorDataBefore = {
    //       operatorFutureFee: this.operatorFutureFee,
    //       operatorApprovalEndTime: this.operatorApprovalEndTime,
    //       operatorApprovalBeginTime: this.operatorApprovalBeginTime,
    //     };
    //     await contractInstance.declareOperatorFee(operatorId, formattedFee).send({
    //       from: walletStore.accountAddress,
    //       gas: gasLimit,
    //     })
    //       .on('receipt', async (receipt: any) => {
    //         // eslint-disable-next-line no-prototype-builtins
    //         const event: boolean = receipt.hasOwnProperty('events');
    //         if (event) {
    //           let iterations = 0;
    //           while (iterations <= MyAccountStore.CHECK_UPDATES_MAX_ITERATIONS) {
    //             const changed = await myAccountStore.checkEntityChangedInAccount(
    //               async () => {
    //                 await this.syncOperatorFeeInfo(operatorId);
    //                 return {
    //                   operatorFutureFee: this.operatorFutureFee,
    //                   operatorApprovalEndTime: this.operatorApprovalEndTime,
    //                   operatorApprovalBeginTime: this.operatorApprovalBeginTime,
    //                 };
    //               },
    //               operatorDataBefore,
    //             );
    //             if (changed) {
    //               iterations = MyAccountStore.CHECK_UPDATES_MAX_ITERATIONS;
    //             } else {
    //               console.log('Operator is still not updated in API..');
    //             }
    //             iterations += 1;
    //             await myAccountStore.delay();
    //           }
    //           await this.refreshOperatorsAndClusters(resolve, true);
    //         }
    //       })
    //       .on('transactionHash', (txHash: string) => {
    //         applicationStore.txHash = txHash;
    //         applicationStore.showTransactionPendingPopUp(true);
    //       })
    //       .on('error', (error: any) => {
    //         console.debug('Contract Error', error.message);
    //         applicationStore.setIsLoading(false);
    //         applicationStore.showTransactionPendingPopUp(false);
    //         resolve(false);
    //       });
    //   } catch (e: any) {
    //     console.log('<<<<<<<<<<<<<<error>>>>>>>>>>>>>>');
    //     console.log(e.message);
    //     resolve(false);
    //   }
    // });
  }

  async decreaseOperatorFee(operatorId: number, newFee: any): Promise<boolean> {
    const myAccountStore: MyAccountStore = this.getStore('MyAccount');
    const applicationStore: ApplicationStore = this.getStore('Application');
    const notificationsStore: NotificationsStore = this.getStore('Notifications');
    return new Promise(async (resolve) => {
      try {
        const ssvStore: SsvStore = this.getStore('SSV');
        const contractInstance = getContractByName(EContractName.SETTER);
        const formattedFee = ssvStore.prepareSsvAmountToTransfer(
          toWei(
            new Decimal(newFee).dividedBy(config.GLOBAL_VARIABLE.BLOCKS_PER_YEAR).toFixed().toString(),
          ),
        );
        const { id, fee } = await Operator.getInstance().getOperator(operatorId);
        const operatorBefore = { id, fee };
        const tx = await contractInstance.reduceOperatorFee(operatorId, formattedFee);
        if (tx.hash) {
          applicationStore.txHash = tx.hash;
          applicationStore.showTransactionPendingPopUp(true);
        }
        const receipt = await tx.wait();
        if (receipt.blockHash) {
          const event: boolean = receipt.hasOwnProperty('events');
          if (event) {
            let iterations = 0;
            while (iterations <= MyAccountStore.CHECK_UPDATES_MAX_ITERATIONS) {
              if (iterations >= MyAccountStore.CHECK_UPDATES_MAX_ITERATIONS) {
                await this.refreshOperatorsAndClusters(resolve, true);
                break;
              }
              iterations += 1;
              const changed = await myAccountStore.checkEntityChangedInAccount(
                async () => {
                  const operatorAfter = await Operator.getInstance().getOperator(operatorId);
                  return {
                    id: operatorAfter.id,
                    fee: operatorAfter.fee,
                  };
                },
                operatorBefore,
              );
              if (changed) {
                await this.refreshOperatorsAndClusters(resolve, true);
                break;
              } else {
                console.log('Operator is still not updated in API..');
              }
              await myAccountStore.delay();
            }
          }
        }
      } catch (e: any) {
        console.debug('Contract Error', e.message);
        applicationStore.setIsLoading(false);
        applicationStore.showTransactionPendingPopUp(false);
        notificationsStore.showMessage(e.message, 'error');
        resolve(false);
      }
    });
    // const myAccountStore: MyAccountStore = this.getStore('MyAccount');
    // const gasLimit = getFixedGasLimit(GasGroup.REDUCE_OPERATOR_FEE);
    // return new Promise(async (resolve) => {
    //   try {
    //     const ssvStore: SsvStore = this.getStore('SSV');
    //     const walletStore: WalletStore = this.getStore('Wallet');
    //     const applicationStore: ApplicationStore = this.getStore('Application');
    //     const contractInstance = walletStore.setterContract;
    //     const formattedFee = ssvStore.prepareSsvAmountToTransfer(
    //       walletStore.toWei(
    //         new Decimal(newFee).dividedBy(config.GLOBAL_VARIABLE.BLOCKS_PER_YEAR).toFixed().toString(),
    //       ),
    //     );
    //     const { id, fee } = await Operator.getInstance().getOperator(operatorId);
    //     const operatorBefore = { id, fee };
    //     await contractInstance.reduceOperatorFee(operatorId, formattedFee).send({
    //       from: walletStore.accountAddress,
    //       gas: gasLimit,
    //     })
    //       .on('receipt', async (receipt: any) => {
    //         // eslint-disable-next-line no-prototype-builtins
    //         const event: boolean = receipt.hasOwnProperty('events');
    //         if (event) {
    //           let iterations = 0;
    //           while (iterations <= MyAccountStore.CHECK_UPDATES_MAX_ITERATIONS) {
    //             const changed = await myAccountStore.checkEntityChangedInAccount(
    //               async () => {
    //                 const operatorAfter = await Operator.getInstance().getOperator(operatorId);
    //                 return {
    //                   id: operatorAfter.id,
    //                   fee: operatorAfter.fee,
    //                 };
    //               },
    //               operatorBefore,
    //             );
    //             if (changed) {
    //               iterations = MyAccountStore.CHECK_UPDATES_MAX_ITERATIONS;
    //             } else {
    //               console.log('Operator is still not updated in API..');
    //             }
    //             iterations += 1;
    //             await myAccountStore.delay();
    //           }
    //           await this.refreshOperatorsAndClusters(resolve, true);
    //         }
    //       })
    //       .on('transactionHash', (txHash: string) => {
    //         applicationStore.txHash = txHash;
    //         applicationStore.showTransactionPendingPopUp(true);
    //       })
    //       .on('error', (error: any) => {
    //         console.debug('Contract Error', error.message);
    //         applicationStore.setIsLoading(false);
    //         applicationStore.showTransactionPendingPopUp(false);
    //         resolve(false);
    //       });
    //   } catch (e: any) {
    //     console.log(`Filed to decrease operator fee: ${e.message}`);
    //     resolve(false);
    //   }
    // });
  }

  /**
   * Check if operator already exists in the contract
   * @param operatorId
   */
  async approveOperatorFee(operatorId: number): Promise<boolean> {
    const applicationStore: ApplicationStore = this.getStore('Application');
    const notificationsStore: NotificationsStore = this.getStore('Notifications');
    return new Promise(async (resolve) => {
      try {
        const myAccountStore: MyAccountStore = this.getStore('MyAccount');
        let operatorBefore = await Operator.getInstance().getOperator(operatorId);
        // const gasLimit = getFixedGasLimit(GasGroup.EXECUTE_OPERATOR_FEE);
        operatorBefore = {
          id: operatorBefore.id,
          declared_fee: operatorBefore.declared_fee,
          previous_fee: operatorBefore.previous_fee,
        };
        const contract = getContractByName(EContractName.SETTER);
        const tx = await contract.executeOperatorFee(operatorId);
        if (tx.hash) {
          applicationStore.txHash = tx.hash;
          applicationStore.showTransactionPendingPopUp(true);
        }
        const receipt = await tx.wait();
        if (receipt.blockHash) {
          const event: boolean = receipt.hasOwnProperty('events');
          if (event) {
            let iterations = 0;
            while (iterations <= MyAccountStore.CHECK_UPDATES_MAX_ITERATIONS) {
              // Reached maximum iterations
              if (iterations >= MyAccountStore.CHECK_UPDATES_MAX_ITERATIONS) {
                // eslint-disable-next-line no-await-in-loop
                await this.refreshOperatorsAndClusters(resolve, true);
                break;
              }
              iterations += 1;
              // eslint-disable-next-line no-await-in-loop
              const changed = await myAccountStore.checkEntityChangedInAccount(
                // eslint-disable-next-line @typescript-eslint/no-loop-func
                async () => {
                  const operatorAfter = await Operator.getInstance().getOperator(operatorId);
                  return {
                    id: operatorAfter.id,
                    declared_fee: operatorAfter.declared_fee,
                    previous_fee: operatorAfter.previous_fee,
                  };
                },
                operatorBefore,
              );
              if (changed) {
                // eslint-disable-next-line no-await-in-loop
                await this.refreshOperatorsAndClusters(resolve, true);
                break;
              } else {
                console.log('Operator is still not updated in API..');
              }
              // eslint-disable-next-line no-await-in-loop
              await myAccountStore.delay();
            }
          }
        }
      } catch (e: any) {
        console.debug('Contract Error', e.message);
        applicationStore.setIsLoading(false);
        applicationStore.showTransactionPendingPopUp(false);
        notificationsStore.showMessage(e.message, 'error');
        resolve(false);
      }
    });
    // // eslint-disable-next-line no-async-promise-executor
    // return new Promise(async (resolve) => {
    //   try {
    //     const walletStore: WalletStore = this.getStore('Wallet');
    //     const myAccountStore: MyAccountStore = this.getStore('MyAccount');
    //     const applicationStore: ApplicationStore = this.getStore('Application');
    //     let operatorBefore = await Operator.getInstance().getOperator(operatorId);
    //     const gasLimit = getFixedGasLimit(GasGroup.EXECUTE_OPERATOR_FEE);
    //     operatorBefore = {
    //       id: operatorBefore.id,
    //       declared_fee: operatorBefore.declared_fee,
    //       previous_fee: operatorBefore.previous_fee,
    //     };
    //
    //     await walletStore.setterContract.executeOperatorFee(operatorId).send({
    //       from: walletStore.accountAddress,
    //       gas: gasLimit,
    //     })
    //       .on('receipt', async (receipt: any) => {
    //         // eslint-disable-next-line no-prototype-builtins
    //         const event: boolean = receipt.hasOwnProperty('events');
    //         if (event) {
    //           let iterations = 0;
    //           while (iterations <= MyAccountStore.CHECK_UPDATES_MAX_ITERATIONS) {
    //             const changed = await myAccountStore.checkEntityChangedInAccount(
    //               async () => {
    //                 const operatorAfter = await Operator.getInstance().getOperator(operatorId);
    //                 return {
    //                   id: operatorAfter.id,
    //                   declared_fee: operatorAfter.declared_fee,
    //                   previous_fee: operatorAfter.previous_fee,
    //                 };
    //               },
    //               operatorBefore,
    //             );
    //             if (changed) {
    //               iterations = MyAccountStore.CHECK_UPDATES_MAX_ITERATIONS;
    //             } else {
    //               console.log('Operator is still not updated in API..');
    //             }
    //             iterations += 1;
    //             await myAccountStore.delay();
    //           }
    //           await this.refreshOperatorsAndClusters(resolve, true);
    //         }
    //       })
    //       .on('transactionHash', (txHash: string) => {
    //         applicationStore.txHash = txHash;
    //         applicationStore.showTransactionPendingPopUp(true);
    //       })
    //       .on('error', (error: any) => {
    //         console.debug('Contract Error', error.message);
    //         applicationStore.setIsLoading(false);
    //         applicationStore.showTransactionPendingPopUp(false);
    //         resolve(false);
    //       });
    //   } catch (e: any) {
    //     console.log(e.message);
    //     resolve(false);
    //   }
    // });
  }

  /**
   * Remove Operator
   * @param operatorId
   */
  async removeOperator(operatorId: number): Promise<any> {
    const myAccountStore: MyAccountStore = this.getStore('MyAccount');
    const applicationStore: ApplicationStore = this.getStore('Application');
    const notificationsStore: NotificationsStore = this.getStore('Notifications');
    const contractInstance = getContractByName(EContractName.SETTER);
    return new Promise(async (resolve) => {
      try {
        const tx = await contractInstance.removeOperator(operatorId);
        if (tx.hash) {
          applicationStore.txHash = tx.hash;
          applicationStore.showTransactionPendingPopUp(true);
        }
        const receipt = await tx.wait();
        if (receipt.blockHash) {
          const event: boolean = receipt.hasOwnProperty('events');
          if (event) {
            ApiParams.initStorage(true);
            console.debug('Contract Receipt', receipt);
            let iterations = 0;
            while (iterations <= MyAccountStore.CHECK_UPDATES_MAX_ITERATIONS) {
              // Reached maximum iterations
              if (iterations >= MyAccountStore.CHECK_UPDATES_MAX_ITERATIONS) {
                // eslint-disable-next-line no-await-in-loop
                await this.refreshOperatorsAndClusters(resolve, true);
                break;
              }
              iterations += 1;
              // eslint-disable-next-line no-await-in-loop
              if (!(await myAccountStore.checkEntityInAccount('operator', 'id', parseInt(String(operatorId), 10)))) {
                // eslint-disable-next-line no-await-in-loop
                await this.refreshOperatorsAndClusters(resolve, true);
                break;
              } else {
                console.log('Operator is still in API..');
              }
              // eslint-disable-next-line no-await-in-loop
              await myAccountStore.delay();
            }
          }
        }
      } catch (e: any) {
        notificationsStore.showMessage(e.message, 'error');
        applicationStore.setIsLoading(false);
        applicationStore.showTransactionPendingPopUp(false);
        return false;
      }
    });
    // const myAccountStore: MyAccountStore = this.getStore('MyAccount');
    // const applicationStore: ApplicationStore = this.getStore('Application');
    // const notificationsStore: NotificationsStore = this.getStore('Notifications');
    // const gasLimit = getFixedGasLimit(GasGroup.REMOVE_OPERATOR);
    // try {
    //   const walletStore: WalletStore = this.getStore('Wallet');
    //   const contractInstance = walletStore.setterContract;
    //
    //   // eslint-disable-next-line no-async-promise-executor
    //   return await new Promise(async (resolve) => {
    //     await contractInstance.removeOperator(operatorId).send({
    //       from: walletStore.accountAddress,
    //       gas: gasLimit,
    //     })
    //       .on('receipt', async (receipt: any) => {
    //         // eslint-disable-next-line no-prototype-builtins
    //         const event: boolean = receipt.hasOwnProperty('events');
    //         if (event) {
    //           ApiParams.initStorage(true);
    //           console.debug('Contract Receipt', receipt);
    //           let iterations = 0;
    //           while (iterations <= MyAccountStore.CHECK_UPDATES_MAX_ITERATIONS) {
    //             if (!(await myAccountStore.checkEntityInAccount('operator', 'id', parseInt(String(operatorId), 10)))) {
    //               break;
    //             } else {
    //               console.log('Operator is still in API..');
    //             }
    //             iterations += 1;
    //             await myAccountStore.delay();
    //           }
    //           await this.refreshOperatorsAndClusters(resolve, true);
    //         }
    //       })
    //       .on('transactionHash', (txHash: string) => {
    //         applicationStore.txHash = txHash;
    //         applicationStore.showTransactionPendingPopUp(true);
    //       })
    //       .on('error', (error: any) => {
    //         applicationStore.setIsLoading(false);
    //         applicationStore.showTransactionPendingPopUp(false);
    //         notificationsStore.showMessage(error.message, 'error');
    //         resolve(false);
    //       });
    //   });
    // } catch (e: any) {
    //   notificationsStore.showMessage(e.message, 'error');
    //   return false;
    // }
  }

  async addNewOperator() {
    // const myAccountStore: MyAccountStore = this.getStore('MyAccount');
    const applicationStore: ApplicationStore = this.getStore('Application');
    const notificationsStore: NotificationsStore = this.getStore('Notifications');
    // eslint-disable-next-line no-async-promise-executor
    return new Promise(async (resolve, reject) => {
      try {
        const payload: any[] = [];
        const ssvStore: SsvStore = this.getStore('SSV');
        const contract: Contract = getContractByName(EContractName.SETTER);
        // const address: string = this.newOperatorKeys.address;
        const transaction: NewOperator = this.newOperatorKeys;
        // const gasLimit = getFixedGasLimit(GasGroup.REGISTER_OPERATOR);
        const feePerBlock = new Decimal(transaction.fee).dividedBy(config.GLOBAL_VARIABLE.BLOCKS_PER_YEAR).toFixed().toString();

        // Send add operator transaction
        payload.push(
          transaction.publicKey,
          ssvStore.prepareSsvAmountToTransfer(toWei(feePerBlock)),
        );

        console.debug('Register Operator Transaction Data:', payload);

        console.warn('[addNewOperator] debug 1');
        try {
          const tx = await contract.registerOperator(...payload);
          if (tx.hash) {
            applicationStore.txHash = tx.hash;
            applicationStore.showTransactionPendingPopUp(true);
          }
          console.warn('[addNewOperator] debug 2');
          const receipt = await tx.wait();
          console.warn('[addNewOperator] debug 3', receipt);
          if (receipt.blockHash) {
            // this.newOperatorKeys.id = String(parseInt(receipt.events[0].args.operatorId));
            applicationStore.showTransactionPendingPopUp(false);
            resolve(true);
          }
        } catch (err: any) {
          console.error(`Error during setting fee recipient: ${err.message}`);
          notificationsStore.showMessage(err.message, 'error');
          resolve(false);
        }
        // const gas = await tx.estimateGas();
        // console.warn('[addNewOperator] debug 3', gas);

        // if (getGasEstimation && false) {
        //   this.estimationGas = gas * 0.000000001;
        //   if (config.FEATURE.DOLLAR_CALCULATION) {
        //     resolve(true);
        //   } else {
        //     this.dollarEstimationGas = 0;
        //     resolve(true);
        //   }
        //   return;
        // }

          // .on('Transfer', async (data: any) => {
          //   console.warn('[addNewOperator] debug TRANSFER', data);
          // })
          // .on('receipt', async (receipt: any) => {
          //   // eslint-disable-next-line no-prototype-builtins
          //   const events: boolean = receipt.hasOwnProperty('events');
          //   if (events) {
          //     console.debug('Contract Receipt', receipt);
          //     GoogleTagManager.getInstance().sendEvent({
          //       category: 'operator_register',
          //       action: 'register_tx',
          //       label: 'success',
          //     });
          //     this.newOperatorKeys.id = receipt.events.OperatorAdded.returnValues[0];
          //     this.newOperatorRegisterSuccessfully = sha256(walletStore.decodeKey(transaction.publicKey));
          //     resolve(true);
          //   }
          //   console.warn('[addNewOperator] debug 5');
          // })
          // .on('*', (txHash: any) => {
          //   console.warn('[addNewOperator] debug 6', txHash);
          //   // applicationStore.txHash = txHash;
          //   applicationStore.showTransactionPendingPopUp(true);
          // })
          // .on('error', (error: any) => {
          //   console.warn('[addNewOperator] debug 7');
          //   // eslint-disable-next-line no-prototype-builtins
          //   const isRejected: boolean = error.hasOwnProperty('code');
          //   GoogleTagManager.getInstance().sendEvent({
          //     category: 'operator_register',
          //     action: 'register_tx',
          //     label: isRejected ? 'rejected' : 'error',
          //   });
          //   applicationStore.setIsLoading(false);
          //   applicationStore.showTransactionPendingPopUp(false);
          //   notificationsStore.showMessage(error.message, 'error');
          //   resolve(false);
          // })
          // .catch((error: any) => {
          //   applicationStore.setIsLoading(false);
          //   applicationStore.showTransactionPendingPopUp(false);
          //   if (error) {
          //     notificationsStore.showMessage(error.message, 'error');
          //     GoogleTagManager.getInstance().sendEvent({
          //       category: 'operator_register',
          //       action: 'register_tx',
          //       label: 'error',
          //     });
          //     resolve(false);
          //   }
          //   console.debug('Contract Error', error);
          //   resolve(true);
          // })
      } catch (e) {
        // eslint-disable-next-line prefer-promise-reject-errors
        reject(false);
      }
    });
  }

  /**
   * Unselect operator
   * @param index
   */
  unselectOperator(index: number) {
    delete this.selectedOperators[index];
  }

  /**
   * Unselect operator by public_key
   */
  unselectOperatorByPublicKey(operator: any) {
    Object.keys(this.selectedOperators).forEach((index) => {
      if (this.selectedOperators[index].id === operator.id) {
        delete this.selectedOperators[index];
      }
    });
  }

  /**
   * Select operator
   * @param operator
   * @param selectedIndex
   */
  selectOperator(operator: IOperator, selectedIndex: number, clusterBox: number[]) {
    let operatorExist = false;
    // eslint-disable-next-line no-restricted-syntax
    for (const index of clusterBox) {
      if (this.selectedOperators[index]?.address + this.selectedOperators[index]?.id === operator.address + operator.id) {
        operatorExist = true;
      }
    }
    if (!operatorExist) this.selectedOperators[selectedIndex] = operator;
  }

  /**
   * Select operator
   * @param operators
   */
  selectOperators(operators: IOperator[]) {
    this.selectedOperators = {};
    operators.forEach((value: IOperator, index: number) => {
      this.selectedOperators[index] = value;
    });
  }

  /**
   * Check if operator selected
   * @param id
   */
  isOperatorSelected(id: string): boolean {
    let exist = false;
    Object.values(this.selectedOperators).forEach((operator: IOperator) => {
      if (operator.id === id) exist = true;
    });

    return exist;
  }

  unselectAllOperators() {
    this.selectedOperators = {};
  }

  setClusterSize(size: number) {
    this.clusterSize = size;
  }
}

export default OperatorStore;

