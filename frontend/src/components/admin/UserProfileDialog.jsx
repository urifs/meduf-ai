import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { CalendarClock, Ban, Unlock } from 'lucide-react';

const UserProfileDialog = ({ 
  isOpen, 
  onOpenChange, 
  selectedUser, 
  formatDate,
  getDaysRemaining,
  getDaysColor,
  onChangeExpiration,
  onToggleStatus
}) => {
  if (!selectedUser) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Perfil do Usuário</DialogTitle>
          <DialogDescription>
            Informações detalhadas da conta
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6 mt-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium text-muted-foreground">Nome Completo</Label>
              <p className="text-sm font-medium">{selectedUser.name}</p>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium text-muted-foreground">Email</Label>
              <p className="text-sm">{selectedUser.email}</p>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium text-muted-foreground">Função</Label>
              <Badge variant="outline" className={selectedUser.role === 'ADMIN' ? 'border-purple-200 bg-purple-50 text-purple-700' : 'border-slate-200 bg-slate-50 text-slate-700'}>
                {selectedUser.role}
              </Badge>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium text-muted-foreground">Status</Label>
              <Badge className={selectedUser.status === 'Ativo' ? 'bg-green-500' : 'bg-red-500'}>
                {selectedUser.status}
              </Badge>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium text-muted-foreground">Data de Criação</Label>
              <p className="text-sm">{formatDate(selectedUser.created_at)}</p>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium text-muted-foreground">Validade da Conta</Label>
              <p className={`text-sm ${getDaysColor(selectedUser.expiration_date)}`}>
                {getDaysRemaining(selectedUser.expiration_date)}
              </p>
            </div>
          </div>
          
          {selectedUser.expiration_date && (
            <div className="space-y-2">
              <Label className="text-sm font-medium text-muted-foreground">Data de Expiração</Label>
              <p className="text-sm">{formatDate(selectedUser.expiration_date)}</p>
            </div>
          )}
          
          <div className="pt-4 border-t">
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => {
                  onOpenChange(false);
                  onChangeExpiration(selectedUser);
                }}
              >
                <CalendarClock className="h-4 w-4 mr-2" />
                Alterar Validade
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => onToggleStatus(selectedUser.id, selectedUser.status)}
              >
                {selectedUser.status === 'Ativo' ? (
                  <><Ban className="h-4 w-4 mr-2" /> Bloquear</>
                ) : (
                  <><Unlock className="h-4 w-4 mr-2" /> Desbloquear</>
                )}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default UserProfileDialog;
