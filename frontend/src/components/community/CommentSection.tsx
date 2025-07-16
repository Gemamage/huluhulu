import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Avatar,
  IconButton,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  Divider,
  Alert,
  Collapse,
  Stack
} from '@mui/material';
import {
  Send as SendIcon,
  MoreVert as MoreVertIcon,
  Reply as ReplyIcon,
  Report as ReportIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon
} from '@mui/icons-material';
import { formatDistanceToNow } from 'date-fns';
import { zhTW } from 'date-fns/locale';
import { useAuth } from '../../hooks/useAuth';
import { commentService } from '../../services/commentService';
import { LoadingButton } from '@mui/lab';

export interface Comment {
  _id: string;
  petId: string;
  userId: {
    _id: string;
    username: string;
    avatar?: string;
  };
  content: string;
  parentId?: string;
  replies?: Comment[];
  createdAt: string;
  updatedAt: string;
  isDeleted: boolean;
  reportCount: number;
  isHidden: boolean;
}

interface CommentSectionProps {
  petId: string;
  allowComments?: boolean;
}

interface CommentItemProps {
  comment: Comment;
  onReply: (parentId: string) => void;
  onEdit: (comment: Comment) => void;
  onDelete: (commentId: string) => void;
  onReport: (commentId: string) => void;
  level?: number;
}

