import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, ScrollView } from 'react-native';

const WelcomeScreen = ({ navigation }: any) => {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.decorTop} />
      <View style={styles.decorBottom} />
      <ScrollView
        contentContainerStyle={styles.container}
        bounces={false}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.content}>
          <Text style={styles.brand}>Household Todo</Text>
          <Text style={styles.subtitle}>Manage tasks with your family members</Text>

          <View style={styles.illustration}>
            <View style={styles.card}>
              <View style={styles.taskRow}>
                <View style={[styles.dot, { backgroundColor: '#A78BFA' }]} />
                <View style={styles.line} />
              </View>
              <View style={styles.taskRow}>
                <View style={[styles.dot, { backgroundColor: '#34D399' }]} />
                <View style={styles.lineAccent} />
              </View>
              <View style={styles.taskRow}>
                <View style={[styles.dot, { backgroundColor: '#F59E0B' }]} />
                <View style={styles.line} />
              </View>
            </View>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>✓</Text>
            </View>
          </View>

          <Text style={styles.description}>
            Create or join a household to start sharing tasks with your family members.
            No login required — just share a simple code!
          </Text>
        </View>

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            activeOpacity={0.9}
            style={[styles.button, styles.primaryButton]}
            onPress={() => navigation.navigate('CreateHousehold')}
          >
            <Text style={styles.primaryButtonText}>✨ Create Household</Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.9}
            style={[styles.button, styles.secondaryButton]}
            onPress={() => navigation.navigate('JoinHousehold')}
          >
            <Text style={styles.secondaryButtonText}>🔗 Join Household</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8F7FF',
  },
  decorTop: {
    position: 'absolute',
    top: -80,
    right: -60,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: '#E9E5FF',
    opacity: 0.7,
  },
  decorBottom: {
    position: 'absolute',
    bottom: -60,
    left: -60,
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: '#F1EDFF',
    opacity: 0.8,
  },
  container: {
    minHeight: '100%',
    paddingHorizontal: 24,
    paddingVertical: 24,
    justifyContent: 'space-between',
  },
  content: {
    alignItems: 'center',
    marginTop: 8,
  },
  brand: {
    fontSize: 34,
    fontWeight: '800',
    color: '#7C3AED',
    letterSpacing: 0.3,
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    color: '#6B7280',
    marginBottom: 28,
    textAlign: 'center',
  },
  illustration: {
    width: 160,
    height: 160,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E9E5FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 28,
    // iOS shadow
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    // Android elevation
    elevation: 4,
  },
  card: {
    width: 140,
    height: 120,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 14,
    justifyContent: 'space-between',
  },
  taskRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 10,
  },
  line: {
    flex: 1,
    height: 10,
    borderRadius: 6,
    backgroundColor: '#E5E7EB',
  },
  lineAccent: {
    flex: 1,
    height: 10,
    borderRadius: 6,
    backgroundColor: '#7C3AED',
  },
  badge: {
    position: 'absolute',
    right: -8,
    bottom: -8,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#7C3AED',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
  },
  description: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 16,
    maxWidth: 340,
  },
  buttonContainer: {
    marginTop: 8,
    marginBottom: 24,
  },
  button: {
    width: '100%',
    height: 56,
    borderRadius: 14,
    marginBottom: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButton: {
    backgroundColor: '#7C3AED',
    // iOS shadow
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    // Android elevation
    elevation: 3,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  secondaryButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#7C3AED',
  },
  secondaryButtonText: {
    color: '#7C3AED',
    fontSize: 16,
    fontWeight: '700',
  },
});

export default WelcomeScreen;