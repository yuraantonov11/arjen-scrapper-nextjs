import {useEffect, useState} from 'react';
import LinearProgress from '@mui/joy/LinearProgress';
import Typography from '@mui/joy/Typography';
import Button from '@mui/joy/Button';

const ScriptRunner = () => {
    const [progress, setProgress] = useState(0);
    const [isRunning, setIsRunning] = useState(false);

    useEffect(() => {
        const fetchProgress = async () => {
            try {
                const response = await fetch('/api/scrapper');
                const {progress, isRunning} = await response.json();
                setProgress(progress);
                setIsRunning(isRunning);
            } catch (error) {
                console.error('Error fetching progress:', error);
                // Handle errors gracefully, e.g., display an error message or retry
            }
        };

        const interval = setInterval(fetchProgress, 1000);

        return () => clearInterval(interval);
    }, []);

    const handleStart = async () => {
        if (!isRunning) {
            try {
                const response = await fetch(
                    '/api/scrapper',
                    {
                        method: 'POST',
                        body: JSON.stringify({ action: 'start' })
                    },
                );
                if (response.ok) {
                    setIsRunning(true);
                } else {
                    console.error('Error starting script:', await response.text());
                    // Handle errors gracefully, e.g., display an error message
                }
            } catch (error) {
                console.error('Error starting script:', error);
                // Handle errors gracefully, e.g., display an error message
            }
        }
    };

    const handleStop = async () => {
        if (isRunning) {
            try {
                const response = await fetch(
                    '/api/scrapper',
                    {
                        method: 'POST',
                        body: JSON.stringify({ action: 'stop' })
                    }
                );
                if (response.ok) {
                    setIsRunning(false);
                } else {
                    console.error('Error stopping script:', await response.text());
                    // Handle errors gracefully, e.g., display an error message
                }
            } catch (error) {
                console.error('Error stopping script:', error);
                // Handle errors gracefully, e.g., display an error message
            }
        }
    };
    return (
        <div>
          {!isRunning || <LinearProgress
              determinate
              variant="outlined"
              color="neutral"
              size="sm"
              thickness={32}
              value={progress}
              sx={{
                  '--LinearProgress-radius': '0px',
                  '--LinearProgress-progressThickness': '24px',
                  boxShadow: 'sm',
                  borderColor: 'neutral.500',
              }}
          >
            <Typography
                level="body-xs"
                fontWeight="xl"
                textColor="common.white"
                sx={{ mixBlendMode: 'difference' }}
            >
              LOADING… {`${Math.round(progress)}%`}
            </Typography>
          </LinearProgress>}
            <div>
        <Button
            variant="outlined"
            disabled={isRunning}
            onClick={handleStart}
        >
          {isRunning ? 'Запуск...' : 'Запустити'}
        </Button>
        <Button variant="outlined" disabled={!isRunning} onClick={handleStop}>
          Зупинити
        </Button>
      </div>
    </div>
    );
};

export default ScriptRunner;
