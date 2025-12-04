import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '@/components/Header';
import { Button } from "@/components/ui/button";
import { RefreshCw } from 'lucide-react';
import { format, differenceInDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// Custom Hooks
import useAdminData from '@/hooks/useAdminData';
import useUserActions from '@/hooks/useUserActions';

// Components
import UserStatsCards from '@/components/admin/UserStatsCards';
import CreateUserDialog from '@/components/admin/CreateUserDialog';
import ReactivationDialog from '@/components/admin/ReactivationDialog';
import ExpirationDialog from '@/components/admin/ExpirationDialog';
import UserProfileDialog from '@/components/admin/UserProfileDialog';
import ConsultationDialog from '@/components/admin/ConsultationDialog';
import UserManagementTabs from '@/components/admin/UserManagementTabs';
import AdminSidebar from '@/components/admin/AdminSidebar';
import FeedbackSection from '@/components/admin/FeedbackSection';
import ChatHistorySection from '@/components/admin/ChatHistorySection';

const Admin = () => {
  const navigate = useNavigate();
  const userRole = localStorage.getItem('userRole');
  
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUserProfile, setSelectedUserProfile] = useState(null);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [selectedConsultation, setSelectedConsultation] = useState(null);
  const [isConsultationOpen, setIsConsultationOpen] = useState(false);

  // Custom Hook: Admin Data
  const {
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
    chatHistory,
    chatStats,
    fetchData
  } = useAdminData(userRole, navigate);

  // Custom Hook: User Actions
  const {
    isCreateOpen,
    setIsCreateOpen,
    isCreating,
    newUser,
    setNewUser,
    handleCreateUser,
    isExpirationOpen,
    setIsExpirationOpen,
    isUpdatingExpiration,
    selectedUserForExpiration,
    setSelectedUserForExpiration,
    newDaysValid,
    setNewDaysValid,
    handleUpdateExpiration,
    handleToggleStatus,
    handleDeleteUser,
    isReactivateOpen,
    setIsReactivateOpen,
    isReactivating,
    selectedUserForReactivation,
    setSelectedUserForReactivation,
    reactivationDays,
    setReactivationDays,
    handleReactivateUser
  } = useUserActions(fetchData, users, setUsers);

  // Helper Functions
  const formatDate = (dateString) => {
    if (!dateString) return "-";
    try {
      return format(new Date(dateString), "dd MMM yyyy, HH:mm", { locale: ptBR });
    } catch (e) {
      return "Data Inválida";
    }
  };

  const getDaysRemaining = (expirationDate) => {
    if (!expirationDate) return "∞";
    try {
      const days = differenceInDays(new Date(expirationDate), new Date());
      if (days < 0) return "Expirado";
      return `${days} dias`;
    } catch (e) {
      return "-";
    }
  };

  const getDaysColor = (expirationDate) => {
    if (!expirationDate) return "text-slate-500";
    const days = differenceInDays(new Date(expirationDate), new Date());
    if (days < 0) return "text-red-600 font-bold";
    if (days < 5) return "text-orange-600 font-bold";
    return "text-green-600";
  };

  // Stats Calculation
  const stats = {
    totalUsers: users.length,
    activeUsers: users.filter(u => u.status === 'Ativo').length,
    totalConsultations: consultations.length,
    totalAdmins: users.filter(u => u.role === 'ADMIN').length,
    totalNormalUsers: users.filter(u => u.role === 'USER').length,
    totalDeleted: deletedUsers.length,
  };

  if (userRole !== 'ADMIN') return null;

  return (
    <div className="min-h-screen bg-slate-50/50 font-sans">
      <Header />
      
      <main className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">Painel Administrativo</h1>
            <p className="text-slate-500 mt-1">
              Gerenciamento do sistema e monitoramento de usuários.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground hidden md:inline-block">
              Atualizado em: {format(lastUpdated, "HH:mm:ss")}
            </span>
            <Button variant="outline" size="sm" onClick={fetchData} disabled={isLoading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Atualizar
            </Button>
            
            <CreateUserDialog
              isOpen={isCreateOpen}
              onOpenChange={setIsCreateOpen}
              newUser={newUser}
              setNewUser={setNewUser}
              onSubmit={handleCreateUser}
              isCreating={isCreating}
            />
          </div>
        </div>

        {/* Stats Cards */}
        <UserStatsCards 
          stats={stats} 
          onlineCount={onlineCount} 
          monthlyUsage={monthlyUsage}
          chatStats={chatStats}
        />

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          {/* User Management Tabs */}
          <UserManagementTabs
            users={users}
            deletedUsers={deletedUsers}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            formatDate={formatDate}
            getDaysRemaining={getDaysRemaining}
            getDaysColor={getDaysColor}
            onUserClick={(user) => {
              setSelectedUserProfile(user);
              setIsProfileOpen(true);
            }}
            onChangeExpiration={(user) => {
              setSelectedUserForExpiration(user);
              setIsExpirationOpen(true);
            }}
            onToggleStatus={handleToggleStatus}
            onDeleteUser={handleDeleteUser}
            onReactivateUser={(user) => {
              setSelectedUserForReactivation(user);
              setIsReactivateOpen(true);
            }}
          />

          {/* Admin Sidebar */}
          <AdminSidebar
            users={users}
            consultations={consultations}
            formatDate={formatDate}
            onConsultationClick={(consult) => {
              setSelectedConsultation(consult);
              setIsConsultationOpen(true);
            }}
            onUserClick={(user) => {
              setSelectedUserProfile(user);
              setIsProfileOpen(true);
            }}
          />
        </div>

        {/* Feedbacks Section */}
        <FeedbackSection
          feedbacks={feedbacks}
          feedbackStats={feedbackStats}
          formatDate={formatDate}
          onViewFeedback={(feedback) => {
            setSelectedConsultation({
              doctor: feedback.user_name || feedback.user_email,
              date: feedback.timestamp,
              patient: feedback.patient_data || {},
              report: feedback.result_data || feedback.analysis_data || {}
            });
            setIsConsultationOpen(true);
          }}
        />

        {/* Chat History Section */}
        <ChatHistorySection
          chatHistory={chatHistory}
          formatDate={formatDate}
        />

        {/* Modals */}
        <ReactivationDialog
          isOpen={isReactivateOpen}
          onOpenChange={setIsReactivateOpen}
          selectedUser={selectedUserForReactivation}
          reactivationDays={reactivationDays}
          setReactivationDays={setReactivationDays}
          onSubmit={handleReactivateUser}
          isReactivating={isReactivating}
        />

        <ExpirationDialog
          isOpen={isExpirationOpen}
          onOpenChange={setIsExpirationOpen}
          selectedUser={selectedUserForExpiration}
          newDaysValid={newDaysValid}
          setNewDaysValid={setNewDaysValid}
          onUpdate={handleUpdateExpiration}
          isUpdating={isUpdatingExpiration}
        />

        <ConsultationDialog
          isOpen={isConsultationOpen}
          onOpenChange={setIsConsultationOpen}
          selectedConsultation={selectedConsultation}
          formatDate={formatDate}
        />

        <UserProfileDialog
          isOpen={isProfileOpen}
          onOpenChange={setIsProfileOpen}
          selectedUser={selectedUserProfile}
          formatDate={formatDate}
          getDaysRemaining={getDaysRemaining}
          getDaysColor={getDaysColor}
          onChangeExpiration={(user) => {
            setSelectedUserForExpiration(user);
            setIsProfileOpen(false);
            setIsExpirationOpen(true);
          }}
          onToggleStatus={handleToggleStatus}
        />
      </main>
    </div>
  );
};

export default Admin;
