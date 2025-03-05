import { useEffect, useState } from 'react';
import { Box, Typography, LinearProgress, keyframes } from '@mui/material';
import { styled } from '@mui/material/styles';
import DevicesIcon from '@mui/icons-material/Devices';
import SignalCellularAltIcon from '@mui/icons-material/SignalCellularAlt';
import SensorsIcon from '@mui/icons-material/Sensors';
import { DEVICE_TOPICS } from '../types';

// Keyframes
const pulseAnimation = keyframes`
  0% { opacity: 1; }
  50% { opacity: 0.7; }
  100% { opacity: 1; }
`;

// Styled Components
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

interface LoadingScreenProps {
  connectionProgress: number;
}

export const LoadingScreen: React.FC<LoadingScreenProps> = ({ connectionProgress }) => {
  const [deviceStatuses, setDeviceStatuses] = useState<Record<string, number>>({});

  useEffect(() => {
    DEVICE_TOPICS.forEach((topic, index) => {
      const delay = index * 500;
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