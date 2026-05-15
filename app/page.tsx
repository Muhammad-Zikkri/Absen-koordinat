'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Zap, Power, ShieldCheck, UserCheck, Settings, ArrowRight, X, History, Lock, FileSpreadsheet, ScanFace, MapPin, Camera } from 'lucide-react';
import dynamic from 'next/dynamic';
import confetti from 'canvas-confetti';
import * as XLSX from 'xlsx';

const MapComponent = dynamic(() => import('./components/MapComponent'), {
    ssr: false,
    loading: () => <div className="mini-map" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.2)' }}>Initializing Satellite...</div>
});

const OFFICE_COORDS = {
    lat: parseFloat(process.env.NEXT_PUBLIC_OFFICE_LAT || '5.571370'),
    lng: parseFloat(process.env.NEXT_PUBLIC_OFFICE_LNG || '95.356475')
};
const ALLOWED_RADIUS = parseInt(process.env.NEXT_PUBLIC_ALLOWED_RADIUS || '100');

interface AttendanceRecord {
    id: number;
    employeeId: string;
    status: string;
    type: string;
    timestamp: string;
    location: string;
}

export default function AttendancePage() {
    const [step, setStep] = useState('auth');
    const [employeeId, setEmployeeId] = useState('');
    const [attendanceType, setAttendanceType] = useState('HADIR');
    const [currentTime, setCurrentTime] = useState('');
    const [userLocation, setUserLocation] = useState<{ lat: number, lng: number } | null>(null);
    const [isLocationOk, setIsLocationOk] = useState(false);
    const [isCameraOk, setIsCameraOk] = useState(false);
    const [history, setHistory] = useState<AttendanceRecord[]>([]);
    const [adminPassword, setAdminPassword] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('ALL');
    const [receipt, setReceipt] = useState<AttendanceRecord | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const videoRef = useRef<HTMLVideoElement>(null);

    useEffect(() => {
        const timer = setInterval(() => {
            const now = new Date();
            setCurrentTime(now.toLocaleTimeString('id-ID', { hour12: false }));
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    useEffect(() => {
        const saved = localStorage.getItem('absensi_history');
        if (saved) setHistory(JSON.parse(saved));
    }, []);

    const initCamera = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
            if (videoRef.current) videoRef.current.srcObject = stream;
            setIsCameraOk(true);
        } catch (err) {
            setIsCameraOk(false);
        }
    };

    const checkLocation = () => {
        if (!navigator.geolocation) return;
        navigator.geolocation.getCurrentPosition((pos) => {
            const { latitude, longitude } = pos.coords;
            setUserLocation({ lat: latitude, lng: longitude });
            const dist = calculateDistance(latitude, longitude, OFFICE_COORDS.lat, OFFICE_COORDS.lng);
            setIsLocationOk(dist <= ALLOWED_RADIUS);
        }, () => setIsLocationOk(false), { enableHighAccuracy: true });
    };

    const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
        const R = 6371e3;
        const φ1 = lat1 * Math.PI / 180, φ2 = lat2 * Math.PI / 180;
        const Δφ = (lat2 - lat1) * Math.PI / 180, Δλ = (lon2 - lon1) * Math.PI / 180;
        const a = Math.sin(Δφ / 2) ** 2 + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2;
        return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    };

    const doAbsent = async (type: string) => {
        if (isSubmitting) return;
        setIsSubmitting(true);
        try {
            const res = await fetch('/api/attendance', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ employeeId, lat: userLocation?.lat, lng: userLocation?.lng, type, status: attendanceType })
            });
            const result = await res.json();
            if (!res.ok) throw new Error(result.error);

            const entry: AttendanceRecord = {
                id: Date.now(),
                employeeId,
                status: attendanceType,
                type,
                timestamp: new Date().toLocaleString('id-ID'),
                location: userLocation ? `${userLocation.lat.toFixed(4)}, ${userLocation.lng.toFixed(4)}` : 'Remote'
            };
            const newHistory = [entry, ...history];
            setHistory(newHistory);
            localStorage.setItem('absensi_history', JSON.stringify(newHistory));
            setReceipt(entry);
            setStep('success');
            confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 } });
        } catch (err: any) {
            alert(`SECURITY ALERT: ${err.message}`);
        } finally {
            setIsSubmitting(false);
        }
    };

    const exportToExcel = () => {
        const data = history.map(h => ({
            'Waktu': h.timestamp,
            'ID Karyawan': h.employeeId,
            'Status': h.status,
            'Tipe': h.type,
            'Lokasi': h.location
        }));
        const ws = XLSX.utils.json_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Rekap Absensi");
        XLSX.writeFile(wb, `Rekap_Absensi_${new Date().toLocaleDateString()}.xlsx`);
    };

    const handleAdminLogin = async () => {
        try {
            const res = await fetch('/api/admin-login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ password: adminPassword })
            });
            if (res.ok) setStep('history');
            else alert('Access Denied');
        } catch (err) {
            alert('Server Error');
        }
    };

    const isAdminOk = attendanceType === 'HADIR' ? (isLocationOk && isCameraOk) : isCameraOk;

    return (
        <div className="app-container">
            <div className="aura-1"></div>
            <div className="aura-2"></div>
            <div className="aura-3"></div>
            <div className="step-progress">
                <div className={`step-dot ${step === 'auth' ? 'active' : 'completed'}`}></div>
                <div className={`step-dot ${step === 'verify' ? 'active' : step === 'success' ? 'completed' : ''}`}></div>
                <div className={`step-dot ${step === 'success' ? 'active' : ''}`}></div>
            </div>

            <header>
                <div className="logo"><div className="logo-icon">PA</div><h1>PT Putra Andespal</h1></div>
                <div className="time-display">{currentTime}</div>
            </header>

            <div className="main-frame">
                <main>
                    {step === 'auth' && (
                        <section className="card active">
                            <div className="card-header"><UserCheck /><h2>Identitas</h2></div>
                            <p style={{ color: '#64748b', fontSize: 13, marginTop: -15 }}>Masukkan kode akses resmi anda.</p>
                            <div className="input-group">
                                <label>Employee ID</label>
                                <input value={employeeId} onChange={(e) => setEmployeeId(e.target.value)} placeholder="PA-XXXX-XXX" />
                            </div>
                            <div className="hyper-actions">
                                <button onClick={() => employeeId ? (setStep('verify'), initCamera(), checkLocation()) : alert('Required')} className="btn-primary" style={{ flex: 2 }}>Authorize <ArrowRight size={18} /></button>
                                <button onClick={() => setStep('adminLogin')} className="btn-secondary" style={{ flex: 1 }}><Settings size={18} /></button>
                            </div>
                        </section>
                    )}

                    {step === 'verify' && (
                        <section className="card active">
                            <div className="card-header"><ShieldCheck /><h2>Verification</h2></div>
                            <div className="status-grid">
                                <div className={`status-item ${isLocationOk ? 'ok' : 'error'}`}><MapPin size={18} /><div className="status-info"><span>GPS</span><small>{isLocationOk ? 'SECURED' : 'LOCKED'}</small></div></div>
                                <div className={`status-item ${isCameraOk ? 'ok' : 'error'}`}><Camera size={18} /><div className="status-info"><span>BIO</span><small>{isCameraOk ? 'ACTIVE' : 'OFF'}</small></div></div>
                            </div>
                            <div className="input-group">
                                <label>Mode</label>
                                <select value={attendanceType} onChange={(e) => setAttendanceType(e.target.value)}>
                                    <option value="HADIR">Hadir (Kantor)</option>
                                    <option value="IZIN">Izin</option>
                                    <option value="SAKIT">Sakit</option>
                                </select>
                            </div>
                            <div className="verification-area">
                                <div className="camera-container">
                                    <video ref={videoRef} autoPlay playsInline id="webcam"></video>
                                    <div className="scanner-frame"><div className="scanner-ring"></div><div className="scanner-line"></div></div>
                                    <div className="camera-label"><ScanFace size={14} /><span>ENCRYPTED STREAM</span></div>
                                </div>
                                <MapComponent userLocation={userLocation} officeLocation={OFFICE_COORDS} radius={ALLOWED_RADIUS} />
                            </div>
                            <div className="action-grid">
                                <div onClick={() => isAdminOk && doAbsent('IN')} className={`action-card in ${!isAdminOk || isSubmitting ? 'disabled' : ''}`}>
                                    <div className="action-icon"><Zap size={28} /></div>
                                    <div className="action-text"><h3>{isSubmitting ? 'VERIFYING...' : 'CLOCK IN'}</h3></div>
                                </div>
                                <div onClick={() => isAdminOk && attendanceType === 'HADIR' && doAbsent('OUT')} className={`action-card out ${(!isAdminOk || attendanceType !== 'HADIR' || isSubmitting) ? 'disabled' : ''}`}>
                                    <div className="action-icon"><Power size={28} /></div>
                                    <div className="action-text"><h3>{isSubmitting ? 'VERIFYING...' : 'CLOCK OUT'}</h3></div>
                                </div>
                            </div>
                        </section>
                    )}

                    {step === 'adminLogin' && (
                        <section className="card active">
                            <div className="card-header"><Lock /><h2>Root Access</h2></div>
                            <div className="input-group">
                                <label>System Key</label>
                                <input type="password" value={adminPassword} onChange={(e) => setAdminPassword(e.target.value)} placeholder="••••••••" />
                            </div>
                            <div className="hyper-actions">
                                <button onClick={handleAdminLogin} className="btn-primary" style={{ flex: 1 }}>Verify</button>
                                <button onClick={() => setStep('auth')} className="btn-secondary" style={{ flex: 1 }}>Abort</button>
                            </div>
                        </section>
                    )}

                    {step === 'history' && (
                        <section className="card active">
                            <div className="card-header"><History /><h2>Log Database</h2><button onClick={() => setStep('auth')} className="btn-icon"><X size={18} /></button></div>
                            <div className="filters">
                                <input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Filter ID..." />
                                <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                                    <option value="ALL">All States</option><option value="HADIR">Office</option><option value="IZIN">Permit</option><option value="SAKIT">Medical</option>
                                </select>
                            </div>
                            <div className="history-list">
                                {history.filter(h => (statusFilter === 'ALL' || h.status === statusFilter) && h.employeeId.includes(searchQuery)).map(h => (
                                    <div key={h.id} className="history-item">
                                        <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ fontWeight: 700 }}>{h.timestamp}</span><span className={`history-tag tag-${h.status.toLowerCase()}`}>{h.status}</span></div>
                                        <div style={{ fontSize: 12, opacity: 0.7 }}>UID: {h.employeeId} • {h.location}</div>
                                    </div>
                                ))}
                            </div>
                            <div className="hyper-actions" style={{ marginTop: 'auto' }}>
                                <button onClick={exportToExcel} className="btn-primary" style={{ flex: 1 }}><FileSpreadsheet size={18} /> Export</button>
                                <button onClick={() => { localStorage.clear(); setHistory([]); }} className="btn-secondary" style={{ flex: 1 }}>Wipe</button>
                            </div>
                        </section>
                    )}

                    {step === 'success' && receipt && (
                        <section className="card active">
                            <div className="success-icon"><ShieldCheck size={48} color="white" /></div>
                            <h2 style={{ textAlign: 'center' }}>Verified</h2>
                            <p style={{ textAlign: 'center', opacity: 0.6, fontSize: 14 }}>Encrypted data transmitted.</p>
                            <div className="receipt">
                                <div className="receipt-row"><span>ID</span><span>{receipt.employeeId}</span></div>
                                <div className="receipt-row"><span>TIME</span><span>{receipt.timestamp}</span></div>
                            </div>
                            <button onClick={() => window.location.reload()} className="btn-primary" style={{ width: '100%', marginTop: 20 }}>Terminate</button>
                        </section>
                    )}
                </main>
            </div>
            <footer><p>&copy; 2024 PT Putra Andespal • Secure Attendance System</p></footer>
        </div>
    );
}
