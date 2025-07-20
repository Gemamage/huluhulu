import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Grid2 as Grid,
  Pagination,
  Alert,
  CircularProgress,
  Tabs,
  Tab,
  Avatar,
  IconButton,
  Tooltip,
  Badge,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Divider,
  FormControlLabel,
  Checkbox,
} from '@mui/material';
import {
  Report as ReportIcon,
  Visibility,
  Delete,
  FilterList,
  Refresh,
  CheckCircle,
  Cancel,
  Warning,
  Info,
  Upload,
} from '@mui/icons-material';
import { useAuth } from '../../contexts/auth-context';
import reportService, {
  Report,
  CreateReportRequest,
  GetReportsQuery,
  ReportSummary,
} from '../../services/reportService';

interface ReportCenterProps {
  isAdmin?: boolean;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role='tabpanel'
      hidden={value !== index}
      id={`report-tabpanel-${index}`}
      aria-labelledby={`report-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const ReportCenter: React.FC<ReportCenterProps> = ({ isAdmin = false }) => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState(0);
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [summary, setSummary] = useState<ReportSummary | null>(null);

  // 對話框狀態
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [batchMode, setBatchMode] = useState(false);
  const [selectedReports, setSelectedReports] = useState<string[]>([]);

  // 表單狀態
  const [reportForm, setReportForm] = useState<CreateReportRequest>({
    contentType: 'user',
    reportType: 'spam',
    reason: '',
    description: '',
    evidence: [],
  });

  // 篩選狀態
  const [filters, setFilters] = useState<GetReportsQuery>({
    page: 1,
    limit: 10,
    sortBy: 'createdAt',
    sortOrder: 'desc',
  });

  const [filterDialogOpen, setFilterDialogOpen] = useState(false);

  useEffect(() => {
    loadReports();
    if (isAdmin) {
      loadSummary();
    }
  }, [activeTab, currentPage, filters]);

  const loadReports = async () => {
    try {
      setLoading(true);
      setError(null);

      const query = { ...filters, page: currentPage };
      let response;

      if (isAdmin) {
        response = await reportService.getAllReports(query);
      } else {
        response = await reportService.getMyReports(query);
      }

      setReports(response.reports);
      setTotalPages(response.totalPages);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadSummary = async () => {
    try {
      const summaryData = await reportService.getReportSummary();
      setSummary(summaryData);
    } catch (err: any) {
      console.error('載入摘要失敗:', err);
    }
  };

  const handleCreateReport = async () => {
    try {
      setLoading(true);
      setError(null);

      await reportService.createReport(reportForm);
      setSuccess('舉報已提交，我們會盡快處理');
      setCreateDialogOpen(false);
      resetReportForm();
      loadReports();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateReportStatus = async (
    reportId: string,
    status: string,
    adminNotes?: string,
    resolution?: string
  ) => {
    try {
      setLoading(true);
      setError(null);

      await reportService.updateReportStatus(reportId, {
        status: status as any,
        adminNotes,
        resolution,
      });

      setSuccess('舉報狀態已更新');
      loadReports();
      if (isAdmin) {
        loadSummary();
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleBatchUpdate = async (status: string) => {
    try {
      setLoading(true);
      setError(null);

      await reportService.batchUpdateReports(selectedReports, {
        status: status as any,
      });

      setSuccess(`已批量更新 ${selectedReports.length} 個舉報`);
      setSelectedReports([]);
      setBatchMode(false);
      loadReports();
      if (isAdmin) {
        loadSummary();
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAutoProcess = async () => {
    try {
      setLoading(true);
      setError(null);

      const result = await reportService.autoProcessReports();
      setSuccess(
        `自動處理完成：處理了 ${result.processed} 個舉報，解決 ${result.resolved} 個，駁回 ${result.dismissed} 個`
      );
      loadReports();
      loadSummary();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteReport = async (reportId: string) => {
    try {
      setLoading(true);
      setError(null);

      await reportService.deleteReport(reportId);
      setSuccess('舉報已刪除');
      loadReports();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const resetReportForm = () => {
    setReportForm({
      contentType: 'user',
      reportType: 'spam',
      reason: '',
      description: '',
      evidence: [],
    });
  };

  const getStatusColor = (status: string) => {
    const statusOptions = reportService.getStatusOptions();
    return (
      statusOptions.find(option => option.value === status)?.color || 'default'
    );
  };

  const getPriorityColor = (priority: string) => {
    const priorityOptions = reportService.getPriorityOptions();
    return (
      priorityOptions.find(option => option.value === priority)?.color ||
      'default'
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('zh-TW');
  };

  const renderSummaryCards = () => {
    if (!summary || !isAdmin) return null;

    return (
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color='textSecondary' gutterBottom>
                總舉報數
              </Typography>
              <Typography variant='h4'>{summary.totalReports}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color='textSecondary' gutterBottom>
                待處理
              </Typography>
              <Typography variant='h4' color='warning.main'>
                {summary.pendingReports}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color='textSecondary' gutterBottom>
                已解決
              </Typography>
              <Typography variant='h4' color='success.main'>
                {summary.resolvedReports}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color='textSecondary' gutterBottom>
                高優先級
              </Typography>
              <Typography variant='h4' color='error.main'>
                {summary.highPriorityReports}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    );
  };

  const renderReportList = () => {
    if (loading) {
      return (
        <Box display='flex' justifyContent='center' p={3}>
          <CircularProgress />
        </Box>
      );
    }

    if (reports.length === 0) {
      return (
        <Paper sx={{ p: 3, textAlign: 'center' }}>
          <Typography color='textSecondary'>
            {isAdmin ? '目前沒有舉報' : '您還沒有提交任何舉報'}
          </Typography>
        </Paper>
      );
    }

    return (
      <List>
        {reports.map((report, index) => (
          <React.Fragment key={report._id}>
            <ListItem
              alignItems='flex-start'
              sx={{
                bgcolor: selectedReports.includes(report._id)
                  ? 'action.selected'
                  : 'inherit',
              }}
            >
              {batchMode && (
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={selectedReports.includes(report._id)}
                      onChange={e => {
                        if (e.target.checked) {
                          setSelectedReports([...selectedReports, report._id]);
                        } else {
                          setSelectedReports(
                            selectedReports.filter(id => id !== report._id)
                          );
                        }
                      }}
                    />
                  }
                  label=''
                  sx={{ mr: 1 }}
                />
              )}
              <ListItemAvatar>
                <Avatar src={report.reporterId.avatar}>
                  {report.reporterId.username.charAt(0).toUpperCase()}
                </Avatar>
              </ListItemAvatar>
              <ListItemText
                primary={
                  <Box display='flex' alignItems='center' gap={1}>
                    <Typography variant='subtitle1'>{report.reason}</Typography>
                    <Chip
                      label={
                        reportService
                          .getReportTypes()
                          .find(t => t.value === report.reportType)?.label
                      }
                      size='small'
                      variant='outlined'
                    />
                    <Chip
                      label={
                        reportService
                          .getStatusOptions()
                          .find(s => s.value === report.status)?.label
                      }
                      size='small'
                      color={getStatusColor(report.status) as any}
                    />
                    <Chip
                      label={
                        reportService
                          .getPriorityOptions()
                          .find(p => p.value === report.priority)?.label
                      }
                      size='small'
                      color={getPriorityColor(report.priority) as any}
                    />
                  </Box>
                }
                secondary={
                  <Box>
                    <Typography variant='body2' color='textSecondary'>
                      舉報者: {report.reporterId.username}
                    </Typography>
                    {report.reportedUserId && (
                      <Typography variant='body2' color='textSecondary'>
                        被舉報用戶: {report.reportedUserId.username}
                      </Typography>
                    )}
                    <Typography variant='body2' color='textSecondary'>
                      內容類型:{' '}
                      {
                        reportService
                          .getContentTypes()
                          .find(c => c.value === report.contentType)?.label
                      }
                    </Typography>
                    <Typography variant='body2' color='textSecondary'>
                      提交時間: {formatDate(report.createdAt)}
                    </Typography>
                    {report.description && (
                      <Typography variant='body2' sx={{ mt: 1 }}>
                        {report.description}
                      </Typography>
                    )}
                  </Box>
                }
              />
              <Box display='flex' flexDirection='column' gap={1}>
                <Tooltip title='查看詳情'>
                  <IconButton
                    onClick={() => {
                      setSelectedReport(report);
                      setDetailDialogOpen(true);
                    }}
                  >
                    <Visibility />
                  </IconButton>
                </Tooltip>
                {!isAdmin && report.status === 'pending' && (
                  <Tooltip title='刪除舉報'>
                    <IconButton
                      onClick={() => handleDeleteReport(report._id)}
                      color='error'
                    >
                      <Delete />
                    </IconButton>
                  </Tooltip>
                )}
              </Box>
            </ListItem>
            {index < reports.length - 1 && <Divider />}
          </React.Fragment>
        ))}
      </List>
    );
  };

  return (
    <Box>
      {/* 錯誤和成功訊息 */}
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

      {/* 摘要卡片 */}
      {renderSummaryCards()}

      {/* 標籤頁 */}
      <Paper sx={{ mb: 2 }}>
        <Tabs
          value={activeTab}
          onChange={(e, newValue) => setActiveTab(newValue)}
          variant='fullWidth'
        >
          <Tab label={isAdmin ? '所有舉報' : '我的舉報'} />
          {isAdmin && <Tab label='最近舉報' />}
        </Tabs>
      </Paper>

      {/* 工具列 */}
      <Box
        display='flex'
        justifyContent='space-between'
        alignItems='center'
        mb={2}
      >
        <Box display='flex' gap={1}>
          {!isAdmin && (
            <Button
              variant='contained'
              startIcon={<ReportIcon />}
              onClick={() => setCreateDialogOpen(true)}
            >
              提交舉報
            </Button>
          )}
          <Button
            variant='outlined'
            startIcon={<FilterList />}
            onClick={() => setFilterDialogOpen(true)}
          >
            篩選
          </Button>
          <Button
            variant='outlined'
            startIcon={<Refresh />}
            onClick={loadReports}
          >
            重新整理
          </Button>
        </Box>
        {isAdmin && (
          <Box display='flex' gap={1}>
            <Button
              variant={batchMode ? 'contained' : 'outlined'}
              onClick={() => {
                setBatchMode(!batchMode);
                setSelectedReports([]);
              }}
            >
              批量操作
            </Button>
            {batchMode && selectedReports.length > 0 && (
              <>
                <Button
                  variant='outlined'
                  color='success'
                  onClick={() => handleBatchUpdate('resolved')}
                >
                  批量解決
                </Button>
                <Button
                  variant='outlined'
                  color='error'
                  onClick={() => handleBatchUpdate('dismissed')}
                >
                  批量駁回
                </Button>
              </>
            )}
            <Button
              variant='outlined'
              color='primary'
              onClick={handleAutoProcess}
            >
              自動處理
            </Button>
          </Box>
        )}
      </Box>

      {/* 標籤頁內容 */}
      <TabPanel value={activeTab} index={0}>
        {renderReportList()}
      </TabPanel>
      {isAdmin && (
        <TabPanel value={activeTab} index={1}>
          {summary?.recentReports && (
            <List>
              {summary.recentReports.map((report, index) => (
                <React.Fragment key={report._id}>
                  <ListItem alignItems='flex-start'>
                    <ListItemAvatar>
                      <Avatar src={report.reporterId.avatar || ''}>
                        {report.reporterId.username.charAt(0).toUpperCase()}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={report.reason}
                      secondary={
                        <Typography variant='body2' color='textSecondary'>
                          {formatDate(report.createdAt)}
                        </Typography>
                      }
                    />
                  </ListItem>
                  {index < summary.recentReports.length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </List>
          )}
        </TabPanel>
      )}

      {/* 分頁 */}
      {totalPages > 1 && (
        <Box display='flex' justifyContent='center' mt={3}>
          <Pagination
            count={totalPages}
            page={currentPage}
            onChange={(_, page) => setCurrentPage(page)}
            color='primary'
          />
        </Box>
      )}

      {/* 創建舉報對話框 */}
      <Dialog
        open={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
        maxWidth='md'
        fullWidth
      >
        <DialogTitle>提交舉報</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>內容類型</InputLabel>
                <Select
                  value={reportForm.contentType}
                  onChange={e =>
                    setReportForm({
                      ...reportForm,
                      contentType: e.target.value as any,
                    })
                  }
                >
                  {reportService.getContentTypes().map(type => (
                    <MenuItem key={type.value} value={type.value}>
                      {type.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>舉報類型</InputLabel>
                <Select
                  value={reportForm.reportType}
                  onChange={e =>
                    setReportForm({
                      ...reportForm,
                      reportType: e.target.value as any,
                    })
                  }
                >
                  {reportService.getReportTypes().map(type => (
                    <MenuItem key={type.value} value={type.value}>
                      {type.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid xs={12}>
              <TextField
                fullWidth
                label='舉報原因'
                value={reportForm.reason}
                onChange={e =>
                  setReportForm({
                    ...reportForm,
                    reason: e.target.value,
                  })
                }
                required
              />
            </Grid>
            <Grid xs={12}>
              <TextField
                fullWidth
                label='詳細描述'
                value={reportForm.description}
                onChange={e =>
                  setReportForm({
                    ...reportForm,
                    description: e.target.value,
                  })
                }
                multiline
                rows={4}
              />
            </Grid>
            {reportForm.contentType === 'user' && (
              <Grid xs={12}>
                <TextField
                  fullWidth
                  label='被舉報用戶ID'
                  value={reportForm.reportedUserId || ''}
                  onChange={e =>
                    setReportForm({
                      ...reportForm,
                      reportedUserId: e.target.value,
                    })
                  }
                  required
                />
              </Grid>
            )}
            {reportForm.contentType !== 'user' && (
              <Grid xs={12}>
                <TextField
                  fullWidth
                  label='內容ID'
                  value={reportForm.contentId || ''}
                  onChange={e =>
                    setReportForm({
                      ...reportForm,
                      contentId: e.target.value,
                    })
                  }
                  required
                />
              </Grid>
            )}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateDialogOpen(false)}>取消</Button>
          <Button
            onClick={handleCreateReport}
            variant='contained'
            disabled={!reportForm.reason || loading}
          >
            提交舉報
          </Button>
        </DialogActions>
      </Dialog>

      {/* 舉報詳情對話框 */}
      <Dialog
        open={detailDialogOpen}
        onClose={() => setDetailDialogOpen(false)}
        maxWidth='md'
        fullWidth
      >
        <DialogTitle>舉報詳情</DialogTitle>
        <DialogContent>
          {selectedReport && (
            <Box>
              <Grid container spacing={2}>
                <Grid xs={12} sm={6}>
                  <Typography variant='subtitle2' gutterBottom>
                    舉報者
                  </Typography>
                  <Box display='flex' alignItems='center' gap={1}>
                    <Avatar
                      src={selectedReport.reporterId.avatar || ''}
                      sx={{ width: 32, height: 32 }}
                    />
                    <Typography>
                      {selectedReport.reporterId.username}
                    </Typography>
                  </Box>
                </Grid>
                {selectedReport.reportedUserId && (
                  <Grid xs={12} sm={6}>
                    <Typography variant='subtitle2' gutterBottom>
                      被舉報用戶
                    </Typography>
                    <Box display='flex' alignItems='center' gap={1}>
                      <Avatar
                        src={selectedReport.reportedUserId.avatar || ''}
                        sx={{ width: 32, height: 32 }}
                      />
                      <Typography>
                        {selectedReport.reportedUserId.username}
                      </Typography>
                    </Box>
                  </Grid>
                )}
                <Grid xs={12} sm={6}>
                  <Typography variant='subtitle2' gutterBottom>
                    內容類型
                  </Typography>
                  <Typography>
                    {
                      reportService
                        .getContentTypes()
                        .find(c => c.value === selectedReport.contentType)
                        ?.label
                    }
                  </Typography>
                </Grid>
                <Grid xs={12} sm={6}>
                  <Typography variant='subtitle2' gutterBottom>
                    舉報類型
                  </Typography>
                  <Typography>
                    {
                      reportService
                        .getReportTypes()
                        .find(t => t.value === selectedReport.reportType)?.label
                    }
                  </Typography>
                </Grid>
                <Grid xs={12} sm={6}>
                  <Typography variant='subtitle2' gutterBottom>
                    狀態
                  </Typography>
                  <Chip
                    label={
                      reportService
                        .getStatusOptions()
                        .find(s => s.value === selectedReport.status)?.label
                    }
                    color={getStatusColor(selectedReport.status) as any}
                  />
                </Grid>
                <Grid xs={12} sm={6}>
                  <Typography variant='subtitle2' gutterBottom>
                    優先級
                  </Typography>
                  <Chip
                    label={
                      reportService
                        .getPriorityOptions()
                        .find(p => p.value === selectedReport.priority)?.label
                    }
                    color={getPriorityColor(selectedReport.priority) as any}
                  />
                </Grid>
                <Grid xs={12}>
                  <Typography variant='subtitle2' gutterBottom>
                    舉報原因
                  </Typography>
                  <Typography>{selectedReport.reason}</Typography>
                </Grid>
                {selectedReport.description && (
                  <Grid xs={12}>
                    <Typography variant='subtitle2' gutterBottom>
                      詳細描述
                    </Typography>
                    <Typography>{selectedReport.description}</Typography>
                  </Grid>
                )}
                {selectedReport.adminNotes && (
                  <Grid xs={12}>
                    <Typography variant='subtitle2' gutterBottom>
                      管理員備註
                    </Typography>
                    <Typography>{selectedReport.adminNotes}</Typography>
                  </Grid>
                )}
                {selectedReport.resolution && (
                  <Grid xs={12}>
                    <Typography variant='subtitle2' gutterBottom>
                      處理結果
                    </Typography>
                    <Typography>{selectedReport.resolution}</Typography>
                  </Grid>
                )}
                <Grid xs={12} sm={6}>
                  <Typography variant='subtitle2' gutterBottom>
                    提交時間
                  </Typography>
                  <Typography>
                    {formatDate(selectedReport.createdAt)}
                  </Typography>
                </Grid>
                {selectedReport.resolvedAt && (
                  <Grid xs={12} sm={6}>
                    <Typography variant='subtitle2' gutterBottom>
                      處理時間
                    </Typography>
                    <Typography>
                      {formatDate(selectedReport.resolvedAt)}
                    </Typography>
                  </Grid>
                )}
              </Grid>

              {isAdmin && selectedReport.status === 'pending' && (
                <Box mt={3}>
                  <Typography variant='subtitle2' gutterBottom>
                    管理員操作
                  </Typography>
                  <Box display='flex' gap={1}>
                    <Button
                      variant='outlined'
                      color='primary'
                      onClick={() =>
                        handleUpdateReportStatus(
                          selectedReport._id,
                          'investigating',
                          '開始調查此舉報'
                        )
                      }
                    >
                      開始調查
                    </Button>
                    <Button
                      variant='outlined'
                      color='success'
                      onClick={() =>
                        handleUpdateReportStatus(
                          selectedReport._id,
                          'resolved',
                          '舉報已處理完成',
                          '已採取適當措施'
                        )
                      }
                    >
                      標記為已解決
                    </Button>
                    <Button
                      variant='outlined'
                      color='error'
                      onClick={() =>
                        handleUpdateReportStatus(
                          selectedReport._id,
                          'dismissed',
                          '經調查後駁回此舉報',
                          '未發現違規行為'
                        )
                      }
                    >
                      駁回舉報
                    </Button>
                  </Box>
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailDialogOpen(false)}>關閉</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ReportCenter;
