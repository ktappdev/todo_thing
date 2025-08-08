import { createNavigationContainerRef } from '@react-navigation/native';
import type { RootStackParamList } from './AppNavigator';

export const navigationRef = createNavigationContainerRef<RootStackParamList>();

export function resetTo(routeName: keyof RootStackParamList) {
  if (navigationRef.isReady()) {
    navigationRef.resetRoot({
      index: 0,
      routes: [{ name: routeName as any }],
    });
  } else {
    // In dev, log for debugging if reset attempted before ready
    if (__DEV__) {
      // eslint-disable-next-line no-console
      console.warn('navigationRef not ready; resetTo deferred');
    }
  }
}
