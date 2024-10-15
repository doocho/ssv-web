declare module '@mui/material/styles' {
  interface Theme {
    colors?: any;
    opacity?: any;
    darkMode?: any;
    appSpacing?: any;
    newStage?: boolean;
    applicationBackgroundColor?: any;
  }

  interface ThemeOptions {
    colors?: any;
    opacity?: any;
    darkMode?: any;
    appSpacing?: any;
    newStage?: boolean;
    applicationBackgroundColor?: any;
  }
}

type ThemeParams = {
  isDarkMode?: boolean;
};

export const AppTheme = ({ isDarkMode }: ThemeParams): any => {
  return {
    spacing: 4,
    darkMode: isDarkMode,
    applicationBackgroundColor: isDarkMode ? '#000000' : '#ffffff', // 다크 모드에서 검은 배경, 라이트 모드에서 흰 배경
    colors: {
      gray0: isDarkMode ? '#0d0d0d' : '#f9f9f9', // 어두운 회색과 밝은 회색
      gray10: isDarkMode ? '#000000' : '#f4f4f4', // 다크 모드에서 완전 블랙, 라이트 모드에서 밝은 회색
      gray20: isDarkMode ? '#1a1a1a' : '#e6e6e6', // 더 짙은 회색
      gray30: isDarkMode ? '#2e2e2e' : '#cccccc', // 중간 회색
      gray40: '#404040', // 회색 계열 고정
      gray60: isDarkMode ? '#cccccc' : '#2e2e2e', // 회색 대조 강화
      gray80: isDarkMode ? '#e6e6e6' : '#1a1a1a', // 밝은 회색과 어두운 회색
      gray90: isDarkMode ? '#f7f7f7' : '#0d0d0d', // 거의 흰색과 거의 블랙
      gray100: isDarkMode ? '#f9f9f9' : '#0d0d0d', // 흰색과 검은색 반전
      black: isDarkMode ? '#ffffff' : '#000000', // 흰색과 블랙 반전
      white: isDarkMode ? '#000000' : '#ffffff', // 다크 모드에서 블랙, 라이트 모드에서 흰색
      primaryBlue: isDarkMode ? '#1a1a1a' : '#f0f0f0', // 블루 대신 중립적인 회색
      shade20: isDarkMode ? '#333333' : '#cccccc', // 회색 계열
      shade40: isDarkMode ? '#4d4d4d' : '#b3b3b3', // 어두운 회색
      shade70: isDarkMode ? '#6f6f6f' : '#999999', // 짙은 회색과 중간 회색
      shade80: isDarkMode ? '#8c8c8c' : '#666666', // 회색 톤 차이 강화
      shade90: isDarkMode ? '#a6a6a6' : '#404040', // 밝은 회색에서 중간 회색으로
      tint20: isDarkMode ? '#333333' : '#cccccc', // 회색 계열로 통일
      tint40: isDarkMode ? '#4d4d4d' : '#b3b3b3',
      tint70: isDarkMode ? '#6f6f6f' : '#999999',
      tint80: isDarkMode ? '#8c8c8c' : '#666666',
      tint90: isDarkMode ? '#a6a6a6' : '#404040',
      primarySuccessDark: isDarkMode ? '#1a1a1a' : '#4d4d4d', // 성공 색상도 블랙 계열로 조정
      primaryWarningRegular: 'rgba(255, 210, 10, 0.2)', // 경고 색상 유지
      squareScreenBackground: isDarkMode ? '#0d0d0d' : '#ffffff', // 배경 색상
      squareScreenBackgroundDeleted: isDarkMode ? '#1a1a1a' : '#f0f0f0', // 삭제된 배경 색상
      primaryError: '#ec1c26', // 에러 색상 유지
      primarySuccess: '#1a1a1a', // 성공 색상을 블랙으로 조정
      primaryErrorRegular: isDarkMode ? 'rgba(236, 28, 38, 0.32)' : 'rgba(236, 28, 38, 0.12)', // 에러 관련 색상 유지
      primarySuccessRegularOpacity: isDarkMode ? 'rgba(26, 26, 26, 0.32)' : 'rgba(26, 26, 26, 0.16)', // 성공 색상도 블랙 계열로 조정
      warning: '#ffd20a' // 경고 색상 유지
    },
    opacity: {
      lowPriority: 1,
      mediumPriority: 2,
      highPriority: 3
    }
  };
};
