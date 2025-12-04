import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { MessageSquare, Search, User, Bot, Calendar, Copy, Check } from 'lucide-react';
import { toast } from "sonner";

const ChatHistorySection = ({ chatHistory, formatDate }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedChat, setSelectedChat] = useState(null);
  const [copiedText, setCopiedText] = useState(null);

  const handleCopy = async (text, type) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedText(type);
      toast.success('Texto copiado!');
      setTimeout(() => setCopiedText(null), 2000);
    } catch (error) {
      toast.error('Erro ao copiar texto.');
    }
  };

  const filteredChats = chatHistory.filter(chat =>
    chat.user_message?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    chat.ai_response?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    chat.user_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    chat.user_email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getPreview = (text, maxLength = 80) => {
    if (!text) return "";
    return text.length > maxLength ? text.substring(0, maxLength) + "..." : text;
  };

  return (
    <Card className="mt-8 border-orange-200 dark:border-orange-900/30">
      <CardHeader className="bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-950/20 dark:to-amber-950/20 border-b border-orange-100 dark:border-orange-900/30">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-orange-100 dark:bg-orange-900/40 flex items-center justify-center">
              <MessageSquare className="h-5 w-5 text-orange-600 dark:text-orange-400" />
            </div>
            <div>
              <CardTitle className="text-xl">Histórico de Conversas IA</CardTitle>
              <CardDescription>
                Todas as conversas do chat livre realizadas pelos usuários
              </CardDescription>
            </div>
          </div>
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por usuário ou mensagem..."
              className="pl-9 bg-white dark:bg-slate-950"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-6">
        {chatHistory.length === 0 ? (
          <div className="text-center py-12">
            <div className="bg-orange-100 dark:bg-orange-900/20 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <MessageSquare className="h-8 w-8 text-orange-400" />
            </div>
            <p className="text-muted-foreground">Nenhuma conversa registrada ainda.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredChats.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">Nenhuma conversa encontrada com os termos de busca.</p>
              </div>
            ) : (
              filteredChats.map((chat) => (
                <Dialog key={chat.id}>
                  <DialogTrigger asChild>
                    <div 
                      className="border border-slate-200 dark:border-slate-800 rounded-lg p-4 hover:border-orange-300 dark:hover:border-orange-700 hover:bg-orange-50/30 dark:hover:bg-orange-950/10 cursor-pointer transition-all group"
                      onClick={() => setSelectedChat(chat)}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <User className="h-4 w-4 text-slate-500 flex-shrink-0" />
                            <span className="font-medium text-sm truncate">{chat.user_name}</span>
                            <Badge variant="outline" className="text-xs">
                              {chat.user_email}
                            </Badge>
                          </div>
                          <div className="space-y-2">
                            <div className="flex items-start gap-2">
                              <MessageSquare className="h-3.5 w-3.5 text-blue-500 mt-0.5 flex-shrink-0" />
                              <p className="text-sm text-slate-700 dark:text-slate-300 line-clamp-2">
                                {getPreview(chat.user_message, 100)}
                              </p>
                            </div>
                            <div className="flex items-start gap-2">
                              <Bot className="h-3.5 w-3.5 text-purple-500 mt-0.5 flex-shrink-0" />
                              <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1">
                                {getPreview(chat.ai_response, 120)}
                              </p>
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-2 flex-shrink-0">
                          <div className="flex items-center gap-1 text-xs text-slate-500">
                            <Calendar className="h-3 w-3" />
                            {formatDate(chat.created_at)}
                          </div>
                          <Badge variant="secondary" className="text-xs">
                            Meduf 2.0 Clinic
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </DialogTrigger>
                  
                  <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle className="flex items-center gap-2">
                        <MessageSquare className="h-5 w-5 text-orange-500" />
                        Detalhes da Conversa
                      </DialogTitle>
                    </DialogHeader>
                    
                    <div className="space-y-6 mt-4">
                      {/* User Info */}
                      <Card className="bg-slate-50 dark:bg-slate-900/50">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                {chat.user_name}
                              </p>
                              <p className="text-xs text-slate-500">{chat.user_email}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-xs text-slate-500">
                                {formatDate(chat.created_at)}
                              </p>
                              <Badge variant="outline" className="text-xs mt-1">
                                Meduf 2.0 Clinic
                              </Badge>
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      {/* User Message */}
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <div className="h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                              <User className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                            </div>
                            <span className="font-medium text-sm">Pergunta do Médico</span>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleCopy(chat.user_message, 'question')}
                          >
                            {copiedText === 'question' ? (
                              <>
                                <Check className="h-3 w-3 mr-1" />
                                Copiado
                              </>
                            ) : (
                              <>
                                <Copy className="h-3 w-3 mr-1" />
                                Copiar
                              </>
                            )}
                          </Button>
                        </div>
                        <Card className="bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900/30">
                          <CardContent className="p-4">
                            <p className="text-sm whitespace-pre-wrap text-slate-700 dark:text-slate-300">
                              {chat.user_message}
                            </p>
                          </CardContent>
                        </Card>
                      </div>

                      {/* AI Response */}
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <div className="h-8 w-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                              <Bot className="h-4 w-4 text-white" />
                            </div>
                            <span className="font-medium text-sm">Resposta da IA</span>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleCopy(chat.ai_response, 'answer')}
                          >
                            {copiedText === 'answer' ? (
                              <>
                                <Check className="h-3 w-3 mr-1" />
                                Copiado
                              </>
                            ) : (
                              <>
                                <Copy className="h-3 w-3 mr-1" />
                                Copiar
                              </>
                            )}
                          </Button>
                        </div>
                        <Card className="bg-purple-50 dark:bg-purple-950/20 border-purple-200 dark:border-purple-900/30">
                          <CardContent className="p-4">
                            <p className="text-sm whitespace-pre-wrap text-slate-700 dark:text-slate-300 leading-relaxed">
                              {chat.ai_response}
                            </p>
                          </CardContent>
                        </Card>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              ))
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ChatHistorySection;
