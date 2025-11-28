import React, { useState, useEffect } from 'react';
import { Header } from '@/components/Header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import { User, Save, Loader2, Camera } from 'lucide-react';
import api from '@/lib/api';

const Profile = () => {
  const [user, setUser] = useState({
    name: localStorage.getItem('userName') || '',
    email: '', // We don't store email in localstorage usually, but we can fetch it or just show name
    avatar_url: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Fetch user data on mount (we need a new endpoint for this or just use what we have)
  // Since we don't have a dedicated "get me" endpoint that returns everything, we might need to rely on localstorage or add one.
  // Actually, `get_current_active_user` is used as dependency, so we can make a simple endpoint or just update what we can.
  // Let's assume we can update name and avatar.

  const handleSave = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const response = await api.patch('/users/me', {
        name: user.name,
        avatar_url: user.avatar_url
      });
      
      // Update local storage
      localStorage.setItem('userName', response.data.name);
      if (response.data.avatar_url) {
        localStorage.setItem('userAvatar', response.data.avatar_url);
      }
      
      toast.success("Perfil atualizado com sucesso!");
    } catch (error) {
      console.error(error);
      toast.error("Erro ao atualizar perfil.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-background font-sans">
      <Header />
      <main className="container mx-auto px-4 py-8 md:px-8 max-w-2xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Meu Perfil</h1>
          <p className="text-muted-foreground mt-1">
            Gerencie suas informações pessoais e preferências.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Informações Básicas</CardTitle>
            <CardDescription>
              Atualize sua foto e nome de exibição.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSave} className="space-y-6">
              
              <div className="flex flex-col items-center gap-4 sm:flex-row sm:gap-8">
                <div className="relative group">
                  <Avatar className="h-24 w-24 border-2 border-muted">
                    <AvatarImage src={user.avatar_url} />
                    <AvatarFallback className="text-2xl bg-primary/10 text-primary">
                      {user.name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="absolute inset-0 flex items-center justify-center bg-black/60 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                    <Camera className="h-8 w-8 text-white" />
                  </div>
                </div>
                
                <div className="flex-1 space-y-2 w-full">
                  <Label htmlFor="avatar_url">URL da Foto de Perfil</Label>
                  <Input 
                    id="avatar_url" 
                    placeholder="https://exemplo.com/foto.jpg" 
                    value={user.avatar_url}
                    onChange={(e) => setUser({...user, avatar_url: e.target.value})}
                  />
                  <p className="text-xs text-muted-foreground">
                    Cole o link de uma imagem para usar como foto de perfil.
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="name">Nome Completo</Label>
                <Input 
                  id="name" 
                  value={user.name}
                  onChange={(e) => setUser({...user, name: e.target.value})}
                  required
                />
              </div>

              <div className="flex justify-end">
                <Button type="submit" disabled={isSaving}>
                  {isSaving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Salvando...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" /> Salvar Alterações
                    </>
                  )}
                </Button>
              </div>

            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Profile;
