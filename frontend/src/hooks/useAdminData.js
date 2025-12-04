import { useState, useEffect } from 'react';
import { toast } from "sonner";
import api from '@/lib/api';

const useAdminData = (userRole, navigate) => {
  const [users, setUsers] = useState([]);
  const [consultations, setConsultations] = useState([]);
  const [feedbacks, setFeedbacks] = useState([]);
  const [feedbackStats, setFeedbackStats] = useState(null);
  const [onlineCount, setOnlineCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [monthlyUsage, setMonthlyUsage] = useState(null);
  const [deletedUsers, setDeletedUsers] = useState([]);

  const fetchData = async () => {
    if (users.length === 0) setIsLoading(true);
    
    try {
      const timestamp = new Date().getTime();
      const [usersRes, consultsRes, onlineRes, monthlyRes, feedbacksRes, deletedRes] = await Promise.all([
        api.get(`/admin/users?t=${timestamp}`),
        api.get(`/admin/consultations?t=${timestamp}`),
        api.get(`/admin/stats/online?t=${timestamp}`),
        api.get(`/admin/usage-stats/monthly?t=${timestamp}`),
        api.get(`/feedbacks?t=${timestamp}`),
        api.get(`/admin/deleted-users?t=${timestamp}`)
      ]);

      const mappedUsers = usersRes.data.map(u => ({
        ...u,
        id: u._id || u.id
      }));
      
      // Sort users: reactivated users first (by reactivated_at), then by created_at
      const sortedUsers = mappedUsers.sort((a, b) => {
        // If user has reactivated_at, prioritize by that (most recent first)
        if (a.reactivated_at && b.reactivated_at) {
          return new Date(b.reactivated_at) - new Date(a.reactivated_at);
        }
        if (a.reactivated_at) return -1;
        if (b.reactivated_at) return 1;
        
        // Otherwise sort by created_at (newest first)
        return new Date(b.created_at || 0) - new Date(a.created_at || 0);
      });
      
      setUsers(sortedUsers);
      
      const realConsultations = consultsRes.data.map(c => ({
        ...c,
        id: c._id || c.id,
        date: c.timestamp || c.created_at || c.date,
        doctor: c.user_name || c.user_email || 'Desconhecido'
      }));
      setConsultations(realConsultations);
      
      setOnlineCount(onlineRes.data.online_count);
      setMonthlyUsage(monthlyRes.data);
      
      const feedbackData = feedbacksRes.data || [];
      setFeedbacks(feedbackData);
      
      const helpful = feedbackData.filter(f => f.is_helpful).length;
      const notHelpful = feedbackData.filter(f => !f.is_helpful).length;
      setFeedbackStats({
        helpful,
        notHelpful,
        total: feedbackData.length
      });
      
      setDeletedUsers(deletedRes.data || []);
      setLastUpdated(new Date());
      
    } catch (error) {
      console.error("Admin Fetch Error:", error);
      if (users.length === 0) {
        toast.error("Erro ao carregar dados. Verifique sua conexão.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (userRole !== 'ADMIN') {
      toast.error("Acesso negado. Área restrita para administradores.");
      navigate('/');
    } else {
      fetchData();
      const interval = setInterval(fetchData, 3000);
      return () => clearInterval(interval);
    }
  }, [userRole, navigate]);

  return {
    users,
    setUsers,
    consultations,
    feedbacks,
    feedbackStats,
    onlineCount,
    isLoading,
    lastUpdated,
    monthlyUsage,
    deletedUsers,
    fetchData
  };
};

export default useAdminData;
