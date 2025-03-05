import { useEffect, useState, Suspense, useCallback } from 'react';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import { Box, CircularProgress, Chip, Alert, Paper, Typography, IconButton, LinearProgress, keyframes } from '@mui/material';
import mqtt from 'mqtt';
import { PlayArrow, Pause, Refresh, TrendingUp, TrendingDown } from '@mui/icons-material';
import { useMQTTConnection } from '../hooks/useMQTTConnection';
import { deviceApi } from '../api/deviceApi';
import { GridContainer, DashboardContainer } from './styled';
import { getDeviceColumns } from './DeviceGridColumns';
import { Fade } from '@mui/material';
import SensorsIcon from '@mui/icons-material/Sensors';
import { DEVICE_TOPICS } from '../types';
import { styled } from '@mui/material/styles';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import TrendingFlatIcon from '@mui/icons-material/TrendingFlat';
import DevicesIcon from '@mui/icons-material/Devices';
import SignalCellularAltIcon from '@mui/icons-material/SignalCellularAlt';

interface DeviceData {
  id: string;
  name: string;
  time?: number;
  temp?: number;
  prevTemp?: number;
  hum?: number;
  prevHum?: number;
  lastUpdated?: number;
}

// Add these keyframes
const pulseAnimation = keyframes`
  0% { opacity: 1; }
  50% { opacity: 0.7; }
  100% { opacity: 1; }
`;

const fadeInAnimation = keyframes`
  0% { background-color: rgba(76, 175, 80, 0.1); }
  100% { background-color: transparent; }
`;

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

const LoadingOverlay = styled(Box)(({ theme }) => ({
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  backgroundColor: 'rgba(255, 255, 255, 0.8)',
  zIndex: 1,
  gap: theme.spacing(2),
}));

const LoadingContainer = styled(Box)(({ theme }) => ({
  width: '100%',
  height: '100vh',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  backgroundColor: theme.palette.background.default,
  gap: theme.spacing(4),
  padding: theme.spacing(3),
}));

const ConnectionCard = styled(Box)(({ theme }) => ({
  backgroundColor: theme.palette.background.paper,
  borderRadius: theme.shape.borderRadius * 2,
  padding: theme.spacing(4),
  width: '100%',
  maxWidth: 600,
  boxShadow: theme.shadows[3],
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(3),
}));

const DeviceStatusGrid = styled(Box)(({ theme }) => ({
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
  gap: theme.spacing(2),
  width: '100%',
}));

