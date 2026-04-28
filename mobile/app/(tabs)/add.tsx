/**
 * Add — user-authored recipes (Rule #4).
 *
 * Placeholder with a clear call-to-action. The full multi-step form
 * will land after the core loop is stable. Keeping this visible
 * (rather than hiding the tab) so the information architecture
 * is clear to new users from day one.
 */
import React from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { tokens, fonts, shadows } from '../../src/theme/tokens';
import { Icon } from '../../src/components/Icon';

export default function AddTab() {
  const insets = useSafeAreaInsets();
  return (
    <ScrollView
      contentContainerStyle={{
        flex: 1,
        backgroundColor: tokens.bg,
        paddingTop: insets.top + 40,
        paddingHorizontal: 24,
        paddingBottom: 140,
      }}
      style={{ backgroundColor: tokens.bg }}
    >
      {/* Icon */}
      <View
        style={{
          width: 64,
          height: 64,
          borderRadius: 20,
          backgroundColor: tokens.primaryLight,
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 20,
        }}
      >
        <Icon name="chef" size={30} color={tokens.primary} />
      </View>

      {/* Kicker */}
      <Text
        style={{
          fontFamily: fonts.sansBold,
          fontSize: 11,
          letterSpacing: 2,
          textTransform: 'uppercase',
          color: tokens.primary,
          marginBottom: 6,
        }}
      >
        Your recipes
      </Text>

      {/* Headline */}
      <Text
        style={{
          fontFamily: fonts.display,
          fontSize: 32,
          lineHeight: 36,
          color: tokens.ink,
          marginBottom: 12,
        }}
      >
        Add your own{'\n'}
        <Text
          style={{
            fontFamily: fonts.displayItalic,
            fontStyle: 'italic',
            color: tokens.primary,
          }}
        >
          recipe
        </Text>
      </Text>

      <Text
        style={{
          fontFamily: fonts.sans,
          fontSize: 14,
          color: tokens.inkSoft,
          lineHeight: 21,
          marginBottom: 28,
        }}
      >
        Add recipes in the same structured format the app uses — ingredients
        with scaling modes, step-by-step method with "look for" cues, and
        optional photo at each stage.{'\n\n'}
        The form is coming in the next update. For now, tap the chef-inspired
        recipes on the Kitchen tab to see the format recipes follow.
      </Text>

      {/* Coming soon card */}
      <View
        style={{
          backgroundColor: tokens.cream,
          borderRadius: 20,
          borderWidth: 1,
          borderColor: tokens.lineDark,
          padding: 20,
          gap: 12,
          ...shadows.card,
        }}
      >
        {[
          { icon: 'check' as const, label: 'Title, tagline, description' },
          { icon: 'check' as const, label: 'Ingredients with linear / fixed / custom scaling' },
          { icon: 'check' as const, label: 'Method steps with doneness cues' },
          { icon: 'check' as const, label: 'Stage photos (your own shots)' },
          { icon: 'check' as const, label: 'Chef attribution link (optional)' },
        ].map(({ icon, label }) => (
          <View key={label} style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <View
              style={{
                width: 28,
                height: 28,
                borderRadius: 14,
                backgroundColor: tokens.sageLight,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Icon name={icon} size={14} color={tokens.sage} />
            </View>
            <Text
              style={{
                flex: 1,
                fontFamily: fonts.sans,
                fontSize: 13,
                color: tokens.inkSoft,
                lineHeight: 18,
              }}
            >
              {label}
            </Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}
