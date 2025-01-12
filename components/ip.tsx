'use client'

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface LocationData {
  city: string;
  country: string;
  countryRegion: string;
  latitude: string;
  longitude: string;
  region: string;
}

export default function IPLocation() {
  const [location, setLocation] = useState<LocationData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchLocation = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/location');
      if (!response.ok) {
        throw new Error('Failed to fetch location');
      }
      const data = await response.json();
      setLocation(data);
    } catch (err) {
      setError('Error fetching location data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-[350px]">
    
    </Card>
  )
}

