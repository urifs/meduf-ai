import React, { useState, useRef } from 'react';
import { Header } from '@/components/Header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import { User, Save, Camera, Upload } from 'lucide-react';
import { CustomLoader } from '@/components/ui/custom-loader';
import api from '@/lib/api';

const Profile = () => {
  const [user, setUser] = useState({
    name: localStorage.getItem('userName') || '',
    avatar_url: localStorage.getItem('userAvatar') || '',
    bio: ''
  });
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const fileInputRef = useRef(null);

  // Fetch user data on component mount
  React.useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await api.get('/users/me');
        setUser({
          name: response.data.name,
          avatar_url: response.data.avatar_url || '',
          bio: response.data.bio || ''
        });
        // Update localStorage
        localStorage.setItem('userName', response.data.name);
        if (response.data.avatar_url) {
          localStorage.setItem('userAvatar', response.data.avatar_url);
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchUserData();
  }, []);

  // Helper to resolve avatar URL
  const getAvatarUrl = (url) => {
    if (!url) return '';
    if (url.startsWith('http')) return url;
    // If relative path, prepend backend URL
    // Use window.location.origin if REACT_APP_BACKEND_URL is not set or relative
    const backendUrl = process.env.REACT_APP_BACKEND_URL || window.location.origin;
    // Ensure we don't double slash if backendUrl ends with / and url starts with /
    const cleanBackendUrl = backendUrl.endsWith('/') ? backendUrl.slice(0, -1) : backendUrl;
    const cleanUrl = url.startsWith('/') ? url : `/${url}`;
    
    // If the url already contains /api/static, we just need to prepend the domain if it's missing
    // But wait, if we are in production, the backend URL might be the same as frontend URL (served via nginx)
    // If REACT_APP_BACKEND_URL is set to the preview URL, it should work.
    
    return `${cleanBackendUrl}${cleanUrl}`;
  };

  const handleSave = async (e) => {
    e.preventDefault();
    console.log('[DEBUG] handleSave called');
    console.log('[DEBUG] Current user data:', user);
    setIsSaving(true);
    try {
      console.log('[DEBUG] Calling API...');
      const response = await api.patch('/users/me', {
        name: user.name,
        avatar_url: user.avatar_url,
        bio: user.bio
      });
      console.log('[DEBUG] API Response:', response.data);
      
      // Update local state with response data
      setUser({
        name: response.data.name,
        avatar_url: response.data.avatar_url || '',
        bio: response.data.bio || ''
      });
      
      // Update localStorage
      localStorage.setItem('userName', response.data.name);
      if (response.data.avatar_url) {
        localStorage.setItem('userAvatar', response.data.avatar_url);
      }
      
      console.log('[DEBUG] Showing success toast');
      toast.success("Perfil atualizado com sucesso!");
    } catch (error) {
      console.error("[DEBUG] Error updating profile:", error);
      toast.error("Erro ao atualizar perfil.");
    } finally {
      setIsSaving(false);
      console.log('[DEBUG] handleSave completed');
    }
  };

  const handleFileSelect = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Basic validation
    if (!file.type.startsWith('image/')) {
      toast.error("Por favor, selecione um arquivo de imagem.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      toast.error("A imagem deve ter no máximo 5MB.");
      return;
    }

    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await api.post('/users/me/avatar', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      const newAvatarUrl = response.data.avatar_url;
      setUser(prev => ({ ...prev, avatar_url: newAvatarUrl }));
      localStorage.setItem('userAvatar', newAvatarUrl);
      toast.success("Foto de perfil atualizada!");
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Erro ao fazer upload da imagem.");
    } finally {
      setIsUploading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background font-sans">
        <Header />
        <main className="container mx-auto px-4 py-8 md:px-8 max-w-2xl">
          <div className="flex justify-center items-center h-64">
            <CustomLoader size="lg" />
          </div>
        </main>
      </div>
    );
  }

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
                    <AvatarImage src={getAvatarUrl(user.avatar_url)} className="object-cover" />
                    <AvatarFallback className="text-2xl bg-primary/10 text-primary">
                      {user.name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div 
                    className="absolute inset-0 flex items-center justify-center bg-black/60 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    {isUploading ? (
                      <CustomLoader size="lg" className="text-white" />
                    ) : (
                      <Camera className="h-8 w-8 text-white" />
                    )}
                  </div>
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    className="hidden" 
                    accept="image/*"
                    onChange={handleFileSelect}
                  />
                </div>
                
                <div className="flex-1 space-y-2 w-full">
                  <Label>Foto de Perfil</Label>
                  <div className="flex gap-2">
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="sm"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploading}
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      Carregar do Dispositivo
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    JPG, PNG ou GIF. Máximo 5MB.
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="name">Nome</Label>
                <Input 
                  id="name" 
                  value={user.name}
                  onChange={(e) => setUser({...user, name: e.target.value})}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="bio">Descrição Profissional</Label>
                <Textarea 
                  id="bio" 
                  placeholder="Ex: Médico Cardiologista | CRM 12345 | Especialista em Hipertensão"
                  value={user.bio || ''}
                  onChange={(e) => setUser({...user, bio: e.target.value})}
                  rows={3}
                  className="resize-none"
                />
                <p className="text-xs text-muted-foreground">
                  Uma breve descrição sobre sua atuação profissional (opcional)
                </p>
              </div>

              <div className="flex justify-end">
                <Button type="submit" disabled={isSaving}>
                  {isSaving ? (
                    <>
                      <CustomLoader size="sm" className="mr-2" /> Salvando...
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
