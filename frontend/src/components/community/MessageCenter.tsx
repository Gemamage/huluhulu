import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Avatar,
  IconButton,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  ListItemSecondaryAction,
  Divider,
  Badge,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Paper,
  InputAdornment,
  Menu,
  MenuItem,
  Alert,
  Chip,
  Stack
} from '@mui/material';
import {
  Send as SendIcon,
  Search as SearchIcon,
  MoreVert as MoreVertIcon,
  Delete as DeleteIcon,
  Image as ImageIcon,
  Close as CloseIcon,
  ArrowBack as ArrowBackIcon
} from '@mui/icons-material';
import { formatDistanceToNow } from 'date-fns';
import { zhTW } from 'date-fns/locale';
import { useAuth } from '../../hooks/useAuth';
import { messageService } from '../../services/messageService';
import { LoadingButton } from '@mui/lab';

export interface User {
  _id: string;
  username: string;
  avatar?: string;
}

export interface Message {
  _id: string;
  conversationId: string;
  senderId: User;
  receiverId: User;
  content: string;
  messageType: 'text' | 'image';
  imageUrl?: string;
  isRead: boolean;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Conversation {
  _id: string;
  participants: User[];
  petId?: {
    _id: string;
    name: string;
    images: string[];
  };
  lastMessage?: {
    content: string;
    senderId: string;
    createdAt: string;
    messageType: 'text' | 'image';
  };
  unreadCount: number;
  createdAt: string;
  updatedAt: string;
}

interface MessageCenterProps {
  initialConversationId?: string;
  initialReceiverId?: string;
  petId?: string;
}

const MessageCenter: React.FC<MessageCenterProps> = ({
  initialConversationId,
  initialReceiverId,
  petId
}) => {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversation, setCurrentConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 滾動到最新訊息
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // 載入對話列表
  const loadConversations = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await messageService.getUserConversations({
        page: 1,
        limit: 50
      });
      
      setConversations(response.conversations);
    } catch (error: any) {
      setError(error.message || '載入對話列表失敗');
    } finally {
      setLoading(false);
    }
  };

  // 載入對話訊息
  const loadMessages = async (conversationId: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await messageService.getConversationMessages(conversationId, {
        page: 1,
        limit: 100
      });
      
      setMessages(response.messages.reverse()); // 最新的在下面
      
      // 標記為已讀
      await messageService.markAsRead(conversationId);
      
      // 更新對話列表中的未讀數
      setConversations(prev => prev.map(conv => 
        conv._id === conversationId 
          ? { ...conv, unreadCount: 0 }
          : conv
      ));
      
      setTimeout(scrollToBottom, 100);
    } catch (error: any) {
      setError(error.message || '載入訊息失敗');
    } finally {
      setLoading(false);
    }
  };

  // 發送訊息
  const handleSendMessage = async () => {
    if (!newMessage.trim() || !currentConversation || !user) return;
    
    try {
      setSending(true);
      setError(null);
      
      const otherParticipant = currentConversation.participants.find(p => p._id !== user._id);
      if (!otherParticipant) return;
      
      await messageService.sendMessage({
        receiverId: otherParticipant._id,
        content: newMessage.trim(),
        messageType: 'text',
        petId: currentConversation.petId?._id
      });
      
      setNewMessage('');
      await loadMessages(currentConversation._id);
      await loadConversations(); // 更新對話列表
    } catch (error: any) {
      setError(error.message || '發送訊息失敗');
    } finally {
      setSending(false);
    }
  };

  // 發送圖片
  const handleSendImage = async (file: File) => {
    if (!currentConversation || !user) return;
    
    try {
      setSending(true);
      setError(null);
      
      const formData = new FormData();
      formData.append('image', file);
      
      const otherParticipant = currentConversation.participants.find(p => p._id !== user._id);
      if (!otherParticipant) return;
      
      // 這裡需要先上傳圖片，然後發送訊息
      // 假設有圖片上傳服務
      const imageUrl = await uploadImage(file);
      
      await messageService.sendMessage({
        receiverId: otherParticipant._id,
        content: '發送了一張圖片',
        messageType: 'image',
        imageUrl,
        petId: currentConversation.petId?._id
      });
      
      await loadMessages(currentConversation._id);
      await loadConversations();
    } catch (error: any) {
      setError(error.message || '發送圖片失敗');
    } finally {
      setSending(false);
    }
  };

  // 上傳圖片（模擬）
  const uploadImage = async (file: File): Promise<string> => {
    // 這裡應該調用實際的圖片上傳服務
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.readAsDataURL(file);
    });
  };

  // 刪除訊息
  const handleDeleteMessage = async () => {
    if (!selectedMessage) return;
    
    try {
      setError(null);
      await messageService.deleteMessage(selectedMessage._id);
      await loadMessages(currentConversation!._id);
      setDeleteDialog(false);
      setSelectedMessage(null);
    } catch (error: any) {
      setError(error.message || '刪除訊息失敗');
    }
  };

  // 刪除對話
  const handleDeleteConversation = async (conversationId: string) => {
    if (!window.confirm('確定要刪除這個對話嗎？')) return;
    
    try {
      setError(null);
      await messageService.deleteConversation(conversationId);
      
      if (currentConversation?._id === conversationId) {
        setCurrentConversation(null);
        setMessages([]);
      }
      
      await loadConversations();
    } catch (error: any) {
      setError(error.message || '刪除對話失敗');
    }
  };

  // 開始新對話
  const startNewConversation = async (receiverId: string, petId?: string) => {
    try {
      setError(null);
      const conversation = await messageService.getOrCreateConversation(receiverId, petId);
      setCurrentConversation(conversation);
      await loadMessages(conversation._id);
      await loadConversations();
    } catch (error: any) {
      setError(error.message || '開始對話失敗');
    }
  };

  // 處理文件選擇
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      handleSendImage(file);
    }
    // 清空input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // 過濾對話
  const filteredConversations = conversations.filter(conv => {
    if (!searchTerm) return true;
    const otherParticipant = conv.participants.find(p => p._id !== user?._id);
    return otherParticipant?.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
           conv.petId?.name.toLowerCase().includes(searchTerm.toLowerCase());
  });

  // 獲取對話中的另一個參與者
  const getOtherParticipant = (conversation: Conversation) => {
    return conversation.participants.find(p => p._id !== user?._id);
  };

  // 初始化
  useEffect(() => {
    if (user) {
      loadConversations();
      
      // 如果有初始對話ID或接收者ID，自動開啟對話
      if (initialConversationId) {
        const conv = conversations.find(c => c._id === initialConversationId);
        if (conv) {
          setCurrentConversation(conv);
          loadMessages(initialConversationId);
        }
      } else if (initialReceiverId) {
        startNewConversation(initialReceiverId, petId);
      }
    }
  }, [user, initialConversationId, initialReceiverId, petId]);

  if (!user) {
    return (
      <Card>
        <CardContent>
          <Typography variant="body2" color="text.secondary" textAlign="center">
            請先登入以使用私訊功能
          </Typography>
        </CardContent>
      </Card>
    );
  }

  return (
    <Box sx={{ height: '600px', display: 'flex', border: 1, borderColor: 'divider', borderRadius: 1 }}>
      {/* 對話列表 */}
      <Box sx={{ width: '300px', borderRight: 1, borderColor: 'divider', display: 'flex', flexDirection: 'column' }}>
        <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
          <Typography variant="h6" gutterBottom>
            私訊
          </Typography>
          <TextField
            fullWidth
            size="small"
            placeholder="搜尋對話..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              )
            }}
          />
        </Box>
        
        <List sx={{ flex: 1, overflow: 'auto', p: 0 }}>
          {filteredConversations.map((conversation) => {
            const otherParticipant = getOtherParticipant(conversation);
            if (!otherParticipant) return null;
            
            return (
              <ListItem
                key={conversation._id}
                button
                selected={currentConversation?._id === conversation._id}
                onClick={() => {
                  setCurrentConversation(conversation);
                  loadMessages(conversation._id);
                }}
                sx={{ borderBottom: 1, borderColor: 'divider' }}
              >
                <ListItemAvatar>
                  <Badge badgeContent={conversation.unreadCount} color="error">
                    <Avatar src={otherParticipant.avatar} alt={otherParticipant.username}>
                      {otherParticipant.username.charAt(0).toUpperCase()}
                    </Avatar>
                  </Badge>
                </ListItemAvatar>
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="subtitle2">
                        {otherParticipant.username}
                      </Typography>
                      {conversation.petId && (
                        <Chip
                          label={conversation.petId.name}
                          size="small"
                          variant="outlined"
                        />
                      )}
                    </Box>
                  }
                  secondary={
                    <Box>
                      <Typography variant="body2" color="text.secondary" noWrap>
                        {conversation.lastMessage?.messageType === 'image' 
                          ? '📷 圖片' 
                          : conversation.lastMessage?.content || '開始對話吧！'
                        }
                      </Typography>
                      {conversation.lastMessage && (
                        <Typography variant="caption" color="text.secondary">
                          {formatDistanceToNow(new Date(conversation.lastMessage.createdAt), {
                            addSuffix: true,
                            locale: zhTW
                          })}
                        </Typography>
                      )}
                    </Box>
                  }
                />
                <ListItemSecondaryAction>
                  <IconButton
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (window.confirm('確定要刪除這個對話嗎？')) {
                        handleDeleteConversation(conversation._id);
                      }
                    }}
                  >
                    <DeleteIcon />
                  </IconButton>
                </ListItemSecondaryAction>
              </ListItem>
            );
          })}
        </List>
        
        {filteredConversations.length === 0 && (
          <Box sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              {searchTerm ? '沒有找到相關對話' : '還沒有對話'}
            </Typography>
          </Box>
        )}
      </Box>
      
      {/* 訊息區域 */}
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {currentConversation ? (
          <>
            {/* 對話標題 */}
            <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider', display: 'flex', alignItems: 'center', gap: 1 }}>
              <IconButton
                size="small"
                onClick={() => setCurrentConversation(null)}
                sx={{ display: { sm: 'none' } }}
              >
                <ArrowBackIcon />
              </IconButton>
              <Avatar
                src={getOtherParticipant(currentConversation)?.avatar}
                alt={getOtherParticipant(currentConversation)?.username}
                sx={{ width: 32, height: 32 }}
              >
                {getOtherParticipant(currentConversation)?.username.charAt(0).toUpperCase()}
              </Avatar>
              <Box sx={{ flex: 1 }}>
                <Typography variant="subtitle1">
                  {getOtherParticipant(currentConversation)?.username}
                </Typography>
                {currentConversation.petId && (
                  <Typography variant="caption" color="text.secondary">
                    關於：{currentConversation.petId.name}
                  </Typography>
                )}
              </Box>
            </Box>
            
            {error && (
              <Alert severity="error" sx={{ m: 1 }} onClose={() => setError(null)}>
                {error}
              </Alert>
            )}
            
            {/* 訊息列表 */}
            <Box sx={{ flex: 1, overflow: 'auto', p: 1 }}>
              {messages.map((message) => {
                const isOwn = message.senderId._id === user._id;
                
                return (
                  <Box
                    key={message._id}
                    sx={{
                      display: 'flex',
                      justifyContent: isOwn ? 'flex-end' : 'flex-start',
                      mb: 1
                    }}
                  >
                    <Paper
                      sx={{
                        p: 1,
                        maxWidth: '70%',
                        bgcolor: isOwn ? 'primary.main' : 'grey.100',
                        color: isOwn ? 'primary.contrastText' : 'text.primary'
                      }}
                    >
                      {message.messageType === 'image' ? (
                        <Box
                          component="img"
                          src={message.imageUrl}
                          alt="圖片訊息"
                          sx={{
                            maxWidth: '200px',
                            maxHeight: '200px',
                            borderRadius: 1,
                            cursor: 'pointer'
                          }}
                          onClick={() => setImagePreview(message.imageUrl!)}
                        />
                      ) : (
                        <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                          {message.content}
                        </Typography>
                      )}
                      
                      <Typography
                        variant="caption"
                        sx={{
                          display: 'block',
                          mt: 0.5,
                          opacity: 0.7,
                          textAlign: isOwn ? 'right' : 'left'
                        }}
                      >
                        {formatDistanceToNow(new Date(message.createdAt), {
                          addSuffix: true,
                          locale: zhTW
                        })}
                        {isOwn && message.isRead && ' · 已讀'}
                      </Typography>
                      
                      {isOwn && (
                        <IconButton
                          size="small"
                          sx={{ position: 'absolute', top: 0, right: 0, opacity: 0.5 }}
                          onClick={(e) => {
                            setAnchorEl(e.currentTarget);
                            setSelectedMessage(message);
                          }}
                        >
                          <MoreVertIcon fontSize="small" />
                        </IconButton>
                      )}
                    </Paper>
                  </Box>
                );
              })}
              <div ref={messagesEndRef} />
            </Box>
            
            {/* 訊息輸入 */}
            <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
              <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-end' }}>
                <input
                  type="file"
                  accept="image/*"
                  style={{ display: 'none' }}
                  ref={fileInputRef}
                  onChange={handleFileSelect}
                />
                <IconButton
                  onClick={() => fileInputRef.current?.click()}
                  disabled={sending}
                >
                  <ImageIcon />
                </IconButton>
                <TextField
                  fullWidth
                  multiline
                  maxRows={4}
                  placeholder="輸入訊息..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  variant="outlined"
                  size="small"
                />
                <LoadingButton
                  variant="contained"
                  onClick={handleSendMessage}
                  loading={sending}
                  disabled={!newMessage.trim()}
                >
                  <SendIcon />
                </LoadingButton>
              </Box>
            </Box>
          </>
        ) : (
          <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Typography variant="body1" color="text.secondary">
              選擇一個對話開始聊天
            </Typography>
          </Box>
        )}
      </Box>
      
      {/* 訊息選單 */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={() => { setAnchorEl(null); setSelectedMessage(null); }}
      >
        <MenuItem onClick={() => { setDeleteDialog(true); setAnchorEl(null); }}>
          <DeleteIcon sx={{ mr: 1 }} fontSize="small" />
          刪除訊息
        </MenuItem>
      </Menu>
      
      {/* 刪除確認對話框 */}
      <Dialog open={deleteDialog} onClose={() => setDeleteDialog(false)}>
        <DialogTitle>刪除訊息</DialogTitle>
        <DialogContent>
          <Typography>
            確定要刪除這則訊息嗎？此操作無法復原。
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog(false)}>取消</Button>
          <Button color="error" onClick={handleDeleteMessage}>刪除</Button>
        </DialogActions>
      </Dialog>
      
      {/* 圖片預覽對話框 */}
      <Dialog
        open={Boolean(imagePreview)}
        onClose={() => setImagePreview(null)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          圖片預覽
          <IconButton
            sx={{ position: 'absolute', right: 8, top: 8 }}
            onClick={() => setImagePreview(null)}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          {imagePreview && (
            <Box
              component="img"
              src={imagePreview}
              alt="圖片預覽"
              sx={{ width: '100%', height: 'auto' }}
            />
          )}
        </DialogContent>
      </Dialog>
    </Box>
  );
};

export default MessageCenter;