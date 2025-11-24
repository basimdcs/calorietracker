import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { StackNavigationProp } from '@react-navigation/stack';
import { useNavigation } from '@react-navigation/native';
import { colors, fonts, spacing } from '../../constants/theme';
import { DailyView } from '../../components/ui/DailyView';
import { useUser } from '../../hooks/useUser';
import { useFoodData } from '../../hooks/useFoodData';
import { useRTLStyles } from '../../utils/rtl';
import { useTranslation } from '../../hooks/useTranslation';
import { SettingsStackParamList } from '../../types';

const HomeScreen: React.FC = () => {
  const navigation = useNavigation<StackNavigationProp<SettingsStackParamList>>();
  const { profile } = useUser();
  const { todayLog, debug, allDailyLogs } = useFoodData();
  const { rtlMarginRight, rtlRow } = useRTLStyles();
  const { t } = useTranslation();

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View style={[styles.headerContent, rtlRow]}>
            <TouchableOpacity
              style={[styles.avatarContainer, rtlMarginRight(spacing.md)]}
              onPress={() => navigation.navigate('Settings')}
            >
              <View style={styles.avatarPlaceholder}>
                <MaterialIcons name="person" size={28} color={colors.white} />
              </View>
            </TouchableOpacity>
            <View style={styles.headerLeft}>
              <Text style={styles.greeting}>{t('home.greeting', { name: profile?.name || t('common.user') })}</Text>
              <Text style={styles.headerTitle}>{t('home.todaySummary')}</Text>
            </View>
          </View>
        </View>
        
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          <DailyView
            dailyLog={todayLog}
            date={debug.todayDate}
            title={t('home.caloriesConsumed')}
            showDateHeader={false}
            onEmptyStatePress={() => navigation.navigate('Voice' as any)}
          />
        </ScrollView>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.white,
  },
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  header: {
    backgroundColor: colors.white,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  avatarContainer: {
    // marginRight handled by rtlMarginRight
  },
  avatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerLeft: {
    flex: 1,
  },
  greeting: {
    fontSize: fonts.sm,
    fontFamily: fonts.body,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  headerTitle: {
    fontSize: fonts.lg,
    fontFamily: fonts.heading,
    color: colors.textPrimary,
  },
  scrollView: {
    flex: 1,
  },
});

export default HomeScreen; 