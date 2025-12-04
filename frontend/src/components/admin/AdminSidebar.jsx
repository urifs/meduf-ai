import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Shield, FileText, Search } from 'lucide-react';

const AdminSidebar = ({ 
  users, 
  consultations, 
  formatDate, 
  onConsultationClick,
  onUserClick
}) => {
  const [consultationsSearchTerm, setConsultationsSearchTerm] = useState('');

  const filteredConsultations = consultations.filter(consult => {
    const searchLower = consultationsSearchTerm.toLowerCase();
    return (
      consult.user_name?.toLowerCase().includes(searchLower) ||
      consult.user_email?.toLowerCase().includes(searchLower) ||
      consult.patient?.queixa?.toLowerCase().includes(searchLower) ||
      consult.report?.diagnoses?.[0]?.name?.toLowerCase().includes(searchLower)
    );
  });
  return (
    <div className="xl:col-span-1 space-y-8">
      {/* Admins List Card */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>Administradores</CardTitle>
          <CardDescription>Contas com acesso total ao sistema.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {users.filter(u => u.role === 'ADMIN').length === 0 ? (
              <div className="text-center py-4 text-muted-foreground text-sm">
                Nenhum administrador encontrado.
              </div>
            ) : (
              users.filter(u => u.role === 'ADMIN').map((admin) => (
                <div 
                  key={admin.id} 
                  className="flex items-center justify-between pb-2 border-b last:border-0 last:pb-0 cursor-pointer hover:bg-slate-50 p-2 rounded-md transition-colors"
                  onClick={() => onUserClick && onUserClick(admin)}
                >
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600">
                      <Shield className="h-4 w-4" />
                    </div>
                    <div className="space-y-0.5">
                      <p className="text-sm font-medium leading-none">{admin.name}</p>
                      <p className="text-xs text-muted-foreground">{admin.email}</p>
                    </div>
                  </div>
                  <Badge variant="secondary" className="text-xs bg-indigo-50 text-indigo-700 border-indigo-100">
                    Admin
                  </Badge>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity Card */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>Últimas Consultas</CardTitle>
          <CardDescription>Atividade recente na plataforma.</CardDescription>
          <div className="relative mt-3">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por paciente, médico ou diagnóstico..."
              className="pl-8 text-sm"
              value={consultationsSearchTerm}
              onChange={(e) => setConsultationsSearchTerm(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-6 max-h-[400px] overflow-y-auto pr-2">
            {filteredConsultations.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground text-sm">
                {consultationsSearchTerm ? 'Nenhuma consulta encontrada com os termos de busca.' : 'Nenhuma consulta registrada ainda.'}
              </div>
            ) : (
              filteredConsultations.map((consult, i) => (
                <div 
                  key={i} 
                  className="flex items-start gap-4 pb-4 border-b last:border-0 last:pb-0 cursor-pointer hover:bg-slate-50 p-2 rounded-md transition-colors"
                  onClick={() => onConsultationClick(consult)}
                >
                  <div className="h-9 w-9 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 mt-0.5">
                    <FileText className="h-4 w-4" />
                  </div>
                  <div className="space-y-1 flex-1">
                    <p className="text-sm font-medium leading-none">
                      {consult.diagnosis || "Análise Realizada"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Dr(a). {consult.doctor}
                    </p>
                    <p className="text-xs text-slate-400">
                      {formatDate(consult.date)}
                    </p>
                  </div>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
                    <FileText className="h-4 w-4" />
                  </Button>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminSidebar;
