
import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  getDocs, 
  query, 
  where, 
  orderBy,
  onSnapshot,
  Timestamp,
  db
} from './shared/firebaseConfig';
import { SupportTicket, SupportResponse } from './shared/types';

class SupportService {
  // QO'LLAB-QUVVATLASH SO'ROVLARI BILAN ISHLASH

  // Yangi support ticket yaratish
  async createSupportTicket(ticket: Omit<SupportTicket, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      const ticketData = {
        ...ticket,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      };

      const docRef = await addDoc(collection(db, 'supportTickets'), ticketData);
      return docRef.id;
    } catch (error) {
      console.error('Support ticket yaratishda xatolik:', error);
      throw error;
    }
  }

  // Support ticketlarni olish
  async getSupportTickets(filters?: { 
    userId?: string; 
    status?: string;
    assignedTo?: string;
    priority?: string;
  }): Promise<SupportTicket[]> {
    try {
      let q = query(collection(db, 'supportTickets'), orderBy('createdAt', 'desc'));

      if (filters?.userId) {
        q = query(q, where('userId', '==', filters.userId));
      }
      if (filters?.status) {
        q = query(q, where('status', '==', filters.status));
      }
      if (filters?.assignedTo) {
        q = query(q, where('assignedTo', '==', filters.assignedTo));
      }
      if (filters?.priority) {
        q = query(q, where('priority', '==', filters.priority));
      }

      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt.toDate(),
        updatedAt: doc.data().updatedAt.toDate(),
        lastReply: doc.data().lastReply?.toDate()
      } as SupportTicket));
    } catch (error) {
      console.error('Support ticketlarni olishda xatolik:', error);
      throw error;
    }
  }

  // Support ticket holatini yangilash
  async updateSupportTicketStatus(ticketId: string, status: SupportTicket['status'], assignedTo?: string): Promise<void> {
    try {
      const updateData: any = {
        status,
        updatedAt: Timestamp.now()
      };

      if (assignedTo) {
        updateData.assignedTo = assignedTo;
      }

      await updateDoc(doc(db, 'supportTickets', ticketId), updateData);
    } catch (error) {
      console.error('Support ticket holatini yangilashda xatolik:', error);
      throw error;
    }
  }

  // Support ticket'ga javob qo'shish
  async addSupportResponse(response: Omit<SupportResponse, 'id' | 'createdAt'>): Promise<string> {
    try {
      const responseData = {
        ...response,
        createdAt: Timestamp.now()
      };

      const docRef = await addDoc(collection(db, 'supportResponses'), responseData);

      // Ticket'ning lastReply maydonini yangilash
      await updateDoc(doc(db, 'supportTickets', response.ticketId), {
        lastReply: Timestamp.now(),
        updatedAt: Timestamp.now()
      });

      return docRef.id;
    } catch (error) {
      console.error('Support response qo\'shishda xatolik:', error);
      throw error;
    }
  }

  // Support ticket uchun javoblarni olish
  async getSupportResponses(ticketId: string): Promise<SupportResponse[]> {
    try {
      const q = query(
        collection(db, 'supportResponses'),
        where('ticketId', '==', ticketId),
        orderBy('createdAt', 'asc')
      );

      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt.toDate()
      } as SupportResponse));
    } catch (error) {
      console.error('Support response\'larni olishda xatolik:', error);
      throw error;
    }
  }

  // Support ticket real-time kuzatish
  subscribeSupportTickets(callback: (tickets: SupportTicket[]) => void, filters?: { status?: string }) {
    let q = query(collection(db, 'supportTickets'), orderBy('createdAt', 'desc'));

    if (filters?.status) {
      q = query(q, where('status', '==', filters.status));
    }

    return onSnapshot(q, (querySnapshot) => {
      const tickets = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt.toDate(),
        updatedAt: doc.data().updatedAt.toDate(),
        lastReply: doc.data().lastReply?.toDate()
      } as SupportTicket));

      callback(tickets);
    });
  }
}

export const supportService = new SupportService();
