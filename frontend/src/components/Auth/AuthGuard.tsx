import React, { useEffect, useState } from 'react';
import { API_CONFIG } from '../../services/config';

interface AuthGuardProps {
    /** true  → ruta protegida: redirige al login si no hay sesión   *
     *  false → ruta pública: redirige al dashboard si ya hay sesión */
    requireAuth: boolean;
    children: React.ReactNode;
}

async function verifyToken(token: string): Promise<boolean> {
    try {
        const res = await fetch(`${API_CONFIG.BASE_URL}/auth/me`, {
            method: 'GET',
            headers: { Authorization: `Bearer ${token}` },
        });
        return res.ok;
    } catch {
        return false;
    }
}

export default function AuthGuard({ requireAuth, children }: AuthGuardProps) {
    // 'checking' mientras verifica, 'ok' cuando puede mostrar el contenido
    const [status, setStatus] = useState<'checking' | 'ok'>('checking');

    useEffect(() => {
        const token = localStorage.getItem('auth_token');

        if (!token) {
            // Sin token
            if (requireAuth) {
                // Ruta protegida → mandar al login
                window.location.replace('/');
            } else {
                // Ruta pública → mostrar normalmente
                setStatus('ok');
            }
            return;
        }

        // Hay token → verificar con el backend
        verifyToken(token).then((valid) => {
            if (valid) {
                if (!requireAuth) {
                    // Ya autenticado en página de login → ir al dashboard
                    window.location.replace('/auth/dashboard');
                } else {
                    // Autenticado en ruta protegida → mostrar contenido
                    setStatus('ok');
                }
            } else {
                // Token inválido o expirado → limpiar y redirigir
                localStorage.removeItem('auth_token');
                localStorage.removeItem('current_user');
                if (requireAuth) {
                    window.location.replace('/');
                } else {
                    setStatus('ok');
                }
            }
        });
    }, [requireAuth]);

    // Pantalla de carga mientras verifica
    if (status === 'checking') {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                    <p className="text-gray-500 text-sm">Verificando sesión...</p>
                </div>
            </div>
        );
    }

    return <>{children}</>;
}
