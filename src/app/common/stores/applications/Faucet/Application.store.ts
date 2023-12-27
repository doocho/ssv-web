import { createTheme, Theme } from '@mui/material/styles';
import { action, computed, makeObservable, observable } from 'mobx';
import { AppTheme } from '~root/Theme';
import config from '~app/common/config';
import BaseStore from '~app/common/stores/BaseStore';
import WalletStore from '~app/common/stores/Abstracts/Wallet';
import Application from '~app/common/stores/Abstracts/Application';

/**
 * Base store provides singe source of true
 * for keeping all stores instances in one place
 */

class ApplicationStore extends BaseStore implements Application {
  // @ts-ignore
  theme: Theme;
  txHash: string = '';
  userGeo: string = '';
  darkMode: boolean = false;
  toolBarMenu: boolean = false;
  walletPopUp: boolean = false;
  strategyName: string = 'faucet';
  isShowingLoading: boolean = false;
  walletConnectivity: boolean = false;
  transactionPendingPopUp: boolean = false;
  strategyRedirect: string = config.routes.FAUCET.ROOT;
  shouldCheckCompliance: boolean = true;

  constructor() {
    super();

    makeObservable(this, {
      theme: observable,
      txHash: observable,
      userGeo: observable,
      darkMode: observable,
      isLoading: computed,
      isDarkMode: computed,
      localStorage: computed,
      toolBarMenu: observable,
      walletPopUp: observable,
      strategyName: observable,
      setIsLoading: action.bound,
      switchDarkMode: action.bound,
      isShowingLoading: observable,
      strategyRedirect: observable,
      showWalletPopUp: action.bound,
      walletConnectivity: observable,
      displayToolBarMenu: action.bound,
      transactionPendingPopUp: observable,
      setWalletConnectivity: action.bound,
      showTransactionPendingPopUp: action.bound,
      shouldCheckCompliance: observable,
    });

    const darkModeSaved = this.localStorage.getItem('isDarkMode');
    const isDark = window.matchMedia && window.matchMedia('(prefers-color-scheme:dark)').matches;
    if (darkModeSaved) {
      this.darkMode = darkModeSaved === '1';
      this.switchDarkMode(this.darkMode);
    } else if (isDark) {
      this.switchDarkMode(true);
    } else {
      this.switchDarkMode(false);
    }
  }

  setIsLoading(status: boolean) {
    this.isShowingLoading = status;
  }

  switchDarkMode(isDarkMode?: boolean) {
    this.darkMode = isDarkMode ?? !this.darkMode;
    const walletStore: WalletStore = this.getStore('Wallet');
    const theme = isDarkMode ? 'dark' : 'light';
    walletStore?.onboardSdk?.state.actions.updateTheme(theme);
    this.localStorage.setItem('isDarkMode', this.darkMode ? '1' : '0');
    this.theme = createTheme(AppTheme({ isDarkMode: this.isDarkMode }));
  }

  displayToolBarMenu(status: boolean) {
    this.toolBarMenu = status;
  }

  showTransactionPendingPopUp(status: boolean) {
    this.transactionPendingPopUp = status;
  }

  showWalletPopUp(status: boolean) {
    this.walletPopUp = status;
  }

  setWalletConnectivity(show: boolean) {
    this.walletConnectivity = show;
  }

  get localStorage() {
    try {
      return window.localStorage;
    } catch (e) {
      return {
        getItem(key: string): string | null {
          return key;
        },
        setItem(key: string, value: string) {
          return {
            key,
            value,
          };
        },
      };
    }
  }

  get isLoading() {
    return this.isShowingLoading;
  }

  get isDarkMode() {
    return this.darkMode;
  }
}

export default ApplicationStore;
