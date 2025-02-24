import React, { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";

interface Location {
  lng: number;
  lat: number;
}

interface ParkingSpot {
  id: number;
  lng: number;
  lat: number;
  available: boolean;
  price: string;
}

mapboxgl.accessToken =
  "pk.eyJ1IjoibHV1a2FzbG9oaWxhaHRpIiwiYSI6ImNtM3g1MTM4bTEzMXMyaXM5eDFscHdmNXEifQ.k-gdj6rxz_bYnq4CEaS_Ww";

function createMarkerElement(color: string, shape: string) {
  const el = document.createElement("div");
  el.style.width = "20px";
  el.style.height = "15px";
  el.style.backgroundColor = color;
  el.style.borderRadius = shape === "rectangle" ? "2px" : "50%";
  return el;
}

const ParkingMap = () => {
  const mapContainer = useRef<HTMLDivElement | null>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const userMarker = useRef<mapboxgl.Marker | null>(null);
  const [location, setLocation] = useState({ lng: -70, lat: 40 });

  const parkingSpots = [
    { id: 1, lng: 23.817929, lat: 61.496222, available: true, price: "5/hour" },
    { id: 2, lng: 23.817986, lat: 61.49624, available: true, price: "10/hour" },
    {
      id: 3,
      lng: 23.817868,
      lat: 61.496206,
      available: false,
      price: "5/hour",
    },
  ];

  useEffect(() => {
    if (!map.current && mapContainer.current) {
      console.log("Initializing map");
      const mapInstance = new mapboxgl.Map({
        container: mapContainer.current,
        style: "mapbox://styles/mapbox/dark-v11",
        center: [24.9384, 60.1699],
        zoom: 10,
      });

      map.current = mapInstance;

      parkingSpots.forEach((spot) => {
        const el = document.createElement("div");
        el.className = "marker";
        el.style.backgroundColor = spot.available ? "#22c55e" : "#ef4444";
        el.style.width = "20px";
        el.style.height = "20px";
        el.style.borderRadius = "50%";

        new mapboxgl.Marker(el)
          .setLngLat([spot.lng, spot.lat])
          .setPopup(
            new mapboxgl.Popup({ offset: 25 }).setHTML(
              `<h3>Parking Spot</h3>
               <p>${spot.available ? "Available" : "Occupied"}</p>
               <p>Price: $${spot.price}</p>`
            )
          )
          .addTo(mapInstance);
      });
    }
  }, []);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            lng: position.coords.longitude,
            lat: position.coords.latitude,
          });

          if (map.current) {
            map.current.flyTo({
              center: [position.coords.longitude, position.coords.latitude],
              zoom: 14,
            });

            if (userMarker.current) {
              userMarker.current.remove();
            }

            userMarker.current = new mapboxgl.Marker({ color: "#3b82f6" })
              .setLngLat([position.coords.longitude, position.coords.latitude])
              .addTo(map.current);
          }
        },
        (error) => console.error(error)
      );
    }
  }, [map.current]);

  return (
    <div style={{ position: "relative", width: "100%", height: "100%" }}>
      <div
        ref={mapContainer}
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
        }}
      />
    </div>
  );
};

export default ParkingMap;
