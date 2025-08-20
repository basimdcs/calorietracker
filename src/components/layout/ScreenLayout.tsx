import React from 'react';
import {
  View,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  RefreshControl,
  StatusBar,
} from 'react-native';
import { colors, spacing } from '../../constants/theme';

interface ScreenLayoutProps {
  children: React.ReactNode;
  header?: React.ReactNode;
  scrollable?: boolean;
  refreshing?: boolean;
  onRefresh?: () => void;
  style?: any;
  contentStyle?: any;
  backgroundColor?: string;
}

export const ScreenLayout: React.FC<ScreenLayoutProps> = ({
  children,
  header,
  scrollable = true,
  refreshing = false,
  onRefresh,
  style,
  contentStyle,
  backgroundColor = colors.background,
}) => {
  const content = (
    <View style={[styles.content, contentStyle]}>
      {children}
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor }, style]}>
      <StatusBar 
        barStyle="dark-content" 
        backgroundColor={colors.white}
        translucent={false}
      />
      
      {header && (
        <View style={styles.headerContainer}>
          {header}
        </View>
      )}
      
      {scrollable ? (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[
            styles.scrollContent,
            !header && styles.scrollContentNoHeader
          ]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            onRefresh ? (
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor={colors.primary}
                colors={[colors.primary]}
              />
            ) : undefined
          }
        >
          {content}
        </ScrollView>
      ) : (
        <View style={[styles.nonScrollContent, !header && styles.nonScrollContentNoHeader]}>
          {content}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerContainer: {
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray200,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
    zIndex: 10,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: spacing.xl,
  },
  scrollContentNoHeader: {
    paddingTop: spacing.lg,
  },
  nonScrollContent: {
    flex: 1,
    paddingBottom: spacing.xl,
  },
  nonScrollContentNoHeader: {
    paddingTop: spacing.lg,
  },
  content: {
    padding: spacing.lg,
    gap: spacing.lg,
  },
}); 