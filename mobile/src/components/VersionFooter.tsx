/**
 * VersionFooter — tiny muted line at the bottom of a screen.
 *
 * Always-visible build identifier so when a user reports a bug we know
 * exactly which version they were running. Placed at the bottom of the
 * pantry tab where the eye lands after scrolling — non-intrusive but
 * findable.
 */
import React from 'react';
import { Text, View } from 'react-native';
import { tokens, fonts } from '../theme/tokens';
import { VERSION_LABEL } from '../data/version';

export function VersionFooter({
  paddingBottom = 24,
}: {
  paddingBottom?: number;
}) {
  return (
    <View
      style={{
        alignItems: 'center',
        paddingTop: 12,
        paddingBottom,
      }}
    >
      <Text
        style={{
          fontFamily: fonts.sans,
          fontSize: 10,
          letterSpacing: 1,
          textTransform: 'uppercase',
          color: tokens.muted,
          opacity: 0.7,
        }}
        accessibilityLabel={`Tucker & Spice ${VERSION_LABEL}`}
      >
        Tucker & Spice · {VERSION_LABEL}
      </Text>
    </View>
  );
}
