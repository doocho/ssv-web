import React from 'react';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import LinkText from '~app/components/common/LinkText';
import BorderScreen from '~app/components/common/BorderScreen';
import HeaderSubHeader from '~app/components/common/HeaderSubHeader';
import GoogleTagManager from '~lib/analytics/GoogleTag/GoogleTagManager';
import SecondaryButton from '~app/components/common/Button/SecondaryButton';
import { useStyles } from '~app/components/applications/Distribution/components/Success/Success.styles';
import { getTransactionLink } from '~root/providers/networkInfo.provider';
import { useAppDispatch, useAppSelector } from '~app/hooks/redux.hook';
import { getTxHash } from '~app/redux/appState.slice';
import { registerSSVTokenInMetamask } from '~root/services/distribution.service';
import WalletStore from '~app/common/stores/applications/Faucet/Wallet.store';
import { useStores } from '~app/hooks/useStores';
import { getIsMainnet } from '~app/redux/wallet.slice';
import { setMessageAndSeverity } from '~app/redux/notifications.slice';
import { AlertColor } from '@mui/material/Alert';

const Success = () => {
  const classes = useStyles();
  const stores = useStores();
  const walletStore: WalletStore = stores.Wallet;
  const txHash = useAppSelector(getTxHash);
  const isMainnet = useAppSelector(getIsMainnet);
  const dispatch = useAppDispatch();

  const openMarketingSite = () => {
    GoogleTagManager.getInstance().sendEvent({
      category: 'external_link',
      action: 'click',
      label: 'Learn more about the SSV network',
    });
    window.open('https://ssv.network/');
  };

  const notificationHandler = ({ message, severity }: { message: string; severity: AlertColor }) => {
    dispatch(setMessageAndSeverity({ message, severity }));
  };

  return (
    <BorderScreen
      withoutNavigation
      body={[
        <Grid container className={classes.Wrapper}>
          <HeaderSubHeader
            rewardPage
            title={'Rewards Successfully Claimed!'}
            subtitle={<span>Thank you for joining the SSV network's {isMainnet ? 'Mainnet' : 'Testnet'} Incentivization Program.<br />Your tokens have been transferred to your wallet.</span>}
          />
          <Grid item container className={classes.AddSsvToWallet}
            onClick={() => registerSSVTokenInMetamask({ provider: walletStore.wallet.provider, notificationHandler })}>
            <Grid item className={classes.MetaMask} />
            <Typography component={'span'}>Add SSV to Metamask</Typography>
          </Grid>
          <Grid className={classes.LinkWrapper}>
            <LinkText text={'View Transaction on Etherscan'} link={getTransactionLink(txHash)} />
          </Grid>
          <SecondaryButton submitFunction={openMarketingSite} children={'Learn more about the SSV network'} />
        </Grid>,
      ]}
    />
  );
};

export default Success;
