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
import { colors, fonts, spacing } from '../../constants/theme';
import { DailyView } from '../../components/ui/DailyView';
import { useUser } from '../../hooks/useUser';
import { useFoodData } from '../../hooks/useFoodData';

const HomeScreen: React.FC = () => {
  const { profile } = useUser();
  const { todayLog, debug } = useFoodData();

  // Log debug info on mount
  React.useEffect(() => {
    console.log('🏠 HomeScreen mounted with:', debug);
  }, [debug]);
  
  // Debug info
  console.log('🏠 HomeScreen Debug:', debug);


  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <View style={styles.avatarContainer}>
              <View style={styles.avatarPlaceholder}>
                <MaterialIcons name="person" size={28} color={colors.white} />
              </View>
            </View>
            <View style={styles.headerLeft}>
              <Text style={styles.greeting}>Hello, {profile?.name || 'User'}</Text>
              <Text style={styles.headerTitle}>Today's Summary</Text>
            </View>
            <TouchableOpacity style={styles.menuButton}>
              <View style={styles.menuDots}>
                <View style={styles.dot} />
                <View style={styles.dot} />
                <View style={styles.dot} />
              </View>
            </TouchableOpacity>
          </View>
        </View>
        
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          <DailyView 
            dailyLog={todayLog}
            date={debug.todayDate}
            title="Calories Consumed"
            showDateHeader={false}
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
    marginRight: spacing.md,
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
  menuButton: {
    padding: spacing.sm,
  },
  menuDots: {
    flexDirection: 'column',
    alignItems: 'center',
    gap: 3,
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.textPrimary,
  },
  scrollView: {
    flex: 1,
  },
});

export default HomeScreen; 