import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Avatar,
  Rating,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControlLabel,
  Checkbox,
  Grid2 as Grid,
  Alert,
  LinearProgress,
  Stack,
  Paper,
} from '@mui/material';
import { Star as StarIcon, Report as ReportIcon } from '@mui/icons-material';
import { formatDistanceToNow } from 'date-fns';
import { zhTW } from 'date-fns/locale';
import { useAuth } from '../../hooks/useAuth';
import { reviewService } from '../../services/reviewService';
import { LoadingButton } from '@mui/lab';

export interface Review {
  _id: string;
  reviewerId: {
    _id: string;
    username: string;
    avatar?: string;
  };
  revieweeId: {
    _id: string;
    username: string;
    avatar?: string;
  };
  petId?: {
    _id: string;
    name: string;
    images: string[];
  };
  conversationId?: string;
  rating: number;
  content: string;
  tags: string[];
  isAnonymous: boolean;
  isDeleted: boolean;
  reportCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface ReviewStats {
  userId: string;
  totalReviews: number;
  averageRating: number;
  ratingDistribution: {
    1: number;
    2: number;
    3: number;
    4: number;
    5: number;
  };
  commonTags: Array<{
    tag: string;
    count: number;
  }>;
}

interface ReviewSectionProps {
  userId: string;
  allowReview?: boolean;
  showWriteReview?: boolean;
  petId?: string;
  conversationId?: string;
}

const REVIEW_TAGS = [
  '友善',
  '準時',
  '負責任',
  '溝通良好',
  '愛護動物',
  '值得信賴',
  '熱心助人',
  '專業',
  '耐心',
  '細心',
];

const ReviewSection: React.FC<ReviewSectionProps> = ({
  userId,
  allowReview = true,
  showWriteReview = true,
  petId,
  conversationId,
}) => {
  const { user } = useAuth();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [stats, setStats] = useState<ReviewStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [writeDialogOpen, setWriteDialogOpen] = useState(false);
  const [reportDialog, setReportDialog] = useState<{
    open: boolean;
    reviewId: string;
    reason: string;
  }>({ open: false, reviewId: '', reason: '' });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  // 評價表單狀態
  const [newReview, setNewReview] = useState({
    rating: 0,
    content: '',
    tags: [] as string[],
    isAnonymous: false,
  });

  const [canReview, setCanReview] = useState(false);

  // 載入評價列表
  const loadReviews = async (pageNum = 1, append = false) => {
    try {
      setLoading(true);
      setError(null);

      const response = await reviewService.getUserReviews(userId, {
        page: pageNum,
        limit: 10,
        sortBy: 'createdAt',
        sortOrder: 'desc',
      });

      if (append) {
        setReviews(prev => [...prev, ...response.reviews]);
      } else {
        setReviews(response.reviews);
      }

      setHasMore(pageNum < response.totalPages);
      setPage(pageNum);
    } catch (error: any) {
      setError(error.message || '載入評價失敗');
    } finally {
      setLoading(false);
    }
  };

  // 載入評價統計
  const loadStats = async () => {
    try {
      const statsData = await reviewService.getUserReviewStats(userId);
      setStats(statsData);
    } catch (error: any) {
      console.error('載入評價統計失敗:', error);
    }
  };

  // 檢查是否可以評價
  const checkCanReview = async () => {
    if (!user || user._id === userId) {
      setCanReview(false);
      return;
    }

    try {
      const canReviewResult = await reviewService.canReview(
        userId,
        petId,
        conversationId
      );
      setCanReview(canReviewResult);
    } catch (error: any) {
      setCanReview(false);
    }
  };

  // 提交評價
  const handleSubmitReview = async () => {
    if (!newReview.rating || !newReview.content.trim()) {
      setError('請填寫評分和評價內容');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      const reviewData: any = {
        revieweeId: userId,
        rating: newReview.rating,
        content: newReview.content.trim(),
        tags: newReview.tags,
        isAnonymous: newReview.isAnonymous,
      };

      if (petId) {
        reviewData.petId = petId;
      }

      if (conversationId) {
        reviewData.conversationId = conversationId;
      }

      await reviewService.createReview(reviewData);

      setSuccess('評價提交成功！');
      setWriteDialogOpen(false);
      setNewReview({
        rating: 0,
        content: '',
        tags: [],
        isAnonymous: false,
      });

      // 重新載入數據
      await Promise.all([loadReviews(1), loadStats(), checkCanReview()]);
    } catch (error: any) {
      setError(error.message || '提交評價失敗');
    } finally {
      setSubmitting(false);
    }
  };

  // 舉報評價
  const handleReportReview = async () => {
    if (!reportDialog.reason.trim()) return;

    try {
      setError(null);
      await reviewService.reportReview(
        reportDialog.reviewId,
        reportDialog.reason.trim()
      );
      setReportDialog({ open: false, reviewId: '', reason: '' });
      setSuccess('舉報已提交，我們會盡快處理');
    } catch (error: any) {
      setError(error.message || '舉報失敗');
    }
  };

  // 載入更多評價
  const handleLoadMore = () => {
    if (!loading && hasMore) {
      loadReviews(page + 1, true);
    }
  };

  // 處理標籤選擇
  const handleTagToggle = (tag: string) => {
    setNewReview(prev => ({
      ...prev,
      tags: prev.tags.includes(tag)
        ? prev.tags.filter(t => t !== tag)
        : [...prev.tags, tag],
    }));
  };

  useEffect(() => {
    loadReviews();
    loadStats();
    if (user) {
      checkCanReview();
    }
    return undefined;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, user]);

  // 清除成功訊息
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(null), 3000);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [success]);

  return (
    <Box>
      <Typography variant='h6' gutterBottom>
        用戶評價
      </Typography>

      {error && (
        <Alert severity='error' sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert
          severity='success'
          sx={{ mb: 2 }}
          onClose={() => setSuccess(null)}
        >
          {success}
        </Alert>
      )}

      {/* 評價統計 */}
      {stats && (
        <Card sx={{ mb: 2 }}>
          <CardContent>
            <Grid container spacing={2} alignItems='center'>
              <Grid xs={12} sm={4}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant='h4' color='primary'>
                    {stats.averageRating.toFixed(1)}
                  </Typography>
                  <Rating
                    value={stats.averageRating}
                    readOnly
                    precision={0.1}
                  />
                  <Typography variant='body2' color='text.secondary'>
                    基於 {stats.totalReviews} 則評價
                  </Typography>
                </Box>
              </Grid>

              <Grid xs={12} sm={4}>
                <Stack spacing={1}>
                  {[5, 4, 3, 2, 1].map(rating => (
                    <Box
                      key={rating}
                      sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
                    >
                      <Typography variant='body2' sx={{ minWidth: '20px' }}>
                        {rating}
                      </Typography>
                      <StarIcon fontSize='small' color='primary' />
                      <LinearProgress
                        variant='determinate'
                        value={
                          (stats.ratingDistribution[
                            rating as keyof typeof stats.ratingDistribution
                          ] /
                            stats.totalReviews) *
                          100
                        }
                        sx={{ flex: 1, height: 6, borderRadius: 3 }}
                      />
                      <Typography variant='body2' sx={{ minWidth: '30px' }}>
                        {
                          stats.ratingDistribution[
                            rating as keyof typeof stats.ratingDistribution
                          ]
                        }
                      </Typography>
                    </Box>
                  ))}
                </Stack>
              </Grid>

              <Grid xs={12} sm={4}>
                <Typography variant='subtitle2' gutterBottom>
                  常見標籤
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {stats.commonTags.slice(0, 6).map(tagData => (
                    <Chip
                      key={tagData.tag}
                      label={`${tagData.tag} (${tagData.count})`}
                      size='small'
                      variant='outlined'
                    />
                  ))}
                </Box>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      )}

      {/* 寫評價按鈕 */}
      {showWriteReview && canReview && allowReview && (
        <Box sx={{ mb: 2 }}>
          <Button
            variant='contained'
            startIcon={<StarIcon />}
            onClick={() => setWriteDialogOpen(true)}
          >
            寫評價
          </Button>
        </Box>
      )}

      {/* 評價列表 */}
      <Stack spacing={2}>
        {reviews.map(review => (
          <Card key={review._id} variant='outlined'>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                <Avatar
                  src={
                    review.isAnonymous ? undefined : review.reviewerId.avatar
                  }
                  alt={
                    review.isAnonymous ? '匿名用戶' : review.reviewerId.username
                  }
                  sx={{ width: 40, height: 40 }}
                >
                  {review.isAnonymous
                    ? '?'
                    : review.reviewerId.username.charAt(0).toUpperCase()}
                </Avatar>

                <Box sx={{ flex: 1 }}>
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1,
                      mb: 1,
                    }}
                  >
                    <Typography variant='subtitle2'>
                      {review.isAnonymous
                        ? '匿名用戶'
                        : review.reviewerId.username}
                    </Typography>
                    <Rating value={review.rating} readOnly size='small' />
                    <Typography variant='caption' color='text.secondary'>
                      {formatDistanceToNow(new Date(review.createdAt), {
                        addSuffix: true,
                        locale: zhTW,
                      })}
                    </Typography>
                  </Box>

                  {review.petId && (
                    <Typography
                      variant='caption'
                      color='text.secondary'
                      sx={{ display: 'block', mb: 1 }}
                    >
                      關於寵物：{review.petId.name}
                    </Typography>
                  )}

                  <Typography
                    variant='body2'
                    sx={{ mb: 1, whiteSpace: 'pre-wrap' }}
                  >
                    {review.content}
                  </Typography>

                  {review.tags.length > 0 && (
                    <Box
                      sx={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: 0.5,
                        mb: 1,
                      }}
                    >
                      {review.tags.map(tag => (
                        <Chip
                          key={tag}
                          label={tag}
                          size='small'
                          variant='outlined'
                        />
                      ))}
                    </Box>
                  )}

                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {user && user._id !== review.reviewerId._id && (
                      <Button
                        size='small'
                        startIcon={<ReportIcon />}
                        onClick={() =>
                          setReportDialog({
                            open: true,
                            reviewId: review._id,
                            reason: '',
                          })
                        }
                      >
                        舉報
                      </Button>
                    )}
                  </Box>
                </Box>
              </Box>
            </CardContent>
          </Card>
        ))}
      </Stack>

      {/* 載入更多按鈕 */}
      {hasMore && (
        <Box sx={{ textAlign: 'center', mt: 2 }}>
          <LoadingButton
            variant='outlined'
            onClick={handleLoadMore}
            loading={loading}
          >
            載入更多評價
          </LoadingButton>
        </Box>
      )}

      {reviews.length === 0 && !loading && (
        <Paper sx={{ p: 3, textAlign: 'center' }}>
          <Typography variant='body2' color='text.secondary'>
            還沒有評價
          </Typography>
        </Paper>
      )}

      {/* 寫評價對話框 */}
      <Dialog
        open={writeDialogOpen}
        onClose={() => setWriteDialogOpen(false)}
        maxWidth='sm'
        fullWidth
      >
        <DialogTitle>寫評價</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1 }}>
            <Typography variant='subtitle2' gutterBottom>
              評分 *
            </Typography>
            <Rating
              value={newReview.rating}
              onChange={(_, value) =>
                setNewReview(prev => ({ ...prev, rating: value || 0 }))
              }
              size='large'
              sx={{ mb: 2 }}
            />

            <Typography variant='subtitle2' gutterBottom>
              評價內容 *
            </Typography>
            <TextField
              fullWidth
              multiline
              rows={4}
              placeholder='請分享您的體驗...'
              value={newReview.content}
              onChange={e =>
                setNewReview(prev => ({ ...prev, content: e.target.value }))
              }
              variant='outlined'
              sx={{ mb: 2 }}
            />

            <Typography variant='subtitle2' gutterBottom>
              標籤（可選）
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
              {REVIEW_TAGS.map(tag => (
                <Chip
                  key={tag}
                  label={tag}
                  clickable
                  color={newReview.tags.includes(tag) ? 'primary' : 'default'}
                  variant={newReview.tags.includes(tag) ? 'filled' : 'outlined'}
                  onClick={() => handleTagToggle(tag)}
                />
              ))}
            </Box>

            <FormControlLabel
              control={
                <Checkbox
                  checked={newReview.isAnonymous}
                  onChange={e =>
                    setNewReview(prev => ({
                      ...prev,
                      isAnonymous: e.target.checked,
                    }))
                  }
                />
              }
              label='匿名評價'
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setWriteDialogOpen(false)}>取消</Button>
          <LoadingButton
            variant='contained'
            onClick={handleSubmitReview}
            loading={submitting}
            disabled={!newReview.rating || !newReview.content.trim()}
          >
            提交評價
          </LoadingButton>
        </DialogActions>
      </Dialog>

      {/* 舉報對話框 */}
      <Dialog
        open={reportDialog.open}
        onClose={() =>
          setReportDialog({ open: false, reviewId: '', reason: '' })
        }
        maxWidth='sm'
        fullWidth
      >
        <DialogTitle>舉報評價</DialogTitle>
        <DialogContent>
          <Typography variant='body2' color='text.secondary' gutterBottom>
            請說明舉報原因：
          </Typography>
          <TextField
            fullWidth
            multiline
            rows={3}
            value={reportDialog.reason}
            onChange={e =>
              setReportDialog(prev => ({ ...prev, reason: e.target.value }))
            }
            variant='outlined'
            margin='normal'
            placeholder='請詳細說明舉報原因...'
          />
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() =>
              setReportDialog({ open: false, reviewId: '', reason: '' })
            }
          >
            取消
          </Button>
          <Button
            variant='contained'
            color='error'
            onClick={handleReportReview}
            disabled={!reportDialog.reason.trim()}
          >
            提交舉報
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ReviewSection;
