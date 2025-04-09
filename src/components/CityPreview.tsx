import React, { useState, useEffect } from 'react';

interface CityPreviewProps {
  fromCity: string;
  toCity: string;
}

const UNSPLASH_ACCESS_KEY = 'YOUR_UNSPLASH_ACCESS_KEY'; // Hier deinen Unsplash API Key eintragen

// Funktion: Holt das erste passende Bild von der Unsplash API
const getCityImageUrl = async (city: string): Promise<string | null> => {
  try {
    const res = await fetch(
      `https://api.unsplash.com/search/photos?query=${encodeURIComponent(city)}&client_id=${UNSPLASH_ACCESS_KEY}`
    );
    const data = await res.json();
    if (data.results && data.results.length > 0) {
      return data.results[0].urls.small;
    }
  } catch (error) {
    console.error("Error fetching image for city", city, error);
  }
  return null;
};

// Hilfsfunktion: Ermittelt grob einen ISO-Ländercode anhand des Stadtnamens
const getCountryCode = (city: string): string => {
  const lowerCity = city.toLowerCase();
  if (
    lowerCity.includes("frankfurt") ||
    lowerCity.includes("berlin") ||
    lowerCity.includes("munich") ||
    lowerCity.includes("münchen")
  ) {
    return 'de';
  }
  if (
    lowerCity.includes("zurich") ||
    lowerCity.includes("zürich") ||
    lowerCity.includes("geneva") ||
    lowerCity.includes("bern") ||
    lowerCity.includes("genf")
  ) {
    return 'ch';
  }
  if (lowerCity.includes("paris") || lowerCity.includes("lyon")) {
    return 'fr';
  }
  // Fallback: USA als Standard
  return 'us';
};

const CityPreview: React.FC<CityPreviewProps> = ({ fromCity, toCity }) => {
  const [fromImage, setFromImage] = useState<string | null>(null);
  const [toImage, setToImage] = useState<string | null>(null);

  useEffect(() => {
    if (fromCity) {
      getCityImageUrl(fromCity).then(url => setFromImage(url));
    }
  }, [fromCity]);

  useEffect(() => {
    if (toCity) {
      getCityImageUrl(toCity).then(url => setToImage(url));
    }
  }, [toCity]);

  const fromFlag = getCountryCode(fromCity);
  const toFlag = getCountryCode(toCity);

  return (
    <div className="flex items-center justify-center my-4">
      {/* Abflugstadt */}
      <div className="flex flex-col items-center mx-4">
        <img
          src={`https://flagcdn.com/w40/${fromFlag}.png`}
          alt={`${fromCity} Flag`}
          className="mb-2"
        />
        {fromImage ? (
          <img
            src={fromImage}
            alt={fromCity}
            style={{ width: '80px', height: '80px', borderRadius: '50%', objectFit: 'cover' }}
          />
        ) : (
          <div style={{ width: '80px', height: '80px', borderRadius: '50%', backgroundColor: '#ccc' }} />
        )}
        <span>{fromCity}</span>
      </div>

      {/* Dazwischen: Pfeil als Flugrichtung */}
      <div className="flex items-center justify-center">
        <svg width="50" height="20" viewBox="0 0 50 20">
          <line x1="0" y1="10" x2="40" y2="10" stroke="black" strokeWidth="2" />
          <polygon points="40,5 50,10 40,15" fill="black" />
        </svg>
      </div>

      {/* Zielland/Stadt */}
      <div className="flex flex-col items-center mx-4">
        <img
          src={`https://flagcdn.com/w40/${toFlag}.png`}
          alt={`${toCity} Flag`}
          className="mb-2"
        />
        {toImage ? (
          <img
            src={toImage}
            alt={toCity}
            style={{ width: '80px', height: '80px', borderRadius: '50%', objectFit: 'cover' }}
          />
        ) : (
          <div style={{ width: '80px', height: '80px', borderRadius: '50%', backgroundColor: '#ccc' }} />
        )}
        <span>{toCity}</span>
      </div>
    </div>
  );
};

export default CityPreview;
