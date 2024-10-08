import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Line } from 'react-chartjs-2';
import 'chart.js/auto';
import 'chartjs-adapter-date-fns';
import { Select, Button } from 'antd';

const SolarDataChart = () => {
    const [data, setData] = useState({ labels: [], datasets: [] });
    const [selectedData, setSelectedData] = useState('daily');
    const [pesId, setPesId] = useState(null);
    const [pesOptions, setPesOptions] = useState([
        { label: 'PES ID 0', value: 0 },
        { label: 'PES ID 10', value: 10 },
        { label: 'PES ID 11', value: 11 },
        { label: 'PES ID 12', value: 12 },
        { label: 'PES ID 13', value: 13 },
        { label: 'PES ID 14', value: 14 },
        { label: 'PES ID 15', value: 15 },
        { label: 'PES ID 16', value: 16 },
        { label: 'PES ID 17', value: 17 },
        { label: 'PES ID 18', value: 18 },
        { label: 'PES ID 19', value: 19 },
        { label: 'PES ID 20', value: 20 },
        { label: 'PES ID 21', value: 21 },
        { label: 'PES ID 22', value: 22 },
        { label: 'PES ID 23', value: 23 }
    ]);
    const [recordLimit, setRecordLimit] = useState(14);
    const [todayData, setTodayData] = useState({});
    const wsRef = useRef(null);

    useEffect(() => {
        if (pesId !== null && selectedData !== 'today') {
            fetchData(selectedData);
        } else if (pesId !== null && selectedData === 'today') {
            connectWebSocket();
        }
    }, [pesId, selectedData, recordLimit]);

    useEffect(() => {
        return () => {
            if (wsRef.current) wsRef.current.close();
        };
    }, []);

    const fetchData = (period) => {
        const url = `http://localhost:8000/${period}/${pesId}?limit=${recordLimit}`;
        axios.get(url)
            .then(response => {
                const periods = response.data ? Object.keys(response.data).sort() : [];
                const values = periods.map(period => response.data[period]).slice(-recordLimit);
                const labels = periods.map(periodKey => periodKeyFormatting(period, periodKey)).slice(-recordLimit);
                setData({
                    labels,
                    datasets: [{
                        label: `${period.charAt(0).toUpperCase() + period.slice(1)} Average Generation (MW)`,
                        data: values,
                        borderColor: '#8BC34A',
                        backgroundColor: 'rgba(139, 195, 74, 0.5)',
                        tension: 0.1,
                        fill: true,
                        pointRadius: 3,
                        borderWidth: 1.5
                    }]
                });
            })
            .catch(error => console.error(`Error fetching ${period} data:`, error));
    };

    const connectWebSocket = () => {
        if (wsRef.current) wsRef.current.close();
        const ws = new WebSocket('ws://localhost:8000/sockets');

        ws.onopen = () => {
            console.log('WebSocket connection opened');
        };

        ws.onmessage = (event) => {
            console.log('WebSocket message received:', event.data);
            const updatedData = JSON.parse(event.data);
            const messageDate = new Date(updatedData.datetimeGMT).toLocaleDateString();
            const todayDate = new Date().toLocaleDateString();

            if (messageDate === todayDate) {
                setTodayData(prevData => {
                    const newData = { ...prevData };
                    if (!newData[updatedData.pesId]) {
                        newData[updatedData.pesId] = [];
                    }
                    // Verifică dacă înregistrarea există deja
                    const exists = newData[updatedData.pesId].some(item => item.datetimeGMT === updatedData.datetimeGMT);
                    if (!exists) {
                        newData[updatedData.pesId] = [...newData[updatedData.pesId], updatedData];
                        newData[updatedData.pesId].sort((a, b) => new Date(a.datetimeGMT) - new Date(b.datetimeGMT));
                    }
                    return newData;
                });
            }
        };

        ws.onerror = (error) => {
            console.error('WebSocket error:', error);
        };

        ws.onclose = (event) => {
            console.log('WebSocket connection closed', event);
            setTimeout(() => connectWebSocket(), 5000);
        };

        wsRef.current = ws;
    };

    const periodKeyFormatting = (period, periodKey) => {
        if (period === 'weekly') {
            const [startDate, endDate] = periodKey.split(' to ');
            return `${new Date(startDate).toLocaleDateString()} - ${new Date(endDate).toLocaleDateString()}`;
        } else if (period === 'monthly') {
            return new Date(periodKey + '-01').toLocaleString('default', { month: 'long', year: 'numeric' });
        } else {
            return new Date(periodKey).toLocaleDateString();
        }
    };

    const handleSelectPeriod = (period) => {
        setSelectedData(period);
        setRecordLimit(14);
    };

    const todayChartData = {
        labels: (todayData[pesId] || []).map(item => new Date(item.datetimeGMT).toLocaleTimeString()),
        datasets: [{
            label: 'Generation (MW) Today',
            data: (todayData[pesId] || []).map(item => item.generationMW),
            borderColor: '#8BC34A',
            backgroundColor: 'rgba(139, 195, 74, 0.5)',
            tension: 0.1,
            fill: true,
            pointRadius: 3,
            borderWidth: 1.5
        }]
    };

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
            x: {
                type: 'category',
                ticks: {
                    autoSkip: true,
                    maxTicksLimit: 48 // approximately every 30 minutes if data points are every 5 minutes
                }
            },
            y: {
                beginAtZero: true,
                ticks: {
                    stepSize: 100,
                    callback: function (value) {
                        return value.toFixed(2) + ' MW';
                    }
                }
            }
        },
        plugins: {
            tooltip: {
                mode: 'index',
                intersect: false,
                callbacks: {
                    label: function (tooltipItem) {
                        return `${tooltipItem.dataset.label}: ${tooltipItem.parsed.y.toFixed(2)} MW`;
                    }
                }
            },
            hover: {
                mode: 'nearest',
                intersect: false
            }
        }
    };

    return (
        <div style={{ height: '400px', width: '100%' }}>
            <Select
                style={{ width: 200 }}
                options={pesOptions}
                value={pesId}
                onChange={setPesId}
                placeholder="Select PES ID"
            />
            <div>
                <button onClick={() => handleSelectPeriod('daily')}>Daily</button>
                <button onClick={() => handleSelectPeriod('monthly')}>Monthly</button>
                <button onClick={() => handleSelectPeriod('today')}>Today</button>
                <Button onClick={() => setRecordLimit(recordLimit + 14)}>Show More</Button>
                <Button onClick={() => setRecordLimit(14)}>Reset</Button>
            </div>
            <h2>{`${selectedData.charAt(0).toUpperCase() + selectedData.slice(1)} Solar Generation Averages`}</h2>
            <Line data={selectedData === 'today' ? todayChartData : data} options={options} />
        </div>
    );
};

export default SolarDataChart;
