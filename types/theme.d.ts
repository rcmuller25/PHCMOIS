import { Theme as PaperTheme } from 'react-native-paper';
import { spacing, typography, borderRadius, animation, shadows, colors } from '../constants/theme';

declare global {
  namespace ReactNativePaper {
    interface ThemeColors {
      // Add any custom color properties here
      customColors: typeof colors.light;
    }
    
    interface Theme {
      spacing: typeof spacing;
      typography: typeof typography & {
        fontFamily: {
          regular: string;
          medium: string;
          semibold: string;
          bold: string;
        };
      };
      borderRadius: typeof borderRadius;
      animation: typeof animation;
      shadows: typeof shadows;
    }
  }
}

// This allows us to use our custom theme properties with useTheme
declare module 'react-native-paper' {
  export interface Theme extends PaperTheme {
    spacing: typeof spacing;
    typography: typeof typography;
    customColors: typeof colors.light;
    borderRadius: typeof borderRadius;
    animation: typeof animation;
    shadows: typeof shadows;
  }
}
