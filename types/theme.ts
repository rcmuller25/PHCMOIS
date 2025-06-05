import { MD3Theme } from 'react-native-paper';
import { spacing, typography, borderRadius } from '../constants/theme';
import { elevation } from '../constants/material3Theme';

export interface Theme extends MD3Theme {
  spacing: typeof spacing;
  typography: typeof typography;
  borderRadius: typeof borderRadius;
  elevation: typeof elevation;
} 