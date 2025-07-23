import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const EnvTest: React.FC = () => {
  const apiKey = process.env.EXPO_PUBLIC_OPENAI_API_KEY;
  const apiKeyExists = !!apiKey;
  const apiKeyStart = apiKey ? apiKey.substring(0, 10) + '...' : 'N/A';
  
  console.log('🔍 EnvTest Component:');
  console.log('API Key exists:', apiKeyExists);
  console.log('API Key starts with:', apiKeyStart);

  return (
    <View style={styles.container}>
      <Text style={styles.text}>Environment Variable Test</Text>
      <Text style={styles.text}>API Key exists: {apiKeyExists ? 'Yes' : 'No'}</Text>
      <Text style={styles.text}>API Key starts with: {apiKeyStart}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#f0f0f0',
    margin: 10,
    borderRadius: 8,
  },
  text: {
    fontSize: 14,
    marginBottom: 5,
  },
});

export default EnvTest; 