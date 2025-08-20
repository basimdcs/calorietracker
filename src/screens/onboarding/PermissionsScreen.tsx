import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Alert,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import * as MediaLibrary from 'expo-media-library';
import { Audio } from 'expo-av';
import { colors, fonts, spacing, borderRadius, shadows } from '../../constants/theme';

interface PermissionsScreenProps {
  onContinue: () => void;
  onSkip: () => void;
}

interface Permission {
  id: string;
  icon: string;
  title: string;
  description: string;
  required: boolean;
  granted: boolean;
}

const PermissionsScreen: React.FC<PermissionsScreenProps> = ({ onContinue, onSkip }) => {
  const [permissions, setPermissions] = useState<Permission[]>([
    {
      id: 'microphone',
      icon: 'mic',
      title: 'Microphone Access',
      description: 'Required for voice-powered food logging and AI transcription',
      required: true,
      granted: false,
    },
    {
      id: 'photos',
      icon: 'photo-library',
      title: 'Photo Library',
      description: 'Optional - Save meal photos and export nutrition reports',
      required: false,
      granted: false,
    },
  ]);

  const requestMicrophonePermission = async () => {
    try {
      const permission = await Audio.requestPermissionsAsync();
      updatePermissionStatus('microphone', permission.granted);
      
      if (!permission.granted) {
        Alert.alert(
          'Microphone Permission Required',
          'Voice logging requires microphone access. You can enable this later in your device settings.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Error requesting microphone permission:', error);
      Alert.alert('Error', 'Failed to request microphone permission');
    }
  };

  const requestPhotosPermission = async () => {
    try {
      const permission = await MediaLibrary.requestPermissionsAsync();
      updatePermissionStatus('photos', permission.granted);
      
      if (!permission.granted) {
        Alert.alert(
          'Photo Library Access',
          'This permission is optional but allows you to save meal photos and export reports.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Error requesting photos permission:', error);
      Alert.alert('Error', 'Failed to request photos permission');
    }
  };

  const updatePermissionStatus = (id: string, granted: boolean) => {
    setPermissions(prev =>
      prev.map(permission =>
        permission.id === id ? { ...permission, granted } : permission
      )
    );
  };

  const handlePermissionRequest = (permission: Permission) => {
    switch (permission.id) {
      case 'microphone':
        requestMicrophonePermission();
        break;
      case 'photos':
        requestPhotosPermission();
        break;
    }
  };

  const canContinue = () => {
    const requiredPermissions = permissions.filter(p => p.required);
    return requiredPermissions.every(p => p.granted);
  };

  const handleContinue = () => {
    if (canContinue()) {
      onContinue();
    } else {
      Alert.alert(
        'Required Permissions',
        'Please grant microphone access to continue. This is required for voice logging functionality.',
        [{ text: 'OK' }]
      );
    }
  };

  const allPermissionsGranted = permissions.every(p => p.granted);
  const somePermissionsGranted = permissions.some(p => p.granted);

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={colors.gradients.onboarding}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradientContainer}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.iconContainer}>
            <LinearGradient
              colors={[colors.brandOuterSkin, colors.brandLeaf]}
              style={styles.headerIcon}
            >
              <MaterialIcons name="security" size={48} color={colors.white} />
            </LinearGradient>
          </View>

          <Text style={styles.title}>App Permissions</Text>
          <Text style={styles.subtitle}>
            We need a few permissions to provide you with the best experience
          </Text>
        </View>

        {/* Permissions List */}
        <View style={styles.permissionsContainer}>
          {permissions.map((permission) => (
            <View key={permission.id} style={styles.permissionCard}>
              <View style={styles.permissionHeader}>
                <View style={styles.permissionIconContainer}>
                  <MaterialIcons 
                    name={permission.icon as any} 
                    size={28} 
                    color={permission.granted ? colors.brandOuterSkin : colors.gray600} 
                  />
                </View>
                
                <View style={styles.permissionInfo}>
                  <View style={styles.permissionTitleRow}>
                    <Text style={styles.permissionTitle}>{permission.title}</Text>
                    {permission.required && (
                      <View style={styles.requiredBadge}>
                        <Text style={styles.requiredText}>Required</Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.permissionDescription}>
                    {permission.description}
                  </Text>
                </View>
              </View>

              <TouchableOpacity
                style={[
                  styles.permissionButton,
                  permission.granted && styles.permissionButtonGranted
                ]}
                onPress={() => handlePermissionRequest(permission)}
                disabled={permission.granted}
                activeOpacity={0.8}
              >
                {permission.granted ? (
                  <>
                    <MaterialIcons name="check" size={18} color={colors.white} />
                    <Text style={[styles.permissionButtonText, { color: colors.white }]}>
                      Granted
                    </Text>
                  </>
                ) : (
                  <>
                    <MaterialIcons name="lock-open" size={18} color={colors.brandOuterSkin} />
                    <Text style={styles.permissionButtonText}>Allow</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          ))}
        </View>

        {/* Status Message */}
        {somePermissionsGranted && (
          <View style={styles.statusContainer}>
            <View style={styles.statusIcon}>
              <MaterialIcons 
                name={allPermissionsGranted ? "check-circle" : "info"} 
                size={20} 
                color={allPermissionsGranted ? colors.brandOuterSkin : colors.secondary} 
              />
            </View>
            <Text style={styles.statusText}>
              {allPermissionsGranted 
                ? "All permissions granted! You're ready to go." 
                : "Some permissions are still pending. You can grant them later in settings."
              }
            </Text>
          </View>
        )}

        {/* Bottom Actions */}
        <View style={styles.bottomContainer}>
          <TouchableOpacity style={styles.skipButton} onPress={onSkip}>
            <Text style={styles.skipButtonText}>Skip for Now</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[
              styles.continueButton,
              !canContinue() && styles.continueButtonDisabled
            ]}
            onPress={handleContinue}
            activeOpacity={0.9}
          >
            <LinearGradient
              colors={canContinue() 
                ? [colors.brandOuterSkin, colors.brandLeaf]
                : [colors.gray400, colors.gray500]
              }
              style={styles.continueButtonGradient}
            >
              <Text style={styles.continueButtonText}>Continue</Text>
              <MaterialIcons name="arrow-forward" size={20} color={colors.white} />
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradientContainer: {
    flex: 1,
    paddingHorizontal: spacing.lg,
  },
  header: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  iconContainer: {
    marginBottom: spacing.lg,
  },
  headerIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.lg,
  },
  title: {
    fontSize: fonts['2xl'],
    fontWeight: fonts.bold,
    color: colors.white,
    textAlign: 'center',
    marginBottom: spacing.sm,
    textShadowColor: 'rgba(0, 0, 0, 0.1)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  subtitle: {
    fontSize: fonts.base,
    color: colors.white,
    textAlign: 'center',
    opacity: 0.9,
    lineHeight: 22,
    maxWidth: 280,
  },
  permissionsContainer: {
    flex: 1,
    gap: spacing.md,
  },
  permissionCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    ...shadows.md,
  },
  permissionHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  permissionIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.gray100,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  permissionInfo: {
    flex: 1,
  },
  permissionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  permissionTitle: {
    fontSize: fonts.base,
    fontWeight: fonts.semibold,
    color: colors.textPrimary,
    flex: 1,
  },
  requiredBadge: {
    backgroundColor: colors.secondary,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.xs,
  },
  requiredText: {
    fontSize: fonts.xs,
    color: colors.white,
    fontWeight: fonts.medium,
  },
  permissionDescription: {
    fontSize: fonts.sm,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  permissionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.brandOuterSkin,
    backgroundColor: colors.white,
    gap: spacing.xs,
  },
  permissionButtonGranted: {
    backgroundColor: colors.brandOuterSkin,
    borderColor: colors.brandOuterSkin,
  },
  permissionButtonText: {
    fontSize: fonts.sm,
    fontWeight: fonts.medium,
    color: colors.brandOuterSkin,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    marginVertical: spacing.md,
  },
  statusIcon: {
    marginRight: spacing.sm,
  },
  statusText: {
    flex: 1,
    fontSize: fonts.sm,
    color: colors.white,
    fontWeight: fonts.medium,
  },
  bottomContainer: {
    flexDirection: 'row',
    gap: spacing.md,
    paddingBottom: spacing.xl,
  },
  skipButton: {
    flex: 1,
    paddingVertical: spacing.md,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: borderRadius.lg,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  skipButtonText: {
    fontSize: fonts.base,
    color: colors.white,
    fontWeight: fonts.medium,
  },
  continueButton: {
    flex: 2,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    ...shadows.md,
  },
  continueButtonDisabled: {
    opacity: 0.6,
  },
  continueButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    gap: spacing.xs,
  },
  continueButtonText: {
    fontSize: fonts.base,
    fontWeight: fonts.semibold,
    color: colors.white,
  },
});

export default PermissionsScreen;