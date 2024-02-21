import {useEffect, useState} from 'react';
import Button from '@mui/material/Button';
import LinearProgress, { LinearProgressProps } from '@mui/material/LinearProgress';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';


function LinearProgressWithLabel(props: LinearProgressProps & { value: number }) {
    return (
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
      <Box sx={{ width: '100%', mr: 1 }}>
        <LinearProgress variant="buffer"  {...props} />
      </Box>
      <Box sx={{ minWidth: 35 }}>
        <Typography variant="body2" color="text.secondary">{`${Math.round(
            props.value,
        )}%`}</Typography>
      </Box>
    </Box>
    );
}

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
          {!isRunning || <LinearProgressWithLabel value={progress} valueBuffer={progress}/>}
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
