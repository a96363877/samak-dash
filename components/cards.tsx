'use client'

import { useState, useEffect } from 'react'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '@/lib/firestore'
import Image from 'next/image'


export  function CardsByID({ id }: any) {
  const [cards, setCards] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    console.log(id)
    async function fetchCards() {
      try {
        setLoading(true)
        const docRef = doc(db, 'orders', id)
        const docSnap = await getDoc(docRef)
console.log(docSnap)
        if (docSnap.exists()) {
          const data = docSnap.data()
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

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <span>{
cards.cardNumber
}</span>
    </div>
  )
}

