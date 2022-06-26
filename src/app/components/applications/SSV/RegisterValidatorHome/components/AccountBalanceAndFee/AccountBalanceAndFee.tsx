import { observer } from 'mobx-react';
import React, { useState } from 'react';
import { useHistory } from 'react-router-dom';
import Grid from '@material-ui/core/Grid';
import LinkText from '~app/components/common/LinkText';
import config, { translations } from '~app/common/config';
import BorderScreen from '~app/components/common/BorderScreen';
import Checkbox from '~app/components/common/CheckBox/CheckBox';
import PrimaryButton from '~app/components/common/Button/PrimaryButton';
import { useStyles } from '~app/components/applications/SSV/RegisterValidatorHome/components/AccountBalanceAndFee/AccountBalanceAndFee.styles';

const AccountBalanceAndFee = () => {
    const classes = useStyles();
    const history = useHistory();
    const [firstCheckBox, setFirstCheckBox] = useState(false);
    const [secondCheckBox, setSecondCheckBox] = useState(false);
    
    return (
      <BorderScreen
        blackHeader
        header={translations.VALIDATOR.BALANCE_AND_FEE.TITLE}
        body={[
          <Grid container>
            <Grid item container className={classes.bodyTextWrapper}>
              {translations.VALIDATOR.BALANCE_AND_FEE.BODY_TEXT.map((text: string) => {
                            return (
                              <Grid item className={classes.bodyText} key={text}>
                                {text}
                              </Grid>
                            );
                        })}
            </Grid>
            <Grid item container className={classes.ErrorTextWrapper}>
              <Grid className={classes.ErrorText}>
                Accounts with insufficient balance are at risk of being <LinkText text={'liquidated'} link={'Todo'} />,
                which will result in inactivation
                (<LinkText text={'penalties on the beacon chain'} link={'Todo'} />)
                of their validators, as they will no longer be operated by the network.
              </Grid>
            </Grid>
            <Checkbox
              grayBackGround
              onClickCallBack={setFirstCheckBox}
              text={'I understand that fees might change according to market dynamics'}
            />
            <Checkbox
              grayBackGround
              onClickCallBack={setSecondCheckBox}
              text={'I understand the risks of having my account liquidated'}
            />
            <PrimaryButton
              disable={!firstCheckBox || !secondCheckBox}
              text={'Next'}
              submitFunction={() => {
                            history.push(config.routes.VALIDATOR.SLASHING_WARNING);
                        }}
            />
          </Grid>,
            ]}
        />
    );
};
export default observer(AccountBalanceAndFee);
