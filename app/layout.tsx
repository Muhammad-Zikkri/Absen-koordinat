import type { Metadata } from 'next'
import React, { ReactNode } from 'react'
import './globals.css'

export const metadata: Metadata = {
  title: 'Absen Koordinat - PT Putra Andespal',
  description: 'Sistem absensi berbasis koordinat GPS dan verifikasi wajah untuk karyawan PT Putra Andespal.',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
  },
}

export default function RootLayout({
  children,
}: {
  children: ReactNode
}) {
  return (
    <html lang="id">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0"/>
      </head>
      <body>{children}</body>
    </html>
  )
}
