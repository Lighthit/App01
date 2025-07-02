import axios from 'axios';
import React, { useEffect, useRef, useState } from 'react';
import { Alert, Button, StyleSheet, View } from 'react-native';
import type { WebView as WebViewType } from 'react-native-webview';
import { WebView, WebViewMessageEvent } from 'react-native-webview';

export default function HomeScreen() {
  const webviewRef = useRef<WebViewType>(null);
  const [refreshKey] = useState(Date.now());
  const [waypoints, setWaypoints] = useState<{ lat: number; lng: number }[]>([]);
  const [coordinates, setCoordinates] = useState<number[][]>([[13.820099, 100.51645900]]);
  const [Waypoint_Api, setWaypoint_Api] = useState<number[][]>([[13.820099, 100.51645900]]);
  const onMessage = (event: WebViewMessageEvent) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      console.log("Received data:", data);
      if (data.type === 'add') {
        setWaypoints((prev) => [...prev, { lat: data.lat, lng: data.lng }]);
      } else if (data.type === 'reset') {
        setWaypoints([]);
      }
    } catch (err) {
      console.error('Invalid data from WebView:', event.nativeEvent.data);
    }
  };

  const sendWaypoints = async () => {
    try {
      console.log("Sending waypoints to the server:", waypoints);
      const response = await axios.post('http://188.166.222.52:8000/target_position', { waypoints });
      Alert.alert('Waypoints sent!', JSON.stringify(response.data));
    } catch (err: any) {
      Alert.alert('Error sending waypoints', err.message || 'Unknown error');
    }
  };

  useEffect(() => {
  fetchData(); // fetch ตอนแรก
  fetchData_waypoint();
  const interval = setInterval(() => {
    fetchData(); // fetch ซ้ำทุก 1 วินาที (ปรับได้)
    fetchData_waypoint();
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
  
  const fetchData_waypoint = () => {
    axios.get('http://188.166.222.52:8000/target_position')
      .then(response => {
        const dataArray = response.data.waypoints; // เข้าถึง 'waypoints' key ใน response
        console.log("aa", dataArray);
        
        // แปลงข้อมูลจาก {lat, lng} ให้เป็น array ของ [lat, lng]
        const pointListwayPoint = dataArray.map((item: { lat: number; lng: number }) => [item.lat, item.lng]);
        setWaypoint_Api(pointListwayPoint);
        
      })
      .catch(error => {
        console.error('Error:', error);
      });
  };


 const htmlContent = `  
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <style>
    html, body, #map { height: 100%; margin: 0; padding: 0; }
    .leaflet-bottom.leaflet-left {
      display: flex;
      flex-direction: column;
      gap: 8px;
      margin: 10px;
      z-index: 9999;
    }
    .distance-label {
      background-color: white;
      padding: 2px 4px;
      border-radius: 4px;
      font-size: 12px;
      color: black;
    }
    input, button {
      font-size: 14px;
      border-radius: 6px;
      border: 1px solid #ccc;
      padding: 4px 8px;
    }
    button {
      background-color: #007bff;
      color: white;
      cursor: pointer;
    }
    button:hover {
      background-color: #0056b3;
    }
  </style>
</head>
<body>
  <div id="map"></div>
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <script>
    const map = L.map('map').setView([13.820099, 100.516459], 15);  // ลดระดับ zoom ให้อยู่ที่ 15

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 22,
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);
    

    // 🟥 เส้นทางของ robot (Polyline) — ไม่มี marker ที่นี้
    const points = ${JSON.stringify(coordinates)};
    const polyline = L.polyline(points, {
      color: 'red',
      weight: 1,
      opacity: 0.8
    }).addTo(map);
    map.fitBounds(polyline.getBounds());

    // 🟦 Pin Waypoints (แสดงเฉพาะจาก WAY)
    const WAY = ${JSON.stringify(Waypoint_Api)};
    const START_WAYPT = [13.820099, 100.516459]
    WAY.unshift(START_WAYPT);
    console.log(WAY);

    // แสดง markers เฉพาะจาก WAY
    WAY.forEach(([lat, lng]) => {
      L.marker([lat, lng]).addTo(map);
    });
    const polyliness = L.polyline(WAY, {
      color: 'blue',
      weight: 0.5,
      opacity: 0.8
    }).addTo(map);


    let waypoints = [];
    let lines = [];

    const startLat = 13.820099;
    const startLng = 100.516459;
    const startIcon = L.icon({
      iconUrl: 'https://cdn-icons-png.flaticon.com/512/684/684908.png',
      iconSize: [40, 40],
      iconAnchor: [20, 40],
    });
    const startMarker = L.marker([startLat, startLng], { icon: startIcon }).addTo(map);
    waypoints.push(startMarker);
    
    function getDistance(lat1, lon1, lat2, lon2) {
      const R = 6371000;
      const toRad = deg => deg * Math.PI / 180;
      const dLat = toRad(lat2 - lat1);
      const dLon = toRad(lon2 - lon1);
      const a = Math.sin(dLat / 2)**2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2)**2;
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      return R * c;
    }

    function updateLabelsAndLines() {
      lines.forEach(line => map.removeLayer(line));
      lines = [];
      for (let i = 0; i < waypoints.length; i++) {
        const current = waypoints[i].getLatLng();
        const prev = i > 0 ? waypoints[i - 1].getLatLng() : null;

        if (prev) {
          const polyline = L.polyline([prev, current], { color: 'blue' }).addTo(map);
          lines.push(polyline);
        }

        const info = 'Lat:' + current.lat.toFixed(8) + '<br>' +
                     'Lng:' + current.lng.toFixed(8) + '<br>' +
                     (prev ? 'Distance: ' + getDistance(prev.lat, prev.lng, current.lat, current.lng).toFixed(2) + ' m' : '');

        const label = L.marker([current.lat, current.lng], {
          icon: L.divIcon({ className: 'distance-label', html: info })
        }).addTo(map);
        lines.push(label);
      }
    }

    function addByVector() {
      const d = parseFloat(document.getElementById("distance").value);
      const a = parseFloat(document.getElementById("angle").value);
      if (isNaN(d) || isNaN(a) || waypoints.length === 0) return;

      const last = waypoints[waypoints.length - 1].getLatLng();
      const R = 6371000;
      const φ1 = last.lat * Math.PI / 180;
      const λ1 = last.lng * Math.PI / 180;
      const θ = a * Math.PI / 180;
      const δ = d / R;

      const φ2 = Math.asin(Math.sin(φ1)*Math.cos(δ) + Math.cos(φ1)*Math.sin(δ)*Math.cos(θ));
      const λ2 = λ1 + Math.atan2(Math.sin(θ)*Math.sin(δ)*Math.cos(φ1), Math.cos(δ)-Math.sin(φ1)*Math.sin(φ2));

      const newLat = φ2 * 180 / Math.PI;
      const newLng = λ2 * 180 / Math.PI;

      const marker = L.marker([newLat, newLng]).addTo(map);
      waypoints.push(marker);
      updateLabelsAndLines();

      if (window.ReactNativeWebView) {
        window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'add', lat: newLat, lng: newLng }));
      }
    }

    map.on('click', (e) => {
      const { lat, lng } = e.latlng;
      const marker = L.marker([lat, lng]).addTo(map);
      waypoints.push(marker);
      updateLabelsAndLines();
      if (window.ReactNativeWebView) {
        window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'add', lat, lng }));
      }
    });

    function resetMap() {
      waypoints.forEach(m => map.removeLayer(m));
      lines.forEach(l => map.removeLayer(l));
      waypoints = [startMarker];
      lines = [];
      updateLabelsAndLines();
      if (window.ReactNativeWebView) {
        window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'reset' }));
      }
    }

    function sendToReactNative() {
      const coords = waypoints.map(m => m.getLatLng());
      if (window.ReactNativeWebView) {
        window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'send', coords }));
      }
    }

    const buttonsDiv = L.control({ position: 'bottomleft' });
    buttonsDiv.onAdd = function () {
      const div = L.DomUtil.create('div');
      div.innerHTML = \`
        <div style="
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
          justify-content: center;
          background: white;
          padding: 8px;
          border-radius: 8px;
          max-width: 320px;
          margin: 0 auto;
        ">
          <input id="distance" type="number" placeholder="Distance (m)" style="width:120px;" />
          <input id="angle" type="number" placeholder="Angle (°)" style="width:120px;" />
          <button onclick="addByVector()">Distance + Angle</button>
          <button onclick="resetMap()">Reset</button>
          <button onclick="sendToReactNative()">Send</button>
        </div>
      \`;
      L.DomEvent.disableClickPropagation(div);
      return div;
    };
    buttonsDiv.addTo(map);

    // ---- Robot Path Tracking ----
    let robotPositions = [];
    let robotPolyline = null;
    let robotMarker = null;

    function updateRobotPath(lat, lng) {
      // เพิ่มค่าพิกัดเพื่อทดสอบ
      lat += 0.0001; 
      lng += 0.0001;

      const newPoint = [lat, lng];
      robotPositions.push(newPoint);
      console.log('Robot Path:', robotPositions);

      if (robotPositions.length < 2) return;  // ต้องมีหลายจุดถึงจะวาด polyline ได้

      if (robotPolyline) {
        robotPolyline.setLatLngs(robotPositions);  // อัปเดตเส้น polyline
      } else {
        robotPolyline = L.polyline(robotPositions, { color: 'red', weight: 10 }).addTo(map); // สร้าง polyline ใหม่
      }


      const robotIcon = L.icon({
        iconUrl: 'https://cdn-icons-png.flaticon.com/512/471/471664.png',
        iconSize: [25, 25],
        iconAnchor: [12.5, 25],
      });

      if (robotMarker) {
        robotMarker.setLatLng(newPoint);
      } else {
        robotMarker = L.marker(newPoint, { icon: robotIcon }).addTo(map).bindPopup('🤖 Robot Position');
      }
    }

    document.addEventListener('message', function (event) {
      try {
        const msg = JSON.parse(event.data);
        if (msg.type === 'robot_position') {
          updateRobotPath(msg.lat, msg.lng);
        }
      } catch (e) {
        console.error('Invalid message:', e);
      }
    });
  </script>
</body>
</html>
`;

  return (
    <View style={{ flex: 1 }}>
      <WebView
        key={refreshKey}
        ref={webviewRef}
        source={{ html: htmlContent }}
        originWhitelist={['*']}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        onMessage={onMessage}
        style={{ flex: 1 }}
        onLoad={() => console.log("WebView Loaded")}
        onError={(err) => console.log("Error in WebView:", err)}
      />
      <View style={styles.buttonContainer}>
        <Button title="Send Waypoints" onPress={sendWaypoints} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  buttonContainer: {
    padding: 10,
    marginBottom: 20,
    marginHorizontal: 40,
  },
});
