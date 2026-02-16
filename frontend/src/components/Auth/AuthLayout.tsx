import React from 'react';

interface AuthLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle: string;
  imageSrc: string;
}

export default function AuthLayout({ children, title, subtitle, imageSrc }: AuthLayoutProps) {
  return (
    <div className="min-h-screen flex bg-gray-50">
      {/* Lado izquierdo - Imagen */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-50 to-indigo-100 items-center justify-center p-12">
        <div className="max-w-lg">
          <img
            src={imageSrc}
            alt="Ilustración"
            className="w-full h-auto drop-shadow-lg"
          />
        </div>
      </div>

      {/* Lado derecho - Formulario */}
      <div className="w-full lg:w-1/2 flex flex-col items-center justify-center px-6 sm:px-8 py-12">
        <div className="w-full max-w-md">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3">
              {title}
            </h1>
            <p className="text-gray-600 text-sm sm:text-base">
              {subtitle}
            </p>
          </div>

          {/* Formulario */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
            {children}
          </div>

          {/* Footer */}
          <div className="mt-8 text-center text-xs text-gray-500">
            <p>© 2026 SPH System. Todos los derechos reservados.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
