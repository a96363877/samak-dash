import { geolocation } from '@vercel/functions';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const geo = geolocation(request);
  
  return NextResponse.json({
    city: geo.city,
    country: geo.country,
    countryRegion: geo.countryRegion,
    latitude: geo.latitude,
    longitude: geo.longitude,
    region: geo.region
  });
}

