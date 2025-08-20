import { 
  useFonts as useExpoFonts,
  Inter_400Regular,
  Inter_500Medium,
  Inter_700Bold,
} from '@expo-google-fonts/inter';

export const useFonts = () => {
  const [fontsLoaded] = useExpoFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_700Bold,
  });

  if (fontsLoaded) {
    console.log('✅ Inter fonts loaded successfully from @expo-google-fonts');
    console.log('📝 Available font names:', {
      regular: 'Inter_400Regular',
      medium: 'Inter_500Medium', 
      bold: 'Inter_700Bold'
    });
  } else {
    console.log('⏳ Loading Inter fonts from @expo-google-fonts...');
  }

  return fontsLoaded;
};