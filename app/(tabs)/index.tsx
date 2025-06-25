import React, { useEffect } from 'react';
import { View, Text } from 'react-native';
import axios from 'axios';

export default function HomeScreen() {
  useEffect(() => {
    axios.get('http://188.166.222.52:54321/object/current')
      .then(response => {
        console.log('Data:', response.data);
      })
      .catch(error => {
        console.error('Error:', error);
      });
  }, []);

  return (
    <View>
      <Text>Check console log</Text>
    </View>
  );
}