const CommentItem: React.FC<CommentItemProps> = ({
  comment,
  onReply,
  onEdit,
  onDelete,
  onReport,
  level = 0
}) => {
  const { user } = useAuth();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [showReplies, setShowReplies] = useState(false);

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const isOwner = user?._id === comment.userId._id;
  const canEdit = isOwner;
  const canDelete = isOwner;

  if (comment.isDeleted) {
    return (
      <Box sx={{ ml: level * 4, mb: 1 }}>
        <Card variant="outlined" sx={{ bgcolor: 'grey.50' }}>
          <CardContent sx={{ py: 1 }}>
            <Typography variant="body2" color="text.secondary" fontStyle="italic">
              此留言已被刪除
            </Typography>
          </CardContent>
        </Card>
      </Box>
    );
  }

  if (comment.isHidden) {
    return (
      <Box sx={{ ml: level * 4, mb: 1 }}>
        <Card variant="outlined" sx={{ bgcolor: 'warning.light', opacity: 0.7 }}>
          <CardContent sx={{ py: 1 }}>
            <Typography variant="body2" color="text.secondary" fontStyle="italic">
              此留言因違反社群規範已被隱藏
            </Typography>
          </CardContent>
        </Card>
      </Box>
    );
  }

  return (
    <Box sx={{ ml: level * 4, mb: 1 }}>
      <Card variant="outlined">
        <CardContent sx={{ pb: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
            <Avatar
              src={comment.userId.avatar}
              alt={comment.userId.username}
              sx={{ width: 32, height: 32 }}
            >
              {comment.userId.username.charAt(0).toUpperCase()}
            </Avatar>
            
            <Box sx={{ flex: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                <Typography variant="subtitle2" fontWeight="medium">
                  {comment.userId.username}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {formatDistanceToNow(new Date(comment.createdAt), {
                    addSuffix: true,
                    locale: zhTW
                  })}
                </Typography>
                {comment.updatedAt !== comment.createdAt && (
                  <Chip label="已編輯" size="small" variant="outlined" />
                )}
              </Box>
              
              <Typography variant="body2" sx={{ mb: 1, whiteSpace: 'pre-wrap' }}>
                {comment.content}
              </Typography>
              
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Button
                  size="small"
                  startIcon={<ReplyIcon />}
                  onClick={() => onReply(comment._id)}
                >
                  回覆
                </Button>
                
                {comment.replies && comment.replies.length > 0 && (
                  <Button
                    size="small"
                    startIcon={showReplies ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                    onClick={() => setShowReplies(!showReplies)}
                  >
                    {showReplies ? '收起' : `查看 ${comment.replies.length} 則回覆`}
                  </Button>
                )}
              </Box>
            </Box>
            
            <IconButton size="small" onClick={handleMenuOpen}>
              <MoreVertIcon />
            </IconButton>
            
            <Menu
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={handleMenuClose}
            >
              {canEdit && (
                <MenuItem onClick={() => { onEdit(comment); handleMenuClose(); }}>
                  <EditIcon sx={{ mr: 1 }} fontSize="small" />
                  編輯
                </MenuItem>
              )}
              {canDelete && (
                <MenuItem onClick={() => { onDelete(comment._id); handleMenuClose(); }}>
                  <DeleteIcon sx={{ mr: 1 }} fontSize="small" />
                  刪除
                </MenuItem>
              )}
              {!isOwner && (
                <MenuItem onClick={() => { onReport(comment._id); handleMenuClose(); }}>
                  <ReportIcon sx={{ mr: 1 }} fontSize="small" />
                  舉報
                </MenuItem>
              )}
            </Menu>
          </Box>
        </CardContent>
      </Card>
      
      {/* 回覆列表 */}
      <Collapse in={showReplies}>
        <Box sx={{ mt: 1 }}>
          {comment.replies?.map((reply) => (
            <CommentItem
              key={reply._id}
              comment={reply}
              onReply={onReply}
              onEdit={onEdit}
              onDelete={onDelete}
              onReport={onReport}
              level={level + 1}
            />
          ))}
        </Box>
      </Collapse>
    </Box>
  );
};

const CommentSection: React.FC<CommentSectionProps> = ({
  petId,
  allowComments = true
}) => {
  const { user } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [editingComment, setEditingComment] = useState<Comment | null>(null);
  const [editContent, setEditContent] = useState('');
  const [reportDialog, setReportDialog] = useState<{
    open: boolean;
    commentId: string;
    reason: string;
  }>({ open: false, commentId: '', reason: '' });
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  // 載入留言
  const loadComments = async (pageNum = 1, append = false) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await commentService.getCommentsByPet(petId, {
        page: pageNum,
        limit: 20,
        sortBy: 'createdAt',
        sortOrder: 'desc'
      });
      
      if (append) {
        setComments(prev => [...prev, ...response.comments]);
      } else {
        setComments(response.comments);
      }
      
      setHasMore(pageNum < response.totalPages);
      setPage(pageNum);
    } catch (error: any) {
      setError(error.message || '載入留言失敗');
    } finally {
      setLoading(false);
    }
  };

  // 提交新留言
  const handleSubmitComment = async () => {
    if (!newComment.trim() || !user) return;
    
    try {
      setSubmitting(true);
      setError(null);
      
      await commentService.createComment({
        petId,
        content: newComment.trim()
      });
      
      setNewComment('');
      await loadComments(1); // 重新載入第一頁
    } catch (error: any) {
      setError(error.message || '發表留言失敗');
    } finally {
      setSubmitting(false);
    }
  };

  // 提交回覆
  const handleSubmitReply = async () => {
    if (!replyContent.trim() || !replyTo || !user) return;
    
    try {
      setSubmitting(true);
      setError(null);
      
      await commentService.createComment({
        petId,
        content: replyContent.trim(),
        parentId: replyTo
      });
      
      setReplyContent('');
      setReplyTo(null);
      await loadComments(1); // 重新載入第一頁
    } catch (error: any) {
      setError(error.message || '回覆失敗');
    } finally {
      setSubmitting(false);
    }
  };

  // 編輯留言
  const handleEditComment = async () => {
    if (!editContent.trim() || !editingComment) return;
    
    try {
      setSubmitting(true);
      setError(null);
      
      await commentService.updateComment(editingComment._id, {
        content: editContent.trim()
      });
      
      setEditingComment(null);
      setEditContent('');
      await loadComments(page); // 重新載入當前頁
    } catch (error: any) {
      setError(error.message || '編輯留言失敗');
    } finally {
      setSubmitting(false);
    }
  };

  // 刪除留言
  const handleDeleteComment = async (commentId: string) => {
    if (!window.confirm('確定要刪除這則留言嗎？')) return;
    
    try {
      setError(null);
      await commentService.deleteComment(commentId);
      await loadComments(page); // 重新載入當前頁
    } catch (error: any) {
      setError(error.message || '刪除留言失敗');
    }
  };

  // 舉報留言
  const handleReportComment = async () => {
    if (!reportDialog.reason.trim()) return;
    
    try {
      setError(null);
      await commentService.reportComment(reportDialog.commentId, reportDialog.reason.trim());
      setReportDialog({ open: false, commentId: '', reason: '' });
      // 可以顯示成功訊息
    } catch (error: any) {
      setError(error.message || '舉報失敗');
    }
  };

  // 載入更多留言
  const handleLoadMore = () => {
    if (!loading && hasMore) {
      loadComments(page + 1, true);
    }
  };

  useEffect(() => {
    loadComments();
  }, [petId]);

  if (!allowComments) {
    return (
      <Card>
        <CardContent>
          <Typography variant="body2" color="text.secondary" textAlign="center">
            此寵物的留言功能已關閉
          </Typography>
        </CardContent>
      </Card>
    );
  }

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        留言區
      </Typography>
      
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}
      
      {/* 新留言輸入 */}
      {user && (
        <Card sx={{ mb: 2 }}>
          <CardContent>
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start' }}>
              <Avatar src={user.avatar} alt={user.username} sx={{ width: 32, height: 32 }}>
                {user.username.charAt(0).toUpperCase()}
              </Avatar>
              <Box sx={{ flex: 1 }}>
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  placeholder="寫下您的留言..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  variant="outlined"
                  size="small"
                />
                <Box sx={{ mt: 1, display: 'flex', justifyContent: 'flex-end' }}>
                  <LoadingButton
                    variant="contained"
                    startIcon={<SendIcon />}
                    onClick={handleSubmitComment}
                    loading={submitting}
                    disabled={!newComment.trim()}
                  >
                    發表留言
                  </LoadingButton>
                </Box>
              </Box>
            </Box>
          </CardContent>
        </Card>
      )}
      
      {/* 回覆輸入框 */}
      {replyTo && user && (
        <Card sx={{ mb: 2, bgcolor: 'action.hover' }}>
          <CardContent>
            <Typography variant="subtitle2" gutterBottom>
              回覆留言
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start' }}>
              <Avatar src={user.avatar} alt={user.username} sx={{ width: 32, height: 32 }}>
                {user.username.charAt(0).toUpperCase()}
              </Avatar>
              <Box sx={{ flex: 1 }}>
                <TextField
                  fullWidth
                  multiline
                  rows={2}
                  placeholder="寫下您的回覆..."
                  value={replyContent}
                  onChange={(e) => setReplyContent(e.target.value)}
                  variant="outlined"
                  size="small"
                />
                <Box sx={{ mt: 1, display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                  <Button onClick={() => { setReplyTo(null); setReplyContent(''); }}>
                    取消
                  </Button>
                  <LoadingButton
                    variant="contained"
                    startIcon={<SendIcon />}
                    onClick={handleSubmitReply}
                    loading={submitting}
                    disabled={!replyContent.trim()}
                  >
                    回覆
                  </LoadingButton>
                </Box>
              </Box>
            </Box>
          </CardContent>
        </Card>
      )}
      
      {/* 留言列表 */}
      <Stack spacing={1}>
        {comments.map((comment) => (
          <CommentItem
            key={comment._id}
            comment={comment}
            onReply={setReplyTo}
            onEdit={(comment) => {
              setEditingComment(comment);
              setEditContent(comment.content);
            }}
            onDelete={handleDeleteComment}
            onReport={(commentId) => setReportDialog({ open: true, commentId, reason: '' })}
          />
        ))}
      </Stack>
      
      {/* 載入更多按鈕 */}
      {hasMore && (
        <Box sx={{ textAlign: 'center', mt: 2 }}>
          <LoadingButton
            variant="outlined"
            onClick={handleLoadMore}
            loading={loading}
          >
            載入更多留言
          </LoadingButton>
        </Box>
      )}
      
      {comments.length === 0 && !loading && (
        <Card>
          <CardContent>
            <Typography variant="body2" color="text.secondary" textAlign="center">
              還沒有留言，成為第一個留言的人吧！
            </Typography>
          </CardContent>
        </Card>
      )}
      
      {/* 編輯留言對話框 */}
      <Dialog
        open={Boolean(editingComment)}
        onClose={() => { setEditingComment(null); setEditContent(''); }}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>編輯留言</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            multiline
            rows={4}
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            variant="outlined"
            margin="normal"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => { setEditingComment(null); setEditContent(''); }}>
            取消
          </Button>
          <LoadingButton
            variant="contained"
            onClick={handleEditComment}
            loading={submitting}
            disabled={!editContent.trim()}
          >
            儲存
          </LoadingButton>
        </DialogActions>
      </Dialog>
      
      {/* 舉報對話框 */}
      <Dialog
        open={reportDialog.open}
        onClose={() => setReportDialog({ open: false, commentId: '', reason: '' })}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>舉報留言</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            請說明舉報原因：
          </Typography>
          <TextField
            fullWidth
            multiline
            rows={3}
            value={reportDialog.reason}
            onChange={(e) => setReportDialog(prev => ({ ...prev, reason: e.target.value }))}
            variant="outlined"
            margin="normal"
            placeholder="請詳細說明舉報原因..."
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setReportDialog({ open: false, commentId: '', reason: '' })}>
            取消
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleReportComment}
            disabled={!reportDialog.reason.trim()}
          >
            提交舉報
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CommentSection;