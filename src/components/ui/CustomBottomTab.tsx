import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, fonts, spacing, shadows } from '../../constants/theme';

interface TabItem {
  key: string;
  title: string;
  icon: keyof typeof MaterialIcons.glyphMap;
  activeIcon?: keyof typeof MaterialIcons.glyphMap;
}

interface CustomBottomTabProps {
  state: any;
  descriptors: any;
  navigation: any;
}

const tabs: TabItem[] = [
  {
    key: 'Home',
    title: 'Home',
    icon: 'home',
    activeIcon: 'home',
  },
  {
    key: 'Voice',
    title: 'Add',
    icon: 'add',
    activeIcon: 'add',
  },
  {
    key: 'History',
    title: 'History',
    icon: 'history',
    activeIcon: 'history',
  },
  {
    key: 'Settings',
    title: 'Settings',
    icon: 'settings',
    activeIcon: 'settings',
  },
];

export const CustomBottomTab: React.FC<CustomBottomTabProps> = ({
  state,
  descriptors,
  navigation,
}) => {
  const insets = useSafeAreaInsets();
  
  return (
    <View style={[styles.container, { paddingBottom: Math.max(insets.bottom, spacing.sm) }]}>
      {state.routes.map((route: any, index: number) => {
        const { options } = descriptors[route.key];
        const label = options.tabBarLabel ?? options.title ?? route.name;

        const isFocused = state.index === index;

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });

          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };

        const tab = tabs.find(t => t.key === route.name);
        if (!tab) return null;


        return (
          <TouchableOpacity
            key={route.key}
            accessibilityRole="button"
            accessibilityState={isFocused ? { selected: true } : {}}
            accessibilityLabel={options.tabBarAccessibilityLabel}
            testID={options.tabBarTestID}
            onPress={onPress}
            style={styles.tab}
          >
            <View style={styles.tabContent}>
              <MaterialIcons
                name={isFocused ? tab.activeIcon || tab.icon : tab.icon}
                size={tab.key === 'Voice' ? 28 : 24}
                color={isFocused ? colors.primary : colors.gray600}
                style={tab.key === 'Voice' ? { fontWeight: 'bold' } : undefined}
              />
              <Text
                style={[
                  styles.tabLabel,
                  { color: isFocused ? colors.primary : colors.gray600 },
                ]}
              >
                {tab.title}
              </Text>
            </View>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.gray200,
    paddingTop: spacing.sm,
    ...shadows.md,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabLabel: {
    fontSize: fonts.xs,
    fontWeight: '700' as const,
    marginTop: spacing.xs,
  },
}); 