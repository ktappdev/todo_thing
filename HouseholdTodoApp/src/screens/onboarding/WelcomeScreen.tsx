import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

const WelcomeScreen = ({ navigation }: any) => {
  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Household Todo</Text>
        <Text style={styles.subtitle}>
          Manage tasks with your family members
        </Text>
        
        <View style={styles.imageContainer}>
          <Text style={styles.placeholderIcon}>📝</Text>
        </View>
        
        <Text style={styles.description}>
          Create or join a household to start sharing tasks with your family members.
          No login required - just share a simple code!
        </Text>
      </View>
      
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.button, styles.primaryButton]}
          onPress={() => navigation.navigate('CreateHousehold')}
        >
          <Text style={styles.primaryButtonText}>Create Household</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.button, styles.secondaryButton]}
          onPress={() => navigation.navigate('JoinHousehold')}
        >
          <Text style={styles.secondaryButtonText}>Join Household</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 20,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#6200EE',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 18,
    color: '#666',
    marginBottom: 40,
    textAlign: 'center',
  },
  imageContainer: {
    width: 200,
    height: 200,
    marginBottom: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderIcon: {
    fontSize: 100,
  },
  description: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 40,
  },
  buttonContainer: {
    marginBottom: 40,
  },
  button: {
    width: '100%',
    padding: 15,
    borderRadius: 8,
    marginBottom: 15,
    alignItems: 'center',
  },
  primaryButton: {
    backgroundColor: '#6200EE',
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  secondaryButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#6200EE',
  },
  secondaryButtonText: {
    color: '#6200EE',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default WelcomeScreen;