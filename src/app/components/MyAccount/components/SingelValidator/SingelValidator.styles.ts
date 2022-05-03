import { makeStyles } from '@material-ui/core/styles';

export const useStyles = makeStyles((theme) => ({
    SingleValidatorWrapper: {},
    FirstSectionWrapper: {
        height: 308,
        // width: 648,
        // margin: 'auto',
        // [screenSizes.xs]: {
        //     width: '100%',
        // },
        // [screenSizes.md]: {
        //     width: 452,
        // },
        // [screenSizes.lg]: {
        //     width: 648,
        // },
        width: '100%',
        paddingLeft: 300,
        paddingRight: 300,
        backgroundColor: theme.colors.white,
    },
    HeaderWrapper: {
        marginTop: 40,
        marginBottom: 32,
    },
    Header: {
        fontSize: 28,
        fontWeight: 800,
        lineHeight: 1.24,
        color: theme.colors.gray90,
    },
    Options: {
        width: 24,
        height: 24,
        cursor: 'pointer',
        backgroundSize: 'contain',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        marginRight: theme.spacing(2),
        marginLeft: theme.spacing(2),
        backgroundImage: `url(/images/three_dots/${theme.darkMode ? 'dark' : 'light'}.svg)`,
    },
    FieldsWrapper: {
        gap: 100,
        marginBottom: 62,
        // '@media (max-width: 1200px)': {
        //     gap: '15%',
        // },
    },
    SettingsWrapper: {
        position: 'relative',
    },
    DetailsHeader: {
        gap: 4,
        fontSize: 14,
        fontWeight: 500,
        display: 'flex',
        lineHeight: 1.62,
        alignItems: 'center',
        letterSpacing: 'normal',
        color: theme.colors.gray40,
    },
    DetailsBody: {
        fontSize: 16,
        fontWeight: 500,
        lineHeight: 1.62,
        color: theme.colors.gray90,
    },
    Settings: {
        gap: 8,
        top: -20,
        right: 0,
        width: 272,
        height: 88,
        display: 'flex',
        padding: '16px',
        borderRadius: 16,
        position: 'absolute',
        flexDirection: 'column',
        alignItems: 'flex-start',
        justifyContent: 'flex-start',
        backgroundColor: theme.colors.white,
        boxShadow: '0 12px 40px 0 #0116271e',
        border: `solid 1px ${theme.colors.gray10}`,
    },
    Button: {
        gap: 10,
        height: 56,
        flexGrow: 0,
        fontSize: 16,
        borderRadius: 8,
        display: 'flex',
        fontWeight: 600,
        lineHeight: 1.25,
        cursor: 'pointer',
        flexDirection: 'row',
        alignItems: 'center',
        padding: '18px 24px',
        justifyContent: 'flex-start',
        color: theme.colors.primaryError,
    },
    Links: {
        marginBottom: 32,
    },
    Explorer: {},
    BlueExplorerImage: {
        width: 24,
        height: 24,
        marginLeft: 4,
        marginRight: 60,
        cursor: 'pointer',
        backgroundSize: 'contain',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        backgroundImage: 'url(/images/explorer/blue.svg)',
    },
    PerformanceHeader: {
        fontSize: 16,
        fontWeight: 500,
        lineHeight: 1.62,
        color: theme.colors.gray90,
    },
    ExplorerImage: {
        width: 24,
        height: 24,
        cursor: 'pointer',
        backgroundSize: 'contain',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        backgroundImage: `url(/images/chart/${theme.darkMode ? 'dark' : 'light'}.svg)`,
    },
    BeaconImage: {
        width: 24,
        height: 24,
        marginLeft: 4,
        cursor: 'pointer',
        backgroundSize: 'contain',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        backgroundImage: 'url(/images/beacon/blue.svg)',
    },
    SecondSectionWrapper: {
        marginTop: 24,
    },
    OperatorsWrapper: {
        width: '100%',
        marginLeft: 300,
        marginRight: 300,
    },
    Edit: {
        gap: 10,
        width: 93,
        height: 36,
        fontSize: 16,
        fontWeight: 600,
        borderRadius: 8,
        display: 'flex',
        lineHeight: 1.25,
        cursor: 'pointer',
        padding: '8px 31px',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        textTransform: 'capitalize',
        color: theme.colors.primaryBlue,
        backgroundColor: theme.colors.tint90,
        '&:hover': {
            backgroundColor: theme.colors.tint80,
        },
        '&:active': {
            backgroundColor: theme.colors.tint70,
        },
        '&:disabled': {
            color: theme.colors.gray40,
            backgroundColor: theme.colors.gray20,
        },
    },
}));