import { observer } from 'mobx-react';
import { Grid } from '@material-ui/core';
import Typography from '@material-ui/core/Typography';
import { useHistory, useParams } from 'react-router-dom';
import React, { useEffect, useState } from 'react';
import config from '~app/common/config';
import Validator from '~lib/api/Validator';
import { useStores } from '~app/hooks/useStores';
import Status from '~app/common/components/Status';
import { longStringShorten } from '~lib/utils/strings';
import { Table } from '~app/common/components/Table/Table';
import ToolTip from '~app/common/components/ToolTip/ToolTip';
import SsvAndSubTitle from '~app/common/components/SsvAndSubTitle';
import SsvStore from '~app/common/stores/applications/SsvWeb/SSV.store';
import SecondaryButton from '~app/common/components/Button/SecondaryButton';
import WalletStore from '~app/common/stores/applications/SsvWeb/Wallet.store';
import WhiteWrapper from '~app/common/components/WhiteWrapper/WhiteWrapper';
import ApplicationStore from '~app/common/stores/applications/SsvWeb/Application.store';
import { IOperator } from '~app/common/stores/applications/SsvWeb/Operator.store';
import { useStyles } from '~app/components/MyAccount/components/SingleValidator/SingleValidator.styles';
import OperatorDetails from '~app/components/RegisterValidatorHome/components/SelectOperators/components/FirstSquare/components/OperatorDetails';
import ImageDiv from '~app/common/components/ImageDiv/ImageDiv';

const SingleValidator = () => {
    const stores = useStores();
    const classes = useStyles();
    const history = useHistory();
    // @ts-ignore
    const { public_key } = useParams();
    const ssvStore: SsvStore = stores.SSV;
    const walletStore: WalletStore = stores.Wallet;
    const [validator, setValidator] = useState(null);
    const applicationStore: ApplicationStore = stores.Application;

    useEffect(() => {
        applicationStore.setIsLoading(true);
        Validator.getInstance().getValidator(public_key).then((response: any) => {
            if (response) {
                response.public_key = longStringShorten(public_key, 6, 4);
                response.total_operators_fee = ssvStore.getFeeForYear(response.operators.reduce(
                    (previousValue: number, currentValue: IOperator) => previousValue + walletStore.fromWei(currentValue.fee),
                    0,
                ));
                setValidator(response);
                applicationStore.setIsLoading(false);
            }
        });
    }, []);

    const fields = [
        { key: 'status', value: 'Status' },
        { key: 'balance', value: 'Balance' },
        { key: 'apr', value: 'Est. APR' },
        { key: 'total_operators_fee', value: 'Total Operators Fee' },
    ];
    const removeValidatorPage = () => {
        history.push(`/dashboard/validator/${public_key}/remove`);
    };
    removeValidatorPage;

    const data = React.useMemo(
        () => {
            // return validator operators mapped with additional fields fee and performance
            // @ts-ignore
            return validator?.operators?.map((operator: any) => {
                // eslint-disable-next-line no-param-reassign
                operator.performance = operator.performances['24hours'] || '0%';
                const {
                    fee,
                    name,
                    type,
                    status,
                    address,
                    performance,
                } = operator;

                return {
                    public_key: <OperatorDetails operator={{
                        status,
                        name,
                        type,
                        address,
                        fee,
                    }} />,
                    status: <Status status={status} />,
                    performance: <Typography className={classes.PerformanceHeader}>{performance}</Typography>,
                    fee: <Grid item container justify={'space-between'}>
                      <Grid item>
                        <SsvAndSubTitle leftTextAlign ssv={ssvStore.getFeeForYear(walletStore.fromWei(operator.fee))} subText={'~$757.5'} />
                      </Grid>

                      {/* <Grid item container xs> */}
                      {/*  <Grid item xs={12}> */}
                      {/*    <Typography>{operatorStore.getFeePerYear(walletStore.fromWei(operator.fee))} SSV</Typography> */}
                      {/*  </Grid> */}
                      {/*  <Grid item>~$757.5</Grid> */}
                      {/* </Grid> */}
                      <Grid item className={classes.ExplorerImage} onClick={() => { window.open(`${config.links.LINK_EXPLORER}/operators/${address}`); }} />
                    </Grid>,
                };
            });
        },
        [validator, applicationStore.darkMode],
    );

    const editValidator = () => {
        history.push(`/dashboard/validator/${public_key}/edit`);
    };
    
    const columns = React.useMemo(
        () => [
            {
                id: 'col13',
                Header: <Grid container justify={'space-between'} alignItems={'center'}>
                  <Typography>My Operators</Typography>
                  <SecondaryButton disable={ssvStore.userLiquidated} className={classes.Edit} submitFunction={editValidator} text={'Edit'} />
                </Grid>,
                columns: [
                    {
                        Header: 'Public key',
                        accessor: 'public_key',
                    },
                    {
                        Header: <Grid container item alignItems={'center'}>
                          <Grid item style={{ marginRight: 4 }}>
                            Status
                          </Grid>
                          <ToolTip text={'Is the operator performing duties for the majority of its validators for the last 2 epochs.'} />
                        </Grid>,
                        accessor: 'status',
                    },
                    {
                        Header: '1D Performance',
                        accessor: 'performance',
                    },
                    {
                        Header: 'Yearly Fee',
                        accessor: 'fee',
                    },
                ],
            },
        ], [applicationStore.darkMode],
    );

    if (!validator) return null;

    return (
      <Grid container className={classes.SingleValidatorWrapper}>
        <WhiteWrapper
          withSettings={{
              text: 'Remove Validator',
              onClick: () => {
                  history.push(`/dashboard/validator/${public_key}/remove`);
              },
          }}
          header={'Validator Details'}
        >
          <Grid item container className={classes.FieldsWrapper}>
            <Grid item>
              <Grid className={classes.DetailsHeader}>
                Address
              </Grid>
              <Grid item container className={classes.SubHeaderWrapper}>
                <Typography>{longStringShorten(public_key, 6, 4)}</Typography>
                <ImageDiv image={'copy'} width={24} height={24} />
                <ImageDiv image={'explorer'} width={24} height={24} />
                <ImageDiv image={'beacon'} width={24} height={24} />
              </Grid>
            </Grid>
            {fields.map((field: { key: string, value: string }, index: number) => {
                      // @ts-ignore
                      const fieldKey = validator[field.key];
                      return (
                        <Grid key={index} item>
                          <Grid className={classes.DetailsHeader}>
                            {field.value}
                            {field.key === 'status' && <ToolTip text={'Refers to the validator’s status in the SSV network (not beacon chain), and reflects whether its operators are consistently performing their duties (according to the last 2 epochs).'} />}
                          </Grid>
                          <Grid className={classes.DetailsBody}>
                            {field.key === 'status' ? <Status status={fieldKey} /> : fieldKey}
                          </Grid>
                        </Grid>
                      );
                  })}
          </Grid>
        </WhiteWrapper>
        <Grid item container className={classes.SecondSectionWrapper}>
          <Grid item className={classes.OperatorsWrapper}>
            <Table columns={columns} data={data} hideActions />
          </Grid>
        </Grid>
      </Grid>
    );
};

export default observer(SingleValidator);