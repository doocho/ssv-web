import { useAppDispatch, useAppSelector } from '~app/hooks/redux.hook';
import { getIsDarkMode, toggleDarkMode } from '~app/redux/appState.slice';

type Props = {
  margin?: boolean;
};

const DarkModeSwitcher = (props: Props) => {
  const { margin } = props;
  const isDarkMode = useAppSelector(getIsDarkMode);
  const dispatch = useAppDispatch();
  // const classes = useStyles({ isDarkMode, margin });

  return (
    <button
      onClick={() => dispatch(toggleDarkMode())}
      className="p-2 rounded-full bg-gray-200 dark:bg-gray-800 transition-colors duration-200"
      aria-label={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
      style={{ margin: margin ? '0 0 0 1.5rem' : '0' }}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="currentColor"
        stroke="currentColor"
        className="w-6 h-6 text-gray-800 dark:text-gray-200 transition-transform duration-500"
        style={{ transform: isDarkMode ? 'rotate(40deg)' : 'rotate(90deg)' }}
      >
        {isDarkMode ? (
          // Moon icon
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
        ) : (
          // Sun icon
          <>
            <circle cx="12" cy="12" r="5" />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"
            />
          </>
        )}
      </svg>
    </button>
  );
  // return <Grid item className={classes.Image} onClick={() => dispatch(toggleDarkMode())} />;
};

export default DarkModeSwitcher;
