import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import axios from 'axios';

export default function HomeScreen() {
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = () => {
    axios.get('http://188.166.222.52:8000/robot_position')
      .then(response => {
        console.log('Data:', response.data);
      })
      .catch(error => {
        console.error('Error:', error);
      });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.text}>Check console log</Text>
      <TouchableOpacity style={styles.button} onPress={fetchData}>
        <Text style={styles.buttonText}>Click for Check</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  text: {
    fontSize: 18,
    marginBottom: 20,
  },
  button: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#007BFF',
    borderRadius: 8,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
  },
});
