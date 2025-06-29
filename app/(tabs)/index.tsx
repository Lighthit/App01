import axios from 'axios';
import React, { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { WebView } from 'react-native-webview';

export default function App() {
  const [coordinates, setCoordinates] = useState<number[][]>([]);

useEffect(() => {
  fetchData(); // fetch ตอนแรก

  const interval = setInterval(() => {
    fetchData(); // fetch ซ้ำทุก 1 วินาที (ปรับได้)
  }, 1000);

  return () => clearInterval(interval); // clear interval ตอน unmount
}, []);

  const fetchData = () => {
    axios.get('http://188.166.222.52:8000/robot_position')
      .then(response => {
        const dataArray = response.data.data;
        console.log(dataArray);
        if (Array.isArray(dataArray) && dataArray.length > 0) {
          const pointList = dataArray.map((item: { lat: number; lng: number }) => [item.lat, item.lng]);
          setCoordinates(pointList);
        } else {
          console.error('Data array is empty or invalid:', dataArray);
        }
      })
      .catch(error => {
        console.error('Error:', error);
      });
  };

  const leafletHTML = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>OSM Map</title>
        <link
          rel="stylesheet"
          href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
        />
        <style>
          html, body, #map { height: 100%; margin: 0; padding: 0; }
        </style>
      </head>
      <body>
        <div id="map"></div>
        <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
        <script>
          var map = L.map('map').setView(${
            coordinates.length > 0
              ? JSON.stringify(coordinates[0])
              : '[13.7563, 100.5018]'
          }, 17);

          L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 22,
            attribution: '© OpenStreetMap contributors'
          }).addTo(map);

          const points = ${JSON.stringify(coordinates)};

          const polyline = L.polyline(points, {
            color: 'blue',
            weight: 4,
            opacity: 0.8
          }).addTo(map);

          map.fitBounds(polyline.getBounds());
        </script>
      </body>
    </html>
  `;

  return (
    <View style={styles.container}>
      <WebView
        originWhitelist={['*']}
        source={{ html: leafletHTML }}
        style={styles.webview}
        javaScriptEnabled={true}
        domStorageEnabled={true}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  webview: { flex: 1 },
});
