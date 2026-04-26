/**
 * ErrorBoundary — catches any unhandled JS exception in a screen's render tree
 * and shows a recovery UI instead of letting the whole app force-close.
 *
 * Why this matters for BUG-002:
 *   A "force close" on Android = an unhandled exception that React Native can't
 *   recover from. Without this, ANY throw in the Kitchen screen tree kills the
 *   app entirely. With this, the user sees "Something went wrong" + a retry
 *   button, and we get the error logged to the console for debugging.
 *
 * Usage: wrap any screen's default export.
 *   export default withErrorBoundary(KitchenHome, 'Kitchen');
 */
import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { tokens, fonts } from '../theme/tokens';

type State = { error: Error | null };

export class ErrorBoundary extends React.Component<
  { children: React.ReactNode; screenName?: string },
  State
> {
  constructor(props: any) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    // Log for debugging — visible in Metro and adb logcat.
    console.error(`[ErrorBoundary:${this.props.screenName ?? 'screen'}]`, error, info.componentStack);
  }

  render() {
    if (this.state.error) {
      return (
        <View
          style={{
            flex: 1,
            backgroundColor: tokens.bg,
            alignItems: 'center',
            justifyContent: 'center',
            padding: 32,
          }}
        >
          <Text style={{ fontSize: 40, marginBottom: 16 }}>⚠️</Text>
          <Text
            style={{
              fontFamily: fonts.display,
              fontSize: 22,
              color: tokens.ink,
              marginBottom: 8,
              textAlign: 'center',
            }}
          >
            Something went wrong
          </Text>
          <Text
            style={{
              fontFamily: fonts.sans,
              fontSize: 13,
              color: tokens.muted,
              textAlign: 'center',
              marginBottom: 24,
              lineHeight: 20,
            }}
          >
            {this.state.error.message ?? 'An unexpected error occurred.'}
          </Text>
          <Pressable
            onPress={() => this.setState({ error: null })}
            style={({ pressed }) => ({
              paddingHorizontal: 24,
              paddingVertical: 13,
              borderRadius: 999,
              backgroundColor: pressed ? tokens.peachDeep : tokens.peach,
            })}
          >
            <Text
              style={{
                fontFamily: fonts.sansBold,
                fontSize: 14,
                color: '#fff',
              }}
            >
              Try again
            </Text>
          </Pressable>
        </View>
      );
    }
    return this.props.children;
  }
}

/** HOC convenience wrapper */
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  screenName: string,
): React.ComponentType<P> {
  return function WrappedWithBoundary(props: P) {
    return (
      <ErrorBoundary screenName={screenName}>
        <Component {...props} />
      </ErrorBoundary>
    );
  };
}
