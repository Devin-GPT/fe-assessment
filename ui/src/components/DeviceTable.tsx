import { useEffect, useState, Suspense, useCallback } from 'react';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import { Box, Chip, Typography } from '@mui/material';
import { useMQTTConnection } from '../hooks/useMQTTConnection';
import { DEVICE_TOPICS } from '../types';
import { styled } from '@mui/material/styles';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import TrendingFlatIcon from '@mui/icons-material/TrendingFlat';
import { LoadingScreen } from './LoadingScreen';


const StyledDataGrid = styled(DataGrid)(({ theme }) => ({
  border: 'none',
  backgroundColor: 'white',
  borderRadius: theme.shape.borderRadius,
  boxShadow: theme.shadows[2],
  '& .MuiDataGrid-cell': {
    borderColor: theme.palette.grey[200],
    transition: 'all 0.3s ease-in-out',
  },
  '& .MuiDataGrid-columnHeader': {
    backgroundColor: theme.palette.grey[50],
    borderBottom: `1px solid ${theme.palette.grey[200]}`,
  },
  '& .trend-up': {
    color: theme.palette.success.main,
  },
  '& .trend-down': {
    color: theme.palette.error.main,
  },
  '& .trend-flat': {
    color: theme.palette.grey[500],
  },
  '& .value-change': {
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    transition: 'background-color 0.3s ease-in-out',
  }
}));


// Main component wrapper
const DeviceTableWrapper = () => (
  <Suspense fallback={<LoadingScreen connectionProgress={0} />}>
    <DeviceTable />
  </Suspense>
);

// Add a utility function for conversion
const celsiusToFahrenheit = (celsius: number) => (celsius * 9/5) + 32;

const getTrendIcon = (current: number, previous: number | undefined) => {
  if (!previous) return <TrendingFlatIcon className="trend-flat" />;
  if (current > previous) return <TrendingUpIcon className="trend-up" />;
  if (current < previous) return <TrendingDownIcon className="trend-down" />;
  return <TrendingFlatIcon className="trend-flat" />;
};

const DEVICE_TIMEOUT = 5000;

const DeviceTable: React.FC = () => {
  const { devices, isLoading, connectionStatus, lastUpdate, isPaused, togglePause } = useMQTTConnection();
  const [connectionProgress, setConnectionProgress] = useState(0);
  const [showDashboard, setShowDashboard] = useState(false);

  // Update connection progress based on devices
  useEffect(() => {
    if (isLoading) {
      const connectedDevices = Object.keys(devices).length;
      const progress = Math.min(100, (connectedDevices / DEVICE_TOPICS.length) * 100);
      setConnectionProgress(progress);
      
      // Show dashboard when all devices are connected
      if (connectedDevices === DEVICE_TOPICS.length) {
        const timer = setTimeout(() => {
          setShowDashboard(true);
        }, 1000);
        return () => clearTimeout(timer);
      }
    } else {
      setShowDashboard(true);
    }
  }, [devices, isLoading]);

  const getDeviceStatus = useCallback((deviceTime?: number) => {
    if (connectionStatus === 'error') return 'disconnected';
    if (isPaused) return 'paused';
    if (!deviceTime) return 'inactive';
    const timeSinceUpdate = Date.now() - deviceTime;
    return timeSinceUpdate < DEVICE_TIMEOUT ? 'active' : 'inactive';
  }, [isPaused, connectionStatus]);

  const getStatusColor = useCallback((status: string) => {
    switch (status) {
      case 'active':
        return 'success';
      case 'paused':
        return 'warning';
      case 'disconnected':
        return 'error';
      default:
        return 'default';
    }
  }, []);

  const getConnectionStatus = useCallback(() => {
    if (isPaused) return 'paused';
    return connectionStatus;
  }, [connectionStatus, isPaused]);

  const getConnectionChipColor = useCallback((status: string) => {
    switch (status) {
      case 'connected':
        return 'success';
      case 'paused':
        return 'warning';
      case 'error':
        return 'error';
      default:
        return 'default';
    }
  }, []);

  const columns: GridColDef[] = [
    {
      field: 'id',
      headerName: 'Device ID',
      width: 100,
    },
    {
      field: 'name',
      headerName: 'Name',
      width: 130,
    },
    { 
      field: 'temp',
      headerName: 'Temperature (°C)',
      width: 160,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography>
            {params.row.temp?.toFixed(1)}°C
          </Typography>
          {getTrendIcon(params.row.temp, params.row.prevTemp)}
        </Box>
      )
    },
    {
      field: 'tempF',
      headerName: 'Temperature (°F)',
      width: 160,
      valueGetter: (params) => params.row.temp ? celsiusToFahrenheit(params.row.temp) : null,
      renderCell: (params) => (
        <Typography>
          {params.value?.toFixed(1)}°F
        </Typography>
      )
    },
    { 
      field: 'hum',
      headerName: 'Humidity',
      width: 150,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography>
            {params.row.hum?.toFixed(1)}%
          </Typography>
          {getTrendIcon(params.row.hum, params.row.prevHum)}
        </Box>
      )
    },
    {
      field: 'time',
      headerName: 'Last Update',
      width: 180,
      renderCell: (params) => (
        <Typography>
          {new Date(params.row.time).toLocaleTimeString()}
        </Typography>
      )
    },
    {
      field: 'status',
      headerName: 'Status',
      width: 130,
      renderCell: (params) => {
        const status = getDeviceStatus(params.row.time);
        return (
          <Chip
            label={status}
            color={getStatusColor(status)}
            size="small"
            sx={{
              transition: 'all 0.3s ease-in-out',
              minWidth: 85,
              justifyContent: 'center'
            }}
          />
        );
      },
    }
  ];

  if (isLoading && !showDashboard) {
    return <LoadingScreen connectionProgress={connectionProgress} />;
  }

  return (
    <Box sx={{ height: 600, width: '100%', position: 'relative' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
        <Box>
          <Typography variant="h6" gutterBottom>
            Device Monitoring
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Last updated: {new Date(lastUpdate).toLocaleTimeString()}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Chip
            label={`Status: ${getConnectionStatus()}`}
            color={getConnectionChipColor(getConnectionStatus())}
            sx={{ transition: 'all 0.3s ease-in-out' }}
          />
          <Chip
            label={isPaused ? 'Resume' : 'Pause'}
            onClick={() => togglePause(!isPaused)}
            color={isPaused ? 'warning' : 'primary'}
            clickable
            sx={{ transition: 'all 0.3s ease-in-out' }}
          />
        </Box>
      </Box>
      <StyledDataGrid
        rows={Object.values(devices)}
        columns={columns}
        autoHeight
        disableRowSelectionOnClick
        getRowId={(row) => row.id}
        getCellClassName={(params) => {
          if (params.field === 'temp' || params.field === 'hum') {
            return 'value-change';
          }
          return '';
        }}
        initialState={{
          pagination: { paginationModel: { pageSize: 10 } },
        }}
        pageSizeOptions={[5, 10, 25]}
      />
    </Box>
  );
};

export default DeviceTableWrapper; 