// Loading Screen Component
const LoadingScreen = ({ connectionProgress }: { connectionProgress: number }) => {
  const [deviceStatuses, setDeviceStatuses] = useState<Record<string, number>>({});

  useEffect(() => {
    DEVICE_TOPICS.forEach((topic, index) => {
      const delay = index * 500; // Reduced delay between devices
      setTimeout(() => {
        setDeviceStatuses(prev => ({
          ...prev,
          [topic]: Math.min(100, connectionProgress)
        }));
      }, delay);
    });
  }, [connectionProgress]);

  return (
    <LoadingContainer>
      <Box sx={{ textAlign: 'center', mb: 4 }}>
        <Box sx={{
          animation: `${pulseAnimation} 2s infinite`,
          display: 'inline-block',
          mb: 2
        }}>
          <DevicesIcon sx={{ fontSize: 60, color: 'primary.main' }} />
        </Box>
        <Typography variant="h4" gutterBottom color="primary.main" fontWeight="bold">
          IoT Device Monitor
        </Typography>
        <Typography variant="subtitle1" color="text.secondary">
          Initializing System Components
        </Typography>
      </Box>

      <ConnectionCard>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
          <SignalCellularAltIcon color="primary" />
          <Typography variant="h6">
            Establishing MQTT Connection
          </Typography>
        </Box>

        <Box sx={{ mb: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="body2" color="text.secondary">
              Broker Connection
            </Typography>
            <Typography variant="body2" color="primary">
              {connectionProgress}%
            </Typography>
          </Box>
          <LinearProgress 
            variant="determinate" 
            value={connectionProgress}
            sx={{ 
              height: 8, 
              borderRadius: 4,
              backgroundColor: 'rgba(0, 0, 0, 0.05)',
              '& .MuiLinearProgress-bar': {
                borderRadius: 4,
                backgroundImage: 'linear-gradient(45deg, #2196F3 30%, #90CAF9 90%)',
              }
            }}
          />
        </Box>

        <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 2 }}>
          Device Connection Status
        </Typography>

        <DeviceStatusGrid>
          {DEVICE_TOPICS.map((topic, index) => (
            <Box
              key={topic}
              sx={{
                p: 2,
                borderRadius: 2,
                border: '1px solid',
                borderColor: 'divider',
                backgroundColor: 'background.default'
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <SensorsIcon color="primary" sx={{ fontSize: 20 }} />
                <Typography variant="subtitle2">
                  Device {index + 1}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="caption" color="text.secondary">
                  {topic}
                </Typography>
                <Typography variant="caption" color="primary">
                  {deviceStatuses[topic]?.toFixed(0) || 0}%
                </Typography>
              </Box>
              <LinearProgress 
                variant="determinate" 
                value={deviceStatuses[topic] || 0}
                sx={{ 
                  height: 4, 
                  borderRadius: 2,
                  backgroundColor: 'rgba(0, 0, 0, 0.05)',
                }}
              />
            </Box>
          ))}
        </DeviceStatusGrid>
      </ConnectionCard>
    </LoadingContainer>
  );
};

// Move WelcomeOverlay component definition before it's used
const WelcomeOverlay = ({ connectionProgress }: { connectionProgress: number }) => (
  <Fade in={true} timeout={1000} unmountOnExit>
    <Box sx={{ 
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'rgba(255, 255, 255, 0.95)',
      backdropFilter: 'blur(4px)',
      zIndex: 2,
      gap: 3
    }}>
      <Box sx={{ 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center',
        gap: 2 
      }}>
        <Box sx={{ 
          position: 'relative',
          width: 80,
          height: 80,
          mb: 2
        }}>
          <CircularProgress
            size={80}
            thickness={2}
            sx={{
              position: 'absolute',
              color: 'primary.light'
            }}
          />
          <Box sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)'
          }}>
            <SensorsIcon color="primary" sx={{ fontSize: 40 }} />
          </Box>
        </Box>

        <Typography variant="h4" color="primary" sx={{ 
          fontWeight: 500,
          textAlign: 'center',
          mb: 1
        }}>
          Device Monitor
        </Typography>
        
        <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
          Initializing IoT Dashboard
        </Typography>
      </Box>
      
      <Box sx={{ 
        width: '300px', 
        textAlign: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        p: 3,
        borderRadius: 2,
        boxShadow: 1
      }}>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          Connecting to MQTT broker...
        </Typography>
        
        <LinearProgress 
          variant="determinate" 
          value={connectionProgress} 
          sx={{ 
            height: 6, 
            borderRadius: 3,
            mb: 1,
            mt: 2,
            backgroundColor: 'rgba(0, 0, 0, 0.05)',
            '& .MuiLinearProgress-bar': {
              borderRadius: 3,
              backgroundImage: 'linear-gradient(45deg, #4CAF50 30%, #81C784 90%)',
            }
          }} 
        />

        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between',
          mt: 1
        }}>
          <Typography variant="caption" color="text.secondary">
            {connectionProgress}%
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {connectionProgress < 100 ? 'Establishing connection...' : 'Ready!'}
          </Typography>
        </Box>
      </Box>

      <Box sx={{ 
        display: 'flex', 
        gap: 2, 
        mt: 2,
        flexWrap: 'wrap',
        justifyContent: 'center'
      }}>
        {DEVICE_TOPICS.map((topic, index) => (
          <Chip
            key={topic}
            label={`Device ${index + 1}`}
            color="primary"
            variant="outlined"
            size="small"
            sx={{ 
              opacity: connectionProgress > (index + 1) * 25 ? 1 : 0.5,
              transition: 'opacity 0.3s ease-in-out'
            }}
          />
        ))}
      </Box>
    </Box>
  </Fade>
);

// Initial loading component using WelcomeOverlay
const InitialLoadingState = () => (
  <Box sx={{ 
    width: '100%', 
    height: '100vh', 
    display: 'flex', 
    alignItems: 'center', 
    justifyContent: 'center',
    backgroundColor: '#f5f5f5'
  }}>
    <WelcomeOverlay connectionProgress={0} />
  </Box>
);

// Main component wrapper
const DeviceTableWrapper = () => (
  <Suspense fallback={<InitialLoadingState />}>
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
    // First check global status
    if (connectionStatus === 'error') return 'disconnected';
    if (isPaused) return 'paused';
    
    // Then check device status
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

  // Get overall connection status
  const getConnectionStatus = useCallback(() => {
    if (isPaused) return 'paused';
    return connectionStatus;
  }, [connectionStatus, isPaused]);

  // Get connection status chip color
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

  // Define base columns
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

  // Debug the devices data
  useEffect(() => {
    console.log('Current devices:', devices);
  }, [devices]);

  const handlePlayPause = () => {
    togglePause(!isPaused);
  };

  const LiveIndicator = () => (
    <Box sx={{ 
      display: 'flex', 
      alignItems: 'center', 
      gap: 1,
      animation: `${pulseAnimation} 2s infinite`
    }}>
      <Box sx={{ 
        width: 8,
        height: 8,
        borderRadius: '50%',
        backgroundColor: 'success.main'
      }} />
      <Typography variant="caption" color="success.main" sx={{ fontWeight: 'bold' }}>
        Live Data
      </Typography>
    </Box>
  );

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