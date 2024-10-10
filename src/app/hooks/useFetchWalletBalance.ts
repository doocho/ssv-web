import { useEffect, useState, useCallback } from 'react';
import { setIsShowSsvLoader } from '~app/redux/appState.slice';
import { getWalletBalance } from '~root/services/tokenContract.service';
import { useAppDispatch, useAppSelector } from '~app/hooks/redux.hook';
import { getAccountAddress } from '~app/redux/wallet.slice';

const useFetchWalletBalance = () => {
  const [walletSsvBalance, setWalletSsvBalance] = useState(0);
  const [reload, setReload] = useState(false);
  const accountAddress = useAppSelector(getAccountAddress);
  const dispatch = useAppDispatch();

  const fetchWalletBalance = useCallback(async () => {
    dispatch(setIsShowSsvLoader(true));
    const balance = await getWalletBalance({ accountAddress });
    setWalletSsvBalance(balance);
    dispatch(setIsShowSsvLoader(false));
  }, [accountAddress, dispatch]);

  useEffect(() => {
    fetchWalletBalance();
  }, [accountAddress, fetchWalletBalance]);

  useEffect(() => {
    const reloadFunc = async () => {
      if (reload) {
        const balance = await getWalletBalance({ accountAddress });
        setWalletSsvBalance(balance);
        setReload(false);
      }
    };
    reloadFunc();
  }, [reload, fetchWalletBalance]);

  const reloadBalance = () => setReload(true);

  return { walletSsvBalance, reloadBalance };
};

export default useFetchWalletBalance;
