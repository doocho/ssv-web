const getColors = ({ isDarkMode }: { isDarkMode: boolean }) => ({
  isDarkMode: isDarkMode,
  gray0: isDarkMode ? '#0d0d0d' : '#f7f7f7', // 더 어두운 블랙과 밝은 화이트 톤
  gray10: isDarkMode ? '#1a1a1a' : '#e6e6e6', // 중간 회색 조정
  gray20: isDarkMode ? '#262626' : '#cccccc', // 조금 더 어두운 회색
  gray30: isDarkMode ? '#333333' : '#b3b3b3', // 명확한 톤 차이
  gray40: isDarkMode ? '#404040' : '#999999', // 어두운 회색 추가
  gray60: isDarkMode ? '#666666' : '#808080', // 중간 회색 추가
  gray80: isDarkMode ? '#999999' : '#666666', // 밝은 회색으로 조정
  gray90: isDarkMode ? '#cccccc' : '#404040', // 거의 흰색에 가까운 회색
  gray100: isDarkMode ? '#e6e6e6' : '#262626', // 라이트모드에서 더 어두운 톤
  black: isDarkMode ? '#f7f7f7' : '#0d0d0d', // 블랙과 화이트 대비
  white: isDarkMode ? '#0d0d0d' : '#f7f7f7', // 다크모드에서 흰색을 더 어둡게
  primaryBlue: isDarkMode ? '#f0f0f0' : '#101010', // 파란 계열 대신 중립적 회색
  shade20: isDarkMode ? '#d9d9d9' : '#2e2e2e', // 좀 더 회색 느낌 추가
  shade40: isDarkMode ? '#474747' : '#c0c0c0', // 톤 차이 강화
  shade70: isDarkMode ? '#6f6f6f' : '#999999', // 명도 조정
  shade80: isDarkMode ? '#8c8c8c' : '#666666', // 짙은 회색 추가
  shade90: isDarkMode ? '#a6a6a6' : '#404040', // 아주 밝은 회색
  tint20: isDarkMode ? '#2e2e2e' : '#d9d9d9',
  tint40: isDarkMode ? '#474747' : '#c0c0c0',
  tint70: isDarkMode ? '#6f6f6f' : '#999999',
  tint80: isDarkMode ? '#8c8c8c' : '#666666',
  tint90: isDarkMode ? '#a6a6a6' : '#404040',
  primarySuccessDark: isDarkMode ? '#1a1a1a' : '#4d4d4d', // 블랙 느낌으로 조정
  primaryWarningRegular: 'rgba(255, 210, 10, 0.2)',
  squareScreenBackground: isDarkMode ? '#0d0d0d' : '#f7f7f7',
  squareScreenBackgroundDeleted: isDarkMode ? '#1a1a1a' : '#f0f0f0',
  primaryError: '#ec1c26',
  primarySuccess: '#1a1a1a', // 블랙 느낌 유지
  primaryErrorRegular: isDarkMode ? 'rgba(236, 28, 38, 0.32)' : 'rgba(236, 28, 38, 0.12)',
  primarySuccessRegularOpacity: isDarkMode ? 'rgba(26, 26, 26, 0.32)' : 'rgba(26, 26, 26, 0.16)',
  warning: '#ffd20a',
  activeBackground: 'rgba(200, 200, 200, 0.60)', // 회색 배경 느낌 추가
  loaderColor: isDarkMode ? 'rgba(255, 255, 255, 1)' : 'rgba(0, 0, 0, 1)',
  pale12: isDarkMode ? 'rgba(236, 28, 38, 0.2)' : 'rgba(236, 28, 38, 0.05)',
  pale16: 'rgba(26, 26, 26, 0.16)'
});

export { getColors };
